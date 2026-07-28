import { sleep } from '@ganggyunggyu/shared';
import { getRedisConnection } from '../redis';
import { createSequenceController, type SequenceRedisLike } from './sequence-harness';

const sequenceController = createSequenceController({
  getRedisConnection: () => getRedisConnection() as unknown as SequenceRedisLike,
  log: (message: string) => console.log(message),
  now: () => Date.now(),
  sleep,
});

export const waitForSequenceTurn = sequenceController.waitForSequenceTurn;
export const advanceSequence = sequenceController.advanceSequence;
export { createSequenceController };
