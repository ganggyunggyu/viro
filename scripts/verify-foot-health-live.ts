/**
 * 발 건강 원고 발행분 8건을 네이버 화면에서 직접 읽어 검증한다.
 * DB 기록이 아니라 실제 렌더된 글/댓글을 기준으로 판정한다.
 *
 *   npx tsx --env-file=.env --env-file=.env.local scripts/verify-foot-health-live.ts
 */
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import { listLiveComments } from '../src/shared/lib/naver-cafe-writing/comment-deleter';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
/** 한 글당 시도할 읽기 계정 수 상한. 전 계정을 도는 동안 검증이 멈추지 않도록 제한한다. */
const FALLBACK_READER_LIMIT = 6;

const TARGETS = [
  { cafeId: '31746910', slug: 'healthhhh', articleId: 378, cafeName: '가중건다' },
  { cafeId: '31756616', slug: 'purplevhkwm', articleId: 125, cafeName: '웰빙건강하루' },
];

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

  const user = await User.findOne({ loginId: LOGIN_ID }).lean<{ userId: string } | null>();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafes = await Cafe.find({ userId: user.userId, cafeId: { $in: TARGETS.map((t) => t.cafeId) } })
    .select('cafeId ownerAccountId')
    .lean<Array<{ cafeId: string; ownerAccountId?: string }>>();
  const ownerByCafeId = new Map(cafes.map((c) => [c.cafeId, c.ownerAccountId]));

  const accounts = await Account.find({ userId: user.userId, isActive: true })
    .select('accountId password nickname')
    .lean<Array<{ accountId: string; password: string; nickname?: string }>>();
  const accountById = new Map(accounts.map((a) => [a.accountId, a]));

  const rows: Array<{ label: string; title: string; comments: number; error?: string }> = [];

  // 소유 계정이 추가 인증 등으로 로그인이 막히면 읽기 자체가 실패해 "댓글 0개"로 오판된다.
  // 실제 글 상태를 봐야 하므로 다른 계정으로 넘어가며 한 번이라도 읽히면 그 값을 쓴다.
  const buildReaders = (cafeId: string) => {
    const ownerId = ownerByCafeId.get(cafeId);
    const owner = ownerId ? accountById.get(ownerId) : undefined;
    const rest = accounts.filter(({ accountId }) => accountId !== ownerId);
    return [...(owner ? [owner] : []), ...rest].slice(0, FALLBACK_READER_LIMIT);
  };

  for (const target of TARGETS) {
    const label = `${target.slug}/${target.articleId}`;
    const readers = buildReaders(target.cafeId);
    if (readers.length === 0) {
      rows.push({ label, title: '', comments: -1, error: '읽을 계정 없음' });
      continue;
    }

    let row: { label: string; title: string; comments: number; error?: string } = {
      label,
      title: '',
      comments: -1,
      error: '모든 읽기 계정 실패',
    };

    for (const reader of readers) {
      const naverAccount = {
        id: reader.accountId,
        password: reader.password,
        nickname: reader.nickname || reader.accountId,
      };

      // 로그인이 막힌 계정은 listLiveComments가 success=true에 빈 배열을 돌려주기도 한다.
      // 본문이 읽히는지를 먼저 확인해서, 화면을 실제로 본 계정의 값만 신뢰한다.
      const article = await readCafeArticleContent(naverAccount, target.cafeId, target.articleId, {
        reason: `foot_health_verify:${reader.accountId}`,
      });
      if (!article.success || !article.title) {
        row = { label, title: '', comments: -1, error: article.error || '본문 읽기 실패' };
        console.log(`[${label}] 읽기=${reader.accountId} 본문 실패 → 다음 계정`);
        continue;
      }

      const live = await listLiveComments(naverAccount, target.cafeId, target.articleId);
      if (!live.success || !live.comments) {
        row = { label, title: '', comments: -1, error: live.error || '댓글 목록 읽기 실패' };
        continue;
      }

      row = { label, title: article.title.slice(0, 30), comments: live.comments.length };
      console.log(`[${label}] 읽기=${reader.accountId} 제목="${row.title}" 댓글=${row.comments}`);
      break;
    }

    if (row.comments < 0) console.log(`[${label}] 읽기 실패: ${row.error}`);
    rows.push(row);
  }

  console.log('\n===== UI 검증 결과 =====');
  for (const row of rows) {
    console.log(`${row.label.padEnd(22)} 댓글 ${String(row.comments).padStart(2)}개  ${row.title} ${row.error ? `(${row.error})` : ''}`.trimEnd());
  }
  const ok = rows.filter(({ comments }) => comments >= 10).length;
  console.log(`\n댓글 10개 이상 ${ok}/${rows.length}`);

  await closeAllContexts();
  await mongoose.disconnect();
  process.exit(0);
};

main().catch((error) => {
  console.error('FATAL:', error instanceof Error ? error.message : error);
  process.exit(1);
});
