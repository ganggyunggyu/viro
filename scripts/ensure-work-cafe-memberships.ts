import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import mongoose from 'mongoose';
import type { Page } from 'playwright';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  loginAccount,
  releaseAccountLock,
  saveCookiesForAccount,
} from '../src/shared/lib/multi-session';
import {
  joinCafeMembership,
  type NaverCafeTarget,
} from '../src/shared/lib/naver-cafe-membership';
import { Account, User } from '../src/shared/models';

interface ScheduleRow {
  cafeSlug: string;
  ownerName: string;
  cafeId: string;
  articleId: number;
  accountId: string;
  accountNickname: string;
}

interface SchedulePayload {
  schedule: ScheduleRow[];
}

interface RunnerArgs {
  schedulePath: string;
  loginId: string;
  accountConcurrency: number;
  loginWaitMin: number;
  onlyAccountIds: Set<string>;
  excludeAccountIds: Set<string>;
  onlyCafeIds: Set<string>;
  skipJoinCaptchaSolve: boolean;
}

interface MembershipPair {
  accountId: string;
  cafeId: string;
  cafeSlug: string;
  cafeName: string;
}

interface MembershipResult {
  accountId: string;
  nickname: string;
  cafeId: string;
  cafeSlug: string;
  cafeName: string;
  status: 'joined' | 'alreadyMember' | 'pending_manual' | 'failed' | 'loginFailed';
  detail: string;
  screenshotPath?: string;
  checkedAt: string;
}

class Semaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  run = async <T>(fn: () => Promise<T>): Promise<T> => {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  };

  private acquire = async (): Promise<void> => {
    if (this.active < this.limit) {
      this.active += 1;
      return;
    }

    await new Promise<void>((resolveAcquire) => {
      this.queue.push(resolveAcquire);
    });
    this.active += 1;
  };

  private release = (): void => {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) next();
  };
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

const getArgValues = (name: string): string[] => {
  const values: string[] = [];
  const prefix = `${name}=`;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith(prefix)) {
      values.push(arg.slice(prefix.length));
      continue;
    }

    if (arg === name && args[index + 1]) {
      values.push(args[index + 1]);
      index += 1;
    }
  }

  return values.flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
};

const hasFlag = (name: string): boolean => args.includes(name);

const toKstDateTime = (date: Date): string =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ');

const safeFilePart = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);

const getArgs = (): RunnerArgs => ({
  schedulePath: getArgValue('--schedule', ''),
  loginId: getArgValue('--login-id', '21lab'),
  accountConcurrency: Number(getArgValue('--account-concurrency', '1')),
  loginWaitMin: Number(getArgValue('--login-wait-min', '10')),
  onlyAccountIds: new Set(getArgValues('--account-id')),
  excludeAccountIds: new Set(getArgValues('--exclude-account-id')),
  onlyCafeIds: new Set(getArgValues('--cafe-id')),
  skipJoinCaptchaSolve: hasFlag('--skip-join-captcha-solve'),
});

const loadSchedule = (schedulePath: string): SchedulePayload => {
  if (!schedulePath) throw new Error('--schedule is required');
  return JSON.parse(readFileSync(resolve(schedulePath), 'utf-8')) as SchedulePayload;
};

const buildPairs = (schedule: ScheduleRow[], options: RunnerArgs): MembershipPair[] => {
  const pairs = new Map<string, MembershipPair>();

  for (const row of schedule) {
    if (options.onlyAccountIds.size > 0 && !options.onlyAccountIds.has(row.accountId)) continue;
    if (options.excludeAccountIds.has(row.accountId)) continue;
    if (options.onlyCafeIds.size > 0 && !options.onlyCafeIds.has(row.cafeId)) continue;

    const key = `${row.accountId}:${row.cafeId}`;
    if (pairs.has(key)) continue;

    pairs.set(key, {
      accountId: row.accountId,
      cafeId: row.cafeId,
      cafeSlug: row.cafeSlug,
      cafeName: row.cafeSlug,
    });
  }

  return Array.from(pairs.values()).sort((a, b) =>
    a.accountId.localeCompare(b.accountId) ||
    a.cafeSlug.localeCompare(b.cafeSlug),
  );
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

  const accounts = new Map<string, NaverAccount>();
  for (const doc of docs) {
    accounts.set(doc.accountId, {
      id: doc.accountId,
      password: doc.password,
      nickname: doc.nickname || doc.accountId,
      role: doc.role,
    });
  }

  return accounts;
};

const captureJoinFailure = async (
  page: Page,
  outputDir: string,
  pair: MembershipPair,
): Promise<string> => {
  const path = join(
    outputDir,
    `${safeFilePart(pair.accountId)}-${safeFilePart(pair.cafeSlug)}-${pair.cafeId}.png`,
  );
  await page.screenshot({ path, fullPage: true }).catch(() => undefined);
  return path;
};

const appendJsonl = (path: string, payload: Record<string, unknown>): void => {
  appendFileSync(path, `${JSON.stringify(payload)}\n`, 'utf-8');
};

const isPendingManualDetail = (detail: string): boolean =>
  /pending_manual|보안문자|캡차|추가 인증|추가인증|보호\/휴면|휴면 해제|보호조치|로그인 대기 시간 초과|수동/.test(detail);

const ensureAccountMemberships = async (params: {
  account: NaverAccount;
  pairs: MembershipPair[];
  outputDir: string;
  loginWaitMs: number;
  progressPath: string;
  skipJoinCaptchaSolve: boolean;
}): Promise<MembershipResult[]> => {
  const { account, pairs, outputDir, loginWaitMs, progressPath, skipJoinCaptchaSolve } = params;
  const results: MembershipResult[] = [];

  await acquireAccountLock(account.id);
  try {
    const loginResult = await loginAccount(account.id, account.password, {
      forceFreshLogin: false,
      waitForLoginMs: loginWaitMs,
      pollIntervalMs: 1_000,
      reason: `ensure_work_cafe_membership:${account.id}`,
    });

    if (!loginResult.success) {
      const detail = loginResult.error || '로그인 실패';
      const status = isPendingManualDetail(detail) ? 'pending_manual' : 'loginFailed';

      return pairs.map((pair) => ({
        accountId: account.id,
        nickname: account.nickname || account.id,
        cafeId: pair.cafeId,
        cafeSlug: pair.cafeSlug,
        cafeName: pair.cafeName,
        status,
        detail,
        checkedAt: toKstDateTime(new Date()),
      }));
    }

    const page = await getPageForAccount(account.id);
    for (const [index, pair] of pairs.entries()) {
      const target: NaverCafeTarget = {
        cafeId: pair.cafeId,
        cafeUrl: `https://cafe.naver.com/${pair.cafeSlug}`,
        name: pair.cafeName,
      };
      let result: Awaited<ReturnType<typeof joinCafeMembership>>;
      let status: MembershipResult['status'];
      let screenshotPath: string | undefined;

      try {
        result = await joinCafeMembership(page, target, {
          nickname: account.nickname || account.id,
          logPrefix: `JOIN:${account.id}:${pair.cafeSlug}`,
          skipCaptchaSolve: skipJoinCaptchaSolve,
        });
        status = isPendingManualDetail(result.detail)
          ? 'pending_manual'
          : result.status === 'alreadyMember'
            ? 'alreadyMember'
            : result.status;
        if (status === 'failed') {
          screenshotPath = await captureJoinFailure(page, outputDir, pair);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        result = {
          status: 'failed',
          detail: errorMessage,
        };
        status = isPendingManualDetail(errorMessage) ? 'pending_manual' : 'failed';
        screenshotPath = await captureJoinFailure(page, outputDir, pair).catch(() => undefined);
      }

      const row = {
        accountId: account.id,
        nickname: account.nickname || account.id,
        cafeId: pair.cafeId,
        cafeSlug: pair.cafeSlug,
        cafeName: pair.cafeName,
        status,
        detail: result.detail,
        screenshotPath,
        checkedAt: toKstDateTime(new Date()),
      } satisfies MembershipResult;

      results.push(row);
      appendJsonl(progressPath, {
        event: 'membership-result',
        ...row,
      });

      console.log(
        `[ENSURE-JOIN] ${account.id} ${index + 1}/${pairs.length} ${pair.cafeSlug}: ${status} - ${result.detail}`,
      );
      await page.waitForTimeout(1500);
    }

    await saveCookiesForAccount(account.id);
    return results;
  } finally {
    releaseAccountLock(account.id);
  }
};

const writeArtifacts = (params: {
  outputDir: string;
  runId: string;
  schedulePath: string;
  results: MembershipResult[];
  missingAccounts: string[];
}): { jsonPath: string; mdPath: string } => {
  const { outputDir, runId, schedulePath, results, missingAccounts } = params;
  const jsonPath = join(outputDir, `work-cafe-membership-ensure-${runId}.json`);
  const mdPath = join(outputDir, `work-cafe-membership-ensure-${runId}.md`);
  const joined = results.filter((result) => result.status === 'joined').length;
  const alreadyMember = results.filter((result) => result.status === 'alreadyMember').length;
  const pendingManual = results.filter((result) => result.status === 'pending_manual').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const loginFailed = results.filter((result) => result.status === 'loginFailed').length;

  writeFileSync(
    jsonPath,
    JSON.stringify({ schedulePath, summary: { total: results.length, joined, alreadyMember, pendingManual, failed, loginFailed, missingAccounts }, results }, null, 2),
    'utf-8',
  );

  writeFileSync(
    mdPath,
    [
      '# 작업카페 댓글 계정 가입 보정',
      '',
      `- schedule: ${schedulePath}`,
      `- total: ${results.length}`,
      `- joined: ${joined}`,
      `- alreadyMember: ${alreadyMember}`,
      `- pendingManual: ${pendingManual}`,
      `- failed: ${failed}`,
      `- loginFailed: ${loginFailed}`,
      `- missingAccounts: ${missingAccounts.join(', ') || '-'}`,
      '',
      '|계정|닉네임|카페|상태|상세|캡처|',
      '|---|---|---|---|---|---|',
      ...results.map((result) =>
        `|${result.accountId}|${result.nickname}|${result.cafeSlug}|${result.status}|${result.detail.replace(/\|/g, '/')}|${result.screenshotPath || ''}|`,
      ),
      '',
    ].join('\n'),
    'utf-8',
  );

  return { jsonPath, mdPath };
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const options = getArgs();
  const schedulePayload = loadSchedule(options.schedulePath);
  const pairs = buildPairs(schedulePayload.schedule, options);
  const accountIds = new Set(pairs.map((pair) => pair.accountId));
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(process.cwd(), 'outputs', `work-cafe-membership-ensure-${runId}`);
  const progressPath = join(outputDir, `progress-${runId}.jsonl`);
  mkdirSync(outputDir, { recursive: true });

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const accounts = await loadAccounts(options.loginId, accountIds);
  const missingAccounts = Array.from(accountIds).filter((accountId) => !accounts.has(accountId));
  const pairsByAccount = new Map<string, MembershipPair[]>();

  for (const pair of pairs) {
    if (!accounts.has(pair.accountId)) continue;
    const accountPairs = pairsByAccount.get(pair.accountId) ?? [];
    accountPairs.push(pair);
    pairsByAccount.set(pair.accountId, accountPairs);
  }

  console.log(
    `[ENSURE-JOIN] start accounts=${pairsByAccount.size} pairs=${pairs.length} missingAccounts=${missingAccounts.length}`,
  );

  const limiter = new Semaphore(Math.max(1, options.accountConcurrency));
  const allResults = (
    await Promise.all(
      Array.from(pairsByAccount.entries()).map(([accountId, accountPairs]) =>
        limiter.run(async () => {
          const account = accounts.get(accountId);
          if (!account) return [];
          return ensureAccountMemberships({
            account,
            pairs: accountPairs,
            outputDir,
            loginWaitMs: options.loginWaitMin * 60_000,
            progressPath,
            skipJoinCaptchaSolve: options.skipJoinCaptchaSolve,
          });
        }),
      ),
    )
  ).flat();

  const paths = writeArtifacts({
    outputDir,
    runId,
    schedulePath: options.schedulePath,
    results: allResults,
    missingAccounts,
  });

  console.log(`[ENSURE-JOIN] done json=${paths.jsonPath}`);
  console.log(`[ENSURE-JOIN] done md=${paths.mdPath}`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('[ENSURE-JOIN] failed:', errorMessage);
    try {
      await closeAllContexts();
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
