import { NextResponse } from 'next/server';
import {
  authenticateAgentToken,
  generateJobCommentPlan,
  getBearerToken,
  type AgentArticleSnapshot,
} from '@/shared/lib/agent-broker';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const identity = await authenticateAgentToken(getBearerToken(request));

  if (!identity) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = String(body.jobId || '');
  const article = body.article as Partial<AgentArticleSnapshot> | undefined;

  if (!jobId || !article?.body) {
    return NextResponse.json({ error: 'jobId and article body required' }, { status: 400 });
  }

  const plan = await generateJobCommentPlan(identity.userId, jobId, {
    title: String(article.title || ''),
    body: String(article.body),
    ownerNickname: String(article.ownerNickname || ''),
  });

  if (!plan) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 });
  }

  return NextResponse.json(plan);
};
