import type { ElementHandle, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 이미지가 선택된 채로 뜨는 SmartEditor 플로팅 툴바(se-flayer-unified-toolbar)가
// 실제로 DOM에서 사라질 때까지 기다린 뒤 문단을 클릭한다.
// force:true는 Playwright의 액션 가능성 사전검사만 건너뛸 뿐 실제 브라우저
// 히트테스트는 그대로 진행되므로, 툴바가 시각적으로 남아있으면 클릭이 문단이
// 아니라 툴바로 들어가 커서가 전혀 이동하지 않고, 이후 타이핑한 본문이 통째로
// 유실되는 문제가 있었다(에디터 상에서도, 저장 후에도 본문이 빈 채로 남음).
export const clickParagraphAfterToolbarClears = async (
  page: Page,
  paragraph: ElementHandle
): Promise<boolean> => {
  await page.keyboard.press('Escape');
  try {
    await page.waitForSelector('.se-flayer-unified-toolbar', { state: 'hidden', timeout: 3000 });
  } catch {
    // 툴바가 원래 없었거나 hidden 처리가 안 되는 경우 — 그대로 진행
  }
  try {
    await paragraph.click({ timeout: 5000 });
    return true;
  } catch {
    // 그래도 막혀 있으면 최후 수단으로 force 클릭 (완전 실패보다는 낫다)
    try {
      await paragraph.click({ timeout: 3000, force: true });
      return true;
    } catch {
      return false;
    }
  }
};

// URL에서 확장자 추출 (쿼리스트링 제거)
const getExtensionFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    return ext && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) ? ext : 'png';
  } catch {
    return 'png';
  }
};

// 이미지 URL을 다운로드하여 임시 파일로 저장
export const downloadImageToTempFile = async (
  imageUrl: string,
  index: number
): Promise<string | null> => {
  try {
    console.log(`[IMAGE] 이미지 다운로드 중: ${imageUrl}`);
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      console.error(`[IMAGE] 다운로드 실패: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = os.tmpdir();
    const ext = getExtensionFromUrl(imageUrl);
    const fileName = `upload_image_${Date.now()}_${index}.${ext}`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`[IMAGE] 임시 파일 저장: ${filePath} (${Math.round(buffer.length / 1024)}KB)`);
    return filePath;
  } catch (error) {
    console.error(`[IMAGE] 다운로드 오류:`, error);
    return null;
  }
};

// Base64 이미지를 임시 파일로 저장하고 경로 반환
export const saveBase64ToTempFile = (base64Data: string, index: number): string => {
  const tempDir = os.tmpdir();
  const fileName = `upload_image_${Date.now()}_${index}.png`;
  const filePath = path.join(tempDir, fileName);

  // Base64 데이터에서 data:image/xxx;base64, 접두사 제거
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');

  fs.writeFileSync(filePath, buffer);
  return filePath;
};

// 임시 파일 정리
export const cleanupTempFiles = (filePaths: string[]) => {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      console.warn(`[IMAGE] 임시 파일 삭제 실패: ${filePath}`);
    }
  }
};

// 네이버 카페 에디터 이미지 버튼 셀렉터
const IMAGE_BUTTON_SELECTORS = [
  'button.se-image-toolbar-button',
  'button[data-name="image"]',
  '.se-toolbar button[data-module="image"]',
  '.se-toolbar-item-image button',
  'button.se-text-icon-toolbar-image',
];

// 이미지 컴포넌트 셀렉터 (업로드 확인용)
const IMAGE_COMPONENT_SELECTORS = [
  '.se-image-resource',
  '.se-component-image',
  '.se-module-image',
  'img.se-image-resource',
];

// 팝업 닫기 셀렉터
const POPUP_CLOSE_SELECTORS = [
  '.se-popup-close-button',
  '.se-popup-button-cancel',
  'button.se-popup-close',
  '.se-image-uploader-close',
];

// 이미지 업로드 팝업 닫기
const closeImagePopup = async (page: Page): Promise<void> => {
  // 방법 1: 닫기 버튼 클릭
  for (const selector of POPUP_CLOSE_SELECTORS) {
    const closeBtn = await page.$(selector);
    if (closeBtn) {
      try {
        await closeBtn.click();
        console.log(`[IMAGE] 팝업 닫기 버튼 클릭: ${selector}`);
        await page.waitForTimeout(500);
        return;
      } catch {
        // 클릭 실패 시 다음 방법 시도
      }
    }
  }

  // 방법 2: ESC 키로 팝업 닫기
  const popupDim = await page.$('.se-popup-dim');
  if (popupDim) {
    console.log('[IMAGE] ESC 키로 팝업 닫기 시도');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // 방법 3: 에디터 본문 영역 클릭 (팝업 외부 클릭)
  const editorBody = await page.$('.se-component-content');
  if (editorBody) {
    try {
      await editorBody.click({ force: true });
      console.log('[IMAGE] 에디터 본문 클릭으로 팝업 닫기');
      await page.waitForTimeout(500);
    } catch {
      // 클릭 실패 무시
    }
  }
};

// 팝업이 완전히 닫힐 때까지 대기
const waitForPopupClose = async (page: Page, maxWait = 5000): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const popupDim = await page.$('.se-popup-dim');
    if (!popupDim) {
      console.log('[IMAGE] 팝업 닫힘 확인');
      return;
    }

    // 팝업이 아직 있으면 ESC 다시 시도
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  console.log('[IMAGE] 팝업 닫기 대기 타임아웃 - 강제 진행');
};

// 단일 이미지 업로드
export const uploadSingleImage = async (page: Page, image: string): Promise<boolean> => {
  return uploadImages(page, [image]);
};

// 이미지 업로드 (URL 또는 base64 지원) - 파일선택창 한 번에 전부 선택해서 업로드.
// 예전엔 한 장씩 순차로 올리면서 매번 "마지막 문단을 다시 찾아 클릭"으로 커서를
// 복구했는데, 플로팅 툴바가 남아있는 상태에서의 클릭은 (force든 아니든) 문단이
// 아니라 툴바를 때릴 수 있어 커서가 전혀 이동하지 않는 문제가 있었다. 파일선택창
// 자체를 한 번만 띄워 여러 파일을 동시에 넘기면 이 중간 클릭 단계가 통째로
// 사라지고, SmartEditor가 업로드 순서대로 이미지를 알아서 붙여준다.
export const uploadImages = async (page: Page, images: string[]): Promise<boolean> => {
  if (!images || images.length === 0) return true;

  console.log(`[IMAGE] 이미지 ${images.length}장 업로드 시작 (파일선택창 일괄)`);
  const tempFiles: string[] = [];
  let successCount = 0;

  try {
    // 이미지를 임시 파일로 저장 (URL이면 다운로드, base64면 변환)
    const downloaded = await Promise.all(
      images.map((img, i) =>
        img.startsWith('http') ? downloadImageToTempFile(img, i) : Promise.resolve(saveBase64ToTempFile(img, i))
      )
    );
    for (const tempPath of downloaded) {
      if (tempPath) tempFiles.push(tempPath);
    }

    if (tempFiles.length === 0) {
      console.error('[IMAGE] 처리된 이미지 없음');
      return false;
    }

    let imageButton = null;
    for (const selector of IMAGE_BUTTON_SELECTORS) {
      imageButton = await page.$(selector);
      if (imageButton) {
        console.log(`[IMAGE] 이미지 버튼 발견: ${selector}`);
        break;
      }
    }

    if (!imageButton) {
      console.log('[IMAGE] 이미지 버튼 찾을 수 없음');
      return false;
    }

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      imageButton.click(),
    ]);
    await fileChooser.setFiles(tempFiles);
    console.log(`[IMAGE] ${tempFiles.length}장 파일 설정 완료 (일괄)`);

    // 이미지 컴포넌트가 전부 삽입될 때까지 대기 (최대 20초)
    for (let attempt = 0; attempt < 40; attempt++) {
      const count = await page.$$('.se-component.se-image').then((items) => items.length);
      if (count >= tempFiles.length) break;
      await page.waitForTimeout(500);
    }

    await closeImagePopup(page);
    await waitForPopupClose(page);

    const anyPopupClose = await page.$('.se-popup-close-button');
    if (anyPopupClose) {
      console.log('[IMAGE] 추가 팝업 발견 - 닫기');
      await anyPopupClose.click();
      await page.waitForTimeout(500);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    successCount = await page.$$('.se-component.se-image').then((items) => Math.min(items.length, tempFiles.length));

    // 최종 이미지 컴포넌트 확인
    let totalImageCount = 0;
    for (const selector of IMAGE_COMPONENT_SELECTORS) {
      const components = await page.$$(selector);
      if (components.length > 0) {
        totalImageCount = components.length;
        console.log(`[IMAGE] 최종 이미지 컴포넌트: ${selector} (${totalImageCount}개)`);
        break;
      }
    }

    console.log(`[IMAGE] 업로드 완료: ${successCount}/${tempFiles.length}장 성공, 에디터 내 ${totalImageCount}개 확인`);
    return successCount > 0;
  } catch (error) {
    console.error('[IMAGE] 이미지 업로드 오류:', error);
    return false;
  } finally {
    cleanupTempFiles(tempFiles);
  }
};
