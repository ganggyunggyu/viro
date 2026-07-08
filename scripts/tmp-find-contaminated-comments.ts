import mongoose from 'mongoose';
import { PublishedArticle } from '../src/shared/models';

const BAD_ACCOUNTS = ['h9ag469z', 'dq1h3bjy', 'hagyga', 'nes1p2kx', 'mh8j62wm'];

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });
  const docs = await PublishedArticle.find(
    { 'comments.accountId': { $in: BAD_ACCOUNTS } },
    { cafeId: 1, articleId: 1, articleUrl: 1, comments: 1 },
  ).lean();

  let total = 0;
  for (const doc of docs as any[]) {
    const bad = (doc.comments || []).filter((c: any) => BAD_ACCOUNTS.includes(c.accountId));
    if (bad.length === 0) continue;
    total += bad.length;
    console.log(`cafeId=${doc.cafeId} articleId=${doc.articleId} url=${doc.articleUrl}`);
    for (const c of bad) {
      console.log(`   [${c.accountId}] nick="${c.nickname}" createdAt=${c.createdAt} content="${c.content}"`);
    }
  }
  console.log(`\n총 오염 계정 댓글: ${total}건 / 영향 글: ${docs.length}개`);
  await mongoose.disconnect();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
