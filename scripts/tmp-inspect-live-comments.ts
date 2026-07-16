import mongoose from 'mongoose';
import { Account, Cafe } from '../src/shared/models';
import { listLiveComments } from '../src/shared/lib/naver-cafe-writing/comment-deleter';

const USER_ID = 'user-1768955529317';

const TARGETS = [
  { cafeSlug: 'driveee', articleId: 120 },
  { cafeSlug: 'motherrr', articleId: 24 },
  { cafeSlug: 'driveee', articleId: 127 },
  { cafeSlug: 'driveee', articleId: 130 },
  { cafeSlug: 'healthhhh', articleId: 103 },
  { cafeSlug: 'driveee', articleId: 100 },
  { cafeSlug: 'menunote702', articleId: 30 },
  { cafeSlug: 'mealtalkdht', articleId: 26 },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const readers = await Account.find({ userId: USER_ID, isActive: true, role: 'commenter' })
    .select('accountId password nickname')
    .limit(5)
    .lean();

  for (const t of TARGETS) {
    const cafe = await Cafe.findOne({ userId: USER_ID, cafeUrl: { $regex: t.cafeSlug, $options: 'i' } }).lean();
    if (!cafe) { console.log(t.cafeSlug, t.articleId, 'CAFE NOT FOUND'); continue; }

    let comments: Array<{ commentId: string; nickname: string; content: string }> = [];
    for (const r of readers) {
      const res = await listLiveComments(
        { id: r.accountId, password: r.password, nickname: r.nickname || r.accountId },
        cafe.cafeId,
        t.articleId,
      );
      if (res.success && res.comments) { comments = res.comments; break; }
    }
    console.log(`\n=== ${t.cafeSlug}/${t.articleId} (cafeId=${cafe.cafeId}) - 라이브 댓글 ${comments.length}개 ===`);
    comments.forEach((c, i) => console.log(`  [${i}] commentId=${c.commentId} nickname=${c.nickname} content=${c.content}`));
  }

  await mongoose.disconnect();
})();
