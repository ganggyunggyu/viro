import mongoose from "mongoose";
import { Account } from "../src/shared/models/account";
import { writePostWithAccount } from "../src/shared/lib/naver-cafe-writing/post-writer";
import { closeAllContexts } from "../src/shared/lib/multi-session";
import { parseViralResponse } from "../src/features/viral/viral-parser";

const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";
const IMAGE_GEN_URL = process.env.IMAGE_GEN_URL || "http://localhost:3939";

const CAFE_ID = "31754875";
const MENU_ID = "1";
const ACCOUNT_ID = "ahsxkfldk12";
const ENDPOINT = "/generate/hanryeo";
const SERVICE = "건강";
const KEYWORD = "종합비타민 성분 비교하기";

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

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const acc = await Account.findOne({ accountId: ACCOUNT_ID }).lean();
  if (!acc) {
    console.log("계정 없음");
    process.exit(1);
  }
  const account = { id: ACCOUNT_ID, password: (acc as any).password, nickname: (acc as any).nickname };

  const res = await fetch(`${TEXT_GEN_HUB_URL}${ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: SERVICE, keyword: KEYWORD, ref: "", category: SERVICE }),
  });
  const data = (await res.json()) as { content?: string };
  const parsed = data.content ? parseViralResponse(data.content) : null;
  let title: string, body: string;
  if (parsed?.title && parsed.body) {
    title = parsed.title;
    body = parsed.body;
  } else {
    const lines = (data.content || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    title = stripMarkdown(lines[0] || KEYWORD).slice(0, 80);
    body = stripMarkdown(lines.slice(1).join("\n\n") || data.content || "");
  }

  const image = await fetchImageAsBase64(KEYWORD);
  console.log(`이미지 ${image ? "찾음" : "못찾음"}`);

  const result = await writePostWithAccount(account, {
    cafeId: CAFE_ID,
    menuId: MENU_ID,
    subject: title,
    content: body,
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

  console.log(result.success ? `[OK] articleId=${result.articleId}` : `[FAIL] ${result.error}`);

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
