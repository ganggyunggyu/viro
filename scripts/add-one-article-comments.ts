import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { PublishedArticle } from '../src/shared/models/published-article';
import { getAllAccounts } from '../src/shared/config/accounts';
import { isAccountActive, type NaverAccount } from '../src/shared/lib/account-manager';
import { addTaskJob, closeAllQueues } from '../src/shared/lib/queue';
import { startAllTaskWorkers, closeAllWorkers } from '../src/shared/lib/queue/workers';
import type { CommentJobData } from '../src/shared/lib/queue/types';

interface ArticleCommentRecord {
  accountId: string;
  content: string;
  type: 'comment' | 'reply';
}

interface ArticleRecord {
  cafeId: string;
  articleId: number;
  articleUrl?: string;
  title?: string;
  keyword?: string;
  content?: string;
  writerAccountId?: string;
  comments?: ArticleCommentRecord[];
}

const DEFAULT_LOGIN_ID = process.env.LOGIN_ID || '21lab';
const DEFAULT_CAFE_ID = '31750114';
const DEFAULT_ARTICLE_ID = 3;
const DEFAULT_COUNT = 8;
const DEFAULT_DELAY_STEP_MS = 5_000;
const DEFAULT_WAIT_MS = 15 * 60 * 1000;

const RESTAURANT_COMMENTS = [
  '혼밥할 때는 말씀하신 것처럼 자리 편한지가 제일 크게 느껴져요. 맛도 중요하지만 눈치 안 보이는 분위기가 오래 기억나더라고요.',
  '퇴근길에 가볍게 먹을 수 있는 곳 찾는다는 부분 공감돼요. 너무 유명한 곳보다 동네에서 편한 집이 더 자주 가게 되는 것 같아요.',
  '가격 부담 없고 맛이 무난한 곳이면 평일 저녁에 진짜 도움 되죠. 저도 그런 식당은 따로 메모해두는 편이에요.',
  '혼자 밥 먹기 좋은 곳은 테이블 간격이나 직원 응대도 은근 중요하더라고요. 글 보니까 그 기준이 잘 정리된 느낌이에요.',
  '친구 추천으로 알게 된 집이 오히려 실패가 적더라고요. 광고 많이 하는 곳보다 실제로 다녀온 사람 얘기가 더 믿음 가요.',
  '저도 동네 식당은 한 번 마음에 들면 메뉴 바꿔가면서 계속 가는 편이에요. 편안한 분위기라는 말이 제일 와닿네요.',
  '혼밥 자주 하시는 분들한테는 이런 기록이 꽤 유용할 것 같아요. 저녁 메뉴 고민될 때 참고하기 좋겠어요.',
  '부담 없이 먹는 한 끼라는 표현이 좋네요. 맛집이라고 해도 너무 거창한 곳보다 일상에서 자주 갈 수 있는 곳이 더 좋더라고요.',
  '퇴근 후에 멀리 가기 힘들 때 이런 동네 맛집 하나 알고 있으면 마음이 편하죠. 기록해두는 습관도 좋아 보여요.',
  '혼자 먹을 때 조용히 먹고 나올 수 있는 분위기 정말 중요해요. 메뉴보다 그 부분 때문에 다시 가는 곳도 있더라고요.',
  '가격, 맛, 분위기 셋 다 너무 과하지 않은 곳이 제일 오래 가는 것 같아요. 글 읽으면서 제 동네 식당도 떠올랐어요.',
  '저녁 한 끼 고르는 것도 은근 피곤한데 이런 기준이 있으면 실패가 줄겠네요. 편하게 읽고 갑니다.',
];

const CAFE_VIEW_COMMENTS = [
  '호수뷰 카페는 자리 위치에 따라 만족도가 꽤 달라지더라고요. 창가석이나 야외석 기준을 미리 보고 가는 게 확실히 도움 되는 것 같아요.',
  '계절별로 분위기가 달라진다는 부분 공감돼요. 같은 카페도 봄이랑 겨울 느낌이 완전히 다르게 느껴질 때가 있더라고요.',
  '신정호 쪽은 산책하고 들르기 좋은 곳이 많아서 좌석 편한지가 은근 중요하죠. 오래 앉아도 부담 없는 자리면 더 좋고요.',
  '호수뷰만 보고 갔다가 자리 간격이 좁으면 아쉬울 때가 있는데, 이런 체크포인트를 알고 가면 실패가 줄 것 같아요.',
  '사진 찍기 좋은 자리랑 실제로 편하게 쉬기 좋은 자리가 다를 때가 있더라고요. 그 부분을 나눠서 보는 게 좋네요.',
  '주말에는 뷰 좋은 좌석이 빨리 차서 시간대도 중요하더라고요. 오전이나 애매한 오후에 가면 훨씬 여유 있었어요.',
  '카페 고를 때 메뉴보다 분위기랑 좌석을 더 보게 되는 날이 있죠. 호수뷰면 날씨 확인도 같이 해야겠다는 생각이 들어요.',
  '계절마다 즐기는 법을 따로 생각해보는 게 좋네요. 여름에는 그늘, 겨울에는 실내 창가석이 제일 만족도가 높더라고요.',
  '호수 주변 카페는 주차랑 동선도 같이 보면 편하더라고요. 뷰가 좋아도 이동이 불편하면 다시 가기 망설여져요.',
  '글처럼 좌석 기준을 먼저 정해두면 누구랑 가도 덜 헤매는 것 같아요. 데이트랑 가족 모임은 원하는 자리가 또 다르니까요.',
];

const FALLBACK_COMMENTS = [
  '본문에서 이야기한 기준이 현실적이라 보기 좋네요. 너무 거창하지 않고 바로 적용해볼 수 있는 내용이라 더 와닿았어요.',
  '이런 식으로 경험을 정리해두면 나중에 다시 볼 때도 도움이 되더라고요. 핵심만 편하게 적혀 있어서 좋네요.',
  '말씀하신 부분이 실제 생활에서 자주 겪는 내용이라 공감됐어요. 저도 비슷하게 생각했던 적이 있습니다.',
  '내용이 어렵지 않아서 편하게 읽었어요. 작은 기준부터 챙겨보자는 흐름이 현실적인 것 같아요.',
  '처음부터 완벽하게 하려는 것보다 이렇게 하나씩 확인하는 방식이 오래 가더라고요. 잘 읽었습니다.',
  '구체적인 상황을 같이 적어주셔서 이해하기 쉬웠어요. 비슷한 고민 있는 분들한테 도움이 될 것 같네요.',
  '저도 이런 내용은 한 번 읽고 지나가기보다 메모해두는 편이에요. 나중에 필요할 때 다시 보기 좋겠어요.',
  '가볍게 읽기 시작했는데 생각보다 참고할 만한 부분이 많네요. 정리 방식이 깔끔해서 좋았습니다.',
];

const args = process.argv.slice(2);

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const hasFlag = (flag: string): boolean => args.includes(flag);

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeContent = (value: string): string => value.replace(/\s+/g, ' ').trim();

const getTimestamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const getArticleUrl = (article: ArticleRecord): string =>
  article.articleUrl ||
  `https://cafe.naver.com/ca-fe/cafes/${article.cafeId}/articles/${article.articleId}`;

const pickCommentCandidates = (article: ArticleRecord): string[] => {
  const haystack = `${article.title || ''} ${article.keyword || ''} ${article.content || ''}`;
  if (/카페|호수뷰|좌석|신정호|뷰/.test(haystack)) return CAFE_VIEW_COMMENTS;
  if (/맛집|식당|한 끼|혼밥|메뉴|밥/.test(haystack)) return RESTAURANT_COMMENTS;
  return FALLBACK_COMMENTS;
};

const pickAccounts = (
  accounts: NaverAccount[],
  article: ArticleRecord,
  count: number,
  excludedAccountIds: Set<string>,
): NaverAccount[] => {
  const usedAccountIds = new Set(
    (article.comments || []).map((comment) => comment.accountId),
  );
  const writerAccountId = article.writerAccountId || '';
  const candidates = accounts.filter((account) => {
    if (account.id === writerAccountId) return false;
    if (excludedAccountIds.has(account.id)) return false;
    if (usedAccountIds.has(account.id)) return false;
    return true;
  });

  const roleActive = candidates.filter(
    (account) => account.role === 'commenter' && isAccountActive(account),
  );
  const active = candidates.filter((account) => isAccountActive(account));
  const roleAny = candidates.filter((account) => account.role === 'commenter');
  const pool = roleActive.length >= count
    ? roleActive
    : active.length >= count
      ? active
      : roleAny.length >= count
        ? roleAny
        : candidates;

  return pool.slice(0, count);
};

const pickComments = (
  candidates: string[],
  article: ArticleRecord,
  count: number,
): string[] => {
  const usedContents = new Set(
    (article.comments || []).map((comment) => normalizeContent(comment.content)),
  );
  const picked: string[] = [];

  for (const candidate of candidates) {
    const normalized = normalizeContent(candidate);
    if (usedContents.has(normalized)) continue;
    picked.push(candidate);
    if (picked.length === count) break;
  }

  return picked;
};

const countWrittenComments = async (
  cafeId: string,
  articleId: number,
  jobs: Array<{ accountId: string; content: string }>,
): Promise<number> => {
  const article = await PublishedArticle.findOne(
    { cafeId, articleId },
    { comments: 1 },
  ).lean<ArticleRecord | null>();
  const comments = article?.comments || [];

  return jobs.filter((job) =>
    comments.some(
      (comment) =>
        comment.type === 'comment' &&
        comment.accountId === job.accountId &&
        normalizeContent(comment.content) === normalizeContent(job.content),
    ),
  ).length;
};

const writeArtifact = (payload: unknown): string => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `one-article-comments-${getTimestamp()}.json`);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const loginId = getArgValue('--login-id', DEFAULT_LOGIN_ID);
  const cafeId = getArgValue('--cafe-id', DEFAULT_CAFE_ID);
  const articleId = Number(getArgValue('--article-id', String(DEFAULT_ARTICLE_ID)));
  const articleUrl = getArgValue(
    '--article-url',
    `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
  );
  const title = getArgValue('--title', '');
  const keyword = getArgValue('--keyword', title);
  const writerAccountId = getArgValue('--writer-account-id', '');
  const count = Number(getArgValue('--count', String(DEFAULT_COUNT)));
  const delayStepMs = Number(getArgValue('--delay-step-ms', String(DEFAULT_DELAY_STEP_MS)));
  const waitMs = Number(getArgValue('--wait-ms', String(DEFAULT_WAIT_MS)));
  const dryRun = hasFlag('--dry-run');
  const startWorker = !hasFlag('--no-worker');
  const excludedAccountIds = new Set(
    splitCsv(getArgValue('--exclude-account-ids', process.env.EXCLUDE_ACCOUNT_IDS || '')),
  );

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const user = await User.findOne({ loginId, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${loginId}`);

  const foundArticle = await PublishedArticle.findOne({ cafeId, articleId }).lean<ArticleRecord | null>();
  const article = foundArticle || {
    cafeId,
    articleId,
    articleUrl,
    title,
    keyword,
    content: '',
    writerAccountId,
    comments: [],
  };

  if (!foundArticle && !hasFlag('--allow-external')) {
    throw new Error(`article not found: cafeId=${cafeId}, articleId=${articleId}`);
  }

  const accounts = await getAllAccounts(user.userId);
  const selectedAccounts = pickAccounts(accounts, article, count, excludedAccountIds);
  const selectedComments = pickComments(pickCommentCandidates(article), article, count);

  if (selectedAccounts.length < count) {
    throw new Error(`not enough accounts: ${selectedAccounts.length}/${count}`);
  }
  if (selectedComments.length < count) {
    throw new Error(`not enough comment contents: ${selectedComments.length}/${count}`);
  }

  const rescheduleToken = `one_article_comments_${Date.now().toString(36)}`;
  const beforeWritten = await countWrittenComments(cafeId, articleId, []);
  const jobs = selectedAccounts.map((account, index) => ({
    accountId: account.id,
    nickname: account.nickname || account.id,
    content: selectedComments[index],
    delayMs: index * delayStepMs,
  }));

  if (!dryRun && startWorker) {
    await startAllTaskWorkers();
  }

  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];
    const jobData: CommentJobData = {
      type: 'comment',
      accountId: job.accountId,
      userId: user.userId,
      cafeId,
      articleId,
      content: job.content,
      keyword: article.keyword,
      commentIndex: (article.comments || []).filter((comment) => comment.type === 'comment').length + index,
      rescheduleToken,
    };

    if (!dryRun) await addTaskJob(job.accountId, jobData, job.delayMs);
  }

  let written = 0;
  const startedAt = Date.now();
  if (!dryRun) {
    while (Date.now() - startedAt < waitMs) {
      written = await countWrittenComments(cafeId, articleId, jobs);
      if (written >= count) break;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }

  const outputPath = writeArtifact({
    generatedAt: new Date().toISOString(),
    dryRun,
    loginId,
    target: {
      cafeId,
      articleId,
      articleUrl: getArticleUrl(article),
      title: article.title,
      keyword: article.keyword,
    },
    count,
    delayStepMs,
    waitMs,
    rescheduleToken,
    beforeWritten,
    written,
    status: dryRun ? 'dry-run' : written >= count ? 'completed' : 'partial',
    jobs,
  });

  console.log(`one article comments ${dryRun ? 'dry-run' : 'run'} complete`);
  console.log(`target: ${getArticleUrl(article)}`);
  console.log(`written: ${written}/${count}`);
  console.log(`artifact: ${outputPath}`);
};

main()
  .catch((error) => {
    console.error('add-one-article-comments failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeAllWorkers();
    } catch {}
    try {
      await closeAllQueues();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
