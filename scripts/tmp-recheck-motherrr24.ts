import mongoose from 'mongoose';
import { Account } from '../src/shared/models';
import { listLiveComments } from '../src/shared/lib/naver-cafe-writing/comment-deleter';

const USER_ID = 'user-1768955529317';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const readers = await Account.find({ userId: USER_ID, isActive: true, role: 'commenter' })
    .select('accountId password nickname')
    .skip(5)
    .limit(4)
    .lean();

  for (const r of readers) {
    const res = await listLiveComments(
      { id: r.accountId, password: r.password, nickname: r.nickname || r.accountId },
      '31751094',
      24,
    );
    console.log(r.accountId, '->', JSON.stringify({ success: res.success, error: (res).error, count: res.comments ? res.comments.length : null }));
  }

  await mongoose.disconnect();
})();
