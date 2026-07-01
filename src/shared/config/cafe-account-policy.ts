import type { NaverAccount } from '@/shared/lib/account-manager';

// Deprecated compatibility export. Writer pool source of truth is DB role +
// explicit allowedAccountIds from scheduling/check scripts.
export const LUXURY_CAFE_WRITER_ACCOUNT_IDS: readonly string[] = [];

export interface CafeAccountPolicy {
  writerAccounts: NaverAccount[];
  commenterAccounts: NaverAccount[];
}

const uniqueAccountsById = (accounts: NaverAccount[]): NaverAccount[] => {
  const seenAccountIds = new Set<string>();

  return accounts.filter(({ id }) => {
    if (seenAccountIds.has(id)) {
      return false;
    }

    seenAccountIds.add(id);
    return true;
  });
};

const filterAccountsByIds = (
  accounts: NaverAccount[],
  allowedAccountIds?: string[]
): NaverAccount[] => {
  if (!allowedAccountIds?.length) {
    return accounts;
  }

  const allowedIds = new Set(allowedAccountIds);
  return accounts.filter(({ id }) => allowedIds.has(id));
};

const isWriterAccount = ({ role }: NaverAccount): boolean => role === 'writer';

export const getCafeAccountPolicy = (
  accounts: NaverAccount[]
): CafeAccountPolicy => {
  const uniqueAccounts = uniqueAccountsById(accounts);
  const writerRoleAccounts = uniqueAccounts.filter(isWriterAccount);

  return {
    writerAccounts: writerRoleAccounts,
    commenterAccounts: uniqueAccounts,
  };
};

export const getCafeWriterAccounts = (
  accounts: NaverAccount[],
  cafeId?: string,
  allowedAccountIds?: string[]
): NaverAccount[] => {
  void cafeId;
  const { writerAccounts } = getCafeAccountPolicy(accounts);
  return filterAccountsByIds(writerAccounts, allowedAccountIds);
};

export const getCafeCommenterAccounts = (
  accounts: NaverAccount[],
  cafeId?: string,
  excludedAccountId?: string,
  allowedAccountIds?: string[]
): NaverAccount[] => {
  void cafeId;
  const { commenterAccounts } = getCafeAccountPolicy(accounts);
  const filteredCommenters = filterAccountsByIds(commenterAccounts, allowedAccountIds);

  if (!excludedAccountId) {
    return filteredCommenters;
  }

  return filteredCommenters.filter(({ id }) => id !== excludedAccountId);
};
