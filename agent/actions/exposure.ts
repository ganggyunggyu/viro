import type { BrokerClient } from '../lib/broker-client';
import type { ViroDesktopAction } from '../../src/shared/types/viro-desktop';
import { checkArticleExposure } from '../../src/shared/lib/exposure-check';
import { sleep } from './shared';

export const executeExposureCheck = async (
  broker: BrokerClient,
  action: Extract<ViroDesktopAction, { type: 'exposure-check' }>,
): Promise<unknown> => {
  const { accounts, cafes } = await broker.context();
  if (!accounts.some(({ accountId }) => accountId === action.accountId)) {
    throw new Error('노출 확인 계정을 찾을 수 없습니다');
  }

  const results = [];
  for (const item of action.items) {
    const cafe = cafes.find(({ cafeId }) => cafeId === item.cafeId);
    const checked = await checkArticleExposure({
      cafeId: item.cafeId,
      cafeUrl: cafe?.cafeUrl,
      cafeName: cafe?.name,
      keyword: item.keyword,
      accountId: action.accountId,
    });
    const row = { ...item, cafeName: cafe?.name || item.cafeId, ...checked };
    results.push(row);
    await broker.sync('exposure', row);
    await sleep(1500);
  }

  const exposed = results.filter(({ status }) => status === '노출').length;
  const notExposed = results.filter(({ status }) => status === '미노출').length;
  const failed = results.length - exposed - notExposed;
  return {
    success: results.length > 0 && failed === 0,
    total: results.length,
    exposed,
    notExposed,
    failed,
    results,
    message: `${results.length}건 확인 완료 (노출 ${exposed} / 미노출 ${notExposed} / 확인실패 ${failed})`,
  };
};

