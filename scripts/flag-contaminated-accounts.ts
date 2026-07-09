import mongoose from 'mongoose';
import { Account } from '../src/shared/models';

const CONTAMINATED_ACCOUNT_IDS = ['h9ag469z', 'dq1h3bjy', 'hagyga', 'nes1p2kx', 'mh8j62wm'];
const CAMPAIGN_TAG = '안과의원 노출용 (타업체)';

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const result = await Account.updateMany(
    { accountId: { $in: CONTAMINATED_ACCOUNT_IDS } },
    { $set: { excludeFromAutoComment: true, campaignTag: CAMPAIGN_TAG } },
  );

  console.log(`flagged ${result.modifiedCount} accounts (matched ${result.matchedCount})`);

  const remaining = await Account.find(
    { accountId: { $in: CONTAMINATED_ACCOUNT_IDS } },
    { accountId: 1, nickname: 1, excludeFromAutoComment: 1, campaignTag: 1 },
  ).lean();
  console.log(JSON.stringify(remaining, null, 2));

  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('flag-contaminated-accounts failed:', error);
    process.exit(1);
  });
