/**
 * publish-3-matjip-cafes-daily 실행에서 실패한 키워드만 카페별로 다시 발행한다.
 *
 * 사용법:
 *   npx tsx --env-file=.env.local scripts/retry-matjip-failed.ts
 */
import { connectDB } from '../src/shared/lib/mongodb';
import { User } from '../src/shared/models/user';
import { publishOneCafe } from './publish-3-matjip-cafes-daily';

const LOGIN_ID = '21lab';

const RETRY_TARGETS = [
  { cafeId: '31766236', keywords: ['동네맛집 추천'] },
  { cafeId: '31766237', keywords: ['강남맛집'] },
  { cafeId: '31766238', keywords: ['맛집 웨이팅'] },
];

const main = async () => {
  await connectDB();
  const user = await User.findOne({ loginId: LOGIN_ID }).lean();
  if (!user) throw new Error('21lab user not found');

  const total = RETRY_TARGETS.reduce((sum, t) => sum + t.keywords.length, 0);
  console.log(`재시도 대상 ${RETRY_TARGETS.length}카페 / 총 ${total}편`);
  RETRY_TARGETS.forEach(({ cafeId, keywords }) => console.log(` - ${cafeId}: ${keywords.join(', ')}`));

  const results = await Promise.all(
    RETRY_TARGETS.map(({ cafeId, keywords }) => publishOneCafe(cafeId, keywords, user.userId)),
  );

  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalFail = results.reduce((sum, r) => sum + r.fail, 0);
  console.log(`\n===== 재시도 완료: 성공 ${totalSuccess} / 실패 ${totalFail} / 총 ${total} =====`);
  results.forEach((r) => console.log(` - ${r.cafeId}: 성공 ${r.success} / 실패 ${r.fail}`));

  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
