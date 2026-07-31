import { pickRandom, pickRandomN, shuffle, pickWeighted, randomInt } from '@ganggyunggyu/shared';

export { pickRandom, pickRandomN, shuffle, pickWeighted, randomInt };

/**
 * min~max 사이 랜덤 딜레이 (밀리초)
 */
export const randomDelay = (min: number, max: number): number => {
  return randomInt(min, max);
};
