import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSheetAccountSyncPlan,
  parseCafeAccountRows,
  parseMasterAccountRows,
  parseWriterAccountIds,
} from './cafe-account-sheet-source';

test('parseMasterAccountRows reads only rows with id and password', () => {
  const rows = [
    ['N0.', '블로그 아이디', '블로그 링크', 'ID', 'PW', '카테고리', 'MVPN', '실명인증', '특이사항'],
    ['', '소원 1', 'https://m.blog.naver.com/regular14631', 'regular14631', 'pw1', '흑염소', '', '미정씨', '라준사 가입'],
    ['', '누락', '', 'missing-password', '', '흑염소'],
  ];

  const parsed = parseMasterAccountRows(rows, 8);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].rowNumber, 9);
  assert.equal(parsed[0].accountId, 'regular14631');
  assert.equal(parsed[0].nickname, '소원 1');
});

test('buildSheetAccountSyncPlan requires cafe roster roles to match writer tab', () => {
  const masterAccounts = parseMasterAccountRows([
    ['N0.', '블로그 아이디', '블로그 링크', 'ID', 'PW', '카테고리', 'MVPN', '실명인증', '특이사항'],
    ['', '소원 1', '', 'regular14631', 'pw1', '흑염소'],
    ['', '댓글러', '', 'commenter1', 'pw2', '흑염소'],
  ]);
  const cafeAccounts = parseCafeAccountRows([
    ['계정ID', '역할', '사용여부', '닉네임', '원장행', '카테고리', '담당/실명인증', '대상카페', '일일글한도', '비고'],
    ['regular14631', 'writer', 'TRUE', '소원 1', '9', '흑염소', '', '건강관리소', '5'],
    ['commenter1', 'writer', 'TRUE', '댓글러', '10', '흑염소', '', '댓글/대댓글', '5'],
  ]);
  const writerAccountIds = parseWriterAccountIds([
    ['계정ID', '닉네임', '사용여부'],
    ['regular14631', '소원 1', 'TRUE'],
  ]);

  const plan = buildSheetAccountSyncPlan(masterAccounts, cafeAccounts, writerAccountIds);

  assert.deepEqual(plan.accounts.map(({ accountId }) => accountId), ['regular14631']);
  assert.deepEqual(plan.writerMismatchIds, ['commenter1']);
});

test('buildSheetAccountSyncPlan reports cafe roster accounts missing in master sheet', () => {
  const plan = buildSheetAccountSyncPlan(
    [],
    parseCafeAccountRows([
      ['계정ID', '역할'],
      ['ghost-account', 'commenter'],
    ]),
    [],
  );

  assert.deepEqual(plan.missingInMaster, ['ghost-account']);
  assert.deepEqual(plan.accounts, []);
});

test('buildSheetAccountSyncPlan separates explicit inactive accounts from DB-only drift', () => {
  const masterAccounts = parseMasterAccountRows([
    ['N0.', '블로그 아이디', '블로그 링크', 'ID', 'PW', '카테고리', 'MVPN', '실명인증', '특이사항'],
    ['', '활성 작가', '', 'active-writer', 'pw1', '건강', 'PC', '담당자', '마스터 메모'],
    ['', '비활성 댓글러', '', 'inactive-commenter', 'pw2', '건강', '모바일', '담당자', '비활성 메모'],
  ]);
  const cafeAccounts = parseCafeAccountRows([
    ['계정ID', '역할', '사용여부', '닉네임', '원장행', '카테고리', '담당/실명인증', '대상카페', '일일글한도', '비고'],
    ['active-writer', 'writer', 'TRUE', '활성 작가', '9', '건강', '', 'A', '5', '카페 메모'],
    ['inactive-commenter', 'commenter', 'FALSE', '비활성 댓글러', '10', '건강', '', '', '5', '중지'],
  ]);

  const plan = buildSheetAccountSyncPlan(
    masterAccounts,
    cafeAccounts,
    ['active-writer'],
    ['active-writer', 'inactive-commenter', 'db-only-account'],
  );

  assert.deepEqual(plan.deactivateAccountIds, ['inactive-commenter']);
  assert.deepEqual(plan.driftAccountIds, ['db-only-account']);
});

test('buildSheetAccountSyncPlan preserves target cafes, mvpn, and sheet metadata', () => {
  const masterAccounts = parseMasterAccountRows([
    ['N0.', '블로그 아이디', '블로그 링크', 'ID', 'PW', '카테고리', 'MVPN', '실명인증', '특이사항'],
    ['', '활성 작가', 'https://m.blog.naver.com/active-writer', 'active-writer', 'pw1', '건강', 'PC', '담당자', '마스터 메모'],
  ]);
  const cafeAccounts = parseCafeAccountRows([
    ['계정ID', '역할', '사용여부', '닉네임', '원장행', '카테고리', '담당/실명인증', '대상카페', '일일글한도', '비고'],
    ['active-writer', 'writer', 'TRUE', '활성 작가', '9', '건강', '', 'https://cafe.naver.com/A, B', '7', '카페 메모'],
  ]);

  const { accounts } = buildSheetAccountSyncPlan(
    masterAccounts,
    cafeAccounts,
    ['active-writer'],
  );

  assert.deepEqual(accounts[0], {
    rowNumber: 2,
    accountId: 'active-writer',
    role: 'writer',
    isActive: true,
    targetCafes: 'https://cafe.naver.com/A, B',
    targetCafeIds: ['A', 'B'],
    dailyPostLimit: 7,
    note: '카페 메모',
    password: 'pw1',
    nickname: '활성 작가',
    blogUrl: 'https://m.blog.naver.com/active-writer',
    category: '건강',
    mvpn: 'PC',
    owner: '담당자',
    sourceRowNumber: 9,
    sheetMeta: {
      masterRowNumber: 9,
      cafeRowNumber: 2,
      masterNote: '마스터 메모',
      cafeNote: '카페 메모',
    },
  });
});
