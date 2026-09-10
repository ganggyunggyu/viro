import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { getAgentHomeDir } from './lib/config';

const login = async () => {
  if (!process.stdin.isTTY) throw new Error('로그인은 대화형 터미널에서 실행하세요.');
  let hidden = false;
  const output = new Writable({ write: (chunk, _encoding, callback) => { if (!hidden) process.stdout.write(chunk); callback(); } });
  const input = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const brokerUrl = (await input.question('Viro 주소 (기본 https://cafe-bot-two.vercel.app): ')).trim() || 'https://cafe-bot-two.vercel.app';
    const url = new URL(brokerUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('HTTPS 서비스 기본 주소를 입력하세요.');
    const loginId = await input.question('아이디: ');
    process.stdout.write('비밀번호: '); hidden = true;
    const password = await input.question(''); hidden = false; process.stdout.write('\n');
    const response = await fetch(`${url.origin}/api/agent/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ loginId, password }), signal: AbortSignal.timeout(30000), redirect: 'error' });
    if (!response.ok) throw new Error('로그인하지 못했습니다. 아이디와 비밀번호, 서버 연결을 확인하세요.');
    const data = await response.json() as { token?: string };
    if (typeof data.token !== 'string' || !data.token) throw new Error('로그인 응답을 확인하지 못했습니다.');
    await mkdir(getAgentHomeDir(), { recursive: true, mode: 0o700 });
    await writeFile(join(getAgentHomeDir(), 'config.json'), JSON.stringify({ brokerUrl: url.origin, token: data.token }), { mode: 0o600 });
    await chmod(join(getAgentHomeDir(), 'config.json'), 0o600);
    console.log('로그인했습니다. npm run agent로 작업 프로그램을 실행하세요.');
  } finally { input.close(); }
};
void login().catch((error: unknown) => { console.error(error instanceof Error ? error.message : '로그인 실패'); process.exitCode = 1; });
