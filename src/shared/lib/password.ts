import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;
const HASH_PATTERN = /^[0-9a-f]{32}:[0-9a-f]{128}$/;

export const hashPassword = (plain: string): string => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
};

export const isHashedPassword = (value: string): boolean => HASH_PATTERN.test(value);

export const verifyPassword = (plain: string, stored: string): boolean => {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = scryptSync(plain, salt, KEY_LENGTH);

  if (hashBuffer.length !== candidateBuffer.length) return false;

  return timingSafeEqual(hashBuffer, candidateBuffer);
};
