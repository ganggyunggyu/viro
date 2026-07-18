import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// 2026-07-18: UI 실측 결과 bluegraywcwss(멤버부족)/graykrurp(멤버3명)에서 커멘터 대부분 미가입 확인.
// 부족 있는 카페 전체를 대상으로 전 계정 가입 시도. 카페별 순차 처리(같은 계정 3중 로그인 충돌 방지).

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  cafeUrl: string;
}

const CAFES: CafeInfo[] = [
  { cafeName: "뚜벅뚜벅1", cafeId: "31756734", cafeUrl: "bluegraywcwss" },
  { cafeName: "커피한잔술한잔", cafeId: "31756795", cafeUrl: "graykrurp" },
  { cafeName: "푸른물결우산", cafeId: "31756738", cafeUrl: "orangeli9xk" },
  { cafeName: "육아 돌봄수첩", cafeId: "31754837", cafeUrl: "babycare702" },
  { cafeName: "건강 체크노트", cafeId: "31754869", cafeUrl: "healthcheck702" },
  { cafeName: "건강 정보노트", cafeId: "31754875", cafeUrl: "healthinfo702" },
  { cafeName: "생활 살림노트", cafeId: "31754939", cafeUrl: "livingnote702" },
  { cafeName: "일상 소소담", cafeId: "31755069", cafeUrl: "dailychat702" },
  { cafeName: "짱구짱아1", cafeId: "31756619", cafeUrl: "redsgucu" },
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

  let joined = 0, already = 0, failed = 0;
  const perCafe: Record<string, { joined: number; already: number; failed: number }> = {};

  // 카페별 순차 (한 카페 내에서는 계정 순차) — 같은 계정 병렬 로그인 충돌 방지
  for (const cafe of CAFES) {
    perCafe[cafe.cafeUrl] = { joined: 0, already: 0, failed: 0 };
    console.log(`\n=== [${cafe.cafeUrl}] 시작 ===`);
    for (const acc of commenters as any[]) {
      try {
        const naverAccount = { id: acc.accountId, password: acc.password, nickname: acc.nickname };
        const result = await joinCafeWithNicknameRetry(naverAccount, cafe.cafeId, { cafeUrl: cafe.cafeUrl });
        if (result.success) {
          if (result.alreadyMember) { already++; perCafe[cafe.cafeUrl].already++; }
          else { joined++; perCafe[cafe.cafeUrl].joined++; console.log(`[${cafe.cafeUrl}] ${acc.accountId} 신규가입`); }
        } else {
          failed++; perCafe[cafe.cafeUrl].failed++;
          console.log(`[${cafe.cafeUrl}] ${acc.accountId} 실패: ${result.error}`);
        }
      } catch (e: any) {
        failed++; perCafe[cafe.cafeUrl].failed++;
        console.log(`[${cafe.cafeUrl}] ${acc.accountId} 오류: ${e.message}`);
      }
    }
    const p = perCafe[cafe.cafeUrl];
    console.log(`=== [${cafe.cafeUrl}] 완료: 신규${p.joined} 기존${p.already} 실패${p.failed} ===`);
  }

  console.log(`\n=== 전체: 신규가입 ${joined} / 기존회원 ${already} / 실패 ${failed} ===`);
  console.log("=== 카페별 요약 ===");
  for (const [url, p] of Object.entries(perCafe)) {
    console.log(`  ${url}: 신규${p.joined} 기존${p.already} 실패${p.failed} (멤버=${p.joined + p.already})`);
  }

  await closeAllContexts();
  await mongoose.disconnect();
};

main().then(() => process.exit(0)).catch(async (e) => { console.error("ERROR:", e.message); process.exit(1); });
