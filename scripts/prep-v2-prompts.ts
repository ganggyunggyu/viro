import dotenv from "dotenv";
dotenv.config({ path: "/Users/ganggyunggyu/Programing/naver-search-engine/.env" });
dotenv.config({ path: ".env" });
import { google } from "googleapis";
import { mkdirSync, writeFileSync } from "fs";
import { buildPregnancyInfoV2Prompt } from "./build-pregnancy-info-v2-prompt";

const SHEET_ID = "1gyipTIEogC9Qopj8w3ggBmD0k5KvAw6yNdIMXQDnwms";
const KW_TAB = "카페키워드_클로드";
const OUT_DIR = "/tmp/v2-prompts";
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "";

const stripHtml = (s: string): string =>
  s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

const PROMO_HINTS = ["광고", "공구", "이벤트", "할인", "구매", "판매", "추천 제품"];

const searchCafeArticles = async (kw: string) => {
  if (!NAVER_CLIENT_ID) return [];
  const url = `https://openapi.naver.com/v1/search/cafearticle.json?query=${encodeURIComponent(
    kw
  )}&display=10&sort=sim`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });
  if (!res.ok) return [];
  const j: any = await res.json();
  return (j.items || []).map((it: any) => ({
    title: stripHtml(it.title || ""),
    description: stripHtml(it.description || ""),
  }));
};

const buildRef = (arts: { title: string; description: string }[]) => {
  const filtered = arts.filter((a) => {
    const t = `${a.title} ${a.description}`;
    return !PROMO_HINTS.some((p) => t.includes(p));
  });
  return filtered
    .slice(0, 5)
    .map((a, i) => `[참고${i + 1}] ${a.title}\n${a.description}`)
    .join("\n\n");
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${KW_TAB}!A2:A`,
  });
  const kws = (res.data.values || []).map((r) => r[0]).filter(Boolean);
  console.log(`키워드 ${kws.length}개`);

  const manifest: { idx: number; keyword: string; promptFile: string; outFile: string; refCount: number }[] = [];

  for (let i = 0; i < kws.length; i++) {
    const kw = kws[i];
    const arts = await searchCafeArticles(kw);
    const ref = buildRef(arts);
    const prompt = buildPregnancyInfoV2Prompt({ keyword: kw, ref });
    const idx = String(i + 1).padStart(2, "0");
    const promptFile = `${OUT_DIR}/${idx}-${kw}.prompt.md`;
    const outFile = `${OUT_DIR}/${idx}-${kw}.output.txt`;
    writeFileSync(promptFile, prompt);
    manifest.push({ idx: i + 1, keyword: kw, promptFile, outFile, refCount: arts.length });
    console.log(`[${idx}] ${kw} (ref ${arts.length}건, prompt ${prompt.length}자) → ${promptFile}`);
    await new Promise((r) => setTimeout(r, 200));
  }

  writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ manifest 작성: ${OUT_DIR}/manifest.json`);
};

main().catch((e) => { console.error(e); process.exit(1); });
