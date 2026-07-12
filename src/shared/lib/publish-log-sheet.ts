/**
 * 카페 발행 + 노출체크 결과를 "21lab 카페 운영 현황" 구글시트에 실시간 기록.
 *
 * 기존 "자동발행현황" 탭(gid=1001003)은 다른 콘텐츠 파이프라인(맛집 계열 카페,
 * blog-filler-* 생성 API) 전용 컬럼 구조라서 그대로 재사용하면 데이터가 섞인다.
 * 그래서 이 모듈은 naver-cafe-creation/sheet-sync.ts 패턴을 따라 같은 스프레드시트에
 * 전용 탭("카페발행노출로그")을 새로 만들어 기록한다.
 *
 * 구글 자격증명(GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY)이 `.env`에 있고
 * `.env.local`에는 없어서, sheet-sync.ts와 동일하게 두 파일을 모두 로드한다.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';
import { connectDB } from './mongodb';
import { Cafe } from '@/shared/models';
import { createLogger } from './logger';
import type { ExposureStatus } from './exposure-check';

const log = createLogger('PUBLISH-LOG-SHEET');

const OPERATIONS_SHEET_ID = '1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw';
const LOG_TAB = '카페발행노출로그';
const LOG_HEADER = [
  '카페명',
  '카페ID',
  '키워드',
  '글ID',
  '글링크',
  '발행일시',
  '작성계정',
  '노출여부',
  '노출순위',
  '노출확인일시',
  '검색노출링크',
];

export interface PublishLogRecord {
  cafeId: string;
  keyword: string;
  articleId: number;
  articleUrl: string;
  writerAccountId: string;
  publishedAt?: Date;
}

export interface ExposureLogRecord {
  cafeId: string;
  articleId?: number;
  status: ExposureStatus;
  rank?: number;
  foundLink?: string;
  checkedAt?: Date;
}

export interface SheetLogResult {
  success: boolean;
  error?: string;
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
const cafeMetaCache = new Map<string, { name: string; cafeUrl: string }>();

const getSheetsClient = () => {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
};

const resolveCafeMeta = async (cafeId: string): Promise<{ name: string; cafeUrl: string }> => {
  const cached = cafeMetaCache.get(cafeId);
  if (cached) return cached;

  try {
    await connectDB();
    const cafe = await Cafe.findOne({ cafeId }).lean();
    const meta = { name: cafe?.name ?? cafeId, cafeUrl: cafe?.cafeUrl ?? '' };
    cafeMetaCache.set(cafeId, meta);
    return meta;
  } catch {
    return { name: cafeId, cafeUrl: '' };
  }
};

let ensureTabPromise: Promise<void> | null = null;

const ensureLogTabExists = async (): Promise<void> => {
  if (ensureTabPromise) return ensureTabPromise;

  ensureTabPromise = (async () => {
    const sheets = getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: OPERATIONS_SHEET_ID });
    const exists = (meta.data.sheets || []).some((s) => s.properties?.title === LOG_TAB);
    if (exists) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: OPERATIONS_SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: LOG_TAB } } }],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: OPERATIONS_SHEET_ID,
      range: `${LOG_TAB}!A1:K1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [LOG_HEADER] },
    });

    log.info(`"${LOG_TAB}" 탭 생성 완료`);
  })();

  try {
    await ensureTabPromise;
  } catch (error) {
    ensureTabPromise = null;
    throw error;
  }
};

const formatKst = (date: Date): string =>
  date.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ');

/** 글 발행 성공 직후 한 줄 기록 (post-handler.ts / keyword-processor.ts에서 호출) */
export const logPublishToSheet = async (record: PublishLogRecord): Promise<SheetLogResult> => {
  try {
    await ensureLogTabExists();
    const sheets = getSheetsClient();
    const cafeMeta = await resolveCafeMeta(record.cafeId);
    const publishedAt = record.publishedAt ?? new Date();

    await sheets.spreadsheets.values.append({
      spreadsheetId: OPERATIONS_SHEET_ID,
      range: `${LOG_TAB}!A:K`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [
          [
            cafeMeta.name,
            record.cafeId,
            record.keyword,
            record.articleId,
            record.articleUrl,
            formatKst(publishedAt),
            record.writerAccountId,
            '',
            '',
            '',
            '',
          ],
        ],
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    log.error('발행 로그 기록 실패', { cafeId: record.cafeId, articleId: record.articleId, error: message });
    return { success: false, error: message };
  }
};

/** 노출체크 실행 후 호출 — 같은 (카페ID, 글ID) 발행 로그 행을 찾아 노출 컬럼만 갱신, 없으면 새 행 추가 */
export const logExposureResultToSheet = async (record: ExposureLogRecord): Promise<SheetLogResult> => {
  try {
    await ensureLogTabExists();
    const sheets = getSheetsClient();
    const checkedAt = record.checkedAt ?? new Date();

    const existingRowIndex = await findLogRowIndex(sheets, record.cafeId, record.articleId);

    if (existingRowIndex !== null) {
      const sheetRow = existingRowIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: OPERATIONS_SHEET_ID,
        range: `${LOG_TAB}!H${sheetRow}:K${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[record.status, record.rank ? String(record.rank) : '', formatKst(checkedAt), record.foundLink ?? '']],
        },
      });
      return { success: true };
    }

    const cafeMeta = await resolveCafeMeta(record.cafeId);
    await sheets.spreadsheets.values.append({
      spreadsheetId: OPERATIONS_SHEET_ID,
      range: `${LOG_TAB}!A:K`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [
          [
            cafeMeta.name,
            record.cafeId,
            '',
            record.articleId ?? '',
            '',
            '',
            '',
            record.status,
            record.rank ? String(record.rank) : '',
            formatKst(checkedAt),
            record.foundLink ?? '',
          ],
        ],
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    log.error('노출 로그 기록 실패', { cafeId: record.cafeId, articleId: record.articleId, error: message });
    return { success: false, error: message };
  }
};

const findLogRowIndex = async (
  sheets: ReturnType<typeof google.sheets>,
  cafeId: string,
  articleId?: number
): Promise<number | null> => {
  if (!articleId) return null;

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: OPERATIONS_SHEET_ID,
    range: `${LOG_TAB}!A:K`,
  });
  const rows = existing.data.values || [];
  const rowIndex = rows.findIndex(
    (row, i) => i > 0 && String(row[1]) === cafeId && String(row[3]) === String(articleId)
  );

  return rowIndex > 0 ? rowIndex : null;
};
