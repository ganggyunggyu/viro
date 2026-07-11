import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import { writePostWithAccount } from "../src/shared/lib/naver-cafe-writing/post-writer";
import { closeAllContexts } from "../src/shared/lib/multi-session";
import { parseViralResponse } from "../src/features/viral/viral-parser";

const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";
const IMAGE_GEN_URL = process.env.IMAGE_GEN_URL || "http://localhost:3939";
const ENDPOINT = "/generate/blog-filler";
const SERVICE = "생활";

const MASTER_KEYWORDS = [
  "광주예식장", "광주웨딩홀", "날개없는 선풍기", "드라이기", "드라이기 추천",
  "미용실드라이기", "밀크씨슬", "방역업체", "부천pt", "부천웨딩홀",
  "부평웨딩홀", "선풍기", "수원웨딩홀", "시스템에어컨청소업체", "신정호카페",
  "아산웨딩홀", "아산카페", "에어컨청소업체", "여성청바지", "울산마운자로처방",
  "울산위고비", "의정부웨딩홀", "인천방역업체", "인천예식장", "인천웨딩홀",
  "인천웨딩홀추천", "일산웨딩홀", "장바구니캐리어", "접이식카트", "천안웨딩홀",
  "청소업체추천", "해충방역업체", "헤어드라이기", "헤어드라이어", "헤어에센스추천",
];

interface CafeTarget {
  cafeName: string;
  cafeId: string;
  ownerAccountId: string;
  alreadyDone: string[]; // 오늘 이미 발행 완료된 키워드 (중복 방지용, 목표 개수 계산에만 사용)
  keywords: string[];
}

const buildTargets = (): CafeTarget[] => {
  const bases: Array<Omit<CafeTarget, "keywords">> = [
    { cafeName: "육아 돌봄수첩", cafeId: "31754837", ownerAccountId: "ahffkdlek12", alreadyDone: ["광주예식장"] },
    { cafeName: "건강 체크노트", cafeId: "31754869", ownerAccountId: "ahffkekd12", alreadyDone: ["드라이기"] },
    { cafeName: "건강 정보노트", cafeId: "31754875", ownerAccountId: "ahsxkfldk12", alreadyDone: [] },
    { cafeName: "생활 살림노트", cafeId: "31754939", ownerAccountId: "alsrudgus531", alreadyDone: [] },
    { cafeName: "일상 소소담", cafeId: "31755069", ownerAccountId: "pixelninja3", alreadyDone: [] },
  ];

  let cursor = 0;
  return bases.map((base) => {
    const remaining = 10 - base.alreadyDone.length;
    const keywords: string[] = [];
    for (let i = 0; i < remaining; i++) {
      keywords.push(MASTER_KEYWORDS[cursor % MASTER_KEYWORDS.length]);
      cursor++;
    }
    return { ...base, keywords };
  });
};

const TARGETS = buildTargets();

const stripMarkdown = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`(.+?)`/g, "$1")
    .trim();

const fetchImageAsBase64 = async (keyword: string): Promise<string | null> => {
  try {
    const searchRes = await fetch(`${IMAGE_GEN_URL}/api/image/search?q=${encodeURIComponent(keyword)}&n=5`);
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as { data?: { results: Array<{ imageUrl: string }> } };
    const results = searchData.data?.results || [];
    if (results.length === 0) return null;
    const picked = results[Math.floor(Math.random() * results.length)];
    const proxyRes = await fetch(`${IMAGE_GEN_URL}${picked.imageUrl}`);
    if (!proxyRes.ok) return null;
    const buf = Buffer.from(await proxyRes.arrayBuffer());
    return `data:image/webp;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
};

const generateManuscript = async (keyword: string): Promise<{ title: string; body: string }> => {
  const res = await fetch(`${TEXT_GEN_HUB_URL}${ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: SERVICE, keyword, ref: "", category: SERVICE }),
  });
  if (!res.ok) throw new Error(`generate failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { content?: string };
  if (!data.content) throw new Error("content missing");

  const parsed = parseViralResponse(data.content);
  if (parsed?.title && parsed.body) return { title: parsed.title, body: parsed.body };
  const lines = data.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const title = stripMarkdown(lines[0] || keyword).slice(0, 80);
  const body = stripMarkdown(lines.slice(1).join("\n\n") || data.content);
  return { title, body };
};

const runTarget = async (target: CafeTarget): Promise<{ name: string; success: number; fail: number }> => {
  console.log(`\n=== ${target.cafeName} 시작 (${target.keywords.length}개, 오늘 기완료 ${target.alreadyDone.length}개) ===`);
  const acc = await Account.findOne({ accountId: target.ownerAccountId }).lean();
  if (!acc) {
    console.log(`[${target.cafeName}] 계정 없음, 스킵`);
    return { name: target.cafeName, success: 0, fail: 0 };
  }
  const account = { id: target.ownerAccountId, password: (acc as any).password, nickname: (acc as any).nickname };

  let success = 0;
  let fail = 0;

  for (const keyword of target.keywords) {
    try {
      console.log(`[${target.cafeName}] 생성 중: ${keyword}`);
      const manuscript = await generateManuscript(keyword);
      const image = await fetchImageAsBase64(keyword);
      console.log(`[${target.cafeName}] 이미지 ${image ? "찾음" : "못찾음"} - 발행 중: ${manuscript.title}`);
      const result = await writePostWithAccount(account, {
        cafeId: target.cafeId,
        menuId: "1",
        subject: manuscript.title,
        content: manuscript.body,
        images: image ? [image] : undefined,
        postOptions: {
          allowComment: true,
          allowScrap: true,
          allowCopy: false,
          useAutoSource: false,
          useCcl: false,
          cclCommercial: "disallow",
          cclModify: "disallow",
        },
      });
      if (result.success) {
        success += 1;
        console.log(`[OK][${target.cafeName}] articleId=${result.articleId}`);
      } else {
        fail += 1;
        console.log(`[FAIL][${target.cafeName}] ${result.error}`);
      }
    } catch (e: any) {
      fail += 1;
      console.log(`[ERROR][${target.cafeName}] ${e.message}`);
    }
  }

  console.log(`=== ${target.cafeName} 완료: 성공 ${success} / 실패 ${fail} ===`);
  return { name: target.cafeName, success, fail };
};

const CONCURRENCY = 2;

const runPool = async (targets: CafeTarget[]): Promise<Array<{ name: string; success: number; fail: number }>> => {
  const queue = [...targets];
  const results: Array<{ name: string; success: number; fail: number }> = [];
  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const target = queue.shift();
      if (!target) break;
      results.push(await runTarget(target));
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return results;
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const results = await runPool(TARGETS);

  const summary: Record<string, { success: number; fail: number }> = {};
  for (const r of results) summary[r.name] = { success: r.success, fail: r.fail };

  console.log("\n=== 최종 요약 ===");
  console.log(JSON.stringify(summary, null, 2));

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
