import type { NaverAccount } from '@/shared/lib/account-manager';

export interface ReplyTask {
  targetCommentIndex: number;
  isAuthor: boolean;
  account: NaverAccount;
}

/**
 * 댓글 목록에서 대댓글 작업(누가, 어느 댓글에, 글쓴이 명의인지)을 무작위로 배정한다.
 * 글쓴이 대댓글 2~3개 + 일반 대댓글 2~4개를 서로 다른 댓글에 배정하고, 일반 대댓글은
 * 가능하면 본인이 단 댓글에는 답글을 달지 않도록 피한다.
 */
export const buildReplyTasks = (
  writerAccount: NaverAccount,
  commenterAccounts: NaverAccount[],
  commentAuthors: Array<{ id: string; nickname: string }>,
  commentTexts: string[]
): ReplyTask[] => {
  const replyTasks: ReplyTask[] = [];
  const availableIndices = commentTexts.map((_, idx) => idx);

  const authorReplyCount = Math.floor(Math.random() * 2) + 2;
  for (let k = 0; k < authorReplyCount && availableIndices.length > 0; k++) {
    const randIdx = Math.floor(Math.random() * availableIndices.length);
    const targetIdx = availableIndices.splice(randIdx, 1)[0];
    replyTasks.push({
      targetCommentIndex: targetIdx,
      isAuthor: true,
      account: writerAccount,
    });
  }

  const normalReplyCount = Math.min(
    Math.floor(Math.random() * 3) + 2,
    availableIndices.length
  );
  for (let k = 0; k < normalReplyCount && availableIndices.length > 0; k++) {
    let targetIdx = -1;
    let replyer = commenterAccounts[k % commenterAccounts.length];

    const validIndices = availableIndices.filter(
      (idx) => commentAuthors[idx].id !== replyer.id
    );

    if (validIndices.length > 0) {
      const randIdx = Math.floor(Math.random() * validIndices.length);
      targetIdx = validIndices[randIdx];
      availableIndices.splice(availableIndices.indexOf(targetIdx), 1);
    } else {
      const otherAccountIdx = (k + 1) % commenterAccounts.length;
      replyer = commenterAccounts[otherAccountIdx];
      const retryIndices = availableIndices.filter(
        (idx) => commentAuthors[idx].id !== replyer.id
      );
      if (retryIndices.length > 0) {
        const randIdx = Math.floor(Math.random() * retryIndices.length);
        targetIdx = retryIndices[randIdx];
        availableIndices.splice(availableIndices.indexOf(targetIdx), 1);
      }
    }

    if (targetIdx === -1) {
      continue;
    }
    replyTasks.push({
      targetCommentIndex: targetIdx,
      isAuthor: false,
      account: replyer,
    });
  }

  for (let k = replyTasks.length - 1; k > 0; k--) {
    const randIdx = Math.floor(Math.random() * (k + 1));
    [replyTasks[k], replyTasks[randIdx]] = [replyTasks[randIdx], replyTasks[k]];
  }

  return replyTasks;
};
