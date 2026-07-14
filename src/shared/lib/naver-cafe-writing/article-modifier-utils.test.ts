import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SMART_EDITOR_PLACEHOLDER_TEXT,
  isRealParagraphText,
  isModifyRedirectComplete,
  isTypedContentTooShort,
  convertHtmlContentToPlainText,
} from './article-modifier-utils';

// --- isRealParagraphText (버그 3: placeholder 오인) ---

test('isRealParagraphText treats the SmartEditor placeholder as empty', () => {
  assert.equal(isRealParagraphText(SMART_EDITOR_PLACEHOLDER_TEXT), false);
});

test('isRealParagraphText treats blank/whitespace-only text as empty', () => {
  assert.equal(isRealParagraphText(''), false);
  assert.equal(isRealParagraphText('   '), false);
  assert.equal(isRealParagraphText(null), false);
  assert.equal(isRealParagraphText(undefined), false);
});

test('isRealParagraphText treats real content as non-empty', () => {
  assert.equal(isRealParagraphText('실제 본문 내용입니다'), true);
});

test('isRealParagraphText does not treat placeholder-adjacent text as empty (known residual risk)', () => {
  // 완전 일치 비교라 접두/접미 문자가 조금이라도 붙으면 실제 텍스트로 인식된다.
  // 이건 의도된 동작(placeholder가 아닌 실제 잔존 텍스트로 취급)임을 명시한다.
  assert.equal(isRealParagraphText(`${SMART_EDITOR_PLACEHOLDER_TEXT}추가텍스트`), true);
});

// --- isModifyRedirectComplete (버그 4: 제출 후 리다이렉트 오판) ---

test('isModifyRedirectComplete returns false for the starting modify URL', () => {
  // 이게 버그 4의 정확한 재현 케이스 — 수정 전 로직은 이 URL도 true로 오판했다.
  assert.equal(
    isModifyRedirectComplete('https://cafe.naver.com/ca-fe/cafes/123/articles/456/modify'),
    false
  );
});

test('isModifyRedirectComplete returns true for the real article detail URL', () => {
  assert.equal(
    isModifyRedirectComplete('https://cafe.naver.com/ca-fe/cafes/123/articles/456'),
    true
  );
});

test('isModifyRedirectComplete returns true when "modify" only appears in the query string', () => {
  assert.equal(
    isModifyRedirectComplete('https://cafe.naver.com/ca-fe/cafes/123/articles/456?ref=modify-list'),
    true
  );
});

test('isModifyRedirectComplete returns false for a non-numeric write URL', () => {
  assert.equal(
    isModifyRedirectComplete('https://cafe.naver.com/ca-fe/cafes/123/articles/write'),
    false
  );
});

// --- isTypedContentTooShort (버그 5: 타이핑 유실 안전장치) ---

test('isTypedContentTooShort flags content well below the threshold', () => {
  const plainContent = '가'.repeat(1000);
  const editorText = '가'.repeat(400); // 40%
  assert.equal(isTypedContentTooShort(editorText, plainContent), true);
});

test('isTypedContentTooShort passes content at or above the threshold', () => {
  const plainContent = '가'.repeat(1000);
  const editorText = '가'.repeat(600); // 60%
  assert.equal(isTypedContentTooShort(editorText, plainContent), false);
});

test('isTypedContentTooShort treats exactly-threshold length as safe (boundary contract)', () => {
  const plainContent = '가'.repeat(1000);
  const editorText = '가'.repeat(500); // 정확히 50%
  assert.equal(isTypedContentTooShort(editorText, plainContent), false);
});

test('isTypedContentTooShort never flags an empty expected body as too short', () => {
  // expectedLength가 0이면 editorLength < 0은 항상 false — 빈 본문 재작성은
  // 이 가드에 걸리지 않는다는 걸 명시적으로 고정한다.
  assert.equal(isTypedContentTooShort('', ''), false);
  assert.equal(isTypedContentTooShort('아무거나', ''), false);
});

test('isTypedContentTooShort ignores zero-width characters and the placeholder text', () => {
  const plainContent = '가'.repeat(600);
  const editorText = `​​${'가'.repeat(600)}${SMART_EDITOR_PLACEHOLDER_TEXT}﻿`;
  assert.equal(isTypedContentTooShort(editorText, plainContent), false);
});

// --- convertHtmlContentToPlainText ---

test('convertHtmlContentToPlainText converts paragraph boundaries to newlines', () => {
  assert.equal(convertHtmlContentToPlainText('<p>A</p><p>B</p>'), 'A\nB');
});

test('convertHtmlContentToPlainText converts both <br> and <br/> to newlines', () => {
  assert.equal(convertHtmlContentToPlainText('A<br>B<br/>C'), 'A\nB\nC');
});

test('convertHtmlContentToPlainText strips unknown tags but keeps their text', () => {
  assert.equal(convertHtmlContentToPlainText('<span style="color:red">A</span>'), 'A');
});

test('convertHtmlContentToPlainText trims leading/trailing whitespace', () => {
  assert.equal(convertHtmlContentToPlainText('  <p>A</p>  '), 'A');
});

test('convertHtmlContentToPlainText returns an empty string for empty input', () => {
  assert.equal(convertHtmlContentToPlainText(''), '');
});
