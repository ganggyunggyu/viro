import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import { writePostWithAccount } from "../src/shared/lib/naver-cafe-writing/post-writer";
import { closeAllContexts } from "../src/shared/lib/multi-session";
import { parseViralResponse } from "../src/features/viral/viral-parser";

const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";
const IMAGE_GEN_URL = process.env.IMAGE_GEN_URL || "http://localhost:3939";

interface CafeSeedTarget {
  cafeName: string;
  cafeId: string;
  menuId: string;
  ownerAccountId: string;
  endpoint: string;
  service: string;
  keywords: string[];
}

const TARGETS: CafeSeedTarget[] = [
  {
    cafeName: "건강 체크노트",
    cafeId: "31754869",
    menuId: "1",
    ownerAccountId: "ahffkekd12",
    endpoint: "/generate/hanryeo",
    service: "건강",
    keywords: [
      "요산 수치 낮추는 방법",
      "체지방률 정상범위 알아보기",
      "이명 증상과 원인 정리",
      "위산 역류 예방하는 습관",
    ],
  },
  {
    cafeName: "건강 정보노트",
    cafeId: "31754875",
    menuId: "1",
    ownerAccountId: "ahsxkfldk12",
    endpoint: "/generate/hanryeo",
    service: "건강",
    keywords: [
      "비타민D 부족 증상 알아보기",
      "오메가3 효능과 부작용",
      "마그네슘 섭취 기준량",
      "프로바이오틱스 고르는 법",
      "철분제 복용 시기와 방법",
      "종합비타민 성분 비교하기",
      "루테인 효과 알아보기",
      "아연 부족 증상 체크",
      "코엔자임Q10 효능 정리",
    ],
  },
  {
    cafeName: "생활 살림노트",
    cafeId: "31754939",
    menuId: "1",
    ownerAccountId: "vegetable10517",
    endpoint: "/generate/blog-filler",
    service: "생활",
    keywords: [
      "냉장고 정리 방법 정리",
      "세탁기 청소 주기와 방법",
      "곰팡이 제거 방법 총정리",
      "옷장 정리 팁 모음",
      "주방세제 고르는 법",
      "이불 세탁 주기 알아보기",
      "수납 공간 활용법",
      "청소 순서 정하는 법",
      "분리수거 기준 정리",
    ],
  },
  {
    cafeName: "일상 소소담",
    cafeId: "31755069",
    menuId: "1",
    ownerAccountId: "pixelninja3",
    endpoint: "/generate/blog-filler",
    service: "일상",
    keywords: [
      "아침 루틴 만드는 법",
      "주말 알차게 보내는 법",
      "스트레스 해소법 모음",
      "취미 시작하는 법",
      "독서 습관 만들기",
      "산책 코스 추천 팁",
      "홈카페 세팅하는 법",
      "일기 쓰는 습관 만들기",
      "미니멀 라이프 시작하기",
    ],
  },
];

const stripMarkdown = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`(.+?)`/g, "$1")
    .trim();

const fetchImageAsBase64 = async (keyword: string): Promise<string | null> => {
  try {
    const searchRes = await fetch(
      `${IMAGE_GEN_URL}/api/image/search?q=${encodeURIComponent(keyword)}&n=5`,
    );
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as {
      success: boolean;
      data?: { results: Array<{ imageUrl: string }> };
    };
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

const generateManuscript = async (
  target: CafeSeedTarget,
  keyword: string,
): Promise<{ title: string; body: string }> => {
  const res = await fetch(`${TEXT_GEN_HUB_URL}${target.endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: target.service, keyword, ref: "", category: target.service }),
  });
  if (!res.ok) throw new Error(`generate failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { content?: string };
  if (!data.content) throw new Error("content missing");

  const parsed = parseViralResponse(data.content);
  if (parsed?.title && parsed.body) {
    return { title: parsed.title, body: parsed.body };
  }
  const lines = data.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const title = stripMarkdown(lines[0] || keyword).slice(0, 80);
  const body = stripMarkdown(lines.slice(1).join("\n\n") || data.content);
  return { title, body };
};

const runTarget = async (
  target: CafeSeedTarget
): Promise<{ name: string; success: number; fail: number }> => {
  console.log(`\n=== ${target.cafeName} 시작 (${target.keywords.length}개) ===`);
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
      const manuscript = await generateManuscript(target, keyword);
      console.log(`[${target.cafeName}] 이미지 검색 중: ${keyword}`);
      const image = await fetchImageAsBase64(keyword);
      console.log(`[${target.cafeName}] 이미지 ${image ? "찾음" : "못찾음"}`);
      console.log(`[${target.cafeName}] 발행 중: ${manuscript.title}`);
      const result = await writePostWithAccount(account, {
        cafeId: target.cafeId,
        menuId: target.menuId,
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
        console.log(`[OK] articleId=${result.articleId}`);
      } else {
        fail += 1;
        console.log(`[FAIL] ${result.error}`);
      }
    } catch (e: any) {
      fail += 1;
      console.log(`[ERROR] ${e.message}`);
    }
  }

  console.log(`=== ${target.cafeName} 완료: 성공 ${success} / 실패 ${fail} ===`);
  return { name: target.cafeName, success, fail };
};

const CONCURRENCY = 2;

const runPool = async (
  targets: CafeSeedTarget[]
): Promise<Array<{ name: string; success: number; fail: number }>> => {
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
  for (const r of results) {
    summary[r.name] = { success: r.success, fail: r.fail };
  }

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
