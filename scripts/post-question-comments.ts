/**
 * 질문형 글에 댓글 티키타카 달기.
 * 다른 계정이 의견을 주면 작성자가 짧게 받아치는 구조(prompts/question-cafe-prompt.md).
 *
 *   npx tsx --env-file=.env --env-file=.env.local scripts/post-question-comments.ts \
 *     --threads scripts/jobs/question-comments.json [--dry-run] [--delay-min 30] [--delay-max 180]
 *
 * 댓글 간 딜레이 기본 30초~3분.
 */
import { readFileSync } from 'fs';
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { joinCafeWithNicknameRetry } from '../src/features/auto-comment/batch/cafe-join';
import { getCafeWriterAccounts } from '../src/shared/config/cafe-account-policy';
import { toCafeSlug } from '../src/shared/lib/naver-cafe-membership';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';

interface CommentLine {
  by: 'author' | 'other';
  text: string;
}

interface Thread {
  cafeId: string;
  cafeName: string;
  articleId: number;
  keyword: string;
  authorAccountId?: string;
  comments: CommentLine[];
}

interface Args {
  threadsPath: string;
  dryRun: boolean;
  delayMinSec: number;
  delayMaxSec: number;
  only?: string;
}

const parseArgs = (): Args => {
  const tokens = process.argv.slice(2);
  const args: Args = {
    threadsPath: 'scripts/jobs/question-comments.json',
    dryRun: false,
    delayMinSec: 30,
    delayMaxSec: 180,
  };
  while (tokens.length > 0) {
    const token = tokens.shift();
    if (!token) continue;
    if (token === '--dry-run') { args.dryRun = true; continue; }
    const value = tokens.shift();
    if (!value) throw new Error(`${token} 값이 비었습니다`);
    if (token === '--threads') args.threadsPath = value;
    else if (token === '--delay-min') args.delayMinSec = Math.max(0, Number(value));
    else if (token === '--delay-max') args.delayMaxSec = Math.max(0, Number(value));
    else if (token === '--only') args.only = value;
    else throw new Error(`알 수 없는 옵션: ${token}`);
  }
  return args;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const randomBetween = (min: number, max: number): number =>
  Math.floor(min + Math.random() * Math.max(0, max - min));

const main = async (): Promise<void> => {
  const args = parseArgs();
  const { threads } = JSON.parse(readFileSync(args.threadsPath, 'utf8')) as { threads: Thread[] };
  const targets = args.only ? threads.filter((t) => t.keyword === args.only) : threads;

  if (args.dryRun) {
    for (const thread of targets) {
      console.log(`\n--- ${thread.cafeName} #${thread.articleId} (${thread.keyword}) ---`);
      thread.comments.forEach((c, i) => console.log(`  ${i + 1}. [${c.by === 'author' ? '작성자' : '타계정'}] ${c.text}`));
    }
    const total = targets.reduce((sum, t) => sum + t.comments.length, 0);
    console.log(`\n총 ${targets.length}개 글 / 댓글 ${total}개`);
    process.exit(0);
  }

  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const accountDocs = await Account.find({ userId: user.userId, isActive: true }).lean();
  const allAccounts: NaverAccount[] = accountDocs.map((a) => ({
    id: a.accountId,
    password: a.password,
    nickname: a.nickname,
    isMain: a.isMain,
    role: a.role,
    excludeFromAutoComment: a.excludeFromAutoComment,
  }));
  const accountById = new Map(allAccounts.map((a) => [a.id, a]));

  const cafeDocs = await Cafe.find({
    userId: user.userId,
    cafeId: { $in: targets.map((t) => t.cafeId) },
  }).lean();
  const cafeById = new Map(cafeDocs.map((c) => [c.cafeId, c]));

  let posted = 0;
  let failed = 0;

  for (const thread of targets) {
    const cafe = cafeById.get(thread.cafeId);
    if (!cafe) {
      console.error(`[${thread.cafeName}] 카페 없음 — 건너뜀`);
      failed += thread.comments.length;
      continue;
    }
    const cafeSlug = toCafeSlug(cafe.cafeUrl);

    const author = thread.authorAccountId
      ? accountById.get(thread.authorAccountId)
      : (cafe.ownerAccountId ? accountById.get(cafe.ownerAccountId) : undefined)
        ?? getCafeWriterAccounts(allAccounts, cafe.cafeId, cafeSlug)[0];

    // 작성자를 제외한 계정을 댓글용으로 돌려쓴다.
    const others = allAccounts.filter((a) => a.id !== author?.id && !a.excludeFromAutoComment);
    if (!author || others.length === 0) {
      console.error(`[${thread.cafeName}] 계정 부족 — 건너뜀`);
      failed += thread.comments.length;
      continue;
    }

    console.log(`\n=== ${thread.cafeName} #${thread.articleId} (${thread.keyword}) 댓글 ${thread.comments.length}개 ===`);
    let otherIdx = 0;

    for (const line of thread.comments) {
      const account = line.by === 'author' ? author : others[otherIdx++ % others.length];
      try {
        if (line.by === 'other') {
          const joined = await joinCafeWithNicknameRetry(account, cafe.cafeId, { cafeUrl: cafeSlug });
          if (!joined.success) {
            console.error(`  ${account.id} 가입 실패: ${joined.error} — 건너뜀`);
            failed += 1;
            continue;
          }
        }
        const result = await writeCommentWithAccount(account, cafe.cafeId, thread.articleId, line.text);
        if (result.success) {
          posted += 1;
          console.log(`  [${line.by === 'author' ? '작성자' : account.id}] ${line.text.slice(0, 30)}...`);
        } else {
          failed += 1;
          console.error(`  ${account.id} 댓글 실패: ${result.error}`);
        }
      } catch (error) {
        failed += 1;
        console.error(`  ${account.id} 에러: ${error instanceof Error ? error.message : error}`);
      }
      await sleep(randomBetween(args.delayMinSec, args.delayMaxSec) * 1000);
    }
  }

  console.log(`\n===== 댓글 결과 =====\n성공 ${posted} / 실패 ${failed}`);
  process.exit(0);
};

main().catch((error) => {
  console.error('FATAL:', error instanceof Error ? error.message : error);
  process.exit(1);
});
