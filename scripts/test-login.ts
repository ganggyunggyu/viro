import 'dotenv/config';
import mongoose from 'mongoose';
import { loginAccount, invalidateLoginCache } from '@/shared/lib/multi-session';
import { Account } from '@/shared/models/account';

const TARGET = process.argv[2] || 'olgdmp9921';

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });
  const acc = await Account.findOne({ accountId: TARGET }).lean();
  if (!acc) {
    console.log(`[TEST] 계정 없음: ${TARGET}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  invalidateLoginCache(TARGET);
  console.log(`[TEST] ${TARGET} 로그인 시도 (캡차 솔버: gemini-2.5-flash)`);
  const result = await loginAccount(TARGET, (acc as any).password);
  if (result.success) {
    console.log('[TEST] ✅ 로그인 성공');
  } else {
    console.log(`[TEST] ❌ 로그인 실패: ${result.error}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
