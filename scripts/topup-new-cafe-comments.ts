import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { PublishedArticle } from '../src/shared/models/published-article';
import { addTaskJob, closeAllQueues } from '../src/shared/lib/queue';
import { getAllAccounts } from '../src/shared/config/accounts';
import type { CommentJobData } from '../src/shared/lib/queue/types';
import type { NaverAccount } from '../src/shared/lib/account-manager';

interface UiVerifyRow {
  cafeName: string;
  cafeId: string;
  articleId: number;
  articleUrl: string;
  title: string;
  uiTotalCount?: number;
}

interface UiVerifyArtifact {
  rows?: UiVerifyRow[];
}

const DEFAULT_UI_VERIFY = 'outputs/new-cafe-ui-comment-verify-2026-07-03T01-20-34-300Z.json';
const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const args = process.argv.slice(2);

const TOPUP_COMMENTS: Record<string, string[]> = {
  '31750114': [
    '동네에서 편하게 먹을 수 있는 한 끼 얘기라 더 공감돼요. 저도 혼밥할 때 자리 편하고 충전 가능한 곳이면 자주 가게 되더라고요.',
    '부담 없이 들를 수 있는 식당이 결국 오래 기억나는 것 같아요. 메뉴보다도 편하게 먹고 나올 수 있는 분위기가 중요하더라고요.',
    '혼자 먹을 때 눈치 안 보이는 자리 얘기가 현실적이네요. 저도 그런 곳은 다음에 또 가게 돼요.',
  ],
  '31750109': [
    '반려견 관리도 막상 해보면 작은 체크가 제일 중요하더라고요. 발톱이나 양치처럼 미루기 쉬운 것부터 챙기게 돼요.',
    '초보자일수록 이런 기본 관리 목록이 있으면 훨씬 덜 놓치는 것 같아요. 귀랑 눈 상태도 매일 보면 변화가 보이더라고요.',
    '저도 처음엔 산책만 신경 썼는데 생활 관리가 더 중요하다는 걸 나중에 알았어요. 꾸준히 보는 습관이 답인 것 같아요.',
  ],
  '31750108': [
    '생활 정보는 한 번에 다 바꾸려고 하면 금방 지치더라고요. 말씀처럼 하나씩 적용해보는 게 제일 오래 가는 것 같아요.',
    '정리법도 거창하게 시작하면 오히려 안 하게 돼서, 작은 기준부터 정해두는 방식이 현실적이네요.',
  ],
  '31750104': [
    '가벼운 일상 얘기라도 남겨두면 나중에 다시 볼 때 은근 기분이 좋더라고요. 부담 없이 나누는 게 핵심인 것 같아요.',
    '사소한 하루 이야기가 오히려 대화 시작하기 좋다는 말 공감돼요. 너무 거창하지 않아서 더 편하게 보게 되네요.',
  ],
};

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
};

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const readUiRows = (path: string): UiVerifyRow[] => {
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as UiVerifyArtifact;
  return parsed.rows || [];
};

const pickAccount = (
  accounts: NaverAccount[],
  usedAccountIds: Set<string>,
  writerAccountId: string,
  offset: number,
): NaverAccount | undefined => {
  const commenterAccounts = accounts.filter(
    (account) =>
      account.role === 'commenter' &&
      account.id !== writerAccountId &&
      !usedAccountIds.has(account.id),
  );
  const fallbackAccounts = accounts.filter(
    (account) => account.id !== writerAccountId && !usedAccountIds.has(account.id),
  );
  const pool = commenterAccounts.length > 0 ? commenterAccounts : fallbackAccounts;
  if (pool.length === 0) return undefined;
  return pool[offset % pool.length];
};

const normalizeContent = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const pickContent = (
  candidates: string[],
  usedContents: Set<string>,
  offset: number,
): string | undefined => {
  for (let index = 0; index < candidates.length; index += 1) {
    const content = candidates[(offset + index) % candidates.length];
    const normalized = normalizeContent(content);
    if (!usedContents.has(normalized)) return content;
  }

  return undefined;
};

const writeArtifact = (payload: unknown): string => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(
    outputDir,
    `new-cafe-comment-topup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
};

const main = async (): Promise<void> => {
  const uiVerifyPath = getArgValue('--ui-verify', DEFAULT_UI_VERIFY);
  const minTotal = Number(getArgValue('--min-total', '10'));
  const delayStepMs = Number(getArgValue('--delay-step-ms', '45000'));
  const excludeAccountIds = new Set(
    splitCsv(getArgValue('--exclude-account-ids', process.env.EXCLUDE_ACCOUNT_IDS || '')),
  );
  const dryRun = args.includes('--dry-run');

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const accounts = await getAllAccounts(user.userId);
  const uiRows = readUiRows(uiVerifyPath);
  const rescheduleToken = `new_cafe_topup_${Date.now().toString(36)}`;
  const results: Array<Record<string, unknown>> = [];
  let jobIndex = 0;

  for (const row of uiRows) {
    const uiTotal = Number(row.uiTotalCount || 0);
    const shortage = Math.max(0, minTotal - uiTotal);
    if (shortage === 0) continue;

    const article = await PublishedArticle.findOne(
      { cafeId: row.cafeId, articleId: row.articleId },
      { writerAccountId: 1, keyword: 1, comments: 1 },
    ).lean();

    if (!article) {
      results.push({ ...row, status: 'skipped', reason: 'db article not found', shortage });
      continue;
    }

    const candidates = TOPUP_COMMENTS[row.cafeId] || [];
    const usedAccountIds = new Set(
      (article.comments || [])
        .filter((comment) => comment.type === 'comment')
        .map((comment) => comment.accountId),
    );
    for (const accountId of excludeAccountIds) {
      usedAccountIds.add(accountId);
    }
    const usedContents = new Set(
      (article.comments || []).map((comment) => normalizeContent(comment.content)),
    );
    const jobs: Array<Record<string, unknown>> = [];

    for (let index = 0; index < shortage; index += 1) {
      const account = pickAccount(accounts, usedAccountIds, article.writerAccountId, index);
      const content = pickContent(candidates, usedContents, index);
      if (!account || !content) {
        results.push({
          ...row,
          status: 'partial',
          reason: 'account or content missing',
          shortage,
          jobs,
        });
        break;
      }

      usedAccountIds.add(account.id);
      usedContents.add(normalizeContent(content));
      const delayMs = jobIndex * delayStepMs;
      const jobData: CommentJobData = {
        type: 'comment',
        accountId: account.id,
        userId: user.userId,
        cafeId: row.cafeId,
        articleId: row.articleId,
        content,
        keyword: article.keyword,
        rescheduleToken,
      };

      if (!dryRun) await addTaskJob(account.id, jobData, delayMs);
      jobs.push({
        type: 'comment',
        accountId: account.id,
        delayMs,
        content,
      });
      jobIndex += 1;
    }

    results.push({
      cafeName: row.cafeName,
      cafeId: row.cafeId,
      articleId: row.articleId,
      articleUrl: row.articleUrl,
      beforeUiTotal: uiTotal,
      shortage,
      status: dryRun ? 'dry-run' : 'enqueued',
      jobs,
    });
  }

  const outputPath = writeArtifact({
    generatedAt: new Date().toISOString(),
    uiVerifyPath,
    minTotal,
    delayStepMs,
    dryRun,
    rescheduleToken,
    totalJobs: jobIndex,
    results,
  });

  console.log(`topup ${dryRun ? 'dry-run' : 'enqueue'} complete`);
  console.log(`jobs: ${jobIndex}`);
  console.log(`artifact: ${outputPath}`);
  console.log(JSON.stringify(results, null, 2));
};

main()
  .catch((error) => {
    console.error('topup-new-cafe-comments failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeAllQueues();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
