import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildE2ePlan,
  isMutationConfirmed,
  runE2ePlan,
  selectCafeAccountRoster,
  selectStoredSessionAccount,
  type E2eStepHandler,
} from './e2e-mealtalkdht';

const accounts = [
  { id: 'writer-a', password: 'secret', role: 'writer' as const },
  { id: 'commenter-a', password: 'secret', role: 'commenter' as const },
];

test('mutation steps stay gated without --confirm-live-post', () => {
  const plan = buildE2ePlan([]);
  const mutationSteps = plan.filter(({ phase }) => phase === 'mutation');

  assert.equal(plan.length, 8);
  assert.equal(isMutationConfirmed([]), false);
  assert.equal(mutationSteps.length, 3);
  assert.ok(mutationSteps.every(({ execute, skipReason }) =>
    !execute && skipReason === 'gated (skipped)'));
});

test('read-only plan executes no writes', () => {
  const plan = buildE2ePlan([]);
  const executedSteps = plan.filter(({ execute }) => execute);

  assert.ok(executedSteps.length > 0);
  assert.ok(executedSteps.every(({ write }) => write === false));
});

test('--confirm-live-post unlocks the mutation sequence only through the hard gate', () => {
  const plan = buildE2ePlan(['--confirm-live-post']);
  const mutationSteps = plan.filter(({ phase }) => phase === 'mutation');

  assert.equal(isMutationConfirmed(['--confirm-live-post']), true);
  assert.ok(mutationSteps.every(({ execute, skipReason }) => execute && !skipReason));
  assert.deepEqual(
    mutationSteps.map(({ id }) => id),
    ['post-writing', 'comment-writing', 'post-comment-verification'],
  );
});

test('runE2ePlan preserves step order and never calls gated handlers', async () => {
  const calls: string[] = [];
  const handlers = Object.fromEntries(
    buildE2ePlan([]).map(({ id }) => [
      id,
      (async () => {
        calls.push(id);
        return { status: 'PASS' as const, detail: id };
      }) satisfies E2eStepHandler,
    ]),
  );

  const results = await runE2ePlan(buildE2ePlan([]), handlers);

  assert.deepEqual(calls, [
    'account-management',
    'account-registration-dry',
    'cafe-management',
    'cafe-registration-dry',
    'queue-management',
  ]);
  assert.deepEqual(
    results.slice(-3).map(({ status, detail }) => ({ status, detail })),
    [
      { status: 'SKIP', detail: 'gated (skipped)' },
      { status: 'SKIP', detail: 'gated (skipped)' },
      { status: 'SKIP', detail: 'gated (skipped)' },
    ],
  );
});

test('invalid stored sessions are skipped without a relogin path', async () => {
  const checkedAccountIds: string[] = [];
  const result = await selectStoredSessionAccount({
    accounts,
    isAccountLoggedIn: async (accountId) => {
      checkedAccountIds.push(accountId);
      return false;
    },
  });

  assert.deepEqual(checkedAccountIds, ['writer-a', 'commenter-a']);
  assert.equal(result.account, undefined);
  assert.equal(result.status, 'SKIP');
  assert.equal(result.detail, 'session invalid, skipped(재로그인 안 함)');
});

test('writer and commenter lookup receives both cafeId and normalized slug', () => {
  const writerCalls: unknown[][] = [];
  const commenterCalls: unknown[][] = [];
  const cafe = {
    cafeId: '31750114',
    cafeUrl: 'https://cafe.naver.com/mealtalkdht',
    menuId: '1',
    name: '맛집 밥상노트',
    categories: ['자유게시판'],
  };

  const result = selectCafeAccountRoster({
    accounts,
    cafe,
    toCafeSlug: () => 'mealtalkdht',
    getCafeWriterAccounts: (...args) => {
      writerCalls.push(args);
      return [accounts[0]];
    },
    getCafeCommenterAccounts: (...args) => {
      commenterCalls.push(args);
      return accounts;
    },
  });

  assert.equal(result.cafeSlug, 'mealtalkdht');
  assert.deepEqual(writerCalls, [[accounts, '31750114', 'mealtalkdht']]);
  assert.deepEqual(commenterCalls, [[accounts, '31750114', 'mealtalkdht']]);
});
