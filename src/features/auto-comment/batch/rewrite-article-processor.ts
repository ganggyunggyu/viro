import type { NaverAccount } from '@/shared/lib/account-manager';
import { modifyArticleWithAccount } from '@/shared/lib/naver-cafe-writing';
import { generateImages, generateTeteContentByService } from '@/shared/api/content-api';
import type { RewriteTask } from './rewrite-types';

const REWRITE_IMAGE_COUNT = 3;

export interface RewriteArticleLog {
  keyword: string;
  articleId: number;
  success: boolean;
  commentCount: number;
  replyCount: number;
  error?: string;
}

export interface RewriteProcessResult {
  success: boolean;
  log: RewriteArticleLog;
}

// 테테 원고는 첫 줄이 제목, 나머지가 본문
export const splitTitleBody = (raw: string): { title: string; body: string } => {
  const lines = raw.split(/\r?\n/);
  const firstNonEmpty = lines.findIndex((line) => line.trim());
  const title = (lines[firstNonEmpty] || '').trim();
  const body = lines.slice(firstNonEmpty + 1).join('\n').trim();
  return { title, body };
};

export const processRewriteArticle = async (
  task: RewriteTask,
  account: NaverAccount
): Promise<RewriteProcessResult> => {
  const keyword = task.keyword || task.subject;

  try {
    const [imageResult, teteResult] = await Promise.all([
      generateImages({ keyword, count: REWRITE_IMAGE_COUNT }),
      generateTeteContentByService({ service: task.service, keyword }),
    ]);

    const images = imageResult.success ? imageResult.images ?? [] : [];
    const { title, body } = splitTitleBody(teteResult.content);

    if (!title || !body) {
      return {
        success: false,
        log: {
          keyword,
          articleId: task.articleId,
          success: false,
          commentCount: 0,
          replyCount: 0,
          error: '제목/본문 파싱 실패',
        },
      };
    }

    const result = await modifyArticleWithAccount(account, {
      cafeId: task.cafeId,
      articleId: task.articleId,
      newTitle: title,
      newContent: body,
      images: images.length > 0 ? images : undefined,
    });

    if (!result.success) {
      return {
        success: false,
        log: {
          keyword,
          articleId: task.articleId,
          success: false,
          commentCount: 0,
          replyCount: 0,
          error: result.error || '글 수정 실패',
        },
      };
    }

    return {
      success: true,
      log: {
        keyword,
        articleId: task.articleId,
        success: true,
        commentCount: 0,
        replyCount: 0,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      success: false,
      log: {
        keyword,
        articleId: task.articleId,
        success: false,
        commentCount: 0,
        replyCount: 0,
        error: errorMessage,
      },
    };
  }
};
