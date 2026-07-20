'use client';

import { PageLayout } from '@/widgets';
import { AgentSetupUI } from '@/features/agent-setup';

export default function AgentPage() {
  return (
    <PageLayout title="Viro 프로그램" subtitle="내 PC에서 켜두는 데스크톱 프로그램 · 다운로드와 연결">
      <AgentSetupUI />
    </PageLayout>
  );
}
