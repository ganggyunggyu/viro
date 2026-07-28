import { randomInt } from '@ganggyunggyu/shared';

export const getRandomCommentCount = (min: number = 5, max: number = 10): number => {
  return randomInt(min, max);
};
