'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Apple,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  MonitorSmartphone,
  Play,
  ShieldCheck,
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

const APP_VERSION = '0.2.0';
const MAC_DOWNLOAD_URL = '/api/download/viro/mac';
const WINDOWS_DOWNLOAD_URL = '/api/download/viro/windows';

type TargetOS = 'windows' | 'mac';

interface PlatformMeta {
  os: TargetOS;
  label: string;
  icon: typeof Apple;
  href: string;
  fileName: string;
  requirement: string;
}

const PLATFORMS: Record<TargetOS, PlatformMeta> = {
  windows: {
    os: 'windows',
    label: 'Windows',
    icon: MonitorSmartphone,
    href: WINDOWS_DOWNLOAD_URL,
    fileName: `Viro-${APP_VERSION}-setup.exe`,
    requirement: 'Windows 10 이상 · 64-bit',
  },
  mac: {
    os: 'mac',
    label: 'macOS',
    icon: Apple,
    href: MAC_DOWNLOAD_URL,
    fileName: `Viro-${APP_VERSION}-arm64.dmg`,
    requirement: 'Apple Silicon · macOS 13 이상',
  },
};

const detectOS = (): TargetOS => {
  if (typeof navigator === 'undefined') return 'windows';
  const source = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (source.includes('mac') || source.includes('iphone') || source.includes('ipad')) return 'mac';
  return 'windows';
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '접속 기록 없음';
  const date = new Date(iso);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const isOnline = (iso: string | null): boolean =>
  Boolean(iso && Date.now() - new Date(iso).getTime() < 3 * 60 * 1000);

const HIGHLIGHTS = [
  { icon: MonitorSmartphone, title: '내 PC에서 실행', detail: 'Chrome 작업이 서버가 아닌 이 컴퓨터에서 처리됩니다.' },
  { icon: ShieldCheck, title: '비밀번호 저장 없음', detail: '연결 코드 한 번이면 다음 실행부터 자동으로 준비됩니다.' },
  { icon: Download, title: '전체 기능 그대로', detail: '발행·수정·댓글·가입·노출 확인까지 창 안에서 바로.' },
];

export const AgentSetupUI = () => {
  const [label, setLabel] = useState('');
  const [issuedToken, setIssuedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokens, setTokens] = useState<AgentTokenView[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopRunning, setDesktopRunning] = useState(false);
  const [desktopLogs, setDesktopLogs] = useState<string[]>([]);
  const [primaryOS, setPrimaryOS] = useState<TargetOS>('windows');
  const [isPending, startTransition] = useTransition();

  const loadTokens = () => {
    startTransition(async () => {
      setTokens(await listAgentTokens());
    });
  };

  useEffect(() => {
    setPrimaryOS(detectOS());
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

  const primary = PLATFORMS[primaryOS];
  const secondary = PLATFORMS[primaryOS === 'windows' ? 'mac' : 'windows'];
  const PrimaryIcon = primary.icon;
  const SecondaryIcon = secondary.icon;

  return (
    <div className={cn('space-y-5')}>
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl border border-(--border-light)',
          'bg-(--surface-elevated)',
          'px-6 py-9 sm:px-10 sm:py-12',
        )}
      >
        <div className={cn('pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-(--accent-soft) opacity-60 blur-3xl')} />
        <div className={cn('relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center')}>
          <div>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-(--border-light) bg-(--surface-muted)',
                'px-3 py-1 text-xs font-medium tracking-wide text-(--ink-muted)',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full bg-(--accent)')} />
              Viro Desktop v{APP_VERSION}
            </span>

            <h2 className={cn('mt-5 text-3xl font-bold leading-[1.12] tracking-tight text-(--ink) sm:text-4xl')}>
              카페 운영 전체를<br />
              데스크톱 앱 하나로
            </h2>
            <p className={cn('mt-4 max-w-md text-sm leading-6 text-(--ink-muted) sm:text-base')}>
              발행, 수정, 댓글, 가입, 닉네임 변경, 노출 확인까지. 브라우저 작업은 서버가 아닌
              내 컴퓨터에서 안전하게 돌아갑니다.
            </p>

            {!isDesktop && (
              <div className={cn('mt-8 space-y-3')}>
                <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center')}>
                  <a
                    href={primary.href}
                    download={primary.fileName}
                    className={cn(
                      'group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-(--accent) px-6 py-3',
                      'text-sm font-semibold text-white shadow-sm transition-all',
                      'hover:-translate-y-0.5 hover:bg-(--accent-hover) focus:outline-none focus:ring-2 focus:ring-(--accent)/50',
                    )}
                  >
                    <PrimaryIcon className={cn('h-[18px] w-[18px]')} />
                    {primary.label}용 다운로드
                    <ArrowRight className={cn('h-4 w-4 transition-transform group-hover:translate-x-0.5')} />
                  </a>
                  <a
                    href={secondary.href}
                    download={secondary.fileName}
                    className={cn(
                      'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-5 py-3',
                      'text-sm font-medium text-(--ink) transition-all',
                      'hover:border-(--ink-tertiary) hover:bg-(--surface-muted) focus:outline-none focus:ring-2 focus:ring-(--accent)/40',
                    )}
                  >
                    <SecondaryIcon className={cn('h-[18px] w-[18px]')} />
                    {secondary.label}
                  </a>
                </div>
                <p className={cn('text-xs text-(--ink-tertiary)')}>
                  {primary.requirement} · 무료 · 설치 후 연결 코드 한 번이면 끝
                </p>
              </div>
            )}
          </div>

          <div className={cn('flex flex-col gap-2.5')}>
            {HIGHLIGHTS.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className={cn(
                  'flex items-start gap-3.5 rounded-2xl border border-(--border-light) bg-(--surface) px-4 py-3.5',
                )}
              >
                <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--accent-soft) text-(--accent)')}>
                  <Icon className={cn('h-[18px] w-[18px]')} />
                </span>
                <div>
                  <p className={cn('text-sm font-semibold text-(--ink)')}>{title}</p>
                  <p className={cn('mt-0.5 text-xs leading-5 text-(--ink-muted)')}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isDesktop && (
        <section className={cn('grid gap-3 sm:grid-cols-2')}>
          {(['windows', 'mac'] as const).map((os) => {
            const platform = PLATFORMS[os];
            const PlatformIcon = platform.icon;
            const isRecommended = os === primaryOS;
            return (
              <a
                key={os}
                href={platform.href}
                download={platform.fileName}
                className={cn(
                  'group flex items-center justify-between gap-4 rounded-2xl border bg-(--surface) px-5 py-4 transition-all',
                  isRecommended
                    ? 'border-(--accent)/40 shadow-sm'
                    : 'border-(--border-light) hover:border-(--border)',
                  'hover:-translate-y-0.5',
                )}
              >
                <div className={cn('flex items-center gap-3.5')}>
                  <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--surface-muted) text-(--ink)')}>
                    <PlatformIcon className={cn('h-5 w-5')} />
                  </span>
                  <div>
                    <div className={cn('flex items-center gap-2')}>
                      <p className={cn('text-sm font-semibold text-(--ink)')}>{platform.label}</p>
                      {isRecommended && (
                        <span className={cn('rounded-full bg-(--accent)/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--accent)')}>
                          내 기기
                        </span>
                      )}
                    </div>
                    <p className={cn('mt-0.5 text-xs text-(--ink-muted)')}>{platform.requirement}</p>
                  </div>
                </div>
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-(--ink-muted) transition-colors group-hover:bg-(--surface-muted) group-hover:text-(--ink)')}>
                  <Download className={cn('h-[18px] w-[18px]')} />
                </span>
              </a>
            );
          })}
        </section>
      )}

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
                  {desktopRunning ? '이 PC가 연결되어 있습니다' : '실행 준비가 필요합니다'}
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
            { step: '01', title: '다운로드', detail: '설치 파일을 받아 Viro를 설치합니다.' },
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
            placeholder="예: 사무실 PC, 내 노트북"
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
          Windows는 SmartScreen, macOS는 Gatekeeper 안내가 뜰 수 있습니다. 공증 전 버전은
          설치 파일을 우클릭한 뒤 ‘열기’를 선택하면 실행됩니다.
        </p>
      )}
    </div>
  );
};
