import type { AccountRole } from '../src/shared/models/account';
import { toCafeSlug } from '../src/shared/lib/naver-cafe-membership';

export const CAFE_ACCOUNT_SPREADSHEET_ID = '1dMilxTgiwt-XjZux5pSk9EpUnLngYj1XqSukO1088mU';
export const ACCOUNT_MASTER_TAB = '21lab 블로그 계정LIST';
export const CAFE_ACCOUNT_TAB = '카페 계정';
export const CAFE_WRITER_ACCOUNT_TAB = '카페 글쓰기 계정';

export const ACCOUNT_MASTER_RANGE = 'A8:I1097';
export const CAFE_ACCOUNT_RANGE = 'A1:J500';
export const CAFE_WRITER_ACCOUNT_RANGE = 'A1:H200';

export interface SheetMasterAccount {
  rowNumber: number;
  accountId: string;
  password: string;
  nickname: string;
  blogUrl: string;
  category: string;
  mvpn: string;
  owner: string;
  note: string;
}

export interface CafeSheetAccount {
  rowNumber: number;
  accountId: string;
  role: AccountRole;
  isActive: boolean;
  targetCafes: string;
  dailyPostLimit: number;
  note: string;
}

export interface SheetSyncAccount extends CafeSheetAccount {
  password: string;
  nickname: string;
  blogUrl: string;
  category: string;
  mvpn: string;
  owner: string;
  sourceRowNumber: number;
  targetCafeIds: string[];
  sheetMeta: {
    masterRowNumber: number;
    cafeRowNumber: number;
    masterNote: string;
    cafeNote: string;
  };
}

export interface SheetAccountSyncPlan {
  accounts: SheetSyncAccount[];
  deactivateAccountIds: string[];
  driftAccountIds: string[];
  missingInMaster: string[];
  writerMismatchIds: string[];
}

const normalize = (value: unknown): string => String(value ?? '').trim();

const parseBoolean = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return !['false', 'n', 'no', '0', 'x', '비활성', '사용안함', '사용x'].includes(normalized);
};

const parseRole = (value: string): AccountRole => {
  if (value === 'writer' || value === '글쓰기') {
    return 'writer';
  }

  return 'commenter';
};

const parseDailyPostLimit = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
};

const parseTargetCafeIds = (value: string): string[] => {
  const seen = new Set<string>();

  return value
    .split(/[\n,;|]+/)
    .map((targetCafe) => toCafeSlug(targetCafe) || normalize(targetCafe))
    .filter((targetCafe) => {
      if (!targetCafe || seen.has(targetCafe)) {
        return false;
      }

      seen.add(targetCafe);
      return true;
    });
};

export const parseMasterAccountRows = (
  rows: unknown[][],
  firstRowNumber = 8,
): SheetMasterAccount[] => {
  return rows.slice(1).flatMap((row, index) => {
    const accountId = normalize(row[3]);
    const password = normalize(row[4]);

    if (!accountId || !password) {
      return [];
    }

    return [{
      rowNumber: firstRowNumber + index + 1,
      accountId,
      password,
      nickname: normalize(row[1]) || accountId,
      blogUrl: normalize(row[2]),
      category: normalize(row[5]),
      mvpn: normalize(row[6]),
      owner: normalize(row[7]),
      note: normalize(row[8]),
    }];
  });
};

export const parseCafeAccountRows = (
  rows: unknown[][],
  firstRowNumber = 1,
): CafeSheetAccount[] => {
  return rows.slice(1).flatMap((row, index) => {
    const accountId = normalize(row[0]);

    if (!accountId) {
      return [];
    }

    return [{
      rowNumber: firstRowNumber + index + 1,
      accountId,
      role: parseRole(normalize(row[1])),
      isActive: parseBoolean(normalize(row[2] || 'true')),
      targetCafes: normalize(row[7]),
      dailyPostLimit: parseDailyPostLimit(normalize(row[8])),
      note: normalize(row[9]),
    }];
  });
};

export const parseWriterAccountIds = (rows: unknown[][]): string[] => {
  const seen = new Set<string>();
  const accountIds: string[] = [];

  for (const row of rows.slice(1)) {
    const accountId = normalize(row[0]);
    const isActive = parseBoolean(normalize(row[2] || 'true'));

    if (!accountId || !isActive || seen.has(accountId)) {
      continue;
    }

    seen.add(accountId);
    accountIds.push(accountId);
  }

  return accountIds;
};

export const buildSheetAccountSyncPlan = (
  masterAccounts: SheetMasterAccount[],
  cafeAccounts: CafeSheetAccount[],
  writerAccountIds: string[],
  existingDbAccountIds: string[] = [],
): SheetAccountSyncPlan => {
  const masterById = new Map(masterAccounts.map((account) => [account.accountId, account]));
  const writerIdSet = new Set(writerAccountIds);
  const cafeAccountIdSet = new Set(cafeAccounts.map(({ accountId }) => accountId));
  const missingInMaster: string[] = [];
  const writerMismatchIds: string[] = [];
  const accounts: SheetSyncAccount[] = [];
  const deactivateAccountIds = [...new Set(
    cafeAccounts
      .filter(({ isActive }) => !isActive)
      .map(({ accountId }) => accountId),
  )];
  const driftAccountIds = [...new Set(existingDbAccountIds)]
    .filter((accountId) => !cafeAccountIdSet.has(accountId));

  for (const cafeAccount of cafeAccounts) {
    const masterAccount = masterById.get(cafeAccount.accountId);

    if (!masterAccount) {
      missingInMaster.push(cafeAccount.accountId);
      continue;
    }

    const writerTabRole: AccountRole = writerIdSet.has(cafeAccount.accountId) ? 'writer' : 'commenter';
    if (cafeAccount.isActive && cafeAccount.role !== writerTabRole) {
      writerMismatchIds.push(cafeAccount.accountId);
      continue;
    }

    accounts.push({
      ...cafeAccount,
      password: masterAccount.password,
      nickname: masterAccount.nickname,
      blogUrl: masterAccount.blogUrl,
      category: masterAccount.category,
      mvpn: masterAccount.mvpn,
      owner: masterAccount.owner,
      sourceRowNumber: masterAccount.rowNumber,
      targetCafeIds: parseTargetCafeIds(cafeAccount.targetCafes),
      sheetMeta: {
        masterRowNumber: masterAccount.rowNumber,
        cafeRowNumber: cafeAccount.rowNumber,
        masterNote: masterAccount.note,
        cafeNote: cafeAccount.note,
      },
    });
  }

  return {
    accounts,
    deactivateAccountIds,
    driftAccountIds,
    missingInMaster,
    writerMismatchIds,
  };
};
