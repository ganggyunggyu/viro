import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import mongoose from "mongoose";
import { User } from "../src/shared/models/user";
import { getAllAccounts } from "../src/shared/config/accounts";
import { acquireAccountLock, getPageForAccount, isAccountLoggedIn, loginAccount, releaseAccountLock } from "../src/shared/lib/multi-session";

// 카페 → 카페장계정 (시트 "카페정보 및 링크" 기준). 카페장은 항상 회원이라 실제 댓글이 정확히 보임.
const CAFE_OWNER: Array<{ cafeId: string; slug: string; owner: string }> = [
  { cafeId: "31746910", slug: "healthhhh", owner: "produce11745" },
  { cafeId: "31746635", slug: "driveee", owner: "alsrudgus531" },
  { cafeId: "31750099", slug: "mealtalkdht", owner: "mealtalkdht" },
  { cafeId: "31750098", slug: "petinfo183", owner: "tinyfish183" },
  { cafeId: "31750100", slug: "dogwalk2m4", owner: "k7d9x2m4" },
  { cafeId: "31750113", slug: "localtable702", owner: "regular14631" },
  { cafeId: "31750111", slug: "menunote702", owner: "orangeswan630" },
  { cafeId: "31750110", slug: "tableclub702", owner: "bigfish773" },
  { cafeId: "31750109", slug: "petnote702", owner: "tinyfish183" },
  { cafeId: "31750107", slug: "walknote702", owner: "k7d9x2m4" },
  { cafeId: "31750106", slug: "carelog702", owner: "fail5644" },
  { cafeId: "31750105", slug: "habitnote702", owner: "compare14310" },
  { cafeId: "31750108", slug: "infomadang702", owner: "ghostrush7" },
  { cafeId: "31750104", slug: "talkmadang702", owner: "ahfflwl123" },
  { cafeId: "31750114", slug: "babsangnote702", owner: "mealtalkdht" },
  { cafeId: "31754837", slug: "babycare702", owner: "ahffkdlek12" },
  { cafeId: "31754869", slug: "healthcheck702", owner: "ahffkekd12" },
  { cafeId: "31754875", slug: "healthinfo702", owner: "ahsxkfldk12" },
  { cafeId: "31754939", slug: "livingnote702", owner: "vegetable10517" },
  { cafeId: "31755069", slug: "dailychat702", owner: "pixelninja3" },
  { cafeId: "31756609", slug: "purple6d2dy", owner: "ahfflwl123" },
  { cafeId: "31756592", slug: "orangezmmlx", owner: "produce11745" },
  { cafeId: "31756616", slug: "purplevhkwm", owner: "alsrudgus531" },
  { cafeId: "31756611", slug: "skybluefsxvm", owner: "regular14631" },
  { cafeId: "31756619", slug: "redsgucu", owner: "orangeswan630" },
  { cafeId: "31756721", slug: "skybluefhcei", owner: "bigfish773" },
  { cafeId: "31756734", slug: "bluegraywcwss", owner: "tinyfish183" },
  { cafeId: "31756738", slug: "orangeli9xk", owner: "k7d9x2m4" },
  { cafeId: "31756789", slug: "brownlfkjk", owner: "fail5644" },
  { cafeId: "31756795", slug: "graykrurp", owner: "compare14310" },
  { cafeId: "31756797", slug: "bluennvf0", owner: "ghostrush7" },
  { cafeId: "31756088", slug: "ahffkdlek12cafe", owner: "ahffkdlek12" },
];

const MAX_PAGES = 6;

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 10_000 });
  const user = await User.findOne({ loginId: "21lab", isActive: true }).lean();
  const accounts = await getAllAccounts(user!.userId);

  // owner별로 그룹핑 (한 계정이 여러 카페 소유 → 로그인 1회 재사용)
  const byOwner = new Map<string, typeof CAFE_OWNER>();
  for (const c of CAFE_OWNER) {
    const arr = byOwner.get(c.owner) || [];
    arr.push(c);
    byOwner.set(c.owner, arr);
  }

  const out: any[] = [];

  for (const [ownerId, cafes] of byOwner) {
    const acc = accounts.find((a) => a.id === ownerId);
    if (!acc) { console.log(`계정없음: ${ownerId}`); for (const c of cafes) out.push({ ...c, error: "owner-account-missing" }); continue; }
    await acquireAccountLock(acc.id);
    try {
      if (!(await isAccountLoggedIn(acc.id))) {
        const r = await loginAccount(acc.id, acc.password, { waitForLoginMs: 20_000, reason: "review" });
        if (!r.success) { console.log(`로그인실패 ${ownerId}: ${r.error}`); for (const c of cafes) out.push({ ...c, error: "login-failed" }); continue; }
      }
      const page = await getPageForAccount(acc.id);

      for (const cafe of cafes) {
        const articles: any[] = [];
        for (let p = 1; p <= MAX_PAGES; p++) {
          const listUrl = `https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=${cafe.cafeId}&search.queryType=lastArticle&search.page=${p}&search.perPage=20&search.boardtype=L`;
          const data: any = await page.evaluate(async (u: string) => {
            try { const res = await fetch(u, { credentials: "include", headers: { Accept: "application/json" } }); return res.json(); } catch (e) { return { error: String(e) }; }
          }, listUrl);
          const list = data?.message?.result?.articleList || [];
          if (!list.length) break;
          for (const it of list) articles.push({ articleId: it.articleId, subject: it.subject, writer: it.writerNickname || it.nickname, commentCount: it.commentCount || 0, writeDate: it.writeDate });
          if (list.length < 20) break;
        }
        console.log(`[${cafe.slug}] ${articles.length}글`);
        out.push({ ...cafe, articleCount: articles.length, articles });
      }
    } finally { releaseAccountLock(acc.id); }
  }

  const dir = join(process.cwd(), "outputs");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "review-all-cafes-counts.json");
  writeFileSync(path, JSON.stringify(out, null, 2), "utf-8");
  console.log(`저장: ${path}`);
  await mongoose.disconnect();
  process.exit(0);
};
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
