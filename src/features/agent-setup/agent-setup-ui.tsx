'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, Copy, Download, Monitor, Trash2 } from 'lucide-react';
import { cn } from '@/shared';
import { Button, Input } from '@/shared';
import { toast } from '@/shared/lib/toast';
import {
  issueAgentToken,
  listAgentTokens,
  revokeAgentToken,
  type AgentTokenView,
} from './actions';

const BROKER_URL = 'https://cafe-bot-two.vercel.app';
const RELEASES_URL = 'https://github.com/ganggyunggyu/viro/releases';
const DOWNLOAD_BUTTON_CLASS =
  'flex items-center justify-center gap-2 rounded-xl border border-(--border-light) bg-(--surface-muted) px-4 py-3 text-sm font-medium text-(--ink) transition-colors hover:border-(--accent) hover:text-(--accent)';

const formatDate = (iso: string | null): string => {
  if (!iso) {
    return '접속 기록 없음';
  }
  const date = new Date(iso);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const isOnline = (iso: string | null): boolean => {
  if (!iso) {
    return false;
  }
  return Date.now() - new Date(iso).getTime() < 3 * 60 * 1000;
};

export const AgentSetupUI = () => {
  const [label, setLabel] = useState('');
  const [issuedToken, setIssuedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokens, setTokens] = useState<AgentTokenView[]>([]);
  const [isPending, startTransition] = useTransition();

  const loadTokens = () => {
    startTransition(async () => {
      const next = await listAgentTokens();
      setTokens(next);
    });
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const handleIssue = () => {
    startTransition(async () => {
      const result = await issueAgentToken(label);
      if (!result.success || !result.token) {
        toast.error('토큰 발급 실패', result.error);
        return;
      }
      setIssuedToken(result.token);
      setCopied(false);
      setLabel('');
      toast.success('에이전트 토큰 발급됨');
      const next = await listAgentTokens();
      setTokens(next);
    });
  };

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(issuedToken);
    setCopied(true);
    toast.success('토큰 복사됨');
  };

  const handleRevoke = (tokenId: string) => {
    startTransition(async () => {
      const result = await revokeAgentToken(tokenId);
      if (!result.success) {
        toast.error('폐기 실패');
        return;
      }
      toast.success('토큰 폐기됨');
      const next = await listAgentTokens();
      setTokens(next);
    });
  };

  const runCommand = `BROKER_URL=${BROKER_URL} AGENT_TOKEN=발급받은토큰 npm run agent`;

  return (
    <div className={cn('space-y-8')}>
      <section className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8')}>
        <div className={cn('flex items-start gap-4')}>
          <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--accent)/10 text-(--accent)')}>
            <Monitor className={cn('h-6 w-6')} />
          </span>
          <div>
            <h2 className={cn('text-lg font-semibold text-(--ink)')}>내 PC에서 켜두는 Viro 프로그램</h2>
            <p className={cn('mt-1 text-sm leading-6 text-(--ink-muted)')}>
              프로그램을 내려받아 켜두면, 실제 카페 작업이 내 PC의 브라우저(가정용 IP)에서
              실행됩니다. 웹에서 발급한 연결 토큰을 넣으면 웹에서 넣은 작업을 내 PC가 알아서
              처리합니다. PC가 켜져 있는 동안에만 처리되며, 계정/작업 데이터는 서버가 관리하고
              프로그램은 토큰만 갖습니다.
            </p>
          </div>
        </div>
      </section>

      <section className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8')}>
        <div className={cn('flex items-center gap-2')}>
          <Download className={cn('h-5 w-5 text-(--ink)')} />
          <h2 className={cn('text-lg font-semibold text-(--ink)')}>설치 가이드</h2>
        </div>

        <ol className={cn('mt-5 space-y-5')}>
          <li className={cn('flex gap-4')}>
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--accent) text-sm font-semibold text-(--background))')}>1</span>
            <div>
              <p className={cn('font-medium text-(--ink)')}>아래에서 에이전트 토큰 발급</p>
              <p className={cn('mt-1 text-sm text-(--ink-muted)')}>토큰은 발급 시 한 번만 보이니 바로 복사해 두세요.</p>
            </div>
          </li>
          <li className={cn('flex gap-4')}>
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--accent) text-sm font-semibold text-(--background))')}>2</span>
            <div className={cn('min-w-0 flex-1')}>
              <p className={cn('font-medium text-(--ink)')}>프로그램 내려받기</p>
              <div className={cn('mt-3 grid gap-2 sm:grid-cols-2')}>
                <a href={RELEASES_URL} target="_blank" rel="noreferrer" className={cn(DOWNLOAD_BUTTON_CLASS)}>
                  <Download className={cn('h-4 w-4')} />
                  macOS 다운로드
                </a>
                <a href={RELEASES_URL} target="_blank" rel="noreferrer" className={cn(DOWNLOAD_BUTTON_CLASS)}>
                  <Download className={cn('h-4 w-4')} />
                  Windows 다운로드
                </a>
              </div>
              <p className={cn('mt-2 text-xs text-(--ink-muted)')}>
                첫 설치본을 준비 중입니다. 릴리스되면 위 버튼에서 OS에 맞는 설치본을 바로 받습니다.
              </p>
              <p className={cn('mt-3 text-sm text-(--ink-muted)')}>
                개발/기술 사용자는 지금 CLI로 실행할 수 있습니다:
              </p>
              <pre className={cn('mt-2 overflow-x-auto rounded-lg bg-(--surface-muted) p-3 font-mono text-xs text-(--ink)')}>
{`# 1) 한 번만: 의존성 설치
npm install

# 2) 에이전트 실행 (토큰은 아래에서 발급)
${runCommand}`}
              </pre>
              <p className={cn('mt-2 text-xs text-(--ink-muted)')}>
                첫 실행 시 브라우저 구성요소를 자동으로 내려받은 뒤 작업을 시작합니다.
              </p>
            </div>
          </li>
          <li className={cn('flex gap-4')}>
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--accent) text-sm font-semibold text-(--background))')}>3</span>
            <div>
              <p className={cn('font-medium text-(--ink)')}>켜두면 자동 처리</p>
              <p className={cn('mt-1 text-sm text-(--ink-muted)')}>
                프로그램이 켜져 있으면 웹에서 넣은 작업을 내 PC가 순서대로 처리합니다. 종료는
                터미널에서 Ctrl+C.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-6 lg:p-8')}>
        <h2 className={cn('text-lg font-semibold text-(--ink)')}>연결 토큰</h2>
        <p className={cn('mt-1 text-sm text-(--ink-muted)')}>PC 한 대당 토큰 하나를 발급해 프로그램에 넣으세요.</p>

        <div className={cn('mt-5 flex flex-col gap-3 sm:flex-row')}>
          <Input
            label="토큰 이름"
            hideLabel
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="예: 사무실 PC, 내 노트북"
            containerClassName="flex-1"
          />
          <Button onClick={handleIssue} isLoading={isPending}>
            토큰 발급
          </Button>
        </div>

        {issuedToken && (
          <div className={cn('mt-4 rounded-xl border border-(--accent)/30 bg-(--accent)/5 p-4')}>
            <p className={cn('text-sm font-medium text-(--ink)')}>발급된 토큰 (지금만 표시됩니다)</p>
            <div className={cn('mt-2 flex items-center gap-2')}>
              <code className={cn('min-w-0 flex-1 truncate rounded-lg bg-(--surface-muted) px-3 py-2 font-mono text-xs text-(--ink)')}>
                {issuedToken}
              </code>
              <Button variant="secondary" size="sm" onClick={handleCopyToken}>
                {copied ? <Check className={cn('h-4 w-4')} /> : <Copy className={cn('h-4 w-4')} />}
              </Button>
            </div>
          </div>
        )}

        <div className={cn('mt-6 space-y-2')}>
          {tokens.length === 0 ? (
            <p className={cn('rounded-xl border border-dashed border-(--border) px-4 py-6 text-center text-sm text-(--ink-muted)')}>
              발급된 토큰이 없습니다.
            </p>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                className={cn('flex items-center justify-between gap-3 rounded-xl border border-(--border-light) bg-(--surface-muted) px-4 py-3')}
              >
                <div className={cn('min-w-0')}>
                  <div className={cn('flex items-center gap-2')}>
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isOnline(token.lastSeenAt) ? 'bg-(--success)' : 'bg-(--border)',
                      )}
                    />
                    <p className={cn('truncate text-sm font-medium text-(--ink)')}>{token.label}</p>
                  </div>
                  <p className={cn('mt-1 text-xs text-(--ink-muted)')}>
                    {isOnline(token.lastSeenAt) ? '온라인' : `마지막 접속 ${formatDate(token.lastSeenAt)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(token.id)}
                  className={cn('flex items-center gap-1 text-xs text-(--ink-muted) hover:text-(--danger)')}
                >
                  <Trash2 className={cn('h-4 w-4')} />
                  폐기
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
