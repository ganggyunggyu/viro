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

// 클릭 기반 커서 이동은 결국 브라우저의 실제 히트테스트를 타기 때문에, 화면 어딘가에
// 남아있는 오버레이(플로팅 툴바 등)가 있으면 문단이 아니라 그 오버레이를 클릭해버릴
// 수 있다 — 클릭 자체는 에러 없이 "성공"하지만 커서는 전혀 이동하지 않고, 그 뒤에
// 타이핑한 본문 전체가 저장되지 않는(사진만 남는) 문제로 이어졌다. document.createRange()
// + Selection API로 문단 끝에 커서를 직접 꽂으면 화면에 뭐가 떠 있든 상관없이
// 확실하게 그 문단으로 포커스가 이동한다.
export const placeCursorAtEndOfParagraph = async (page: Page, paragraph: ElementHandle): Promise<void> => {
  await page.keyboard.press('Escape');
  await paragraph.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    (node as HTMLElement).focus();
  });
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

    // 파일선택창 한 번에 전부 넘기는 일괄 업로드는(에디터를 방금 비우고 정리한
    // 직후에는) 파일선택창까지는 뜨는데 이미지가 하나도 삽입되지 않는(0/3) 문제가
    // 실제 운영 플로우에서 반복 재현됐다 — 원인은 명확히 못 찾았지만, 정리 직후가
    // 아닌 상태에서 단독으로 테스트하면 잘 되는 걸 보면 방금 끝난 DOM 조작과의
    // 상호작용 문제로 보인다. 한 장씩 순차로 올리는 예전 방식은 안정적으로
    // 검증됐으므로, 이미지 사이 커서 복구만 Selection API로 교체해 유지한다.
    for (let i = 0; i < tempFiles.length; i++) {
      let imageButton = null;
      for (const selector of IMAGE_BUTTON_SELECTORS) {
        imageButton = await page.$(selector);
        if (imageButton) break;
      }
      if (!imageButton) {
        console.log(`[IMAGE] ${i + 1}번째 이미지 버튼 찾을 수 없음`);
        break;
      }

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }),
        imageButton.click(),
      ]);
      await fileChooser.setFiles([tempFiles[i]]);
      console.log(`[IMAGE] ${i + 1}/${tempFiles.length}번째 파일 설정 완료`);

      for (let attempt = 0; attempt < 20; attempt++) {
        const count = await page.$$('.se-component.se-image').then((items) => items.length);
        if (count >= i + 1) break;
        await page.waitForTimeout(500);
      }

      for (let attempt = 0; attempt < 10; attempt++) {
        const dim = await page.$('.se-popup-dim');
        if (!dim) break;
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      // 다음 이미지를 올리기 전, 방금 삽입된 이미지의 플로팅 툴바가 다음 버튼
      // 클릭을 가로막지 않도록 Selection API로 마지막 문단에 커서를 놓아둔다.
      if (i < tempFiles.length - 1) {
        const paragraphs = await page.$$('p.se-text-paragraph');
        const lastParagraph = paragraphs[paragraphs.length - 1];
        if (lastParagraph) {
          await placeCursorAtEndOfParagraph(page, lastParagraph);
          await page.waitForTimeout(200);
        }
      }
    }

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
