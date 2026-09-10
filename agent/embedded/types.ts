export interface EmbeddedWorkerConfig {
  brokerUrl: string;
  token: string;
  workerId: string;
  browsersPath: string;
  pollIntervalMs: number;
}

export interface EmbeddedWorkerCallbacks {
  onProgress?: (message: string) => void;
}

export type EmbeddedTaskKind = 'operation' | 'action';

export interface EmbeddedExecution {
  kind: EmbeddedTaskKind;
  id: string;
  claimed: boolean;
  reported: boolean;
}

export interface WorkerReadiness {
  ready: true;
  protocol: 'viro-embedded-worker/1';
  operationWorkerOnline: true;
  actionWorkerOnline: true;
}

export interface EmbeddedWorker {
  prepare: () => Promise<WorkerReadiness>;
  execute: (kind: EmbeddedTaskKind, id: string) => Promise<EmbeddedExecution>;
  close: () => Promise<void>;
}

export interface SchedulerWorkerConfig {
  brokerUrl: string;
  serviceSecret: string;
  workerId: string;
  browsersPath: string;
  pollIntervalMs: number;
  kind: EmbeddedTaskKind;
  id: string;
  dispatchId: string;
  ownerScope: string;
}
