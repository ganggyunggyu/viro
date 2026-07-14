import mongoose from 'mongoose';
import { User } from '../src/shared/models';
import { runDeepSeekAgentCommentJob } from '../src/shared/lib/deepseek-agent-comment';
import { closeAllContexts } from '../src/shared/lib/multi-session';

const args = process.argv.slice(2);
const getArgValue = (name: string, fallback?: string): string | undefined => {
  const prefix = `${name}=`;
  const inline = args.find((a) => a.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : fallback;
};

const CAFE_ID = getArgValue('--cafe-id');
const ARTICLE_ID = Number(getArgValue('--article-id'));
const CAFE_SLUG = getArgValue('--cafe-slug', CAFE_ID);
const LOGIN_ID = getArgValue('--login-id', '21lab')!;

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!CAFE_ID || !ARTICLE_ID) throw new Error('--cafe-id, --article-id 필요');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true }).select('userId').lean<{ userId: string } | null>();
  if (!user) throw new Error('user not found');

  const result = await runDeepSeekAgentCommentJob({
    userId: user.userId,
    cafeId: CAFE_ID,
    cafeSlug: CAFE_SLUG!,
    articleId: ARTICLE_ID,
  });

  console.log(`완료: 성공 ${result.successCount}개, summary="${result.summary}"`);

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('run-deepseek-agent-comment-job failed:', error);
    process.exit(1);
  });
