import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// 2026-07-17: bluegraywcwss/graykrurp/orangeli9xk 3개 카페에서만 ARTICLE_NOT_READY 집중 발생.
// 디버그 캡처 본문에 "카페에 가입하면 바로 글을 볼 수 있어요"가 찍혀 미가입이 원인으로 확인됨.

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  cafeUrl: string;
}

const CAFES: CafeInfo[] = [
  { cafeName: "뚜벅뚜벅1", cafeId: "31756734", cafeUrl: "bluegraywcwss" },
  { cafeName: "커피한잔술한잔", cafeId: "31756795", cafeUrl: "graykrurp" },
  { cafeName: "푸른물결우산", cafeId: "31756738", cafeUrl: "orangeli9xk" },
];

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { closeAllContexts } = await import("../src/shared/lib/multi-session");
  const { joinCafeWithNicknameRetry } = await import("../src/features/auto-comment/batch/cafe-join");

  const commenters = await Account.find({
    role: "commenter",
    isActive: true,
    excludeFromAutoComment: { $ne: true },
  }).lean();
  console.log(`활성 커멘터 ${commenters.length}명 x 카페 ${CAFES.length}개`);

  let joined = 0;
  let already = 0;
  let failed = 0;

  const runCafe = async (cafe: CafeInfo): Promise<void> => {
    console.log(`\n=== [${cafe.cafeUrl}] 시작 ===`);
    for (const acc of commenters as any[]) {
      try {
        const naverAccount = { id: acc.accountId, password: acc.password, nickname: acc.nickname };
        const result = await joinCafeWithNicknameRetry(naverAccount, cafe.cafeId, { cafeUrl: cafe.cafeUrl });
        if (result.success) {
          if (result.alreadyMember) {
            already++;
            console.log(`[${cafe.cafeUrl}] ${acc.accountId} 이미 회원`);
          } else {
            joined++;
            console.log(`[${cafe.cafeUrl}] ${acc.accountId} 신규 가입 완료`);
          }
        } else {
          failed++;
          console.log(`[${cafe.cafeUrl}] ${acc.accountId} 가입 실패: ${result.error}`);
        }
      } catch (e: any) {
        failed++;
        console.log(`[${cafe.cafeUrl}] ${acc.accountId} 오류: ${e.message}`);
      }
    }
    console.log(`=== [${cafe.cafeUrl}] 완료 ===`);
  };

  await Promise.all(CAFES.map((c) => runCafe(c)));

  console.log(`\n=== 전체 완료: 신규가입 ${joined} / 기존회원 ${already} / 실패 ${failed} ===`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
