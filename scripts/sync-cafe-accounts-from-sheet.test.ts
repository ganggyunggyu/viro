import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applySheetAccountSyncPlan,
  syncCafeAccountsFromSheet,
  type AccountSyncModel,
  type SheetValuesSource,
} from './sync-cafe-accounts-from-sheet';
import {
  buildSheetAccountSyncPlan,
  parseCafeAccountRows,
  parseMasterAccountRows,
} from './cafe-account-sheet-source';

interface ModelCall {
  method: 'find' | 'updateOne' | 'updateMany';
  filter: unknown;
  update?: unknown;
  options?: unknown;
}

const createAccountModel = (
  accountIds: string[] = [],
): { accountModel: AccountSyncModel; calls: ModelCall[] } => {
  const calls: ModelCall[] = [];
  const accountModel: AccountSyncModel = {
    findAccountIds: async (userId) => {
      calls.push({ method: 'find', filter: { userId } });
      return accountIds;
    },
    updateOne: async (filter, update, options) => {
      calls.push({ method: 'updateOne', filter, update, options });
      return { matchedCount: 1, upsertedCount: 0 };
    },
    updateMany: async (filter, update) => {
      calls.push({ method: 'updateMany', filter, update });
      return { modifiedCount: 1 };
    },
  };

  return { accountModel, calls };
};

const buildPlan = () => buildSheetAccountSyncPlan(
  parseMasterAccountRows([
    ['N0.', '블로그 아이디', '블로그 링크', 'ID', 'PW', '카테고리', 'MVPN', '실명인증', '특이사항'],
    ['', '활성 작가', '', 'active-writer', 'pw1', '건강', 'PC', '담당자', '마스터 메모'],
    ['', '비활성 댓글러', '', 'inactive-commenter', 'pw2', '건강', '모바일', '담당자', '비활성 메모'],
  ]),
  parseCafeAccountRows([
    ['계정ID', '역할', '사용여부', '닉네임', '원장행', '카테고리', '담당/실명인증', '대상카페', '일일글한도', '비고'],
    ['active-writer', 'writer', 'TRUE', '활성 작가', '9', '건강', '', 'A', '5', '카페 메모'],
    ['inactive-commenter', 'commenter', 'FALSE', '비활성 댓글러', '10', '건강', '', '', '5', '중지'],
  ]),
  ['active-writer'],
  ['active-writer', 'inactive-commenter', 'db-only-account'],
);

test('apply deactivates explicit FALSE rows and reports DB-only accounts without pruning them', async () => {
  const { accountModel, calls } = createAccountModel();

  const summary = await applySheetAccountSyncPlan({
    userId: 'user-1',
    plan: buildPlan(),
    accountModel,
  });

  const deactivateCalls = calls.filter(({ method }) => method === 'updateMany');
  assert.deepEqual(deactivateCalls, [{
    method: 'updateMany',
    filter: {
      userId: 'user-1',
      accountId: { $in: ['inactive-commenter'] },
    },
    update: { $set: { isActive: false } },
  }]);
  assert.deepEqual(summary.driftAccountIds, ['db-only-account']);
  assert.equal(summary.deactivated, 1);
});

test('apply preserves target cafes, mvpn, and sheet metadata in the account upsert', async () => {
  const { accountModel, calls } = createAccountModel();

  await applySheetAccountSyncPlan({
    userId: 'user-1',
    plan: buildPlan(),
    accountModel,
  });

  const [upsertCall] = calls.filter(({ method }) => method === 'updateOne');
  assert.deepEqual(upsertCall, {
    method: 'updateOne',
    filter: { userId: 'user-1', accountId: 'active-writer' },
    update: {
      $set: {
        userId: 'user-1',
        accountId: 'active-writer',
        password: 'pw1',
        nickname: '활성 작가',
        role: 'writer',
        isActive: true,
        isMain: false,
        dailyPostLimit: 5,
        activityHours: { start: 0, end: 24 },
        restDays: [],
        targetCafes: 'A',
        targetCafeIds: ['A'],
        mvpn: 'PC',
        sheetMeta: {
          blogUrl: '',
          category: '건강',
          owner: '담당자',
          masterRowNumber: 9,
          cafeRowNumber: 2,
          masterNote: '마스터 메모',
          cafeNote: '카페 메모',
        },
      },
    },
    options: { upsert: true, setDefaultsOnInsert: true },
  });
});

test('apply performs no writes when the parsed plan has zero active accounts', async () => {
  const { accountModel, calls } = createAccountModel();
  const plan = buildSheetAccountSyncPlan(
    parseMasterAccountRows([
      ['N0.', '블로그 아이디', '블로그 링크', 'ID', 'PW'],
      ['', '비활성', '', 'inactive-only', 'pw1'],
    ]),
    parseCafeAccountRows([
      ['계정ID', '역할', '사용여부'],
      ['inactive-only', 'commenter', 'FALSE'],
    ]),
    [],
  );

  await assert.rejects(
    applySheetAccountSyncPlan({ userId: 'user-1', plan, accountModel }),
    /active 계정이 0개/,
  );
  assert.deepEqual(calls, []);
});

test('sheet read failure stops before any Account model read or write', async () => {
  const { accountModel, calls } = createAccountModel(['db-only-account']);
  const sheetSource: SheetValuesSource = {
    readValues: async () => {
      throw new Error('sheet parse failed');
    },
  };

  await assert.rejects(
    syncCafeAccountsFromSheet({
      userId: 'user-1',
      sheetSource,
      accountModel,
    }),
    /sheet parse failed/,
  );
  assert.deepEqual(calls, []);
});
