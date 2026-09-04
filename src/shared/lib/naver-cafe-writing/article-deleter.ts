/**
 * 카페 글 삭제. delete-health-overcap-direct.ts 에서 실전 검증된 로직을 공용으로 뺀 것.
 * API 삭제를 먼저 시도하고, 안 되면 UI 삭제 후 실제로 지워졌는지 확인한다.
 */
import type { Page } from 'playwright';
import { isLoginRedirect } from '@/shared/lib/multi-session';

const hasDeletedMessage = async (page: Page): Promise<boolean> => {
  return page
    .evaluate(() => {
      const text = document.body.innerText || '';
      return /삭제된\s*게시글|존재하지\s*않는\s*게시글|게시글이\s*없습니다|없는\s*게시글/.test(
        text
      );
    })
    .catch(() => false);
};

const isArticleMissingByApi = async (
  page: Page,
  cafeId: string,
  articleId: number
): Promise<boolean> => {
  const result = await page.evaluate(
    async ({ targetCafeId, targetArticleId }) => {
      const response = await fetch(
        `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${targetCafeId}/articles/${targetArticleId}?useCafeId=true`,
        {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );
      const text = await response.text();
      return {
        status: response.status,
        text: text.slice(0, 500),
      };
    },
    { targetCafeId: cafeId, targetArticleId: articleId }
  );

  return (
    result.status === 404 ||
    /삭제되었거나\s*존재하지\s*않는\s*게시글|존재하지\s*않는\s*게시글|삭제된\s*게시글|errorCode"\s*:\s*"4003/i.test(
      result.text
    )
  );
};

export const tryDeleteArticleByApi = async (
  page: Page,
  cafeId: string,
  articleId: number
): Promise<boolean> => {
  if (await isArticleMissingByApi(page, cafeId, articleId)) {
    return true;
  }

  const result = await page.evaluate(
    async ({ targetCafeId, targetArticleId }) => {
      const response = await fetch(
        `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${targetCafeId}/articles/${targetArticleId}?useCafeId=true`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      const text = await response.text();
      return {
        status: response.status,
        ok: response.ok,
        text: text.slice(0, 500),
      };
    },
    { targetCafeId: cafeId, targetArticleId: articleId }
  );
  console.log(
    `[API_DELETE] #${articleId} status=${result.status} ok=${result.ok} body=${result.text.slice(0, 80)}`
  );

  await page.waitForTimeout(1200);
  return isArticleMissingByApi(page, cafeId, articleId);
};

const clickDeleteControl = async (page: Page): Promise<boolean> => {
  const clickedDirect = await page
    .evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const deleteButton = candidates.find((element) => {
        const label = (element.textContent || '').trim();
        const className = element.getAttribute('class') || '';
        return (label === '삭제' || label === '삭제하기') && !/gnb_del_txt/.test(className);
      });
      deleteButton?.click();
      return Boolean(deleteButton);
    })
    .catch(() => false);

  if (clickedDirect) return true;

  const moreSelectors = [
    'button[aria-label*="더보기"]',
    'a[aria-label*="더보기"]',
    '.ArticleTool button',
    '.article_tool button',
    '.btn_more',
    '.button_more',
    'button:has-text("더보기")',
    'a:has-text("더보기")',
  ];

  for (const selector of moreSelectors) {
    const moreButton = page.locator(selector).first();
    const visible = await moreButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) continue;

    await moreButton.click().catch(() => undefined);
    await page.waitForTimeout(800);

    const clickedDelete = await page
      .evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
        const deleteButton = candidates.find((element) => {
          const label = (element.textContent || '').trim();
          const className = element.getAttribute('class') || '';
          return (label === '삭제' || label === '삭제하기') && !/gnb_del_txt/.test(className);
        });
        deleteButton?.click();
        return Boolean(deleteButton);
      })
      .catch(() => false);

    if (clickedDelete) return true;
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  return false;
};

const confirmDeleteIfNeeded = async (page: Page): Promise<void> => {
  await page.waitForTimeout(800);
  await page
    .evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
      const confirmButton = candidates.find((element) => {
        const label = (element.textContent || '').trim();
        return label === '확인' || label === '예' || label === '삭제';
      });
      confirmButton?.click();
    })
    .catch(() => undefined);
};

export const verifyArticleDeleted = async (
  page: Page,
  cafeId: string,
  articleId: number
): Promise<boolean> => {
  if (await isArticleMissingByApi(page, cafeId, articleId)) {
    return true;
  }

  await page
    .goto(`https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    .catch(() => undefined);
  await page.waitForTimeout(2500);

  return hasDeletedMessage(page);
};

export const tryDeleteArticleByUi = async (
  page: Page,
  cafeId: string,
  articleId: number
): Promise<boolean> => {
  const urls = [
    `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
    `https://m.cafe.naver.com/ArticleRead.nhn?clubid=${cafeId}&articleid=${articleId}&boardtype=L`,
  ];

  page.on('dialog', async (dialog) => {
    await dialog.accept().catch(() => undefined);
  });

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3500);

    if (isLoginRedirect(page.url())) {
      continue;
    }

    if (await hasDeletedMessage(page)) {
      return true;
    }

    const clickedDelete = await clickDeleteControl(page);
    if (!clickedDelete) {
      continue;
    }

    await confirmDeleteIfNeeded(page);
    await page.waitForTimeout(2500);

    if (await verifyArticleDeleted(page, cafeId, articleId)) {
      return true;
    }
  }

  return false;
};
