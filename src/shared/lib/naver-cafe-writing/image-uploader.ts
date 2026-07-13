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

// 단일 이미지 업로드 (내부용)
const uploadSingleImageFile = async (page: Page, filePath: string, index: number): Promise<boolean> => {
  try {
    // 이미지 버튼 찾기
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

    // filechooser 이벤트로 파일 선택
    console.log(`[IMAGE] ${index + 1}번째 이미지 filechooser 대기 중...`);
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }),
      imageButton.click(),
    ]);

    await fileChooser.setFiles([filePath]);
    console.log(`[IMAGE] ${index + 1}번째 파일 설정 완료`);

    // 업로드 완료 대기
    await page.waitForTimeout(3000);

    // 업로드 진행 상태 확인 (최대 10초)
    for (let retry = 0; retry < 10; retry++) {
      const uploadProgress = await page.$('.se-upload-progress, .upload-progress, .se-loading');
      if (!uploadProgress) break;
      console.log(`[IMAGE] ${index + 1}번째 업로드 진행 중... (${retry + 1}/10)`);
      await page.waitForTimeout(1000);
    }

    // 팝업 닫기
    await closeImagePopup(page);
    await waitForPopupClose(page);

    // 이미지 업로드 후 다른 팝업(지도 등)이 열릴 수 있으므로 추가로 닫기
    const anyPopupClose = await page.$('.se-popup-close-button');
    if (anyPopupClose) {
      console.log('[IMAGE] 추가 팝업 발견 - 닫기');
      await anyPopupClose.click();
      await page.waitForTimeout(500);
    }

    // ESC로 혹시 남은 팝업 닫기
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 팝업이 닫히면 contenteditable은 커서 위치를 그대로 유지하므로 별도로 클릭해
    // 포커스를 복귀시키지 않는다. (예전엔 여기서 '.se-component-content, .se-content'를
    // page.$()로 다시 찾아 클릭했는데, 이는 항상 문서의 첫 번째 매치를 잡아버려 이미지를
    // 여러 장 연속 업로드할 때마다 커서가 맨 위로 튀는 버그였다 — 뒤 이미지·본문이
    // 엉뚱한 위치에 들어가는 원인)

    return true;
  } catch (error) {
    console.error(`[IMAGE] ${index + 1}번째 이미지 업로드 오류:`, error);
    return false;
  }
};

// 이미지 업로드 (URL 또는 base64 지원) - 한 장씩 순차 업로드
export const uploadImages = async (page: Page, images: string[]): Promise<boolean> => {
  if (!images || images.length === 0) return true;

  console.log(`[IMAGE] 이미지 ${images.length}장 업로드 시작 (순차 업로드)`);
  const tempFiles: string[] = [];
  let successCount = 0;

  try {
    // 이미지를 임시 파일로 저장 (URL이면 다운로드, base64면 변환)
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      let tempPath: string | null = null;

      if (img.startsWith('http')) {
        tempPath = await downloadImageToTempFile(img, i);
      } else {
        tempPath = saveBase64ToTempFile(img, i);
        console.log(`[IMAGE] 임시 파일 생성 (base64): ${tempPath}`);
      }

      if (tempPath) {
        tempFiles.push(tempPath);
      } else {
        console.warn(`[IMAGE] 이미지 ${i + 1} 처리 실패`);
      }
    }

    if (tempFiles.length === 0) {
      console.error('[IMAGE] 처리된 이미지 없음');
      return false;
    }

    // 각 이미지를 순차적으로 업로드
    for (let i = 0; i < tempFiles.length; i++) {
      console.log(`[IMAGE] ${i + 1}/${tempFiles.length}번째 이미지 업로드 시작`);
      const success = await uploadSingleImageFile(page, tempFiles[i], i);
      if (success) {
        successCount++;
        console.log(`[IMAGE] ${i + 1}/${tempFiles.length}번째 이미지 업로드 성공`);
      } else {
        console.warn(`[IMAGE] ${i + 1}/${tempFiles.length}번째 이미지 업로드 실패`);
      }

      // 다음 이미지 업로드 전 잠시 대기
      if (i < tempFiles.length - 1) {
        await page.waitForTimeout(1000);

        // 이미지를 여러 장 연속으로 올릴 때, 파일 선택창(OS 네이티브 다이얼로그)이
        // 뜨고 닫히는 과정에서 에디터의 커서/선택 상태가 풀리는 경우가 있다.
        // 그 상태에서 다음 이미지를 올리면 엉뚱한 위치(문서 맨 끝 등)에 붙는 문제가
        // 있어, 매번 실제 "마지막" 문단을 다시 찾아 그 끝으로 커서를 명시적으로 옮긴다.
        // (첫 번째 매치를 쓰는 page.$()가 아니라 마지막 요소를 써야 한다 — 안 그러면
        // 문서 맨 위 첫 문단을 잡아버리는 별개의 버그가 생긴다)
        // 방금 올린 이미지가 선택된 채로 떠 있는 플로팅 툴바가 문단 클릭을 가로막을 수
        // 있어, 툴바가 실제로 사라질 때까지 기다린 뒤 클릭한다(force 클릭은 클릭
        // 자체는 "성공"하지만 실제로는 여전히 툴바를 클릭해버려 커서가 전혀
        // 이동하지 않고 이후 타이핑이 전부 유실되는 원인이었다).
        const paragraphs = await page.$$('p.se-text-paragraph');
        const lastParagraph = paragraphs[paragraphs.length - 1];
        if (lastParagraph) {
          await clickParagraphAfterToolbarClears(page, lastParagraph);
          await page.keyboard.press('End');
          await page.waitForTimeout(200);
        }
      }
    }

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
