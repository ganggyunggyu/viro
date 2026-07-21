import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assignMainComments,
  selectCommenterAccounts,
  selectNormalReplyAccount,
} from './comment-assignment-harness';

const accounts = [
  { id: 'writer', password: 'pw' },
  { id: 'commenter-1', password: 'pw' },
  { id: 'commenter-2', password: 'pw' },
];

test('comment account selection uses all non-writers for undefined and skips for an empty list', () => {
  assert.deepEqual(
    selectCommenterAccounts(accounts, 'writer', undefined).map(({ id }) => id),
    ['commenter-1', 'commenter-2'],
  );
  assert.deepEqual(selectCommenterAccounts(accounts, 'writer', []), []);
});

test('comment account selection preserves account order and never assigns the writer', () => {
  assert.deepEqual(
    selectCommenterAccounts(accounts, 'writer', ['writer', 'commenter-2']).map(({ id }) => id),
    ['commenter-2'],
  );
});

test('viral main comments map source indices to queue indices and accounts round-robin', () => {
  const assignments = assignMainComments([
    { type: 'comment', index: 4, content: '첫 댓글' },
    { type: 'author_reply', index: 5, parentIndex: 4, content: '대댓글' },
    { type: 'comment', index: 9, content: '둘째 댓글' },
    { type: 'comment', index: 12, content: '셋째 댓글' },
  ], accounts.slice(1));

  assert.deepEqual(assignments, [
    { sourceIndex: 4, commentIndex: 0, accountId: 'commenter-1', content: '첫 댓글' },
    { sourceIndex: 9, commentIndex: 1, accountId: 'commenter-2', content: '둘째 댓글' },
    { sourceIndex: 12, commentIndex: 2, accountId: 'commenter-1', content: '셋째 댓글' },
  ]);
});

test('normal replies never use the parent comment author while author replies remain writer-only', () => {
  const replyer = selectNormalReplyAccount(accounts.slice(1), 'commenter-1', 0);
  assert.equal(replyer?.id, 'commenter-2');
  assert.notEqual(replyer?.id, 'writer');
  assert.notEqual(replyer?.id, 'commenter-1');
  assert.equal(accounts.find(({ id }) => id === 'writer')?.id, 'writer');
});
