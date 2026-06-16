import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import type { Page } from 'playwright';

import {
  acquireAccountLock,
  closeAllContexts,
  getPageForAccount,
  loginAccount,
  releaseAccountLock,
} from '@/shared/lib/multi-session';
import { Cafe } from '@/shared/models/cafe';
import { User } from '@/shared/models/user';

interface InputAccountRow {
  rowNumber: number;
  nickname: string;
  blogUrl: string;
  accountId: string;
  password: string;
  category: string;
  mvpn: string;
  owner: string;
}

interface CafeRow {
  name: string;
  cafeId: string;
  cafeUrl: string;
  menuId: string;
  categoryMenuIds?: Record<string, string> | Map<string, string>;
  commentableMenuIds?: number[];
}

type LoginStatus = 'OK' | 'FAIL';
type EditorStatus = 'EDITOR_OK' | 'WRITE_BLOCKED' | 'UNKNOWN' | 'SKIPPED';
type CheckMethod = 'cafe_home_write_button' | 'direct_write_url' | 'skipped';

interface CheckRow {
  rowNumber: number;
  accountId: string;
  nickname: string;
  blogUrl: string;
  category: string;
  mvpn: string;
  owner: string;
  cafeName: string;
  cafeId: string;
  loginStatus: LoginStatus;
  editorStatus: EditorStatus;
  method: CheckMethod;
  detail: string;
  currentUrl: string;
}

interface LoginResult {
  ok: boolean;
  detail: string;
}

interface EditorState {
  hasEditorSignal: boolean;
  hasBlockedText: boolean;
  detail: string;
  currentUrl: string;
}

const LOGIN_ID = process.env.LOGIN_ID || '21lab';
const DEFAULT_TARGET_CAFE_NAMES = ['샤넬오픈런', '쇼핑지름신'];
const TARGET_CAFE_NAMES = (process.env.TARGET_CAFE_NAMES || DEFAULT_TARGET_CAFE_NAMES.join(','))
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const LOGIN_WAIT_MS = Number(process.env.LOGIN_WAIT_MS || 60_000);
const FORCE_FRESH_LOGIN = process.env.FORCE_FRESH_LOGIN === 'true';
const WAIT_BETWEEN_ACCOUNTS_MS = Number(process.env.WAIT_BETWEEN_ACCOUNTS_MS || 3_000);
const WRITE_PAGE_WAIT_MS = Number(process.env.WRITE_PAGE_WAIT_MS || 2_500);
const MAX_MENU_CANDIDATES_PER_CAFE = Number(process.env.MAX_MENU_CANDIDATES_PER_CAFE || 30);
const REPORT_DIR = process.env.REPORT_DIR || 'reports';

const FALLBACK_WRITE_MENU_IDS_BY_CAFE_NAME: Record<string, number[]> = {
  샤넬오픈런: [60, 42, 95, 112, 72, 99, 136, 84, 34, 70, 148, 85, 86, 125, 87, 52],
  쇼핑지름신: [847, 919, 153, 948, 278, 949, 337, 165, 715, 63, 251, 186, 751, 588],
};

const compact = (text: string): string => text.replace(/\s+/g, ' ').trim();

const normalize = (value: unknown): string => String(value ?? '').trim();

const readStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    return '';
  }

  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
};

const parseArrayRow = (row: unknown[], index: number): InputAccountRow => ({
  rowNumber: Number(row[0]) || index + 1,
  nickname: normalize(row[1]),
  blogUrl: normalize(row[2]),
  accountId: normalize(row[3]),
  password: normalize(row[4]),
  category: normalize(row[5]),
  mvpn: normalize(row[6]),
  owner: normalize(row[7]),
});

const parseObjectRow = (row: Record<string, unknown>, index: number): InputAccountRow => ({
  rowNumber: Number(row.rowNumber) || index + 1,
  nickname: normalize(row.nickname),
  blogUrl: normalize(row.blogUrl),
  accountId: normalize(row.accountId),
  password: normalize(row.password),
  category: normalize(row.category),
  mvpn: normalize(row.mvpn),
  owner: normalize(row.owner),
});

const parseInputRows = (rawText: string): InputAccountRow[] => {
  if (!rawText.trim()) {
    throw new Error('stdin JSON input missing');
  }

  const raw = JSON.parse(rawText) as unknown;

  if (!Array.isArray(raw)) {
    throw new Error('stdin JSON must be an array');
  }

  return raw
    .map((row, index) => {
      if (Array.isArray(row)) {
        return parseArrayRow(row, index);
      }

      if (row && typeof row === 'object') {
        return parseObjectRow(row as Record<string, unknown>, index);
      }

      throw new Error(`invalid row at index ${index}`);
    })
    .filter(({ accountId, password }) => accountId && password);
};

const dedupeRows = (rows: InputAccountRow[]): {
  accounts: InputAccountRow[];
  duplicateAccountIds: string[];
} => {
  const seen = new Set<string>();
  const duplicateAccountIds: string[] = [];
  const accounts: InputAccountRow[] = [];

  for (const row of rows) {
    if (seen.has(row.accountId)) {
      duplicateAccountIds.push(row.accountId);
      continue;
    }

    seen.add(row.accountId);
    accounts.push({
      ...row,
      nickname: row.nickname || row.accountId,
    });
  }

  return { accounts, duplicateAccountIds };
};

const connect = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI missing');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
};

const loadTargetCafes = async (): Promise<CafeRow[]> => {
  const user = await User.findOne({ loginId: LOGIN_ID, isActive: true })
    .select('userId')
    .lean<{ userId: string } | null>();

  if (!user) {
    throw new Error(`user not found: ${LOGIN_ID}`);
  }

  const cafes = await Cafe.find({
    userId: user.userId,
    isActive: true,
    name: { $in: TARGET_CAFE_NAMES },
  })
    .select('name cafeId cafeUrl menuId')
    .select('categoryMenuIds commentableMenuIds')
    .lean<CafeRow[]>();

  const cafeByName = new Map(cafes.map((cafe) => [cafe.name, cafe]));

  return TARGET_CAFE_NAMES.map((name) => {
    const cafe = cafeByName.get(name);

    if (!cafe) {
      throw new Error(`cafe not found: ${name}`);
    }

    return cafe;
  });
};

const mapValues = (value: CafeRow['categoryMenuIds']): string[] => {
  if (!value) {
    return [];
  }

  if (value instanceof Map) {
    return [...value.values()].map(String);
  }

  return Object.values(value).map(String);
};

const getMenuCandidates = (cafe: CafeRow): string[] => {
  const candidates = [
    ...mapValues(cafe.categoryMenuIds),
    ...(cafe.commentableMenuIds || []).map(String),
    ...(FALLBACK_WRITE_MENU_IDS_BY_CAFE_NAME[cafe.name] || []).map(String),
    cafe.menuId,
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    unique.push(candidate);
  }

  return unique.slice(0, MAX_MENU_CANDIDATES_PER_CAFE);
};

const hasAnyVisible = async (page: Page, selector: string): Promise<boolean> => {
  const count = await page.locator(selector).count().catch(() => 0);

  for (let index = 0; index < Math.min(count, 10); index += 1) {
    const locator = page.locator(selector).nth(index);

    if (await locator.isVisible().catch(() => false)) {
      return true;
    }
  }

  return false;
};

const clickFirstVisible = async (page: Page, selector: string): Promise<boolean> => {
  const count = await page.locator(selector).count().catch(() => 0);

  for (let index = 0; index < Math.min(count, 12); index += 1) {
    const locator = page.locator(selector).nth(index);

    if (!(await locator.isVisible().catch(() => false))) {
      continue;
    }

    await locator.click({ timeout: 5_000 }).catch(() => {});
    return true;
  }

  return false;
};

const getBodyText = async (page: Page): Promise<string> => {
  return page.locator('body').innerText({ timeout: 8_000 }).catch(() => '');
};

const readEditorState = async (page: Page): Promise<EditorState> => {
  const bodyText = await getBodyText(page);
  const summary = compact(bodyText);
  const hasTitleInput = await hasAnyVisible(
    page,
    [
      '.FlexableTextArea textarea.textarea_input',
      'textarea.textarea_input',
      'textarea[placeholder*="제목"]',
      'textarea[title*="제목"]',
      'input[placeholder*="제목"]',
      'input[title*="제목"]',
    ].join(', '),
  );
  const hasBodyInput = await hasAnyVisible(
    page,
    [
      'p.se-text-paragraph',
      '[contenteditable="true"]',
      '.se-component-content',
      '.se-text-paragraph',
      'textarea[placeholder*="내용"]',
      'textarea[title*="내용"]',
      'div[role="textbox"]',
    ].join(', '),
  );
  const hasWriteUrlSignal =
    /\/articles\/write|ArticleWrite|write/i.test(page.url()) &&
    !page.url().includes('nidlogin');
  const hasEditorTextSignal =
    (summary.includes('카페 글쓰기') || summary.includes('글쓰기')) &&
    (summary.includes('등록') || summary.includes('완료')) &&
    (
      summary.includes('임시등록') ||
      summary.includes('임시저장') ||
      summary.includes('게시판') ||
      summary.includes('제목') ||
      summary.includes('내용')
    );
  const hasBlockedText =
    summary.includes('글쓰기 권한이 없습니다') ||
    summary.includes('글쓰기 제한') ||
    summary.includes('글쓰기가 제한') ||
    summary.includes('접근할 수 없습니다') ||
    summary.includes('접근이 제한') ||
    summary.includes('카페 회원만') ||
    summary.includes('가입 후 이용') ||
    summary.includes('등급이 부족') ||
    summary.includes('등급 이상') ||
    summary.includes('등업') ||
    summary.includes('활동정지') ||
    summary.includes('이용이 제한');

  return {
    hasEditorSignal: (hasTitleInput && hasBodyInput) || (hasWriteUrlSignal && (hasTitleInput || hasBodyInput || hasEditorTextSignal)),
    hasBlockedText,
    detail: summary.slice(0, 220) || `url=${page.url()}`,
    currentUrl: page.url(),
  };
};

const ensureLoggedIn = async (account: InputAccountRow): Promise<LoginResult> => {
  const result = await loginAccount(account.accountId, account.password, {
    forceFreshLogin: FORCE_FRESH_LOGIN,
    waitForLoginMs: LOGIN_WAIT_MS,
    pollIntervalMs: 1_000,
    reason: 'sheet_junchoi_cafe_write_access',
  });

  return {
    ok: result.success,
    detail: result.success ? '로그인 확인' : result.error || '로그인 실패',
  };
};

const checkEditorFromState = (
  state: EditorState,
): Pick<CheckRow, 'editorStatus' | 'detail' | 'currentUrl'> => {
  if (state.currentUrl.includes('nidlogin')) {
    return {
      editorStatus: 'WRITE_BLOCKED',
      detail: '글쓰기 진입 중 로그인 페이지로 이동',
      currentUrl: state.currentUrl,
    };
  }

  if (state.hasEditorSignal && !state.hasBlockedText) {
    return {
      editorStatus: 'EDITOR_OK',
      detail: '글쓰기 에디터 진입 가능',
      currentUrl: state.currentUrl,
    };
  }

  if (state.hasBlockedText) {
    return {
      editorStatus: 'WRITE_BLOCKED',
      detail: state.detail,
      currentUrl: state.currentUrl,
    };
  }

  return {
    editorStatus: 'UNKNOWN',
    detail: state.detail,
    currentUrl: state.currentUrl,
  };
};

const verifyEditorAccess = async (
  accountId: string,
  cafe: CafeRow,
): Promise<Pick<CheckRow, 'editorStatus' | 'detail' | 'method' | 'currentUrl'>> => {
  const page = await getPageForAccount(accountId);
  const cafeHomeUrl = `https://cafe.naver.com/ca-fe/cafes/${cafe.cafeId}`;
  const mobileCafeHomeUrl = cafe.cafeUrl
    ? `https://m.cafe.naver.com/${cafe.cafeUrl}`
    : `https://m.cafe.naver.com/ca-fe/web/cafes/${cafe.cafeId}`;
  const menuCandidates = getMenuCandidates(cafe);

  await page.goto(mobileCafeHomeUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(2_500);

  const hasJoinButton = await hasAnyVisible(
    page,
    [
      'button:has-text("카페 가입하기")',
      'a:has-text("카페 가입하기")',
      'button:has-text("가입하기")',
      'a:has-text("가입하기")',
    ].join(', '),
  );

  if (hasJoinButton) {
    return {
      editorStatus: 'WRITE_BLOCKED',
      detail: '모바일 카페 홈에서 가입 버튼 노출',
      method: 'cafe_home_write_button',
      currentUrl: page.url(),
    };
  }

  const mobileClicked = await clickFirstVisible(
    page,
    [
      'a:has-text("글쓰기")',
      'button:has-text("글쓰기")',
      'a[href*="/articles/write"]',
      'a[href*="ArticleWrite"]',
      'button[aria-label*="글쓰기"]',
    ].join(', '),
  );

  if (mobileClicked) {
    await page.waitForTimeout(4_000);
    const state = await readEditorState(page);
    const result = checkEditorFromState(state);

    if (result.editorStatus !== 'UNKNOWN') {
      return {
        ...result,
        method: 'cafe_home_write_button',
      };
    }
  }

  await page.goto(cafeHomeUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(2_500);

  const clicked = await clickFirstVisible(
    page,
    [
      'a:has-text("글쓰기")',
      'button:has-text("글쓰기")',
      'a[href*="/articles/write"]',
      'button[aria-label*="글쓰기"]',
    ].join(', '),
  );

  if (clicked) {
    await page.waitForTimeout(4_000);
    const state = await readEditorState(page);
    const result = checkEditorFromState(state);

    if (result.editorStatus !== 'UNKNOWN') {
      return {
        ...result,
        method: 'cafe_home_write_button',
      };
    }
  }

  let lastUnknown: Pick<CheckRow, 'editorStatus' | 'detail' | 'currentUrl'> | undefined =
    !mobileClicked && !clicked
      ? {
          editorStatus: 'UNKNOWN',
          detail: '모바일/데스크톱 카페 홈에서 글쓰기 버튼 없음',
          currentUrl: page.url(),
        }
      : undefined;

  for (const menuId of menuCandidates) {
    const writeUrl = `https://cafe.naver.com/ca-fe/cafes/${cafe.cafeId}/articles/write?boardType=L&menuId=${menuId}`;
    await page.goto(writeUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(WRITE_PAGE_WAIT_MS);

    const state = await readEditorState(page);
    const result = checkEditorFromState(state);

    if (result.editorStatus === 'EDITOR_OK' || result.editorStatus === 'WRITE_BLOCKED') {
      return {
        ...result,
        method: 'direct_write_url',
      };
    }

    lastUnknown = result;
  }

  return {
    editorStatus: 'WRITE_BLOCKED',
    detail: `후보 menuId ${menuCandidates.join(',')} 전체에서 에디터 미진입: ${lastUnknown?.detail || 'no detail'}`,
    method: 'direct_write_url',
    currentUrl: lastUnknown?.currentUrl || page.url(),
  };
};

const makeCheckRow = (
  account: InputAccountRow,
  cafe: CafeRow,
  loginStatus: LoginStatus,
  editorStatus: EditorStatus,
  method: CheckMethod,
  detail: string,
  currentUrl = '',
): CheckRow => ({
  rowNumber: account.rowNumber,
  accountId: account.accountId,
  nickname: account.nickname,
  blogUrl: account.blogUrl,
  category: account.category,
  mvpn: account.mvpn,
  owner: account.owner,
  cafeName: cafe.name,
  cafeId: cafe.cafeId,
  loginStatus,
  editorStatus,
  method,
  detail,
  currentUrl,
});

const timestamp = (): string => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

const writeReport = (payload: unknown): string => {
  mkdirSync(REPORT_DIR, { recursive: true });

  const reportPath = join(REPORT_DIR, `junchoi-cafe-write-access-${timestamp()}.json`);
  writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });

  return reportPath;
};

const delay = async (ms: number): Promise<void> => {
  if (ms <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

const main = async (): Promise<void> => {
  const inputRows = parseInputRows(await readStdin());
  const { accounts, duplicateAccountIds } = dedupeRows(inputRows);

  await connect();

  const cafes = await loadTargetCafes();
  const rows: CheckRow[] = [];
  const loginResultByAccountId = new Map<string, LoginResult>();

  console.log(
    `[JUNCHOI_WRITE_ACCESS] start accounts=${accounts.length} cafes=${cafes
      .map(({ name }) => name)
      .join(',')}`,
  );

  for (let index = 0; index < accounts.length; index += 1) {
    const account = accounts[index];
    console.log(`[JUNCHOI_WRITE_ACCESS] account ${index + 1}/${accounts.length} ${account.accountId}`);

    await acquireAccountLock(account.accountId);

    try {
      const cachedLogin = loginResultByAccountId.get(account.accountId);
      const login = cachedLogin ?? await ensureLoggedIn(account);
      loginResultByAccountId.set(account.accountId, login);

      if (!login.ok) {
        for (const cafe of cafes) {
          rows.push(makeCheckRow(account, cafe, 'FAIL', 'SKIPPED', 'skipped', login.detail));
        }

        continue;
      }

      for (const cafe of cafes) {
        const editor = await verifyEditorAccess(account.accountId, cafe);
        rows.push(makeCheckRow(
          account,
          cafe,
          'OK',
          editor.editorStatus,
          editor.method,
          editor.detail,
          editor.currentUrl,
        ));
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : '알 수 없는 오류';

      for (const cafe of cafes) {
        rows.push(makeCheckRow(account, cafe, 'FAIL', 'SKIPPED', 'skipped', detail));
      }
    } finally {
      releaseAccountLock(account.accountId);
    }

    if (index < accounts.length - 1) {
      await delay(WAIT_BETWEEN_ACCOUNTS_MS);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: {
      spreadsheetId: '1dMilxTgiwt-XjZux5pSk9EpUnLngYj1XqSukO1088mU',
      sheetName: '21lab 블로그 계정LIST',
      range: 'B34:H78',
      inputRows: inputRows.length,
      uniqueAccounts: accounts.length,
      duplicateAccountIds,
    },
    targetCafes: cafes.map((cafe) => ({
      name: cafe.name,
      cafeId: cafe.cafeId,
      cafeUrl: cafe.cafeUrl,
      menuId: cafe.menuId,
      menuCandidates: getMenuCandidates(cafe),
    })),
    summary: {
      totalChecks: rows.length,
      editorOk: rows.filter(({ editorStatus }) => editorStatus === 'EDITOR_OK').length,
      loginFail: rows.filter(({ loginStatus }) => loginStatus === 'FAIL').length,
      writeBlocked: rows.filter(({ editorStatus }) => editorStatus === 'WRITE_BLOCKED').length,
      unknown: rows.filter(({ editorStatus }) => editorStatus === 'UNKNOWN').length,
    },
    rows,
  };
  const reportPath = writeReport(report);

  console.log(`[JUNCHOI_WRITE_ACCESS_RESULT]${JSON.stringify({ ...report, reportPath }, null, 2)}`);
};

main()
  .then(async () => {
    await closeAllContexts();
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('[JUNCHOI_WRITE_ACCESS]', error instanceof Error ? error.message : error);
    await closeAllContexts().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
