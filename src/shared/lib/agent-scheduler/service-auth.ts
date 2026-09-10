import { createHmac, timingSafeEqual } from 'node:crypto';

const signature = (secret: string, method: string, pathname: string, rawBody: string, timestamp: string) =>
  createHmac('sha256', secret).update(`${timestamp}\n${method}\n${pathname}\n${rawBody}`).digest('hex');

export const signSchedulerRequest = (secret: string, method: string, pathname: string, rawBody: string, timestamp = Math.floor(Date.now() / 1000)): Record<string, string> => {
  if (Buffer.byteLength(secret) < 32) throw new Error('scheduler_service_not_configured');
  const time = String(timestamp);
  return { 'x-viro-timestamp': time, 'x-viro-signature': signature(secret, method, pathname, rawBody, time) };
};

export const verifySchedulerRequest = (secret: string, request: Request, rawBody: string, now = Math.floor(Date.now() / 1000)): boolean => {
  if (Buffer.byteLength(secret) < 32) return false;
  const timestamp = request.headers.get('x-viro-timestamp') || '';
  const supplied = request.headers.get('x-viro-signature') || '';
  if (!/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(supplied) || Math.abs(now - Number(timestamp)) > 60) return false;
  const expected = signature(secret, request.method, new URL(request.url).pathname, rawBody, timestamp);
  return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
};
