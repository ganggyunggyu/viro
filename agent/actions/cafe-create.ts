import type { BrokerClient } from '../lib/broker-client';
import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';
import { CAFE_TOPIC_PRESETS, createNaverCafe } from '../../src/shared/lib/naver-cafe-creation';

export const executeCafeCreate = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'cafe-create' }>,
): Promise<unknown> => {
  const { accounts } = await broker.context();
  const account = accounts.find(({ accountId }) => accountId === action.input.ownerAccountId);
  const preset = CAFE_TOPIC_PRESETS.find(({ key }) => key === action.input.presetKey);
  if (!account) throw new Error('계정을 찾을 수 없습니다');
  if (!preset) throw new Error('카테고리 프리셋을 찾을 수 없습니다');

  const result = await createNaverCafe(
    account.accountId,
    account.password,
    {
      name: action.input.name,
      slug: action.input.slug,
      categoryMajor: preset.categoryMajor,
      categoryMinor: preset.categoryMinor,
      description: action.input.description,
      keywords: action.input.keywords,
    },
    { dryRun: false },
  );
  if (!result.success || !result.cafeId || !result.cafeUrl) {
    return { success: false, error: result.error || '카페 생성 실패' };
  }

  const synced = await broker.sync('cafe-created', {
    cafeId: result.cafeId,
    cafeUrl: result.cafeUrl,
    name: result.name || action.input.name,
    ownerAccountId: account.accountId,
    ownerNickname: account.nickname,
    presetKey: action.input.presetKey,
    slug: action.input.slug,
  });
  return {
    success: true,
    cafeId: result.cafeId,
    cafeUrl: result.cafeUrl,
    sheetSynced: Boolean(synced.sheetSynced),
  };
};

