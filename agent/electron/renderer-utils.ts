export interface DesktopManuscript {
  folderName: string;
  title: string;
  body: string;
  htmlContent: string;
  images: string[];
  category?: string;
}

export const splitLines = (value: string): string[] => value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const parseManuscripts = (value: string): DesktopManuscript[] => value
  .split(/^---+$/m)
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => {
    const [rawTitle = '', ...bodyLines] = block.split('\n');
    const [titlePart, categoryPart] = rawTitle.split(':category=');
    const title = titlePart.trim();
    const body = bodyLines.join('\n').trim();
    const htmlContent = body
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
      .join('');
    return {
      folderName: title,
      title,
      body,
      htmlContent,
      images: [],
      ...(categoryPart?.trim() ? { category: categoryPart.trim() } : {}),
    };
  })
  .filter(({ title, body }) => Boolean(title && body));

export const parseExposureRows = (
  value: string,
): Array<{ cafeId: string; keyword: string; articleId?: number }> => splitLines(value)
  .map((line) => {
    const [cafeId = '', keyword = '', articleId] = line.split('|').map((part) => part.trim());
    const parsedArticleId = Number(articleId);
    return {
      cafeId,
      keyword,
      ...(articleId && Number.isFinite(parsedArticleId) ? { articleId: parsedArticleId } : {}),
    };
  })
  .filter(({ cafeId, keyword }) => Boolean(cafeId && keyword));

/* ---------- Result view-model ---------- */
// 각 로컬 작업이 돌려주는 result JSON을 화면용 뷰모델로 정규화한다.
// DOM은 renderer.ts가 그리고, 여기서는 순수 데이터 변환만 담당한다(테스트 대상).

export type ResultTone = 'ok' | 'warn' | 'bad' | 'neutral';

export interface ResultStat {
  label: string;
  value: string;
  tone: ResultTone;
}

export interface ResultBadge {
  label: string;
  tone: ResultTone;
}

export interface ResultItem {
  title: string;
  tone: ResultTone;
  statusLabel: string;
  detail: string;
  badges: ResultBadge[];
  link: string;
}

export interface ResultKv {
  label: string;
  value: string;
  link: string;
}

export interface ResultModel {
  empty: boolean;
  tone: ResultTone;
  statusLabel: string;
  message: string;
  error: string;
  stats: ResultStat[];
  kv: ResultKv[];
  items: ResultItem[];
  raw: string;
}

type Rec = Record<string, unknown>;

const isRecord = (value: unknown): value is Rec =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isScalar = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

const asText = (value: unknown): string => (isScalar(value) ? String(value) : '');

const isUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const firstText = (record: Rec, keys: string[]): string => {
  for (const key of keys) {
    const text = asText(record[key]).trim();
    if (text) return text;
  }
  return '';
};

const STAT_FIELDS: Array<{ key: string; label: string; tone: ResultTone }> = [
  { key: 'total', label: '전체', tone: 'neutral' },
  { key: 'totalManuscripts', label: '전체 원고', tone: 'neutral' },
  { key: 'totalArticles', label: '대상 글', tone: 'neutral' },
  { key: 'completed', label: '완료', tone: 'ok' },
  { key: 'joined', label: '가입', tone: 'ok' },
  { key: 'changed', label: '변경', tone: 'ok' },
  { key: 'exposed', label: '노출', tone: 'ok' },
  { key: 'alreadyMember', label: '이미 가입', tone: 'neutral' },
  { key: 'notExposed', label: '미노출', tone: 'warn' },
  { key: 'failed', label: '실패', tone: 'bad' },
];

const POSITIVE_KEYS = ['completed', 'joined', 'changed', 'exposed'] as const;

const KV_LABELS: Record<string, string> = {
  cafeId: '카페 ID',
  cafeUrl: '카페 주소',
  articleId: '글 번호',
  articleUrl: '글 주소',
  sheetSynced: '시트 동기화',
  nickname: '닉네임',
  accountId: '계정',
};

const CONSUMED_KEYS = new Set<string>([
  'success', 'message', 'error', 'results',
  ...STAT_FIELDS.map(({ key }) => key),
]);

const toneForStat = (tone: ResultTone, value: number): ResultTone =>
  value === 0 ? 'neutral' : tone;

const formatKvValue = (value: string | number | boolean): string => {
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  return String(value);
};

const buildStats = (record: Rec): ResultStat[] => {
  const stats: ResultStat[] = [];
  for (const { key, label, tone } of STAT_FIELDS) {
    const raw = record[key];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    stats.push({ label, value: String(raw), tone: toneForStat(tone, raw) });
  }
  return stats;
};

const buildKv = (record: Rec): ResultKv[] => {
  const rows: ResultKv[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (CONSUMED_KEYS.has(key) || !isScalar(value)) continue;
    const text = formatKvValue(value);
    if (!text) continue;
    rows.push({
      label: KV_LABELS[key] || key,
      value: text,
      link: typeof value === 'string' && isUrl(value) ? value : '',
    });
  }
  return rows;
};

const itemTone = (
  record: Rec,
): { tone: ResultTone; statusLabel: string } => {
  const status = asText(record.status).trim();
  if (status) {
    if (status === '노출') return { tone: 'ok', statusLabel: status };
    if (status === '미노출') return { tone: 'warn', statusLabel: status };
    return { tone: 'neutral', statusLabel: status };
  }
  if (record.alreadyMember === true) return { tone: 'neutral', statusLabel: '이미 가입' };
  if (record.success === true) return { tone: 'ok', statusLabel: '성공' };
  if (record.success === false) return { tone: 'bad', statusLabel: '실패' };
  return { tone: 'neutral', statusLabel: '' };
};

const buildItemBadges = (record: Rec, title: string): ResultBadge[] => {
  const badges: ResultBadge[] = [];
  const articleId = Number(record.articleId ?? record.originalArticleId ?? 0);
  if (Number.isFinite(articleId) && articleId > 0) {
    badges.push({ label: `글 #${articleId}`, tone: 'neutral' });
  }
  const accountId = asText(record.accountId).trim();
  if (accountId && accountId !== title) badges.push({ label: accountId, tone: 'neutral' });
  const cafeName = asText(record.cafeName).trim();
  if (cafeName && cafeName !== title) badges.push({ label: cafeName, tone: 'neutral' });
  const nickname = asText(record.nickname).trim();
  if (nickname && nickname !== title) badges.push({ label: `→ ${nickname}`, tone: 'neutral' });
  return badges;
};

const normalizeItem = (value: unknown): ResultItem => {
  if (!isRecord(value)) {
    return { title: asText(value) || '항목', tone: 'neutral', statusLabel: '', detail: '', badges: [], link: '' };
  }
  const title = firstText(value, [
    'title', 'newTitle', 'folderName', 'subject', 'keyword', 'cafeName', 'name', 'accountId',
  ]) || '항목';
  const { tone, statusLabel } = itemTone(value);
  return {
    title,
    tone,
    statusLabel,
    detail: asText(value.error).trim() || asText(value.message).trim(),
    badges: buildItemBadges(value, title),
    link: asText(value.articleUrl).trim() || asText(value.cafeUrl).trim(),
  };
};

const overallStatus = (
  record: Rec,
): { tone: ResultTone; statusLabel: string } => {
  const positive = POSITIVE_KEYS.reduce((sum, key) => {
    const raw = record[key];
    return sum + (typeof raw === 'number' && Number.isFinite(raw) ? raw : 0);
  }, 0);
  if (record.success === true) return { tone: 'ok', statusLabel: '완료' };
  if (record.success === false) {
    return positive > 0
      ? { tone: 'warn', statusLabel: '일부 완료' }
      : { tone: 'bad', statusLabel: '실패' };
  }
  return { tone: 'neutral', statusLabel: '결과' };
};

export const buildResultModel = (value: unknown): ResultModel => {
  const raw = (() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  })();

  const emptyModel: ResultModel = {
    empty: true, tone: 'neutral', statusLabel: '', message: '', error: '',
    stats: [], kv: [], items: [], raw,
  };

  if (value === null || value === undefined || value === '') return emptyModel;

  if (Array.isArray(value)) {
    if (value.length === 0) return emptyModel;
    return {
      empty: false,
      tone: 'neutral',
      statusLabel: `${value.length}건`,
      message: '',
      error: '',
      stats: [],
      kv: [],
      items: value.map(normalizeItem),
      raw,
    };
  }

  if (!isRecord(value)) {
    return { ...emptyModel, empty: false, statusLabel: '결과', message: asText(value) };
  }

  const { tone, statusLabel } = overallStatus(value);
  const rawResults = value.results;
  return {
    empty: false,
    tone,
    statusLabel,
    message: asText(value.message).trim(),
    error: asText(value.error).trim(),
    stats: buildStats(value),
    kv: buildKv(value),
    items: Array.isArray(rawResults) ? rawResults.map(normalizeItem) : [],
    raw,
  };
};
