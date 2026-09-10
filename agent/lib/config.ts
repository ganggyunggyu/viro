import { readFileSync } from 'node:fs';
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
  let stored: { brokerUrl?: string; token?: string } = {};
  try { stored = JSON.parse(readFileSync(join(getAgentHomeDir(), 'config.json'), 'utf8')); } catch { /* 로그인 전에는 저장 파일이 없다. */ }
  // 주소를 덮어쓸 때 이전 서버의 인증정보를 다른 서버로 보내지 않는다.
  const environmentConfigured = Boolean(process.env.BROKER_URL || process.env.AGENT_TOKEN);
  const brokerUrl = (environmentConfigured ? process.env.BROKER_URL || '' : stored.brokerUrl || '').replace(/\/+$/, '');
  const token = environmentConfigured ? process.env.AGENT_TOKEN || '' : stored.token || '';

  if (!brokerUrl) {
    throw new Error('먼저 Viro 앱 또는 npm run agent:login으로 로그인하세요.');
  }

  if (!token) {
    throw new Error('저장된 로그인 정보가 없습니다. 다시 로그인하세요.');
  }

  return {
    brokerUrl,
    token,
    workerId: process.env.AGENT_WORKER_ID || `agent-${process.pid}`,
    browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || join(getAgentHomeDir(), 'browsers'),
    pollIntervalMs: Number(process.env.AGENT_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS),
  };
};
