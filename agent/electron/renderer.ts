import { DESKTOP_FEATURES, type DesktopFeatureId } from '../lib/desktop-feature-registry';
import {
  buildResultModel,
  parseExposureRows,
  parseManuscripts,
  splitLines,
  type ResultModel,
} from './renderer-utils';
import type {
  ViroDesktopAction,
  ViroDesktopActionResponse,
  ViroDesktopContext,
} from '../../src/shared/types/viro-desktop';

const api = window.viroDesktop;
if (!api) throw new Error('Viro 데스크톱 브리지를 불러오지 못했습니다');

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`화면 요소를 찾을 수 없습니다: ${id}`);
  return element as T;
};

const icons: Record<DesktopFeatureId, string> = {
  home: '⌂', publish: 'P', manuscript: 'M', comments: 'C', exposure: 'E',
  accounts: 'A', cafes: 'N', rewrite: 'R', logs: 'L', settings: 'S',
};

let context: ViroDesktopContext = { accounts: [], cafes: [] };
let currentFeature: DesktopFeatureId = 'home';
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const el = (tag: string, className?: string, text?: string): HTMLElement => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const externalLink = (href: string, className: string, text: string): HTMLAnchorElement => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.className = className;
  anchor.textContent = text;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer';
  return anchor;
};

const renderResultStats = (host: HTMLElement, model: ResultModel): void => {
  if (model.stats.length === 0) return;
  const stats = el('div', 'result-stats');
  for (const stat of model.stats) {
    const chip = el('div', `result-stat ${stat.tone}`);
    chip.append(el('strong', undefined, stat.value), el('span', undefined, stat.label));
    stats.append(chip);
  }
  host.append(stats);
};

const renderResultKv = (host: HTMLElement, model: ResultModel): void => {
  if (model.kv.length === 0) return;
  const list = el('dl', 'result-kv');
  for (const row of model.kv) {
    list.append(el('dt', undefined, row.label));
    const value = el('dd');
    if (row.link) value.append(externalLink(row.link, 'result-inline-link', row.value));
    else value.textContent = row.value;
    list.append(value);
  }
  host.append(list);
};

const renderResultItems = (host: HTMLElement, model: ResultModel): void => {
  if (model.items.length === 0) return;
  const list = el('ul', 'result-items');
  for (const item of model.items) {
    const row = el('li', `result-item ${item.tone}`);
    const head = el('div', 'result-item-head');
    head.append(el('span', 'result-item-title', item.title));
    if (item.statusLabel) head.append(el('span', `result-tag ${item.tone}`, item.statusLabel));
    row.append(head);
    if (item.badges.length > 0) {
      const badges = el('div', 'result-badges');
      for (const badge of item.badges) badges.append(el('span', `result-badge ${badge.tone}`, badge.label));
      row.append(badges);
    }
    if (item.detail) row.append(el('p', 'result-item-detail', item.detail));
    if (item.link) row.append(externalLink(item.link, 'result-link', '글 열기 ↗'));
    list.append(row);
  }
  host.append(list);
};

const renderResult = (id: string, value: unknown): void => {
  const host = byId<HTMLElement>(id);
  const model = buildResultModel(value);
  host.replaceChildren();

  if (model.empty) {
    host.append(el('p', 'result-empty', '결과가 없습니다.'));
    return;
  }

  const head = el('div', 'result-head');
  head.append(el('span', `result-status ${model.tone}`, model.statusLabel));
  if (model.message) head.append(el('span', 'result-message', model.message));
  host.append(head);

  if (model.error) host.append(el('p', 'result-error', model.error));

  renderResultStats(host, model);
  renderResultKv(host, model);
  renderResultItems(host, model);

  const details = document.createElement('details');
  details.className = 'result-raw';
  details.append(el('summary', undefined, '원본 데이터'), el('pre', undefined, model.raw));
  host.append(details);
};

const appendLog = (line: string): void => {
  const log = byId<HTMLPreElement>('log');
  const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  log.textContent += `[${time}] ${line}\n`;
  log.scrollTop = log.scrollHeight;
};

const showToast = (message: string, error = false): void => {
  const toast = byId<HTMLDivElement>('toast');
  toast.textContent = message;
  toast.className = `toast${error ? ' error' : ''}`;
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
};

const showResult = (id: string, value: unknown): void => {
  renderResult(id, value);
};

const setRunning = (running: boolean): void => {
  byId('status-dot').classList.toggle('on', running);
  byId('status-label').textContent = running ? '로컬 실행 중' : '로컬 실행 대기';
  byId('status-detail').textContent = running ? '새 작업을 자동으로 처리합니다' : '필요할 때 시작하세요';
  const button = byId<HTMLButtonElement>('toggle-worker');
  button.textContent = running ? '로컬 실행 정지' : '로컬 실행 시작';
  button.dataset.running = String(running);
  button.classList.toggle('primary', !running);
};

const selectFeature = (feature: DesktopFeatureId): void => {
  currentFeature = feature;
  document.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === feature);
  });
  document.querySelectorAll<HTMLButtonElement>('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.feature === feature);
  });
  const selected = DESKTOP_FEATURES.find(({ id }) => id === feature);
  byId('page-title').textContent = selected?.label || 'Viro';
};

const handleNavigation = (event: Event): void => {
  const button = event.currentTarget as HTMLButtonElement;
  selectFeature(button.dataset.feature as DesktopFeatureId);
};

const buildNavigation = (): void => {
  const navigation = byId<HTMLElement>('navigation');
  for (const feature of DESKTOP_FEATURES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `nav-item${feature.id === currentFeature ? ' active' : ''}`;
    button.dataset.feature = feature.id;
    button.dataset.icon = icons[feature.id];
    button.textContent = feature.label;
    button.addEventListener('click', handleNavigation);
    navigation.append(button);
  }
};

const handleQuickAction = (event: Event): void => {
  const button = event.currentTarget as HTMLButtonElement;
  selectFeature(button.dataset.feature as DesktopFeatureId);
};

const buildQuickActions = (): void => {
  const container = byId('quick-actions');
  for (const feature of DESKTOP_FEATURES.filter(({ localExecution }) => localExecution).slice(0, 4)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick-action';
    button.dataset.feature = feature.id;
    const title = document.createElement('strong');
    title.textContent = feature.label;
    const detail = document.createElement('span');
    detail.textContent = '이 PC의 Chrome에서 실행 →';
    button.append(title, detail);
    button.addEventListener('click', handleQuickAction);
    container.append(button);
  }
};

const populateSelect = (
  id: string,
  options: Array<{ value: string; label: string }>,
): void => {
  const select = byId<HTMLSelectElement>(id);
  const previous = select.value;
  select.replaceChildren();
  for (const optionData of options) {
    const option = document.createElement('option');
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.append(option);
  }
  if (options.some(({ value }) => value === previous)) select.value = previous;
};

const populateNicknameTarget = (): void => {
  const mode = byId<HTMLSelectElement>('nickname-mode').value;
  const options = mode === 'by-account'
    ? context.accounts.map(({ accountId, nickname }) => ({ value: accountId, label: nickname ? `${nickname} (${accountId})` : accountId }))
    : context.cafes.map(({ cafeId, name }) => ({ value: cafeId, label: `${name} (${cafeId})` }));
  populateSelect('nickname-target', options);
  byId('nickname-target-wrap').toggleAttribute('hidden', mode === 'all');
};

const populateContext = (): void => {
  const accountOptions = context.accounts.map(({ accountId, nickname }) => ({
    value: accountId,
    label: nickname ? `${nickname} (${accountId})` : accountId,
  }));
  const cafeOptions = context.cafes.map(({ cafeId, name, isDefault }) => ({
    value: cafeId,
    label: `${name}${isDefault ? ' (기본)' : ''}`,
  }));
  for (const id of ['login-account', 'exposure-account', 'cafe-owner']) populateSelect(id, accountOptions);
  for (const id of ['publish-cafe', 'manuscript-cafe']) populateSelect(id, cafeOptions);
  populateNicknameTarget();
  byId('account-count').textContent = String(context.accounts.length);
  byId('cafe-count').textContent = String(context.cafes.length);

  const choices = byId('rewrite-cafes');
  choices.replaceChildren();
  for (const cafe of context.cafes) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = cafe.cafeId;
    input.checked = true;
    const text = document.createElement('span');
    text.textContent = cafe.name;
    label.append(input, text);
    choices.append(label);
  }
};

const refreshContext = async (): Promise<void> => {
  context = await api.getContext();
  populateContext();
  byId('notice').hidden = true;
  appendLog(`[앱] 데이터 연결 완료: 계정 ${context.accounts.length}, 카페 ${context.cafes.length}`);
};

const runBusy = async (event: Event, task: () => Promise<void>): Promise<void> => {
  event.preventDefault();
  const button = (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')
    || event.currentTarget as HTMLButtonElement;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = '처리 중...';
  try {
    await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : '작업 중 오류가 발생했습니다';
    appendLog(`[오류] ${message}`);
    showToast(message, true);
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
};

const execute = async (action: ViroDesktopAction): Promise<ViroDesktopActionResponse> => {
  appendLog(`[로컬] ${action.type} 시작`);
  const response = await api.executeAction(action);
  if (!response.success) throw new Error(response.error || '로컬 작업 실패');
  appendLog(`[로컬] ${action.type} 완료`);
  return response;
};

const handleSettings = (event: Event): void => {
  void runBusy(event, async () => {
    await api.saveConfig({
      brokerUrl: byId<HTMLInputElement>('broker').value.trim().replace(/\/+$/, ''),
      token: byId<HTMLInputElement>('token').value.trim(),
    });
    await refreshContext();
    showToast('연결 정보를 저장하고 데이터 연결을 확인했습니다');
  });
};

const handleWorkerToggle = async (): Promise<void> => {
  const button = byId<HTMLButtonElement>('toggle-worker');
  if (button.dataset.running === 'true') {
    await api.stopAgent();
    showToast('현재 작업이 끝나면 로컬 실행을 멈춥니다');
  } else {
    const started = await api.startAgent();
    if (!started) showToast('연결 설정을 확인하거나 이미 실행 중인지 확인하세요', true);
  }
};

const handlePublish = (event: Event): void => {
  void runBusy(event, async () => {
    const keywords = splitLines(byId<HTMLTextAreaElement>('publish-keywords').value);
    const prepared = await api.prepare('post-content', {
      keywords,
      ref: byId<HTMLInputElement>('publish-ref').value.trim(),
      attachImages: byId<HTMLInputElement>('publish-images').checked,
    });
    const manuscripts = Array.isArray(prepared.manuscripts) ? prepared.manuscripts : [];
    if (manuscripts.length === 0) throw new Error('생성된 원고가 없습니다');
    const response = await execute({
      type: 'manual-publish',
      input: { cafeId: byId<HTMLSelectElement>('publish-cafe').value, manuscripts: manuscripts as never[] },
    });
    showResult('publish-result', response.result);
    showToast(`${manuscripts.length}개 원고의 로컬 발행을 마쳤습니다`);
  });
};

const handleManuscript = (event: Event): void => {
  void runBusy(event, async () => {
    const manuscripts = parseManuscripts(byId<HTMLTextAreaElement>('manuscript-text').value);
    if (manuscripts.length === 0) throw new Error('제목과 본문이 있는 원고를 입력하세요');
    const mode = byId<HTMLSelectElement>('manuscript-mode').value;
    const cafeId = byId<HTMLSelectElement>('manuscript-cafe').value;
    const action: ViroDesktopAction = mode === 'modify'
      ? {
          type: 'manual-modify',
          input: {
            cafeId,
            manuscripts,
            sortOrder: byId<HTMLSelectElement>('modify-sort').value as 'oldest' | 'newest' | 'random',
            daysLimit: Number(byId<HTMLInputElement>('modify-days').value) || undefined,
          },
        }
      : { type: 'manual-publish', input: { cafeId, manuscripts } };
    const response = await execute(action);
    showResult('manuscript-result', response.result);
    showToast('원고 작업을 마쳤습니다');
  });
};

const handleComment = (event: Event): void => {
  void runBusy(event, async () => {
    const urls = splitLines(byId<HTMLTextAreaElement>('comment-urls').value);
    const mode = byId<HTMLSelectElement>('comment-mode').value as 'fixed' | 'generate' | 'agent';
    const results = [];
    for (const articleUrl of urls) {
      results.push(await api.prepare('comment-job', {
        articleUrl,
        mode,
        fixedComments: splitLines(byId<HTMLTextAreaElement>('comment-fixed').value),
        generateMinCount: Number(byId<HTMLInputElement>('comment-min').value),
        generateMaxCount: Number(byId<HTMLInputElement>('comment-max').value),
        delayMinMinutes: Number(byId<HTMLInputElement>('comment-delay-min').value),
        delayMaxMinutes: Number(byId<HTMLInputElement>('comment-delay-max').value),
        deleteExisting: byId<HTMLInputElement>('comment-delete').checked,
      }));
    }
    showResult('comment-result', results);
    const status = await api.getStatus();
    if (!status.running) await api.startAgent();
    showToast(`${results.length}개 댓글 작업을 등록하고 로컬 실행을 시작했습니다`);
  });
};

const handleExposure = (event: Event): void => {
  void runBusy(event, async () => {
    const items = parseExposureRows(byId<HTMLTextAreaElement>('exposure-rows').value);
    if (items.length === 0) throw new Error('카페ID|키워드 형식으로 입력하세요');
    const response = await execute({
      type: 'exposure-check',
      accountId: byId<HTMLSelectElement>('exposure-account').value,
      items,
    });
    showResult('exposure-result', response.result);
    showToast('노출 확인을 마쳤습니다');
  });
};

const handleLogin = (event: Event): void => {
  void runBusy(event, async () => {
    const response = await execute({ type: 'account-login', accountId: byId<HTMLSelectElement>('login-account').value });
    showResult('login-result', response.result);
    showToast('로그인 점검을 마쳤습니다');
  });
};

const handleJoin = (event: Event): void => {
  void runBusy(event, async () => {
    const response = await execute({ type: 'cafe-join-all' });
    showResult('cafe-result', response.result);
    showToast('전체 카페 가입 점검을 마쳤습니다');
  });
};

const handleNickname = (event: Event): void => {
  void runBusy(event, async () => {
    const mode = byId<HTMLSelectElement>('nickname-mode').value as 'by-cafe' | 'by-account' | 'all';
    const target = byId<HTMLSelectElement>('nickname-target').value;
    const response = await execute({
      type: 'nickname-change',
      mode,
      ...(mode === 'by-cafe' ? { cafeId: target } : {}),
      ...(mode === 'by-account' ? { accountId: target } : {}),
    });
    showResult('cafe-result', response.result);
    showToast('닉네임 작업을 마쳤습니다');
  });
};

const handleCafeCreate = (event: Event): void => {
  void runBusy(event, async () => {
    const response = await execute({
      type: 'cafe-create',
      input: {
        ownerAccountId: byId<HTMLSelectElement>('cafe-owner').value,
        name: byId<HTMLInputElement>('cafe-name').value.trim(),
        slug: byId<HTMLInputElement>('cafe-slug').value.trim(),
        presetKey: byId<HTMLSelectElement>('cafe-preset').value,
        description: byId<HTMLTextAreaElement>('cafe-description').value.trim(),
        keywords: byId<HTMLInputElement>('cafe-keywords').value.split(',').map((value) => value.trim()).filter(Boolean),
      },
    });
    showResult('cafe-result', response.result);
    await refreshContext();
    showToast('카페 만들기 작업을 마쳤습니다');
  });
};

const handleRewrite = (event: Event): void => {
  void runBusy(event, async () => {
    const cafeIds = Array.from(document.querySelectorAll<HTMLInputElement>('#rewrite-cafes input:checked')).map(({ value }) => value);
    const keywordSource = byId<HTMLSelectElement>('rewrite-source').value as 'pool' | 'custom';
    const response = await execute({
      type: 'rewrite',
      input: {
        cafeIds,
        dateFrom: byId<HTMLInputElement>('rewrite-from').value,
        dateTo: byId<HTMLInputElement>('rewrite-to').value,
        keywordSource,
        customKeywords: splitLines(byId<HTMLTextAreaElement>('rewrite-keywords').value),
      },
    });
    showResult('rewrite-result', response.result);
    showToast('재작성 작업을 마쳤습니다');
  });
};

const handleManuscriptMode = (): void => {
  byId('modify-options').toggleAttribute('hidden', byId<HTMLSelectElement>('manuscript-mode').value !== 'modify');
};

const handleCommentMode = (): void => {
  const mode = byId<HTMLSelectElement>('comment-mode').value;
  byId('comment-fixed-wrap').toggleAttribute('hidden', mode !== 'fixed');
  byId('comment-generate').toggleAttribute('hidden', mode !== 'generate');
};

const handleRewriteSource = (): void => {
  byId('rewrite-keywords-wrap').toggleAttribute('hidden', byId<HTMLSelectElement>('rewrite-source').value !== 'custom');
};

const initializeDates = (): void => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 7);
  byId<HTMLInputElement>('rewrite-to').value = today.toISOString().slice(0, 10);
  byId<HTMLInputElement>('rewrite-from').value = start.toISOString().slice(0, 10);
};

const initialize = async (): Promise<void> => {
  buildNavigation();
  buildQuickActions();
  initializeDates();
  const config = await api.getConfig();
  byId<HTMLInputElement>('broker').value = config.brokerUrl || '';
  byId<HTMLInputElement>('token').value = config.token || '';
  const status = await api.getStatus();
  setRunning(status.running);
  if (config.token) {
    try {
      await refreshContext();
    } catch (error) {
      const message = error instanceof Error ? error.message : '데이터 서버에 연결하지 못했습니다';
      const notice = byId('notice');
      notice.textContent = `앱 화면은 정상입니다. 데이터 연결만 확인하세요: ${message}`;
      notice.hidden = false;
      appendLog(`[연결 오류] ${message}`);
    }
  } else {
    const notice = byId('notice');
    notice.textContent = '연결 설정에서 데이터 서버와 토큰을 저장하면 모든 기능을 사용할 수 있습니다.';
    notice.hidden = false;
    selectFeature('settings');
  }
};

api.onLog(appendLog);
api.onSetupProgress((line) => appendLog(`[브라우저 설치] ${line}`));
api.onStatus(({ running }) => setRunning(running));
byId('settings-form').addEventListener('submit', handleSettings);
byId('toggle-worker').addEventListener('click', () => { void handleWorkerToggle(); });
byId('refresh-context').addEventListener('click', () => { void refreshContext().catch((error: unknown) => showToast(error instanceof Error ? error.message : '연결 실패', true)); });
byId('publish-form').addEventListener('submit', handlePublish);
byId('manuscript-form').addEventListener('submit', handleManuscript);
byId('comment-form').addEventListener('submit', handleComment);
byId('exposure-form').addEventListener('submit', handleExposure);
byId('login-form').addEventListener('submit', handleLogin);
byId('join-form').addEventListener('submit', handleJoin);
byId('nickname-form').addEventListener('submit', handleNickname);
byId('cafe-create-form').addEventListener('submit', handleCafeCreate);
byId('rewrite-form').addEventListener('submit', handleRewrite);
byId('manuscript-mode').addEventListener('change', handleManuscriptMode);
byId('comment-mode').addEventListener('change', handleCommentMode);
byId('nickname-mode').addEventListener('change', populateNicknameTarget);
byId('rewrite-source').addEventListener('change', handleRewriteSource);
byId('clear-log').addEventListener('click', () => { byId('log').textContent = ''; });

void initialize();
