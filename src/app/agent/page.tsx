'use client';

import { PageLayout } from '@/widgets';
import { AgentSetupUI } from '@/features/agent-setup';

export default function AgentPage() {
  return (
    <PageLayout title="Viro Desktop" subtitle="다운로드하고, 연결하고, 바로 시작하세요">
      <AgentSetupUI />
    </PageLayout>
  );
}
