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
  // 제목에서 첫 어절 2~4개 정도를 키워드로 근사 사용
  return subject.split(/\s+/).slice(0, 3).map(cleanWord).join(" ");
};

// 같은 루트 키워드(제목 첫 어절, 예: "수원웨딩홀")가 여러 카페에 걸쳐 중복되는 경우
// (원래 시딩 때 마스터 키워드가 카페 5개에 라운드로빈 배정된 결과) 그대로 재작성하면
// 서로 다른 카페에서 거의 같은 주제·같은 짧은 키워드로 이미지/원고를 생성하게 된다.
// 전체 대상 목록을 한 번에 훑어서, 루트가 먼저 등장한 카페 이후로는 제목에서 더 많은
// 어절을 가져와 키워드를 구체화해 검색·생성 결과가 갈라지게 만든다.
const assignDiverseKeywords = (tasks: ArticleTask[]): void => {
  const usedRoots = new Set<string>();
  for (const task of tasks) {
    const words = task.subject.split(/\s+/).filter(Boolean);
    const root = cleanWord(words[0] || task.subject);

    let sliceLen = 3;
    if (usedRoots.has(root)) {
      sliceLen = Math.min(words.length, 6);
    }
    task.keyword = words.slice(0, sliceLen).map(cleanWord).join(" ") || task.subject;
    usedRoots.add(root);
  }
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
    const result = await browseCafePosts(
      { id: cafe.ownerAccountId, password: (acc as any).password },
      cafe.cafeId,
      undefined,
      { page: 1, perPage: 50 }
    );
    if (!result.success) {
      console.log(`[${cafe.cafeName}] 목록 조회 실패: ${result.error}`);
      continue;
    }
    for (const article of result.articles as any[]) {
      if (article.articleId === 1) continue; // 인트로 글 제외
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
