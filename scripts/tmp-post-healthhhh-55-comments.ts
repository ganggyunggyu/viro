import mongoose from 'mongoose';
import { Account, User, addCommentToArticle } from '../src/shared/models';
import { hasCommented } from '../src/shared/models/published-article';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const CAFE_ID = '31746910';
const ARTICLE_ID = 55;
const OWNER_NAME = '가중건다';
const CONTAMINATED = ['h9ag469z', 'dq1h3bjy', 'hagyga', 'nes1p2kx', 'mh8j62wm'];
const MIN_DELAY_MS = 5 * 60_000;
const MAX_DELAY_MS = 10 * 60_000;

const COMMENTS = [
  '부모님생일선물 리스트 방향성 좁아졌네요 좋은정보 잘보고가요!',
  '여름도 완전히 들어서서 기력회복에 좋은 흑염소로 결정하려구요!',
  '부모님생일선물 추천해주셔서 감사합니다.',
  '부모님의 취향을 MBTI로 생각해보진 못했는데 신선하네요~',
  '부모님생일선물 건강식품쪽은 어떤게 좋을지 추천받아볼 수 있을까요?',
];

const normalizeName = (v: string): string => v.replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const randomDelay = (): number => Math.floor(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: '21lab', isActive: true }).select('userId').lean<{ userId: string } | null>();
  if (!user) throw new Error('user not found');

  const accounts = await Account.find({ userId: user.userId, isActive: true, role: 'commenter' })
    .select('accountId password nickname')
    .sort({ createdAt: 1 })
    .lean<Array<{ accountId: string; password: string; nickname?: string }>>();

  const candidates = accounts.filter(
    (a) =>
      normalizeName(a.nickname || a.accountId) !== normalizeName(OWNER_NAME) &&
      !CONTAMINATED.includes(a.accountId),
  );
  if (candidates.length < COMMENTS.length) throw new Error(`commenter pool too small: ${candidates.length}`);

  const picked = candidates.slice(0, COMMENTS.length);

  for (let i = 0; i < COMMENTS.length; i += 1) {
    const account = picked[i];
    const content = COMMENTS[i];

    const already = await hasCommented(CAFE_ID, ARTICLE_ID, account.accountId, 'comment');
    if (already) {
      console.log(`[SKIP] ${account.accountId} 이미 댓글 있음`);
      continue;
    }

    console.log(`[POST ${i + 1}/${COMMENTS.length}] ${account.accountId} (${account.nickname}) -> "${content}"`);
    const result = await writeCommentWithAccount(
      { id: account.accountId, password: account.password, nickname: account.nickname || account.accountId },
      CAFE_ID,
      ARTICLE_ID,
      content,
    );

    if (!result.success) {
      console.error(`[FAIL] ${account.accountId}: ${result.error}`);
    } else {
      await addCommentToArticle(CAFE_ID, ARTICLE_ID, {
        accountId: account.accountId,
        nickname: account.nickname || account.accountId,
        content,
        type: 'comment',
        commentId: result.commentId,
      });
      console.log(`[SUCCESS] ${account.accountId} commentId=${result.commentId}`);
    }

    if (i < COMMENTS.length - 1) {
      const delayMs = randomDelay();
      console.log(`[WAIT] 다음 댓글까지 ${Math.round(delayMs / 60000)}분 대기`);
      await sleep(delayMs);
    }
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('post-healthhhh-55-comments failed:', error);
    process.exit(1);
  });
