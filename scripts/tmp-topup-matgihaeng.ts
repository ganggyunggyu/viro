import { connectDB } from '../src/shared/lib/mongodb';
import { User } from '../src/shared/models/user';
import { publishOneCafe } from './publish-3-matjip-cafes-daily';

const CAFE_ID = '31766238'; // 맛집 맛기행
const KEYWORDS = ['홍대맛집', '부산맛집']; // 오늘 목표 3편 중 부족했던 2편

const main = async () => {
  await connectDB();
  const user = await User.findOne({ loginId: '21lab' }).lean();
  if (!user) throw new Error('21lab user not found');

  const result = await publishOneCafe(CAFE_ID, KEYWORDS, user.userId);
  console.log(`\n===== 맛기행 부족분 보충 완료: 성공 ${result.success} / 실패 ${result.fail} =====`);
  process.exit(0);
};

main().catch((e) => {
  console.error('FATAL:', e instanceof Error ? e.message : e);
  process.exit(1);
});
