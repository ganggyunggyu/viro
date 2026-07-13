import type { ElementHandle } from 'playwright';
import {
  getPageForAccount,
  acquireAccountLock,
  releaseAccountLock,
  touchAccount,
} from '@/shared/lib/multi-session';
import type { NaverAccount } from '@/shared/lib/account-manager';
import {
  navigateToArticle,
  getCommentRoot,
  findCommentItemById,
  getCommentIdFromItem,
  checkErrorPopup,
  type WriteCommentOptions,
} from './comment-writer';

export interface LiveComment {
  commentId: string;
  nickname: string;
  content: string;
}

export interface ListLiveCommentsResult {
  success: boolean;
  comments?: LiveComment[];
  error?: string;
}

export interface DeleteCommentResult {
  accountId: string;
  commentId: string;
  success: boolean;
  error?: string;
}

const normalizeText = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim();

/**
 * 글의 현재 라이브 댓글 전체를 나열한다 (읽기 전용).
 * 삭제 대상을 정하기 전, DB 기록이 아니라 실제 라이브 상태를 기준으로 삼기 위해 사용한다
 * (DB의 comments 배열이 실제 게시 여부와 어긋나는 경우가 있었음).
 */
export const listLiveComments = async (
  account: NaverAccount,
  cafeId: string,
  articleId: number,
  options?: WriteCommentOptions,
): Promise<ListLiveCommentsResult> => {
  const { id, password } = account;

  await acquireAccountLock(id);
  try {
    const page = await getPageForAccount(id);
    touchAccount(id);
    const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

    const navResult = await navigateToArticle(page, articleUrl, id, password, 'COMMENT-LIST', options);
    if (!navResult.success) {
      return { success: false, error: navResult.error };
    }
    touchAccount(id);

    const root = await getCommentRoot(page);
    const items = await root.$$('.CommentItem:not(.CommentItem--reply)');

    const comments: LiveComment[] = [];
    for (const item of items) {
      const typedItem = item as ElementHandle<HTMLElement>;
      const commentId = await getCommentIdFromItem(typedItem);
      if (!commentId) continue;

      const nickname = normalizeText(
        await typedItem.$eval('a[id^="cih"]', (el) => el.textContent).catch(() => ''),
      );
      const content = normalizeText(
        await typedItem.$eval('.comment_text_view', (el) => el.textContent).catch(() => ''),
      );
      comments.push({ commentId, nickname, content });
    }

    return { success: true, comments };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, error: errorMsg };
  } finally {
    releaseAccountLock(id);
  }
};

/**
 * 댓글 하나를 삭제한다. 반드시 해당 댓글 요소(.CommentItem) 내부로 스코프된 셀렉터만 사용한다.
 * 페이지 전체에서 "삭제" 텍스트를 가진 요소를 찾는 방식은 과거 다른 요소(글 자체 삭제 등)를
 * 잘못 클릭할 위험이 있어 금지한다.
 */
export const deleteCommentWithAccount = async (
  account: NaverAccount,
  cafeId: string,
  articleId: number,
  commentId: string,
  options?: WriteCommentOptions,
): Promise<DeleteCommentResult> => {
  const { id, password } = account;

  await acquireAccountLock(id);
  try {
    const page = await getPageForAccount(id);
    touchAccount(id);
    const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

    const navResult = await navigateToArticle(page, articleUrl, id, password, 'COMMENT-DELETE', options);
    if (!navResult.success) {
      return { accountId: id, commentId, success: false, error: navResult.error };
    }
    touchAccount(id);

    if (!page.url().includes(`/cafes/${cafeId}/articles/${articleId}`)) {
      return { accountId: id, commentId, success: false, error: `대상 글 URL 불일치: ${page.url()}` };
    }

    // getPageForAccount는 워커 프로세스 생애주기 동안 계정당 동일 Page를 재사용하므로,
    // 매 호출마다 이전 등록된 dialog 리스너를 지우고 새로 등록해야 리스너가 누적되지 않는다.
    page.removeAllListeners('dialog');
    page.on('dialog', async (dialog) => {
      try {
        await dialog.accept();
      } catch {}
    });

    const root = await getCommentRoot(page);
    const item = await findCommentItemById(root, commentId);
    if (!item) {
      return { accountId: id, commentId, success: false, error: '댓글을 찾을 수 없음 (이미 삭제됐거나 렌더링 안됨)' };
    }

    const optionBtn = await item.$('button.comment_tool_button');
    if (!optionBtn) {
      return { accountId: id, commentId, success: false, error: '더보기 버튼 없음 (본인 댓글이 아니거나 이미 삭제됨)' };
    }
    await optionBtn.click();
    await page.waitForTimeout(700);

    const menuItems = await item.$$('.LayerMore .layer_list > .layer_item');
    let deleteMenuItem: ElementHandle<HTMLElement> | null = null;
    for (const menuItem of menuItems) {
      const text = normalizeText(await menuItem.textContent());
      if (text === '삭제') {
        deleteMenuItem = menuItem as ElementHandle<HTMLElement>;
        break;
      }
    }

    if (!deleteMenuItem) {
      await page.keyboard.press('Escape').catch(() => {});
      return { accountId: id, commentId, success: false, error: '삭제 메뉴 항목을 찾지 못함' };
    }

    const deleteButton = await deleteMenuItem.$('a.layer_button, .layer_button');
    if (!deleteButton) {
      return { accountId: id, commentId, success: false, error: '삭제 버튼을 찾지 못함' };
    }

    await deleteButton.click();
    await page.waitForTimeout(1500);

    const errorMessage = await checkErrorPopup(page);
    if (errorMessage) {
      return { accountId: id, commentId, success: false, error: errorMessage };
    }

    const stillThere = await findCommentItemById(root, commentId);
    if (stillThere) {
      return { accountId: id, commentId, success: false, error: '삭제 클릭 후에도 댓글이 여전히 존재함' };
    }

    return { accountId: id, commentId, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { accountId: id, commentId, success: false, error: errorMsg };
  } finally {
    releaseAccountLock(id);
  }
};
