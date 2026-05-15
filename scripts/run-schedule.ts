/**
 * 스케줄 큐 추가 스크립트
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/run-schedule.ts
 */

import mongoose from "mongoose";
import { User } from "../src/shared/models/user";
import { Account } from "../src/shared/models/account";
import { Cafe } from "../src/shared/models/cafe";
import { addTaskJob } from "../src/shared/lib/queue";
import { generateViralContent } from "../src/shared/api/content-api";
import { buildViralPrompt } from "../src/features/viral/viral-prompt";
import { buildOwnKeywordPrompt } from "../src/features/viral/prompts/build-own-keyword-prompt";
import { buildCompetitorKeywordPrompt } from "../src/features/viral/prompts/build-competitor-keyword-prompt";
import { buildCompetitorAdvocacyPrompt } from "../src/features/viral/prompts/build-competitor-advocacy-prompt";
import { buildShortDailyPrompt } from "../src/features/viral/prompts/build-short-daily-prompt";
import { getViralContentStyleForLoginId } from "../src/shared/config/user-profile";
import { parseViralResponse } from "../src/features/viral/viral-parser";
import type {
  PostJobData,
  ViralCommentsData,
} from "../src/shared/lib/queue/types";

const MONGODB_URI = process.env.MONGODB_URI!;
const LOGIN_ID = process.env.LOGIN_ID || "21lab";
const SCHEDULE_START_TIME = process.env.SCHEDULE_START_TIME || "";
const SCHEDULE_END_TIME = process.env.SCHEDULE_END_TIME || "";
const SCHEDULE_MODEL = process.env.SCHEDULE_MODEL || "deepseek-v4-flash";

const getLocalDateToken = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${date}`;
};

const CAMPAIGN_TOKEN =
  process.env.SCHEDULE_RESCHEDULE_TOKEN || `campaign_${getLocalDateToken()}`;

const GLOBAL_BLOCKED_COMMENTER_ACCOUNT_IDS = new Set([
  "pixelninja3",
  "ahffkekd12",
  "dhtksk1p",
]);

const BLOCKED_COMMENTER_ACCOUNT_IDS_BY_CAFE_ID: Record<string, Set<string>> = {
  "25729954": new Set(["dhtksk1p"]),
};

interface ScheduleItem {
  cafe: string;
  cafeId: string;
  keyword: string;
  category: string;
  type: "ad" | "daily" | "daily-ad";
  keywordType?: "own" | "competitor" | "competitor-advocacy";
  accountId: string;
  time: string; // "HH:MM"
}

const SCHEDULE: ScheduleItem[] = [
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "무신사 봄세일 장바구니 정리하다 30만원 넘김", category: "일상톡톡", type: "daily", accountId: "olgdmp9921", time: "22:20" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "샤넬 26SS 크러시드 2.55백 매장 입고 알림 기다리는 중", category: "_ 일상샤반사 📆", type: "daily-ad", accountId: "uqgidh2690", time: "22:26" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "친구 출산선물", category: "일반 쇼핑후기", type: "ad", keywordType: "competitor-advocacy", accountId: "yenalk", time: "22:32" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "샤넬 25백 4월 가격 인상 3프로 오른거 알게 되어 멘붕", category: "_ 일상샤반사 📆", type: "daily", accountId: "eytkgy5500", time: "22:38" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "본정심흑염소 효능", category: "일반 쇼핑후기", type: "ad", keywordType: "own", accountId: "uqgidh2690", time: "22:44" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "샤넬 슈퍼모델 토트백 가격 인상 전 매물 구하고 싶음", category: "_ 일상샤반사 📆", type: "daily-ad", accountId: "4giccokx", time: "22:50" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "21세기 대군부인 아이유 변우석 보면서 BBQ 황금올리브 시키는 수요일 밤", category: "일상톡톡", type: "daily", accountId: "eytkgy5500", time: "22:56" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "샤넬 클래식 미디엄 캐비어 골드 매물 알림 자정 다가오는데 또 꺼내보는 중", category: "_ 일상샤반사 📆", type: "daily", accountId: "olgdmp9921", time: "23:02" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "90대 할머니 선물", category: "일반 쇼핑후기", type: "ad", keywordType: "competitor-advocacy", accountId: "4giccokx", time: "23:08" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "디올 새들백 미디엄 베이지 매장 가격 비교 중", category: "_ 일상샤반사 📆", type: "daily-ad", accountId: "yenalk", time: "23:14" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "보양식 추천", category: "일반 쇼핑후기", type: "ad", keywordType: "competitor-advocacy", accountId: "olgdmp9921", time: "23:20" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "21세기 대군부인 아이유 트위드 룩 보고 샤넬 자켓 검색", category: "_ 일상샤반사 📆", type: "daily", accountId: "uqgidh2690", time: "23:26" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "다이소 봄정리함 신상 5만원어치 풀세트 결제", category: "일상톡톡", type: "daily", accountId: "yenalk", time: "23:32" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "보테가 카세트 미니 폰덴테 매장 입고 후기 찾는 중", category: "_ 일상샤반사 📆", type: "daily-ad", accountId: "eytkgy5500", time: "23:38" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "아이들 영양제", category: "일반 쇼핑후기", type: "ad", keywordType: "competitor-advocacy", accountId: "uqgidh2690", time: "23:44" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "취사병 전설이 되다 5월 11일 첫방 기다리며 샤넬 보이백 위시리스트", category: "_ 일상샤반사 📆", type: "daily", accountId: "4giccokx", time: "23:50" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "흑염소 한마리", category: "일반 쇼핑후기", type: "ad", keywordType: "own", accountId: "eytkgy5500", time: "23:56" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "에르메스 콘스탄스 24 골드 매물 알림 기다리는 중", category: "_ 일상샤반사 📆", type: "daily-ad", accountId: "olgdmp9921", time: "00:02" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "쿠팡 야식 라면 5개입 7천원에 카트 정리하다 자정 가까워짐", category: "일상톡톡", type: "daily", accountId: "4giccokx", time: "00:08" },
  { cafe: "샤넬오픈런", cafeId: "25460974", keyword: "폭싹 속았수다 보면서 샤넬 가브리엘 호보 매물 인스타 정주행", category: "_ 일상샤반사 📆", type: "daily", accountId: "yenalk", time: "00:14" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "에스트로겐 수치", category: "일반 쇼핑후기", type: "ad", keywordType: "competitor-advocacy", accountId: "olgdmp9921", time: "00:20" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "자연임신쌍둥이", category: "일반 쇼핑후기", type: "ad", keywordType: "competitor-advocacy", accountId: "yenalk", time: "00:32" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "마켓컬리 새벽배송 곰탕 시켜놓고 김치 꺼내는 중", category: "일상톡톡", type: "daily", accountId: "uqgidh2690", time: "00:44" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "80대 할머니 선물", category: "일반 쇼핑후기", type: "ad", keywordType: "competitor-advocacy", accountId: "eytkgy5500", time: "00:56" },
  { cafe: "쇼핑지름신", cafeId: "25729954", keyword: "김소영흑염소", category: "일반 쇼핑후기", type: "ad", keywordType: "own", accountId: "4giccokx", time: "01:08" },
];


const getEligibleCommenterIds = (
  commenterIds: string[],
  cafeId: string,
): string[] => {
  const cafeBlockedIds = BLOCKED_COMMENTER_ACCOUNT_IDS_BY_CAFE_ID[cafeId];

  return commenterIds.filter(
    (accountId) =>
      !GLOBAL_BLOCKED_COMMENTER_ACCOUNT_IDS.has(accountId) &&
      !cafeBlockedIds?.has(accountId),
  );
};

const createWriterResolver = (writerAccountIds: string[]) => {
  const cursorByCafeId = new Map<string, number>();
  const writerAccountIdSet = new Set(writerAccountIds);

  return ({ accountId, cafeId }: ScheduleItem): string => {
    if (writerAccountIdSet.has(accountId)) {
      return accountId;
    }

    const cursor = cursorByCafeId.get(cafeId) ?? 0;
    const writerAccountId = writerAccountIds[cursor % writerAccountIds.length];
    cursorByCafeId.set(cafeId, cursor + 1);
    return writerAccountId;
  };
};

const parseTitle = (text: string): string => {
  const match = text.match(/\[제목\]\s*\n?([\s\S]*?)(?=\n\[본문\]|\[본문\])/);
  return match ? match[1].trim() : "";
};

const parseBody = (text: string): string => {
  const match = text.match(/\[본문\]\s*\n?([\s\S]*?)(?=\n\[댓글\]|\[댓글\]|$)/);
  return match ? match[1].trim() : "";
};

const getDelayMs = (timeStr: string): number => {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  if (target.getTime() <= now.getTime() && h < 6) {
    target.setDate(target.getDate() + 1);
  }

  if (target.getTime() <= now.getTime()) {
    return 0;
  }

  return target.getTime() - now.getTime();
};

const main = async (): Promise<void> => {
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).lean();
  if (!user) throw new Error(`user not found: ${LOGIN_ID}`);

  const cafes = await Cafe.find({ userId: user.userId, isActive: true }).lean();
  const cafeMap = new Map(cafes.map((c) => [c.cafeId, c]));

  const accounts = await Account.find({
    userId: user.userId,
    isActive: true,
  }).lean();
  const accountMap = new Map(accounts.map((a) => [a.accountId, a]));
  const writerAccountIds = accounts
    .filter((a) => a.role === "writer")
    .map((a) => a.accountId);
  const commenterIds = accounts
    .filter((a) => a.role === "commenter")
    .map((a) => a.accountId);

  if (writerAccountIds.length === 0) throw new Error("writer 계정 없음");

  const activeSchedule = SCHEDULE;
  const filteredSchedule = activeSchedule.filter((item) => {
    const isAfterStart = !SCHEDULE_START_TIME || item.time >= SCHEDULE_START_TIME;
    const isBeforeEnd = !SCHEDULE_END_TIME || item.time <= SCHEDULE_END_TIME;
    return isAfterStart && isBeforeEnd;
  });

  console.log(`=== 스케줄 큐 추가 ===`);
  console.log(
    `user: ${LOGIN_ID} / jobs: ${filteredSchedule.length}건 / writers: ${writerAccountIds.length}명 / commenters: ${commenterIds.length}명 / startFilter: ${SCHEDULE_START_TIME || "-"} / endFilter: ${SCHEDULE_END_TIME || "-"}`,
  );
  console.log(`writer accounts: ${writerAccountIds.join(", ")}`);
  console.log(
    `commenter blocked: global=${Array.from(GLOBAL_BLOCKED_COMMENTER_ACCOUNT_IDS).join(", ")} / shopping=${Array.from(BLOCKED_COMMENTER_ACCOUNT_IDS_BY_CAFE_ID["25729954"]).join(", ")}\n`,
  );

  let totalPosts = 0;
  let failCount = 0;
  const totalSideComments = 0;
  const totalSideLikes = 0;

  const sortedSchedule = [...filteredSchedule].sort((a, b) =>
    a.time.localeCompare(b.time),
  );
  const resolveWriterAccountId = createWriterResolver(writerAccountIds);
  const scheduledRows = sortedSchedule.map((item) => {
    const writerAccountId = resolveWriterAccountId(item);
    const eligibleCommenterIds = getEligibleCommenterIds(commenterIds, item.cafeId);

    return { item, writerAccountId, eligibleCommenterIds };
  });
  const remappedWriterCount = scheduledRows.filter(
    ({ item, writerAccountId }) => item.accountId !== writerAccountId,
  ).length;

  console.log(`writer remap: ${remappedWriterCount}건`);

  for (const { item, writerAccountId, eligibleCommenterIds } of scheduledRows) {
    const delayMs = getDelayMs(item.time);
    const cafe = cafeMap.get(item.cafeId);
    if (!cafe) {
      console.log(`❌ 카페 없음: ${item.cafeId}`);
      failCount++;
      continue;
    }

    const account = accountMap.get(writerAccountId);
    if (!account) {
      console.log(`❌ 계정 없음: ${writerAccountId}`);
      failCount++;
      continue;
    }

    const typeLabels: Record<string, string> = { ad: "광고", daily: "일상", "daily-ad": "일상광고" };
    const typeLabel = typeLabels[item.type] || item.type;
    const remapLabel = writerAccountId === item.accountId ? "" : ` (from ${item.accountId})`;
    process.stdout.write(
      `[${item.time}] ${item.cafe} ${writerAccountId}${remapLabel} ${typeLabel} "${item.keyword}" ... `,
    );

    try {
      const contentStyle = getViralContentStyleForLoginId(LOGIN_ID);
      const isDailyContent = item.type === "daily" || item.type === "daily-ad";
      const kwType = item.keywordType || "own";
      const buildAdPrompt = kwType === "competitor-advocacy"
        ? () => buildCompetitorAdvocacyPrompt({ keyword: item.keyword, keywordType: "competitor" })
        : kwType === "competitor"
          ? () => buildCompetitorKeywordPrompt({ keyword: item.keyword, keywordType: "competitor" })
          : contentStyle !== '정보'
            ? () => buildViralPrompt({ keyword: item.keyword, keywordType: "own" }, contentStyle)
            : () => buildOwnKeywordPrompt({ keyword: item.keyword, keywordType: "own" });
      const prompt = isDailyContent
        ? buildShortDailyPrompt({ keyword: item.keyword, keywordType: "own" })
        : buildAdPrompt();

      const { content } = await generateViralContent({
        prompt,
        model: SCHEDULE_MODEL,
      });
      const parsed = parseViralResponse(content);
      const title = parsed?.title || parseTitle(content);
      const body = parsed?.body || parseBody(content);
      if (!title || !body) throw new Error(`파싱 실패`);

      // daily-ad: 댓글 차단 + 바이럴 댓글 없음 (나중에 광고로 수정 후 댓글 달 예정)
      const isDailyAd = item.type === "daily-ad";
      const viralComments: ViralCommentsData | undefined =
        isDailyAd ? undefined
        : parsed?.comments?.length
          ? { comments: parsed.comments }
          : undefined;

      const jobData: PostJobData = {
        type: "post",
        accountId: writerAccountId,
        userId: user.userId,
        cafeId: item.cafeId,
        menuId: cafe.menuId,
        subject: title,
        content: body,
        rawContent: content,
        keyword: item.keyword,
        category: item.category,
        postType: item.type,
        commenterAccountIds: eligibleCommenterIds,
        rescheduleToken: CAMPAIGN_TOKEN,
        ...(isDailyAd && {
          skipComments: true,
          postOptions: {
            allowComment: false,
            allowScrap: true,
            allowCopy: false,
            useAutoSource: false,
            useCcl: false,
            cclCommercial: "disallow" as const,
            cclModify: "disallow" as const,
          },
        }),
        ...(!isDailyAd && { viralComments }),
      };

      await addTaskJob(writerAccountId, jobData, delayMs);
      totalPosts++;
      console.log(
        `✅ [${title.slice(0, 25)}...] (${Math.round(delayMs / 60000)}분 후)`,
      );
    } catch (e) {
      failCount++;
      console.log(`❌ ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log("\n=== 완료 ===");
  console.log(`글 작성: ${totalPosts}건 / 실패: ${failCount}건`);
  console.log(
    `사이드 댓글: ${totalSideComments}건 / 좋아요: ${totalSideLikes}건`,
  );
};

main()
  .then(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("run-schedule failed:", e);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
