import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReplyTasks } from './keyword-processor-utils';

const writerAccount = { id: 'writer1', password: 'pw', nickname: '글쓴이' };

const commenterAccounts = [
  { id: 'commenter1', password: 'pw', nickname: '댓글러1' },
  { id: 'commenter2', password: 'pw', nickname: '댓글러2' },
  { id: 'commenter3', password: 'pw', nickname: '댓글러3' },
];

const commentAuthors = [
  { id: 'commenter1', nickname: '댓글러1' },
  { id: 'commenter2', nickname: '댓글러2' },
  { id: 'commenter3', nickname: '댓글러3' },
  { id: 'commenter1', nickname: '댓글러1' },
  { id: 'commenter2', nickname: '댓글러2' },
  { id: 'commenter3', nickname: '댓글러3' },
];

const commentTexts = commentAuthors.map((_, i) => `댓글 ${i}`);

// Math.random()을 쓰기 때문에 정확한 출력값 대신 여러 번 반복해서 불변식을 검증한다.
const RUNS = 300;

test('buildReplyTasks never targets the same comment index twice in one run', () => {
  for (let i = 0; i < RUNS; i++) {
    const tasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
    const indices = tasks.map((t) => t.targetCommentIndex);
    assert.equal(new Set(indices).size, indices.length, `중복 타겟 발견: ${JSON.stringify(indices)}`);
  }
});

test('buildReplyTasks only targets indices within the comment list bounds', () => {
  for (let i = 0; i < RUNS; i++) {
    const tasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
    for (const task of tasks) {
      assert.ok(
        task.targetCommentIndex >= 0 && task.targetCommentIndex < commentTexts.length,
        `범위 밖 인덱스: ${task.targetCommentIndex}`
      );
    }
  }
});

test('buildReplyTasks assigns author replies to the writer account only', () => {
  for (let i = 0; i < RUNS; i++) {
    const tasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
    for (const task of tasks.filter((t) => t.isAuthor)) {
      assert.equal(task.account.id, writerAccount.id);
    }
  }
});

test('buildReplyTasks assigns normal replies to a commenter account, never the writer', () => {
  for (let i = 0; i < RUNS; i++) {
    const tasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
    for (const task of tasks.filter((t) => !t.isAuthor)) {
      assert.ok(commenterAccounts.some((a) => a.id === task.account.id));
      assert.notEqual(task.account.id, writerAccount.id);
    }
  }
});

test('buildReplyTasks never assigns a normal reply to the account that authored that comment', () => {
  for (let i = 0; i < RUNS; i++) {
    const tasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
    for (const task of tasks.filter((t) => !t.isAuthor)) {
      const commentAuthorId = commentAuthors[task.targetCommentIndex].id;
      assert.notEqual(task.account.id, commentAuthorId, '본인 댓글에 본인이 답글을 달았음');
    }
  }
});

test('buildReplyTasks produces a reasonable task count relative to available comments', () => {
  for (let i = 0; i < RUNS; i++) {
    const tasks = buildReplyTasks(writerAccount, commenterAccounts, commentAuthors, commentTexts);
    // 글쓴이 대댓글 2~3개 + 일반 대댓글 최대 4개(availableIndices 소진 시 그 이하) 이므로
    // 이론상 최대치를 넘을 수 없다.
    assert.ok(tasks.length <= 3 + 4);
    assert.ok(tasks.length <= commentTexts.length);
  }
});

test('buildReplyTasks handles a single comment without crashing', () => {
  const oneAuthor = [commentAuthors[0]];
  const oneText = [commentTexts[0]];
  const tasks = buildReplyTasks(writerAccount, commenterAccounts, oneAuthor, oneText);
  assert.ok(tasks.length <= 1);
});

test('buildReplyTasks handles zero comments without crashing', () => {
  const tasks = buildReplyTasks(writerAccount, commenterAccounts, [], []);
  assert.deepEqual(tasks, []);
});
