import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import fs from "fs";
import { Account } from "../src/shared/models/account";
import { writePostWithAccount } from "../src/shared/lib/naver-cafe-writing/post-writer";
import { closeAllContexts, closeContextForAccount } from "../src/shared/lib/multi-session";
import { buildCafePostContent } from "../src/shared/lib/cafe-content";

const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";
const SCRATCH =
  "/private/tmp/claude-501/-Users-ganggyunggyu-Programing-cafe-bot/7fc48bb3-780d-4d48-bfbc-1be391ceec28/scratchpad";
const RUN_LOG = `${SCRATCH}/publish-daily-10.log`;

const logLine = (msg: string): void => {
  console.log(msg);
  fs.appendFileSync(RUN_LOG, msg + "\n");
};

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  menuId: string;
  ownerAccountId: string;
  service: string;
}

// rewrite-with-tete.ts와 동일한 5개 캠페인 카페 — 각자 다른 계정이라 병렬로 돌려도 락 경합 없음
const CAFES: CafeInfo[] = [
  { cafeName: "육아 돌봄수첩", cafeId: "31754837", menuId: "1", ownerAccountId: "ahffkdlek12", service: "육아" },
  { cafeName: "건강 체크노트", cafeId: "31754869", menuId: "1", ownerAccountId: "ahffkekd12", service: "건강" },
  { cafeName: "건강 정보노트", cafeId: "31754875", menuId: "1", ownerAccountId: "ahsxkfldk12", service: "건강" },
  { cafeName: "생활 살림노트", cafeId: "31754939", menuId: "1", ownerAccountId: "alsrudgus531", service: "생활" },
  { cafeName: "일상 소소담", cafeId: "31755069", menuId: "1", ownerAccountId: "pixelninja3", service: "일상" },
];

const POSTS_PER_CAFE = 10;

// 실제 캠페인 스케줄 키워드 풀(rewrite-with-tete.ts와 동일, 260709 스케줄 기준 중복 제거)
const KEYWORD_POOL: string[] = [
  "웨딩밴드브랜드", "결혼반지브랜드", "커플반지", "명품커플링", "프로포즈링",
  "랩다이아가격", "강아지 눈 영양제", "강아지 영양제", "강아지 관절 영양제", "선풍기",
  "인천웨딩홀", "쿼드쎄라 펜타", "에어컨청소업체", "시스템에어컨청소업체", "먹는 위고비",
  "위고비 알약", "베르가못", "마운자로 요요", "파운다요", "알파cd",
  "LDM 디바이스", "무지외반증 교정기", "거북목교정기", "족저근막염깔창", "올리브오일",
  "조문 답례품", "음식물처리기", "음식물분쇄기", "sat학원", "아치깔창",
  "족저근막염 신발", "신발깔창", "깔창", "평발깔창", "푸룬주스",
  "장에좋은음식", "군대깔창", "군화깔창", "답례품", "랩다이아가드링",
  "다이아몬드시세", "다이아시세", "회사 답례품", "결혼 답례품", "삼척카페",
  "대구 가족사진", "두유제조기", "부평웨딩홀", "대구사진관", "천안내성발톱",
  "아산웨딩홀", "천안웨딩홀", "수원웨딩홀", "인천예식장", "광주웨딩홀",
  "부천웨딩홀", "일산웨딩홀", "아산카페", "신정호카페", "광주예식장",
  "의정부웨딩홀", "인천웨딩홀추천", "청소업체추천", "방역업체", "인천방역업체",
  "해충방역업체", "접이식카트", "장바구니캐리어", "울산위고비", "울산마운자로처방",
  "밀크씨슬", "부천pt", "드라이기", "헤어드라이기", "드라이기 추천",
  "미용실드라이기", "날개없는 선풍기", "다이아몬드가격", "다이아몬드1캐럿가격", "다이아1캐럿가격",
  "헤어에센스추천", "여성청바지", "헤어드라이어", "효성쥬얼리시티", "종로효성주얼리시티",
  "종로웨딩밴드", "종로반지", "종로금은장",
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

interface PostTask {
  cafeName: string;
  cafeId: string;
  menuId: string;
  ownerAccountId: string;
  service: string;
  keyword: string;
}

const assignDiverseKeywords = (tasks: Omit<PostTask, "keyword">[]): PostTask[] => {
  let pool = shuffle(KEYWORD_POOL);
  let lastUsed = "";
  return tasks.map((task) => {
    if (pool.length === 0) pool = shuffle(KEYWORD_POOL);
    let idx = 0;
    if (pool[0] === lastUsed && pool.length > 1) idx = 1;
    const keyword = pool.splice(idx, 1)[0];
    lastUsed = keyword;
    return { ...task, keyword };
  });
};

const fetchImages = async (keyword: string, count: number): Promise<string[]> => {
  try {
    const res = await fetch(`${TEXT_GEN_HUB_URL}/generate/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, count }),
      signal: AbortSignal.timeout(150000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { images?: Array<{ url: string }> };
    return (data.images || []).map((img) => img.url).filter(Boolean);
  } catch {
    return [];
  }
};

const generateTete = async (keyword: string, service: string): Promise<string> => {
  const res = await fetch(`${TEXT_GEN_HUB_URL}/generate/tete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, keyword, ref: "" }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`tete generate failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { content?: string };
  if (!data.content) throw new Error("tete content missing");
  return data.content;
};

const publishOne = async (task: PostTask): Promise<boolean> => {
  const acc = await Account.findOne({ accountId: task.ownerAccountId }).lean();
  if (!acc) {
    logLine(`[${task.cafeName}] 계정 없음, 스킵`);
    return false;
  }
  const account = { id: task.ownerAccountId, password: (acc as any).password };

  try {
    logLine(`[${task.cafeName}] 이미지 3장 검색 + 테테 생성 시작: ${task.keyword}`);
    const [images, rawContent] = await Promise.all([fetchImages(task.keyword, 3), generateTete(task.keyword, task.service)]);
    const { title, htmlContent } = buildCafePostContent(rawContent, task.keyword);
    if (!title || !htmlContent) {
      logLine(`[${task.cafeName}] 제목/본문 파싱 실패, 스킵`);
      return false;
    }

    const result = await writePostWithAccount(account, {
      cafeId: task.cafeId,
      menuId: task.menuId,
      subject: title,
      content: htmlContent,
      images: images.length > 0 ? images : undefined,
    });

    if (result.success) {
      logLine(`[OK][${task.cafeName}] 발행 완료: "${title}"`);
      return true;
    }
    logLine(`[FAIL][${task.cafeName}] "${task.keyword}": ${result.error}`);
    return false;
  } catch (e: any) {
    logLine(`[ERROR][${task.cafeName}] "${task.keyword}": ${e.message}`);
    return false;
  }
};

const runCafeQueue = async (cafeName: string, tasks: PostTask[]): Promise<{ success: number; fail: number }> => {
  let success = 0;
  let fail = 0;
  for (const task of tasks) {
    try {
      const ok = await publishOne(task);
      if (ok) {
        success++;
      } else {
        fail++;
        logLine(`[${cafeName}] 실패 후 ${task.ownerAccountId} 컨텍스트 초기화`);
        try {
          await closeContextForAccount(task.ownerAccountId);
        } catch {}
      }
    } catch (e: any) {
      fail++;
      logLine(`[${cafeName}] 글 단위 오류(스킵하고 계속): ${e.message}`);
    }
  }
  return { success, fail };
};

const main = async (): Promise<void> => {
  fs.writeFileSync(RUN_LOG, `# 카페당 ${POSTS_PER_CAFE}개 신규 발행 (시작: ${new Date().toISOString()})\n\n`);

  await mongoose.connect(process.env.MONGODB_URI!);

  const baseTasks: Omit<PostTask, "keyword">[] = [];
  for (const cafe of CAFES) {
    for (let i = 0; i < POSTS_PER_CAFE; i++) {
      baseTasks.push({
        cafeName: cafe.cafeName,
        cafeId: cafe.cafeId,
        menuId: cafe.menuId,
        ownerAccountId: cafe.ownerAccountId,
        service: cafe.service,
      });
    }
  }
  const tasks = assignDiverseKeywords(baseTasks);

  logLine(`=== 총 발행 대상: ${tasks.length}개 (카페당 ${POSTS_PER_CAFE}개 x ${CAFES.length}개 카페) ===`);
  tasks.forEach((t) => logLine(`  - [${t.cafeName}] 키워드="${t.keyword}"`));

  const byCafe = new Map<string, PostTask[]>();
  for (const t of tasks) {
    const list = byCafe.get(t.cafeName) || [];
    list.push(t);
    byCafe.set(t.cafeName, list);
  }

  const results = await Promise.all(
    [...byCafe.entries()].map(([cafeName, cafeTasks]) => runCafeQueue(cafeName, cafeTasks))
  );

  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalFail = results.reduce((sum, r) => sum + r.fail, 0);

  logLine(`\n=== 전체 완료: 성공 ${totalSuccess} / 실패 ${totalFail} / 총 ${tasks.length} ===`);

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
