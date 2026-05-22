import dotenv from 'dotenv';
import mongoose from 'mongoose';
import type { ElementHandle, Frame, Page } from 'playwright';
import { Account } from '../src/shared/models/account';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  isAccountLoggedIn,
  loginAccount,
  releaseAccountLock,
  saveCookiesForAccount,
} from '../src/shared/lib/multi-session';

dotenv.config({ path: '.env.local' });
dotenv.config();

type Target = {
  cafeId: string;
  articleId: number;
  accountId: string;
  commentId?: string;
  originalContent: string;
  newContent: string;
  reason: string;
};

const MIN_DELAY_MS = Number(process.env.FIX_COMMENT_MIN_DELAY_MS || 45_000);
const MAX_DELAY_MS = Number(process.env.FIX_COMMENT_MAX_DELAY_MS || 90_000);
const START_INDEX = Number(process.env.FIX_COMMENT_START_INDEX || 0);

const TARGETS: Target[] = [
  {
    cafeId: '25460974',
    articleId: 302813,
    accountId: 'h9ag469z',
    commentId: '153531187',
    reason: '주제 밖 문장 정리',
    originalContent: '배고픈 얘기 갑자기 나와서 저도 지금 간식 생각나기 시작했잖아요ㅋㅋ 어쨌든 시세는 프랑 기준 빈티지 전문 셀러 몇 군데 묶어서 보면 평균 잡기 좀 낫더라고요.',
    newContent: '프랑 기준 빈티지 전문 셀러 몇 군데를 같이 보면 평균 잡기 좀 낫더라고요. 사진이랑 상태 표기도 같이 보는 게 좋았어요.',
  },
  {
    cafeId: '25460974',
    articleId: 302815,
    accountId: 'orangeswan630',
    commentId: '153537558',
    reason: '효과 단정 표현 완화',
    originalContent: '저도 비슷하게 챙겨먹고 있어요 임신준비 금연 성공이랑 다른 거랑 조합하는 게 확실히 효과가 다르더라고요 ㅋㅋ',
    newContent: '저도 비슷하게 챙겨먹고 있어요. 임신준비 쪽은 사람마다 조합이 달라서 한 번에 여러 개 시작하긴 좀 조심스럽더라고요.',
  },
  {
    cafeId: '25460974',
    articleId: 302819,
    accountId: 'angrykoala270',
    reason: '효과 단정 표현 완화',
    originalContent: '개인차는 있겠지만 저는 한달정도 지나니 좀 나아진거 같아요. 완전 확 느껴지는건 아니고 서서히 좋아지는 느낌?',
    newContent: '개인차는 있겠지만 저는 한 달 정도 지나니 루틴이 조금 익숙해진 것 같아요. 확 느껴진 건 아니고 서서히 적응되는 정도였어요.',
  },
  {
    cafeId: '25460974',
    articleId: 302820,
    accountId: 'dq1h3bjy',
    reason: '어색한 문장 정리',
    originalContent: '저도 70대 할머니 선물에 다른거 같이 먹는데 완전 공감되네요 각자 장점이 달라서 좋더라고요',
    newContent: '저도 할머니 선물 알아볼 때 같이 먹는 제품이랑 비교를 많이 했어요. 각각 장단점이 달라서 꽤 고민되더라고요.',
  },
  {
    cafeId: '25460974',
    articleId: 302902,
    accountId: 'tinyfish183',
    reason: '의료 효능 단정 표현 완화',
    originalContent: '개인차가 있겠지만 저는 확실히 피로회복쪽에서 차이가 느껴졌어요 홍삼이랑 같이 먹어도 괜찮을거 같네요',
    newContent: '개인차가 있겠지만 저는 아침 루틴으로 챙기기엔 괜찮았어요. 홍삼이랑 같이 챙기는 분들도 있던데 저는 아직 더 봐야겠네요.',
  },
  {
    cafeId: '25729954',
    articleId: 11296910,
    accountId: 'angrykoala270',
    reason: '오타 수정',
    originalContent: '아 그렇군요. 저는 어버지가 쓴 건 잘 못 드시는 편이라 좀 걱정됐는데 괜찮으셨던 건가요?',
    newContent: '아 그렇군요. 저는 아버지가 쓴 건 잘 못 드시는 편이라 좀 걱정됐는데 괜찮으셨던 건가요?',
  },
  {
    cafeId: '25729954',
    articleId: 11297528,
    accountId: 'tinyfish183',
    reason: '문법 수정',
    originalContent: '근데 밥이랑 같이 먹으니까 그냥 넘어가지더라고요, 따로 먹으니까 달다는 느낌이 더 세게 오는 인 듯',
    newContent: '근데 밥이랑 같이 먹으니까 그냥 넘어가지더라고요. 따로 먹으니까 단맛이 더 세게 오는 것 같아요.',
  },
];

const normalize = (value: string): string => {
  return value.replace(/\s+/g, '').replace(/[.,…~ㅋㅎㅠㅜ?]/g, '').trim();
};

const wait = async (milliseconds: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const getDelay = (): number => {
  return Math.floor(MIN_DELAY_MS + Math.random() * Math.max(1, MAX_DELAY_MS - MIN_DELAY_MS));
};

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

const loadMoreComments = async (root: Page | Frame): Promise<void> => {
  for (let index = 0; index < 5; index += 1) {
    try {
      await root.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await root.waitForTimeout(700);
    } catch {}
  }

  const moreButtons = await root.$$('button:has-text("이전"), button:has-text("더보기"), a:has-text("더보기")');
  for (const button of moreButtons) {
    try {
      await button.click({ timeout: 1500 });
      await root.waitForTimeout(900);
    } catch {}
  }
};

const editCommentViaApi = async (page: Page, target: Target): Promise<boolean> => {
  if (!target.commentId) return false;

  const result = await page.evaluate(async (args: { cafeId: string; articleId: number; commentId: string; content: string }) => {
    const urls = [
      `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${args.cafeId}/articles/${args.articleId}/comments/${args.commentId}`,
      `https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/${args.cafeId}/articles/${args.articleId}/comments/${args.commentId}`,
      `https://apis.naver.com/cafe-web/cafe-articleapi/cafes/${args.cafeId}/articles/${args.articleId}/comments/${args.commentId}`,
    ];

    for (const url of urls) {
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: args.content }),
      });
      if (response.ok) return true;
    }

    return false;
  }, {
    cafeId: target.cafeId,
    articleId: target.articleId,
    commentId: target.commentId,
    content: target.newContent,
  });

  return result;
};

const findTargetElement = async (
  root: Page | Frame,
  target: Target
): Promise<ElementHandle<HTMLElement> | null> => {
  const elements = await root.$$('.CommentItem, .comment_item, li.comment, .comment-area li');
  const targetText = normalize(target.originalContent);

  for (const element of elements) {
    const text = await element.evaluate((node) => node.textContent || '');
    const textNorm = normalize(text);
    if (textNorm.includes(targetText.slice(0, 35)) || textNorm.includes(targetText.slice(-35))) {
      return element as ElementHandle<HTMLElement>;
    }
  }

  return null;
};

const editCommentViaDom = async (page: Page, target: Target): Promise<boolean> => {
  const root = await getCommentRoot(page);
  await loadMoreComments(root);

  const element = await findTargetElement(root, target);
  if (!element) {
    return false;
  }

  await element.scrollIntoViewIfNeeded().catch(() => undefined);

  const moreButton =
    (await element.$('.comment_tool_button')) ||
    (await element.$('button[aria-label*="더보기"]')) ||
    (await element.$('button[aria-label*="옵션"]')) ||
    (await element.$('button[class*="more"]')) ||
    (await element.$('button:has-text("...")'));

  if (!moreButton) return false;

  await moreButton.click({ force: true, timeout: 5000 });
  await root.waitForTimeout(900);

  const editButton = await root.$('button:has-text("수정"), a:has-text("수정")');
  if (!editButton) {
    await page.keyboard.press('Escape').catch(() => undefined);
    return false;
  }

  await editButton.click({ force: true, timeout: 5000 });
  await root.waitForTimeout(1500);

  const editable =
    (await page.$('textarea')) ||
    (await page.$('input[type="text"]')) ||
    (await page.$('[contenteditable="true"]'));

  if (!editable) return false;

  const tagName = await editable.evaluate((node) => node.tagName);
  await editable.click();

  if (tagName === 'TEXTAREA' || tagName === 'INPUT') {
    await editable.evaluate((node: HTMLInputElement | HTMLTextAreaElement) => {
      node.value = '';
      node.dispatchEvent(new Event('input', { bubbles: true }));
    });
  } else {
    await editable.evaluate((node: HTMLElement) => {
      node.innerText = '';
      node.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  await editable.type(target.newContent, { delay: 20 });
  await root.waitForTimeout(900);

  const saveButton =
    (await page.$('button:has-text("등록")')) ||
    (await page.$('button:has-text("저장")')) ||
    (await page.$('button:has-text("완료")')) ||
    (await page.$('button:has-text("수정")')) ||
    (await page.$('a:has-text("등록")'));

  if (!saveButton) return false;

  await saveButton.click({ force: true, timeout: 5000 });
  await root.waitForTimeout(3000);

  return true;
};

const updateDb = async (target: Target): Promise<void> => {
  const db = mongoose.connection.db!;
  const byCommentId = target.commentId
    ? await db.collection('publishedarticles').updateOne(
      { cafeId: target.cafeId, articleId: target.articleId, 'comments.commentId': target.commentId },
      { $set: { 'comments.$.content': target.newContent } }
    )
    : { matchedCount: 0, modifiedCount: 0 };

  if (byCommentId.matchedCount > 0) {
    console.log(`  DB 업데이트(commentId): matched=${byCommentId.matchedCount} modified=${byCommentId.modifiedCount}`);
    return;
  }

  const byContent = await db.collection('publishedarticles').updateOne(
    {
      cafeId: target.cafeId,
      articleId: target.articleId,
      'comments.accountId': target.accountId,
      'comments.content': target.originalContent,
    },
    { $set: { 'comments.$.content': target.newContent } }
  );
  console.log(`  DB 업데이트(content): matched=${byContent.matchedCount} modified=${byContent.modifiedCount}`);
};

const ensurePage = async (accountId: string, password: string): Promise<Page> => {
  const loggedIn = await isAccountLoggedIn(accountId);
  if (!loggedIn) {
    const loginResult = await loginAccount(accountId, password);
    if (!loginResult.success) {
      throw new Error(`로그인 실패: ${loginResult.error || accountId}`);
    }
  }

  const page = await getPageForAccount(accountId);
  page.removeAllListeners('dialog');
  page.on('dialog', async (dialog) => {
    try {
      await dialog.accept();
    } catch {}
  });
  return page;
};

const processTarget = async (target: Target): Promise<boolean> => {
  const account = await Account.findOne({ accountId: target.accountId, isActive: true }).lean();
  if (!account) {
    console.log(`  계정 없음: ${target.accountId}`);
    return false;
  }

  await acquireAccountLock(target.accountId);
  try {
    const page = await ensurePage(target.accountId, account.password);
    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${target.cafeId}/articles/${target.articleId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(3000);

    let edited = await editCommentViaApi(page, target);
    if (!edited) {
      edited = await editCommentViaDom(page, target);
    }
    if (!edited) {
      await page.goto(`https://m.cafe.naver.com/ca-fe/web/cafes/${target.cafeId}/articles/${target.articleId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await page.waitForTimeout(3000);
      edited = await editCommentViaDom(page, target);
    }

    if (edited) {
      await updateDb(target);
      await saveCookiesForAccount(target.accountId);
    }

    return edited;
  } finally {
    releaseAccountLock(target.accountId);
  }
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI가 필요합니다.');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  console.log(`=== 댓글 수정 시작: ${TARGETS.length}건 ===`);
  console.log(`대기 범위: ${Math.round(MIN_DELAY_MS / 1000)}~${Math.round(MAX_DELAY_MS / 1000)}초`);

  let successCount = 0;
  for (let index = START_INDEX; index < TARGETS.length; index += 1) {
    const target = TARGETS[index];
    console.log(`\n[${index + 1}/${TARGETS.length}] #${target.articleId} ${target.accountId} - ${target.reason}`);
    console.log(`  before: ${target.originalContent}`);
    console.log(`  after : ${target.newContent}`);

    let success = false;
    try {
      success = await processTarget(target);
    } catch (error) {
      console.log(`  처리 오류: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (success) {
      successCount += 1;
      console.log('  수정 완료');
    } else {
      console.log('  수정 실패');
    }

    if (index < TARGETS.length - 1) {
      const delay = getDelay();
      console.log(`  다음 작업 전 ${Math.round(delay / 1000)}초 대기`);
      await wait(delay);
    }
  }

  console.log(`\n=== 완료: ${successCount}/${TARGETS.length}건 수정 ===`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
