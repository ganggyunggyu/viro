import assert from 'node:assert/strict';
import test from 'node:test';
import { createDisableCommentJobHandler } from './disable-comment-harness';
import type { DisableCommentJobData } from '../types';

const data: DisableCommentJobData = {
  type: 'disable-comment',
  accountId: 'account-1',
  cafeId: 'cafe-1',
  articleId: 101,
};
const account = { id: 'account-1', password: 'pw' };

const createDeps = (runDisable: () => Promise<{ success: boolean; error?: string; articleId?: number }>) => {
  const events: string[] = [];
  return {
    events,
    deps: {
      acquireLock: async () => { events.push('acquire'); },
      releaseLock: () => { events.push('release'); },
      ensureLoggedIn: async () => ({ success: true as const }),
      runDisable,
    },
  };
};

test('disable-comment job succeeds when changed and when already disabled', async () => {
  for (const result of [
    { success: true, articleId: 101 },
    { success: true, articleId: 101, alreadyDisabled: true },
  ]) {
    const { deps, events } = createDeps(async () => result);
    const handle = createDisableCommentJobHandler(deps);

    assert.deepEqual(await handle(data, { account }), { success: true, articleId: 101 });
    assert.deepEqual(events, ['acquire', 'release']);
  }
});

test('disable-comment job returns login and DOM failures and always releases the lock', async () => {
  const loginEvents: string[] = [];
  const loginFailure = createDisableCommentJobHandler({
    acquireLock: async () => { loginEvents.push('acquire'); },
    releaseLock: () => { loginEvents.push('release'); },
    ensureLoggedIn: async () => ({ success: false, error: '인증 실패' }),
    runDisable: async () => ({ success: true, articleId: 101 }),
  });
  const { deps, events } = createDeps(async () => ({ success: false, error: '댓글 체크박스 없음' }));
  const domFailure = createDisableCommentJobHandler(deps);

  assert.deepEqual(await loginFailure(data, { account }), {
    success: false,
    error: '로그인 실패: 인증 실패',
  });
  assert.deepEqual(loginEvents, ['acquire', 'release']);
  assert.deepEqual(await domFailure(data, { account }), {
    success: false,
    error: '댓글 체크박스 없음',
  });
  assert.deepEqual(events, ['acquire', 'release']);
});
