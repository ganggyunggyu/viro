const normalizeNicknameForComparison = (value: string | null | undefined): string => {
  return (value ?? '').replace(/\s+/g, '').trim();
};

export const isNicknameEquivalent = (
  actualNickname: string | null | undefined,
  expectedNickname: string | null | undefined
): boolean => {
  const normalizedActual = normalizeNicknameForComparison(actualNickname);
  const normalizedExpected = normalizeNicknameForComparison(expectedNickname);

  if (!normalizedActual || !normalizedExpected) return false;

  return (
    normalizedActual === normalizedExpected ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  );
};

export const isVerifiedNewComment = (
  item: { id?: string; content: string; nickname: string },
  expected: { content: string; nickname: string; previousIds: ReadonlySet<string> },
): boolean => Boolean(
  item.id && /^[1-9]\d*$/.test(item.id) && !expected.previousIds.has(item.id)
  && item.content.replace(/\s+/g, ' ').trim() === expected.content.replace(/\s+/g, ' ').trim()
  && normalizeNicknameForComparison(item.nickname)
  && normalizeNicknameForComparison(item.nickname) === normalizeNicknameForComparison(expected.nickname),
);

export const resolveCommenterNickname = (input: {
  strict: boolean; composerNickname?: string; storedNickname?: string; accountId: string;
}): string => (input.strict ? input.composerNickname || '' : input.storedNickname || input.accountId).replace(/\s+/g, ' ').trim();
