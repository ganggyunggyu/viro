import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

// 민경현 팀장이 카톡으로 순차 전달한 8개 글(일부는 이 세션에서 이미 부분 처리됨, 일부는 같은
// articleId에 문구가 수정된 세트가 나중에 다시 옴)을 전부 순회해서 라이브 댓글 상태를 확인하고,
// 5개에 모자라면 아직 안 달린 문구부터 채운다. 이미 5개 이상이면 그대로 두고 중복 게시하지 않는다.

interface Target {
  cafeSlug: string;
  cafeId: string;
  articleId: number;
  candidates: string[]; // 이 글에 대해 요청된 문구들(수정본 있으면 둘 다 후보로 포함, 중복 게시는 방지)
}

const TARGETS: Target[] = [
  {
    cafeSlug: "driveee",
    cafeId: "31746635",
    articleId: 112,
    candidates: [
      "아빠환갑선물 공유해주셔서 감사해요!",
      "아빠환갑선물 뭐할지 고민중이였는데 좋은 정보  너무 좋네요",
      "아빠가 건강을 많이 생각해서 뭘 드려야할지.. 흑염소진액 제품 추천 좀 받아볼 수 있을까요?",
      "기력회복으로 흑염소 드려봐야겠어용",
      "이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!",
    ],
  },
  {
    cafeSlug: "motherrr",
    cafeId: "31751094",
    articleId: 12,
    candidates: [
      "아빠환갑선물 고민중이였는데 방향성 잘 잡힌 것 같아요 감사해요",
      "좋은정보 잘 봤어요~",
      "여름철이기도하니 흑염소진액 드려보려하는데 링크 받아볼 수 있을까요?",
      "전부 국내산 제품인건지 정보받아볼 수 있을까요?",
      "아부지 환갑선물 정보 잘 받아갑니다, 내용 공유해주셔서 감사해요!",
    ],
  },
  {
    cafeSlug: "driveee",
    cafeId: "31746635",
    articleId: 116,
    candidates: [
      "40대엄마 생신선물 추천 리스트 공유해주셔서 감사해요!",
      "엄마생신선물 뭐할지 고민중이였는데 좋은 정보  너무 좋네요",
      "엄마가 건강을 많이 생각해서 뭘 드려야할지.. 흑염소진액 제품 추천 좀 받아볼 수 있을까요?",
      "올여름을 기력회복을 위해 어머님께 흑염소 드려봐야겠어용",
      "이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!",
    ],
  },
  {
    cafeSlug: "healthhhh",
    cafeId: "31746910",
    articleId: 114,
    candidates: [
      "흑염소진액의 경우 몸이 찬사람에게 더 좋을까요?",
      "엄마생신선물 고민할 것 없이 여름회복을 위해 흑염소로 가봐야겠어요",
      "50대 엄마에게도 좋을 것 같아요",
      "엄마생신선물 방향성이 잡힌 것 같네요 ㅎㅎ",
      "선물 추천리스트 이런 정보 넘 좋다,",
    ],
  },
  {
    // 같은 articleId=116에 10:04(와이프생일선물), 10:07(아내생일선물) 두 세트가 왔음 —
    // 둘 다 후보로 넣고 5개가 될 때까지만 채운다(중복/과다게시 방지).
    cafeSlug: "healthhhh",
    cafeId: "31746910",
    articleId: 116,
    candidates: [
      "선물 추천 리스트 공유해주셔서 감사해요!",
      "아내생일선물 뭐할지 고민중이였는데 좋은 정보  너무 좋네요",
      "아내가 건강을 많이 생각해서 뭘 드려야할지.. 흑염소진액 제품 추천 좀 받아볼 수 있을까요?",
      "올여름을 기력회복을 위해 아내랑 저 둘다 흑염소 먹어봐야겠어요",
      "이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!",
      "흑염소진액의 경우 몸이 찬사람에게 더 좋을까요?",
      "최근출산한 아내에게 고민할 것 없이 여름기력회복을 위해 흑염소로 가봐야겠어요",
      "아내랑 저랑 같이 먹어봐도 좋을 것 같네요",
      "방향성이 잡힌 것 같네요 ㅎㅎ",
      "선물 추천리스트 이런 정보 넘 좋다,",
    ],
  },
  {
    cafeSlug: "driveee",
    cafeId: "31746635",
    articleId: 117,
    candidates: [
      "흑염소는 몸이 찬사람에게 더 좋을까요?",
      "우리 둘째 출산한 아내에게 딱이다!",
      "아내랑 저랑 같이 먹어봐도 좋을 것 같네요 ㅎㅎ",
      "아내에게 이번에 점수 한번 따봅니다!",
      "선물 추천리스트 이런 정보 넘 좋다,",
    ],
  },
  {
    // 이번 세션에서 이미 3/5 처리됨 — 모자란 것만 채움
    cafeSlug: "motherrr",
    cafeId: "31751094",
    articleId: 18,
    candidates: [
      "아내가 40대인데 올해 기력도 딸리는 것 같아서 흑염소 선물을 하려했는데 마침 좋은 정보네요",
      "아내생일선물 뭐할지 고민중이였는데 방향성이 좁혀졌네요!",
      "저희 집이 본질을 중요하게 생각해서 건강이 인생의 전부라고 생각하는데.. 흑염소진액 제품 링크 좀 받아볼 수 있을까요?",
      "올여름을 기력회복을 위해 아내랑 저 둘다 흑염소 먹어봐야겠어요",
      "이래저래 고민중이였는데 방향성이 좁혀진 것 같아요 좋은 정보 감사합니다!",
    ],
  },
  {
    // 이미 4/5 처리됨 + 오후 1:51에 문구 일부 수정본이 재전달됨 — 둘 다 후보, 5개까지만 채움
    cafeSlug: "driveee",
    cafeId: "31746635",
    articleId: 119,
    candidates: [
      "흑염소진액의 경우 몸이 찬사람에게 더 좋을까요?",
      "엄마생신선물 고민할 것 없이 여름회복을 위해 흑염소로 가봐야겠어요",
      "50대 엄마에게도 좋을 것 같아요",
      "엄마생신선물 방향성이 잡힌 것 같네요 ㅎㅎ",
      "선물 추천리스트 이런 정보 넘 좋다,",
      "흑염소진액의 경우 손발이 찬사람에게 더 좋을까요?",
      "50대 엄마 생신선물 고민할 것 없이 여름회복을 위해 흑염소로 가봐야겠어요",
      "40대 와이프에게도 딱이네요!",
    ],
  },
];

const TARGET_COUNT = 5;

const contentAlreadyLive = (liveContents: string[], candidate: string): boolean => {
  const norm = (s: string): string => s.replace(/\s+/g, "").trim();
  const c = norm(candidate);
  return liveContents.some((live) => {
    const l = norm(live);
    return l.includes(c) || c.includes(l);
  });
};

const randomDelay = (minMs: number, maxMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, minMs + Math.random() * (maxMs - minMs)));

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { closeAllContexts } = await import("../src/shared/lib/multi-session");
  const { listLiveComments } = await import("../src/shared/lib/naver-cafe-writing/comment-deleter");
  const { joinCafeWithNicknameRetry } = await import("../src/features/auto-comment/batch/cafe-join");
  const { writeCommentWithAccount } = await import("../src/shared/lib/naver-cafe-writing/comment-writer");

  const allCommenters = await Account.find({ role: "commenter", isActive: true }).lean();
  let poolCursor = 0;
  const nextAccount = (excludeIds: Set<string>): any | null => {
    let tries = 0;
    while (tries < allCommenters.length * 2) {
      const candidate = allCommenters[poolCursor % allCommenters.length];
      poolCursor++;
      tries++;
      if (!excludeIds.has(candidate.accountId)) return candidate;
    }
    return null;
  };

  const usedThisRun = new Set<string>();

  const runTarget = async (target: Target): Promise<void> => {
    const { cafeSlug, cafeId, articleId, candidates } = target;
    console.log(`\n=== [${cafeSlug}/${articleId}] 확인 시작 ===`);

    // 조회용 계정으로 임의의 커뮤터 하나 사용(오너 계정 불필요, listLiveComments는 로그인만 되어있으면 됨)
    const lookupAccount = allCommenters[Math.floor(Math.random() * allCommenters.length)];
    const owner = { id: lookupAccount.accountId, password: lookupAccount.password };

    const listResult = await listLiveComments(owner, cafeId, articleId);
    if (!listResult.success) {
      console.log(`[${cafeSlug}/${articleId}] 댓글 조회 실패: ${listResult.error}`);
      return;
    }
    const liveContents = (listResult.comments || []).map((c) => c.content);
    console.log(`[${cafeSlug}/${articleId}] 현재 댓글 ${liveContents.length}개`);

    if (liveContents.length >= TARGET_COUNT) {
      console.log(`[${cafeSlug}/${articleId}] 이미 ${TARGET_COUNT}개 이상 — 스킵`);
      return;
    }

    const missing = candidates.filter((c) => !contentAlreadyLive(liveContents, c));
    const needed = TARGET_COUNT - liveContents.length;
    const toPost = missing.slice(0, needed);
    console.log(`[${cafeSlug}/${articleId}] 부족 ${needed}개, 게시할 후보 ${toPost.length}개`);

    let posted = 0;
    for (const commentText of toPost) {
      const account = nextAccount(usedThisRun);
      if (!account) {
        console.log(`[${cafeSlug}/${articleId}] 계정 풀 소진`);
        break;
      }
      usedThisRun.add(account.accountId);

      try {
        const naverAccount = { id: account.accountId, password: account.password, nickname: account.nickname };
        const joinResult = await joinCafeWithNicknameRetry(naverAccount, cafeId, { cafeUrl: cafeSlug });
        if (!joinResult.success) {
          console.log(`[${cafeSlug}/${articleId}] 가입 실패 ${account.accountId}: ${joinResult.error}`);
          continue;
        }
        const result = await writeCommentWithAccount(naverAccount, cafeId, articleId, commentText);
        console.log(
          `[${result.success ? "OK" : "FAIL"}][${cafeSlug}/${articleId}] ${account.accountId}: "${commentText}" ${result.error || ""}`
        );
        if (result.success) posted++;
        await randomDelay(4000, 9000);
      } catch (e: any) {
        console.log(`[ERROR][${cafeSlug}/${articleId}] ${account.accountId}: ${e.message}`);
      }
    }
    console.log(`=== [${cafeSlug}/${articleId}] 완료: ${posted}개 추가 게시 ===`);
  };

  // 서로 다른 계정을 쓰는 독립적인 글들이라 병렬로 처리
  await Promise.all(TARGETS.map((t) => runTarget(t)));

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
