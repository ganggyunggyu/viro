import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Frame, Page } from 'playwright';
import mongoose from 'mongoose';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import {
  closeAllContexts,
  getPageForAccount,
  isLoginRedirect,
  loginAccount,
  saveCookiesForAccount,
} from '../src/shared/lib/multi-session';
import { Account, User } from '../src/shared/models';

interface FailureEvent {
  event: string;
  sequence: number;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  accountId: string;
  error: string;
  at: string;
}

interface CaptureResult {
  sequence: number;
  accountId: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  error: string;
  url: string;
  screenshotPath: string;
  hasCommentInput: boolean;
  bodyPreview: string;
  capturedAt: string;
}

const args = process.argv.slice(2);
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const toKstDateTime = (date: Date): string =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ');

const safeFilePart = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);

const getArticleRoot = async (page: Page): Promise<Page | Frame> => {
  try {
    await page.waitForSelector('iframe#cafe_main', { timeout: 10_000 });
  } catch {
    return page;
  }

  const frameHandle = await page.$('iframe#cafe_main');
  const frame = await frameHandle?.contentFrame();
  return frame ?? page;
};

const normalizeText = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim();

const loadFailures = (runLogPath: string): FailureEvent[] => {
  const rows = readFileSync(runLogPath, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as FailureEvent);

  return rows.filter((row) => row.event === 'comment-failed');
};

const loadAccounts = async (
  loginId: string,
  accountIds: Set<string>,
): Promise<Map<string, NaverAccount>> => {
  const user = await User.findOne({ loginId, isActive: true })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!user) throw new Error(`user not found: ${loginId}`);

  const docs = await Account.find({
    userId: user.userId,
    isActive: true,
    accountId: { $in: Array.from(accountIds) },
  })
    .select('accountId password nickname role')
    .lean<Array<{ accountId: string; password: string; nickname?: string; role?: 'writer' | 'commenter' }>>();

  return new Map(
    docs.map((doc) => [
      doc.accountId,
      {
        id: doc.accountId,
        password: doc.password,
        nickname: doc.nickname || doc.accountId,
        role: doc.role,
      },
    ]),
  );
};

const captureFailure = async (params: {
  failure: FailureEvent;
  account: NaverAccount;
  outputDir: string;
  loginWaitMs: number;
}): Promise<CaptureResult> => {
  const { failure, account, outputDir, loginWaitMs } = params;
  const loginResult = await loginAccount(account.id, account.password, {
    waitForLoginMs: loginWaitMs,
    reason: `capture_comment_failure:${account.id}`,
  });

  if (!loginResult.success) {
    throw new Error(loginResult.error || '로그인 실패');
  }

  const page = await getPageForAccount(account.id);
  const url = `https://cafe.naver.com/ca-fe/cafes/${failure.cafeId}/articles/${failure.articleId}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(2000);

  if (isLoginRedirect(page.url())) {
    throw new Error('로그인 페이지로 리다이렉트됨');
  }

  const root = await getArticleRoot(page);
  const hasCommentInput = !!(await root.$('.CommentWriter:not(:has(.btn_cancel)) textarea.comment_inbox_text'));
  const bodyPreview = normalizeText(await root.locator('body').innerText({ timeout: 5000 }).catch(() => '')).slice(0, 500);
  const screenshotPath = join(
    outputDir,
    `${String(failure.sequence).padStart(5, '0')}-${safeFilePart(failure.accountId)}-${failure.cafeId}-${failure.articleId}.png`,
  );

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await saveCookiesForAccount(account.id);

  return {
    sequence: failure.sequence,
    accountId: failure.accountId,
    cafeSlug: failure.cafeSlug,
    cafeId: failure.cafeId,
    articleId: failure.articleId,
    error: failure.error,
    url,
    screenshotPath,
    hasCommentInput,
    bodyPreview,
    capturedAt: toKstDateTime(new Date()),
  };
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const runLogPath = getArgValue('--run-log', '');
  const loginId = getArgValue('--login-id', '21lab');
  const loginWaitMin = Number(getArgValue('--login-wait-min', '10'));

  if (!runLogPath) throw new Error('--run-log is required');

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(process.cwd(), 'outputs', `work-cafe-comment-failure-screens-${runId}`);
  mkdirSync(outputDir, { recursive: true });

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const failures = loadFailures(runLogPath).filter((failure) =>
    failure.error.includes('ARTICLE_NOT_READY') ||
    failure.error.includes('댓글 입력창'),
  );
  const accounts = await loadAccounts(
    loginId,
    new Set(failures.map((failure) => failure.accountId)),
  );
  const results: CaptureResult[] = [];
  const errors: Array<Record<string, unknown>> = [];

  for (const failure of failures) {
    const account = accounts.get(failure.accountId);
    if (!account) {
      errors.push({ sequence: failure.sequence, accountId: failure.accountId, error: 'account not found' });
      continue;
    }

    try {
      const result = await captureFailure({
        failure,
        account,
        outputDir,
        loginWaitMs: loginWaitMin * 60_000,
      });
      results.push(result);
      console.log(
        `[CAPTURE] seq=${result.sequence} ${result.accountId} ${result.cafeSlug}/${result.articleId} input=${result.hasCommentInput} ${result.screenshotPath}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      errors.push({
        sequence: failure.sequence,
        accountId: failure.accountId,
        cafeSlug: failure.cafeSlug,
        articleId: failure.articleId,
        error: errorMessage,
      });
      console.error(`[CAPTURE] 실패 seq=${failure.sequence} ${failure.accountId}: ${errorMessage}`);
    }
  }

  const jsonPath = join(outputDir, `failure-captures-${runId}.json`);
  const mdPath = join(outputDir, `failure-captures-${runId}.md`);
  writeFileSync(
    jsonPath,
    JSON.stringify({ runLogPath, capturedAt: new Date().toISOString(), results, errors }, null, 2),
    'utf-8',
  );
  writeFileSync(
    mdPath,
    [
      '# 작업카페 댓글 실패 화면 캡처',
      '',
      `- runLog: ${runLogPath}`,
      `- captured: ${results.length}`,
      `- captureErrors: ${errors.length}`,
      '',
      '|seq|계정|카페|글번호|댓글입력창|캡처|',
      '|---:|---|---|---:|---|---|',
      ...results.map((result) =>
        `|${result.sequence}|${result.accountId}|${result.cafeSlug}|${result.articleId}|${result.hasCommentInput ? '있음' : '없음'}|${result.screenshotPath}|`,
      ),
      '',
      '## 캡처 실패',
      '',
      ...errors.map((error) => `- seq=${error.sequence} account=${error.accountId} error=${error.error}`),
      '',
    ].join('\n'),
    'utf-8',
  );

  console.log(`json: ${jsonPath}`);
  console.log(`md: ${mdPath}`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('capture-work-cafe-comment-failures failed:', errorMessage);
    try {
      await closeAllContexts();
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
