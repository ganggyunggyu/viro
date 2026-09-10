export type WorkerErrorCode = 'server_update_required' | 'authentication_required' | 'browser_prepare_failed' | 'broker_unavailable' | 'execution_uncertain';
const messages: Record<WorkerErrorCode, string> = {
  server_update_required: '바이로 서버 업데이트가 필요합니다.',
  authentication_required: '바이로에 다시 로그인해 주세요.',
  browser_prepare_failed: '브라우저 구성요소를 준비하지 못했습니다.',
  broker_unavailable: '바이로 서버 연결을 확인해 주세요.',
  execution_uncertain: '카페 작업 결과를 확인해 주세요.',
};
export class EmbeddedWorkerError extends Error {
  constructor(public readonly code: WorkerErrorCode) {
    super(messages[code]);
    this.name = 'EmbeddedWorkerError';
  }
}
export const safeWorkerError = (error: unknown, fallback: WorkerErrorCode): EmbeddedWorkerError =>
  new EmbeddedWorkerError(error instanceof EmbeddedWorkerError ? error.code : fallback);
