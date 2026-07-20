import { Account, PublishedArticle } from '@/shared/models';

/**
 * 브로커가 서버측(Mongo 접근 가능)에서 잡용 댓글 계정 풀을 구성한다. 에이전트는 이 결과
 * (자격증명 포함)만 받아 로컬 브라우저로 댓글을 단다.
 *
 * run-manual-comment-worker.ts의 buildAccountPool 로직을 포팅한 것:
 *  - commenter 역할 + 자동댓글 제외 아님 + 활성 계정
 *  - 소유자 닉네임 계정, 이미 이 글에 댓글단 계정 제외
 *  - 최근 사용순(LRU) 정렬 후 articleId 오프셋으로 회전(락 convoy 완화)
 */
export interface CommentAccount {
  accountId: string;
  password: string;
  nickname?: string;
}

const normalizeName = (value: string): string =>
  (value || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();

/**
 * 활성 commenter 계정(자격증명 포함). 에이전트가 본문 읽기(소유자 닉네임 확보)나
 * 단순 라운드로빈 게시에 쓴다. LRU/중복 제외가 적용된 정밀 풀은 buildCommentAccountPool.
 */
export const getActiveCommenterAccounts = async (userId: string): Promise<CommentAccount[]> =>
  Account.find({
    userId,
    isActive: true,
    role: 'commenter',
    excludeFromAutoComment: { $ne: true },
  })
    .select('accountId password nickname')
    .lean<CommentAccount[]>();

export const buildCommentAccountPool = async (
  userId: string,
  cafeId: string,
  articleId: number,
  ownerNickname: string,
  needed: number,
): Promise<CommentAccount[]> => {
  const commenterAccounts = await Account.find({
    userId,
    isActive: true,
    role: 'commenter',
    excludeFromAutoComment: { $ne: true },
  })
    .select('accountId password nickname')
    .lean<CommentAccount[]>();

  const existing = await PublishedArticle.findOne({ cafeId, articleId }, { comments: 1 }).lean<{
    comments?: Array<{ accountId?: string }>;
  } | null>();
  const alreadyCommented = new Set(
    (existing?.comments || []).map((comment) => comment.accountId).filter(Boolean) as string[],
  );

  const recentDocs = await PublishedArticle.find({}, { comments: 1 })
    .sort({ updatedAt: -1 })
    .limit(500)
    .lean<Array<{ comments?: Array<{ accountId?: string; createdAt?: Date }> }>>();
  const lastUsedAt = new Map<string, number>();
  for (const doc of recentDocs) {
    for (const comment of doc.comments || []) {
      if (!comment.accountId || !comment.createdAt) {
        continue;
      }
      const timestamp = new Date(comment.createdAt).getTime();
      if (timestamp > (lastUsedAt.get(comment.accountId) || 0)) {
        lastUsedAt.set(comment.accountId, timestamp);
      }
    }
  }

  const eligible = commenterAccounts.filter(
    (account) =>
      normalizeName(account.nickname || account.accountId) !== normalizeName(ownerNickname) &&
      !alreadyCommented.has(account.accountId),
  );

  const sorted = [...eligible].sort(
    (a, b) => (lastUsedAt.get(a.accountId) || 0) - (lastUsedAt.get(b.accountId) || 0),
  );

  const offset = sorted.length > 0 ? articleId % sorted.length : 0;
  const rotated = [...sorted.slice(offset), ...sorted.slice(0, offset)];

  return rotated.slice(0, Math.max(needed * 3, needed + 5));
};
