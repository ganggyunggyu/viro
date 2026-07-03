import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

dotenv.config({ path: '.env.local' });

interface MembershipProgressEvent {
  event?: string;
  accountId?: string;
  cafeId?: string;
  cafeSlug?: string;
  status?: string;
}

interface ReadyMembershipCafe {
  cafeId?: string;
  cafeSlug?: string;
  status?: string;
}

interface ReadyMembershipAccount {
  accountId?: string;
  cafeIds?: string[];
  cafes?: ReadyMembershipCafe[];
}

interface ReadyMembershipJson {
  ready?: Array<{ accountId?: string; cafeId?: string; cafeSlug?: string; status?: string }>;
  readyByAccount?: ReadyMembershipAccount[];
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

const hasFlag = (name: string): boolean => args.includes(name);

const findLatestProgressPath = (): string => {
  const outputDir = join(process.cwd(), 'outputs');
  const candidates = readdirSync(outputDir)
    .filter((name) => name.startsWith('work-cafe-membership-ensure-'))
    .flatMap((dirName) => {
      const dirPath = join(outputDir, dirName);
      try {
        return readdirSync(dirPath)
          .filter((name) => /^progress-.*\.jsonl$/.test(name))
          .map((name) => join(dirPath, name));
      } catch {
        return [];
      }
    })
    .map((path) => ({ path, mtimeMs: statSync(path).mtimeMs }));

  if (candidates.length === 0) throw new Error('membership progress jsonl not found');
  return candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)[0].path;
};

const parseProgressEvents = (progressPath: string, startLine: number): MembershipProgressEvent[] => {
  const text = readFileSync(progressPath, 'utf-8');
  const lines = text.split(/\r?\n/).filter(Boolean).slice(startLine);
  return lines.flatMap((line) => {
    try {
      return [JSON.parse(line) as MembershipProgressEvent];
    } catch {
      return [];
    }
  });
};

const countProgressLines = (progressPath: string): number =>
  readFileSync(progressPath, 'utf-8').split(/\r?\n/).filter(Boolean).length;

const addReadyPair = (
  readyPairs: Set<string>,
  readyPairLabels: Map<string, string>,
  accountId: string | undefined,
  cafeId: string | undefined,
  label: string,
): void => {
  if (!accountId || !cafeId) return;

  const pairKey = `${accountId}:${cafeId}`;
  readyPairs.add(pairKey);
  readyPairLabels.set(pairKey, label);
};

const addReadyJsonPairs = (
  readyJsonPath: string,
  readyPairs: Set<string>,
  readyPairLabels: Map<string, string>,
): void => {
  if (!readyJsonPath) return;

  const readyJson = JSON.parse(readFileSync(readyJsonPath, 'utf-8')) as ReadyMembershipJson;

  for (const item of readyJson.ready || []) {
    addReadyPair(
      readyPairs,
      readyPairLabels,
      item.accountId,
      item.cafeId,
      `${item.accountId} ${item.cafeSlug || item.cafeId} ${item.status || 'ready'}`,
    );
  }

  for (const account of readyJson.readyByAccount || []) {
    for (const cafe of account.cafes || []) {
      addReadyPair(
        readyPairs,
        readyPairLabels,
        account.accountId,
        cafe.cafeId,
        `${account.accountId} ${cafe.cafeSlug || cafe.cafeId} ${cafe.status || 'ready'}`,
      );
    }

    for (const cafeId of account.cafeIds || []) {
      addReadyPair(readyPairs, readyPairLabels, account.accountId, cafeId, `${account.accountId} ${cafeId} ready`);
    }
  }
};

const promoteReadyPairDelayedComments = async (
  queue: Queue,
  readyPairs: Set<string>,
): Promise<Map<string, number>> => {
  const delayedJobs = await queue.getDelayed(0, 20_000);
  const promotedByPair = new Map<string, number>();

  for (const job of delayedJobs) {
    const data = job.data as { type?: string; accountId?: string; cafeId?: string };
    if (data.type !== 'comment') continue;
    if (!data.accountId || !data.cafeId) continue;

    const pairKey = `${data.accountId}:${data.cafeId}`;
    if (!readyPairs.has(pairKey)) continue;

    try {
      await job.promote();
      promotedByPair.set(pairKey, (promotedByPair.get(pairKey) || 0) + 1);
    } catch {
      // Job may have been claimed between getDelayed and promote.
    }
  }

  return promotedByPair;
};

const main = async (): Promise<void> => {
  const progressPath = getArgValue('--progress', findLatestProgressPath());
  const readyJsonPath = getArgValue('--ready-json', '');
  const intervalMs = Number(getArgValue('--interval-ms', '5000'));
  const once = hasFlag('--once');
  const includeExisting = !hasFlag('--tail-only');
  const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379/1', {
    maxRetriesPerRequest: null,
  });
  const queue = new Queue('task_global', { connection });
  const seen = new Set<string>();
  const readyPairs = new Set<string>();
  const readyPairLabels = new Map<string, string>();
  let processedLines = includeExisting ? 0 : countProgressLines(progressPath);

  addReadyJsonPairs(readyJsonPath, readyPairs, readyPairLabels);
  console.log(`[MEMBERSHIP-PROMOTE] watching ${progressPath}`);
  if (readyJsonPath) console.log(`[MEMBERSHIP-PROMOTE] ready json ${readyJsonPath} pairs=${readyPairs.size}`);

  const tick = async (): Promise<void> => {
    const events = parseProgressEvents(progressPath, processedLines);
    processedLines += events.length;

    for (const event of events) {
      if (event.event !== 'membership-result') continue;
      if (!event.accountId || !event.cafeId) continue;
      if (event.status !== 'joined' && event.status !== 'alreadyMember') continue;

      const key = `${event.accountId}:${event.cafeId}:${event.status}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const pairKey = `${event.accountId}:${event.cafeId}`;
      readyPairs.add(pairKey);
      readyPairLabels.set(pairKey, `${event.accountId} ${event.cafeSlug || event.cafeId} ${event.status}`);
    }

    const promotedByPair = await promoteReadyPairDelayedComments(queue, readyPairs);
    for (const [pairKey, promoted] of promotedByPair.entries()) {
      console.log(`[MEMBERSHIP-PROMOTE] ${readyPairLabels.get(pairKey) || pairKey} promoted=${promoted}`);
    }
  };

  await tick();
  if (once) {
    await queue.close();
    await connection.quit();
    return;
  }

  setInterval(() => {
    tick().catch((error) => {
      console.error('[MEMBERSHIP-PROMOTE] tick failed:', error instanceof Error ? error.message : error);
    });
  }, intervalMs);
};

main().catch((error) => {
  console.error('[MEMBERSHIP-PROMOTE] failed:', error);
  process.exit(1);
});
