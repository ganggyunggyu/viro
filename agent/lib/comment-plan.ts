import type { AgentArticleSnapshot, AgentCommentPlan, BrokerJob } from './broker-client';

type RequestCommentPlan = (article: AgentArticleSnapshot) => Promise<AgentCommentPlan>;

export const resolveCommentPlan = async (
  job: BrokerJob,
  article: AgentArticleSnapshot,
  requestCommentPlan: RequestCommentPlan,
): Promise<AgentCommentPlan> => {
  if (job.mode === 'fixed') {
    return {
      comments: (job.fixedComments || []).map((comment) => comment.trim()).filter(Boolean),
    };
  }

  return requestCommentPlan(article);
};
