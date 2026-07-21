import type { BrokerClient } from './broker-client';

/**
 * 데스크톱 에이전트는 DB/시크릿 없이 BROKER_URL + AGENT_TOKEN만 갖고 시작한다.
 * 로컬 캡차 자동 풀이(multi-session/captcha-solver)는 process.env.GEMINI_API_KEY를 읽으므로,
 * 브로커(서버 env)에서 키를 한 번 받아 주입해 서버와 동일한 키로 캡차를 푼다.
 * 이미 OS 환경변수로 키가 주어졌으면(개발자가 직접 export) 그 값을 존중하고 덮어쓰지 않는다.
 */
export const hydrateAgentSecrets = async (broker: BrokerClient): Promise<void> => {
  if (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY
  ) {
    return;
  }

  try {
    const { geminiApiKey } = await broker.config();
    if (geminiApiKey) {
      process.env.GEMINI_API_KEY = geminiApiKey;
      console.log('[AGENT] Gemini 키 동기화 완료 — 캡차 자동 풀이 활성');
    } else {
      console.warn('[AGENT] 서버에 Gemini 키가 없어 캡차 자동 풀이를 쓸 수 없습니다');
    }
  } catch (error) {
    console.error(
      '[AGENT] Gemini 키 동기화 실패:',
      error instanceof Error ? error.message : error,
    );
  }
};
