import { HydratedDocument } from 'mongoose';
import { type NaverAccount, getPersonaId } from '@/shared/lib/account-manager';
import { generateContent } from '@/shared/api/content-api';
import { buildCafePostContent } from '@/shared/lib/cafe-content';
import { PublishedArticle, type IPublishedArticle, incrementTodayPostCount, claimPostAttempt } from '@/shared/models';
import { logPublishToSheet } from '@/shared/lib/publish-log-sheet';
import { writePostWithAccount } from '@/shared/lib/naver-cafe-writing';
import {
  type KeywordResult,
  type PostOptions,
  type DelayConfig,
  type ProgressCallback,
} from './types';
import { parseKeywordWithCategory } from './keyword-utils';
import { postComments, postReplies } from './keyword-processor-steps';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface KeywordLogEntry {
  keyword: string;
  articleId?: number;
  success: boolean;
  commentCount: number;
  replyCount: number;
  error?: string;
}

export interface KeywordProcessParams {
  service: string;
  keywordInput: string;
  keywordIndex: number;
  totalKeywords: number;
  ref?: string;
  cafeId: string;
  menuId: string;
  postOptions?: PostOptions;
  delays: DelayConfig;
  writerAccount: NaverAccount;
  commenterAccounts: NaverAccount[];
  dbConnected: boolean;
  onProgress?: ProgressCallback;
}

export interface KeywordProcessResult {
  keywordResult: KeywordResult;
  logEntry: KeywordLogEntry;
  success: boolean;
}

export const processKeyword = async ({
  service,
  keywordInput,
  keywordIndex,
  totalKeywords,
  ref,
  cafeId,
  menuId,
  postOptions,
  delays,
  writerAccount,
  commenterAccounts,
  dbConnected,
  onProgress,
}: KeywordProcessParams): Promise<KeywordProcessResult> => {
  const { keyword, category } = parseKeywordWithCategory(keywordInput);

  const progressLabel = `[${keywordIndex + 1}/${totalKeywords}] "${keyword}"${category ? ` (${category})` : ''}`;

  try {
    console.log(`[BATCH] 키워드 ${keywordIndex + 1}/${totalKeywords}: "${keyword}"${category ? ` (${category})` : ''}`);

    onProgress?.({
      currentKeyword: keyword,
      keywordIndex,
      totalKeywords,
      phase: 'post',
      message: `${progressLabel} - ${writerAccount.id}로 글 작성 중...`,
    });

    const keywordWithCategory = category ? `${keyword} (카테고리: ${category})` : keyword;
    const personaId = getPersonaId(writerAccount);
    console.log('[BATCH] AI 콘텐츠 생성 요청...');
    const generated = await generateContent({ service, keyword: keywordWithCategory, ref, personaId });
    console.log('[BATCH] AI 콘텐츠 생성 완료');
    const { title, htmlContent } = buildCafePostContent(generated.content, keyword);
    const postContext = `${title}\n\n${generated.content}`;

    // writePostWithAccount는 되돌릴 수 없는 실제 네이버 발행이라, BullMQ가 잡을 실패로
    // 오판해 통째로 재시도(attempts/backoff, 워커 다운 시 stalled 재큐잉)하면 같은 글이
    // 중복으로 여러 번 올라간다. 발행 직전에 오늘자 클레임을 먼저 남겨, 같은 카페+계정+
    // 키워드 조합의 재시도는 발행을 건너뛰게 한다.
    const claimed = await claimPostAttempt(cafeId, writerAccount.id, keyword);
    if (!claimed) {
      const skippedLog: KeywordLogEntry = {
        keyword,
        success: false,
        commentCount: 0,
        replyCount: 0,
        error: '중복 발행 방지: 오늘 이미 같은 카페/계정/키워드로 발행 시도됨 — 스킵',
      };

      return {
        success: false,
        keywordResult: {
          keyword,
          post: { success: false, writerAccountId: writerAccount.id, error: skippedLog.error },
          comments: [],
          replies: [],
        },
        logEntry: skippedLog,
      };
    }

    const postResult = await writePostWithAccount(writerAccount, {
      cafeId,
      menuId,
      subject: title,
      content: htmlContent,
      category,
      postOptions,
    });

    if (!postResult.success || !postResult.articleId) {
      const failureLog: KeywordLogEntry = {
        keyword,
        success: false,
        commentCount: 0,
        replyCount: 0,
        error: postResult.error || '글 작성 실패',
      };

      return {
        success: false,
        keywordResult: {
          keyword,
          post: postResult,
          comments: [],
          replies: [],
        },
        logEntry: failureLog,
      };
    }

    let publishedArticle: HydratedDocument<IPublishedArticle> | null = null;
    if (dbConnected) {
      const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${postResult.articleId}`;
      publishedArticle = await PublishedArticle.create({
        articleId: postResult.articleId,
        cafeId,
        menuId,
        keyword,
        title,
        content: htmlContent,
        articleUrl,
        writerAccountId: writerAccount.id,
        status: 'published',
        postType: 'ad',
        commentCount: 0,
        replyCount: 0,
      });

      await incrementTodayPostCount(writerAccount.id, cafeId);

      const sheetResult = await logPublishToSheet({
        cafeId,
        keyword,
        articleId: postResult.articleId,
        articleUrl,
        writerAccountId: writerAccount.id,
      });
      if (!sheetResult.success) {
        console.error(`[BATCH] 발행 시트 기록 실패: #${postResult.articleId} - ${sheetResult.error}`);
      }
    }

    await sleep(delays.afterPost);

    onProgress?.({
      currentKeyword: keyword,
      keywordIndex,
      totalKeywords,
      phase: 'comments',
      message: `${progressLabel} - 댓글 작성 중...`,
    });

    const comments = await postComments({
      cafeId,
      articleId: postResult.articleId,
      commenterAccounts,
      postContext,
      betweenCommentsDelayMs: delays.betweenComments,
    });
    const { commentResults } = comments;

    await sleep(delays.beforeReplies);

    onProgress?.({
      currentKeyword: keyword,
      keywordIndex,
      totalKeywords,
      phase: 'replies',
      message: `${progressLabel} - 대댓글 작성 중...`,
    });

    const replyResults = await postReplies({
      cafeId,
      articleId: postResult.articleId,
      writerAccount,
      commenterAccounts,
      postContext,
      betweenRepliesDelayMs: delays.betweenReplies,
      comments,
    });

    const successCommentCount = commentResults.filter((c) => c.success).length;
    const successReplyCount = replyResults.filter((r) => r.success).length;

    if (publishedArticle) {
      publishedArticle.commentCount = successCommentCount;
      publishedArticle.replyCount = successReplyCount;
      await publishedArticle.save();
    }

    const successLog: KeywordLogEntry = {
      keyword,
      articleId: postResult.articleId,
      success: true,
      commentCount: successCommentCount,
      replyCount: successReplyCount,
    };

    return {
      success: true,
      keywordResult: {
        keyword,
        post: postResult,
        comments: commentResults,
        replies: replyResults,
      },
      logEntry: successLog,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const failureLog: KeywordLogEntry = {
      keyword,
      success: false,
      commentCount: 0,
      replyCount: 0,
      error: errorMessage,
    };

    return {
      success: false,
      keywordResult: {
        keyword,
        post: {
          success: false,
          writerAccountId: writerAccount.id,
          error: errorMessage,
        },
        comments: [],
        replies: [],
      },
      logEntry: failureLog,
    };
  }
}
