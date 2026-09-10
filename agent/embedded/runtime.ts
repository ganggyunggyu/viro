import type { EmbeddedExecution, EmbeddedTaskKind, EmbeddedWorker, EmbeddedWorkerCallbacks, EmbeddedWorkerConfig, WorkerReadiness } from './types';
import { EmbeddedWorkerError, safeWorkerError } from './errors';

export interface WorkerDriver {
  handshake: () => Promise<void>;
  prepareBrowser: () => Promise<void>;
  heartbeat: (operationId?: string, taskId?: string) => Promise<void>;
  run: (kind: EmbeddedTaskKind, id: string, ownsLease: () => boolean, onClaimed: () => void) => Promise<EmbeddedExecution>;
  closeBrowser: () => Promise<void>;
}

type Schedule = (tick: () => Promise<void>, interval: number) => () => void;
const scheduleHeartbeat: Schedule = (tick, interval) => {
  const timer = setInterval(() => { void tick(); }, interval);
  timer.unref();
  return () => clearInterval(timer);
};
const readiness: WorkerReadiness = { ready: true, protocol: 'viro-embedded-worker/1', operationWorkerOnline: true, actionWorkerOnline: true };

export const createWorkerRuntime = (
  config: EmbeddedWorkerConfig,
  callbacks: EmbeddedWorkerCallbacks,
  driver: WorkerDriver,
  schedule: Schedule = scheduleHeartbeat,
): EmbeddedWorker => {
  let ready = false;
  let closed = false;
  let preparation: Promise<WorkerReadiness> | undefined;
  let closing: Promise<void> | undefined;
  let active: { kind: EmbeddedTaskKind; id: string; lostLease: boolean; claimed: boolean } | undefined;
  let activeRun: Promise<EmbeddedExecution> | undefined;
  let heartbeatRunning = false;
  let stopHeartbeat: (() => void) | undefined;
  const executions = new Map<string, Promise<EmbeddedExecution>>();
  const progress = (message: string) => { try { callbacks.onProgress?.(message); } catch { /* UI callbacks do not change execution ownership. */ } };
  const pulse = async () => {
    if (heartbeatRunning || closed) return;
    heartbeatRunning = true;
    try {
      await driver.heartbeat(active?.claimed && active.kind === 'operation' ? active.id : undefined, active?.claimed && active.kind === 'action' ? active.id : undefined);
    } catch {
      ready = false;
      if (active) active.lostLease = true;
      stopHeartbeat?.();
      progress('작업 프로그램 연결이 끊겼습니다. 실행 결과를 확인해 주세요.');
      await driver.closeBrowser().catch(() => {});
    } finally { heartbeatRunning = false; }
  };
  const prepare = (): Promise<WorkerReadiness> => {
    if (closed) return Promise.reject(new Error('종료된 작업 프로그램입니다.'));
    if (preparation) return preparation;
    if (ready) return Promise.resolve({ ...readiness });
    preparation = (async () => {
      try {
        await driver.handshake();
        if (closed) throw new Error();
        progress('브라우저 구성요소를 준비하고 있습니다. 첫 실행에는 다운로드가 필요할 수 있습니다.');
        await driver.prepareBrowser().catch((error) => { throw safeWorkerError(error, 'browser_prepare_failed'); });
        if (closed) throw new Error();
        await driver.heartbeat();
        if (closed) throw new Error();
        ready = true;
        stopHeartbeat?.();
        stopHeartbeat = schedule(pulse, Math.min(30000, Math.max(5000, config.pollIntervalMs)));
        progress('카페 작업을 실행할 준비가 됐습니다.');
        return { ...readiness };
      } catch (error) {
        ready = false;
        await driver.closeBrowser().catch(() => {});
        throw safeWorkerError(error, 'broker_unavailable');
      } finally { preparation = undefined; }
    })();
    return preparation;
  };
  const execute = (kind: EmbeddedTaskKind, id: string): Promise<EmbeddedExecution> => {
    if (closed || !ready) return Promise.reject(new Error('먼저 작업 프로그램을 준비해 주세요.'));
    if (!['operation', 'action'].includes(kind) || !new RegExp(`^[a-f0-9]{${kind === 'operation' ? 24 : 64}}$`).test(id)) {
      return Promise.reject(new Error('작업 ID가 올바르지 않습니다.'));
    }
    const key = `${kind}:${id}`;
    const previous = executions.get(key);
    if (previous) return previous;
    if (active) return Promise.reject(new Error('진행 중인 카페 작업이 있습니다.'));
    const lease = { kind, id, lostLease: false, claimed: false };
    active = lease;
    const result = Promise.resolve().then(() => driver.run(kind, id, () => !closed && !lease.lostLease, () => { lease.claimed = true; }))
      .catch(() => { throw new EmbeddedWorkerError('execution_uncertain'); })
      .finally(() => { active = undefined; activeRun = undefined; });
    activeRun = result;
    executions.set(key, result);
    return result;
  };
  const close = (): Promise<void> => {
    if (closing) return closing;
    closed = true;
    ready = false;
    stopHeartbeat?.();
    if (active) active.lostLease = true;
    closing = (async () => {
      if (preparation) await preparation.catch(() => {});
      await driver.closeBrowser().catch(() => {});
      await activeRun?.catch(() => {});
    })();
    return closing;
  };
  return { prepare, execute, close };
};
