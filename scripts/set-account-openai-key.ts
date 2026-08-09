/**
 * 계정별 OpenAI 키 일괄 등록 스크립트
 *
 * CAPTCHA_PROVIDER=openai 로 캡차를 풀려면 각 계정의 apiKeys.openai 가 채워져 있어야 한다.
 *
 * Usage:
 *   OPENAI_KEY=sk-... npx tsx --env-file=.env.local scripts/set-account-openai-key.ts
 *   OPENAI_KEY=sk-... ACCOUNT_IDS=geenl,angrykoala270 npx tsx --env-file=.env.local scripts/set-account-openai-key.ts
 */

import mongoose from 'mongoose';
import { Account } from '../src/shared/models';

const MONGODB_URI = process.env.MONGODB_URI!;
const OPENAI_KEY = process.env.OPENAI_KEY || '';
const ACCOUNT_IDS = (process.env.ACCOUNT_IDS || '').split(',').map((v) => v.trim()).filter(Boolean);

const main = async (): Promise<void> => {
  if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!OPENAI_KEY) throw new Error('OPENAI_KEY missing');

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const filter = ACCOUNT_IDS.length > 0 ? { accountId: { $in: ACCOUNT_IDS } } : {};
  const { matchedCount, modifiedCount } = await Account.updateMany(filter, {
    $set: { 'apiKeys.openai': OPENAI_KEY },
  });

  console.log(`[OPENAI-KEY] 대상 ${matchedCount}개 계정 / 갱신 ${modifiedCount}개`);

  const sample = await Account.findOne(filter).select('accountId apiKeys').lean();
  const stored = (sample as { apiKeys?: { openai?: string } } | null)?.apiKeys?.openai || '';
  console.log(`[OPENAI-KEY] 확인 샘플: ${stored ? `${stored.slice(0, 7)}...${stored.slice(-4)}` : '없음'}`);

  process.exit(0);
};

main();
