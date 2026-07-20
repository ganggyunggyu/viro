'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Laptop,
  Monitor,
  Play,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { cn } from '@/shared';
import { Button, Input } from '@/shared';
import { toast } from '@/shared/lib/toast';
import {
  issueAgentToken,
  listAgentTokens,
  revokeAgentToken,
  type AgentTokenView,
} from './actions';

const MAC_DOWNLOAD_URL =
  'https://github.com/ganggyunggyu/viro/releases/download/v0.2.0/Viro-0.2.0-arm64.dmg';

const formatDate = (iso: string | null): string => {
  if (!iso) return '접속 기록 없음';
  const date = new Date(iso);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const isOnline = (iso: string | null): boolean =>
  Boolean(iso && Date.now() - new Date(iso).getTime() < 3 * 60 * 1000);

export const AgentSetupUI = () => {
  const [label, setLabel] = useState('');
  const [issuedToken, setIssuedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokens, setTokens] = useState<AgentTokenView[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopRunning, setDesktopRunning] = useState(false);
  const [desktopLogs, setDesktopLogs] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const loadTokens = () => {
    startTransition(async () => {
      setTokens(await listAgentTokens());
    });
  };

  useEffect(() => {
    loadTokens();
    const desktop = window.viroDesktop;
    if (!desktop) return;

    queueMicrotask(() => setIsDesktop(true));
    void desktop.getStatus().then(({ running }) => setDesktopRunning(running));
    desktop.onStatus(({ running }) => setDesktopRunning(running));
    desktop.onLog((line) => setDesktopLogs((previous) => [...previous.slice(-49), line]));
    desktop.onSetupProgress((line) =>
      setDesktopLogs((previous) => [...previous.slice(-49), `[설치] ${line}`]),
    );
  }, []);

  const handleIssue = () => {
    startTransition(async () => {
      const result = await issueAgentToken(label);
      if (!result.success || !result.token) {
        toast.error('연결 실패', result.error);
        return;
      }
      setIssuedToken(result.token);
      setCopied(false);
      setLabel('');
      const desktop = window.viroDesktop;
      if (desktop) {
        await desktop.saveConfig({ brokerUrl: window.location.origin, token: result.token });
        await desktop.startAgent();
        toast.success('이 PC가 Viro에 연결됐습니다');
      } else {
        toast.success('연결 코드가 발급됐습니다');
      }
      setTokens(await listAgentTokens());
    });
  };

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(issuedToken);
    setCopied(true);
    toast.success('연결 코드를 복사했습니다');
  };

  const handleRevoke = (tokenId: string) => {
    startTransition(async () => {
      const result = await revokeAgentToken(tokenId);
      if (!result.success) {
        toast.error('연결 해제 실패');
        return;
      }
      toast.success('PC 연결을 해제했습니다');
      setTokens(await listAgentTokens());
    });
  };

  const handleDesktopStart = async () => {
    const started = await window.viroDesktop?.startAgent();
    if (!started && !desktopRunning) toast.error('먼저 이 PC를 연결해주세요');
  };

  const handleDesktopStop = async () => {
    await window.viroDesktop?.stopAgent();
  };

  return (
    <div className={cn('space-y-6')}>
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border border-(--border-light)',
          'bg-[linear-gradient(135deg,var(--ink)_0%,#1f2937_58%,#0f766e_145%)] px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12',
        )}
      >
        <div className={cn('absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/8 blur-2xl')} />
        <div className={cn('absolute -bottom-28 left-1/3 h-52 w-80 rounded-full bg-(--teal)/20 blur-3xl')} />
        <div className={cn('relative grid items-center gap-9 lg:grid-cols-[1fr_auto]')}>
          <div className={cn('max-w-2xl')}>
            <div className={cn('mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80')}>
              <Sparkles className={cn('h-3.5 w-3.5')} />
              Viro Desktop 0.2.0
            </div>
            <h2 className={cn('text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl')}>
              카페 운영을<br className={cn('hidden sm:block')} /> 한 프로그램에서
            </h2>
            <p className={cn('mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base')}>
              발행, 수정, 댓글, 가입, 닉네임 변경, 노출 확인까지 Viro 창에서 바로 실행하세요.
              Chrome 작업은 서버가 아닌 이 Mac에서 안전하게 처리됩니다.
            </p>

            {!isDesktop && (
              <div className={cn('mt-7 flex flex-col gap-3 sm:flex-row sm:items-center')}>
                <a
                  href={MAC_DOWNLOAD_URL}
                  className={cn(
                    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3',
                    'text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 transition-all',
                    'hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-white/70',
                  )}
                >
                  <Download className={cn('h-4 w-4')} />
                  Mac용 Viro 다운로드
                  <ArrowRight className={cn('h-4 w-4')} />
                </a>
                <span className={cn('text-xs text-white/50')}>Apple Silicon · macOS 13 이상</span>
              </div>
            )}
          </div>

          <div className={cn('grid min-w-64 gap-3 sm:grid-cols-3 lg:grid-cols-1')}>
            {[
              { icon: Monitor, title: '로컬 Chrome', detail: '내 PC에서 직접 실행' },
              { icon: ShieldCheck, title: '간편 연결', detail: '서버 비밀번호 저장 없음' },
              { icon: Laptop, title: '전체 기능', detail: '전용 데스크톱 메뉴' },
            ].map(({ icon: Icon, title, detail }) => (
              <div key={title} className={cn('flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-4 py-3 backdrop-blur-sm')}>
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white')}>
                  <Icon className={cn('h-4 w-4')} />
                </span>
                <div>
                  <p className={cn('text-sm font-semibold text-white')}>{title}</p>
                  <p className={cn('text-xs text-white/50')}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isDesktop ? (
        <section className={cn('rounded-3xl border border-(--accent)/25 bg-(--surface) p-6 lg:p-8')}>
          <div className={cn('flex flex-col justify-between gap-5 sm:flex-row sm:items-center')}>
            <div className={cn('flex items-start gap-3')}>
              <span className={cn('relative mt-1 flex h-3 w-3')}>
                {desktopRunning && <span className={cn('absolute h-full w-full animate-ping rounded-full bg-(--success) opacity-40')} />}
                <span className={cn('relative h-3 w-3 rounded-full', desktopRunning ? 'bg-(--success)' : 'bg-(--border)')} />
              </span>
              <div>
                <h3 className={cn('text-lg font-semibold text-(--ink)')}>
                  {desktopRunning ? '이 Mac이 연결되어 있습니다' : '실행 준비가 필요합니다'}
                </h3>
                <p className={cn('mt-1 text-sm text-(--ink-muted)')}>
                  {desktopRunning
                    ? 'Viro의 Chrome 작업이 이 컴퓨터에서 실행됩니다.'
                    : '아래에서 이 PC 연결을 완료한 뒤 시작하세요.'}
                </p>
              </div>
            </div>
            <div className={cn('flex gap-2')}>
              <Button onClick={handleDesktopStart} disabled={desktopRunning}>
                <Play className={cn('h-4 w-4')} />
                실행
              </Button>
              <Button variant="secondary" onClick={handleDesktopStop} disabled={!desktopRunning}>
                <Square className={cn('h-4 w-4')} />
                멈춤
              </Button>
            </div>
          </div>
          {desktopLogs.length > 0 && (
            <details className={cn('mt-5 rounded-xl border border-(--border-light) bg-(--background)')}>
              <summary className={cn('cursor-pointer px-4 py-3 text-xs font-medium text-(--ink-muted)')}>실행 로그 보기</summary>
              <pre className={cn('max-h-44 overflow-auto border-t border-(--border-light) p-4 text-xs leading-5 text-(--ink-muted)')}>
                {desktopLogs.join('\n')}
              </pre>
            </details>
          )}
        </section>
      ) : (
        <section className={cn('grid gap-3 sm:grid-cols-3')}>
          {[
            { step: '01', title: '다운로드', detail: 'DMG를 받아 Viro를 응용 프로그램에 설치합니다.' },
            { step: '02', title: '이 PC 연결', detail: 'Viro에 로그인하고 연결 버튼을 한 번 누릅니다.' },
            { step: '03', title: '바로 사용', detail: '모든 메뉴를 Viro 창에서 그대로 사용합니다.' },
          ].map(({ step, title, detail }) => (
            <div key={step} className={cn('rounded-2xl border border-(--border-light) bg-(--surface) p-5')}>
              <span className={cn('text-xs font-bold tracking-widest text-(--accent)')}>{step}</span>
              <h3 className={cn('mt-3 font-semibold text-(--ink)')}>{title}</h3>
              <p className={cn('mt-1 text-sm leading-6 text-(--ink-muted)')}>{detail}</p>
            </div>
          ))}
        </section>
      )}

      <section className={cn('rounded-3xl border border-(--border-light) bg-(--surface) p-6 lg:p-8')}>
        <div className={cn('flex flex-col justify-between gap-2 sm:flex-row sm:items-end')}>
          <div>
            <h2 className={cn('text-lg font-semibold text-(--ink)')}>이 PC 연결</h2>
            <p className={cn('mt-1 text-sm text-(--ink-muted)')}>
              처음 한 번만 연결하면 다음 실행부터 자동으로 준비됩니다.
            </p>
          </div>
          {isDesktop && desktopRunning && (
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-(--success)')}>
              <CheckCircle2 className={cn('h-4 w-4')} />
              연결 완료
            </span>
          )}
        </div>

        <div className={cn('mt-5 flex flex-col gap-3 sm:flex-row')}>
          <Input
            label="PC 이름"
            hideLabel
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="예: 내 MacBook, 사무실 iMac"
            containerClassName="flex-1"
          />
          <Button onClick={handleIssue} isLoading={isPending}>
            {isDesktop ? '이 PC 연결하기' : '연결 코드 만들기'}
          </Button>
        </div>

        {issuedToken && !isDesktop && (
          <div className={cn('mt-4 rounded-xl border border-(--accent)/25 bg-(--accent)/5 p-4')}>
            <p className={cn('text-sm font-medium text-(--ink)')}>Viro 프로그램에 아래 연결 코드를 입력하세요</p>
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

        <div className={cn('mt-6 border-t border-(--border-light) pt-5')}>
          <h3 className={cn('text-xs font-semibold uppercase tracking-wider text-(--ink-muted)')}>연결된 PC</h3>
          <div className={cn('mt-3 space-y-2')}>
            {tokens.length === 0 ? (
              <p className={cn('rounded-xl border border-dashed border-(--border) px-4 py-6 text-center text-sm text-(--ink-muted)')}>
                아직 연결된 PC가 없습니다.
              </p>
            ) : (
              tokens.map((token) => (
                <div key={token.id} className={cn('flex items-center justify-between gap-3 rounded-xl bg-(--surface-muted) px-4 py-3')}>
                  <div className={cn('min-w-0')}>
                    <div className={cn('flex items-center gap-2')}>
                      <span className={cn('h-2 w-2 rounded-full', isOnline(token.lastSeenAt) ? 'bg-(--success)' : 'bg-(--border)')} />
                      <p className={cn('truncate text-sm font-medium text-(--ink)')}>{token.label}</p>
                    </div>
                    <p className={cn('mt-1 text-xs text-(--ink-muted)')}>
                      {isOnline(token.lastSeenAt) ? '현재 온라인' : `마지막 연결 ${formatDate(token.lastSeenAt)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(token.id)}
                    className={cn('flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs text-(--ink-muted) transition-colors hover:bg-(--danger-soft) hover:text-(--danger)')}
                  >
                    <Trash2 className={cn('h-4 w-4')} />
                    연결 해제
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {!isDesktop && (
        <p className={cn('px-2 text-center text-xs leading-5 text-(--ink-muted)')}>
          첫 실행 때 로컬 Chrome 구성요소를 자동으로 설치합니다. Apple 공증 전 버전은
          Finder에서 Viro를 우클릭한 뒤 ‘열기’를 선택해야 할 수 있습니다.
        </p>
      )}
    </div>
  );
};
