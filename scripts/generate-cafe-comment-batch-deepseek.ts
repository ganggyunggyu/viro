import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { User } from '../src/shared/models/user';
import { PublishedArticle } from '../src/shared/models/published-article';
import { getAllAccounts } from '../src/shared/config/accounts';
import { readCafeArticleContent } from '../src/shared/lib/cafe-article-reader';
import { closeAllContexts } from '../src/shared/lib/multi-session';
import { generateCafeCommentBatch } from '../src/shared/api/cafe-comment-batch-api';

interface ArticleRecord {
  title?: string;
  keyword?: string;
  content?: string;
  articleUrl?: string;
}

const DEFAULT_LOGIN_ID = process.env.LOGIN_ID || '21lab';
const DEFAULT_VERIFY_ACCOUNT_ID = process.env.VERIFY_ACCOUNT_ID || 'produce11745';
const DEFAULT_MODEL = process.env.GEN_MODEL || 'deepseek-v4-flash';
const MIN_CONTENT_LENGTH = 120;

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

const normalizeText = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim();

const getTimestamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const writeArtifact = (payload: unknown): string => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `cafe-comment-batch-deepseek-${getTimestamp()}.json`);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
};

const readArticleFromDb = async (
  cafeId: string,
  articleId: number,
): Promise<ArticleRecord | null> => {
  const article = await PublishedArticle.findOne(
    { cafeId, articleId },
    { title: 1, keyword: 1, content: 1, articleUrl: 1 },
  ).lean<ArticleRecord | null>();

  if (!article?.content || normalizeText(article.content).length < MIN_CONTENT_LENGTH) {
    return null;
  }

  return article;
};

const readArticleFromNaver = async (
  loginId: string,
  verifyAccountId: string,
  cafeId: string,
  articleId: number,
): Promise<ArticleRecord> => {
  const user = await User.findOne({ loginId, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${loginId}`);

  const accounts = await getAllAccounts(user.userId);
  const account = accounts.find((item) => item.id === verifyAccountId) || accounts[0];
  if (!account) throw new Error('verify account not found');

  const article = await readCafeArticleContent(account, cafeId, articleId);
  if (!article.success || !article.content) {
    throw new Error(`naver article read failed: ${article.error || 'content missing'}`);
  }

  return {
    title: article.title,
    keyword: article.title,
    content: article.content,
    articleUrl: article.url,
  };
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const cafeId = getArgValue('--cafe-id', '31750110');
  const articleId = Number(getArgValue('--article-id', '5'));
  const loginId = getArgValue('--login-id', DEFAULT_LOGIN_ID);
  const verifyAccountId = getArgValue('--account-id', DEFAULT_VERIFY_ACCOUNT_ID);
  const model = getArgValue('--model', DEFAULT_MODEL);
  const category = getArgValue('--category', '');
  const exactCountArg = getArgValue('--count', '');
  const minCount = Number(getArgValue('--min', '5'));
  const maxCount = Number(getArgValue('--max', '10'));
  const preferNaver = hasFlag('--naver');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  const dbArticle = preferNaver ? null : await readArticleFromDb(cafeId, articleId);
  const article = dbArticle || await readArticleFromNaver(loginId, verifyAccountId, cafeId, articleId);
  const exactCount = exactCountArg ? Number(exactCountArg) : undefined;

  const result = await generateCafeCommentBatch({
    title: article.title || `카페 글 ${articleId}`,
    body: article.content || '',
    keyword: article.keyword || article.title,
    category,
    exactCount,
    minCount,
    maxCount,
    model,
  });

  const artifactPath = writeArtifact({
    generatedAt: new Date().toISOString(),
    source: dbArticle ? 'db' : 'naver',
    target: {
      cafeId,
      articleId,
      articleUrl: article.articleUrl || `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
      title: article.title,
      keyword: article.keyword,
    },
    model: result.model,
    elapsed: result.elapsed,
    warnings: result.warnings,
    comments: result.comments,
    rawContent: result.rawContent,
    prompt: result.prompt,
  });

  console.log('cafe comment batch generated');
  console.log(`source: ${dbArticle ? 'db' : 'naver'}`);
  console.log(`target: https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`);
  console.log(`model: ${result.model}`);
  console.log(`comments: ${result.comments.length}`);
  console.log(`warnings: ${result.warnings.join(', ') || 'none'}`);
  console.log(`artifact: ${artifactPath}`);
  console.log(JSON.stringify(result.comments, null, 2));
};

main()
  .catch((error) => {
    console.error('generate-cafe-comment-batch-deepseek failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
