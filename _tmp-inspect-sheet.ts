import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';

const SHEET_ID = '1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw';

const main = async () => {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  console.log('=== ALL TABS ===');
  for (const s of meta.data.sheets || []) {
    console.log(s.properties?.sheetId, s.properties?.title, s.properties?.gridProperties?.rowCount, s.properties?.gridProperties?.columnCount);
  }

  const targetTitle = (meta.data.sheets || []).find(s => s.properties?.sheetId === 1001003)?.properties?.title;
  console.log('\n=== TARGET TAB (gid=1001003) TITLE ===', targetTitle);

  if (targetTitle) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${targetTitle}!A1:Z5`,
    });
    console.log('\n=== FIRST 5 ROWS ===');
    (res.data.values || []).forEach((row, i) => console.log(i, JSON.stringify(row)));
  }
};

main().catch((e) => { console.error(e); process.exit(1); });
