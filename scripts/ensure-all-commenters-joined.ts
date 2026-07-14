import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// healthcheck702/articleId=4에서 커먼터 5개 계정이 "댓글 입력창을 찾을 수 없습니다"로 실패한 원인이
// 카페 미가입으로 확인됨(가입 버튼 노출=true). 같은 문제가 다른 캠페인 카페에서도 조용히 발생할 수
// 있어 활성 커먼터 전원을 5개 캠페인 카페 전부에 가입시킨다(이미 가입된 계정은 alreadyMember로
// 안전하게 스킵됨).

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  cafeUrl: string;
}

const CAFES: CafeInfo[] = [
  { cafeName: "육아 돌봄수첩", cafeId: "31754837", cafeUrl: "babycare702" },
  { cafeName: "건강 체크노트", cafeId: "31754869", cafeUrl: "healthcheck702" },
  { cafeName: "건강 정보노트", cafeId: "31754875", cafeUrl: "healthinfo702" },
  { cafeName: "생활 살림노트", cafeId: "31754939", cafeUrl: "livingnote702" },
  { cafeName: "일상 소소담", cafeId: "31755069", cafeUrl: "dailychat702" },
];

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { closeAllContexts } = await import("../src/shared/lib/multi-session");
  const { joinCafeWithNicknameRetry } = await import("../src/features/auto-comment/batch/cafe-join");

  const commenters = await Account.find({ role: "commenter", isActive: true }).lean();
  console.log(`활성 커먼터 ${commenters.length}명 x 카페 ${CAFES.length}개`);

  let joined = 0;
  let already = 0;
  let failed = 0;

  const runCafe = async (cafe: CafeInfo): Promise<void> => {
    console.log(`\n=== [${cafe.cafeName}] 가입 확인 시작 ===`);
    for (const acc of commenters as any[]) {
      try {
        const naverAccount = { id: acc.accountId, password: acc.password, nickname: acc.nickname };
        const result = await joinCafeWithNicknameRetry(naverAccount, cafe.cafeId, { cafeUrl: cafe.cafeUrl });
        if (result.success) {
          if (result.alreadyMember) {
            already++;
          } else {
            joined++;
            console.log(`[${cafe.cafeName}] ${acc.accountId} 신규 가입 완료 (닉네임: ${result.finalNickname || acc.nickname})`);
          }
        } else {
          failed++;
          console.log(`[${cafe.cafeName}] ${acc.accountId} 가입 실패: ${result.error}`);
        }
      } catch (e: any) {
        failed++;
        console.log(`[${cafe.cafeName}] ${acc.accountId} 오류: ${e.message}`);
      }
    }
    console.log(`=== [${cafe.cafeName}] 완료 ===`);
  };

  // 카페마다 별개 계정 세션 락이라 병렬 처리
  await Promise.all(CAFES.map((c) => runCafe(c)));

  console.log(`\n=== 전체 완료: 신규가입 ${joined} / 기존회원 ${already} / 실패 ${failed} ===`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    try {
      await closeAllContexts();
    } catch {}
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
