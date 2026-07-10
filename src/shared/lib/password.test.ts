import assert from 'node:assert/strict';
import test from 'node:test';

import { hashPassword, isHashedPassword, verifyPassword } from './password';

test('hashPassword produces a salt:hash pair recognized by isHashedPassword', () => {
  const hashed = hashPassword('correct-horse-battery-staple');

  assert.equal(isHashedPassword(hashed), true);
  assert.equal(hashed.split(':').length, 2);
});

test('hashPassword salts each call so identical passwords hash differently', () => {
  const first = hashPassword('same-password');
  const second = hashPassword('same-password');

  assert.notEqual(first, second);
});

test('verifyPassword accepts the correct password against its own hash', () => {
  const hashed = hashPassword('my-real-password');

  assert.equal(verifyPassword('my-real-password', hashed), true);
});

test('verifyPassword rejects an incorrect password', () => {
  const hashed = hashPassword('my-real-password');

  assert.equal(verifyPassword('wrong-password', hashed), false);
});

test('verifyPassword rejects malformed stored values', () => {
  assert.equal(verifyPassword('anything', ''), false);
  assert.equal(verifyPassword('anything', 'not-a-hash'), false);
  assert.equal(verifyPassword('anything', 'onlysalt:'), false);
});

test('isHashedPassword treats plaintext legacy passwords as not-yet-hashed', () => {
  assert.equal(isHashedPassword('plain-text-password'), false);
  assert.equal(isHashedPassword('21lab1234'), false);
});
