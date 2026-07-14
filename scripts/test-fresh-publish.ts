import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");
  const { writePostWithAccount } = await import("../src/shared/lib/naver-cafe-writing/post-writer");
  const { closeAllContexts } = await import("../src/shared/lib/multi-session");

  const TEXT_GEN_HUB_URL = process.env.TEXT_GEN_HUB_URL || "http://localhost:8000";
  const cafeId = "31755069"; // 일상 소소담
  const menuId = "1";
  const accountId = "pixelninja3";
  const keyword = "유모차 선택 가이드";

  const acc = await Account.findOne({ accountId }).lean();
  if (!acc) {
    console.log("계정 없음");
    process.exit(1);
  }
  const account = { id: accountId, password: (acc as any).password, nickname: (acc as any).nickname };

  console.log("이미지 3장 확보 중...");
  const imgRes = await fetch(`${TEXT_GEN_HUB_URL}/generate/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, count: 3 }),
    signal: AbortSignal.timeout(150000),
  });
  const imgData = (await imgRes.json()) as { images?: Array<{ url: string }> };
  const images = (imgData.images || []).map((i) => i.url);
  console.log(`이미지 ${images.length}장 확보`);

  console.log("테테 생성 중...");
  const teteRes = await fetch(`${TEXT_GEN_HUB_URL}/generate/tete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: "육아", keyword, ref: "" }),
    signal: AbortSignal.timeout(120000),
  });
  const teteData = (await teteRes.json()) as { content?: string };
  const raw = teteData.content || "";
  const lines = raw.split(/\r?\n/);
  const firstNonEmpty = lines.findIndex((l) => l.trim());
  const title = (lines[firstNonEmpty] || "").trim();
  const body = lines.slice(firstNonEmpty + 1).join("\n").trim();
  console.log(`제목: ${title}`);

  const result = await writePostWithAccount(account, {
    cafeId,
    menuId,
    subject: title,
    content: body,
    images,
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

  console.log(result.success ? `[OK] articleId=${result.articleId} url=${result.articleUrl}` : `[FAIL] ${result.error}`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
