import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import { writePostWithAccount } from "../src/shared/lib/naver-cafe-writing/post-writer";
import { closeAllContexts } from "../src/shared/lib/multi-session";
import { parseViralResponse } from "../src/features/viral/viral-parser";

const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";
const IMAGE_GEN_URL = process.env.IMAGE_GEN_URL || "http://localhost:3939";

const CAFE_ID = "31754939";
const MENU_ID = "1";
const ACCOUNT_ID = "alsrudgus531";
const ENDPOINT = "/generate/blog-filler";
const SERVICE = "생활";
const KEYWORDS = [
  "냉장고 정리 방법 정리",
  "세탁기 청소 주기와 방법",
  "곰팡이 제거 방법 총정리",
  "옷장 정리 팁 모음",
  "주방세제 고르는 법",
  "이불 세탁 주기 알아보기",
  "수납 공간 활용법",
  "청소 순서 정하는 법",
  "분리수거 기준 정리",
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
  keyword: string,
): Promise<{ title: string; body: string }> => {
  const res = await fetch(`${TEXT_GEN_HUB_URL}${ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: SERVICE, keyword, ref: "", category: SERVICE }),
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

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const acc = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!acc) {
    console.log("계정 없음");
    process.exit(1);
  }
  const account = { id: ACCOUNT_ID, password: (acc as any).password, nickname: (acc as any).nickname };

  let success = 0;
  let fail = 0;

  for (const keyword of KEYWORDS) {
    try {
      console.log(`[생활 살림노트-alt] 생성 중: ${keyword}`);
      const manuscript = await generateManuscript(keyword);
      console.log(`[생활 살림노트-alt] 이미지 검색 중: ${keyword}`);
      const image = await fetchImageAsBase64(keyword);
      console.log(`[생활 살림노트-alt] 이미지 ${image ? "찾음" : "못찾음"}`);
      console.log(`[생활 살림노트-alt] 발행 중: ${manuscript.title}`);
      const result = await writePostWithAccount(account, {
        cafeId: CAFE_ID,
        menuId: MENU_ID,
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

  console.log(`=== 생활 살림노트-alt 완료: 성공 ${success} / 실패 ${fail} ===`);

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
