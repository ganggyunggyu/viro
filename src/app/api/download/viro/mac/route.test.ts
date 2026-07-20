import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from './route';

test('Mac download starts from the Viro domain and redirects to the release asset', () => {
  const response = GET();

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get('location'),
    'https://github.com/ganggyunggyu/viro/releases/download/v0.2.0/Viro-0.2.0-arm64.dmg',
  );
  assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
});
