import assert from 'node:assert/strict';
import test from 'node:test';

import { fillLoginInput } from '@/shared/lib/login-input';

const createLoginInputPage = (platform: NodeJS.Platform) => {
  let currentValue = 'previous-account';
  let focused = false;
  let selected = false;
  const calls: unknown[] = [];

  const click = async (options: { force: boolean }) => {
    calls.push(['click', options]);
    focused = true;
  };
  const locator = (selector: string) => {
    calls.push(['locator', selector]);
    return { click };
  };
  const press = async (key: string) => {
    calls.push(['press', key]);
    selected = focused && key === (platform === 'darwin' ? 'Meta+A' : 'Control+A');
  };
  const type = async (value: string, options: { delay: number }) => {
    calls.push(['type', value, options]);
    if (focused) currentValue = selected ? value : currentValue + value;
    selected = false;
  };
  const getValue = () => currentValue;

  return { page: { locator, keyboard: { press, type } }, calls, getValue };
};

for (const platform of ['darwin', 'win32', 'linux'] as const) {
  test(`${platform} login input replaces an existing value and preserves typing options`, async () => {
    const { page, calls, getValue } = createLoginInputPage(platform);

    await fillLoginInput(page, 'input#id', 'next-account', platform);

    assert.equal(getValue(), 'next-account');
    assert.deepEqual(calls, [
      ['locator', 'input#id'],
      ['click', { force: true }],
      ['press', platform === 'darwin' ? 'Meta+A' : 'Control+A'],
      ['type', 'next-account', { delay: 50 }],
    ]);

    await fillLoginInput(page, 'input#id', 'retried-account', platform);
    assert.equal(getValue(), 'retried-account');
  });
}

test('login input defaults to the current operating system', async () => {
  const { page, getValue } = createLoginInputPage(process.platform);

  await fillLoginInput(page, 'input#pw', 'replacement-value');

  assert.equal(getValue(), 'replacement-value');
});

test('login input stops if focusing the field fails', async () => {
  const { page, calls, getValue } = createLoginInputPage('linux');
  const click = async () => { throw new Error('Input is unavailable'); };
  const locator = () => ({ click });

  await assert.rejects(
    fillLoginInput({ ...page, locator }, 'input#id', 'next-account', 'linux'),
    /Input is unavailable/,
  );

  assert.equal(getValue(), 'previous-account');
  assert.deepEqual(calls, []);
});
