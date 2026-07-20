import { homedir } from 'os';
import { join } from 'path';

/**
 * 이용자 로컬 에이전트 설정. 에이전트는 DB/큐 자격증명 없이 BROKER_URL + AGENT_TOKEN만
 * 갖고, 브로커 API로 자기 userId 잡을 pull → 로컬 Playwright 실행 → 결과 리포트한다.
 */
export interface AgentConfig {
  brokerUrl: string;
  token: string;
  workerId: string;
  browsersPath: string;
  pollIntervalMs: number;
}

const DEFAULT_POLL_INTERVAL_MS = 15_000;

export const getAgentHomeDir = (): string =>
  process.env.VIRO_AGENT_HOME || join(homedir(), '.viro-agent');

export const loadAgentConfig = (): AgentConfig => {
  const brokerUrl = (process.env.BROKER_URL || '').replace(/\/+$/, '');
  const token = process.env.AGENT_TOKEN || '';

  if (!brokerUrl) {
    throw new Error('BROKER_URL 환경변수가 필요합니다 (예: https://cafe-bot-two.vercel.app)');
  }

  if (!token) {
    throw new Error('AGENT_TOKEN 환경변수가 필요합니다 (웹에서 발급한 페어링 토큰)');
  }

  return {
    brokerUrl,
    token,
    workerId: process.env.AGENT_WORKER_ID || `agent-${process.pid}`,
    browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || join(getAgentHomeDir(), 'browsers'),
    pollIntervalMs: Number(process.env.AGENT_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS),
  };
};
