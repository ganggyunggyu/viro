'use client';

import { PageLayout } from '@/widgets';
import { AgentSetupUI } from '@/features/agent-setup';

export default function AgentPage() {
  return (
    <PageLayout title="에이전트" subtitle="내 PC에서 도는 에이전트 설치와 토큰 관리">
      <AgentSetupUI />
    </PageLayout>
  );
}
