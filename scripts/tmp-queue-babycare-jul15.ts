import mongoose from 'mongoose';
import { createManualCommentJobRecord } from '../src/features/manual-comment-job/actions';

const cafeId = '31754837';
const cafeSlug = 'babycare702';
const userId = 'user-1768955529317';

const articleIds = [57, 56, 55, 54, 53, 52, 51, 50, 49];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });

  for (const articleId of articleIds) {
    const articleUrl = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
    const result = await createManualCommentJobRecord(
      userId,
      { articleUrl, cafeSlug, cafeId, articleId },
      {
        articleUrl,
        mode: 'generate',
        generateMinCount: 5,
        generateMaxCount: 10,
        delayMinMinutes: 0.5,
        delayMaxMinutes: 0.5,
      },
    );
    console.log(articleId, result);
  }

  await mongoose.disconnect();
};
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
