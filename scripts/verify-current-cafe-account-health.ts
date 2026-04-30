import mongoose from 'mongoose';
import { Account } from '../src/shared/models/account';
import { Cafe } from '../src/shared/models/cafe';
import { User } from '../src/shared/models/user';
import {
  acquireAccountLock,
  closeAllContexts,
  closeContextForAccount,
  getPageForAccount,
  invalidateLoginCache,
  loginAccount,
  releaseAccountLock,
} from '../src/shared/lib/multi-session';

interface AccountRow {
  accountId: string;
  password: string;
  nickname?: string;
  role?: string;
}

interface CafeRow {
  name: string;
  cafeId: string;
  cafeUrl: string;
  menuId: string;
}

interface LoginCheckRow {
  accountId: string;
  nickname: string;
  role: string;
  status: 'OK' | 'FAIL';
  detail: string;
}

interface WriterCafeCheckRow {
  accountId: string;
  nickname: string;
  cafeName: string;
  cafeId: string;
  loginStatus: 'OK' | 'FAIL';
  membershipStatus: 'JOINED' | 'NOT_JOINED' | 'UNKNOWN' | 'SKIPPED';
  writeStatus: 'WRITE_OK' | 'WRITE_BLOCKED' | 'UNKNOWN' | 'SKIPPED';
  levelStatus: 'OK' | 'NEEDS_LEVEL_UP' | 'UNKNOWN' | 'SKIPPED';
  detail: string;
}

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const CHECK_SCOPE = process.env.CHECK_SCOPE || 'all';
const TARGET_CAFE_NAMES = ['샤넬오픈런', '쇼핑지름신', '건강한노후준비', '건강관리소'];

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getBodyText = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
): Promise<string> => {
  return page.locator('body').innerText({ timeout: 8000 }).catch(() => '');
};

const compact = (text: string): string => text.replace(/\s+/g, ' ').trim();

const hasAnyVisible = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
  selector: string,
): Promise<boolean> => {
  const count = await page.locator(selector).count().catch(() => 0);

  if (count === 0) {
    return false;
  }

  for (let index = 0; index < Math.min(count, 5); index += 1) {
    if (await page.locator(selector).nth(index).isVisible().catch(() => false)) {
      return true;
    }
  }

  return false;
};

const clickFirstVisible = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
  selector: string,
): Promise<boolean> => {
  const count = await page.locator(selector).count().catch(() => 0);

  for (let index = 0; index < Math.min(count, 5); index += 1) {
    const locator = page.locator(selector).nth(index);

    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ timeout: 5000 }).catch(() => {});
      return true;
    }
  }

  return false;
};

const verifyMembership = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
  cafe: CafeRow,
): Promise<{ status: WriterCafeCheckRow['membershipStatus']; detail: string }> => {
  await page.goto(`https://m.cafe.naver.com/${cafe.cafeUrl}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(2500);

  const text = await getBodyText(page);
  const joinButtonVisible = await hasAnyVisible(
    page,
    [
      'button:has-text("카페 가입하기")',
      'a:has-text("카페 가입하기")',
      'button:has-text("가입하기")',
      'a:has-text("가입하기")',
      'a[href*="/join"]',
    ].join(', '),
  );
  const activityVisible = await hasAnyVisible(
    page,
    'a:has-text("나의활동"), button:has-text("나의활동"), text=나의활동',
  );
  const writeVisible = await hasAnyVisible(
    page,
    'a:has-text("글쓰기"), button:has-text("글쓰기"), a[href*="/articles/write"]',
  );

  if (joinButtonVisible) {
    return { status: 'NOT_JOINED', detail: '가입 버튼 보임' };
  }

  if (activityVisible || writeVisible || text.includes('나의활동')) {
    return { status: 'JOINED', detail: activityVisible ? '나의활동 표시' : '회원 UI 확인' };
  }

  if (!text.includes('카페 가입하기')) {
    return { status: 'JOINED', detail: '가입 버튼 없음' };
  }

  return { status: 'UNKNOWN', detail: compact(text).slice(0, 120) };
};

const verifyWriteAccess = async (
  page: Awaited<ReturnType<typeof getPageForAccount>>,
  cafe: CafeRow,
): Promise<{
  writeStatus: WriterCafeCheckRow['writeStatus'];
  levelStatus: WriterCafeCheckRow['levelStatus'];
  detail: string;
}> => {
  const writeUrl = `https://cafe.naver.com/ca-fe/cafes/${cafe.cafeId}/articles/write?boardType=L&menuId=${cafe.menuId}`;

  await page.goto(writeUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3500);

  const getWriteState = async (): Promise<{
    url: string;
    compactText: string;
    hasEditorSignal: boolean;
    hasBlockedText: boolean;
  }> => {
    const currentText = await getBodyText(page);
    const compactText = compact(currentText);
    const hasTitleInput = await hasAnyVisible(
      page,
      [
        '.FlexableTextArea textarea.textarea_input',
        'textarea.textarea_input',
        'textarea[placeholder*="제목"]',
        '[contenteditable="true"]',
      ].join(', '),
    );
    const hasEditorTextSignal =
      compactText.includes('카페 글쓰기') &&
      compactText.includes('임시등록') &&
      compactText.includes('등록') &&
      (compactText.includes('게시판을 선택해 주세요') || compactText.includes('말머리 선택'));
    const hasBlockedText =
      compactText.includes('글쓰기 권한이 없습니다') ||
      compactText.includes('글쓰기 제한') ||
      compactText.includes('접근할 수 없습니다') ||
      compactText.includes('카페 회원만') ||
      compactText.includes('가입 후 이용') ||
      compactText.includes('등급이 부족') ||
      compactText.includes('등급 이상') ||
      compactText.includes('등업');

    return {
      url: page.url(),
      compactText,
      hasEditorSignal: hasTitleInput || hasEditorTextSignal,
      hasBlockedText,
    };
  };

  let state = await getWriteState();

  if (!state.hasEditorSignal && !state.hasBlockedText) {
    const clicked = await clickFirstVisible(
      page,
      'a:has-text("글쓰기"), button:has-text("글쓰기"), a[href*="/articles/write"]',
    );

    if (clicked) {
      await page.waitForTimeout(3500);
      state = await getWriteState();
    }
  }

  if (state.url.includes('nidlogin')) {
    return {
      writeStatus: 'WRITE_BLOCKED',
      levelStatus: 'UNKNOWN',
      detail: '글쓰기 페이지에서 로그인 페이지로 이동',
    };
  }

  if (state.hasEditorSignal && !state.hasBlockedText) {
    return {
      writeStatus: 'WRITE_OK',
      levelStatus: 'OK',
      detail: '글쓰기 에디터 진입 가능',
    };
  }

  if (state.hasBlockedText) {
    return {
      writeStatus: 'WRITE_BLOCKED',
      levelStatus: state.compactText.includes('등급') || state.compactText.includes('등업') ? 'NEEDS_LEVEL_UP' : 'UNKNOWN',
      detail: state.compactText.slice(0, 140),
    };
  }

  return {
    writeStatus: 'UNKNOWN',
    levelStatus: 'UNKNOWN',
    detail: state.compactText.slice(0, 140) || `url=${state.url}`,
  };
};

const checkLogin = async (
  account: AccountRow,
  reason: string,
): Promise<{ success: boolean; detail: string }> => {
  let lastError = '로그인 실패';

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    invalidateLoginCache(account.accountId);

    const result = await loginAccount(account.accountId, account.password, {
      forceFreshLogin: true,
      waitForLoginMs: 60000,
      pollIntervalMs: 1000,
      reason: `${reason}_${attempt}`,
    });

    if (result.success) {
      return {
        success: true,
        detail: '로그인 성공',
      };
    }

    lastError = result.error || lastError;
    await closeContextForAccount(account.accountId).catch(() => {});
    await sleep(1500);
  }

  return {
    success: false,
    detail: lastError,
  };
};

const verifyCommenterLogins = async (commenters: AccountRow[]): Promise<LoginCheckRow[]> => {
  const rows: LoginCheckRow[] = [];

  for (const [index, account] of commenters.entries()) {
    console.log(`[COMMENTER_LOGIN] ${index + 1}/${commenters.length} ${account.accountId}`);
    await acquireAccountLock(account.accountId);

    try {
      const result = await checkLogin(account, 'commenter_login_health_check');
      rows.push({
        accountId: account.accountId,
        nickname: account.nickname || account.accountId,
        role: account.role || '-',
        status: result.success ? 'OK' : 'FAIL',
        detail: result.detail,
      });
      console.log(`[COMMENTER_LOGIN] ${account.accountId} ${result.success ? 'OK' : `FAIL ${result.detail}`}`);
    } finally {
      releaseAccountLock(account.accountId);
    }
  }

  return rows;
};

const verifyWriterCafes = async (
  writers: AccountRow[],
  cafes: CafeRow[],
): Promise<WriterCafeCheckRow[]> => {
  const rows: WriterCafeCheckRow[] = [];

  for (const [index, account] of writers.entries()) {
    console.log(`[WRITER_CHECK] ${index + 1}/${writers.length} ${account.accountId}`);
    await acquireAccountLock(account.accountId);

    try {
      const loginResult = await checkLogin(account, 'writer_cafe_membership_grade_check');

      if (!loginResult.success) {
        cafes.forEach((cafe) => {
          rows.push({
            accountId: account.accountId,
            nickname: account.nickname || account.accountId,
            cafeName: cafe.name,
            cafeId: cafe.cafeId,
            loginStatus: 'FAIL',
            membershipStatus: 'SKIPPED',
            writeStatus: 'SKIPPED',
            levelStatus: 'SKIPPED',
            detail: loginResult.detail,
          });
        });
        console.log(`[WRITER_CHECK] ${account.accountId} login FAIL ${loginResult.detail}`);
        continue;
      }

      const page = await getPageForAccount(account.accountId);

      for (const cafe of cafes) {
        console.log(`[WRITER_CAFE] ${account.accountId} / ${cafe.name}`);
        const membership = await verifyMembership(page, cafe);
        const writeAccess = membership.status === 'JOINED'
          ? await verifyWriteAccess(page, cafe)
          : {
            writeStatus: 'SKIPPED' as const,
            levelStatus: 'SKIPPED' as const,
            detail: membership.detail,
          };

        rows.push({
          accountId: account.accountId,
          nickname: account.nickname || account.accountId,
          cafeName: cafe.name,
          cafeId: cafe.cafeId,
          loginStatus: 'OK',
          membershipStatus: membership.status,
          writeStatus: writeAccess.writeStatus,
          levelStatus: writeAccess.levelStatus,
          detail: `${membership.detail} / ${writeAccess.detail}`,
        });
      }
    } finally {
      releaseAccountLock(account.accountId);
    }
  }

  return rows;
};

const main = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI missing');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!user) {
    throw new Error(`user not found: ${LOGIN_ID}`);
  }

  const [accounts, cafes] = await Promise.all([
    Account.find({ userId: user.userId, isActive: true })
      .select('accountId password nickname role')
      .sort({ role: -1, accountId: 1 })
      .lean<AccountRow[]>(),
    Cafe.find({
      userId: user.userId,
      isActive: true,
      name: { $in: TARGET_CAFE_NAMES },
    })
      .select('name cafeId cafeUrl menuId')
      .lean<CafeRow[]>(),
  ]);

  const cafeByName = new Map(cafes.map((cafe) => [cafe.name, cafe]));
  const orderedCafes = TARGET_CAFE_NAMES.map((name) => {
    const cafe = cafeByName.get(name);
    if (!cafe) {
      throw new Error(`cafe not found: ${name}`);
    }
    return cafe;
  });

  const writers = accounts.filter(({ role }) => role === 'writer');
  const commenters = accounts.filter(({ role }) => role === 'commenter');
  const commenterRows = CHECK_SCOPE === 'writers' ? [] : await verifyCommenterLogins(commenters);
  const writerRows = CHECK_SCOPE === 'commenters' ? [] : await verifyWriterCafes(writers, orderedCafes);

  console.log(
    `[VERIFY_RESULT]${JSON.stringify(
      {
        commenterSummary: {
          total: commenterRows.length,
          ok: commenterRows.filter(({ status }) => status === 'OK').length,
          fail: commenterRows.filter(({ status }) => status === 'FAIL').length,
        },
        writerSummary: {
          totalAccounts: writers.length,
          totalCafeChecks: writerRows.length,
          loginFail: writerRows.filter(({ loginStatus }) => loginStatus === 'FAIL').length,
          notJoined: writerRows.filter(({ membershipStatus }) => membershipStatus === 'NOT_JOINED').length,
          writeOk: writerRows.filter(({ writeStatus }) => writeStatus === 'WRITE_OK').length,
          writeBlocked: writerRows.filter(({ writeStatus }) => writeStatus === 'WRITE_BLOCKED').length,
          needsLevelUp: writerRows.filter(({ levelStatus }) => levelStatus === 'NEEDS_LEVEL_UP').length,
        },
        commenterRows,
        writerRows,
      },
      null,
      2,
    )}`,
  );

  await closeAllContexts();
  await mongoose.disconnect();
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('[VERIFY_CURRENT_CAFE_ACCOUNT_HEALTH]', error instanceof Error ? error.message : error);
    await closeAllContexts().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
