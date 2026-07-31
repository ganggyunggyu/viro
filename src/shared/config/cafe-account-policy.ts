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
const isEligibleForAutoComment = ({ excludeFromAutoComment }: NaverAccount): boolean =>
  !excludeFromAutoComment;
const isEligibleForCafe = (
  { targetCafeIds }: NaverAccount,
  cafeId?: string,
  cafeSlug?: string,
): boolean => !cafeId
  || !targetCafeIds?.length
  || targetCafeIds.includes(cafeId)
  || Boolean(cafeSlug && targetCafeIds.includes(cafeSlug));

export const getCafeAccountPolicy = (
  accounts: NaverAccount[]
): CafeAccountPolicy => {
  const uniqueAccounts = uniqueAccountsById(accounts).filter(isEligibleForAutoComment);
  const writerRoleAccounts = uniqueAccounts.filter(isWriterAccount);

  return {
    writerAccounts: writerRoleAccounts,
    commenterAccounts: uniqueAccounts,
  };
};

export const getCafeWriterAccounts = (
  accounts: NaverAccount[],
  cafeId?: string,
  cafeSlug?: string,
  allowedAccountIds?: string[]
): NaverAccount[] => {
  const { writerAccounts } = getCafeAccountPolicy(accounts);
  const cafeWriterAccounts = writerAccounts.filter((account) =>
    isEligibleForCafe(account, cafeId, cafeSlug));
  return filterAccountsByIds(cafeWriterAccounts, allowedAccountIds);
};

export const getCafeCommenterAccounts = (
  accounts: NaverAccount[],
  cafeId?: string,
  cafeSlug?: string,
  excludedAccountId?: string,
  allowedAccountIds?: string[]
): NaverAccount[] => {
  const { commenterAccounts } = getCafeAccountPolicy(accounts);
  const cafeCommenterAccounts = commenterAccounts.filter((account) =>
    isEligibleForCafe(account, cafeId, cafeSlug));
  const filteredCommenters = filterAccountsByIds(cafeCommenterAccounts, allowedAccountIds);

  if (!excludedAccountId) {
    return filteredCommenters;
  }

  return filteredCommenters.filter(({ id }) => id !== excludedAccountId);
};
