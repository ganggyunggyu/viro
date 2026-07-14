/**
 * 카페 개설 결과를 "21lab 카페 운영 현황" 구글시트에 실시간 기록.
 *
 * DB(CafeConfig)와 별개로 사람이 보는 운영 시트가 따로 있고, 지금까지는
 * 카페를 만들 때마다 수동으로 시트에 적어왔다. createNaverCafe() 로 카페를
 * 만들 때마다 이 함수를 호출해서 시트가 항상 실제 상태를 반영하게 유지한다.
 *
 * 구글 자격증명(GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY)이 보통
 * `.env` 에 있고 `.env.local` 에는 없어서, 이 모듈은 두 파일을 모두 로드한다 —
 * 스크립트가 `--env-file=.env.local` 로만 실행돼도 깨지지 않게 하기 위함.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';

const OPERATIONS_SHEET_ID = '1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw';
const CAFE_INFO_TAB = '카페정보 및 링크';
const CAFE_ACCOUNT_TAB = '카페계정정보';

export interface SheetCafeRecord {
  category: string;
  name: string;
  cafeId: string;
  slug: string;
  ownerAccountId: string;
  ownerNickname: string;
  memberCount: number;
  status?: string;
  memo?: string;
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

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

/** "카페정보 및 링크" 탭 맨 끝에 새 카페 한 줄 추가. 기존 행과 동일하게 PC/모바일 링크는 HYPERLINK 수식으로 넣는다 */
const appendCafeInfoRow = async (record: SheetCafeRecord): Promise<void> => {
  const sheets = getSheetsClient();
  const pcUrl = `https://cafe.naver.com/${record.slug}`;
  const mobileUrl = `https://m.cafe.naver.com/${record.slug}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId: OPERATIONS_SHEET_ID,
    range: `${CAFE_INFO_TAB}!A:N`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          record.category,
          record.name,
          record.cafeId,
          record.slug,
          `=HYPERLINK("${pcUrl}","PC")`,
          `=HYPERLINK("${mobileUrl}","모바일")`,
          record.ownerAccountId,
          record.ownerNickname,
          record.memberCount,
          '',
          '',
          '',
          record.status ?? '신규개설',
          record.memo ?? '',
        ],
      ],
    },
  });
};

/**
 * "카페계정정보" 탭에서 소유 계정 행을 찾아 소유카페 칸을 채운다.
 * 계정이 시트에 아직 없으면(=DB엔 있는데 시트엔 누락된 경우) 조용히 건너뛴다 —
 * 이 함수는 계정을 새로 추가하는 용도가 아니라 기존 행을 갱신하는 용도라서다.
 */
const markAccountAsOwner = async (accountId: string, cafeName: string): Promise<boolean> => {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: OPERATIONS_SHEET_ID,
    range: `${CAFE_ACCOUNT_TAB}!A:M`,
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === accountId);
  if (rowIndex <= 0) return false; // 헤더(0)거나 못 찾음

  const sheetRowNumber = rowIndex + 1; // 1-based
  await sheets.spreadsheets.values.update({
    spreadsheetId: OPERATIONS_SHEET_ID,
    range: `${CAFE_ACCOUNT_TAB}!G${sheetRowNumber}:M${sheetRowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[cafeName, '', '', '', '', '', '카페장 계정']],
    },
  });
  return true;
};

export const syncCafeToOperationsSheet = async (
  record: SheetCafeRecord,
): Promise<{ cafeInfoAdded: boolean; ownerMarked: boolean; error?: string }> => {
  try {
    await appendCafeInfoRow(record);
    const ownerMarked = await markAccountAsOwner(record.ownerAccountId, record.name);
    return { cafeInfoAdded: true, ownerMarked };
  } catch (error) {
    return {
      cafeInfoAdded: false,
      ownerMarked: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
};
