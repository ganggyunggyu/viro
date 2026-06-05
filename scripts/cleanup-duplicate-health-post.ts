import * as dotenv from 'dotenv';
import mongoose, { Schema } from 'mongoose';
import type { Frame, Page } from 'playwright';
import { Account } from '../src/shared/models/account';
import { PublishedArticle } from '../src/shared/models/published-article';
import { addCommentToArticle } from '../src/shared/models/published-article';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  isAccountLoggedIn,
  loginAccount,
  releaseAccountLock,
} from '../src/shared/lib/multi-session';
import {
  writeCommentWithAccount,
  writeReplyWithAccount,
} from '../src/features/auto-comment/comment-writer';

dotenv.config({ path: '.env.local' });
dotenv.config();

const CAFE_ID = '25636798';
const KEEP_ARTICLE_ID = 31875;
const DB_SOURCE_ARTICLE_ID = 31876;
const WRITER_ACCOUNT_ID = 'fail5644';
const DELETE_ARTICLE_IDS = [31874];

const replacementComments = [
  {
    accountId: 'orangeswan630',
    type: 'comment' as const,
    content: '저희 집도 환절기마다 콧물 달고 살아서 이것저것 알아봤어요. 저는 영양제보다 일단 밥이랑 수면부터 다시 잡아보는 쪽으로 보고 있어요.',
  },
  {
    accountId: 'eghfsa5478',
    type: 'comment' as const,
    content: '아이들 면역력 쪽은 진짜 정답이 없더라고요. 저는 성분표에서 당류랑 향료부터 보게 돼요. 잘 먹는 것도 중요하지만 너무 단 건 또 마음에 걸려서요.',
  },
  {
    accountId: 'q9v3m7a2',
    type: 'comment' as const,
    content: '저도 어린이집 다니고 나서 감기가 계속 와서 고민했어요. 손 씻기, 물 자주 마시기, 일찍 재우기만 해도 차이가 조금 있긴 했습니다.',
  },
  {
    accountId: 'laghunter8',
    type: 'comment' as const,
    content: '저는 어른용 건강식품 찾다가 흑염소진액 쪽도 봤는데 아이한테 바로 적용할 건 아니더라고요. 어린이용이면 연령 표시랑 섭취량을 꼭 봐야 할 것 같아요.',
  },
  {
    accountId: 'fail5644',
    type: 'reply' as const,
    parentIndex: 0,
    content: '맞아요. 저도 결국 생활습관부터 다시 봐야 하나 싶더라고요. 어린이집 가면 제가 다 챙길 수가 없어서 더 고민돼요.',
  },
  {
    accountId: 'orangeswan630',
    type: 'reply' as const,
    parentIndex: 0,
    content: '그 부분이 제일 어렵죠. 집에서라도 씻고 바로 옷 갈아입히는 것부터 해봤는데 저는 그나마 덜 불안했어요.',
  },
  {
    accountId: 'fail5644',
    type: 'reply' as const,
    parentIndex: 1,
    content: '당류는 저도 놓치고 있었네요. 젤리류만 봤는데 잘 먹는다고 무조건 고르면 안 되겠어요.',
  },
  {
    accountId: 'eghfsa5478',
    type: 'reply' as const,
    parentIndex: 1,
    content: '네, 맛 때문에 먹이기 쉬운 건 장점인데 매일 먹는 거라 표시를 보게 되더라고요. 소포장 먼저 사보는 것도 괜찮았어요.',
  },
  {
    accountId: 'fail5644',
    type: 'reply' as const,
    parentIndex: 2,
    content: '수면이 진짜 문제예요. 낮잠 줄어든 뒤로 저녁에 오히려 더 예민해져서 일찍 재우기가 쉽지 않네요.',
  },
  {
    accountId: 'q9v3m7a2',
    type: 'reply' as const,
    parentIndex: 2,
    content: '그 시기 지나가면 조금 낫긴 했어요. 저희는 자기 전 화면 보는 시간 줄인 게 제일 체감됐습니다.',
  },
  {
    accountId: 'fail5644',
    type: 'reply' as const,
    parentIndex: 3,
    content: '어린이용 표시랑 섭취량은 꼭 봐야겠네요. 어른 제품은 생각 안 하고 있었는데 괜히 헷갈릴 뻔했어요.',
  },
];

type LooseArticle = {
  cafeId: string;
  articleId: number;
  title?: string;
  keyword?: string;
  comments?: Array<{
    accountId?: string;
    content?: string;
  }>;
};

const LoosePublishedArticle =
  mongoose.models.LoosePublishedArticle ||
  mongoose.model(
    'LoosePublishedArticle',
    new Schema({}, { strict: false, collection: 'publishedarticles' })
  ) as mongoose.Model<LooseArticle>;

const toNaverAccount = (account: {
  accountId: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  activityHours?: unknown;
  restDays?: unknown;
  dailyPostLimit?: number;
  personaId?: string;
  role?: string;
}): NaverAccount => ({
  id: account.accountId,
  password: account.password,
  nickname: account.nickname,
  isMain: account.isMain,
  activityHours: account.activityHours as NaverAccount['activityHours'],
  restDays: account.restDays as NaverAccount['restDays'],
  dailyPostLimit: account.dailyPostLimit,
  personaId: account.personaId,
  role: account.role as NaverAccount['role'],
});

const getCommentRoot = async (page: Page): Promise<Page | Frame> => {
  try {
    await page.waitForSelector('iframe#cafe_main', { timeout: 5000 });
    const frameHandle = await page.$('iframe#cafe_main');
    const frame = await frameHandle?.contentFrame();
    return frame ?? page;
  } catch {
    return page;
  }
};

const getLoggedInPage = async (accountId: string): Promise<Page | null> => {
  const account = await Account.findOne({ accountId, isActive: true }).lean();
  if (!account) {
    console.log(`[CLEANUP] 계정 없음: ${accountId}`);
    return null;
  }

  await acquireAccountLock(accountId);
  const loggedIn = await isAccountLoggedIn(accountId);
  if (!loggedIn) {
    const result = await loginAccount(accountId, account.password, {
      reason: 'cleanup-duplicate-health-post',
    });
    if (!result.success) {
      releaseAccountLock(accountId);
      console.log(`[CLEANUP] 로그인 실패: ${accountId} ${result.error ?? ''}`);
      return null;
    }
  }

  const page = await getPageForAccount(accountId);
  page.on('dialog', async (dialog) => {
    try {
      await dialog.accept();
    } catch {}
  });
  return page;
};

const releaseLoggedInPage = (accountId: string): void => {
  releaseAccountLock(accountId);
};

const deleteAllMyCommentsOnArticle = async (
  page: Page,
  cafeId: string,
  articleId: number
): Promise<number> => {
  const url = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4500);

  try {
    await page.waitForSelector('.CommentItem', { timeout: 7000 });
  } catch {
    return 0;
  }

  let totalDeleted = 0;
  for (let safety = 0; safety < 80; safety += 1) {
    const mineCount = await page.evaluate(() => document.querySelectorAll('.CommentItem--mine').length);
    if (mineCount === 0) break;

    const item = await page.$('.CommentItem--mine');
    if (!item) break;
    await item.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const optionButton = await item.$('button.comment_tool_button');
    if (!optionButton) break;
    await optionButton.click();
    await page.waitForTimeout(600);

    const clickedDelete = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const deleteButton = buttons.find((button) => (button.textContent || '').trim() === '삭제');
      deleteButton?.click();
      return Boolean(deleteButton);
    });
    if (!clickedDelete) {
      await page.keyboard.press('Escape');
      break;
    }

    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const confirmButton = buttons.find((button) => (button.textContent || '').trim() === '확인');
      confirmButton?.click();
    });
    await page.waitForTimeout(1200);
    totalDeleted += 1;
    console.log(`[CLEANUP] #${articleId} 댓글 삭제 ${totalDeleted}`);
  }

  return totalDeleted;
};

const deleteAllTrackedComments = async (): Promise<number> => {
  const article = await PublishedArticle.findOne({ cafeId: CAFE_ID, articleId: KEEP_ARTICLE_ID }).lean();
  if (!article) throw new Error(`유지 글 없음: ${KEEP_ARTICLE_ID}`);

  const accountIds = Array.from(new Set((article.comments || []).map((comment) => comment.accountId).filter(Boolean)));
  let totalDeleted = 0;

  for (const accountId of accountIds) {
    const page = await getLoggedInPage(accountId);
    if (!page) continue;
    try {
      const deleted = await deleteAllMyCommentsOnArticle(page, CAFE_ID, KEEP_ARTICLE_ID);
      totalDeleted += deleted;
      console.log(`[CLEANUP] ${accountId} 댓글 삭제 완료: ${deleted}`);
    } finally {
      releaseLoggedInPage(accountId);
    }
  }

  await PublishedArticle.updateOne(
    { cafeId: CAFE_ID, articleId: KEEP_ARTICLE_ID },
    { $set: { comments: [], commentCount: 0, replyCount: 0 } }
  );

  return totalDeleted;
};

const tryDeleteArticleByUi = async (
  page: Page,
  cafeId: string,
  articleId: number
): Promise<boolean> => {
  const urls = [
    `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
    `https://m.cafe.naver.com/ArticleRead.nhn?clubid=${cafeId}&articleid=${articleId}&boardtype=L`,
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);

    const deletedOrMissing = await page.evaluate(() => {
      const text = document.body.innerText;
      return /삭제된 게시글|존재하지 않는 게시글|게시글이 없습니다/.test(text);
    });
    if (deletedOrMissing) return true;

    const clickedDirectDelete = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const deleteButton = candidates.find((el) => {
        const label = (el.textContent || '').trim();
        const className = el.getAttribute('class') || '';
        return (label === '삭제' || label === '삭제하기') && !/gnb_del_txt/.test(className);
      });
      deleteButton?.click();
      return Boolean(deleteButton);
    });

    if (!clickedDirectDelete) {
      const clickedMore = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const moreButton = candidates.find((el) => {
        const label = `${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('class') || ''}`;
        return /더보기|옵션|more|ArticleTool|btn_more|menu/.test(label);
      });
      moreButton?.click();
      return Boolean(moreButton);
      });
      if (!clickedMore) continue;

      await page.waitForTimeout(800);
      const clickedDelete = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
        const deleteButton = candidates.find((el) => {
          const label = (el.textContent || '').trim();
          const className = el.getAttribute('class') || '';
          return (label === '삭제' || label === '삭제하기') && !/gnb_del_txt/.test(className);
        });
        deleteButton?.click();
        return Boolean(deleteButton);
      });
      if (!clickedDelete) {
        await page.keyboard.press('Escape');
        continue;
      }
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const confirmButton = candidates.find((el) => {
        const label = (el.textContent || '').trim();
        return label === '확인' || label === '예';
      });
      confirmButton?.click();
    }).catch(() => {});
    await page.waitForTimeout(2500);

    const stillAccessible = await page.goto(
      `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    ).then(async () => {
      await page.waitForTimeout(2500);
      return page.evaluate(() => {
        const text = document.body.innerText;
        return !/삭제된 게시글|존재하지 않는 게시글|게시글이 없습니다/.test(text);
      });
    }).catch(() => false);

    if (!stillAccessible) return true;
  }

  return false;
};

const deleteDuplicateArticles = async (): Promise<number[]> => {
  const page = await getLoggedInPage(WRITER_ACCOUNT_ID);
  if (!page) return [];

  const deleted: number[] = [];
  try {
    for (const articleId of DELETE_ARTICLE_IDS) {
      const article = await PublishedArticle.findOne({ cafeId: CAFE_ID, articleId }).lean();
      if (!article) {
        console.log(`[CLEANUP] DB 글 없음, 화면 삭제만 확인: #${articleId}`);
      } else {
        console.log(`[CLEANUP] 중복 글 삭제 시도: #${articleId} ${article.title}`);
      }

      const success = await tryDeleteArticleByUi(page, CAFE_ID, articleId);
      if (!success) {
        console.log(`[CLEANUP] 글 삭제 실패: #${articleId}`);
        continue;
      }

      await LoosePublishedArticle.updateOne(
        { cafeId: CAFE_ID, articleId },
        { $set: { status: 'deleted', deletedAt: new Date(), comments: [], commentCount: 0, replyCount: 0 } }
      );
      deleted.push(articleId);
      console.log(`[CLEANUP] 글 삭제 완료: #${articleId}`);
    }
  } finally {
    releaseLoggedInPage(WRITER_ACCOUNT_ID);
  }

  return deleted;
};

const alignDbKeepArticle = async (): Promise<void> => {
  const keepArticle = await LoosePublishedArticle.findOne({ cafeId: CAFE_ID, articleId: KEEP_ARTICLE_ID }).lean<LooseArticle>();
  const sourceArticle = await LoosePublishedArticle.findOne({ cafeId: CAFE_ID, articleId: DB_SOURCE_ARTICLE_ID }).lean<LooseArticle>();
  if (keepArticle && !sourceArticle) return;

  if (keepArticle && sourceArticle) {
    await LoosePublishedArticle.updateOne(
      { cafeId: CAFE_ID, articleId: KEEP_ARTICLE_ID },
      {
        $set: {
          title: sourceArticle.title || '어린이 면역력 영양제 고민중이에요',
          keyword: sourceArticle.keyword || '어린이 면역력 영양제',
          content: sourceArticle.content,
          menuId: sourceArticle.menuId || '20',
          articleUrl: `https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${KEEP_ARTICLE_ID}`,
          writerAccountId: WRITER_ACCOUNT_ID,
          status: 'published',
          migratedFromArticleId: DB_SOURCE_ARTICLE_ID,
          comments: [],
          commentCount: 0,
          replyCount: 0,
          updatedAt: new Date(),
        },
      }
    );
    await LoosePublishedArticle.updateOne(
      { cafeId: CAFE_ID, articleId: DB_SOURCE_ARTICLE_ID },
      { $set: { status: 'deleted', deletedAt: new Date(), comments: [], commentCount: 0, replyCount: 0 } }
    );
    console.log(`[CLEANUP] DB 글 번호 충돌 정리: #${KEEP_ARTICLE_ID} ← #${DB_SOURCE_ARTICLE_ID}`);
    return;
  }

  if (!sourceArticle) return;

  await LoosePublishedArticle.updateOne(
    { cafeId: CAFE_ID, articleId: DB_SOURCE_ARTICLE_ID },
    {
      $set: {
        articleId: KEEP_ARTICLE_ID,
        articleUrl: `https://cafe.naver.com/ca-fe/cafes/${CAFE_ID}/articles/${KEEP_ARTICLE_ID}`,
        migratedFromArticleId: DB_SOURCE_ARTICLE_ID,
        updatedAt: new Date(),
      },
    }
  );
  console.log(`[CLEANUP] DB 글 번호 정렬: #${DB_SOURCE_ARTICLE_ID} → #${KEEP_ARTICLE_ID}`);
};

const rewriteComments = async (): Promise<number> => {
  const writtenMainComments: Array<{
    accountId: string;
    content: string;
    nickname: string;
    commentId?: string;
  }> = [];

  let successCount = 0;
  for (const target of replacementComments) {
    const account = await Account.findOne({ accountId: target.accountId, isActive: true }).lean();
    if (!account) {
      console.log(`[CLEANUP] 댓글 계정 없음: ${target.accountId}`);
      continue;
    }

    const naverAccount = toNaverAccount(account);
    const result = target.type === 'comment'
      ? await writeCommentWithAccount(naverAccount, CAFE_ID, KEEP_ARTICLE_ID, target.content)
      : await writeReplyWithAccount(
        naverAccount,
        CAFE_ID,
        KEEP_ARTICLE_ID,
        target.content,
        target.parentIndex ?? 0,
        {
          parentCommentId: writtenMainComments[target.parentIndex ?? 0]?.commentId,
          parentComment: writtenMainComments[target.parentIndex ?? 0]?.content,
          parentNickname: writtenMainComments[target.parentIndex ?? 0]?.nickname,
        }
      );

    if (!result.success) {
      console.log(`[CLEANUP] 댓글 재작성 실패: ${target.accountId} ${result.error ?? ''}`);
      continue;
    }

    await addCommentToArticle(CAFE_ID, KEEP_ARTICLE_ID, {
      accountId: target.accountId,
      nickname: account.nickname || target.accountId,
      content: target.content,
      type: target.type,
      parentIndex: target.type === 'reply' ? target.parentIndex : undefined,
      commentId: result.commentId,
    });

    if (target.type === 'comment') {
      writtenMainComments.push({
        accountId: target.accountId,
        content: target.content,
        nickname: account.nickname || target.accountId,
        commentId: result.commentId,
      });
    }

    successCount += 1;
    console.log(`[CLEANUP] 댓글 재작성 완료: ${successCount}/${replacementComments.length}`);
  }

  return successCount;
};

const printCurrentState = async (): Promise<void> => {
  const articles = await LoosePublishedArticle.find({
    cafeId: CAFE_ID,
    articleId: { $in: [KEEP_ARTICLE_ID, ...DELETE_ARTICLE_IDS] },
  }).sort({ articleId: -1 }).lean<LooseArticle[]>();

  console.log(JSON.stringify({
    keepArticleId: KEEP_ARTICLE_ID,
    deleteArticleIds: DELETE_ARTICLE_IDS,
    articles: articles.map((article) => ({
      articleId: article.articleId,
      title: article.title,
      keyword: article.keyword,
      commentRecords: article.comments?.length ?? 0,
    })),
  }, null, 2));
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI가 필요합니다.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  await printCurrentState();
  await alignDbKeepArticle();
  const deletedArticleIds = await deleteDuplicateArticles();
  const deletedComments = await deleteAllTrackedComments();
  const writtenComments = await rewriteComments();

  console.log(JSON.stringify({
    deletedArticleIds,
    deletedComments,
    writtenComments,
  }, null, 2));

  await closeAllContexts();
  await mongoose.disconnect();

  if (deletedArticleIds.length !== DELETE_ARTICLE_IDS.length) process.exitCode = 1;
  if (writtenComments !== replacementComments.length) process.exitCode = 1;
  process.exit(process.exitCode ?? 0);
};

main().catch(async (error) => {
  console.error(error);
  await closeAllContexts().catch(() => {});
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
