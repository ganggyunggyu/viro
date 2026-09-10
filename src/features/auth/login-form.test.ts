import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginFormUI, type LoginFormProps } from '@/features/auth/login-form-ui';

const render = (overrides: Partial<LoginFormProps> = {}) => renderToStaticMarkup(createElement(LoginFormUI, {
  mode: 'common', linking: false, loading: false, error: '', onSubmit: () => {}, ...overrides,
}));
test('default form clearly identifies common membership and preserves explicit legacy linking', () => {
  assert.match(render(), /다붓 아이디/);
  assert.match(render({ mode: 'legacy' }), /기존 바이로 아이디/);
  const linking = render({ linking: true });
  assert.match(linking, /기존 바이로 아이디/);
  assert.match(linking, /기존 바이로 비밀번호/);
  assert.match(linking, /기존 카페와 작업을 이 계정에 연결/);
  assert.match(render({ mode: 'signup' }), /다붓 공통 회원가입/);
  assert.match(render({ loading: true }), /disabled/);
});
