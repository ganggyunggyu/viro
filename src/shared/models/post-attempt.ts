import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * writePostWithAccount()는 되돌릴 수 없는 실제 네이버 발행 액션이다. BullMQ 잡은
 * attempts/backoff, 그리고 워커가 죽어 락 갱신을 놓쳤을 때의 stalled 재큐잉으로
 * 자동 재시도되는데, 발행 자체는 성공했지만 그 뒤 DB 기록/시트 로깅 단계에서
 * 던진 에러 때문에 잡 전체가 "실패"로 잡혀 통째로 재실행되면 같은 글이 중복으로
 * 여러 번 올라간다(밥상노트 "인천웨딩홀 부평..." 4연속 발행 사고).
 *
 * writePostWithAccount 호출 직전에 이 컬렉션에 클레임을 먼저 남겨서, 재시도가
 * 같은 (카페, 계정, 키워드, 날짜) 조합을 다시 시도하려 하면 건너뛰게 한다.
 */
export interface IPostAttempt extends Document {
  attemptKey: string;
  cafeId: string;
  writerAccountId: string;
  keyword: string;
  createdAt: Date;
}

const PostAttemptSchema = new Schema<IPostAttempt>({
  attemptKey: { type: String, required: true, unique: true },
  cafeId: { type: String, required: true },
  writerAccountId: { type: String, required: true },
  keyword: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 2 }, // 2일 후 자동 만료
});

export const PostAttempt: Model<IPostAttempt> =
  mongoose.models.PostAttempt || mongoose.model<IPostAttempt>('PostAttempt', PostAttemptSchema);

const getTodayString = (): string => {
  const kstOffset = 9 * 60;
  const kstTime = new Date(Date.now() + kstOffset * 60 * 1000);
  return kstTime.toISOString().split('T')[0];
};

/**
 * 발행 직전 호출. 오늘 이미 같은 카페+계정+키워드로 클레임이 있으면 false(스킵),
 * 없으면 클레임을 남기고 true(진행) 반환. upsert 원자성으로 동시 요청도 안전하다.
 */
export const claimPostAttempt = async (
  cafeId: string,
  writerAccountId: string,
  keyword: string
): Promise<boolean> => {
  const attemptKey = `${cafeId}:${writerAccountId}:${keyword}:${getTodayString()}`;

  try {
    await PostAttempt.create({ attemptKey, cafeId, writerAccountId, keyword });
    return true;
  } catch (error) {
    // E11000 duplicate key = 이미 오늘 같은 조합으로 클레임됨 (진행 중이거나 이미 완료됨)
    if (error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000) {
      return false;
    }
    throw error;
  }
};
