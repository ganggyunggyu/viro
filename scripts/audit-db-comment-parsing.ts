import dotenv from 'dotenv';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { PublishedArticle } from '../src/shared/models/published-article';

dotenv.config({ path: '.env.local' });
dotenv.config();

type CommentType = 'comment' | 'reply' | string;
type IssueSeverity = 'error' | 'warn' | 'info';

interface ArticleCommentRecord {
  accountId?: string;
  nickname?: string;
  content?: string;
  type?: CommentType;
  parentIndex?: number;
  commentId?: string;
  commentIndex?: number;
  sequenceId?: string;
  createdAt?: Date;
}

interface ArticleRecord {
  articleId: number;
  cafeId: string;
  menuId?: string;
  keyword?: string;
  title?: string;
  articleUrl?: string;
  writerAccountId?: string;
  publishedAt?: Date;
  commentCount?: number;
  replyCount?: number;
  comments?: ArticleCommentRecord[];
}

interface AuditIssue {
  severity: IssueSeverity;
  kind: string;
  articleId: number;
  cafeId: string;
  title: string;
  publishedAtKst: string;
  commentArrayIndex: string;
  accountId: string;
  nickname: string;
  type: string;
  parentIndex: string;
  commentIndex: string;
  contentPreview: string;
  detail: string;
}

interface AuditSummary {
  generatedAtKst: string;
  recentSinceKst: string;
  totalArticles: number;
  articlesWithComments: number;
  totalCommentRows: number;
  recentArticles: number;
  recentCommentRows: number;
  issueCount: number;
  recentIssueCount: number;
  issueCountBySeverity: Record<IssueSeverity, number>;
  issueCountByKind: Record<string, number>;
  recentIssueCountByKind: Record<string, number>;
  reportPaths: {
    json: string;
    csv: string;
  };
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEFAULT_RECENT_DAYS = 14;
const CONTENT_PREVIEW_LENGTH = 160;

const UI_ARTIFACT_PATTERNS: Array<{ kind: string; pattern: RegExp }> = [
  { kind: 'ui-artifact-reply-option', pattern: /답글쓰기\s*옵션/u },
  { kind: 'ui-artifact-comment-settings', pattern: /댓글\s*알림\s*설정|클린봇|URL\s*복사/u },
  { kind: 'ui-artifact-article-actions', pattern: /본문\s*기타\s*기능|작성자\s*차단|신고하기/u },
  { kind: 'ui-artifact-date-reply', pattern: /\d{4}\.\d{2}\.\d{2}\.\s*\d{1,2}:\d{2}\s*답글쓰기/u },
  { kind: 'ui-artifact-like-tail', pattern: /좋아요\s*\d+\s*(답글쓰기|옵션|$)/u },
];

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const getArgValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
};

const getRecentDays = (): number => {
  const value = Number(getArgValue('--recent-days') ?? DEFAULT_RECENT_DAYS);
  if (!Number.isFinite(value) || value < 1) return DEFAULT_RECENT_DAYS;
  return Math.floor(value);
};

const formatKst = (date?: Date): string => {
  if (!date || Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().replace('T', ' ').slice(0, 19);
};

const getKstDateKey = (date: Date): string => {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
};

const parseKstStart = (dateKey: string): Date => {
  return new Date(`${dateKey}T00:00:00+09:00`);
};

const getRecentStart = (recentDays: number): Date => {
  const todayKstStart = parseKstStart(getKstDateKey(new Date()));
  return new Date(todayKstStart.getTime() - (recentDays - 1) * 24 * 60 * 60 * 1000);
};

const csvEscape = (value: string): string => {
  return `"${value.replace(/"/g, '""')}"`;
};

const getContentPreview = (content?: string): string => {
  const normalized = String(content ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= CONTENT_PREVIEW_LENGTH) return normalized;
  return `${normalized.slice(0, CONTENT_PREVIEW_LENGTH)}...`;
};

const isValidDate = (value?: Date): boolean => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

const isIntegerNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value);
};

const hasResolvableParent = (
  comments: ArticleCommentRecord[],
  parentIndex: number
): boolean => {
  const mainComments = comments.filter((comment) => comment.type === 'comment');
  return mainComments.some((comment, index) => {
    return (
      comment.commentIndex === parentIndex ||
      index === parentIndex ||
      index + 1 === parentIndex
    );
  });
};

const pushIssue = (
  issues: AuditIssue[],
  article: ArticleRecord,
  comment: ArticleCommentRecord | undefined,
  commentArrayIndex: number | undefined,
  severity: IssueSeverity,
  kind: string,
  detail: string
): void => {
  issues.push({
    severity,
    kind,
    articleId: article.articleId,
    cafeId: article.cafeId,
    title: article.title ?? '',
    publishedAtKst: formatKst(article.publishedAt),
    commentArrayIndex: commentArrayIndex === undefined ? '' : String(commentArrayIndex),
    accountId: comment?.accountId ?? '',
    nickname: comment?.nickname ?? '',
    type: comment?.type ?? '',
    parentIndex: comment?.parentIndex === undefined ? '' : String(comment.parentIndex),
    commentIndex: comment?.commentIndex === undefined ? '' : String(comment.commentIndex),
    contentPreview: getContentPreview(comment?.content),
    detail,
  });
};

const auditComment = (
  article: ArticleRecord,
  comments: ArticleCommentRecord[],
  comment: ArticleCommentRecord,
  index: number,
  issues: AuditIssue[]
): void => {
  const content = comment.content ?? '';
  const trimmedContent = content.trim();

  if (!comment.accountId?.trim()) {
    pushIssue(issues, article, comment, index, 'error', 'missing-account-id', '댓글 accountId가 비어있습니다.');
  }

  if (!comment.nickname?.trim()) {
    pushIssue(issues, article, comment, index, 'warn', 'missing-nickname', '댓글 nickname이 비어있습니다.');
  }

  if (!trimmedContent) {
    pushIssue(issues, article, comment, index, 'error', 'missing-content', '댓글 content가 비어있습니다.');
  }

  if (content && content !== trimmedContent) {
    pushIssue(issues, article, comment, index, 'info', 'content-needs-trim', '댓글 content 앞뒤에 공백이 있습니다.');
  }

  if (comment.type !== 'comment' && comment.type !== 'reply') {
    pushIssue(issues, article, comment, index, 'error', 'invalid-type', '댓글 type이 comment/reply가 아닙니다.');
  }

  if (comment.type === 'comment' && comment.parentIndex !== undefined) {
    pushIssue(issues, article, comment, index, 'warn', 'comment-has-parent-index', '일반 댓글인데 parentIndex가 들어있습니다.');
  }

  if (comment.type === 'reply') {
    if (!isIntegerNumber(comment.parentIndex)) {
      pushIssue(issues, article, comment, index, 'error', 'reply-missing-parent-index', '답글인데 parentIndex가 없거나 정수가 아닙니다.');
    } else if (!comments.some((item) => item.type === 'comment')) {
      pushIssue(issues, article, comment, index, 'error', 'reply-without-main-comment', '답글만 있고 DB comments 배열 안에 일반 댓글이 없습니다.');
    } else if (!hasResolvableParent(comments, comment.parentIndex)) {
      pushIssue(issues, article, comment, index, 'warn', 'reply-parent-unresolved', 'parentIndex가 실제 댓글 순서/commentIndex 어느 쪽으로도 해석되지 않습니다.');
    }
  }

  if (comment.commentIndex !== undefined && !isIntegerNumber(comment.commentIndex)) {
    pushIssue(issues, article, comment, index, 'warn', 'invalid-comment-index', 'commentIndex가 정수가 아닙니다.');
  }

  if (comment.createdAt !== undefined && !isValidDate(comment.createdAt)) {
    pushIssue(issues, article, comment, index, 'warn', 'invalid-created-at', 'createdAt이 Date로 파싱되지 않았습니다.');
  }

  if (HTML_TAG_PATTERN.test(content)) {
    pushIssue(issues, article, comment, index, 'warn', 'html-in-content', '댓글 content에 HTML 태그처럼 보이는 문자열이 있습니다.');
  }

  for (const { kind, pattern } of UI_ARTIFACT_PATTERNS) {
    if (pattern.test(content)) {
      pushIssue(issues, article, comment, index, 'error', kind, '댓글 본문에 네이버 UI 문구가 같이 저장된 흔적입니다.');
    }
  }

  if (trimmedContent.length > 500) {
    pushIssue(issues, article, comment, index, 'warn', 'very-long-content', '댓글 길이가 500자를 넘습니다. 파싱 병합 여부를 확인해야 합니다.');
  }
};

const auditArticle = (article: ArticleRecord, issues: AuditIssue[]): void => {
  const comments = article.comments ?? [];
  const actualCommentCount = comments.filter((comment) => comment.type === 'comment').length;
  const actualReplyCount = comments.filter((comment) => comment.type === 'reply').length;

  if ((article.commentCount ?? 0) !== actualCommentCount) {
    pushIssue(
      issues,
      article,
      undefined,
      undefined,
      'warn',
      'comment-count-mismatch',
      `commentCount=${article.commentCount ?? 0}, 실제 comment rows=${actualCommentCount}`
    );
  }

  if ((article.replyCount ?? 0) !== actualReplyCount) {
    pushIssue(
      issues,
      article,
      undefined,
      undefined,
      'warn',
      'reply-count-mismatch',
      `replyCount=${article.replyCount ?? 0}, 실제 reply rows=${actualReplyCount}`
    );
  }

  const duplicateKeys = new Map<string, number[]>();
  comments.forEach((comment, index) => {
    const key = [
      comment.type ?? '',
      comment.accountId ?? '',
      comment.parentIndex ?? '',
      (comment.content ?? '').replace(/\s+/g, ' ').trim(),
    ].join('\u001f');
    if (!comment.content?.trim()) return;
    duplicateKeys.set(key, [...(duplicateKeys.get(key) ?? []), index]);
  });

  for (const indexes of duplicateKeys.values()) {
    if (indexes.length < 2) continue;
    const firstIndex = indexes[0];
    pushIssue(
      issues,
      article,
      comments[firstIndex],
      firstIndex,
      'warn',
      'duplicate-comment-row',
      `같은 article 안에서 동일 type/account/parent/content 조합이 ${indexes.length}번 저장되었습니다. indexes=${indexes.join('|')}`
    );
  }

  comments.forEach((comment, index) => {
    auditComment(article, comments, comment, index, issues);
  });
};

const toCsv = (issues: AuditIssue[]): string => {
  const headers: Array<keyof AuditIssue> = [
    'severity',
    'kind',
    'publishedAtKst',
    'cafeId',
    'articleId',
    'title',
    'commentArrayIndex',
    'accountId',
    'nickname',
    'type',
    'parentIndex',
    'commentIndex',
    'contentPreview',
    'detail',
  ];

  const body = issues.map((issue) => {
    return headers.map((header) => csvEscape(String(issue[header] ?? ''))).join(',');
  });

  return [headers.join(','), ...body].join('\n');
};

const countBy = <T extends string>(values: T[]): Record<T, number> => {
  return values.reduce<Record<T, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
};

const main = async (): Promise<void> => {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI가 필요합니다. .env.local 또는 환경변수를 확인해주세요.');
  }

  const recentDays = getRecentDays();
  const recentStart = getRecentStart(recentDays);
  await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 10000 });

  const articles = await PublishedArticle.find(
    { 'comments.0': { $exists: true } },
    {
      articleId: 1,
      cafeId: 1,
      menuId: 1,
      keyword: 1,
      title: 1,
      articleUrl: 1,
      writerAccountId: 1,
      publishedAt: 1,
      commentCount: 1,
      replyCount: 1,
      comments: 1,
    }
  )
    .sort({ publishedAt: 1, articleId: 1 })
    .lean<ArticleRecord[]>();

  const issues: AuditIssue[] = [];
  articles.forEach((article) => {
    auditArticle(article, issues);
  });

  const recentArticles = articles.filter((article) => {
    return article.publishedAt !== undefined && article.publishedAt >= recentStart;
  });
  const recentArticleIds = new Set(recentArticles.map((article) => `${article.cafeId}:${article.articleId}`));
  const recentIssues = issues.filter((issue) => {
    return recentArticleIds.has(`${issue.cafeId}:${issue.articleId}`);
  });

  const timestamp = formatKst(new Date()).replace(/[-: ]/g, '').slice(0, 12);
  const reportDir = path.join(process.cwd(), 'reports');
  await mkdir(reportDir, { recursive: true });

  const baseName = `db-comment-parse-audit-${timestamp}`;
  const jsonPath = path.join(reportDir, `${baseName}.json`);
  const csvPath = path.join(reportDir, `${baseName}.csv`);

  const summary: AuditSummary = {
    generatedAtKst: formatKst(new Date()),
    recentSinceKst: formatKst(recentStart),
    totalArticles: await PublishedArticle.countDocuments(),
    articlesWithComments: articles.length,
    totalCommentRows: articles.reduce((sum, article) => sum + (article.comments?.length ?? 0), 0),
    recentArticles: recentArticles.length,
    recentCommentRows: recentArticles.reduce((sum, article) => sum + (article.comments?.length ?? 0), 0),
    issueCount: issues.length,
    recentIssueCount: recentIssues.length,
    issueCountBySeverity: {
      error: issues.filter((issue) => issue.severity === 'error').length,
      warn: issues.filter((issue) => issue.severity === 'warn').length,
      info: issues.filter((issue) => issue.severity === 'info').length,
    },
    issueCountByKind: countBy(issues.map((issue) => issue.kind)),
    recentIssueCountByKind: countBy(recentIssues.map((issue) => issue.kind)),
    reportPaths: {
      json: jsonPath,
      csv: csvPath,
    },
  };

  await writeFile(jsonPath, JSON.stringify({ summary, issues }, null, 2));
  await writeFile(csvPath, toCsv(issues));

  console.log(JSON.stringify(summary, null, 2));
  console.log('상위 이슈 샘플');
  console.log(JSON.stringify(issues.slice(0, 20), null, 2));

  await mongoose.disconnect();
};

main().catch(async (error) => {
  await mongoose.disconnect().catch(() => undefined);
  console.error(error);
  process.exit(1);
});
