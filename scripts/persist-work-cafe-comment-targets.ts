import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { WorkCafeArticle } from '../src/shared/models/work-cafe-article';
import { buildCafeCommentBatchPrompt } from '../src/shared/api/cafe-comment-batch-api';

interface CollectedArticle {
  articleId: number;
  subject: string;
  nickname?: string;
  memberKey?: string;
  readCount?: number;
  likeCount?: number;
  commentCount?: number;
  writeDateTimestamp?: number;
  menuId?: number;
  menuName?: string;
  articleUrl: string;
}

interface CollectedCafe {
  ownerName: string;
  cafeUrl: string;
  cafeSlug: string;
  cafeId?: string;
  status: 'ok' | 'failed';
  articles?: CollectedArticle[];
  zeroCommentArticles?: CollectedArticle[];
}

interface CollectionArtifact {
  generatedAt: string;
  viewerAccountId: string;
  cafes: CollectedCafe[];
}

const DEFAULT_TARGET_COMMENT_COUNT = 8;
const DEFAULT_MODEL = process.env.GEN_MODEL || 'deepseek-v4-flash';
const args = process.argv.slice(2);

const getArgValue = (name: string, fallback: string): string => {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  return fallback;
};

const findLatestCollectionArtifact = (): string => {
  const outputDir = join(process.cwd(), 'outputs');
  const files = readdirSync(outputDir)
    .filter((file) => /^work-cafe-zero-comment-posts-.+\.json$/.test(file))
    .sort()
    .reverse();

  if (!files[0]) throw new Error('work-cafe-zero-comment-posts artifact not found');
  return join(outputDir, files[0]);
};

const readCollectionArtifact = (path: string): CollectionArtifact =>
  JSON.parse(readFileSync(path, 'utf-8')) as CollectionArtifact;

const writeArtifacts = (payload: {
  generatedAt: string;
  sourcePath: string;
  model: string;
  targetCommentCount: number;
  totalArticles: number;
  pendingTargets: Array<Record<string, unknown>>;
  promptTemplate: string;
}): { jsonPath: string; mdPath: string } => {
  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const timestamp = payload.generatedAt.replace(/[:.]/g, '-');
  const jsonPath = join(outputDir, `work-cafe-comment-prep-${timestamp}.json`);
  const mdPath = join(outputDir, `work-cafe-comment-prompt-${timestamp}.md`);

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(
    mdPath,
    [
      '# 작업카페 댓글 생성 프롬프트',
      '',
      `- generatedAt: ${payload.generatedAt}`,
      `- sourcePath: ${payload.sourcePath}`,
      `- model: ${payload.model}`,
      `- targetCommentCount: ${payload.targetCommentCount}`,
      `- pendingTargets: ${payload.pendingTargets.length}`,
      '',
      '## 실행 방식',
      '',
      '1. WorkCafeArticle에서 `needsCommentWork=true`, `commentWorkStatus=pending` 글을 가져온다.',
      '2. 네이버 실제 글 URL을 열어 제목/본문을 다시 읽는다.',
      '3. 아래 프롬프트 형식으로 DeepSeek에 원고를 넣고 댓글 8개 JSON을 받는다.',
      '4. 첫 6글자/시작어/길이/중복 검증 후 댓글 큐에 넣는다.',
      '',
      '## Prompt Template',
      '',
      '```text',
      payload.promptTemplate,
      '```',
      '',
      '## Pending Targets Sample',
      '',
      '|카페|글ID|제목|현재댓글|링크|',
      '|---|---:|---|---:|---|',
      ...payload.pendingTargets.slice(0, 30).map((target) =>
        `|${target.cafeSlug}|${target.articleId}|${target.subject}|${target.commentCount}|${target.articleUrl}|`,
      ),
      '',
    ].join('\n'),
    'utf-8',
  );

  return { jsonPath, mdPath };
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');

  const sourcePath = getArgValue('--source', findLatestCollectionArtifact());
  const targetCommentCount = Number(getArgValue('--target-comment-count', String(DEFAULT_TARGET_COMMENT_COUNT)));
  const model = getArgValue('--model', DEFAULT_MODEL);
  const artifact = readCollectionArtifact(sourcePath);
  const collectionId = artifact.generatedAt.replace(/[:.]/g, '-');
  const collectedAt = new Date(artifact.generatedAt);
  const pendingTargets: Array<Record<string, unknown>> = [];
  let totalArticles = 0;
  let upserted = 0;

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  for (const cafe of artifact.cafes) {
    if (cafe.status !== 'ok' || !cafe.cafeId) continue;

    for (const article of cafe.articles || []) {
      totalArticles += 1;
      const commentCount = Number(article.commentCount || 0);
      const needsCommentWork = commentCount < targetCommentCount;
      const commentWorkStatus = needsCommentWork ? 'pending' : 'skipped';

      await WorkCafeArticle.findOneAndUpdate(
        { cafeId: cafe.cafeId, articleId: article.articleId },
        {
          $set: {
            ownerName: cafe.ownerName,
            cafeSlug: cafe.cafeSlug,
            cafeUrl: cafe.cafeUrl,
            cafeId: cafe.cafeId,
            articleId: article.articleId,
            articleUrl: article.articleUrl,
            subject: article.subject,
            nickname: article.nickname || '',
            memberKey: article.memberKey,
            menuId: article.menuId || 0,
            menuName: article.menuName || '',
            readCount: article.readCount || 0,
            likeCount: article.likeCount || 0,
            commentCount,
            writeDateTimestamp: article.writeDateTimestamp || 0,
            collectedAt,
            latestCollectionId: collectionId,
            needsCommentWork,
            targetCommentCount,
            commentWorkStatus,
          },
        },
        { upsert: true, new: true },
      );
      upserted += 1;

      if (needsCommentWork) {
        pendingTargets.push({
          ownerName: cafe.ownerName,
          cafeSlug: cafe.cafeSlug,
          cafeId: cafe.cafeId,
          cafeUrl: cafe.cafeUrl,
          articleId: article.articleId,
          articleUrl: article.articleUrl,
          subject: article.subject,
          nickname: article.nickname || '',
          menuName: article.menuName || '',
          commentCount,
          targetCommentCount,
          shortage: Math.max(0, targetCommentCount - commentCount),
          status: 'pending',
        });
      }
    }
  }

  const promptTemplate = buildCafeCommentBatchPrompt({
    title: '{ARTICLE_TITLE}',
    body: '{LIVE_NAVER_ARTICLE_BODY}',
    keyword: '{ARTICLE_TITLE_OR_KEYWORD}',
    category: '{CAFE_CATEGORY}',
    exactCount: targetCommentCount,
    model,
  });

  const generatedAt = new Date().toISOString();
  const paths = writeArtifacts({
    generatedAt,
    sourcePath,
    model,
    targetCommentCount,
    totalArticles,
    pendingTargets,
    promptTemplate,
  });

  const dbPending = await WorkCafeArticle.countDocuments({
    needsCommentWork: true,
    commentWorkStatus: 'pending',
    latestCollectionId: collectionId,
  });

  console.log('persist work cafe comment targets complete');
  console.log(`source: ${sourcePath}`);
  console.log(`collectionId: ${collectionId}`);
  console.log(`upserted: ${upserted}`);
  console.log(`pendingTargets: ${pendingTargets.length}`);
  console.log(`dbPending: ${dbPending}`);
  console.log(`json: ${paths.jsonPath}`);
  console.log(`md: ${paths.mdPath}`);
};

main()
  .catch((error) => {
    console.error('persist-work-cafe-comment-targets failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(process.exitCode || 0);
  });
