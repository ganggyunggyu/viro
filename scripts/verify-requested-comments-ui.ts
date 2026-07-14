import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Account } from '../src/shared/models/account';
import { User } from '../src/shared/models/user';
import {
  acquireAccountLock,
  getPageForAccount,
  isAccountLoggedIn,
  loginAccount,
  releaseAccountLock,
} from '../src/shared/lib/multi-session';

dotenv.config({ path: '.env.local' });

type Target = {
  owner: '오팀장님' | '민팀장님';
  label: string;
  cafeId: string;
  articleId: number;
  expectedCount: number;
};

const targets: Target[] = [
  { owner: '오팀장님', label: '육아 돌봄수첩 #18', cafeId: '31754837', articleId: 18, expectedCount: 7 },
  { owner: '오팀장님', label: '건강 체크노트 #4', cafeId: '31754869', articleId: 4, expectedCount: 6 },
  { owner: '오팀장님', label: '신정호 카페 #40', cafeId: '31750100', articleId: 40, expectedCount: 8 },
  { owner: '민팀장님', label: 'driveee #112', cafeId: '31746635', articleId: 112, expectedCount: 5 },
  { owner: '민팀장님', label: 'motherrr #12', cafeId: '31751094', articleId: 12, expectedCount: 5 },
  { owner: '민팀장님', label: 'driveee #116', cafeId: '31746635', articleId: 116, expectedCount: 5 },
  { owner: '민팀장님', label: 'healthhhh #114', cafeId: '31746910', articleId: 114, expectedCount: 5 },
  { owner: '민팀장님', label: 'driveee #117', cafeId: '31746635', articleId: 117, expectedCount: 5 },
  { owner: '민팀장님', label: 'healthhhh #116', cafeId: '31746910', articleId: 116, expectedCount: 10 },
  { owner: '민팀장님', label: 'motherrr #18', cafeId: '31751094', articleId: 18, expectedCount: 5 },
  { owner: '민팀장님', label: 'driveee #119', cafeId: '31746635', articleId: 119, expectedCount: 5 },
  { owner: '민팀장님', label: 'healthhhh #125', cafeId: '31746910', articleId: 125, expectedCount: 5 },
  { owner: '민팀장님', label: 'driveee #124', cafeId: '31746635', articleId: 124, expectedCount: 5 },
];

const onlyKeys = new Set(
  process.argv
    .filter((value) => value.startsWith('--only='))
    .flatMap((value) => value.slice('--only='.length).split(',')),
);
const selectedTargets = onlyKeys.size
  ? targets.filter((target) => onlyKeys.has(`${target.cafeId}/${target.articleId}`))
  : targets;

type UiResult = Target & {
  actualCount: number | null;
  status: '확인' | '접근실패';
  error?: string;
  comments: string[];
};

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();

const main = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  const user = await User.findOne({ loginId: '21lab', isActive: true }).lean();
  if (!user) throw new Error('active user 21lab not found');
  const account = await Account.findOne({ userId: user.userId, isActive: true }).lean();
  if (!account) throw new Error('active Naver account not found');

  const results: UiResult[] = [];
  await acquireAccountLock(account.accountId);
  try {
    if (!(await isAccountLoggedIn(account.accountId))) {
      const login = await loginAccount(account.accountId, account.password);
      if (!login.success) throw new Error(`Naver login failed: ${login.error || 'unknown'}`);
    }

    const page = await getPageForAccount(account.accountId);
    for (const target of selectedTargets) {
      try {
        const url = `https://cafe.naver.com/ca-fe/cafes/${target.cafeId}/articles/${target.articleId}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(2_000);

        const frameHandle = await page.$('iframe#cafe_main');
        const root = (await frameHandle?.contentFrame()) ?? page;
        const comments = await root.evaluate(() =>
          Array.from(document.querySelectorAll('.CommentItem:not(.CommentItem--reply)'))
            .map((item) => item.querySelector('.comment_text_view')?.textContent || '')
            .map((content) => content.replace(/\s+/g, ' ').trim())
            .filter(Boolean),
        );

        results.push({ ...target, actualCount: comments.length, status: '확인', comments });
      } catch (error) {
        results.push({
          ...target,
          actualCount: null,
          status: '접근실패',
          error: error instanceof Error ? error.message : String(error),
          comments: [],
        });
      }
    }
  } finally {
    releaseAccountLock(account.accountId);
    await mongoose.disconnect();
  }

  const outputDir = join(process.cwd(), 'outputs');
  mkdirSync(outputDir, { recursive: true });
  const reportPath = join(outputDir, '2026-07-14-comment-ui-verification.json');
  writeFileSync(reportPath, `${JSON.stringify(results, null, 2)}\n`, 'utf-8');

  for (const result of results) {
    console.log(`${result.status}\t${result.owner}\t${result.label}\texpected=${result.expectedCount}\tactual=${result.actualCount ?? '-'}${result.error ? `\t${normalize(result.error)}` : ''}`);
  }
  console.log(`UI_REPORT=${reportPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
