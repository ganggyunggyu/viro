import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const { ManualCommentJob } = await import("../src/shared/models/manual-comment-job");

  const job = await ManualCommentJob.findOne({ cafeSlug: "healthhhh", articleId: 99 }).lean();
  console.log(JSON.stringify(job, null, 2));

  await mongoose.disconnect();
  process.exit(0);
};
main().catch((e) => { console.error(e); process.exit(1); });
