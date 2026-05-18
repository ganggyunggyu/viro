import dotenv from "dotenv";
dotenv.config({ path: "/Users/ganggyunggyu/Programing/naver-search-engine/.env" });
dotenv.config({ path: ".env" });
import { google } from "googleapis";
import { parseViralResponse } from "../src/features/viral/viral-parser";
import { buildPregnancyInfoV2Prompt } from "./build-pregnancy-info-v2-prompt";
import { formatComments } from "./format-comments-claude-tab";

const SHEET_ID = "1gyipTIEogC9Qopj8w3ggBmD0k5KvAw6yNdIMXQDnwms";
const KW_TAB = "카페키워드_클로드";
const OUT_TAB = "카페원고_0518_v2";
const CONTENT_API = process.env.CONTENT_API_URL || "http://localhost:8000";
const MODEL = process.env.GEN_MODEL || "claude-sonnet-4-6";
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "";

const LIMIT = parseInt(process.env.LIMIT || "0", 10);
const OFFSET = parseInt(process.env.OFFSET || "0", 10);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const getAuth = () =>
  new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

const stripHtml = (s: string): string =>
  s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

const PROMO_HINTS = ["광고", "공구", "이벤트", "할인", "구매", "판매", "추천 제품", "택배"];

interface CafeArticle {
  title: string;
  description: string;
  cafename: string;
}

const searchCafeArticles = async (kw: string): Promise<CafeArticle[]> => {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return [];
  const url = `https://openapi.naver.com/v1/search/cafearticle.json?query=${encodeURIComponent(
    kw
  )}&display=10&sort=sim`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });
  if (!res.ok) {
    console.warn(`[검색실패] ${kw}: ${res.status}`);
    return [];
  }
  const json: any = await res.json();
  const items: any[] = json.items || [];
  return items.map((it) => ({
    title: stripHtml(it.title || ""),
    description: stripHtml(it.description || ""),
    cafename: stripHtml(it.cafename || ""),
  }));
};

const filterAndJoinRef = (articles: CafeArticle[]): string => {
  const filtered = articles.filter((a) => {
    const t = `${a.title} ${a.description}`;
    return !PROMO_HINTS.some((p) => t.includes(p));
  });
  const top = filtered.slice(0, 5);
  return top
    .map((a, i) => `[참고${i + 1}] ${a.title}\n${a.description}`)
    .join("\n\n");
};

const fetchKeywords = async (): Promise<string[]> => {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${KW_TAB}!A2:A`,
  });
  return (res.data.values || []).map((r) => r[0]).filter(Boolean);
};

const ensureHeader = async () => {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${OUT_TAB}!A1:G1`,
  });
  const rows = res.data.values || [];
  if (rows.length === 0 || !rows[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${OUT_TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          "키워드", "제목", "본문", "댓글", "댓글수", "참고검색수", "생성일",
        ]],
      },
    });
    console.log(`✓ 헤더 작성: ${OUT_TAB}`);
  }
};

const appendRow = async (row: (string | number)[]) => {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${OUT_TAB}!A:G`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
};

const callCafeTotal = async (prompt: string, ref: string): Promise<string> => {
  const res = await fetch(`${CONTENT_API}/generate/cafe-total`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword: prompt, ref, model: MODEL }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API ${res.status}: ${t.slice(0, 300)}`);
  }
  const j: any = await res.json();
  return j.content as string;
};

const processOne = async (kw: string, idx: number, total: number) => {
  const prefix = `[${idx + 1}/${total}] ${kw}`;
  console.log(`\n${prefix} 검색→생성 시작…`);
  const t0 = Date.now();

  const articles = await searchCafeArticles(kw);
  const ref = filterAndJoinRef(articles);
  console.log(`  네이버 카페 검색 ${articles.length}건, ref길이 ${ref.length}자`);

  const prompt = buildPregnancyInfoV2Prompt({ keyword: kw, ref });

  let content: string;
  try {
    content = await callCafeTotal(prompt, "");
  } catch (e) {
    console.error(`${prefix} ❌ API 실패: ${(e as Error).message}`);
    await appendRow([kw, "[API실패]", String((e as Error).message).slice(0, 4000), "", 0, articles.length, new Date().toISOString().split("T")[0]]);
    return false;
  }
  const parsed = parseViralResponse(content);
  if (!parsed) {
    console.error(`${prefix} ❌ 파싱 실패`);
    await appendRow([kw, "[파싱실패]", content.slice(0, 4000), "", 0, articles.length, new Date().toISOString().split("T")[0]]);
    return false;
  }
  const today = new Date().toISOString().split("T")[0];
  await appendRow([
    kw,
    parsed.title,
    parsed.body,
    formatComments(JSON.stringify(parsed.comments)),
    parsed.comments.length,
    articles.length,
    today,
  ]);
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${prefix} ✅ ${sec}s 본문${parsed.body.length}자 / 댓글${parsed.comments.length}개`);
  console.log(`  제목: ${parsed.title}`);
  return true;
};

const main = async () => {
  console.log(`=== Pregnancy v2 (검색레퍼런스 + 새 프롬프트) ===`);
  console.log(`모델: ${MODEL}`);
  console.log(`네이버 검색: ${NAVER_CLIENT_ID ? "활성" : "비활성"}`);

  await ensureHeader();
  let kws = await fetchKeywords();
  if (OFFSET) kws = kws.slice(OFFSET);
  if (LIMIT) kws = kws.slice(0, LIMIT);
  console.log(`처리 대상: ${kws.length}개\n`);

  let ok = 0, fail = 0;
  for (let i = 0; i < kws.length; i++) {
    const success = await processOne(kws[i], i, kws.length);
    if (success) ok++; else fail++;
    if (i < kws.length - 1) await sleep(1500);
  }

  console.log(`\n=== 완료 ===`);
  console.log(`성공: ${ok} / 실패: ${fail}`);
};

main().catch((e) => { console.error(e); process.exit(1); });
