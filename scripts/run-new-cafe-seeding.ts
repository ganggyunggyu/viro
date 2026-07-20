import mongoose from "mongoose";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { User } from "../src/shared/models/user";
import { Account } from "../src/shared/models/account";
import { Cafe } from "../src/shared/models/cafe";
import { addTaskJob, closeAllQueues } from "../src/shared/lib/queue";
import type {
  PostJobData,
  ViralCommentsData,
  ViralCommentItem,
} from "../src/shared/lib/queue/types";
import { parseViralResponse } from "../src/features/viral/viral-parser";

type ContentSource =
  | "blog-filler"
  | "blog-filler-pet"
  | "blog-filler-restaurant"
  | "hanryeo";

interface SeedPlanItem {
  order: number;
  theme: string;
  cafeName: string;
  cafeAddress: string;
  cafeUrl: string;
  cafeId: string;
  menuId: string;
  category: string;
  ownerAccountId: string;
  contentSource: ContentSource;
  endpoint: string;
  service: string;
  keyword: string;
  time?: string;
  commenterAccountIds?: string[];
}

interface GeneratedManuscript {
  title: string;
  body: string;
  rawContent: string;
  comments?: ViralCommentsData;
}

interface RunArtifactRow {
  cafeId: string;
  title?: string;
  body?: string;
  keyword?: string;
  generatedComments?: ViralCommentItem[];
}

interface CommentGenerationOptions {
  min: number;
  max: number;
  includeReplies: boolean;
}

const DEFAULT_PLAN = "outputs/new-cafe-seeding-plan-2026-07-02.json";
const LOGIN_ID = process.env.LOGIN_ID || "21lab";
const TEXT_GEN_HUB_URL =
  process.env.TEXT_GEN_HUB_URL ||
  process.env.CONTENT_API_URL ||
  "http://localhost:8000";
const COMMENT_GEN_URL =
  process.env.COMMENT_GEN_API_URL ||
  process.env.TEXT_GEN_HUB_URL ||
  process.env.CONTENT_API_URL ||
  "http://localhost:8000";
const RESCHEDULE_TOKEN =
  process.env.SCHEDULE_RESCHEDULE_TOKEN || `new_cafe_seed_${getDateToken()}`;

const args = process.argv.slice(2);

function getDateToken(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${date}`;
}

const hasFlag = (flag: string): boolean => args.includes(flag);

const getArgValue = (name: string, fallback = ""): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
};

const splitCsv = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const readPlan = (path: string): SeedPlanItem[] => {
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`plan must be an array: ${path}`);
  }
  return parsed as SeedPlanItem[];
};

const readGeneratedRows = (path: string): Map<string, GeneratedManuscript> => {
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as { rows?: RunArtifactRow[] };
  const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
  const rowMap = new Map<string, GeneratedManuscript>();

  for (const row of rows) {
    if (!row.cafeId || !row.title || !row.body) continue;
    const comments = Array.isArray(row.generatedComments)
      ? row.generatedComments.filter((comment) => comment.content)
      : [];
    rowMap.set(row.cafeId, {
      title: row.title,
      body: row.body,
      rawContent: [row.title, "", row.body].join("\n"),
      comments: comments.length > 0 ? { comments } : undefined,
    });
  }

  return rowMap;
};

const stripMarkdown = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`(.+?)`/g, "$1")
    .trim();

const parseGeneratedContent = (content: string, fallbackTitle: string): GeneratedManuscript => {
  const parsed = parseViralResponse(content);
  if (parsed?.title && parsed.body) {
    return {
      title: parsed.title,
      body: parsed.body,
      rawContent: content,
      comments: parsed.comments.length ? { comments: parsed.comments } : undefined,
    };
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title = stripMarkdown(lines[0] || fallbackTitle).slice(0, 80);
  const body = stripMarkdown(lines.slice(1).join("\n\n") || content);

  if (!title || !body) {
    throw new Error("generated content parse failed");
  }

  return { title, body, rawContent: content };
};

const postJson = async <TResponse>(
  url: string,
  body: Record<string, unknown>,
): Promise<TResponse> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${url} failed: ${response.status} ${errorBody.slice(0, 300)}`);
  }

  return response.json() as Promise<TResponse>;
};

const generateManuscript = async (item: SeedPlanItem): Promise<GeneratedManuscript> => {
  const result = await postJson<{ content?: string }>(
    `${TEXT_GEN_HUB_URL}${item.endpoint}`,
    {
      service: item.service,
      keyword: item.keyword,
      ref: "",
      category: item.theme === "건강" ? "건강" : item.theme,
    },
  );

  if (!result.content) {
    throw new Error(`content missing: ${item.cafeName}`);
  }

  return parseGeneratedContent(result.content, item.keyword);
};

const generateCommentItems = async (
  keyword: string,
  options: CommentGenerationOptions,
): Promise<ViralCommentsData> => {
  const comments: ViralCommentItem[] = [];
  const totalCount = getRandomInt(options.min, options.max);
  const mainCommentCount = options.includeReplies
    ? Math.max(4, Math.ceil(totalCount * 0.65))
    : totalCount;
  const replyCount = Math.max(0, totalCount - mainCommentCount);

  for (let index = 1; index <= mainCommentCount; index += 1) {
    const result = await postJson<{ success: boolean; comment: string }>(
      `${COMMENT_GEN_URL}/generate/comment`,
      { keyword },
    );
    if (result.success && result.comment.trim()) {
      comments.push({
        type: "comment",
        index,
        content: result.comment.replace(/\s+/g, " ").trim(),
      });
    }
  }

  if (options.includeReplies && comments.length > 0) {
    const replyTypes: Array<ViralCommentItem["type"]> = [
      "author_reply",
      "commenter_reply",
      "other_reply",
    ];

    for (let offset = 0; offset < replyCount; offset += 1) {
      const parentComment = comments[offset % comments.length];
      const result = await postJson<{ success: boolean; comment: string }>(
        `${COMMENT_GEN_URL}/generate/recomment`,
        {
          parent_comment: parentComment.content,
          keyword,
        },
      );

      if (result.success && result.comment.trim()) {
        comments.push({
          type: replyTypes[offset % replyTypes.length],
          index: mainCommentCount + offset + 1,
          parentIndex: parentComment.index,
          content: result.comment.replace(/\s+/g, " ").trim(),
        });
      }
    }
  }

  return { comments };
};

const getRandomInt = (min: number, max: number): number => {
  const normalizedMin = Math.ceil(Math.min(min, max));
  const normalizedMax = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (normalizedMax - normalizedMin + 1)) + normalizedMin;
};

const resolveCommenterAccountIds = (
  item: SeedPlanItem,
  commenterIdsFromArg: string[],
): string[] | undefined => {
  if (item.commenterAccountIds && item.commenterAccountIds.length > 0) {
    return item.commenterAccountIds;
  }
  if (commenterIdsFromArg.length > 0) {
    return commenterIdsFromArg;
  }
  return undefined;
};

const getDelayMs = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const [hour, minute] = timeStr.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime() && hour < 6) {
    target.setDate(target.getDate() + 1);
  }
  return Math.max(0, target.getTime() - now.getTime());
};

const upsertCafe = async (userId: string, item: SeedPlanItem): Promise<void> => {
  await Cafe.findOneAndUpdate(
    { userId, cafeId: item.cafeId },
    {
      $set: {
        userId,
        cafeId: item.cafeId,
        cafeUrl: item.cafeUrl,
        menuId: item.menuId,
        name: item.cafeName,
        categories: [item.category],
        categoryMenuIds: { [item.category]: item.menuId },
        categoryAliases: {
          [item.theme]: item.category,
          [item.contentSource]: item.category,
        },
        commentableMenuIds: [Number(item.menuId)],
        isActive: true,
      },
      $setOnInsert: { isDefault: false },
    },
    { upsert: true, new: true },
  );
};

const writeRunArtifact = (payload: unknown): string => {
  const outputDir = join(process.cwd(), "outputs");
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = join(outputDir, `new-cafe-seeding-run-${timestamp}.json`);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");
  return outputPath;
};

const main = async (): Promise<void> => {
  const planPath = getArgValue("--plan", DEFAULT_PLAN);
  const fromRunArtifact = getArgValue("--from-run-artifact", "");
  const syncCafes = hasFlag("--sync-cafes");
  const generate = hasFlag("--generate") || hasFlag("--enqueue");
  const enqueue = hasFlag("--enqueue");
  const skipComments = hasFlag("--skip-comments");
  const pregenerateComments = hasFlag("--pregenerate-comments");
  const commentCount = Number(getArgValue("--comment-count", "3"));
  const commentMin = Number(getArgValue("--comment-min", String(commentCount)));
  const commentMax = Number(getArgValue("--comment-max", String(commentCount)));
  const includeReplies = hasFlag("--include-replies");
  const commenterIdsFromArg = splitCsv(
    getArgValue("--commenter-ids", process.env.COMMENTER_ACCOUNT_IDS || ""),
  );

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing");
  }

  const plan = readPlan(planPath);
  const generatedRows = fromRunArtifact ? readGeneratedRows(fromRunArtifact) : new Map();
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const ownerIds = plan.map((item) => item.ownerAccountId);
  const allNeededAccountIds = [...new Set([...ownerIds, ...commenterIdsFromArg])];
  const accounts = await Account.find({
    userId: user.userId,
    accountId: { $in: allNeededAccountIds },
    isActive: true,
  })
    .select("accountId nickname role isActive")
    .lean();
  const accountIds = new Set(accounts.map((account) => account.accountId));
  const missingAccountIds = allNeededAccountIds.filter((accountId) => !accountIds.has(accountId));
  if (missingAccountIds.length > 0) {
    throw new Error(`active account missing: ${missingAccountIds.join(", ")}`);
  }

  const runRows: Array<Record<string, unknown>> = [];
  let enqueued = 0;

  for (const item of plan) {
    if (syncCafes) {
      await upsertCafe(user.userId, item);
    }

    let manuscript: GeneratedManuscript | undefined;
    const artifactManuscript = generatedRows.get(item.cafeId);
    if (artifactManuscript) {
      manuscript = artifactManuscript;
    } else if (generate) {
      manuscript = await generateManuscript(item);
      if (pregenerateComments && !skipComments) {
        const generatedComments = await generateCommentItems(
          item.keyword,
          {
            min: commentMin,
            max: commentMax,
            includeReplies,
          },
        );
        if (generatedComments.comments.length > 0) {
          manuscript.comments = generatedComments;
        }
      }
    }

    if (enqueue) {
      if (!manuscript) throw new Error(`manuscript missing: ${item.cafeName}`);
      const commenterAccountIds = skipComments
        ? []
        : resolveCommenterAccountIds(item, commenterIdsFromArg);
      const jobData: PostJobData = {
        type: "post",
        accountId: item.ownerAccountId,
        userId: user.userId,
        cafeId: item.cafeId,
        menuId: item.menuId,
        subject: manuscript.title,
        content: manuscript.body,
        rawContent: manuscript.rawContent,
        keyword: item.keyword,
        category: item.category,
        service: item.contentSource,
        postType: "daily",
        rescheduleToken: RESCHEDULE_TOKEN,
        postOptions: {
          allowComment: true,
          allowScrap: true,
          allowCopy: false,
          useAutoSource: false,
          useCcl: false,
          cclCommercial: "disallow",
          cclModify: "disallow",
        },
        ...(skipComments && { skipComments: true }),
        ...(commenterAccountIds !== undefined && { commenterAccountIds }),
        ...(!skipComments && manuscript.comments && { viralComments: manuscript.comments }),
      };

      await addTaskJob(item.ownerAccountId, jobData, getDelayMs(item.time));
      enqueued += 1;
    }

    runRows.push({
      order: item.order,
      cafeName: item.cafeName,
      cafeId: item.cafeId,
      ownerAccountId: item.ownerAccountId,
      contentSource: item.contentSource,
      endpoint: item.endpoint,
      keyword: item.keyword,
      menuId: item.menuId,
      syncedCafe: syncCafes,
      generated: Boolean(manuscript),
      enqueued: enqueue,
      title: manuscript?.title,
      body: manuscript?.body,
      bodyLength: manuscript?.body.length,
      commentMode: skipComments
        ? "skip"
        : pregenerateComments
          ? "pregenerated"
          : "handler",
      commenterAccountIds: skipComments
        ? []
        : resolveCommenterAccountIds(item, commenterIdsFromArg) || "handler-default",
      generatedCommentCount: manuscript?.comments?.comments.length || 0,
      generatedComments: manuscript?.comments?.comments.map((comment) => ({
        type: comment.type,
        index: comment.index,
        parentIndex: comment.parentIndex,
        content: comment.content,
      })) || [],
    });
  }

  const outputPath = writeRunArtifact({
    generatedAt: new Date().toISOString(),
    loginId: LOGIN_ID,
    planPath,
    fromRunArtifact,
    syncCafes,
    generate,
    enqueue,
    rescheduleToken: RESCHEDULE_TOKEN,
    total: plan.length,
    enqueued,
    rows: runRows,
  });

  console.log(`new cafe seeding complete`);
  console.log(`plan: ${planPath}`);
  console.log(`syncCafes: ${syncCafes} / generate: ${generate} / enqueue: ${enqueue}`);
  console.log(`enqueued: ${enqueued}/${plan.length}`);
  console.log(`artifact: ${outputPath}`);
};

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("run-new-cafe-seeding failed:", error);
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
