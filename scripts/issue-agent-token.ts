import { createHash, randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { AgentToken } from '../src/shared/models/agent-token';

/**
 * 이용자 로컬 에이전트용 페어링 토큰 발급.
 * 사용법: tsx --env-file=.env.local scripts/issue-agent-token.ts <userId> [label]
 * 원문 토큰은 이 실행에서만 출력되고 DB엔 해시만 저장되니, 출력값을 에이전트에 저장하세요.
 */

const hashAgentToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken).digest('hex');

const main = async (): Promise<void> => {
  const userId = process.argv[2];
  const label = process.argv[3] || 'agent';

  if (!userId) {
    console.error('usage: tsx --env-file=.env.local scripts/issue-agent-token.ts <userId> [label]');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI!);

  const rawToken = randomBytes(32).toString('hex');
  await AgentToken.create({ userId, tokenHash: hashAgentToken(rawToken), label });

  console.log('----------------------------------------------------------------');
  console.log(`userId : ${userId}`);
  console.log(`label  : ${label}`);
  console.log(`AGENT_TOKEN=${rawToken}`);
  console.log('----------------------------------------------------------------');
  console.log('이 토큰은 다시 볼 수 없으니 지금 에이전트에 저장하세요.');

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error('토큰 발급 실패:', error);
  process.exit(1);
});
