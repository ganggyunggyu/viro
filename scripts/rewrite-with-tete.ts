import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import { browseCafePosts } from "../src/shared/lib/cafe-browser";
import { modifyArticleWithAccount } from "../src/shared/lib/naver-cafe-writing/article-modifier";
import { closeAllContexts } from "../src/shared/lib/multi-session";

const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";

interface CafeInfo {
  cafeName: string;
  cafeId: string;
  ownerAccountId: string;
  service: string;
}

const CAFES: CafeInfo[] = [
  { cafeName: "육아 돌봄수첩", cafeId: "31754837", ownerAccountId: "ahffkdlek12", service: "육아" },
  { cafeName: "건강 체크노트", cafeId: "31754869", ownerAccountId: "ahffkekd12", service: "건강" },
  { cafeName: "건강 정보노트", cafeId: "31754875", ownerAccountId: "ahsxkfldk12", service: "건강" },
  { cafeName: "생활 살림노트", cafeId: "31754939", ownerAccountId: "alsrudgus531", service: "생활" },
  { cafeName: "일상 소소담", cafeId: "31755069", ownerAccountId: "pixelninja3", service: "일상" },
];

const cleanWord = (word: string): string => word.replace(/[,.!?]/g, "");

const extractKeywordFromSubject = (subject: string): string => {
  // 제목에서 첫 어절 2~4개 정도를 키워드로 근사 사용 (풀 소진 시 폴백)
  return subject.split(/\s+/).slice(0, 3).map(cleanWord).join(" ");
};

// 실제 캠페인 스케줄에서 쓰는 키워드 풀 (260709 스케줄, 중복 제거)
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

// 이전엔 기존 제목에서 키워드를 근사 추출했는데, 그 제목 자체가 카페 5개에
// 마스터 키워드를 라운드로빈으로 뿌린 결과라 카페마다 같은 주제가 반복됐다.
// 실제 캠페인 키워드 풀(88개)을 셔플해서 대상 전체(카페 무관)에 한 번씩 나눠주고,
// 풀이 모자라면 다시 셔플해서 이어붙인다 — 완전히 못 피하는 극소수 인접 중복만
// 남기고 나머지는 실제로 서로 다른 키워드로 생성되게 만든다.
const assignDiverseKeywords = (tasks: ArticleTask[]): void => {
  let pool: string[] = [];
  const refill = (): void => {
    pool = shuffle(KEYWORD_POOL);
  };
  refill();

  let lastUsed = "";
  for (const task of tasks) {
    if (pool.length === 0) refill();
    let idx = 0;
    if (pool[0] === lastUsed && pool.length > 1) idx = 1;
    const keyword = pool.splice(idx, 1)[0];
    task.keyword = keyword || extractKeywordFromSubject(task.subject);
    lastUsed = task.keyword;
  }
};

// 7/11~7/12(KST)에 발행된 글만 대상으로 한다 — 이 기간에 이미지 배치/본문 유실
// 버그가 있던 코드로 발행/재작성된 글들이라 재작성 범위를 여기로 한정한다.
const TARGET_PUBLISH_DATES = new Set(["2026-07-11", "2026-07-12"]);
const isTargetPublishDate = (writeDateTimestamp: number): boolean => {
  if (!writeDateTimestamp) return false;
  const kst = new Date(writeDateTimestamp + 9 * 60 * 60 * 1000);
  const dateStr = kst.toISOString().slice(0, 10);
  return TARGET_PUBLISH_DATES.has(dateStr);
};

// S3 큐레이션 뱅크 우선 조회, 없으면 자동으로 AI(Imagen/Gemini/Recraft) 이미지 생성
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

interface TeteResponse {
  content: string;
  contentType: string;
}

const generateTete = async (keyword: string, service: string): Promise<TeteResponse> => {
  const res = await fetch(`${TEXT_GEN_HUB_URL}/generate/tete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, keyword, ref: "" }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`tete generate failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { content?: string; contentType?: string };
  if (!data.content) throw new Error("tete content missing");
  return { content: data.content, contentType: data.contentType || "" };
};

const splitTitleBody = (raw: string): { title: string; body: string } => {
  const lines = raw.split(/\r?\n/);
  const firstNonEmpty = lines.findIndex((l) => l.trim());
  const title = (lines[firstNonEmpty] || "").trim();
  const body = lines.slice(firstNonEmpty + 1).join("\n").trim();
  return { title, body };
};

interface ArticleTask {
  cafeName: string;
  cafeId: string;
  ownerAccountId: string;
  service: string;
  articleId: number;
  subject: string;
  keyword?: string;
}

const rewriteOne = async (task: ArticleTask): Promise<boolean> => {
  const acc = await Account.findOne({ accountId: task.ownerAccountId }).lean();
  if (!acc) {
    console.log(`[${task.cafeName}] 계정 없음, 스킵`);
    return false;
  }
  const account = { id: task.ownerAccountId, password: (acc as any).password, nickname: (acc as any).nickname };
  const keyword = task.keyword || extractKeywordFromSubject(task.subject);

  try {
    console.log(`[${task.cafeName}][articleId=${task.articleId}] 이미지 3장 검색 + 테테 생성 동시 시작: ${keyword}`);
    const [images, tete] = await Promise.all([
      fetchImages(keyword, 3),
      generateTete(keyword, task.service),
    ]);
    console.log(`[${task.cafeName}][articleId=${task.articleId}] 이미지 ${images.length}장 확보, 테테 생성 완료`);
    const { title, body } = splitTitleBody(tete.content);
    if (!title || !body) {
      console.log(`[${task.cafeName}][articleId=${task.articleId}] 제목/본문 파싱 실패, 스킵`);
      return false;
    }

    const result = await modifyArticleWithAccount(account, {
      cafeId: task.cafeId,
      articleId: task.articleId,
      newTitle: title,
      newContent: body,
      images: images.length > 0 ? images : undefined,
    });

    if (result.success) {
      console.log(`[OK][${task.cafeName}][articleId=${task.articleId}] 재작성 완료`);
      return true;
    }
    console.log(`[FAIL][${task.cafeName}][articleId=${task.articleId}] ${result.error}`);
    return false;
  } catch (e: any) {
    console.log(`[ERROR][${task.cafeName}][articleId=${task.articleId}] ${e.message}`);
    return false;
  }
};

const CONCURRENCY = 5;

// 카페(=계정) 단위로 묶어서 처리한다. 같은 계정의 글을 서로 다른 워커가 동시에 집으면
// 계정 락 경합으로 한쪽이 5분 타임아웃을 반복하며 헛돌게 되므로, 카페별로 큐를 분리하고
// 카페 큐 자체를 병렬로 돌린다(카페 내부는 항상 순차).
const runPool = async (tasks: ArticleTask[]): Promise<{ success: number; fail: number }> => {
  const byCafe = new Map<string, ArticleTask[]>();
  for (const task of tasks) {
    const list = byCafe.get(task.cafeId) || [];
    list.push(task);
    byCafe.set(task.cafeId, list);
  }

  const cafeQueues = [...byCafe.values()];
  let success = 0;
  let fail = 0;

  const runCafeQueue = async (queue: ArticleTask[]): Promise<void> => {
    for (const task of queue) {
      const ok = await rewriteOne(task);
      if (ok) success++;
      else fail++;
    }
  };

  // 카페 큐들을 CONCURRENCY개씩 묶어서 실행 (카페 수가 CONCURRENCY보다 많을 때 대비)
  for (let i = 0; i < cafeQueues.length; i += CONCURRENCY) {
    const batch = cafeQueues.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((q) => runCafeQueue(q)));
  }

  return { success, fail };
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);

  // 이미지 배치 구조가 바뀌어서(중간 삽입 → 상단 일괄) 인트로를 뺀 전체 글을 다시 재작성한다
  const tasks: ArticleTask[] = [];
  for (const cafe of CAFES) {
    const acc = await Account.findOne({ accountId: cafe.ownerAccountId }).lean();
    if (!acc) continue;
    // 캡차 실패는 확률적이라 목록 조회 한 번 실패했다고 그 카페를 통째로
    // 빼버리면(과거 실제로 3/5 카페가 이렇게 통째로 빠진 적 있음) 재실행해서
    // 운이 좋아지길 바라는 수밖에 없었다 — 여기서 바로 몇 번 더 재시도한다.
    let result = await browseCafePosts(
      { id: cafe.ownerAccountId, password: (acc as any).password },
      cafe.cafeId,
      undefined,
      { page: 1, perPage: 50 }
    );
    for (let retry = 0; retry < 2 && !result.success; retry++) {
      console.log(`[${cafe.cafeName}] 목록 조회 실패, 재시도 ${retry + 1}/2: ${result.error}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      result = await browseCafePosts(
        { id: cafe.ownerAccountId, password: (acc as any).password },
        cafe.cafeId,
        undefined,
        { page: 1, perPage: 50 }
      );
    }
    if (!result.success) {
      console.log(`[${cafe.cafeName}] 목록 조회 최종 실패 (재시도 소진): ${result.error}`);
      continue;
    }
    for (const article of result.articles as any[]) {
      if (article.articleId === 1) continue; // 인트로 글 제외
      if (!isTargetPublishDate(article.writeDateTimestamp)) continue; // 7/11~7/12 발행분만
      tasks.push({
        cafeName: cafe.cafeName,
        cafeId: cafe.cafeId,
        ownerAccountId: cafe.ownerAccountId,
        service: cafe.service,
        articleId: article.articleId,
        subject: article.subject,
      });
    }
  }

  assignDiverseKeywords(tasks);

  console.log(`\n=== 총 재작성 대상: ${tasks.length}개 ===`);
  tasks.forEach((t) => console.log(`  - [${t.cafeName}] articleId=${t.articleId} 키워드="${t.keyword}" ${t.subject}`));

  const { success, fail } = await runPool(tasks);

  console.log(`\n=== 최종 요약: 성공 ${success} / 실패 ${fail} / 총 ${tasks.length} ===`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    try { await closeAllContexts(); } catch {}
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
