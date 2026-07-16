import mongoose from 'mongoose';
import { Account } from '../src/shared/models';
import { listLiveComments } from '../src/shared/lib/naver-cafe-writing/comment-deleter';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  const acc = await Account.findOne({ accountId: 'bigfish773' }).select('accountId password nickname').lean();
  const res = await listLiveComments(
    { id: acc.accountId, password: acc.password, nickname: acc.nickname || acc.accountId },
    '31751094',
    24,
  );
  console.log(JSON.stringify(res, null, 1));

  await mongoose.disconnect();
})();
