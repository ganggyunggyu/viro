import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
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
  type SheetAccountSyncPlan,
} from './cafe-account-sheet-source';
import { Account } from '../src/shared/models/account';
import { User } from '../src/shared/models/user';

const LOGIN_ID = process.env.LOGIN_ID || '21lab';

interface UpdateOneResult {
  matchedCount: number;
  upsertedCount: number;
}

interface UpdateManyResult {
  modifiedCount: number;
}

export interface AccountSyncModel {
  findAccountIds: (userId: string) => Promise<string[]>;
  updateOne: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options: { upsert: boolean; setDefaultsOnInsert: boolean },
  ) => Promise<UpdateOneResult>;
  updateMany: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) => Promise<UpdateManyResult>;
}

export interface SheetValuesSource {
  readValues: (tab: string, range: string) => Promise<unknown[][]>;
}

export interface SheetAccountSyncSummary {
  created: number;
  updated: number;
  skippedInactive: number;
  deactivated: number;
  pruned: number;
  driftAccountIds: string[];
}

interface ApplySheetAccountSyncPlanInput {
  userId: string;
  plan: SheetAccountSyncPlan;
  accountModel: AccountSyncModel;
  prune?: boolean;
}

interface SyncCafeAccountsFromSheetInput {
  userId: string;
  sheetSource: SheetValuesSource;
  accountModel: AccountSyncModel;
  apply?: boolean;
  prune?: boolean;
}

interface SyncCafeAccountsFromSheetResult {
  plan: SheetAccountSyncPlan;
  summary?: SheetAccountSyncSummary;
}

const assertSafeToApply = (plan: SheetAccountSyncPlan): void => {
  const activeAccountCount = plan.accounts.filter(({ isActive }) => isActive).length;

  if (activeAccountCount === 0) {
    throw new Error('시트 파싱 결과 active 계정이 0개이므로 동기화를 중단합니다');
  }

  if (plan.missingInMaster.length > 0 || plan.writerMismatchIds.length > 0) {
    throw new Error('카페 계정 시트 검증 실패');
  }
};

export const applySheetAccountSyncPlan = async ({
  userId,
  plan,
  accountModel,
  prune = false,
}: ApplySheetAccountSyncPlanInput): Promise<SheetAccountSyncSummary> => {
  assertSafeToApply(plan);

  const summary: SheetAccountSyncSummary = {
    created: 0,
    updated: 0,
    skippedInactive: plan.accounts.filter(({ isActive }) => !isActive).length,
    deactivated: 0,
    pruned: 0,
    driftAccountIds: plan.driftAccountIds,
  };

  for (const account of plan.accounts.filter(({ isActive }) => isActive)) {
    const result = await accountModel.updateOne(
      { userId, accountId: account.accountId },
      {
        $set: {
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
          targetCafes: account.targetCafes,
          targetCafeIds: account.targetCafeIds,
          mvpn: account.mvpn,
          sheetMeta: {
            blogUrl: account.blogUrl,
            category: account.category,
            owner: account.owner,
            ...account.sheetMeta,
          },
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    if (result.upsertedCount > 0) {
      summary.created += 1;
    } else {
      summary.updated += 1;
    }
  }

  if (plan.deactivateAccountIds.length > 0) {
    const result = await accountModel.updateMany(
      {
        userId,
        accountId: { $in: plan.deactivateAccountIds },
      },
      { $set: { isActive: false } },
    );
    summary.deactivated = result.modifiedCount;
  }

  if (prune && plan.driftAccountIds.length > 0) {
    const result = await accountModel.updateMany(
      {
        userId,
        accountId: { $in: plan.driftAccountIds },
      },
      { $set: { isActive: false } },
    );
    summary.pruned = result.modifiedCount;
  }

  return summary;
};

export const upsertAccounts = applySheetAccountSyncPlan;

export const syncCafeAccountsFromSheet = async ({
  userId,
  sheetSource,
  accountModel,
  apply = true,
  prune = false,
}: SyncCafeAccountsFromSheetInput): Promise<SyncCafeAccountsFromSheetResult> => {
  const [masterRows, cafeRows, writerRows] = await Promise.all([
    sheetSource.readValues(ACCOUNT_MASTER_TAB, ACCOUNT_MASTER_RANGE),
    sheetSource.readValues(CAFE_ACCOUNT_TAB, CAFE_ACCOUNT_RANGE),
    sheetSource.readValues(CAFE_WRITER_ACCOUNT_TAB, CAFE_WRITER_ACCOUNT_RANGE),
  ]);
  const masterAccounts = parseMasterAccountRows(masterRows);
  const cafeAccounts = parseCafeAccountRows(cafeRows);
  const writerAccountIds = parseWriterAccountIds(writerRows);
  const preliminaryPlan = buildSheetAccountSyncPlan(
    masterAccounts,
    cafeAccounts,
    writerAccountIds,
  );

  assertSafeToApply(preliminaryPlan);

  const existingDbAccountIds = await accountModel.findAccountIds(userId);
  const plan = buildSheetAccountSyncPlan(
    masterAccounts,
    cafeAccounts,
    writerAccountIds,
    existingDbAccountIds,
  );

  if (!apply) {
    return { plan };
  }

  const summary = await applySheetAccountSyncPlan({
    userId,
    plan,
    accountModel,
    prune,
  });
  return { plan, summary };
};

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

const createSheetValuesSource = (
  sheets: ReturnType<typeof getSheetsClient>,
  spreadsheetId: string,
): SheetValuesSource => ({
  readValues: async (tab, range) => {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tab}'!${range}`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    return response.data.values || [];
  },
});

const createAccountSyncModel = (): AccountSyncModel => ({
  findAccountIds: async (userId) => {
    const accounts = await Account.find({ userId })
      .select('accountId')
      .lean<Array<{ accountId: string }>>();
    return accounts.map(({ accountId }) => accountId);
  },
  updateOne: async (filter, update, options) => {
    const result = await Account.updateOne(filter, update, options);
    return {
      matchedCount: result.matchedCount,
      upsertedCount: result.upsertedCount,
    };
  },
  updateMany: async (filter, update) => {
    const result = await Account.updateMany(filter, update);
    return { modifiedCount: result.modifiedCount };
  },
});

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

const main = async (): Promise<void> => {
  dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true });
  dotenv.config({ path: resolve(process.cwd(), '.env'), quiet: true });

  const apply = process.argv.includes('--apply');
  const prune = process.argv.includes('--prune');
  const spreadsheetId = process.env.CAFE_ACCOUNT_SPREADSHEET_ID || CAFE_ACCOUNT_SPREADSHEET_ID;

  await connect();
  const userId = await getUserId();
  const { plan, summary } = await syncCafeAccountsFromSheet({
    userId,
    sheetSource: createSheetValuesSource(getSheetsClient(), spreadsheetId),
    accountModel: createAccountSyncModel(),
    apply,
    prune,
  });

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'check',
        prune,
        spreadsheetId,
        masterTab: ACCOUNT_MASTER_TAB,
        cafeAccountTab: CAFE_ACCOUNT_TAB,
        writerAccountTab: CAFE_WRITER_ACCOUNT_TAB,
        accounts: plan.accounts.length,
        activeWriters: plan.accounts.filter(({ role, isActive }) => role === 'writer' && isActive).length,
        activeCommenters: plan.accounts.filter(({ role, isActive }) => role === 'commenter' && isActive).length,
        deactivateAccountIds: plan.deactivateAccountIds,
        driftAccountIds: plan.driftAccountIds,
        missingInMaster: plan.missingInMaster,
        writerMismatchIds: plan.writerMismatchIds,
      },
      null,
      2,
    ),
  );

  if (summary) {
    console.log(
      `[SHEET_SYNC] 완료: 신규 ${summary.created}, 업데이트 ${summary.updated}, 비활성 ${summary.deactivated}, 정리 ${summary.pruned}, drift ${summary.driftAccountIds.length}`,
    );
  }
};

const SCRIPT_PATH = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main()
    .catch((error: unknown) => {
      console.error('[SHEET_SYNC]', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => undefined);
    });
}
