import mongoose from "mongoose";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { User } from "../src/shared/models/user";
import { Account } from "../src/shared/models/account";
import { Cafe } from "../src/shared/models/cafe";
import { addTaskJob } from "../src/shared/lib/queue";
import { getCafeWriterAccounts } from "../src/shared/config/cafe-account-policy";
import type { PostJobData, TaskJobData } from "../src/shared/lib/queue/types";
import type { NaverAccount } from "../src/shared/lib/account-manager";

const LOGIN_ID = process.env.LOGIN_ID || "21lab";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/1";
const APPLY = process.argv.includes("--apply");
const REPAIR = process.argv.includes("--repair");
const REMOVABLE_STATES = new Set(["waiting", "delayed", "paused", "prioritized"]);

type QueueJobState = "waiting" | "delayed" | "active" | "paused" | "prioritized";

interface InvalidPostJob {
  queueName: string;
  jobId: string;
  state: string;
  accountId: string;
  cafeId: string;
  cafeName: string;
  keyword: string;
  postType: string;
  subject: string;
  rescheduleToken: string;
  remainingDelayMs: number;
  reason: string;
  replacementAccountId: string;
}

const toNaverAccount = (account: {
  accountId: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  activityHours?: { start: number; end: number };
  restDays?: number[];
  dailyPostLimit?: number;
  personaId?: string;
  role?: "writer" | "commenter";
}): NaverAccount => ({
  id: account.accountId,
  password: account.password,
  nickname: account.nickname,
  isMain: account.isMain,
  activityHours: account.activityHours,
  restDays: account.restDays,
  dailyPostLimit: account.dailyPostLimit,
  personaId: account.personaId,
  role: account.role,
});

const getRemainingDelayMs = (job: { timestamp?: number; delay?: number }): number => {
  const timestamp = Number(job.timestamp || Date.now());
  const delay = Number(job.delay || 0);
  return Math.max(0, timestamp + delay - Date.now());
};

const sanitizeJob = (job: InvalidPostJob): InvalidPostJob => ({
  ...job,
  subject: job.subject.slice(0, 80),
});

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) {
    throw new Error(`user not found: ${LOGIN_ID}`);
  }

  const [accounts, cafes] = await Promise.all([
    Account.find({ userId: user.userId, isActive: true }).lean(),
    Cafe.find({ userId: user.userId, isActive: true }).lean(),
  ]);

  const activeAccountIds = new Set(accounts.map((account) => account.accountId));
  const activeWriterIds = new Set(
    accounts.filter((account) => account.role === "writer").map((account) => account.accountId),
  );
  const cafeNameById = new Map(cafes.map((cafe) => [cafe.cafeId, cafe.name]));
  const policyAccounts = accounts.map(toNaverAccount);
  const writerIdsByCafeId = new Map(
    cafes.map((cafe) => [
      cafe.cafeId,
      getCafeWriterAccounts(policyAccounts, cafe.cafeId).map((account) => account.id),
    ]),
  );
  const repairCursorByCafeId = new Map<string, number>();

  const getReplacementAccountId = (cafeId: string): string => {
    const writerIds = writerIdsByCafeId.get(cafeId) || [];
    if (writerIds.length === 0) {
      return "";
    }

    const cursor = repairCursorByCafeId.get(cafeId) || 0;
    repairCursorByCafeId.set(cafeId, cursor + 1);
    return writerIds[cursor % writerIds.length];
  };

  const getInvalidReason = (data: PostJobData): string => {
    const writerIds = writerIdsByCafeId.get(data.cafeId) || [];
    if (writerIds.length === 0) {
      return "cafe_writer_policy_empty";
    }

    if (!activeAccountIds.has(data.accountId)) {
      return "account_missing_or_inactive";
    }

    if (!activeWriterIds.has(data.accountId)) {
      return "account_not_writer_role";
    }

    if (!writerIds.includes(data.accountId)) {
      return "account_not_allowed_for_cafe";
    }

    return "";
  };

  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  const queueNames = (await redis.keys("bull:task_*:id"))
    .map((key) => key.replace("bull:", "").replace(":id", ""))
    .sort();

  const queues: Queue<TaskJobData>[] = [];
  const invalidJobs: InvalidPostJob[] = [];
  const states: QueueJobState[] = ["waiting", "delayed", "active", "paused", "prioritized"];

  for (const queueName of queueNames) {
    const queue = new Queue<TaskJobData>(queueName, { connection: redis });
    queues.push(queue);
    const jobs = await queue.getJobs(states, 0, -1, true);

    for (const job of jobs) {
      const data = job.data;
      if (data.type !== "post") {
        continue;
      }

      const reason = getInvalidReason(data);
      if (!reason) {
        continue;
      }

      const state = await job.getState();
      invalidJobs.push({
        queueName,
        jobId: String(job.id || ""),
        state,
        accountId: data.accountId,
        cafeId: data.cafeId,
        cafeName: cafeNameById.get(data.cafeId) || data.cafeId,
        keyword: data.keyword || "",
        postType: data.postType || "",
        subject: data.subject || "",
        rescheduleToken: data.rescheduleToken || "",
        remainingDelayMs: getRemainingDelayMs(job),
        reason,
        replacementAccountId: getReplacementAccountId(data.cafeId),
      });
    }
  }

  const applied = {
    removed: 0,
    repaired: 0,
    blockedActive: 0,
    blockedNoReplacement: 0,
    skippedDuplicateReplacement: 0,
    errors: [] as string[],
  };

  if (APPLY) {
    for (const invalidJob of invalidJobs) {
      const queue = queues.find((candidate) => candidate.name === invalidJob.queueName);
      const job = queue ? await queue.getJob(invalidJob.jobId) : null;
      if (!job) {
        continue;
      }

      const state = await job.getState();
      if (!REMOVABLE_STATES.has(state)) {
        applied.blockedActive++;
        continue;
      }

      const data = job.data as PostJobData;

      if (REPAIR && invalidJob.replacementAccountId) {
        const replacementData: PostJobData = {
          ...data,
          accountId: invalidJob.replacementAccountId,
        };
        const replacementJob = await addTaskJob(
          invalidJob.replacementAccountId,
          replacementData,
          invalidJob.remainingDelayMs,
        );

        if (replacementJob) {
          applied.repaired++;
        } else {
          applied.skippedDuplicateReplacement++;
        }
      } else {
        applied.blockedNoReplacement++;
      }

      try {
        await job.remove();
        applied.removed++;
      } catch (error) {
        applied.errors.push(
          `${invalidJob.queueName}/${invalidJob.jobId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  const output = {
    mode: APPLY ? "apply" : "dry-run",
    repair: REPAIR,
    loginId: LOGIN_ID,
    queueCount: queueNames.length,
    invalidCount: invalidJobs.length,
    invalidByReason: invalidJobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.reason] = (acc[job.reason] || 0) + 1;
      return acc;
    }, {}),
    invalidByCafe: invalidJobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.cafeName] = (acc[job.cafeName] || 0) + 1;
      return acc;
    }, {}),
    writerPolicy: cafes.map((cafe) => ({
      cafeName: cafe.name,
      cafeId: cafe.cafeId,
      writerAccountIds: writerIdsByCafeId.get(cafe.cafeId) || [],
    })),
    applied,
    invalidJobs: invalidJobs.map(sanitizeJob),
  };

  console.log(JSON.stringify(output, null, 2));

  for (const queue of queues) {
    await queue.close();
  }
  await redis.quit();
  await mongoose.disconnect();
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
