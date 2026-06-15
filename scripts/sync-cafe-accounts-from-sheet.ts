import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { google } from 'googleapis';
import mongoose from 'mongoose';

import {
  ACCOUNT_MASTER_RANGE,
  ACCOUNT_MASTER_TAB,
  CAFE_ACCOUNT_RANGE,
  CAFE_ACCOUNT_SPREADSHEET_ID,
  CAFE_ACCOUNT_TAB,
  CAFE_WRITER_ACCOUNT_RANGE,
  CAFE_WRITER_ACCOUNT_TAB,
  buildSheetAccountSyncPlan,
  parseCafeAccountRows,
  parseMasterAccountRows,
  parseWriterAccountIds,
  type SheetSyncAccount,
} from './cafe-account-sheet-source';
import { Account } from '../src/shared/models/account';
import { User } from '../src/shared/models/user';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const SPREADSHEET_ID = process.env.CAFE_ACCOUNT_SPREADSHEET_ID || CAFE_ACCOUNT_SPREADSHEET_ID;
const APPLY = process.argv.includes('--apply');
const CHECK = process.argv.includes('--check') || !APPLY;

interface UpsertSummary {
  created: number;
  updated: number;
  skippedInactive: number;
}

const getSheetsClient = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY missing');
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
};

const readValues = async (
  sheets: ReturnType<typeof getSheetsClient>,
  tab: string,
  range: string,
): Promise<string[][]> => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tab}'!${range}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  return (response.data.values || []) as string[][];
};

const connect = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI missing');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
};

const getUserId = async (): Promise<string> => {
  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!user) {
    throw new Error(`user not found: ${LOGIN_ID}`);
  }

  return user.userId;
};

const upsertAccounts = async (
  userId: string,
  accounts: SheetSyncAccount[],
): Promise<UpsertSummary> => {
  const summary = {
    created: 0,
    updated: 0,
    skippedInactive: accounts.filter(({ isActive }) => !isActive).length,
  };

  for (const account of accounts.filter(({ isActive }) => isActive)) {
    const existing = await Account.findOne({ userId, accountId: account.accountId })
      .select('_id')
      .lean<{ _id: mongoose.Types.ObjectId } | null>();
    const update = {
      userId,
      accountId: account.accountId,
      password: account.password,
      nickname: account.nickname,
      role: account.role,
      isActive: true,
      isMain: false,
      dailyPostLimit: account.dailyPostLimit,
      activityHours: { start: 0, end: 24 },
      restDays: [],
    };

    if (existing) {
      await Account.updateOne({ _id: existing._id }, { $set: update });
      summary.updated += 1;
      continue;
    }

    await Account.create(update);
    summary.created += 1;
  }

  return summary;
};

const main = async (): Promise<void> => {
  const sheets = getSheetsClient();
  const [masterRows, cafeRows, writerRows] = await Promise.all([
    readValues(sheets, ACCOUNT_MASTER_TAB, ACCOUNT_MASTER_RANGE),
    readValues(sheets, CAFE_ACCOUNT_TAB, CAFE_ACCOUNT_RANGE),
    readValues(sheets, CAFE_WRITER_ACCOUNT_TAB, CAFE_WRITER_ACCOUNT_RANGE),
  ]);
  const plan = buildSheetAccountSyncPlan(
    parseMasterAccountRows(masterRows),
    parseCafeAccountRows(cafeRows),
    parseWriterAccountIds(writerRows),
  );

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? 'apply' : 'check',
        spreadsheetId: SPREADSHEET_ID,
        masterTab: ACCOUNT_MASTER_TAB,
        cafeAccountTab: CAFE_ACCOUNT_TAB,
        writerAccountTab: CAFE_WRITER_ACCOUNT_TAB,
        accounts: plan.accounts.length,
        activeWriters: plan.accounts.filter(({ role, isActive }) => role === 'writer' && isActive).length,
        activeCommenters: plan.accounts.filter(({ role, isActive }) => role === 'commenter' && isActive).length,
        missingInMaster: plan.missingInMaster,
        writerMismatchIds: plan.writerMismatchIds,
      },
      null,
      2,
    ),
  );

  if (plan.missingInMaster.length > 0 || plan.writerMismatchIds.length > 0) {
    throw new Error('카페 계정 시트 검증 실패');
  }

  if (CHECK && !APPLY) {
    return;
  }

  await connect();
  const userId = await getUserId();
  const summary = await upsertAccounts(userId, plan.accounts);
  console.log(
    `[SHEET_SYNC] 완료: 신규 ${summary.created}, 업데이트 ${summary.updated}, 비활성스킵 ${summary.skippedInactive}`,
  );
  await mongoose.disconnect();
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('[SHEET_SYNC]', error instanceof Error ? error.message : error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
