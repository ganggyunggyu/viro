import mongoose from 'mongoose';
import { PublishedArticle } from '../src/shared/models';

const RUN_ID = '2026-07-09T14-19-31-201Z';
const CONTAMINATED = ['h9ag469z', 'dq1h3bjy', 'hagyga', 'nes1p2kx', 'mh8j62wm'];

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });
  const docs = await PublishedArticle.find(
    { 'comments.sequenceId': RUN_ID, 'comments.accountId': { $in: CONTAMINATED } },
    { cafeId: 1, articleId: 1, articleUrl: 1, comments: 1 },
  ).lean();

  let total = 0;
  for (const doc of docs as any[]) {
    const bad = (doc.comments || []).filter(
      (c: any) => c.sequenceId === RUN_ID && CONTAMINATED.includes(c.accountId),
    );
    if (bad.length === 0) continue;
    total += bad.length;
    for (const c of bad) {
      console.log(`${doc.cafeId}\t${doc.articleId}\t${c.accountId}\t${c.content.slice(0, 40)}`);
    }
  }
  console.log(`\n총 오염 계정 댓글(이번 런): ${total}건`);
  await mongoose.disconnect();
};

main().catch((e) => { console.error(e); process.exit(1); });
