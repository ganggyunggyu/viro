import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBaseFilter } from './modify-query-utils';

test('modify base filter excludes external article stubs', () => {
  assert.deepEqual(buildBaseFilter('31750114'), {
    cafeId: '31750114',
    status: 'published',
    isExternal: { $ne: true },
  });
});
