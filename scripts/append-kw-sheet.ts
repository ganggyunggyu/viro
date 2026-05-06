/**
 * 쇼핑지름신 광고 키워드 → 구글시트 기록
 * Usage: npx tsx --env-file=.env.local scripts/append-kw-sheet.ts
 */
import { google } from "googleapis";
import * as fs from "fs";

const SPREADSHEET_ID = "1gyipTIEogC9Qopj8w3ggBmD0k5KvAw6yNdIMXQDnwms";
const SHEET_TAB = "카페키워드";

const NEW_KEYWORDS = [
  "친구 출산선물",
  "본정심흑염소 효능",
  "90대 할머니 선물",
  "아이들 영양제",
  "흑염소 한마리",
  "보양식 추천",
  "에스트로겐 수치",
  "자연임신쌍둥이",
  "김소영흑염소",
  "80대 할머니 선물",
  "샤넬 26SS 크러시드 2.55백 매장 입고 알림 기다리는 중",
  "샤넬 슈퍼모델 토트백 가격 인상 전 매물 구하고 싶음",
  "디올 새들백 미디엄 베이지 매장 가격 비교 중",
  "보테가 카세트 미니 폰덴테 매장 입고 후기 찾는 중",
  "에르메스 콘스탄스 24 골드 매물 알림 기다리는 중",
];

const main = async () => {
  const envFile = ".env";
  const envContent = fs.readFileSync(envFile, "utf-8");
  const envVars: Record<string, string> = {};
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }

  const email = envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = envVars.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || "";
  const key = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email, key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // 1. 기존 A열 읽어서 중복 체크
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_TAB}!A:A`,
  });
  const existingSet = new Set(
    (existing.data.values || []).flat().map((v: string) => v.trim())
  );

  const toAppend = NEW_KEYWORDS.filter((kw) => !existingSet.has(kw));
  const skipped = NEW_KEYWORDS.length - toAppend.length;

  if (toAppend.length === 0) {
    console.log(`전부 중복 (${skipped}건 스킵)`);
    return;
  }

  // 2. A열에 키워드만 append
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_TAB}!A:A`,
    valueInputOption: "RAW",
    requestBody: {
      values: toAppend.map((kw) => [kw]),
    },
  });

  console.log(`✅ ${toAppend.length}건 기록 완료 (중복 ${skipped}건 스킵)`);
};

main().catch((e) => { console.error("sheet append failed:", e.message); process.exit(1); });
