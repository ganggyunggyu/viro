import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * 댓글 작업을 실제로 실행하는 로컬 워커의 생존 신호.
 *
 * 데스크톱 에이전트는 브로커 호출마다 AgentToken.lastSeenAt이 갱신되므로 별도 기록이 필요 없지만,
 * CLI 워커(scripts/run-manual-comment-worker.ts)는 Mongo에 직접 붙어서 토큰을 쓰지 않는다.
 * 이 컬렉션이 없으면 CLI 워커가 돌고 있어도 화면에는 "워커 꺼짐"으로 보인다.
 */
export interface IWorkerHeartbeat extends Document {
  workerId: string;
  userId?: string;
  kind: string;
  label: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkerHeartbeatSchema = new Schema<IWorkerHeartbeat>(
  {
    workerId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    kind: { type: String, required: true, default: 'manual-comment' },
    label: { type: String, required: true },
    lastSeenAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// 종료된 워커 기록이 영원히 남지 않도록 하루 뒤 자동 삭제한다.
// (조회용 인덱스도 겸하므로 lastSeenAt에 index: true를 따로 걸지 않는다)
WorkerHeartbeatSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const WorkerHeartbeat: Model<IWorkerHeartbeat> =
  mongoose.models.WorkerHeartbeat ||
  mongoose.model<IWorkerHeartbeat>('WorkerHeartbeat', WorkerHeartbeatSchema, 'workerheartbeats');

export const touchWorkerHeartbeat = async (input: {
  workerId: string;
  label: string;
  userId?: string;
  kind?: string;
}): Promise<void> => {
  await WorkerHeartbeat.updateOne(
    { workerId: input.workerId },
    {
      $set: {
        label: input.label,
        kind: input.kind || 'manual-comment',
        lastSeenAt: new Date(),
        ...(input.userId ? { userId: input.userId } : {}),
      },
    },
    { upsert: true },
  );
};
