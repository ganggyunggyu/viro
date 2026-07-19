import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import mongoose from "mongoose";
import { User } from "../src/shared/models/user";
import { getAllAccounts } from "../src/shared/config/accounts";
import { acquireAccountLock, getPageForAccount, isAccountLoggedIn, loginAccount, releaseAccountLock } from "../src/shared/lib/multi-session";

// 앞 스캔 결과에서 "댓글 1개 이상 있는 글"의 댓글 텍스트를 카페장 계정으로 전부 덤프.
const counts = JSON.parse(readFileSync("outputs/review-all-cafes-counts.json", "utf-8"));

const OWNER: Record<string, string> = {};
for (const c of counts) if (!c.error) OWNER[c.cafeId] = c.owner;

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 10_000 });
  const user = await User.findOne({ loginId: "21lab", isActive: true }).lean();
  const accounts = await getAllAccounts(user!.userId);

  // owner별 그룹핑
  const byOwner = new Map<string, any[]>();
  for (const c of counts) {
    if (c.error) continue;
    const arr = byOwner.get(c.owner) || [];
    arr.push(c);
    byOwner.set(c.owner, arr);
  }

  const dump: any[] = [];

  for (const [ownerId, cafes] of byOwner) {
    const acc = accounts.find((a) => a.id === ownerId);
    if (!acc) continue;
    await acquireAccountLock(acc.id);
    try {
      if (!(await isAccountLoggedIn(acc.id))) {
        const r = await loginAccount(acc.id, acc.password, { waitForLoginMs: 20_000, reason: "dump" });
        if (!r.success) continue;
      }
      const page = await getPageForAccount(acc.id);
      for (const cafe of cafes) {
        const withComments = (cafe.articles || []).filter((a: any) => (a.commentCount || 0) >= 1);
        for (const a of withComments) {
          const url = `https://apis.naver.com/cafe-web/cafe-articleapi/v3/cafes/${cafe.cafeId}/articles/${a.articleId}/comments/pages/1?requestFrom=A&orderBy=asc&count=100`;
          const data: any = await page.evaluate(async (u: string) => {
            try { const res = await fetch(u, { credentials: "include", headers: { Accept: "application/json" } }); return res.json(); } catch (e) { return { error: String(e) }; }
          }, url);
          const items = data?.result?.comments?.items || data?.comments?.items || [];
          const artWriterKey = items.find((c: any) => c?.article)?.article?.writer?.memberKey;
          dump.push({
            slug: cafe.slug, cafeId: cafe.cafeId, articleId: a.articleId,
            subject: a.subject, commentCount: a.commentCount,
            comments: items.map((c: any) => ({
              id: c.id, nick: c.writer?.nick, memberKey: c.writer?.memberKey,
              refId: c.refId, content: String(c.content || "").replace(/\s+/g, " ").trim(),
            })),
          });
        }
        console.log(`[${cafe.slug}] 덤프 ${withComments.length}글`);
      }
    } finally { releaseAccountLock(acc.id); }
  }

  const dir = join(process.cwd(), "outputs");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "review-comments-dump.json");
  writeFileSync(path, JSON.stringify(dump, null, 2), "utf-8");
  console.log(`저장: ${path} (${dump.length}글)`);
  await mongoose.disconnect();
  process.exit(0);
};
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
