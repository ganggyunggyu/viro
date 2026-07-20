import assert from 'node:assert/strict';
import test from 'node:test';
import { parseExposureRows, parseManuscripts, splitLines } from './renderer-utils';

test('splitLines removes blanks and trims values', () => {
  assert.deepEqual(splitLines(' first\n\n second '), ['first', 'second']);
});

test('parseManuscripts uses the first line as title and separates blocks', () => {
  assert.deepEqual(parseManuscripts('제목 1\n본문 1\n---\n제목 2\n본문 2'), [
    {
      folderName: '제목 1',
      title: '제목 1',
      body: '본문 1',
      htmlContent: '<p>본문 1</p>',
      images: [],
    },
    {
      folderName: '제목 2',
      title: '제목 2',
      body: '본문 2',
      htmlContent: '<p>본문 2</p>',
      images: [],
    },
  ]);
});

test('parseExposureRows accepts cafe, keyword and optional article id', () => {
  assert.deepEqual(parseExposureRows('123|키워드|456\n789|두 번째'), [
    { cafeId: '123', keyword: '키워드', articleId: 456 },
    { cafeId: '789', keyword: '두 번째' },
  ]);
});
