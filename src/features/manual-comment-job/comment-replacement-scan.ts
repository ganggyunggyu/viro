import { getAllAccounts } from '@/shared/config/accounts';
import { getAllCafes } from '@/shared/config/cafes';
import { browseCafePosts } from '@/shared/lib/cafe-browser';
import { listLiveComments } from '@/shared/lib/naver-cafe-writing';
import type { NaverAccount } from '@/shared/lib/account-manager';
import { ManualCommentJob } from '@/shared/models';
import { createManualCommentJobRecord } from './actions';

export interface CommentReplacementCandidate {
  cafeId: string;
  cafeSlug: string;
  articleId: number;
  articleUrl: string;
  title: string;
  commentCount: number;
  mismatchCount: number;
  mismatchRate: number;
}

export interface ScanCommentReplacementOptions {
  cafeIds: string[];
  readerAccountId?: string;
  pagesPerCafe?: number;
  perPage?: number;
  minCommentCount?: number;
  mismatchRate?: number;
}

export interface ScanCommentReplacementResult {
  scannedCafes: number;
  candidates: CommentReplacementCandidate[];
  skipped: Array<{ cafeSlug: string; articleId?: number; reason: string }>;
  errors: Array<{ cafeSlug: string; error: string }>;
}

export interface QueueCommentReplacementResult {
  queuedJobs: Array<{ jobId: string; cafeSlug: string; articleId: number }>;
  skipped: Array<{ cafeSlug: string; articleId: number; reason: string }>;
}

const STOP_WORDS = new Set([
  '추천', '비교', '고르는', '기준', '방법', '종류', '정보', '후기', '정리', '사용', '부터', '까지', '대한', '있는', '위한',
]);

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const getKeywords = (title: string): string[] =>
  [...new Set(
    normalizeText(title)
      .replace(/[^0-9A-Za-z가-힣\s]/g, ' ')
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)),
  )];

export const isCommentContextMismatch = (title: string, content: string): boolean => {
  const keywords = getKeywords(title);
  if (keywords.length === 0) return false;

  const normalizedContent = normalizeText(content);
  return !keywords.some((keyword) => normalizedContent.includes(keyword));
};

const buildArticleUrl = (cafeId: string, articleId: number): string =>
  `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

const findReader = async (userId: string, readerAccountId?: string): Promise<NaverAccount | undefined> => {
  const accounts = await getAllAccounts(userId);
  if (readerAccountId) return accounts.find(({ id }) => id === readerAccountId);
  return accounts.find(({ role, excludeFromAutoComment }) =>
    role === 'commenter' && !excludeFromAutoComment,
  );
};

export const scanCommentReplacementCandidates = async (
  userId: string,
  options: ScanCommentReplacementOptions,
): Promise<ScanCommentReplacementResult> => {
  const { cafeIds, readerAccountId, pagesPerCafe = 1, perPage = 50, minCommentCount = 5, mismatchRate = 0.6 } = options;
  const result: ScanCommentReplacementResult = { scannedCafes: 0, candidates: [], skipped: [], errors: [] };
  const reader = await findReader(userId, readerAccountId);

  if (!reader) {
    result.errors.push({ cafeSlug: '-', error: '글/댓글 조회에 사용할 활성 commenter 계정이 없습니다' });
    return result;
  }

  const cafes = (await getAllCafes(userId)).filter(({ cafeId }) => cafeIds.includes(cafeId));
  if (cafes.length === 0) {
    result.errors.push({ cafeSlug: '-', error: '대상 카페 ID가 등록된 활성 카페와 일치하지 않습니다' });
    return result;
  }

  for (const cafe of cafes) {
    const { cafeId, cafeUrl: cafeSlug, name } = cafe;
    const articles = new Map<number, { articleId: number; subject: string; commentCount: number }>();

    for (let page = 1; page <= pagesPerCafe; page += 1) {
      const browsed = await browseCafePosts(reader, cafeId, undefined, { page, perPage, cafeUrl: cafeSlug });
      if (!browsed.success) {
        result.errors.push({ cafeSlug: name || cafeSlug, error: browsed.error || '글 목록 조회 실패' });
        break;
      }
      for (const article of browsed.articles) {
        if (article.commentCount >= minCommentCount) {
          articles.set(article.articleId, article);
        }
      }
    }

    result.scannedCafes += 1;

    for (const article of articles.values()) {
      const { articleId } = article;
      const title = article.subject;
      const commentsResult = await listLiveComments(reader, cafeId, articleId);
      if (!commentsResult.success) {
        result.skipped.push({ cafeSlug, articleId, reason: commentsResult.error || '댓글 조회 실패' });
        continue;
      }

      const comments = commentsResult.comments || [];
      if (comments.length < minCommentCount) continue;

      const mismatchCount = comments.filter(({ content }) => isCommentContextMismatch(title, content)).length;
      const currentMismatchRate = mismatchCount / comments.length;
      if (currentMismatchRate < mismatchRate) continue;

      result.candidates.push({
        cafeId,
        cafeSlug,
        articleId,
        articleUrl: buildArticleUrl(cafeId, articleId),
        title,
        commentCount: comments.length,
        mismatchCount,
        mismatchRate: currentMismatchRate,
      });
    }
  }

  return result;
};

export const queueCommentReplacementJobs = async (
  userId: string,
  candidates: CommentReplacementCandidate[],
): Promise<QueueCommentReplacementResult> => {
  const result: QueueCommentReplacementResult = { queuedJobs: [], skipped: [] };

  for (const candidate of candidates) {
    const { cafeId, cafeSlug, articleId, articleUrl } = candidate;
    const active = await ManualCommentJob.exists({
      userId,
      cafeId,
      articleId,
      status: { $in: ['pending', 'running'] },
    });
    if (active) {
      result.skipped.push({ cafeSlug, articleId, reason: '이미 대기/진행 중인 작업 있음' });
      continue;
    }
    const created = await createManualCommentJobRecord(
      userId,
      { cafeId, cafeSlug, articleId, articleUrl },
      {
        articleUrl,
        mode: 'generate',
        generateMinCount: 5,
        generateMaxCount: 13,
        delayMinMinutes: 0.5,
        delayMaxMinutes: 1.5,
        deleteExisting: true,
      },
    );
    if (created.success) {
      result.queuedJobs.push({ jobId: created.jobId, cafeSlug, articleId });
    } else {
      result.skipped.push({ cafeSlug, articleId, reason: created.error });
    }
  }

  return result;
};
