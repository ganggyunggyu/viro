import dotenv from 'dotenv';
import mongoose from 'mongoose';
import type { Frame, Page } from 'playwright';
import { Account } from '../src/shared/models/account';
import { PublishedArticle } from '../src/shared/models/published-article';
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

interface RewriteTarget {
  cafeId: string;
  articleId: number;
  accountId: string;
  type: 'comment' | 'reply';
  oldContent: string;
  newContent: string;
  parentCommentId?: string;
  parentComment?: string;
  parentNickname?: string;
}

const TARGETS: RewriteTarget[] = [
  {
    cafeId: '25460974',
    articleId: 297961,
    accountId: 'dq1h3bjy',
    type: 'comment',
    oldContent: '미니 라떼가 이쁘긴 하더라 근데 가격이 문제야',
    newContent: '미니 라떼가 예쁘긴 하더라고요. 근데 가격이 문제네요.',
  },
  {
    cafeId: '25460974',
    articleId: 298405,
    accountId: 'tinyfish183',
    type: 'reply',
    oldContent: '맞아... 매물 보고 있으면 내가 살 수 있을 것 같은 착각에 빠짐 근데 어제 폭싹 보다가 중간에 현타 와서 껐어요',
    newContent: '맞는 것 같아요... 매물 보고 있으면 제가 살 수 있을 것 같은 착각에 빠지더라고요. 근데 어제 폭싹 보다가 중간에 현타 와서 껐어요',
    parentCommentId: '153278832',
    parentComment: 'ㅠㅠ 저도 요즘 명품 유튜브 알고리즘에 절여져서 폭싹 보다가도 갑자기 에르메스 검색함 내가 미친 거임',
    parentNickname: '에스앤비안과, 29년 경력',
  },
];

const normalize = (value: string): string => {
  return value.replace(/\s+/g, '').replace(/[.,…~ㅋㅎㅠㅜ]/g, '').trim();
};

const getCommentRoot = async (page: Page): Promise<Page | Frame> => {
  try {
    await page.waitForSelector('iframe#cafe_main', { timeout: 7000 });
    const frameHandle = await page.$('iframe#cafe_main');
    const frame = await frameHandle?.contentFrame();
    return frame ?? page;
  } catch {
    return page;
  }
};

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
}): NaverAccount => {
  return {
    id: account.accountId,
    password: account.password,
    nickname: account.nickname,
    isMain: account.isMain,
    activityHours: account.activityHours as NaverAccount['activityHours'],
    restDays: account.restDays as NaverAccount['restDays'],
    dailyPostLimit: account.dailyPostLimit,
    personaId: account.personaId,
    role: account.role as NaverAccount['role'],
  };
};

const deleteOnMobilePage = async (
  page: Page,
  target: RewriteTarget
): Promise<boolean> => {
  await page.goto(`https://m.cafe.naver.com/ca-fe/web/cafes/${target.cafeId}/articles/${target.articleId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3500);

  const clickedOption = await page.evaluate(function (oldContent) {
    const targetText = oldContent.replace(/\s+/g, '').replace(/[.,…~ㅋㅎㅠㅜ]/g, '').trim().slice(0, 35);
    const elements = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
    const candidates = elements
      .filter((element) => (element.textContent || '').replace(/\s+/g, '').replace(/[.,…~ㅋㅎㅠㅜ]/g, '').trim().includes(targetText))
      .sort((left, right) => (left.textContent || '').length - (right.textContent || '').length);

    for (const candidate of candidates) {
      let current: HTMLElement | null = candidate;
      for (let depth = 0; depth < 8 && current; depth += 1) {
        const optionButton = current.querySelector('button.btn_more, button[aria-label*="옵션"]') as HTMLButtonElement | null;
        if (optionButton) {
          optionButton.click();
          return true;
        }
        current = current.parentElement;
      }
    }

    return false;
  }, target.oldContent);

  if (!clickedOption) return false;
  await page.waitForTimeout(1000);

  const clickedDelete = await page.evaluate(function () {
    const buttons = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
    const deleteButton = buttons.find((button) => (button.textContent || '').trim() === '삭제');
    if (!deleteButton) return false;
    deleteButton.click();
    return true;
  });

  if (!clickedDelete) return false;
  await page.waitForTimeout(1000);

  await page.evaluate(function () {
    const buttons = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
    const confirmButton = buttons.find((button) => (button.textContent || '').trim() === '확인');
    confirmButton?.click();
  });
  await page.waitForTimeout(2500);

  return true;
};

const clickDeleteMenu = async (target: RewriteTarget): Promise<boolean> => {
  const account = await Account.findOne({ accountId: target.accountId, isActive: true }).lean();
  if (!account) {
    console.log(`[REWRITE] 계정 없음: ${target.accountId}`);
    return false;
  }

  await acquireAccountLock(target.accountId);
  try {
    const loggedIn = await isAccountLoggedIn(target.accountId);
    if (!loggedIn) {
      const loginResult = await loginAccount(target.accountId, account.password);
      if (!loginResult.success) {
        console.log(`[REWRITE] 로그인 실패: ${target.accountId} ${loginResult.error ?? ''}`);
        return false;
      }
    }

    const page = await getPageForAccount(target.accountId);
    page.on('dialog', async (dialog) => {
      try { await dialog.accept(); } catch {}
    });

    await page.goto(`https://cafe.naver.com/ca-fe/cafes/${target.cafeId}/articles/${target.articleId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    const root = await getCommentRoot(page);

    for (let index = 0; index < 5; index += 1) {
      await root.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await root.waitForTimeout(700);
    }

    const moreButtons = await root.$$('button:has-text("이전"), button:has-text("더보기"), a:has-text("더보기")');
    for (const button of moreButtons) {
      try {
        await button.click({ timeout: 1500 });
        await root.waitForTimeout(700);
      } catch {}
    }

    const targetNorm = normalize(target.oldContent);
    const items = await root.$$('.CommentItem, .comment_item, li.comment, .comment-area li');

    for (const item of items) {
      const text = await item.evaluate((node) => node.textContent || '');
      if (!normalize(text).includes(targetNorm.slice(0, 35))) continue;

      const optionButton = await item.$('.comment_tool_button, button[class*="tool"], a[class*="tool"]');
      if (!optionButton) {
        console.log(`[REWRITE] 더보기 버튼 없음: ${target.articleId}`);
        const deletedOnMobile = await deleteOnMobilePage(page, target);
        if (deletedOnMobile) {
          console.log(`[REWRITE] 모바일 삭제 완료: ${target.articleId} ${target.accountId}`);
          return true;
        }
        return false;
      }

      await optionButton.click();
      await page.waitForTimeout(700);

      const deleteButtons = [
        ...(await root.$$('button:has-text("삭제"), a:has-text("삭제")')),
        ...(await page.$$('button:has-text("삭제"), a:has-text("삭제")')),
      ];
      for (const deleteButton of deleteButtons) {
        const label = await deleteButton.evaluate((node) => node.textContent?.trim() ?? '');
        if (label !== '삭제') continue;

        await deleteButton.click();
        await page.waitForTimeout(700);

        const confirmButtons = [
          ...(await root.$$('button:has-text("확인"), a:has-text("확인")')),
          ...(await page.$$('button:has-text("확인"), a:has-text("확인")')),
        ];
        for (const confirmButton of confirmButtons) {
          try {
            await confirmButton.click({ timeout: 1500 });
            break;
          } catch {}
        }

        await page.waitForTimeout(2500);
        console.log(`[REWRITE] 삭제 완료: ${target.articleId} ${target.accountId}`);
        return true;
      }

      await page.keyboard.press('Escape');
      console.log(`[REWRITE] 삭제 메뉴 못 찾음: ${target.articleId}`);
      const deletedOnMobile = await deleteOnMobilePage(page, target);
      if (deletedOnMobile) {
        console.log(`[REWRITE] 모바일 삭제 완료: ${target.articleId} ${target.accountId}`);
        return true;
      }
      return false;
    }

    const deletedOnMobile = await deleteOnMobilePage(page, target);
    if (deletedOnMobile) {
      console.log(`[REWRITE] 모바일 삭제 완료: ${target.articleId} ${target.accountId}`);
      return true;
    }
    console.log(`[REWRITE] 기존 댓글 못 찾음: ${target.articleId} ${target.accountId}`);
    return false;
  } finally {
    releaseAccountLock(target.accountId);
  }
};

const updateDbContent = async (
  target: RewriteTarget,
  newCommentId?: string
): Promise<void> => {
  await PublishedArticle.updateOne(
    {
      articleId: target.articleId,
      cafeId: target.cafeId,
      'comments.accountId': target.accountId,
      'comments.content': target.oldContent,
    },
    {
      $set: {
        'comments.$.content': target.newContent,
        ...(newCommentId ? { 'comments.$.commentId': newCommentId } : {}),
        'comments.$.createdAt': new Date(),
      },
    }
  );
};

const rewriteTarget = async (target: RewriteTarget): Promise<boolean> => {
  const accountDoc = await Account.findOne({ accountId: target.accountId, isActive: true }).lean();
  if (!accountDoc) {
    console.log(`[REWRITE] 계정 없음: ${target.accountId}`);
    return false;
  }

  const deleted = await clickDeleteMenu(target);
  if (!deleted) return false;

  const account = toNaverAccount(accountDoc);
  const result = target.type === 'comment'
    ? await writeCommentWithAccount(account, target.cafeId, target.articleId, target.newContent)
    : await writeReplyWithAccount(account, target.cafeId, target.articleId, target.newContent, 0, {
      parentCommentId: target.parentCommentId,
      parentComment: target.parentComment,
      parentNickname: target.parentNickname,
    });

  if (!result.success) {
    console.log(`[REWRITE] 재작성 실패: ${target.articleId} ${target.accountId} ${result.error ?? ''}`);
    return false;
  }

  await updateDbContent(target, result.commentId);
  console.log(`[REWRITE] 재작성 완료: ${target.articleId} ${target.accountId}`);
  return true;
};

const main = async (): Promise<void> => {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) throw new Error('MONGODB_URI가 필요합니다.');

  await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 10000 });

  let successCount = 0;
  for (const target of TARGETS) {
    const success = await rewriteTarget(target);
    if (success) successCount += 1;
  }

  console.log(`[REWRITE] 완료: ${successCount}/${TARGETS.length}`);
  await closeAllContexts();
  await mongoose.disconnect();

  if (successCount !== TARGETS.length) process.exit(1);
};

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
