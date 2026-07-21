import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildResultModel,
  parseExposureRows,
  parseManuscripts,
  splitLines,
} from './renderer-utils';

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

test('buildResultModel summarizes a fully failed publish run', () => {
  const model = buildResultModel({
    success: false,
    totalManuscripts: 1,
    completed: 0,
    failed: 1,
    results: [
      { folderName: '마운자로 처방', title: '마운자로 처방 가격', success: false, error: 'GEMINI_API_KEY 미설정' },
    ],
  });
  assert.equal(model.empty, false);
  assert.equal(model.tone, 'bad');
  assert.equal(model.statusLabel, '실패');
  assert.deepEqual(
    model.stats.map(({ label, value, tone }) => [label, value, tone]),
    [['전체 원고', '1', 'neutral'], ['완료', '0', 'neutral'], ['실패', '1', 'bad']],
  );
  assert.equal(model.items.length, 1);
  assert.equal(model.items[0].title, '마운자로 처방 가격');
  assert.equal(model.items[0].tone, 'bad');
  assert.equal(model.items[0].statusLabel, '실패');
  assert.equal(model.items[0].detail, 'GEMINI_API_KEY 미설정');
});

test('buildResultModel marks a mixed run as partial success', () => {
  const model = buildResultModel({ success: false, completed: 1, failed: 1 });
  assert.equal(model.tone, 'warn');
  assert.equal(model.statusLabel, '일부 완료');
});

test('buildResultModel maps exposure statuses to item tones', () => {
  const model = buildResultModel({
    success: true,
    total: 3,
    exposed: 1,
    notExposed: 1,
    failed: 1,
    message: '3건 확인 완료',
    results: [
      { status: '노출', keyword: 'a', cafeName: '카페', articleId: 777 },
      { status: '미노출', keyword: 'b' },
      { status: '확인실패', keyword: 'c', error: '로드 실패' },
    ],
  });
  assert.equal(model.tone, 'ok');
  assert.equal(model.statusLabel, '완료');
  assert.equal(model.message, '3건 확인 완료');
  assert.deepEqual(
    model.items.map(({ tone, statusLabel }) => [tone, statusLabel]),
    [['ok', '노출'], ['warn', '미노출'], ['neutral', '확인실패']],
  );
  assert.deepEqual(model.items[0].badges, [
    { label: '글 #777', tone: 'neutral' },
    { label: '카페', tone: 'neutral' },
  ]);
});

test('buildResultModel renders scalar fields of a created cafe as key-values', () => {
  const model = buildResultModel({
    success: true,
    cafeId: '319',
    cafeUrl: 'https://cafe.naver.com/x',
    sheetSynced: true,
  });
  assert.equal(model.tone, 'ok');
  assert.equal(model.items.length, 0);
  assert.deepEqual(model.kv, [
    { label: '카페 ID', value: '319', link: '' },
    { label: '카페 주소', value: 'https://cafe.naver.com/x', link: 'https://cafe.naver.com/x' },
    { label: '시트 동기화', value: '예', link: '' },
  ]);
});

test('buildResultModel treats a top-level array as a list of items', () => {
  const model = buildResultModel([{ title: 't1' }, { title: 't2' }]);
  assert.equal(model.statusLabel, '2건');
  assert.equal(model.items.length, 2);
});

test('buildResultModel flags empty inputs', () => {
  assert.equal(buildResultModel(null).empty, true);
  assert.equal(buildResultModel([]).empty, true);
  assert.equal(buildResultModel('').empty, true);
});
