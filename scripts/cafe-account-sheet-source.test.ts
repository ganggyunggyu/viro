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
