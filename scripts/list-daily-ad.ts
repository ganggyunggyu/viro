import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { PublishedArticle } from '../src/shared/models/published-article';

dotenv.config({ path: '.env.local' });
dotenv.config();

const CAFE_MAP: Record<string, string> = {
  '25460974': '샤넬오픈런',
  '25729954': '쇼핑지름신',
  '25636798': '건강한노후준비',
  '25227349': '건강관리소',
};

const main = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });
  const daysArg = Number(process.argv[2] ?? 14);
  const since = new Date(Date.now() - daysArg * 24 * 60 * 60 * 1000);
  const rows = await PublishedArticle.find({
    postType: 'daily-ad',
    publishedAt: { $gte: since },
    status: 'published',
  })
    .sort({ publishedAt: -1 })
    .lean();
  console.log(`최근 ${daysArg}일 daily-ad: ${rows.length}건`);
  for (const r of rows) {
    const date = new Date(r.publishedAt).toISOString().slice(0, 16).replace('T', ' ');
    const cafe = CAFE_MAP[r.cafeId] || r.cafeId;
    console.log(`${date} | ${cafe} | #${r.articleId} | ${r.writerAccountId} | ${r.keyword} | ${r.title}`);
  }
  await mongoose.disconnect();
};

main().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
