import type { ElementHandle, Frame, Page } from 'playwright';
import {
  getPageForAccount,
  saveCookiesForAccount,
  loginAccount,
  acquireAccountLock,
  releaseAccountLock,
  invalidateLoginCache,
  isLoginRedirect,
  touchAccount,
} from '@/shared/lib/multi-session';
import type { NaverAccount } from '@/shared/lib/account-manager';
import { captureFailureShot } from '@/shared/lib/debug-capture';
import { incrementActivity } from '@/shared/models/daily-activity';
import { isNicknameEquivalent } from './comment-writer-utils';

export interface WriteCommentResult {
  accountId: string;
  success: boolean;
  error?: string;
  commentId?: string;
}

export interface WriteCommentOptions {
  forceFreshLogin?: boolean;
  loginWaitMs?: number;
  navigationTimeoutMs?: number;
  navigationWaitUntil?: 'commit' | 'domcontentloaded';
}

const normalizeText = (value: string | null | undefined): string => {
  return (value ?? '').replace(/\s+/g, ' ').trim();
};

export const navigateToArticle = async (
  page: Page,
  articleUrl: string,
  id: string,
  password: string,
  logPrefix: string,
  options?: WriteCommentOptions,
): Promise<{ success: true } | { success: false; error: string }> => {
  const navigationTimeoutMs = options?.navigationTimeoutMs ?? 0;
  const navigationWaitUntil = options?.navigationWaitUntil ?? 'domcontentloaded';

  await page.goto(articleUrl, { waitUntil: navigationWaitUntil, timeout: navigationTimeoutMs });
  await page.waitForTimeout(1500);

  const currentUrl = page.url();
  if (!isLoginRedirect(currentUrl)) return { success: true };

  console.log(`[${logPrefix}] ${id} 세션 만료 감지 - 재로그인 시도`);
  invalidateLoginCache(id);

  const reloginResult = await loginAccount(id, password, {
    forceFreshLogin: options?.forceFreshLogin ?? true,
    waitForLoginMs: options?.loginWaitMs,
    reason: `comment_redirect:${id}`,
  });
  if (!reloginResult.success) {
    return { success: false, error: `세션 만료 후 재로그인 실패: ${reloginResult.error}` };
  }

  await page.goto(articleUrl, { waitUntil: navigationWaitUntil, timeout: navigationTimeoutMs });
  await page.waitForTimeout(1500);
  if (isLoginRedirect(page.url())) {
    return { success: false, error: '재로그인 후에도 로그인 페이지로 리다이렉트됨' };
  }
  return { success: true };
};

export const checkErrorPopup = async (page: Page): Promise<string | null> => {
  const errorPopup = await page.$('.LayerPopup, .popup_layer, [role="alertdialog"]');
  if (!errorPopup) return null;

  const errorText = normalizeText(await errorPopup.textContent());
  if (!errorText) return '댓글/대댓글 처리 중 팝업 발생';
  return errorText.slice(0, 120);
};

const waitForCommentItem = async (
  root: Page | Frame,
  timeout: number
): Promise<boolean> => {
  try {
    await root.waitForSelector('.CommentItem', { timeout });
    return true;
  } catch {
    return false;
  }
};

export const getCommentRoot = async (page: Page): Promise<Page | Frame> => {
  try {
    await page.waitForSelector('iframe#cafe_main', { timeout: 20000 });
  } catch {
    await waitForCommentItem(page, 5000);
    return page;
  }

  const frameHandle = await page.$('iframe#cafe_main');
  const frame = await frameHandle?.contentFrame();
  if (!frame) {
    await waitForCommentItem(page, 5000);
    return page;
  }

  return frame;
};

const ARTICLE_WRITER_SELECTORS = [
  '.nick_box .nick',
  '.writer .nick',
  '.profile_info .nick',
  '.nickname',
];

export const getArticleWriterNickname = async (root: Page | Frame): Promise<string> => {
  for (const selector of ARTICLE_WRITER_SELECTORS) {
    const el = await root.$(selector);
    if (!el) continue;
    const text = normalizeText(await el.evaluate((node) => node.textContent));
    if (text) return text;
  }
  return '';
};

export const getClosestCommentItem = async (
  node: ElementHandle<Element>
): Promise<ElementHandle<HTMLElement> | null> => {
  const handle = await node.evaluateHandle((el) => el.closest('.CommentItem'));
  const element = handle.asElement();
  return element ? (element as ElementHandle<HTMLElement>) : null;
};

export const findCommentItemById = async (
  root: Page | Frame,
  commentId: string
): Promise<ElementHandle<HTMLElement> | null> => {
  const safeId = commentId.replace(/"/g, '\\"');
  const direct = await root.$(`li[id="${safeId}"]`);
  if (direct) return direct as ElementHandle<HTMLElement>;

  const dataId = await root.$(`[data-comment-id="${safeId}"]`);
  if (dataId) {
    const closest = await getClosestCommentItem(dataId);
    if (closest) return closest;
  }

  const likeCid = await root.$(`[data-cid$="-${safeId}"]`);
  if (likeCid) {
    const closest = await getClosestCommentItem(likeCid);
    if (closest) return closest;
  }

  const buttonNode = await root.$(`button#commentItem${safeId}`);
  if (buttonNode) {
    const closest = await getClosestCommentItem(buttonNode);
    if (closest) return closest;
  }

  // 댓글 닉네임 앵커의 id 속성이 "cih" + commentId 형태인 케이스 (라이브 검증됨)
  const cihAnchor = await root.$(`a[id="cih${safeId}"]`);
  if (cihAnchor) {
    const closest = await getClosestCommentItem(cihAnchor);
    if (closest) return closest;
  }

  return null;
};

const getItemText = async (
  item: ElementHandle<SVGElement | HTMLElement>,
  selector: string
): Promise<string> => {
  try {
    return await item.$eval(selector, (el) => el.textContent || '');
  } catch {
    return '';
  }
};

export const getCommentIdFromItem = async (
  item: ElementHandle<HTMLElement>
): Promise<string | undefined> => {
  const idAttr = await item.getAttribute('id');
  if (idAttr) return idAttr;

  const dataId = await item.getAttribute('data-comment-id');
  if (dataId) return dataId;

  try {
    const buttonId = await item.$eval('button[id^="commentItem"]', (el) => el.id);
    if (buttonId) return buttonId.replace('commentItem', '');
  } catch {}

  try {
    const cid = await item.$eval('[data-cid]', (el) => el.getAttribute('data-cid'));
    if (cid) {
      const parts = cid.split('-');
      return parts[parts.length - 1] || cid;
    }
  } catch {}

  try {
    const cihId = await item.$eval('a[id^="cih"]', (el) => el.id);
    if (cihId) return cihId.replace(/^cih/, '');
  } catch {}

  return undefined;
};

const findWrittenComment = async (
  root: Page | Frame,
  contentPreview: string,
  commenterNickname: string
): Promise<{ found: boolean; commentId?: string }> => {
  const commentItems = await root.$$('.CommentItem:not(.CommentItem--reply)');
  let textOnlyMatch: { found: boolean; commentId?: string } | null = null;

  for (const item of commentItems) {
    const commentText = normalizeText(await getItemText(item, '.comment_text_view'));
    if (!commentText.includes(contentPreview)) continue;

    const commentId = await getCommentIdFromItem(item as ElementHandle<HTMLElement>);

    if (commenterNickname) {
      const commentNickname = normalizeText(await getItemText(item, '.comment_nickname'));
      const isNicknameMatch =
        !commentNickname ||
        isNicknameEquivalent(commentNickname, commenterNickname);
      if (!isNicknameMatch) {
        textOnlyMatch ??= { found: true, commentId };
        continue;
      }
    }

    return { found: true, commentId };
  }

  if (textOnlyMatch) {
    console.log('[COMMENT] 닉네임 불일치, 내용 매칭으로 댓글 등록 확인');
    return textOnlyMatch;
  }

  return { found: false };
};

export const writeCommentWithAccount = async (
  account: NaverAccount,
  cafeId: string,
  articleId: number,
  content: string,
  options?: WriteCommentOptions,
): Promise<WriteCommentResult> => {
  const { id, password } = account;

  await acquireAccountLock(id);

  try {
    const page = await getPageForAccount(id);
    touchAccount(id);
    const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

    const navResult = await navigateToArticle(page, articleUrl, id, password, 'COMMENT', options);
    if (!navResult.success) {
      return { accountId: id, success: false, error: navResult.error };
    }
    touchAccount(id);

    const notFoundIndicator = await page.$('.error_content, .deleted_article, .no_article');
    if (notFoundIndicator) {
      return { accountId: id, success: false, error: 'ARTICLE_NOT_READY:글이 아직 처리 중이거나 삭제됨' };
    }

    const root = await getCommentRoot(page);

    // 글쓴이 본인 계정으로는 댓글 작성 금지 (자작극처럼 보이는 것 방지)
    const writerNickname = await getArticleWriterNickname(root);
    const commenterNickname = normalizeText(account.nickname || account.id);
    if (writerNickname && isNicknameEquivalent(writerNickname, commenterNickname)) {
      return {
        accountId: id,
        success: false,
        error: `글쓴이 본인 계정으로는 댓글 작성 불가 (작성자 닉네임: ${writerNickname})`,
      };
    }

    // 대댓글 입력창이 열려있으면 닫기 (취소 버튼 클릭)
    const openReplyCancel = await root.$('.CommentWriter:has(.btn_cancel) a.btn_cancel');
    if (openReplyCancel) {
      console.log(`[COMMENT] ${id} 열린 대댓글 입력창 닫기`);
      await openReplyCancel.click();
      await page.waitForTimeout(500);
    }

    // 댓글 입력창 셀렉터: btn_cancel이 없는 CommentWriter (대댓글 제외)
    const commentInputSelector = '.CommentWriter:not(:has(.btn_cancel)) textarea.comment_inbox_text';
    let commentInput = await root.$(commentInputSelector);

    if (!commentInput) {
      try {
        commentInput = await root.waitForSelector(commentInputSelector, { timeout: 12000 });
      } catch {}
    }

    if (!commentInput) {
      console.log(`[COMMENT] ${id} 댓글 입력창 없음 - URL: ${page.url()}`);
      await captureFailureShot(page, {
        tag: 'article-not-ready',
        accountId: id,
        note: `댓글 입력창 없음 (cafeId=${cafeId}, articleId=${articleId})`,
      });
      return { accountId: id, success: false, error: 'ARTICLE_NOT_READY:댓글 입력창을 찾을 수 없습니다. 글이 아직 처리 중일 수 있습니다.' };
    }

    await commentInput.click();
    await page.waitForTimeout(500);
    const sanitizedContent = content.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    await commentInput.fill(sanitizedContent);
    await page.waitForTimeout(500);

    // 댓글 등록 버튼 셀렉터: btn_cancel이 없는 CommentWriter (대댓글 제외)
    const submitButtonSelector = '.CommentWriter:not(:has(.btn_cancel)) a.btn_register';
    const submitButton = await root.$(submitButtonSelector);

    if (!submitButton) {
      return { accountId: id, success: false, error: '등록 버튼(a.btn_register)을 찾을 수 없습니다.' };
    }

    await submitButton.click();
    await page.waitForTimeout(2500);

    const errorMessage = await checkErrorPopup(page);
    if (errorMessage) {
      return { accountId: id, success: false, error: errorMessage };
    }

    const contentPreview = normalizeText(sanitizedContent).slice(0, 30);
    let found = false;
    let commentId: string | undefined;

    for (let retry = 0; retry < 6; retry++) {
      const verifyRoot = await getCommentRoot(page);
      const match = await findWrittenComment(verifyRoot, contentPreview, commenterNickname);
      found = match.found;
      commentId = match.commentId;

      if (found) break;

      if (retry < 5) {
        const waitMs = retry < 2 ? 1000 : 2000;
        console.log(`[COMMENT] ${id} 댓글 확인 재시도 ${retry + 1}/6...`);
        await page.waitForTimeout(waitMs);
      }
    }

    if (!found) {
      console.log(`[COMMENT] ${id} 재로딩 후 댓글 재확인 시도`);
      const reloadResult = await navigateToArticle(page, articleUrl, id, password, 'COMMENT-VERIFY', options);
      if (!reloadResult.success) {
        return { accountId: id, success: false, error: `댓글 검증 재진입 실패: ${reloadResult.error}` };
      }

      await page.waitForTimeout(1500);

      for (let retry = 0; retry < 4; retry++) {
        const verifyRoot = await getCommentRoot(page);
        const match = await findWrittenComment(verifyRoot, contentPreview, commenterNickname);
        found = match.found;
        commentId = match.commentId;
        if (found) break;

        if (retry < 3) {
          console.log(`[COMMENT] ${id} 재로딩 검증 재시도 ${retry + 1}/4...`);
          await page.waitForTimeout(1500);
        }
      }
    }

    if (!found) {
      return {
        accountId: id,
        success: false,
        error: `댓글이 등록되지 않음 (닉네임+내용 매칭 실패)`,
      };
    }

    await saveCookiesForAccount(id);
    await incrementActivity(id, cafeId, 'comments');

    return { accountId: id, success: true, commentId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { accountId: id, success: false, error: errorMsg };
  } finally {
    releaseAccountLock(id);
  }
}

export const writeReplyWithAccount = async (
  account: NaverAccount,
  cafeId: string,
  articleId: number,
  content: string,
  commentIndex: number = 0,
  options?: {
    parentCommentId?: string;
    parentComment?: string;
    parentNickname?: string;
  }
): Promise<WriteCommentResult> => {
  const { id, password } = account;

  await acquireAccountLock(id);

  try {
    const page = await getPageForAccount(id);
    touchAccount(id);
    const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;

    const navResult = await navigateToArticle(page, articleUrl, id, password, 'REPLY');
    if (!navResult.success) {
      return { accountId: id, success: false, error: navResult.error };
    }
    touchAccount(id);

    await page.waitForTimeout(1500);

    const { parentCommentId, parentComment, parentNickname } = options ?? {};
    const getItemText = async (
      item: ElementHandle<SVGElement | HTMLElement>,
      selector: string
    ): Promise<string> => {
      try {
        return await item.$eval(selector, (el) => el.textContent || '');
      } catch {
        return '';
      }
    };

    const root = await getCommentRoot(page);

    // 글쓴이 본인 계정으로는 대댓글 작성도 금지
    const writerNickname = await getArticleWriterNickname(root);
    const commenterNickname = normalizeText(account.nickname || account.id);
    if (writerNickname && isNicknameEquivalent(writerNickname, commenterNickname)) {
      return {
        accountId: id,
        success: false,
        error: `글쓴이 본인 계정으로는 댓글 작성 불가 (작성자 닉네임: ${writerNickname})`,
      };
    }

    let targetItem: ElementHandle<HTMLElement> | null = null;
    let targetIndex = -1;

    if (parentCommentId) {
      targetItem = await findCommentItemById(root, parentCommentId);
    }

    if (!targetItem) {
      const commentItems = await root.$$('.CommentItem:not(.CommentItem--reply)');
      if (commentItems.length === 0) {
        console.log(`[REPLY] ${id} 답글쓰기 버튼 없음 - URL: ${page.url()}`);
        return { accountId: id, success: false, error: 'ARTICLE_NOT_READY:답글쓰기 버튼을 찾을 수 없습니다. 댓글이 아직 없을 수 있습니다.' };
      }

      console.log(`[REPLY] ${id} 메인 댓글 ${commentItems.length}개 발견, 타겟 인덱스: ${commentIndex}`);

      const targetCommentText = normalizeText(parentComment);
      const targetCommentPreview = targetCommentText ? targetCommentText.slice(0, 40) : '';
      const targetNickname = normalizeText(parentNickname);

      if (!targetCommentPreview && targetNickname && commentIndex >= 0 && commentIndex < commentItems.length) {
        const indexedNickname = normalizeText(await getItemText(commentItems[commentIndex], '.comment_nickname'));
        if (indexedNickname === targetNickname) {
          targetIndex = commentIndex;
        }
      }

      if (targetIndex < 0 && (targetCommentPreview || targetNickname)) {
        for (let i = 0; i < commentItems.length; i++) {
          const item = commentItems[i];
          const commentText = normalizeText(await getItemText(item, '.comment_text_view'));
          const commentNickname = normalizeText(await getItemText(item, '.comment_nickname'));
          const textMatches = targetCommentPreview ? commentText.includes(targetCommentPreview) : true;
          const nicknameMatches = targetNickname ? commentNickname === targetNickname : true;

          if (textMatches && nicknameMatches) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex < 0) {
        targetIndex = commentIndex;
        if (targetIndex >= commentItems.length) {
          console.log(`[REPLY] ${id} 대댓글 인덱스 ${targetIndex} → ${commentItems.length - 1}로 조정`);
          targetIndex = commentItems.length - 1;
        }
      }

      targetItem = commentItems[targetIndex] as ElementHandle<HTMLElement>;
    }

    const replyButton = await targetItem?.$('a.comment_info_button');
    if (!replyButton) {
      return { accountId: id, success: false, error: '답글쓰기 버튼을 찾을 수 없습니다.' };
    }

    await replyButton.click();
    await page.waitForTimeout(1000);

    const replyInput = await root.$('.CommentWriter:has(.btn_cancel) textarea.comment_inbox_text');
    if (!replyInput) {
      return { accountId: id, success: false, error: 'ARTICLE_NOT_READY:대댓글 입력창을 찾을 수 없습니다.' };
    }

    await replyInput.click();
    await page.waitForTimeout(500);
    const sanitizedReplyContent = content.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
    await replyInput.fill(sanitizedReplyContent);
    await page.waitForTimeout(500);

    const submitButton = await root.$('.CommentWriter:has(.btn_cancel) a.btn_register');
    if (!submitButton) {
      return { accountId: id, success: false, error: '대댓글 등록 버튼을 찾을 수 없습니다.' };
    }

    await submitButton.click();
    await page.waitForTimeout(2000);

    const errorMessage = await checkErrorPopup(page);
    if (errorMessage) {
      return { accountId: id, success: false, error: errorMessage };
    }

    const sanitizedPreview = sanitizedReplyContent.slice(0, 20);
    let replyFound = false;

    for (let retry = 0; retry < 4; retry++) {
      const verifyRoot = await getCommentRoot(page);
      const replyAreas = await verifyRoot.$$('.comment_area');
      for (const area of replyAreas) {
        const text = await area.textContent();
        if (text?.includes(sanitizedPreview)) {
          replyFound = true;
          break;
        }
      }

      if (replyFound) break;

      if (retry < 3) {
        console.log(`[REPLY] ${id} 대댓글 확인 재시도 ${retry + 1}/4...`);
        await page.waitForTimeout(2000);
      }
    }

    if (!replyFound) {
      return { accountId: id, success: false, error: '대댓글이 등록되지 않음 (목록에서 확인 불가)' };
    }

    if (targetItem) {
      const commentLikeButton = await targetItem.$('a.u_likeit_list_btn._button');
      if (commentLikeButton) {
        const isCommentLiked = await commentLikeButton.evaluate(
          (el) => el.classList.contains('on') || el.getAttribute('aria-pressed') === 'true'
        );
        if (!isCommentLiked) {
          await commentLikeButton.click();
          const indexLabel = targetIndex >= 0 ? ` (index: ${targetIndex})` : '';
          console.log(`[DEBUG] ${id} 댓글 좋아요 클릭${indexLabel}`);
          await page.waitForTimeout(500);
        }
      }
    }

    let likeButton = await root.$('a.u_likeit_list_btn._button[data-type="like"]');
    if (!likeButton) {
      likeButton = await page.$('a.u_likeit_list_btn._button[data-type="like"]');
    }
    if (likeButton) {
      const isLiked = await likeButton.evaluate(
        (el) => el.classList.contains('on') || el.getAttribute('aria-pressed') === 'true'
      );
      if (!isLiked) {
        await likeButton.click();
        console.log(`[DEBUG] ${id} 글 좋아요 클릭`);
        await page.waitForTimeout(500);
      }
    }

    await saveCookiesForAccount(id);
    await incrementActivity(id, cafeId, 'replies');
    await incrementActivity(id, cafeId, 'likes');

    return { accountId: id, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
    return { accountId: id, success: false, error: errorMsg };
  } finally {
    releaseAccountLock(id);
  }
}
