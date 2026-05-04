import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { User } from '../src/shared/models/user';

export type AccountRosterRole = 'writer' | 'commenter';

export interface AccountRosterItem {
  accountId: string;
  nickname: string;
  password: string;
  role: AccountRosterRole;
  isActive: boolean;
}

export interface DbAccountSnapshot {
  accountId: string;
  nickname?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export interface AccountRosterAudit {
  activeWriterIds: string[];
  activeCommenterIds: string[];
  inactiveRosterIds: string[];
  missingIds: string[];
  extraActiveIds: string[];
  mismatches: string[];
  ok: boolean;
}

export const LOGIN_ID = '21lab';

export const ACCOUNT_ROSTER: AccountRosterItem[] = [
  { accountId: 'regular14631', nickname: '소원', password: 'r46f9sqy1', role: 'writer', isActive: true },
  { accountId: 'nes1p2kx', nickname: '에스앤비안과 1', password: 'ua(9rr5g', role: 'writer', isActive: true },
  { accountId: 'mh8j62wm', nickname: '에스앤비안과 2', password: 'bn5vkh6a1', role: 'writer', isActive: true },
  { accountId: 'angrykoala270', nickname: '앵그리맨', password: '*&#o$xg81', role: 'writer', isActive: true },
  { accountId: 'tinyfish183', nickname: '티니피쉬', password: 's55n9jne1', role: 'writer', isActive: true },
  { accountId: 'dhtksk1p', nickname: '빨간모자앤 - 준3', password: 'dhtksk1pp', role: 'commenter', isActive: true },
  { accountId: 'orangeswan630', nickname: '똑똑한건희씨', password: 'l@psz9d%1', role: 'commenter', isActive: true },
  { accountId: 'bigfish773', nickname: '고래낚시', password: '%3p#lape1', role: 'commenter', isActive: true },
  { accountId: 'k7d9x2m4', nickname: '강아지강하지', password: 'p3v8n2@k5q', role: 'commenter', isActive: true },
  { accountId: 'loand3324', nickname: '라우드 2', password: 'akfalwk11!', role: 'commenter', isActive: false },
  { accountId: 'fail5644', nickname: '고구마스틱2', password: 'akfalwk12!', role: 'commenter', isActive: true },
  { accountId: 'compare14310', nickname: '룰루랄라 2', password: 'akfalwk12!', role: 'commenter', isActive: true },
  { accountId: 'ghostrush7', nickname: '실눈캐', password: 'dashrun1!', role: 'commenter', isActive: true },
  { accountId: 'q9v3m7a2', nickname: '포비', password: 'n4x8k2!r6p', role: 'commenter', isActive: true },
  { accountId: 'laghunter8', nickname: '도도', password: 'fastplay7?', role: 'commenter', isActive: true },
  { accountId: 'eghfsa5478', nickname: '오세아니야', password: 'akfakfalalwkwk12', role: 'commenter', isActive: true },
  { accountId: 'pixelninja3', nickname: '건강박사석사', password: 'stealth9@', role: 'commenter', isActive: true },
  { accountId: 'n7c3w8z2', nickname: '고양이밥', password: 'q5x9@t2m6p', role: 'commenter', isActive: true },
  { accountId: 'respawnking9', nickname: '리스팩식스팩', password: 'comeback3@', role: 'commenter', isActive: true },
];

const sortIds = (ids: string[]): string[] => [...ids].sort((a, b) => a.localeCompare(b));

export const createAccountRosterAudit = (
  roster: AccountRosterItem[],
  dbAccounts: DbAccountSnapshot[],
): AccountRosterAudit => {
  const dbById = new Map(dbAccounts.map((account) => [account.accountId, account]));
  const activeRosterIds = new Set(
    roster.filter(({ isActive }) => isActive).map(({ accountId }) => accountId),
  );
  const missingIds: string[] = [];
  const mismatches: string[] = [];

  roster.forEach((expected) => {
    const actual = dbById.get(expected.accountId);

    if (!actual) {
      missingIds.push(expected.accountId);
      return;
    }

    if (actual.nickname !== expected.nickname) {
      mismatches.push(`${expected.accountId}:nickname`);
    }

    if (actual.password !== expected.password) {
      mismatches.push(`${expected.accountId}:password`);
    }

    if (actual.role !== expected.role) {
      mismatches.push(`${expected.accountId}:role`);
    }

    if (actual.isActive !== expected.isActive) {
      mismatches.push(`${expected.accountId}:isActive`);
    }
  });

  const extraActiveIds = dbAccounts
    .filter(({ accountId, isActive }) => isActive && !activeRosterIds.has(accountId))
    .map(({ accountId }) => accountId);

  return {
    activeWriterIds: sortIds(
      roster
        .filter(({ role, isActive }) => role === 'writer' && isActive)
        .map(({ accountId }) => accountId),
    ),
    activeCommenterIds: sortIds(
      roster
        .filter(({ role, isActive }) => role === 'commenter' && isActive)
        .map(({ accountId }) => accountId),
    ),
    inactiveRosterIds: sortIds(
      roster
        .filter(({ isActive }) => !isActive)
        .map(({ accountId }) => accountId),
    ),
    missingIds: sortIds(missingIds),
    extraActiveIds: sortIds(extraActiveIds),
    mismatches: sortIds(mismatches),
    ok: missingIds.length === 0 && extraActiveIds.length === 0 && mismatches.length === 0,
  };
};

const printAudit = (audit: AccountRosterAudit): void => {
  console.log(
    JSON.stringify(
      {
        ok: audit.ok,
        activeWriters: audit.activeWriterIds.length,
        activeCommenters: audit.activeCommenterIds.length,
        inactiveRosterIds: audit.inactiveRosterIds,
        missingIds: audit.missingIds,
        extraActiveIds: audit.extraActiveIds,
        mismatches: audit.mismatches,
      },
      null,
      2,
    ),
  );
};

const getDbAccountsForUser = async (userId: string): Promise<DbAccountSnapshot[]> => {
  return Account.find({ userId })
    .select('accountId nickname password role isActive')
    .lean<DbAccountSnapshot[]>();
};

const syncAccountRoster = async (userId: string): Promise<void> => {
  for (const account of ACCOUNT_ROSTER) {
    await Account.updateOne(
      { userId, accountId: account.accountId },
      {
        $set: {
          userId,
          accountId: account.accountId,
          password: account.password,
          nickname: account.nickname,
          role: account.role,
          isActive: account.isActive,
        },
        $setOnInsert: {
          isMain: false,
        },
      },
      { upsert: true },
    );
  }

  const activeRosterIds = ACCOUNT_ROSTER
    .filter(({ isActive }) => isActive)
    .map(({ accountId }) => accountId);

  await Account.updateMany(
    {
      userId,
      accountId: { $nin: activeRosterIds },
      isActive: true,
    },
    { $set: { isActive: false } },
  );
};

const main = async (): Promise<void> => {
  const shouldApply = process.argv.includes('--apply');
  const shouldCheck = process.argv.includes('--check') || !shouldApply;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI 환경변수가 필요함');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!user) {
    throw new Error(`user not found: ${LOGIN_ID}`);
  }

  if (shouldApply) {
    await syncAccountRoster(user.userId);
  }

  if (shouldCheck) {
    const dbAccounts = await getDbAccountsForUser(user.userId);
    const audit = createAccountRosterAudit(ACCOUNT_ROSTER, dbAccounts);
    printAudit(audit);

    if (!audit.ok) {
      throw new Error('계정 roster와 DB가 불일치함');
    }
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
