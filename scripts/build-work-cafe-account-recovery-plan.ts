import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

interface Args {
  schedulePath: string;
  runLogs: string[];
  membershipArtifacts: string[];
  skipArticles: string[];
}

interface ScheduleRow {
  accountId: string;
  accountNickname: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
}

interface SchedulePayload {
  schedule: ScheduleRow[];
}

interface CommentFailure {
  sequence?: number;
  accountId: string;
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  error: string;
}

interface MembershipResult {
  accountId: string;
  nickname?: string;
  cafeId: string;
  cafeSlug: string;
  status: string;
  detail: string;
}

const args = process.argv.slice(2);

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const getArgValues = (name: string): string[] => {
  const prefix = `${name}=`;
  const values: string[] = [];

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

const findLatestSchedulePath = (): string => {
  const outputDir = join(process.cwd(), 'outputs');
  const files = readdirSync(outputDir)
    .filter((name) => /^work-cafe-comment-schedule-.*\.json$/.test(name))
    .sort()
    .reverse();
  const latest = files[0];
  if (!latest) throw new Error('schedule artifact not found');
  return join(outputDir, latest);
};

const getArgs = (): Args => ({
  schedulePath: getArgValue('--schedule', findLatestSchedulePath()),
  runLogs: getArgValues('--run-log'),
  membershipArtifacts: getArgValues('--membership'),
  skipArticles: getArgValues('--skip-article'),
});

const readJsonl = <T>(path: string): T[] => {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
};

const readMembershipArtifact = (path: string): MembershipResult[] => {
  if (!existsSync(path)) return [];
  if (path.endsWith('.jsonl')) {
    return readJsonl<{ event?: string } & MembershipResult>(path)
      .filter((row) => row.event === 'membership-result')
      .map((row) => ({
        accountId: row.accountId,
        nickname: row.nickname,
        cafeId: row.cafeId,
        cafeSlug: row.cafeSlug,
        status: row.status,
        detail: row.detail,
      }));
  }

  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as { results?: MembershipResult[] };
  return parsed.results || [];
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const buildCommentResumeCommand = (params: {
  schedulePath: string;
  includeAccountIds?: string[];
  excludeAccountIds?: string[];
  skipArticles: string[];
}): string => {
  const include = params.includeAccountIds?.length
    ? ` --account-id=${params.includeAccountIds.join(',')}`
    : '';
  const exclude = params.excludeAccountIds?.length
    ? ` --exclude-account-id=${params.excludeAccountIds.join(',')}`
    : '';
  const skip = params.skipArticles.map((article) => ` --skip-article=${article}`).join('');

  return [
    'PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts',
    `--schedule=${params.schedulePath}`,
    '--login-id=21lab',
    '--account-gap-min=3',
    '--global-gap-sec=10',
    '--article-gap-min=25',
    '--generation-concurrency=4',
    '--prefetch-articles=0',
    '--max-active=12',
    '--screenshot-every=25',
    '--login-wait-min=10',
    include,
    exclude,
    skip,
  ].join(' ').replace(/\s+/g, ' ').trim();
};

const buildMembershipCommand = (schedulePath: string, accountId: string): string =>
  [
    'PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts',
    `--schedule=${schedulePath}`,
    '--login-id=21lab',
    '--account-concurrency=1',
    '--login-wait-min=10',
    `--account-id=${accountId}`,
  ].join(' ');

const main = (): void => {
  const options = getArgs();
  const schedulePayload = JSON.parse(readFileSync(resolve(options.schedulePath), 'utf-8')) as SchedulePayload;
  const accounts = unique(schedulePayload.schedule.map((row) => row.accountId)).sort();
  const accountNicknames = new Map(
    schedulePayload.schedule.map((row) => [row.accountId, row.accountNickname || row.accountId]),
  );
  const commentFailures = options.runLogs.flatMap((path) =>
    readJsonl<{ event?: string } & CommentFailure>(path)
      .filter((row) => row.event === 'comment-failed')
      .map((row) => ({
        sequence: row.sequence,
        accountId: row.accountId,
        cafeSlug: row.cafeSlug,
        cafeId: row.cafeId,
        articleId: row.articleId,
        error: row.error,
      })),
  );
  const membershipResults = options.membershipArtifacts.flatMap(readMembershipArtifact);
  const membershipProblemRows = membershipResults.filter((row) =>
    row.status === 'failed' ||
    row.status === 'loginFailed',
  );
  const likelyNotJoinedFailures = commentFailures.filter((row) =>
    row.error.includes('댓글 입력창') ||
    row.error.includes('ARTICLE_NOT_READY'),
  );
  const interruptedFailures = commentFailures.filter((row) =>
    row.error.includes('Target page') ||
    row.error.includes('context or browser has been closed'),
  );
  const blockedAccounts = unique([
    ...likelyNotJoinedFailures.map((row) => row.accountId),
    ...membershipProblemRows.map((row) => row.accountId),
  ]).sort();
  const safeAccounts = accounts.filter((accountId) => !blockedAccounts.includes(accountId));
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = join(outputDir, `work-cafe-account-recovery-plan-${timestamp}.json`);
  const mdPath = join(outputDir, `work-cafe-account-recovery-plan-${timestamp}.md`);
  const safeCommentCommand = buildCommentResumeCommand({
    schedulePath: options.schedulePath,
    excludeAccountIds: blockedAccounts,
    skipArticles: options.skipArticles,
  });
  const payload = {
    generatedAt: new Date().toISOString(),
    schedulePath: options.schedulePath,
    runLogs: options.runLogs,
    membershipArtifacts: options.membershipArtifacts,
    skipArticles: options.skipArticles,
    totals: {
      accounts: accounts.length,
      safeAccounts: safeAccounts.length,
      blockedAccounts: blockedAccounts.length,
      commentFailures: commentFailures.length,
      likelyNotJoinedFailures: likelyNotJoinedFailures.length,
      interruptedFailures: interruptedFailures.length,
      membershipProblems: membershipProblemRows.length,
    },
    blockedAccounts: blockedAccounts.map((accountId) => ({
      accountId,
      nickname: accountNicknames.get(accountId) || accountId,
      membershipCommand: buildMembershipCommand(options.schedulePath, accountId),
      commentResumeCommand: buildCommentResumeCommand({
        schedulePath: options.schedulePath,
        includeAccountIds: [accountId],
        skipArticles: options.skipArticles,
      }),
      failures: commentFailures.filter((row) => row.accountId === accountId),
      membershipProblems: membershipProblemRows.filter((row) => row.accountId === accountId),
    })),
    safeAccounts: safeAccounts.map((accountId) => ({
      accountId,
      nickname: accountNicknames.get(accountId) || accountId,
    })),
    safeCommentCommand,
  };

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(
    mdPath,
    [
      '# 작업카페 계정별 복구 플랜',
      '',
      `- schedule: ${options.schedulePath}`,
      `- safeAccounts: ${safeAccounts.length}`,
      `- blockedAccounts: ${blockedAccounts.length}`,
      `- commentFailures: ${commentFailures.length}`,
      `- membershipProblems: ${membershipProblemRows.length}`,
      '',
      '## 안전 계정 댓글 재개',
      '',
      '```bash',
      safeCommentCommand,
      '```',
      '',
      '## 격리 계정',
      '',
      '|계정|닉네임|댓글실패|가입문제|',
      '|---|---|---:|---:|',
      ...payload.blockedAccounts.map((row) =>
        `|${row.accountId}|${row.nickname}|${row.failures.length}|${row.membershipProblems.length}|`,
      ),
      '',
      '## 계정별 복구 순서',
      '',
      ...payload.blockedAccounts.flatMap((row) => [
        `### ${row.accountId} / ${row.nickname}`,
        '',
        '가입 보정:',
        '',
        '```bash',
        row.membershipCommand,
        '```',
        '',
        '가입 완료 후 댓글 재개:',
        '',
        '```bash',
        row.commentResumeCommand,
        '```',
        '',
      ]),
      '',
    ].join('\n'),
    'utf-8',
  );

  console.log(`json: ${jsonPath}`);
  console.log(`md: ${mdPath}`);
  console.log(`safeAccounts: ${safeAccounts.length}`);
  console.log(`blockedAccounts: ${blockedAccounts.length}`);
};

main();
