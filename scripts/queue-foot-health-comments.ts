/**
 * 발 건강 원고(아치깔창/족저근막염 신발/평발깔창) 발행분에 원고 댓글 10개를 그대로 등록한다.
 *
 *   npx tsx --env-file=.env --env-file=.env.local scripts/queue-foot-health-comments.ts \
 *     --plan outputs/foot-health-plan.json \
 *     --results outputs/foot-health-publish-results.json [--dry-run]
 *
 * 댓글 내용은 원고 파일에서 그대로 가져오므로 AI 생성을 타지 않는다(mode=fixed).
 */
import { readFileSync } from 'fs';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { ManualCommentJob } from '../src/shared/models';

const DELAY_MIN_MINUTES = 0.5;
const DELAY_MAX_MINUTES = 3;
const LOGIN_ID = process.env.LOGIN_ID || '21lab';

interface PlanJob {
  cafeId: string;
  cafeName: string;
  slug: string;
  keyword: string;
}

interface Plan {
  jobs: PlanJob[];
  comments: Record<string, string[]>;
}

interface PublishResult {
  keyword: string;
  cafeName: string;
  success: boolean;
  articleId?: number;
}

interface Args {
  planPath: string;
  resultsPath: string;
  dryRun: boolean;
}

const parseArgs = (): Args => {
  const tokens = process.argv.slice(2);
  const args: Args = {
    planPath: 'outputs/foot-health-plan.json',
    resultsPath: 'outputs/foot-health-publish-results.json',
    dryRun: false,
  };
  while (tokens.length > 0) {
    const token = tokens.shift();
    if (!token) continue;
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    const value = tokens.shift();
    if (!value) throw new Error(`${token} 값이 비었습니다`);
    if (token === '--plan') args.planPath = value;
    else if (token === '--results') args.resultsPath = value;
    else throw new Error(`알 수 없는 옵션: ${token}`);
  }
  return args;
};

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

const main = async (): Promise<void> => {
  const args = parseArgs();
  const plan = readJson<Plan>(args.planPath);
  const { results } = readJson<{ results: PublishResult[] }>(args.resultsPath);

  const jobByCafeName = new Map(plan.jobs.map((job) => [job.cafeName, job]));
  const published = results.filter(({ success, articleId }) => success && articleId);

  const targets = published.flatMap((result) => {
    const job = jobByCafeName.get(result.cafeName);
    const comments = plan.comments[result.keyword];
    if (!job || !comments?.length) return [];
    return [{
      cafeSlug: job.slug,
      cafeId: job.cafeId,
      cafeName: job.cafeName,
      articleId: result.articleId as number,
      articleUrl: `https://cafe.naver.com/${job.slug}/${result.articleId}`,
      keyword: result.keyword,
      comments,
    }];
  });

  console.log(`[PLAN] 발행 성공 ${published.length}건 → 댓글 작업 ${targets.length}건`);
  for (const target of targets) {
    console.log(`  ${target.cafeName.padEnd(10)} ${target.articleUrl} · ${target.keyword} · 댓글 ${target.comments.length}개`);
  }

  if (args.dryRun) {
    process.exit(0);
  }

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

  const user = await User.findOne({ loginId: LOGIN_ID }).lean<{ userId: string } | null>();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const delayMinMs = Math.round(DELAY_MIN_MINUTES * 60_000);
  const delayMaxMs = Math.round(DELAY_MAX_MINUTES * 60_000);

  let queued = 0;
  let skipped = 0;

  for (const target of targets) {
    // 같은 글에 대기·진행 중인 작업이 있으면 중복 게시가 되므로 건너뛴다.
    const duplicate = await ManualCommentJob.findOne({
      userId: user.userId,
      cafeId: target.cafeId,
      articleId: target.articleId,
      status: { $in: ['pending', 'running'] },
    })
      .select('_id')
      .lean<{ _id: unknown } | null>();
    if (duplicate) {
      console.log(`[SKIP] ${target.cafeName}/${target.articleId} 이미 대기·진행 중`);
      skipped += 1;
      continue;
    }

    const job = await ManualCommentJob.create({
      userId: user.userId,
      articleUrl: target.articleUrl,
      cafeSlug: target.cafeSlug,
      cafeId: target.cafeId,
      articleId: target.articleId,
      mode: 'fixed',
      fixedComments: target.comments,
      delayMinMs,
      delayMaxMs,
      deleteExisting: false,
      status: 'pending',
      results: [],
      deleteResults: [],
    });
    console.log(`[QUEUED] ${target.cafeName}/${target.articleId} jobId=${job._id} 댓글 ${target.comments.length}개`);
    queued += 1;
  }

  console.log(`\n===== 댓글 작업 등록 =====`);
  console.log(`등록 ${queued}건 / 스킵 ${skipped}건 / 대상 ${targets.length}건`);

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((error) => {
  console.error('FATAL:', error instanceof Error ? error.message : error);
  process.exit(1);
});
