'use server';

/**
 * 카페 "개설(생성)" 기능의 UI 진입점. 실제 자동화 로직은 전부
 * shared/lib/naver-cafe-creation 에 있고, 여기서는 로그인 유저 컨텍스트를 붙여서
 * Server Action 형태로만 감싼다 — 로직을 이 파일에 새로 쓰지 말 것.
 */
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/shared/lib/mongodb';
import { Account } from '@/shared/models/account';
import { getCurrentUserId } from '@/shared/config/user';
import {
  createNaverCafe,
  registerCreatedCafeInDb,
  getAvailableOwnerAccounts,
  CAFE_TOPIC_PRESETS,
  type CreateCafeInput,
} from '@/shared/lib/naver-cafe-creation';
import { syncCafeToOperationsSheet } from '@/shared/lib/naver-cafe-creation/sheet-sync';

export interface CafeCreateOwnerOption {
  accountId: string;
  nickname: string;
  role?: string;
}

export interface CafeCreateFormData {
  owners: CafeCreateOwnerOption[];
  presets: typeof CAFE_TOPIC_PRESETS;
}

/** UI 폼을 채우는 데 필요한 데이터: 아직 카페 없는 계정 목록 + 카테고리 프리셋 */
export const getCafeCreateFormDataAction = async (): Promise<CafeCreateFormData> => {
  await connectDB();
  const userId = await getCurrentUserId();
  const owners = await getAvailableOwnerAccounts(userId);
  return { owners, presets: CAFE_TOPIC_PRESETS };
};

export interface CafeCreateInput {
  ownerAccountId: string;
  name: string;
  slug: string;
  presetKey: string;
  description: string;
  keywords: string[];
}

export interface CafeCreateActionResult {
  success: boolean;
  cafeUrl?: string;
  cafeId?: string;
  error?: string;
  sheetSynced?: boolean;
}

export const createCafeAction = async (input: CafeCreateInput): Promise<CafeCreateActionResult> => {
  await connectDB();

  const preset = CAFE_TOPIC_PRESETS.find((p) => p.key === input.presetKey);
  if (!preset) {
    return { success: false, error: '알 수 없는 카테고리 프리셋: ' + input.presetKey };
  }

  const account = await Account.findOne({ accountId: input.ownerAccountId }).lean();
  if (!account) {
    return { success: false, error: '계정을 찾을 수 없음: ' + input.ownerAccountId };
  }

  const createInput: CreateCafeInput = {
    name: input.name,
    slug: input.slug,
    categoryMajor: preset.categoryMajor,
    categoryMinor: preset.categoryMinor,
    description: input.description,
    keywords: input.keywords,
  };

  const result = await createNaverCafe(input.ownerAccountId, account.password, createInput, {
    dryRun: false,
  });

  if (!result.success || !result.cafeId || !result.cafeUrl) {
    return { success: false, error: result.error || '카페 생성 실패' };
  }

  const userId = await getCurrentUserId();
  await registerCreatedCafeInDb(
    userId,
    { cafeId: result.cafeId, cafeUrl: result.cafeUrl, name: result.name || input.name },
    { ownerAccountId: input.ownerAccountId },
  );

  const sheetResult = await syncCafeToOperationsSheet({
    category: preset.sheetCategory,
    name: result.name || input.name,
    cafeId: result.cafeId,
    slug: input.slug,
    ownerAccountId: input.ownerAccountId,
    ownerNickname: account.nickname || input.ownerAccountId,
    memberCount: 1,
  });

  revalidatePath('/cafe-create');
  revalidatePath('/accounts');

  return {
    success: true,
    cafeUrl: result.cafeUrl,
    cafeId: result.cafeId,
    sheetSynced: sheetResult.cafeInfoAdded,
  };
};
