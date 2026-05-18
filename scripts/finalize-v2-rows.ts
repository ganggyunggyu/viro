import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { google } from "googleapis";
import { readFileSync, existsSync } from "fs";
import { parseViralResponse } from "../src/features/viral/viral-parser";
import { formatComments } from "./format-comments-claude-tab";

const SHEET_ID = "1gyipTIEogC9Qopj8w3ggBmD0k5KvAw6yNdIMXQDnwms";
const OUT_TAB = "카페원고_0518_v2";
const MANIFEST = "/tmp/v2-prompts/manifest.json";

interface ManifestItem {
  idx: number;
  keyword: string;
  promptFile: string;
  outFile: string;
  refCount: number;
}

const getAuth = () =>
  new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

const main = async () => {
  const manifest: ManifestItem[] = JSON.parse(readFileSync(MANIFEST, "utf-8"));
  console.log(`manifest ${manifest.length}개`);

  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  const today = new Date().toISOString().split("T")[0];
  const rowsToAppend: (string | number)[][] = [];

  let ok = 0, fail = 0;
  for (const m of manifest) {
    if (!existsSync(m.outFile)) {
      console.log(`[${m.idx}] ${m.keyword} ⏳ 출력 없음`);
      continue;
    }
    const content = readFileSync(m.outFile, "utf-8");
    const parsed = parseViralResponse(content);
    if (!parsed) {
      console.log(`[${m.idx}] ${m.keyword} ❌ 파싱실패`);
      rowsToAppend.push([m.keyword, "[파싱실패]", content.slice(0, 4000), "", 0, m.refCount, today]);
      fail++;
      continue;
    }
    rowsToAppend.push([
      m.keyword,
      parsed.title,
      parsed.body,
      formatComments(JSON.stringify(parsed.comments)),
      parsed.comments.length,
      m.refCount,
      today,
    ]);
    console.log(`[${m.idx}] ${m.keyword} ✅ 본문${parsed.body.length}자 댓글${parsed.comments.length}개`);
    ok++;
  }

  if (rowsToAppend.length === 0) {
    console.log("기록할 행 없음");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${OUT_TAB}!A:G`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rowsToAppend },
  });

  console.log(`\n=== 시트 기록 완료 ===`);
  console.log(`성공 ${ok} / 실패 ${fail}`);
};

main().catch((e) => { console.error(e); process.exit(1); });
