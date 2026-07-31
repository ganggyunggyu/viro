import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { google } from 'googleapis';

const SHEET_ID = '1aIKP9XnB20q8WWvwZzMNk2yM0waKZcQ1x6CtyM19HNw';
const TARGET_GID = 250477480;

const main = async () => {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  console.log('=== 문서 제목:', meta.data.properties?.title);
  console.log('=== 탭 목록 ===');
  for (const s of meta.data.sheets || []) {
    console.log(`  ${s.properties?.title} (gid: ${s.properties?.sheetId})`);
  }

  const target = meta.data.sheets?.find((s) => s.properties?.sheetId === TARGET_GID);
  const tabName = target?.properties?.title;
  console.log(`\n=== 타겟 탭: ${tabName} ===\n`);

  const all = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:Z`,
  });
  const rows = all.data.values || [];
  console.log(`총 ${rows.length}행\n`);
  rows.forEach((row, i) => {
    console.log(`${i + 1} | ${row.join(' | ')}`);
  });
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
