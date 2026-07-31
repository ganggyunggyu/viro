import assert from 'node:assert/strict';
import test from 'node:test';
import { CAFE_TOPIC_PRESETS } from './presets';
import { resolveCafeCreateForm } from './form-harness';

test('cafe creation maps a preset to the exact Naver major and minor categories', () => {
  const result = resolveCafeCreateForm({
    name: ' 건강 카페 ',
    slug: ' health-cafe ',
    presetKey: 'health-care',
    description: ' 설명 ',
    keywords: [' 건강 정보 ', '', '식품'],
  }, CAFE_TOPIC_PRESETS);

  assert.deepEqual(result, {
    name: ' 건강 카페 ',
    slug: ' health-cafe ',
    categoryMajor: '건강/다이어트',
    categoryMinor: '건강관리/건강식품',
    description: ' 설명 ',
    keywords: [' 건강 정보 ', '', '식품'],
  });
});

test('cafe creation rejects an unknown preset without browser work', () => {
  const result = resolveCafeCreateForm({
    name: '카페',
    slug: 'cafe',
    presetKey: 'missing',
    description: '설명',
    keywords: [],
  }, CAFE_TOPIC_PRESETS);

  assert.equal(result, undefined);
});
