import mongoose from "mongoose";
import { browseCafePosts } from "../src/shared/lib/cafe-browser";

const CAFES = [
  { cafeId: "31754837", name: "육아 돌봄수첩", owner: "ahffkdlek12" },
  { cafeId: "31754869", name: "건강 체크노트", owner: "ahffkekd12" },
  { cafeId: "31754875", name: "건강 정보노트", owner: "ahsxkfldk12" },
  { cafeId: "31754939", name: "생활 살림노트", owner: "vegetable10517" },
  { cafeId: "31755069", name: "일상 소소담", owner: "pixelninja3" },
];

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");

  for (const cafe of CAFES) {
    const acc = await Account.findOne({ accountId: cafe.owner }).lean();
    if (!acc) {
      console.log(`[${cafe.name}] 계정 없음`);
      continue;
    }
    const result = await browseCafePosts(
      { id: cafe.owner, password: (acc as any).password },
      cafe.cafeId,
      undefined,
      { page: 1, perPage: 50 },
    );
    if (!result.success) {
      console.log(`[${cafe.name}] 조회 실패: ${result.error}`);
      continue;
    }
    const myPosts = result.articles.filter((a: any) => a.memberKey === cafe.owner || a.nickname);
    console.log(`[${cafe.name}] 전체 글 수: ${result.articles.length}`);
    result.articles.forEach((a: any) => console.log(`  - articleId=${a.articleId} nickname=${a.nickname} subject=${a.subject}`));
  }

  const { closeAllContexts } = await import("../src/shared/lib/multi-session");
  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
