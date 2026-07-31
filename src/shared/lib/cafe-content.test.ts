import assert from 'node:assert/strict';
import test from 'node:test';
import { toPlainCafeBody } from './cafe-content';

test('br과 p 태그는 줄바꿈으로 되돌린다', () => {
  const plain = toPlainCafeBody('<p>첫 줄</p><br><p>둘째 줄</p>');
  assert.equal(plain, '첫 줄\n\n둘째 줄');
});

test('이미지 태그는 통째로 제거한다', () => {
  const plain = toPlainCafeBody('앞<br><img src="data:image/png;base64,AAAA" alt="x" /><br>뒤');
  assert.equal(plain, '앞\n\n뒤');
  assert.doesNotMatch(plain, /base64/);
});

test('HTML 엔티티는 원래 문자로 되돌린다', () => {
  assert.equal(toPlainCafeBody('가격&nbsp;비교 &amp; 후기'), '가격 비교 & 후기');
});

test('빈 줄이 세 개 이상 이어지면 두 개로 줄인다', () => {
  assert.equal(toPlainCafeBody('가<br><br><br><br>나'), '가\n\n나');
});
