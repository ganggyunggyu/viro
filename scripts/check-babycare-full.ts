import mongoose from "mongoose";
import { browseCafePosts } from "../src/shared/lib/cafe-browser";

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { Account } = await import("../src/shared/models/account");

  const acc = await Account.findOne({ accountId: "ahffkdlek12" }).lean();
  const result = await browseCafePosts(
    { id: "ahffkdlek12", password: (acc as any).password },
    "31754837",
    undefined,
    { page: 1, perPage: 50 },
  );
  if (result.success) {
    console.log(`[육아 돌봄수첩] 전체 ${result.articles.length}개`);
    result.articles.forEach((a: any) => console.log(`  - articleId=${a.articleId} subject=${a.subject}`));
  } else {
    console.log("실패:", result.error);
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
