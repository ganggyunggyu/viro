import {
  getPageForAccount,
  saveCookiesForAccount,
  isAccountLoggedIn,
  isLoginRedirect,
  loginAccount,
  acquireAccountLock,
  releaseAccountLock,
  invalidateLoginCache,
} from '@/shared/lib/multi-session';
import type { NaverAccount } from '@/shared/lib/account-manager';
import { uploadImages, clickParagraphAfterToolbarClears } from './image-uploader';

// 부제 패턴 (숫자. 형식)
const SUBTITLE_PATTERN = /^\d+\.\s*/;
const MODIFY_LOGIN_WAIT_MS = 3 * 60 * 1000;
const EDITOR_READY_SELECTOR =
  'p.se-text-paragraph, .FlexableTextArea textarea.textarea_input, .se-component-content';
const TITLE_INPUT_SELECTOR =
  '.FlexableTextArea textarea.textarea_input, textarea.textarea_input, textarea[placeholder*="제목"], input[placeholder*="제목"]';
const MODIFY_TYPE_DELAY_MS =
  parseInt(process.env.MODIFY_TYPE_DELAY_MS || '', 10) || 120;

export interface ModifyArticleInput {
  cafeId: string;
  articleId: number;
  newTitle: string;
  newContent: string;
  category?: string; // 게시판명 (미지정 시 카테고리 변경 안함)
  images?: string[]; // Base64 이미지 배열
  enableComments?: boolean; // true: 댓글 허용으로 변경
}

export interface ModifyResult {
  success: boolean;
  articleId: number;
  modifierAccountId: string;
  error?: string;
}

export const modifyArticleWithAccount = async (
  account: NaverAccount,
  input: ModifyArticleInput
): Promise<ModifyResult> => {
  const { id, password } = account;
  const { cafeId, articleId, newTitle, newContent, category, images } = input;

  // 계정 락 획득 (동시 접근 방지)
  await acquireAccountLock(id);

  try {
    const loggedIn = await isAccountLoggedIn(id);

    if (!loggedIn) {
      const loginResult = await loginAccount(id, password, {
        waitForLoginMs: MODIFY_LOGIN_WAIT_MS,
        reason: `modify_${articleId}`,
      });
      if (!loginResult.success) {
        return {
          success: false,
          articleId,
          modifierAccountId: id,
          error: loginResult.error || '로그인 실패',
        };
      }
    }

    const page = await getPageForAccount(id);

    // JS dialog 자동 처리 (네이버 수정 페이지 alert/confirm 대응)
    page.on('dialog', async (dialog) => {
      try {
        await dialog.accept();
      } catch {}
    });

    // 글 수정 페이지로 이동
    const modifyUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}/modify`;
    const legacyModifyUrl = `https://cafe.naver.com/ArticleWrite.nhn?m=modify&clubid=${cafeId}&articleid=${articleId}`;
    console.log('[DEBUG] 수정 페이지 이동:', modifyUrl);

    const navigateToModifyPage = async (url: string = modifyUrl): Promise<void> => {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    };

    const recoverModifyLoginRedirect = async (
      reason: string,
    ): Promise<ModifyResult | null> => {
      console.log(
        `[MODIFY] ${id} ${reason} - 강제 재로그인 후 수정 페이지 재진입`,
      );
      invalidateLoginCache(id);

      const reloginResult = await loginAccount(id, password, {
        waitForLoginMs: MODIFY_LOGIN_WAIT_MS,
        reason: `modify_redirect_${articleId}`,
        forceFreshLogin: true,
      });

      if (!reloginResult.success) {
        return {
          success: false,
          articleId,
          modifierAccountId: id,
          error: reloginResult.error || '수정 페이지 재로그인 실패',
        };
      }

      await navigateToModifyPage();
      return null;
    };

    await navigateToModifyPage();

    if (isLoginRedirect(page.url())) {
      const recoverResult = await recoverModifyLoginRedirect(
        '수정 페이지 로그인 리다이렉트 감지',
      );
      if (recoverResult) return recoverResult;
    }

    // 에디터 로딩 대기
    try {
      await page.waitForSelector(EDITOR_READY_SELECTOR, { timeout: 15000 });
    } catch {
      console.log('[DEBUG] 에디터 셀렉터 대기 실패, 스크린샷 촬영');
      await page.screenshot({ path: '/tmp/modify-debug.png', fullPage: true });
      console.log('[DEBUG] 현재 URL:', page.url());
      const title = await page.title();
      console.log('[DEBUG] 페이지 제목:', title);

      if (isLoginRedirect(page.url())) {
        const recoverResult = await recoverModifyLoginRedirect(
          '에디터 대기 중 로그인 페이지 전환 감지',
        );
        if (recoverResult) return recoverResult;
        await page.waitForSelector(
          EDITOR_READY_SELECTOR,
          { timeout: 15000 },
        );
      }

      await page.waitForTimeout(5000);
    }
    await page.waitForTimeout(2000);

    // 카테고리 변경 (지정된 경우에만)
    if (category) {
      const boardSelectButton = await page.$('.FormSelectButton button.button');
      if (boardSelectButton) {
        await boardSelectButton.click();
        await page.waitForTimeout(500);

        const options = await page.$$('ul.option_list li.item button.option');
        let found = false;

        for (const option of options) {
          const text = await option.textContent();
          if (text?.trim() === category) {
            await option.click();
            found = true;
            console.log(`[DEBUG] 카테고리 "${category}"로 변경됨`);
            break;
          }
        }

        if (!found) {
          console.log(`[DEBUG] 카테고리 "${category}" 없음, 기존 카테고리 유지`);
          // 드롭다운 닫기 (ESC 키)
          await page.keyboard.press('Escape');
        }

        await page.waitForTimeout(500);
      }
    }

    // 제목 입력창 찾기 및 수정
    let titleInput = await page.$(TITLE_INPUT_SELECTOR);

    if (!titleInput) {
      console.log(`[MODIFY] 제목 입력창 없음 - 구형 수정 URL 재시도 (현재 URL: ${page.url()})`);
      await navigateToModifyPage(legacyModifyUrl);
      await page.waitForTimeout(3000);
      titleInput = await page.$(TITLE_INPUT_SELECTOR);
    }

    if (!titleInput) {
      return {
        success: false,
        articleId,
        modifierAccountId: id,
        error: `제목 입력창을 찾을 수 없습니다. 수정 권한이 없을 수 있습니다. 현재 URL: ${page.url()}`,
      };
    }

    // 기존 제목 지우고 새 제목 입력
    await titleInput.click({ clickCount: 3 }); // 전체 선택
    await page.waitForTimeout(200);
    await titleInput.fill(newTitle);
    await page.waitForTimeout(500);

    // 본문 입력 영역 찾기
    const contentArea = await page.$('p.se-text-paragraph');

    if (!contentArea) {
      return {
        success: false,
        articleId,
        modifierAccountId: id,
        error: '본문 입력창을 찾을 수 없습니다.',
      };
    }

    // 기존 본문 전체 선택 후 삭제 (macOS: Meta+A, Windows: Control+A)
    await contentArea.click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Meta+A');
    await page.waitForTimeout(200);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    // Meta+A로 선택된 텍스트만 지워지고 기존에 삽입된 이미지 컴포넌트는 남는 경우가 있어
    // (재수정 시 이미지가 계속 누적되는 원인) 남은 이미지 컴포넌트를 하나씩 개별 삭제한다.
    let remainingImageGuard = 0;
    while (remainingImageGuard < 10) {
      const staleImage = await page.$('.se-component.se-image');
      if (!staleImage) break;
      await staleImage.click();
      await page.waitForTimeout(200);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(200);
      remainingImageGuard++;
    }
    if (remainingImageGuard > 0) {
      console.log(`[MODIFY] ${id} 기존 이미지 컴포넌트 ${remainingImageGuard}개 정리`);
      await page.waitForTimeout(300);
    }

    // SmartEditor는 문단(component)마다 별도의 편집 영역이라 Meta+A는 포커스된
    // 문단 하나만 지운다 — 이전 저장본에 문단이 여러 개였다면 첫 문단 이후 내용이
    // 그대로 남아 새 이미지/본문 앞에 잔존 텍스트가 끼는 원인이 된다. 빈 문단
    // 하나만 남을 때까지 남은 문단을 개별적으로 지운다.
    // 빈 문단은 SmartEditor가 플레이스홀더 문구를 실제 textContent로 채워둔다
    // ("내용을 입력하세요.") — 이걸 잔존 텍스트로 오인하면 지울 게 없는 문단을
    // 60번 반복 시도하다 가드에 걸려 끝나고, 그 여파로 뒤이은 진짜 본문 타이핑이
    // 커밋되지 않아 사진만 남고 글이 통째로 빈 상태로 저장되는 문제로 이어졌다.
    const PLACEHOLDER_TEXT = '내용을 입력하세요.';
    let remainingTextGuard = 0;
    while (remainingTextGuard < 60) {
      const paragraphs = await page.$$('p.se-text-paragraph');
      const nonEmpty: typeof paragraphs = [];
      for (const p of paragraphs) {
        const text = await p.textContent();
        const trimmed = text?.trim();
        if (trimmed && trimmed !== PLACEHOLDER_TEXT) nonEmpty.push(p);
      }
      if (nonEmpty.length === 0) break;
      await nonEmpty[0].click({ clickCount: 3, force: true }).catch(() => {});
      await page.waitForTimeout(150);
      await page.keyboard.press('Meta+A');
      await page.waitForTimeout(100);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(150);
      remainingTextGuard++;
    }
    if (remainingTextGuard > 0) {
      console.log(`[MODIFY] ${id} 남은 텍스트 문단 ${remainingTextGuard}개 정리`);
      await page.waitForTimeout(300);
    }

    // 새 본문 입력 - HTML 태그를 plain text로 변환
    const plainContent = newContent
      .replace(/<\/p>\s*<p>/gi, '\n')  // </p><p> → 줄바꿈
      .replace(/<br\s*\/?>/gi, '\n')   // <br> → 줄바꿈
      .replace(/<[^>]*>/g, '')         // 나머지 태그 제거
      .trim();

    // 원고가 문장마다 빈 줄로 끊겨 오는 경우가 많아 2~4문장씩 묶어 단락화
    // (부제 줄은 항상 새 단락으로 분리해 이미지 삽입 위치 탐지에 영향 없게 유지)
    const groupLinesIntoParagraphs = (rawLines: string[]): string[] => {
      const items = rawLines.map((l) => l.trim()).filter(Boolean);
      const grouped: string[] = [];
      let i = 0;
      while (i < items.length) {
        if (SUBTITLE_PATTERN.test(items[i])) {
          if (grouped.length > 0 && grouped[grouped.length - 1] !== '') grouped.push('');
          grouped.push(items[i]);
          grouped.push('');
          i++;
          continue;
        }
        const groupSize = 2 + Math.floor(Math.random() * 3); // 2~4문장
        let taken = 0;
        while (taken < groupSize && i < items.length && !SUBTITLE_PATTERN.test(items[i])) {
          grouped.push(items[i]);
          i++;
          taken++;
        }
        if (i < items.length) grouped.push('');
      }
      return grouped;
    };

    const lines = groupLinesIntoParagraphs(plainContent.split('\n'));

    // 이미지는 맨 위에 전부 몰아서 넣고, 그 다음에 본문을 이어서 작성한다
    // (부제마다 중간에 끼워 넣는 방식은 이미지 삽입 도중 커서 위치가 틀어지며
    // 이미지가 유실되는 문제가 있었음 — 상단 일괄 삽입이 더 안정적)
    if (images && images.length > 0) {
      console.log(`[MODIFY] ${id} 이미지 ${images.length}장 상단에 먼저 삽입`);
      const uploadSuccess = await uploadImages(page, images);
      if (uploadSuccess) {
        console.log(`[MODIFY] ${id} 이미지 업로드 완료`);
      } else {
        console.warn(`[MODIFY] ${id} 이미지 업로드 실패 - 글 수정은 계속 진행`);
      }
      await page.waitForTimeout(500);
      // 마지막 이미지가 선택된 채로 뜬 플로팅 툴바가 클릭을 가로막을 수 있어
      // 툴바가 실제로 사라질 때까지 기다린 뒤 마지막 문단 끝으로 이동한다.
      const paragraphsAfterImages = await page.$$('p.se-text-paragraph');
      const lastParagraphAfterImages = paragraphsAfterImages[paragraphsAfterImages.length - 1];
      if (lastParagraphAfterImages) {
        await clickParagraphAfterToolbarClears(page, lastParagraphAfterImages);
        await page.keyboard.press('End');
      }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        await page.keyboard.type(lines[i], { delay: MODIFY_TYPE_DELAY_MS });
      }
      if (i < lines.length - 1) {
        await page.keyboard.press('Enter');
      }
    }

    await page.waitForTimeout(500);

    // 댓글 허용 토글
    if (input.enableComments !== undefined) {
      try {
        const settingArea = await page.$('.setting_area');
        if (settingArea) {
          await settingArea.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
        }

        const commentCheckbox = await page.$('#coment');
        if (commentCheckbox) {
          const isChecked = await commentCheckbox.evaluate((el) => (el as HTMLInputElement).checked);
          if (isChecked !== input.enableComments) {
            const label = await page.$('label[for="coment"]');
            if (label) {
              await label.click();
            } else {
              await commentCheckbox.click();
            }
            console.log(`[MODIFY] 댓글 ${input.enableComments ? '허용' : '차단'}으로 변경`);
            await page.waitForTimeout(300);
          }
        }
      } catch {
        console.log('[MODIFY] 댓글 설정 변경 실패 (무시)');
      }
    }

    // 수정 완료 버튼 클릭
    const submitButton = await page.$('a.BaseButton--skinGreen, a.BaseButton');

    if (!submitButton) {
      return {
        success: false,
        articleId,
        modifierAccountId: id,
        error: '수정 완료 버튼을 찾을 수 없습니다.',
      };
    }

    await submitButton.click();

    // 수정 완료 후 글 상세 페이지로 리다이렉트 대기
    // 주의: 시작 URL 자체가 이미 articles/\d+/modify 형태라 /articles\/\d+/ 정규식은
    // 리다이렉트 없이도 즉시 통과해버린다 — 실제로는 저장이 끝나기도 전에 성공
    // 처리되어 다음 작업으로 넘어가며 저장이 중간에 끊기는 원인이었다. modify가
    // 아닌 진짜 상세 페이지로 옮겨갔는지까지 확인해야 한다.
    try {
      await page.waitForURL((url) => /articles\/\d+/.test(url.href) && !url.href.includes('/modify'), {
        timeout: 15000,
      });
      console.log('[DEBUG] 수정 완료, URL 변화 감지됨:', page.url());
    } catch {
      console.log('[DEBUG] URL 변화 없음, 추가 대기...');
      await page.waitForTimeout(5000);
    }
    // 리다이렉트 이후에도 서버 쪽 저장 처리가 이어질 수 있어 약간의 여유를 둔다
    await page.waitForTimeout(1500);

    await saveCookiesForAccount(id);

    return {
      success: true,
      articleId,
      modifierAccountId: id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      success: false,
      articleId,
      modifierAccountId: id,
      error: errorMessage,
    };
  } finally {
    releaseAccountLock(id);
  }
}
