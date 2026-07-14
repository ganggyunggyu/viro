import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// driveee 시도에서 계정 2개가 전부 "댓글 입력창 없음"으로 실패한 걸 보고 카페 비회원이라
// 댓글창 자체가 안 뜨는 것으로 판단 — 댓글 달기 전에 반드시 가입부터 하도록 재작성.
// (joinCafeWithAccount는 이미 가입된 경우 alreadyMember:true로 안전하게 통과시킨다)

interface Target {
  cafeSlug: string;
  cafeId?: string;
  articleId: number;
  resolveOwnerAccountId?: string; // cafeId 모를 때 조회용 계정
  comments: string[];
}

const TARGETS: Target[] = [
  {
    cafeSlug: "driveee",
    cafeId: "31746635",
    articleId: 119,
    comments: [
      "흑염소진액의 경우 몸이 찬사람에게 더 좋을까요?",
      "엄마생신선물 고민할 것 없이 여름회복을 위해 흑염소로 가봐야겠어요",
      "50대 엄마에게도 좋을 것 같아요",
      "엄마생신선물 방향성이 잡힌 것 같네요 ㅎㅎ",
      "선물 추천리스트 이런 정보 넘 좋다,",
    ],
  },
  {
    cafeSlug: "motherrr",
    articleId: 18,
    resolveOwnerAccountId: "alsrudgus531",
    comments: [
      "아내가 40대인데 올해 기력도 딸리는 것 같아서 흑염소 선물을 하려했는데 마침 좋은 정보네요",
      "아내생일선물 뭐할지 고민중이였는데 방향성이 좁혀졌네요!",
      "저희 집이 본질을 중요하게 생각해서 건강이 인생의 전부라고 생각하는데.. 흑염소진액 제품 링크 좀 받아볼 수 있을까요?",
      "올여름을 기력회복을 위해 아내랑 저 둘다 흑염소 먹어봐야겠어요",
      "이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!",
    ],
  },
];

const randomDelay = (minMs: number, maxMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, minMs + Math.random() * (maxMs - minMs)));

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const {
    getPageForAccount,
    isAccountLoggedIn,
    loginAccount,
    acquireAccountLock,
    releaseAccountLock,
    closeAllContexts,
  } = await import("../src/shared/lib/multi-session");
  const { extractCafeIdFromPage } = await import("../src/shared/lib/naver-cafe-creation");
  const { joinCafeWithNicknameRetry } = await import("../src/features/auto-comment/batch/cafe-join");
  const { writeCommentWithAccount } = await import("../src/shared/lib/naver-cafe-writing/comment-writer");

  const allCommenters = await Account.find({ role: "commenter", isActive: true })
    .lean();
  let poolCursor = 0;
  const nextAccounts = (n: number, excludeIds: Set<string>): any[] => {
    const picked: any[] = [];
    let tries = 0;
    while (picked.length < n && tries < allCommenters.length * 2) {
      const candidate = allCommenters[poolCursor % allCommenters.length];
      poolCursor++;
      tries++;
      if (!excludeIds.has(candidate.accountId) && !picked.find((p) => p.accountId === candidate.accountId)) {
        picked.push(candidate);
      }
    }
    return picked;
  };

  for (const target of TARGETS) {
    console.log(`\n=== [${target.cafeSlug}] articleId=${target.articleId} 시작 ===`);
    let cafeId = target.cafeId;

    if (!cafeId && target.resolveOwnerAccountId) {
      const ownerAcc = await Account.findOne({ accountId: target.resolveOwnerAccountId }).lean();
      if (ownerAcc) {
        await acquireAccountLock(target.resolveOwnerAccountId);
        try {
          const loggedIn = await isAccountLoggedIn(target.resolveOwnerAccountId);
          if (!loggedIn) {
            await loginAccount(target.resolveOwnerAccountId, (ownerAcc as any).password, {
              reason: `resolve_cafeid_${target.cafeSlug}`,
            });
          }
          const page = await getPageForAccount(target.resolveOwnerAccountId);
          await page.goto(`https://cafe.naver.com/${target.cafeSlug}`, { waitUntil: "domcontentloaded", timeout: 20000 });
          await page.waitForTimeout(1500);
          cafeId = await extractCafeIdFromPage(page);
        } finally {
          releaseAccountLock(target.resolveOwnerAccountId);
        }
      }
    }

    if (!cafeId) {
      console.log(`[${target.cafeSlug}] cafeId 확인 실패, 스킵`);
      continue;
    }
    console.log(`[${target.cafeSlug}] cafeId=${cafeId}`);

    const excludeIds = new Set<string>(target.resolveOwnerAccountId ? [target.resolveOwnerAccountId] : []);
    const accounts = nextAccounts(target.comments.length, excludeIds);
    console.log(`[${target.cafeSlug}] 댓글 계정 ${accounts.length}개 확보`);

    let posted = 0;
    for (let i = 0; i < target.comments.length; i++) {
      const account = accounts[i];
      const commentText = target.comments[i];
      if (!account) {
        console.log(`[${target.cafeSlug}][${i + 1}/${target.comments.length}] 계정 부족, 스킵`);
        continue;
      }

      try {
        const naverAccount = { id: account.accountId, password: account.password, nickname: account.nickname };
        const joinResult = await joinCafeWithNicknameRetry(naverAccount, cafeId, { cafeUrl: target.cafeSlug });
        if (!joinResult.success) {
          console.log(`[${target.cafeSlug}] 가입 실패 ${account.accountId}: ${joinResult.error}`);
          continue;
        }
        console.log(
          `[${target.cafeSlug}] ${account.accountId} 가입 상태: ${joinResult.alreadyMember ? "기존 회원" : "신규 가입"}`
        );

        const result = await writeCommentWithAccount(naverAccount, cafeId, target.articleId, commentText);
        console.log(`[${result.success ? "OK" : "FAIL"}][${target.cafeSlug}] ${account.accountId}: "${commentText}" ${result.error || ""}`);
        if (result.success) posted++;
        if (i < target.comments.length - 1) await randomDelay(4000, 9000);
      } catch (e: any) {
        console.log(`[ERROR][${target.cafeSlug}] ${account.accountId}: ${e.message}`);
      }
    }

    console.log(`=== [${target.cafeSlug}] 완료: ${posted}/${target.comments.length} ===`);
  }

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
