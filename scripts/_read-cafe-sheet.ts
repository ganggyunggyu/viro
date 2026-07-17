import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';

const SHEET_ID = '1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw';
const TAB = '카페정보 및 링크';

const main = async () => {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:N`,
  });

  const rows = res.data.values || [];
  console.log(JSON.stringify(rows, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
