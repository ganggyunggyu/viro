import mongoose from 'mongoose';
const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db!;

  const cafe = await db.collection('cafes').findOne({ cafeUrl: /babycare702/ });
  console.log('카페 정보:', cafe ? { cafeId: cafe.cafeId, name: cafe.name, cafeUrl: cafe.cafeUrl, userId: cafe.userId } : '못 찾음');

  if (!cafe) {
    await mongoose.disconnect();
    return;
  }

  const articles = await db.collection('publishedarticles')
    .find({
      cafeId: cafe.cafeId,
      createdAt: { $gte: new Date('2026-07-15T00:00:00+09:00'), $lt: new Date('2026-07-16T00:00:00+09:00') },
    })
    .project({ articleId: 1, title: 1, createdAt: 1, writerAccountId: 1, commentCount: 1 })
    .sort({ articleId: 1 })
    .toArray();
  console.log('\n7월 15일자 글', articles.length, '건:');
  articles.forEach((a) => console.log(` - article ${a.articleId} | ${a.title} | writer=${a.writerAccountId} | 댓글 ${a.commentCount} | ${a.createdAt.toISOString()}`));

  await mongoose.disconnect();
};
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
