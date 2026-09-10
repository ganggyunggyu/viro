import { CAFE_TOPIC_PRESETS } from '@/shared/lib/naver-cafe-creation/presets';

const text = { type: 'string', minLength: 1 };
const object = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const list = (items: unknown, maxItems = 100) => ({ type: 'array', minItems: 1, maxItems, items });
const manuscript = object({ folderName: { ...text, maxLength: 200 }, title: { ...text, maxLength: 200 }, htmlContent: { ...text, maxLength: 20000 }, body: { type: 'string', maxLength: 20000 }, images: { type: 'array', maxItems: 0 }, category: { ...text, maxLength: 100 } }, ['folderName', 'title', 'htmlContent']);
const definitions = [
  { id: 'account-login', label: '계정 로그인 확인', properties: { accountId: text } },
  { id: 'cafe-join-all', label: '등록한 모든 계정으로 모든 카페 가입', properties: {} },
  { id: 'nickname-change', label: '카페 별명 변경', properties: { mode: { enum: ['by-cafe', 'by-account', 'all'] }, accountId: text, cafeId: text }, required: ['mode'], note: 'by-cafe는 cafeId, by-account는 accountId 필수. all은 대상 ID 없이 등록한 전체 범위를 사용한다.' },
  { id: 'exposure-check', label: '카페 글 노출 확인', properties: { accountId: text, items: list(object({ cafeId: text, keyword: { ...text, maxLength: 200 }, articleId: { type: 'integer', minimum: 1 } }, ['cafeId', 'keyword'])) } },
  { id: 'cafe-create', label: '새 카페 개설', properties: { input: object({ ownerAccountId: text, name: { ...text, maxLength: 100 }, slug: { ...text, pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$' }, presetKey: { enum: CAFE_TOPIC_PRESETS.map(({ key }) => key) }, description: { ...text, maxLength: 1000 }, keywords: list({ ...text, maxLength: 100 }, 10) }) } },
  { id: 'manual-publish', label: '카페 원고 발행', properties: { input: object({ cafeId: text, manuscripts: list(manuscript, 20) }) } },
  { id: 'manual-modify', label: '카페 발행 원고 수정', properties: { input: object({ cafeId: text, manuscripts: list(manuscript, 20), daysLimit: { type: 'integer', minimum: 1, maximum: 365, default: 30 }, sortOrder: { enum: ['oldest', 'newest', 'random'], default: 'oldest' } }, ['cafeId', 'manuscripts']) } },
  { id: 'rewrite', label: '기간 내 카페 글 재작성', properties: { input: object({ cafeIds: list(text, 20), dateFrom: { ...text, format: 'date' }, dateTo: { ...text, format: 'date' }, keywordSource: { enum: ['pool', 'custom'] }, customKeywords: list({ ...text, maxLength: 200 }) }, ['cafeIds', 'dateFrom', 'dateTo', 'keywordSource']) }, note: 'custom은 customKeywords 필수. 시작일은 종료일 이전이어야 한다.' },
];

export const actionCapabilities = definitions.map(({ id, label, properties, required, note }) => ({
  id, label, description: label, method: 'POST', path: '/api/agent/actions',
  inputSchema: object({ type: { const: id }, ...properties }, ['type', ...(required ?? Object.keys(properties))]),
  inputLocation: 'body', note, tool: 'viro_manage', toolArguments: { action: 'execute_action' },
  approvalRequired: true, workerRequired: true, workerStatusField: 'actionWorkerOnline',
  idempotencyHeader: 'Idempotency-Key', sideEffects: id === 'exposure-check' ? ['crawl', 'save-results'] : ['naver-write'],
  result: { method: 'GET', path: '/api/agent/actions', query: { id: 'task.id' }, acceptanceIsCompletion: false,
    states: ['pending', 'running', 'done', 'failed', 'needs_review'] },
  limitations: ['원격 원고 이미지 업로드는 아직 지원하지 않는다.', '실패 또는 needs_review는 실제 결과 확인 전 재실행하지 않는다.'],
}));
