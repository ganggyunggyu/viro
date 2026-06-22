/**
 * One-off Chanel schedule for accounts that were live-verified as write-capable.
 *
 * Usage:
 *   DRY_RUN=true node scripts/run-with-project-root.mjs tsx --env-file=.env.local work/schedule-chanel-approved-accounts.ts
 *   node scripts/run-with-project-root.mjs tsx --env-file=.env.local work/schedule-chanel-approved-accounts.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { addTaskJob, closeAllQueues, getTaskQueue } from '../src/shared/lib/queue';
import { generateViralContent } from '../src/shared/api/content-api';
import { buildShortDailyPrompt } from '../src/features/viral/prompts/build-short-daily-prompt';
import { parseViralResponse } from '../src/features/viral/viral-parser';
import type { PostJobData, TaskJobData } from '../src/shared/lib/queue/types';

type PostType = 'daily' | 'daily-ad';

interface ScheduleItem {
  cafeName: string;
  cafeId: string;
  keyword: string;
  category: string;
  type: PostType;
  accountId: string;
  scheduledAt: Date;
}

interface ScheduledRow {
  recordedAtKst: string;
  scheduledAtKst: string;
  publishedAtKst: string;
  cafeName: string;
  cafeId: string;
  postType: PostType;
  keyword: string;
  accountId: string;
  subject: string;
  category: string;
  menuId: string;
  rescheduleToken: string;
  jobId: string;
  queueState: string;
  status: string;
  articleId: string;
  articleUrl: string;
  failedReason: string;
}

interface Summary {
  generatedAt: string;
  date: string;
  token: string;
  dryRun: boolean;
  rows: ScheduledRow[];
  verification: {
    total: number;
    byType: Record<PostType, number>;
    byState: Record<string, number>;
    firstScheduledAtKst: string;
    lastScheduledAtKst: string;
    gapMinutes: number[];
    minGapMinutes: number;
    maxGapMinutes: number;
    existingPendingForCafe: number;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;
const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const SCHEDULE_MODEL = process.env.SCHEDULE_MODEL || 'deepseek-v4-flash';
const DRY_RUN = process.env.DRY_RUN === 'true';
const TOKEN =
  process.env.SCHEDULE_RESCHEDULE_TOKEN ||
  `chanel_direct_${new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replaceAll('-', '')}_${new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(':', '')}`;

const CAFE = {
  name: '샤넬오픈런',
  cafeId: '25460974',
  category: '_ 일상샤반사 📆',
};

const APPROVED_ACCOUNT_IDS = [
  'bigfish773',
  'dhtksk1p',
  'dq1h3bjy',
  'eghfsa5478',
  'h9ag469z',
  'laghunter8',
  'q9v3m7a2',
];

const PLAN_INPUTS: Array<Omit<ScheduleItem, 'scheduledAt' | 'cafeName' | 'cafeId' | 'category'>> = [
  {
    type: 'daily-ad',
    keyword: '샤넬 25 스몰 블랙 월요일 오전 착샷만 계속 저장 중',
    accountId: 'bigfish773',
  },
  {
    type: 'daily',
    keyword: '월요일 아침 커피 마시면서 샤넬 앱 신상 사진 다시 보는 중',
    accountId: 'dhtksk1p',
  },
  {
    type: 'daily-ad',
    keyword: '샤넬 클래식 미디움 캐비어 블랙 월요일 점심에도 가격 다시 보는 중',
    accountId: 'dq1h3bjy',
  },
  {
    type: 'daily',
    keyword: '점심 먹고 백화점 쇼윈도 사진 정리하다가 시간 다 갔어요',
    accountId: 'eghfsa5478',
  },
  {
    type: 'daily-ad',
    keyword: '샤넬 코코핸들 스몰 베이지 월요일 오후 매장 재고 궁금함',
    accountId: 'h9ag469z',
  },
  {
    type: 'daily',
    keyword: '퇴근길 지하철에서 샤넬 스카프 코디 저장만 계속 하는 중',
    accountId: 'laghunter8',
  },
  {
    type: 'daily-ad',
    keyword: '샤넬 미니 플랩 블랙 램스킨 월요일 저녁 위시리스트 정리 중',
    accountId: 'q9v3m7a2',
  },
  {
    type: 'daily',
    keyword: '월요일 저녁 넷플릭스 틀어놓고 미니백 후기 보는 중',
    accountId: 'bigfish773',
  },
  {
    type: 'daily-ad',
    keyword: '샤넬 보이백 스몰 블랙 월요일 밤 체인 길이 후기 찾아보는 중',
    accountId: 'dq1h3bjy',
  },
  {
    type: 'daily',
    keyword: '자기 전 옷장 정리하다가 주말 코디 생각만 많아졌네요',
    accountId: 'laghunter8',
  },
];

const CSV_COLUMNS: Array<keyof ScheduledRow> = [
  'recordedAtKst',
  'scheduledAtKst',
  'publishedAtKst',
  'cafeName',
  'cafeId',
  'postType',
  'keyword',
  'accountId',
  'subject',
  'category',
  'menuId',
  'rescheduleToken',
  'jobId',
  'queueState',
  'status',
  'articleId',
  'articleUrl',
  'failedReason',
];

const kstParts = (date: Date): Record<string, string> => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

const formatKst = (date: Date): string => {
  const p = kstParts(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
};

const formatKstDate = (date: Date): string => {
  const p = kstParts(date);
  return `${p.year}-${p.month}-${p.day}`;
};

const formatKstTime = (date: Date): string => {
  const p = kstParts(date);
  return `${p.hour}:${p.minute}`;
};

const getKstMidnightUtcMs = (date: Date): number => {
  const p = kstParts(date);
  return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), -9, 0, 0, 0);
};

const buildScheduleTimes = (count: number): Date[] => {
  const now = new Date();
  const start = new Date(now.getTime() + 34 * 60 * 1000);
  start.setSeconds(0, 0);

  const todayKstMidnightUtcMs = getKstMidnightUtcMs(now);
  let end = new Date(todayKstMidnightUtcMs + 22 * 60 * 60 * 1000 + 47 * 60 * 1000);

  if (end.getTime() <= start.getTime() + (count - 1) * 7 * 60 * 1000) {
    end = new Date(start.getTime() + (count - 1) * 11 * 60 * 1000);
  }

  const weights = [76, 82, 73, 91, 68, 86, 79, 97, 64];
  const totalWeight = weights.slice(0, count - 1).reduce((sum, weight) => sum + weight, 0);
  const spanMs = end.getTime() - start.getTime();

  const times = [start];
  let elapsed = 0;
  for (let i = 0; i < count - 1; i += 1) {
    elapsed += weights[i];
    const raw = start.getTime() + Math.round((spanMs * elapsed) / totalWeight);
    const rounded = Math.round(raw / (60 * 1000)) * 60 * 1000;
    times.push(new Date(rounded));
  }

  return times;
};

const parseTitle = (text: string): string => {
  const match = text.match(/\[제목\]\s*\n?([\s\S]*?)(?=\n\[본문\]|\[본문\])/);
  return match ? match[1].trim() : '';
};

const parseBody = (text: string): string => {
  const match = text.match(/\[본문\]\s*\n?([\s\S]*?)(?=\n\[댓글\]|\[댓글\]|$)/);
  return match ? match[1].trim() : '';
};

const csvEscape = (value: string): string => {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
};

const readExistingRows = (jsonPath: string): ScheduledRow[] => {
  if (!existsSync(jsonPath)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(jsonPath, 'utf-8')) as { rows?: ScheduledRow[] } | ScheduledRow[];
  if (Array.isArray(parsed)) {
    return parsed;
  }

  return parsed.rows || [];
};

const writeLedger = (summary: Summary): void => {
  const artifactsDir = path.join(process.cwd(), 'scripts', 'artifacts');
  mkdirSync(artifactsDir, { recursive: true });

  const jsonPath = path.join(artifactsDir, `cafe-publish-ledger-${summary.date}.json`);
  const csvPath = path.join(artifactsDir, `cafe-publish-ledger-${summary.date}.csv`);
  const existingRows = readExistingRows(jsonPath).filter(
    (row) => row.rescheduleToken !== summary.token,
  );
  const rows = [...existingRows, ...summary.rows];
  const mergedSummary = { ...summary, rows };

  writeFileSync(jsonPath, `${JSON.stringify(mergedSummary, null, 2)}\n`);
  writeFileSync(
    csvPath,
    [
      CSV_COLUMNS.join(','),
      ...rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(String(row[column] || ''))).join(',')),
    ].join('\n') + '\n',
  );
};

const countByType = (items: ScheduleItem[]): Record<PostType, number> => ({
  daily: items.filter(({ type }) => type === 'daily').length,
  'daily-ad': items.filter(({ type }) => type === 'daily-ad').length,
});

const getGapMinutes = (items: ScheduleItem[]): number[] =>
  items.slice(1).map((item, index) =>
    Math.round((item.scheduledAt.getTime() - items[index].scheduledAt.getTime()) / 60000),
  );

const listRelevantJobs = async (
  accountIds: string[],
  cafeId: string,
): Promise<{ existingPendingForCafe: number; tokenStates: Record<string, number> }> => {
  const tokenStates: Record<string, number> = {};
  let existingPendingForCafe = 0;

  for (const accountId of accountIds) {
    const queue = getTaskQueue(accountId);
    const jobs = await queue.getJobs(['waiting', 'delayed', 'active'], 0, 500);

    for (const job of jobs) {
      const data = job.data as TaskJobData;
      if (data.type !== 'post' || data.cafeId !== cafeId) {
        continue;
      }

      existingPendingForCafe += 1;
      if (data.rescheduleToken === TOKEN) {
        const state = await job.getState();
        tokenStates[state] = (tokenStates[state] || 0) + 1;
      }
    }
  }

  return { existingPendingForCafe, tokenStates };
};

const buildPostOptions = (type: PostType): PostJobData['postOptions'] | undefined => {
  if (type === 'daily') {
    return undefined;
  }

  return {
    allowComment: false,
    allowScrap: true,
    allowCopy: false,
    useAutoSource: false,
    useCcl: false,
    cclCommercial: 'disallow',
    cclModify: 'disallow',
  };
};

const main = async (): Promise<void> => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI missing');
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) {
    throw new Error(`user not found: ${LOGIN_ID}`);
  }

  const cafe = await Cafe.findOne({
    userId: user.userId,
    cafeId: CAFE.cafeId,
    name: CAFE.name,
    isActive: true,
  }).lean();
  if (!cafe) {
    throw new Error(`cafe not found: ${CAFE.name}(${CAFE.cafeId})`);
  }

  const accounts = await Account.find({
    userId: user.userId,
    accountId: { $in: APPROVED_ACCOUNT_IDS },
    isActive: true,
  }).lean();
  const accountMap = new Map(accounts.map((account) => [account.accountId, account]));
  const missingAccountIds = APPROVED_ACCOUNT_IDS.filter((accountId) => !accountMap.has(accountId));
  if (missingAccountIds.length > 0) {
    throw new Error(`DB active account missing: ${missingAccountIds.join(', ')}`);
  }

  const times = buildScheduleTimes(PLAN_INPUTS.length);
  const schedule: ScheduleItem[] = PLAN_INPUTS.map((input, index) => ({
    ...input,
    cafeName: CAFE.name,
    cafeId: CAFE.cafeId,
    category: CAFE.category,
    scheduledAt: times[index],
  }));
  const typeCounts = countByType(schedule);
  if (typeCounts.daily !== 5 || typeCounts['daily-ad'] !== 5) {
    throw new Error(`planned count mismatch: ${JSON.stringify(typeCounts)}`);
  }

  const existingBefore = await listRelevantJobs(APPROVED_ACCOUNT_IDS, CAFE.cafeId);
  const gaps = getGapMinutes(schedule);
  const now = new Date();

  console.log('=== Chanel approved-account schedule ===');
  console.log(`dryRun=${DRY_RUN} token=${TOKEN} model=${SCHEDULE_MODEL}`);
  console.log(`user=${LOGIN_ID} cafe=${CAFE.name}(${CAFE.cafeId}) menuId=${cafe.menuId}`);
  console.log(`accounts=${APPROVED_ACCOUNT_IDS.join(', ')}`);
  console.log(`counts=${JSON.stringify(typeCounts)} existingPendingForCafe=${existingBefore.existingPendingForCafe}`);
  console.log(`first=${formatKst(schedule[0].scheduledAt)} last=${formatKst(schedule[schedule.length - 1].scheduledAt)}`);
  console.log(`gaps=${gaps.join(', ')} min=${Math.min(...gaps)} max=${Math.max(...gaps)}`);
  console.log('\n[PLAN]');
  for (const item of schedule) {
    console.log(
      `${formatKstTime(item.scheduledAt)} | ${item.type} | ${item.accountId} | ${item.keyword}`,
    );
  }

  const rows: ScheduledRow[] = [];

  for (const item of schedule) {
    const account = accountMap.get(item.accountId);
    if (!account) {
      throw new Error(`account not found after validation: ${item.accountId}`);
    }

    const delayMs = Math.max(0, item.scheduledAt.getTime() - Date.now());
    process.stdout.write(`\n[${formatKstTime(item.scheduledAt)}] ${item.accountId} ${item.type} generating... `);

    const prompt = buildShortDailyPrompt({ keyword: item.keyword, keywordType: 'own' });
    const { content } = await generateViralContent({ prompt, model: SCHEDULE_MODEL });
    const parsed = parseViralResponse(content);
    const subject = parsed?.title || parseTitle(content);
    const body = parsed?.body || parseBody(content);
    if (!subject || !body) {
      throw new Error(`content parse failed: ${item.keyword}`);
    }

    const jobData: PostJobData = {
      type: 'post',
      accountId: item.accountId,
      userId: user.userId,
      cafeId: item.cafeId,
      menuId: cafe.menuId,
      subject,
      content: body,
      rawContent: content,
      keyword: item.keyword,
      category: item.category,
      postType: item.type,
      skipComments: true,
      rescheduleToken: TOKEN,
      ...(buildPostOptions(item.type) ? { postOptions: buildPostOptions(item.type) } : {}),
    };

    let jobId = '';
    let queueState = 'planned';
    if (!DRY_RUN) {
      const job = await addTaskJob(item.accountId, jobData, delayMs);
      jobId = job?.id || '';
      queueState = job ? await job.getState() : 'duplicate-skipped';
    }

    rows.push({
      recordedAtKst: formatKst(new Date()),
      scheduledAtKst: formatKst(item.scheduledAt),
      publishedAtKst: '',
      cafeName: item.cafeName,
      cafeId: item.cafeId,
      postType: item.type,
      keyword: item.keyword,
      accountId: item.accountId,
      subject,
      category: item.category,
      menuId: cafe.menuId,
      rescheduleToken: TOKEN,
      jobId,
      queueState,
      status: DRY_RUN ? 'planned' : 'scheduled',
      articleId: '',
      articleUrl: '',
      failedReason: '',
    });
    console.log(`${DRY_RUN ? 'planned' : queueState} | ${subject}`);
  }

  const after = DRY_RUN
    ? existingBefore
    : await listRelevantJobs(APPROVED_ACCOUNT_IDS, CAFE.cafeId);
  const stateCounts = DRY_RUN ? { planned: rows.length } : after.tokenStates;

  const summary: Summary = {
    generatedAt: new Date().toISOString(),
    date: formatKstDate(now),
    token: TOKEN,
    dryRun: DRY_RUN,
    rows,
    verification: {
      total: rows.length,
      byType: typeCounts,
      byState: stateCounts,
      firstScheduledAtKst: formatKst(schedule[0].scheduledAt),
      lastScheduledAtKst: formatKst(schedule[schedule.length - 1].scheduledAt),
      gapMinutes: gaps,
      minGapMinutes: Math.min(...gaps),
      maxGapMinutes: Math.max(...gaps),
      existingPendingForCafe: existingBefore.existingPendingForCafe,
    },
  };

  if (!DRY_RUN) {
    writeLedger(summary);
  }

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary.verification, null, 2));
  if (!DRY_RUN) {
    console.log(`ledger: scripts/artifacts/cafe-publish-ledger-${summary.date}.json`);
    console.log(`ledger: scripts/artifacts/cafe-publish-ledger-${summary.date}.csv`);
  }
};

main()
  .then(async () => {
    try {
      await closeAllQueues();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('schedule-chanel-approved-accounts failed:', error);
    try {
      await closeAllQueues();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
