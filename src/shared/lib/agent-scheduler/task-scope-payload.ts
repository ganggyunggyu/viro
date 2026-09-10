import { AgentManagementError } from '@/shared/lib/agent-management/contract';
import type { CafeConfig } from '@/shared/config/cafe-types';

export interface TaskAccount {
  accountId: string;
  password: string;
  nickname?: string;
  role?: 'writer' | 'commenter';
  excludeFromAutoComment?: boolean;
  isActive?: boolean;
  targetCafeIds?: string[];
}
export interface TaskContext { accounts: TaskAccount[]; cafes: CafeConfig[] }
export const denyTaskScope = (): never => { throw new AgentManagementError('작업에서 승인한 범위를 벗어났습니다', 403, 'task_scope_denied'); };
export const requireTaskScope: (condition: unknown) => asserts condition = (condition) => { if (!condition) denyTaskScope(); };
export const scopeObject = (value: unknown, fields: readonly string[]): Record<string, unknown> => {
  requireTaskScope(value && typeof value === 'object' && !Array.isArray(value));
  const body = value as Record<string, unknown>;
  requireTaskScope(Object.keys(body).every((key) => fields.includes(key)));
  return body;
};
export const isScopeText = (value: unknown, max = 200): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export const isArticleId = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
export const isDocumentId = (value: unknown): boolean => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value);
export const hasTaskAccount = ({ accounts }: TaskContext, accountId: unknown): boolean => accounts.some((account) => account.accountId === accountId);
export const taskCafe = ({ cafes }: TaskContext, cafeId: unknown): CafeConfig => {
  const cafe = cafes.find((item) => item.cafeId === cafeId);
  requireTaskScope(cafe);
  return cafe;
};
export const cafeSlug = ({ cafeUrl }: CafeConfig): string => {
  if (!cafeUrl.includes('://')) return cafeUrl.replace(/^\/|\/$/g, '');
  try { return new URL(cafeUrl).pathname.replace(/^\/|\/$/g, ''); } catch { return ''; }
};
export const isEligibleWriter = (account: TaskAccount, cafe: CafeConfig): boolean => account.role === 'writer'
  && account.isActive !== false && !account.excludeFromAutoComment
  && (!account.targetCafeIds?.length || account.targetCafeIds.includes(cafe.cafeId) || account.targetCafeIds.includes(cafeSlug(cafe)));
export const isNaverPath = (value: unknown, paths: string[]): boolean => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cafe.naver.com' && !url.port && !url.username && !url.password
      && !url.search && !url.hash && paths.some((path) => url.pathname === path || url.pathname === `${path}/`);
  } catch { return false; }
};
