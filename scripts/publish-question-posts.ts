/**
 * 질문형 카페 글 발행. 원고는 미리 작성된 JSON 을 그대로 쓴다(생성 API 미사용).
 *
 *   npx tsx --env-file=.env --env-file=.env.local scripts/publish-question-posts.ts \
 *     --jobs scripts/jobs/question-30.json \
 *     --manuscripts scripts/jobs/question-30-manuscripts.json \
 *     [--only 키워드] [--limit 3] [--concurrency 3] [--dry-run]
 *
 * 원고 형식(prompts/question-cafe-prompt.md): 본문에 제품명 없이 질문만, 문단 사이 빈 줄.
 */
import { readFileSync } from 'fs';
import { connectDB } from '../src/shared/lib/mongodb';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import { writePostWithAccount } from '../src/shared/lib/naver-cafe-writing';
import { getCafeWriterAccounts } from '../src/shared/config/cafe-account-policy';
import { toCafeSlug } from '../src/shared/lib/naver-cafe-membership';
import { joinCafeWithNicknameRetry } from '../src/features/auto-comment/batch/cafe-join';
import type { NaverAccount } from '../src/shared/lib/account-manager';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';

interface Job {
  cafeId: string;
  cafeName: string;
  keyword: string;
}

interface Manuscript {
  keyword: string;
  title: string;
  body: string;
}

interface Args {
  jobsPath: string;
  manuscriptsPath: string;
  only?: string;
  limit?: number;
  concurrency: number;
  dryRun: boolean;
  join: boolean;
  maxAccounts: number;
}

const parseArgs = (): Args => {
  const tokens = process.argv.slice(2);
  const args: Args = {
    jobsPath: 'scripts/jobs/question-30.json',
    manuscriptsPath: 'scripts/jobs/question-30-manuscripts.json',
    concurrency: 3,
    dryRun: false,
    join: false,
    maxAccounts: 3,
  };
  while (tokens.length > 0) {
    const token = tokens.shift();
    if (!token) continue;
    if (token === '--dry-run') { args.dryRun = true; continue; }
    if (token === '--join') { args.join = true; continue; }
    const value = tokens.shift();
    if (!value) throw new Error(`${token} 값이 비었습니다`);
    if (token === '--jobs') args.jobsPath = value;
    else if (token === '--manuscripts') args.manuscriptsPath = value;
    else if (token === '--only') args.only = value;
    else if (token === '--limit') args.limit = Number(value);
    else if (token === '--concurrency') args.concurrency = Math.max(1, Number(value));
    else if (token === '--max-accounts') args.maxAccounts = Math.max(1, Number(value));
    else throw new Error(`알 수 없는 옵션: ${token}`);
  }
  return args;
};

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

const runWithLimit = async <T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> => {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
};

const main = async (): Promise<void> => {
  const args = parseArgs();
  const { jobs } = readJson<{ jobs: Job[] }>(args.jobsPath);
  const { manuscripts } = readJson<{ manuscripts: Manuscript[] }>(args.manuscriptsPath);
  const manuscriptByKeyword = new Map(manuscripts.map((m) => [m.keyword, m]));

  let targets = jobs.filter((job) => manuscriptByKeyword.has(job.keyword));
  if (args.only) targets = targets.filter((job) => job.keyword === args.only);
  if (args.limit) targets = targets.slice(0, args.limit);

  const missing = jobs.filter((job) => !manuscriptByKeyword.has(job.keyword));
  if (missing.length > 0) {
    console.log(`[SKIP] 원고 없는 작업 ${missing.length}건: ${missing.map((m) => m.keyword).join(', ')}`);
  }
  console.log(`[PLAN] 발행 대상 ${targets.length}건 (동시 ${args.concurrency})`);

  if (args.dryRun) {
    for (const job of targets) {
      const manuscript = manuscriptByKeyword.get(job.keyword) as Manuscript;
      console.log(`\n--- ${job.cafeName} / ${job.keyword} ---`);
      console.log(`제목: ${manuscript.title}`);
      console.log(manuscript.body);
    }
    process.exit(0);
  }

  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafeDocs = await Cafe.find({
    userId: user.userId,
    cafeId: { $in: targets.map((job) => job.cafeId) },
  }).lean();
  const cafeById = new Map(cafeDocs.map((cafe) => [cafe.cafeId, cafe]));

  // 소유계정이 비어 있는 카페가 있어서(운영 데이터 누락) 그 경우엔 해당 카페에 글쓰기
  // 가능한 writer 계정으로 대체한다.
  const accountDocs = await Account.find({ userId: user.userId, isActive: true }).lean();
  const accountById = new Map(accountDocs.map((account) => [account.accountId, account]));
  const allAccounts: NaverAccount[] = accountDocs.map((account) => ({
    id: account.accountId,
    password: account.password,
    nickname: account.nickname,
    isMain: account.isMain,
    role: account.role,
    excludeFromAutoComment: account.excludeFromAutoComment,
  }));

  const results: Array<{ keyword: string; cafeName: string; success: boolean; articleId?: number; error?: string }> = [];

  await runWithLimit(targets, args.concurrency, async (job) => {
    const tag = `[${job.cafeName}/${job.keyword}]`;
    const manuscript = manuscriptByKeyword.get(job.keyword) as Manuscript;
    const cafe = cafeById.get(job.cafeId);
    if (!cafe) {
      console.error(`${tag} 카페 없음`);
      results.push({ keyword: job.keyword, cafeName: job.cafeName, success: false, error: '카페 없음' });
      return;
    }

    // 계정 하나가 추가인증/미가입으로 막혀도 30건을 채우도록, 소유계정 → 글쓰기 가능
    // writer 순으로 후보를 만들어 성공할 때까지 넘어간다.
    const owner = cafe.ownerAccountId ? accountById.get(cafe.ownerAccountId) : undefined;
    const cafeSlug = toCafeSlug(cafe.cafeUrl);
    const candidates: NaverAccount[] = [];
    if (owner) candidates.push({ id: owner.accountId, password: owner.password, nickname: owner.nickname });
    for (const writer of getCafeWriterAccounts(allAccounts, cafe.cafeId, cafeSlug)) {
      if (!candidates.some(({ id }) => id === writer.id)) candidates.push(writer);
    }

    if (candidates.length === 0) {
      console.error(`${tag} 글쓰기 가능 계정 없음`);
      results.push({ keyword: job.keyword, cafeName: job.cafeName, success: false, error: '글쓰기 가능 계정 없음' });
      return;
    }

    let lastError = '시도한 계정이 모두 실패';
    try {
      for (const naverAccount of candidates.slice(0, args.maxAccounts)) {
        console.log(`${tag} 발행 시도 (${naverAccount.id}) — "${manuscript.title}"`);
        if (args.join) {
          const joined = await joinCafeWithNicknameRetry(naverAccount, cafe.cafeId, { cafeUrl: cafeSlug });
          if (!joined.success) {
            lastError = `가입 실패: ${joined.error || '알 수 없음'}`;
            console.error(`${tag} ${naverAccount.id} ${lastError}`);
            continue;
          }
        }
        const posted = await writePostWithAccount(naverAccount, {
          cafeId: cafe.cafeId,
          menuId: cafe.menuId,
          subject: manuscript.title,
          content: manuscript.body,
          category: cafe.categories?.[0],
        });
        if (posted.success) {
          console.log(`${tag} 성공 articleId=${posted.articleId ?? '?'} (${naverAccount.id})`);
          results.push({ keyword: job.keyword, cafeName: job.cafeName, success: true, articleId: posted.articleId });
          return;
        }
        lastError = posted.error || '발행 실패';
        console.error(`${tag} ${naverAccount.id} 실패: ${lastError}`);
      }
      results.push({ keyword: job.keyword, cafeName: job.cafeName, success: false, error: lastError });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${tag} 에러: ${message}`);
      results.push({ keyword: job.keyword, cafeName: job.cafeName, success: false, error: message });
    }
  });

  const ok = results.filter(({ success }) => success);
  console.log('\n===== 발행 결과 =====');
  console.log(`성공 ${ok.length} / 실패 ${results.length - ok.length} / 전체 ${results.length}`);
  for (const row of results.filter(({ success }) => !success)) {
    console.log(`  실패: ${row.cafeName} / ${row.keyword} — ${row.error}`);
  }
  console.log(JSON.stringify({ results }, null, 2));
  process.exit(0);
};

main().catch((error) => {
  console.error('FATAL:', error instanceof Error ? error.message : error);
  process.exit(1);
});
