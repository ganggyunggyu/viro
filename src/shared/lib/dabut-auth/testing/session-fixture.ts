import type { TestContext } from 'node:test';
import { createRequire } from 'node:module';
import mongoose from 'mongoose';

export const isolateSession = (context: TestContext, token?: string) => {
  const cache = global.mongooseCache!;
  const previous = { ...cache };
  const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
  cache.conn = mongoose;
  context.after(() => {
    Object.assign(cache, previous);
    if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor);
    else Reflect.deleteProperty(mongoose.connection, 'readyState');
  });
  const headers = createRequire(import.meta.url)('next/headers');
  context.mock.method(headers, 'cookies', async () => ({ get: () => token ? { value: token } : undefined }));
  const nextCache = createRequire(import.meta.url)('next/cache');
  context.mock.method(nextCache, 'revalidatePath', () => undefined);
  context.mock.method(mongoose, 'connect', () => { throw new Error('real DB forbidden'); });
  context.mock.method(mongoose.Query.prototype, 'exec', () => { throw new Error('unmocked DB forbidden'); });
};
