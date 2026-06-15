import mongoose from 'mongoose';

import { getCafeWriterAccounts } from '../src/shared/config/cafe-account-policy';
import type { NaverAccount } from '../src/shared/lib/account-manager';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';

export interface DbAccountSnapshot {
  accountId: string;
  nickname?: string;
  role?: string;
  isActive?: boolean;
}

export interface DbCafeSnapshot {
  cafeId: string;
  name: string;
  isActive?: boolean;
}

export interface CafeWriterPolicyRow {
  cafeId: string;
  cafeName: string;
  writerAccountIds: string[];
}

export interface AccountRosterAudit {
  activeWriterIds: string[];
  activeCommenterIds: string[];
  inactiveIds: string[];
  unknownRoleIds: string[];
  cafeWriterPolicies: CafeWriterPolicyRow[];
  emptyWriterCafeNames: string[];
  ok: boolean;
}

export const LOGIN_ID = '21lab';
export const REQUIRED_WRITER_CAFE_NAMES = ['샤넬오픈런', '쇼핑지름신'];

const sortIds = (ids: string[]): string[] => [...ids].sort((a, b) => a.localeCompare(b));

const toPolicyAccount = (account: DbAccountSnapshot): NaverAccount => ({
  id: account.accountId,
  password: '',
  nickname: account.nickname,
  role: account.role === 'writer' || account.role === 'commenter' ? account.role : undefined,
});

export const createAccountRosterAudit = (
  dbAccounts: DbAccountSnapshot[],
  dbCafes: DbCafeSnapshot[] = [],
): AccountRosterAudit => {
  const activeAccounts = dbAccounts.filter(({ isActive }) => isActive);
  const activePolicyAccounts = activeAccounts.map(toPolicyAccount);
  const cafeWriterPolicies = dbCafes
    .filter(({ isActive }) => isActive !== false)
    .map((cafe) => ({
      cafeId: cafe.cafeId,
      cafeName: cafe.name,
      writerAccountIds: getCafeWriterAccounts(activePolicyAccounts, cafe.cafeId).map(({ id }) => id),
    }));
  const requiredWriterCafeNames = new Set(REQUIRED_WRITER_CAFE_NAMES);
  const emptyWriterCafeNames = cafeWriterPolicies
    .filter(({ cafeName }) => requiredWriterCafeNames.has(cafeName))
    .filter(({ writerAccountIds }) => writerAccountIds.length === 0)
    .map(({ cafeName }) => cafeName);
  const unknownRoleIds = activeAccounts
    .filter(({ role }) => role !== 'writer' && role !== 'commenter')
    .map(({ accountId }) => accountId);

  return {
    activeWriterIds: sortIds(
      activeAccounts
        .filter(({ role }) => role === 'writer')
        .map(({ accountId }) => accountId),
    ),
    activeCommenterIds: sortIds(
      activeAccounts
        .filter(({ role }) => role === 'commenter')
        .map(({ accountId }) => accountId),
    ),
    inactiveIds: sortIds(
      dbAccounts
        .filter(({ isActive }) => !isActive)
        .map(({ accountId }) => accountId),
    ),
    unknownRoleIds: sortIds(unknownRoleIds),
    cafeWriterPolicies,
    emptyWriterCafeNames: sortIds(emptyWriterCafeNames),
    ok: unknownRoleIds.length === 0 && emptyWriterCafeNames.length === 0,
  };
};

const printAudit = (audit: AccountRosterAudit): void => {
  console.log(
    JSON.stringify(
      {
        ok: audit.ok,
        activeWriters: audit.activeWriterIds.length,
        activeCommenters: audit.activeCommenterIds.length,
        inactiveIds: audit.inactiveIds,
        unknownRoleIds: audit.unknownRoleIds,
        emptyWriterCafeNames: audit.emptyWriterCafeNames,
        cafeWriterPolicies: audit.cafeWriterPolicies,
      },
      null,
      2,
    ),
  );
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

const getDbAccountsForUser = async (userId: string): Promise<DbAccountSnapshot[]> => {
  return Account.find({ userId })
    .select('accountId nickname role isActive')
    .lean<DbAccountSnapshot[]>();
};

const getDbCafesForUser = async (userId: string): Promise<DbCafeSnapshot[]> => {
  return Cafe.find({ userId })
    .select('cafeId name isActive')
    .lean<DbCafeSnapshot[]>();
};

const main = async (): Promise<void> => {
  const shouldApply = process.argv.includes('--apply');

  if (shouldApply) {
    throw new Error('accounts:sync is disabled. Use import-accounts-and-join-cafes.ts with an explicit payload.');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI 환경변수가 필요함');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const userId = await getUserId();
  const [dbAccounts, dbCafes] = await Promise.all([
    getDbAccountsForUser(userId),
    getDbCafesForUser(userId),
  ]);
  const audit = createAccountRosterAudit(dbAccounts, dbCafes);
  printAudit(audit);

  if (!audit.ok) {
    throw new Error('계정 DB/카페 writer 정책 점검 실패');
  }

  await mongoose.disconnect();
};

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error('[ACCOUNT_ROSTER_HARNESS]', error instanceof Error ? error.message : error);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
}
