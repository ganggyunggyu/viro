import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";

/**
 * 카페 댓글/가입 작업 세션 한 건을 "21lab 카페 운영 현황" 시트의 "댓글작업로그" 탭 맨 끝에 기록.
 * 사용자 요청(2026-07-19): 작업할 때마다 전부 시트에 기록.
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/append-comment-worklog.ts \
 *     --type=댓글보충 --cafes="bluegraywcwss, graykrurp" --articles=42 \
 *     --target="5~13" --success=280 --failed=16 --status=완료 --note="UI검증 완료"
 *   --datetime 생략 시 스크립트가 인자로 받은 값을 그대로 쓴다(런타임 Date.now 미사용 규칙 회피용으로 호출측에서 주입).
 */

const SHEET_ID = "1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw";
const TAB = "댓글작업로그";

const args = process.argv.slice(2);
const arg = (name: string, fallback = ""): string => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const main = async () => {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const row = [
    arg("datetime"),
    arg("type"),
    arg("cafes"),
    arg("articles"),
    arg("target"),
    arg("success"),
    arg("failed"),
    arg("status"),
    arg("note"),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:I`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  console.log("댓글작업로그 기록:", row.join(" | "));
};
main().catch((e) => { console.error(e.message); process.exit(1); });
