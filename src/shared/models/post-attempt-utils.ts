const getKstDateString = (nowMs: number): string => {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstTime = new Date(nowMs + kstOffsetMs);
  return kstTime.toISOString().split('T')[0];
};

/**
 * 발행 재시도 중복 방지 클레임의 유니크 키. (카페, 계정, 키워드, KST 기준 날짜)
 * 조합이 같으면 같은 날 재시도로 보고 스킵 대상이 된다.
 */
export const buildAttemptKey = (
  cafeId: string,
  writerAccountId: string,
  keyword: string,
  nowMs: number = Date.now()
): string => `${cafeId}:${writerAccountId}:${keyword}:${getKstDateString(nowMs)}`;

export interface PostAttemptModel {
  create: (record: {
    attemptKey: string;
    cafeId: string;
    writerAccountId: string;
    keyword: string;
  }) => Promise<unknown>;
}

export interface PostAttemptReleaseModel {
  deleteOne: (filter: { attemptKey: string }) => PromiseLike<unknown>;
}

export const createClaimPostAttempt = (
  model: PostAttemptModel,
  now: () => number = Date.now,
) => async (
  cafeId: string,
  writerAccountId: string,
  keyword: string,
): Promise<boolean> => {
  const attemptKey = buildAttemptKey(cafeId, writerAccountId, keyword, now());

  try {
    await model.create({ attemptKey, cafeId, writerAccountId, keyword });
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000) {
      return false;
    }
    throw error;
  }
};

export const createReleasePostAttempt = (
  model: PostAttemptReleaseModel,
  now: () => number = Date.now,
) => async (
  cafeId: string,
  writerAccountId: string,
  keyword: string,
): Promise<void> => {
  const attemptKey = buildAttemptKey(cafeId, writerAccountId, keyword, now());
  await model.deleteOne({ attemptKey });
};
