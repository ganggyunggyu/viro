import { writeFileSync } from 'fs';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { PublishedArticle, addCommentToArticle } from '../src/shared/models/published-article';
import { User } from '../src/shared/models/user';
import { writeCommentWithAccount } from '../src/features/auto-comment/comment-writer';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const CAFE_ID = '25636798';
const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const ACTION_DELAY_MS = Math.max(0, Number(process.env.ACTION_DELAY_MS || 2500));
const OUTPUT_PATH = resolve(
  process.cwd(),
  'outputs/health-zero-comment-2026-06-18-freemapleafreecabj.json'
);

type Target = {
  articleId: number;
  title: string;
  liveCommentCountFromUser: number;
  comment: string;
};

type Result = {
  articleId: number;
  title: string;
  writerAccountId?: string;
  commenterAccountId?: string;
  comment?: string;
  success: boolean;
  skipped?: boolean;
  commentId?: string;
  error?: string;
};

const TARGETS: Target[] = [
  {
    articleId: 32123,
    title: '손끝저림 겪으시는 분 계세요?',
    liveCommentCountFromUser: 0,
    comment: '손끝저림은 원인이 여러 가지라서 생활습관이랑 자세도 같이 봐야겠네요. 저도 참고해볼게요.',
  },
  {
    articleId: 32122,
    title: '호르몬주사 고민이에요',
    liveCommentCountFromUser: 0,
    comment: '호르몬주사는 사람마다 반응 차이가 커서 기록해두는 게 도움 되더라고요. 정리 감사합니다.',
  },
  {
    articleId: 32121,
    title: '프로게스테론 챙기는 방법 정리해봤어요',
    liveCommentCountFromUser: 0,
    comment: '프로게스테론은 복용 시간이나 형태도 헷갈렸는데 이렇게 정리해주시니 보기 편하네요.',
  },
  {
    articleId: 32120,
    title: '여주발효효소 한달 먹어본 후기요',
    liveCommentCountFromUser: 0,
    comment: '한 달 후기라 더 현실적으로 느껴지네요. 맛이나 속 편한지도 같이 비교해봐야겠어요.',
  },
  {
    articleId: 32117,
    title: '수족냉증증상 뭐가 도움됐어요?',
    liveCommentCountFromUser: 0,
    comment: '수족냉증은 계절 상관없이 불편해서 공감돼요. 생활관리 부분도 같이 챙겨봐야겠네요.',
  },
  {
    articleId: 32108,
    title: '남편 임신준비 영양제 후기요',
    liveCommentCountFromUser: 0,
    comment: '건강기능식품은 광고만 보고 고르기 쉬운데 기준을 먼저 보는 게 중요하겠네요.',
  },
  {
    articleId: 32105,
    title: '시험관 이식 후 일상생활 몸 컨디션 관리 기준',
    liveCommentCountFromUser: 0,
    comment: '이식 후에는 작은 일상도 조심스러운데 기준을 정리해주셔서 도움이 되네요.',
  },
  {
    articleId: 32104,
    title: '악성빈혈 증상 원인 그리고 흔한 오해와 진실',
    liveCommentCountFromUser: 0,
    comment: '악성빈혈은 그냥 피곤한 정도로 넘기기 쉬운데 원인까지 같이 봐야겠네요.',
  },
];

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
};

const parseArticleIds = (): Set<number> | null => {
  const raw = (process.env.ARTICLE_IDS || '').trim();
  if (!raw) return null;
  const ids = raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id));
  return new Set(ids);
};

const toNaverAccount = (account: {
  accountId: string;
  password: string;
  nickname?: string;
  role?: string;
}): NaverAccount => ({
  id: account.accountId,
  password: account.password,
  nickname: account.nickname,
  role: account.role === 'commenter' || account.role === 'writer' ? account.role : undefined,
});

const chooseCommenter = (
  writers: Array<{ accountId: string; password: string; nickname?: string; role?: string }>,
  writerAccountId: string | undefined,
  index: number
): { accountId: string; password: string; nickname?: string; role?: string } | null => {
  const candidates = writers.filter(({ accountId }) => accountId !== writerAccountId);
  if (candidates.length === 0) return null;
  return candidates[index % candidates.length];
};

const writeOutput = (results: Result[]): void => {
  const summary = {
    cafeId: CAFE_ID,
    loginId: LOGIN_ID,
    attempted: results.filter((item) => !item.skipped).length,
    succeeded: results.filter((item) => item.success && !item.skipped).length,
    skipped: results.filter((item) => item.skipped).length,
    failed: results.filter((item) => !item.success && !item.skipped).length,
    results,
    updatedAt: new Date().toISOString(),
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
};

const main = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI missing');

  const articleIdFilter = parseArticleIds();
  const targets = articleIdFilter
    ? TARGETS.filter(({ articleId }) => articleIdFilter.has(articleId))
    : TARGETS;

  if (targets.length === 0) {
    throw new Error('no targets after ARTICLE_IDS filter');
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const writers = await Account.find({
    userId: user.userId,
    isActive: true,
    role: 'writer',
  })
    .sort({ createdAt: 1 })
    .lean();

  if (writers.length < 2) {
    throw new Error(`writer accounts are not enough: ${writers.length}`);
  }

  const docs = await PublishedArticle.find(
    {
      cafeId: CAFE_ID,
      articleId: { $in: targets.map(({ articleId }) => articleId) },
    },
    {
      articleId: 1,
      title: 1,
      writerAccountId: 1,
      comments: 1,
      commentCount: 1,
      replyCount: 1,
    }
  ).lean();

  const docsByArticleId = new Map(docs.map((doc) => [doc.articleId, doc]));
  const results: Result[] = [];

  console.log('=== HEALTH ZERO COMMENT RUN ===');
  console.log(`cafeId: ${CAFE_ID}`);
  console.log(`targets: ${targets.map(({ articleId }) => articleId).join(', ')}`);
  console.log(`output: ${OUTPUT_PATH}`);

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    const doc = docsByArticleId.get(target.articleId);
    const writerAccountId = doc?.writerAccountId;
    const commenter = chooseCommenter(writers, writerAccountId, index);
    const title = doc?.title || target.title;

    if (!doc) {
      const result: Result = {
        articleId: target.articleId,
        title,
        success: false,
        error: 'DB article not found',
      };
      results.push(result);
      console.log(`[${target.articleId}] DB article not found`);
      writeOutput(results);
      continue;
    }

    if (!commenter) {
      const result: Result = {
        articleId: target.articleId,
        title,
        writerAccountId,
        success: false,
        error: 'No commenter account available',
      };
      results.push(result);
      console.log(`[${target.articleId}] commenter unavailable`);
      writeOutput(results);
      continue;
    }

    const duplicate = (doc.comments || []).some((comment) => {
      return (
        comment.accountId === commenter.accountId &&
        comment.type === 'comment' &&
        comment.content === target.comment
      );
    });

    if (duplicate) {
      const result: Result = {
        articleId: target.articleId,
        title,
        writerAccountId,
        commenterAccountId: commenter.accountId,
        comment: target.comment,
        success: true,
        skipped: true,
      };
      results.push(result);
      console.log(`[${target.articleId}] skip duplicate DB record`);
      writeOutput(results);
      continue;
    }

    console.log(
      `[${index + 1}/${targets.length}] #${target.articleId} "${title}" writer=${writerAccountId || '-'} commenter=${commenter.accountId}`
    );

    const account = toNaverAccount(commenter);
    const writeResult = await writeCommentWithAccount(
      account,
      CAFE_ID,
      target.articleId,
      target.comment
    );

    if (!writeResult.success) {
      const result: Result = {
        articleId: target.articleId,
        title,
        writerAccountId,
        commenterAccountId: commenter.accountId,
        comment: target.comment,
        success: false,
        error: writeResult.error || 'comment write failed',
      };
      results.push(result);
      console.log(`  ❌ ${writeResult.error || 'comment write failed'}`);
      writeOutput(results);
      if (ACTION_DELAY_MS > 0) await sleep(ACTION_DELAY_MS);
      continue;
    }

    await addCommentToArticle(CAFE_ID, target.articleId, {
      accountId: commenter.accountId,
      nickname: commenter.nickname || commenter.accountId,
      content: target.comment,
      type: 'comment',
      commentId: writeResult.commentId,
      commentIndex: doc.commentCount || 0,
    });

    const result: Result = {
      articleId: target.articleId,
      title,
      writerAccountId,
      commenterAccountId: commenter.accountId,
      comment: target.comment,
      success: true,
      commentId: writeResult.commentId,
    };
    results.push(result);
    console.log(`  ✅ comment registered commentId=${writeResult.commentId || '-'}`);
    writeOutput(results);

    if (ACTION_DELAY_MS > 0) await sleep(ACTION_DELAY_MS);
  }

  const succeeded = results.filter((item) => item.success && !item.skipped).length;
  const failed = results.filter((item) => !item.success && !item.skipped).length;
  const skipped = results.filter((item) => item.skipped).length;
  console.log(`=== DONE: success ${succeeded}, skipped ${skipped}, failed ${failed} ===`);
};

main()
  .then(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('run-health-zero-comment failed:', error);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
