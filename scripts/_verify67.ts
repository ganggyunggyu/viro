import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import { readFileSync, writeFileSync } from "fs";
import mongoose from "mongoose";
import { User } from "../src/shared/models/user";
import { getAllAccounts } from "../src/shared/config/accounts";
import { acquireAccountLock, getPageForAccount, isAccountLoggedIn, loginAccount, releaseAccountLock } from "../src/shared/lib/multi-session";

const OWNER: Record<string, string> = {
  "31746910": "produce11745", "31746635": "alsrudgus531", "31754837": "ahffkdlek12",
  "31754869": "ahffkekd12", "31754875": "ahsxkfldk12", "31754939": "vegetable10517", "31755069": "pixelninja3",
};
const art = JSON.parse(readFileSync("outputs/work-cafe-zero-comment-posts-2026-07-20T00-00-00-000Z.json", "utf-8"));
const TARGETS: Array<[string, number, string]> = [];
for (const c of art.cafes) for (const a of c.zeroCommentArticles) TARGETS.push([c.cafeId, a.articleId, c.cafeSlug]);

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 10_000 });
  const user = await User.findOne({ loginId: "21lab", isActive: true }).lean();
  const accounts = await getAllAccounts(user!.userId);
  const byOwner = new Map<string, Array<[string, number, string]>>();
  for (const t of TARGETS) { const o = OWNER[t[0]]; const arr = byOwner.get(o) || []; arr.push(t); byOwner.set(o, arr); }

  const results: Array<[string, number, number]> = [];
  for (const [ownerId, targets] of byOwner) {
    const acc = accounts.find((a) => a.id === ownerId);
    if (!acc) continue;
    await acquireAccountLock(acc.id);
    try {
      if (!(await isAccountLoggedIn(acc.id))) {
        const r = await loginAccount(acc.id, acc.password, { waitForLoginMs: 20_000, reason: "v67" });
        if (!r.success) continue;
      }
      const page = await getPageForAccount(acc.id);
      for (const [cid, aid, slug] of targets) {
        const url = `https://apis.naver.com/cafe-web/cafe-articleapi/v3/cafes/${cid}/articles/${aid}?query=&useCafeId=true&requestFrom=A`;
        try {
          const data: any = await page.evaluate(async (u: string) => { const res = await fetch(u, { credentials: "include", headers: { Accept: "application/json" } }); return res.json(); }, url);
          const cnt = data?.result?.article?.commentCount ?? -1;
          results.push([slug, aid, cnt]);
        } catch { results.push([slug, aid, -1]); }
      }
    } finally { releaseAccountLock(acc.id); }
  }
  writeFileSync("outputs/verify67-result.json", JSON.stringify(results, null, 2));
  const under = results.filter(([, , c]) => c >= 0 && c < 5);
  const errs = results.filter(([, , c]) => c < 0);
  console.log(`검증 ${results.length}건 | 5+ ${results.filter(([,,c])=>c>=5).length} | 5미만 ${under.length} | 조회실패 ${errs.length}`);
  under.forEach(([s, a, c]) => console.log(`  미달 ${s} #${a} = ${c}`));
  errs.forEach(([s, a]) => console.log(`  조회실패 ${s} #${a}`));
  await mongoose.disconnect();
  process.exit(0);
};
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
