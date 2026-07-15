import type { Page } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const CAPTURE_ENABLED = process.env.DEBUG_CAPTURE !== 'false';
const CAPTURE_DIR = process.env.DEBUG_CAPTURE_DIR || path.resolve(process.cwd(), 'debug-shots');

export type FailureShotTag = 'login-timeout' | 'captcha-error' | 'article-not-ready' | 'join-fail';

interface CaptureFailureShotOptions {
  tag: FailureShotTag;
  accountId: string;
  note?: string;
}

const buildStamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const sanitize = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '_');

/**
 * 실패 시점의 네이버 화면을 png + html + 메타(json)로 남긴다.
 * 네이버가 영수증 캡차 대신 어떤 인증 화면을 띄우는지는 셀렉터 타임아웃 메시지만으로는
 * 알 수 없어서, 실제 DOM과 화면을 그대로 받아둬야 판단이 된다.
 *
 * 디버그 보조이므로 어떤 경우에도 예외를 밖으로 던지지 않는다 — 캡처 실패가 본 작업을 막으면 안 된다.
 */
export const captureFailureShot = async (
  page: Page,
  { tag, accountId, note }: CaptureFailureShotOptions,
): Promise<void> => {
  if (!CAPTURE_ENABLED) return;

  const stamp = buildStamp();
  const base = `${sanitize(tag)}-${sanitize(accountId)}-${stamp}`;
  const dir = path.join(CAPTURE_DIR, stamp.slice(0, 10));

  try {
    await mkdir(dir, { recursive: true });

    const url = page.url();
    const shotPath = path.join(dir, `${base}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });

    const html = await page.content().catch(() => '');
    if (html) await writeFile(path.join(dir, `${base}.html`), html, 'utf-8');

    const bodyText = await page
      .locator('body')
      .innerText({ timeout: 3000 })
      .catch(() => '');

    await writeFile(
      path.join(dir, `${base}.json`),
      JSON.stringify({ tag, accountId, url, note, capturedAt: stamp, bodyText: bodyText.slice(0, 4000) }, null, 2),
      'utf-8',
    );

    console.log(`[CAPTURE] ${accountId} ${tag} 화면 저장: ${shotPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[CAPTURE] ${accountId} ${tag} 캡처 실패: ${message}`);
  }
};
