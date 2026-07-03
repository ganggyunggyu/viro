import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import type { Frame, Page } from 'playwright';
import { User } from '../src/shared/models/user';
import { getAllAccounts } from '../src/shared/config/accounts';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  invalidateLoginCache,
  isAccountLoggedIn,
  isLoginRedirect,
  loginAccount,
  releaseAccountLock,
  saveCookiesForAccount,
} from '../src/shared/lib/multi-session';
import type { NaverAccount } from '../src/shared/lib/account-manager';

interface EnqueueResult {
  cafeName: string;
  cafeId: string;
  articleId: number;
  articleUrl: string;
  title: string;
}

interface EnqueueArtifact {
  results?: EnqueueResult[];
}

interface UiComment {
  id: string;
  type: 'comment' | 'reply';
  nickname: string;
  content: string;
  className: string;
}

const DEFAULT_ARTIFACT = 'outputs/new-cafe-comment-enqueue-2026-07-02T14-37-08-558Z.json';
const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const args = process.argv.slice(2);

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
};

const normalizeText = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim();

const readTargets = (artifactPath: string): EnqueueResult[] => {
  const parsed = JSON.parse(readFileSync(artifactPath, 'utf-8')) as EnqueueArtifact;
  return (parsed.results || []).filter(
    (result) => result.cafeId && result.articleId && result.articleUrl,
  );
};

const ensureLoggedIn = async (account: NaverAccount): Promise<void> => {
  const loggedIn = await isAccountLoggedIn(account.id);
  if (loggedIn) return;

  const result = await loginAccount(account.id, account.password, {
    waitForLoginMs: 15_000,
    reason: `ui_verify:${account.id}`,
  });

  if (!result.success) {
    throw new Error(`verify login failed: ${account.id} ${result.error || ''}`.trim());
  }
};

const getCommentRoot = async (page: Page): Promise<Page | Frame> => {
  try {
    await page.waitForSelector('iframe#cafe_main', { timeout: 10_000 });
    const frameHandle = await page.$('iframe#cafe_main');
    const frame = await frameHandle?.contentFrame();
    return frame || page;
  } catch {
    return page;
  }
};

const navigateToArticle = async (
  page: Page,
  account: NaverAccount,
  articleUrl: string,
): Promise<void> => {
  await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForTimeout(1500);

  if (!isLoginRedirect(page.url())) return;

  invalidateLoginCache(account.id);
  const loginResult = await loginAccount(account.id, account.password, {
    waitForLoginMs: 15_000,
    reason: `ui_verify_redirect:${account.id}`,
  });
  if (!loginResult.success) {
    throw new Error(`verify relogin failed: ${account.id} ${loginResult.error || ''}`.trim());
  }

  await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForTimeout(1500);
};

const loadVisibleComments = async (root: Page | Frame): Promise<UiComment[]> => {
  await root.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
  await root.waitForTimeout(700);

  for (let index = 0; index < 3; index += 1) {
    const moreButton = root.locator('text=더보기').first();
    const visible = await moreButton.isVisible({ timeout: 800 }).catch(() => false);
    if (!visible) break;
    await moreButton.click({ timeout: 1500 }).catch(() => {});
    await root.waitForTimeout(700);
  }

  await root.waitForSelector('.CommentItem, .comment_area', { timeout: 5000 }).catch(() => null);

  return root.$$eval('.CommentItem, .comment_area', (nodes) => {
    const picked = new Set<Element>();
    const commentNodes: Element[] = [];

    for (const node of nodes) {
      const closestItem = node.closest('.CommentItem');
      const element = closestItem || node;
      if (picked.has(element)) continue;
      picked.add(element);
      commentNodes.push(element);
    }

    return commentNodes.map((node) => {
      const element = node as HTMLElement;
      const className = String(element.className || '');
      const isReply =
        className.includes('CommentItem--reply') ||
        Boolean(element.closest('.CommentItem--reply')) ||
        Boolean(element.querySelector('.comment_reply')) ||
        Boolean(element.closest('.comment_reply'));
      const pickText = (selectors: string[]): string => {
        for (const selector of selectors) {
          const found = element.querySelector(selector);
          const text = found?.textContent?.replace(/\s+/g, ' ').trim();
          if (text) return text;
        }
        return '';
      };

      return {
        id: element.id || element.getAttribute('data-comment-id') || '',
        type: isReply ? 'reply' : 'comment',
        nickname: pickText(['.comment_nickname', '.nick', '.nickname']),
        content: pickText(['.comment_text_view', '.text_comment', '.comment_text_box']),
        className,
      };
    });
  });
};

const readListedCommentTotal = async (
  root: Page | Frame,
  title: string,
): Promise<{ count: number; bodyPreview: string }> => {
  const texts = await root
    .$$eval('.button_comment, .comment_count, .num_comment, a[href="#comment"]', (nodes) =>
      nodes.map((node) => node.textContent || ''),
    )
    .catch(() => []);

  for (const text of texts) {
    const match = text.replace(/,/g, '').match(/댓글\s*(\d+)|(\d+)/);
    const value = Number(match?.[1] || match?.[2] || 0);
    if (Number.isFinite(value) && value > 0) return { count: value, bodyPreview: '' };
  }

  const bodyText = await root.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  const normalizedBody = bodyText.replace(/\s+/g, ' ').trim();
  const titleNeedle = title.slice(0, Math.min(24, title.length));
  const titleIndex = normalizedBody.indexOf(titleNeedle);
  const nearbyText = titleIndex >= 0
    ? normalizedBody.slice(titleIndex, titleIndex + 220)
    : normalizedBody.slice(0, 500);
  const bracketMatch = nearbyText.replace(/,/g, '').match(/\[\s*(\d+)\s*\]/);
  const bracketValue = Number(bracketMatch?.[1] || 0);
  if (Number.isFinite(bracketValue) && bracketValue > 0) {
    return { count: bracketValue, bodyPreview: nearbyText };
  }

  return { count: 0, bodyPreview: nearbyText };
};

const writeArtifacts = (
  payload: unknown,
  rows: Array<Record<string, unknown>>,
): { jsonPath: string; mdPath: string } => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = join(outputDir, `new-cafe-ui-comment-verify-${timestamp}.json`);
  const mdPath = join(outputDir, `new-cafe-ui-comment-verify-${timestamp}.md`);

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(
    mdPath,
    [
      '# New Cafe UI Comment Verify',
      '',
      '|카페|글ID|UI댓글|UI대댓글|합계|스크린샷|',
      '|---|---:|---:|---:|---:|---|',
      ...rows.map((row) =>
        [
          row.cafeName,
          row.articleId,
          row.uiCommentCount,
          row.uiReplyCount,
          row.uiTotalCount,
          row.screenshotPath,
        ].join('|'),
      ),
      '',
    ].join('\n'),
    'utf-8',
  );

  return { jsonPath, mdPath };
};

const main = async (): Promise<void> => {
  const artifactPath = getArgValue('--artifact', DEFAULT_ARTIFACT);
  const verifyAccountId = getArgValue('--account-id', process.env.VERIFY_ACCOUNT_ID || 'produce11745');
  const screenshotDir = join(
    process.cwd(),
    'outputs',
    `new-cafe-ui-comment-verify-screenshots-${new Date().toISOString().replace(/[:.]/g, '-')}`,
  );
  mkdirSync(screenshotDir, { recursive: true });

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const accounts = await getAllAccounts(user.userId);
  const verifyAccount = accounts.find((account) => account.id === verifyAccountId) || accounts[0];
  if (!verifyAccount) throw new Error('verify account not found');

  const targets = readTargets(artifactPath);
  const rows: Array<Record<string, unknown>> = [];

  await acquireAccountLock(verifyAccount.id);
  try {
    await ensureLoggedIn(verifyAccount);
    const page = await getPageForAccount(verifyAccount.id);

    for (const target of targets) {
      const startedAt = Date.now();
      try {
        await navigateToArticle(page, verifyAccount, target.articleUrl);
        const root = await getCommentRoot(page);
        const uiComments = await loadVisibleComments(root);
        const uiCommentCount = uiComments.filter((comment) => comment.type === 'comment').length;
        const uiReplyCount = uiComments.filter((comment) => comment.type === 'reply').length;
        const listedCommentTotal = await readListedCommentTotal(root, target.title);
        const screenshotPath = join(
          screenshotDir,
          `${target.cafeId}-${target.articleId}.png`,
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });

        rows.push({
          cafeName: target.cafeName,
          cafeId: target.cafeId,
          articleId: target.articleId,
          articleUrl: target.articleUrl,
          title: target.title,
          finalUrl: page.url(),
          uiCommentCount,
          uiReplyCount,
          listedCommentTotal: listedCommentTotal.count,
          uiTotalCount: Math.max(uiCommentCount + uiReplyCount, listedCommentTotal.count),
          screenshotPath,
          durationMs: Date.now() - startedAt,
          bodyPreview: listedCommentTotal.bodyPreview,
          sample: uiComments.slice(-3).map((comment) => ({
            type: comment.type,
            nickname: comment.nickname,
            content: normalizeText(comment.content).slice(0, 80),
          })),
        });
      } catch (error) {
        rows.push({
          cafeName: target.cafeName,
          cafeId: target.cafeId,
          articleId: target.articleId,
          articleUrl: target.articleUrl,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - startedAt,
        });
      }
    }

    await saveCookiesForAccount(verifyAccount.id);
  } finally {
    releaseAccountLock(verifyAccount.id);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    verifyAccountId: verifyAccount.id,
    artifactPath,
    screenshotDir,
    rows,
  };
  const { jsonPath, mdPath } = writeArtifacts(payload, rows);

  console.log(`UI verify complete`);
  console.log(`json: ${jsonPath}`);
  console.log(`md: ${mdPath}`);
  console.log(
    JSON.stringify(
      rows.map((row) => ({
        cafeName: row.cafeName,
        articleId: row.articleId,
        uiCommentCount: row.uiCommentCount,
        uiReplyCount: row.uiReplyCount,
        uiTotalCount: row.uiTotalCount,
        error: row.error,
      })),
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error('verify-new-cafe-comments-ui failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
