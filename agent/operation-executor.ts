import { acquireAccountLock, releaseAccountLock, loginAccount, getPageForAccount, saveCookiesForAccount } from '../src/shared/lib/multi-session';
import { joinCafeMembership } from '../src/shared/lib/naver-cafe-membership';
import { writeCommentWithAccount } from '../src/shared/lib/naver-cafe-writing/comment-writer';
import type { AgentOperationResult } from '../src/shared/lib/agent-management/contract';
import type { ClaimedOperation } from './lib/operation-client';

export const executeAgentOperation = async ({ operation, account, cafe }: ClaimedOperation): Promise<AgentOperationResult> => {
  const { accountId, password, nickname } = account;
  const safeError = (message: string): string => message.split(password).join('[redacted]').slice(0, 500);
  if (operation.type === 'write_comment') {
    const result = await writeCommentWithAccount({ id: accountId, password, nickname }, cafe.cafeId, operation.articleId!, operation.content!, { ensureLogin: true, strictVerification: true });
    return { success: result.success && Boolean(result.commentId), ...(result.requiresReview ? { requiresReview: true } : {}), ...(result.commentId ? { commentId: result.commentId } : {}), ...(!result.success || !result.commentId ? { error: safeError(result.error || '댓글 등록 결과를 확인하지 못했습니다. 실제 글을 확인하세요.') } : {}) };
  }
  await acquireAccountLock(accountId);
  try {
    const login = await loginAccount(accountId, password, { reason: `agent_join:${accountId}` });
    if (!login.success) return { success: false, membershipStatus: 'failed', error: safeError(login.error || '로그인 실패') };
    const page = await getPageForAccount(accountId);
    const joined = await joinCafeMembership(page, cafe, accountId, { nickname: operation.nickname || nickname || accountId, logPrefix: 'AGENT JOIN', strictVerification: true });
    await saveCookiesForAccount(accountId);
    if (joined.status === 'failed' && joined.detail === '가입 승인 대기') return { success: true, membershipStatus: 'pending' };
    return { success: joined.status !== 'failed', membershipStatus: joined.status, ...(joined.status === 'failed' ? { requiresReview: joined.detail.includes('회원 정보가 없습니다'), error: safeError(joined.detail) } : {}) };
  } finally {
    releaseAccountLock(accountId);
  }
};
