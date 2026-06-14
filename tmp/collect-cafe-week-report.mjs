import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = '/Users/ganggyunggyu/Programing/cafe-bot';
const START_DATE = '2026-06-08';
const END_DATE = '2026-06-14';
const CHECKED_AT = new Date();
const KST_TZ = 'Asia/Seoul';

const CAFE_NAMES = new Map([
  ['25636798', '건강한노후준비'],
  ['25227349', '건강관리소'],
  ['25729954', '쇼핑지름신'],
  ['25460974', '샤넬오픈런'],
]);

const scheduleFiles = [
  { file: 'scripts/artifacts/cafe-schedule-2026-06-08-standard.json', date: '2026-06-08', source: 'standard' },
  { file: 'scripts/artifacts/cafe-schedule-2026-06-08-standard-fill-1.json', date: '2026-06-08', source: 'fill' },
  { file: 'scripts/artifacts/cafe-schedule-2026-06-13-hanryeo-standard.json', date: '2026-06-13', source: 'standard' },
  { file: 'scripts/artifacts/cafe-schedule-2026-06-14-hanryeo-standard.json', date: '2026-06-14', source: 'standard' },
  { file: 'scripts/artifacts/cafe-schedule-2026-06-14-retry-replacements.json', date: '2026-06-14', source: 'replacement' },
];

const ledgerFiles = [
  { file: 'scripts/artifacts/cafe-publish-ledger-2026-06-14.json', date: '2026-06-14', source: 'ledger' },
];

const collator = new Intl.DateTimeFormat('sv-SE', {
  timeZone: KST_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const formatKst = (date) => collator.format(date).replace('T', ' ');

const parseKstDate = (dateTime) => new Date(`${dateTime.replace(' ', 'T')}+09:00`);

const kstDateKey = (timestamp) => formatKst(new Date(timestamp)).slice(0, 10);

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[^\p{L}\p{N}]+/gu, '');

const compactText = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value) =>
  String(value || '')
    .split(/[\s,./|()[\]{}"'~!?:;<>+-]+/u)
    .map((token) => normalize(token))
    .filter((token) => token.length >= 2)
    .filter((token) => !['일요일', '토요일', '월요일', '화요일', '수요일', '목요일', '금요일'].includes(token));

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url}`);
  }

  return response.json();
};

const readJson = async (relativePath) => {
  const content = await readFile(path.join(ROOT, relativePath), 'utf8');
  return JSON.parse(content);
};

const scheduleKey = (row) =>
  [
    row.scheduledAtKst,
    row.cafeId,
    row.postType,
    normalize(row.keyword),
    row.accountId || '',
    row.source || '',
  ].join('|');

const loadScheduleRows = async () => {
  const rows = [];

  for (const item of scheduleFiles) {
    const data = await readJson(item.file);
    for (const [index, row] of data.entries()) {
      const scheduledAtKst = `${item.date} ${row.time}:00`;
      rows.push({
        id: `${item.date}-${item.source}-${index + 1}`,
        week: `${START_DATE}~${END_DATE}`,
        date: item.date,
        scheduledAtKst,
        scheduledTime: row.time,
        cafeName: row.cafe || CAFE_NAMES.get(row.cafeId) || row.cafeId,
        cafeId: row.cafeId,
        postType: row.type || row.postType || '',
        keyword: row.keyword || '',
        accountId: row.accountId || '',
        subject: row.subject || '',
        category: row.category || '',
        plannedSource: item.source,
        jobId: '',
        queueState: '',
        ledgerStatus: '',
        failedReason: '',
        articleId: '',
        articleUrl: '',
        publishedAtKst: '',
        actualStatus: '',
        actualSubject: '',
        actualMenuName: '',
        verification: '',
      });
    }
  }

  const byKey = new Map(rows.map((row) => [scheduleKey(row), row]));

  for (const item of ledgerFiles) {
    const data = await readJson(item.file);
    for (const row of data.rows || []) {
      const normalized = {
        id: `${item.date}-ledger-${row.jobId || row.scheduledAtKst}`,
        week: `${START_DATE}~${END_DATE}`,
        date: String(row.scheduledAtKst || '').slice(0, 10) || item.date,
        scheduledAtKst: row.scheduledAtKst || '',
        scheduledTime: String(row.scheduledAtKst || '').slice(11, 16),
        cafeName: row.cafeName || CAFE_NAMES.get(row.cafeId) || row.cafeId,
        cafeId: row.cafeId,
        postType: row.postType || '',
        keyword: row.keyword || '',
        accountId: row.accountId || '',
        subject: row.subject || '',
        category: row.category || '',
        plannedSource: 'ledger-only',
        jobId: row.jobId || '',
        queueState: row.queueState || '',
        ledgerStatus: row.status || '',
        failedReason: row.failedReason || '',
        articleId: row.articleId || '',
        articleUrl: row.articleUrl || '',
        publishedAtKst: row.publishedAtKst || '',
        actualStatus: '',
        actualSubject: '',
        actualMenuName: '',
        verification: '',
      };

      const candidates = rows.filter(
        (existing) =>
          existing.scheduledAtKst === normalized.scheduledAtKst &&
          existing.cafeId === normalized.cafeId &&
          normalize(existing.keyword) === normalize(normalized.keyword),
      );
      const target = candidates[0] || byKey.get(scheduleKey(normalized));
      if (target) {
        Object.assign(target, {
          subject: normalized.subject || target.subject,
          jobId: normalized.jobId,
          queueState: normalized.queueState,
          ledgerStatus: normalized.ledgerStatus,
          failedReason: normalized.failedReason,
          articleId: normalized.articleId,
          articleUrl: normalized.articleUrl,
          publishedAtKst: normalized.publishedAtKst,
        });
      } else if (normalized.date >= START_DATE && normalized.date <= END_DATE) {
        rows.push(normalized);
      }
    }
  }

  rows.sort((a, b) => a.scheduledAtKst.localeCompare(b.scheduledAtKst) || a.cafeName.localeCompare(b.cafeName));
  return rows;
};

const collectCafeArticles = async (cafeId) => {
  const articles = [];
  const seen = new Set();
  const maxPages = cafeId === '25729954' ? 240 : cafeId === '25460974' ? 120 : 80;

  for (let page = 1; page <= maxPages; page += 1) {
    const url =
      `https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=${cafeId}` +
      `&search.page=${page}&search.perPage=20&search.queryType=lastArticle&search.boardtype=L`;
    const data = await fetchJson(url);
    const list = data?.message?.result?.articleList || [];
    if (!list.length) {
      break;
    }

    let oldest = '';
    for (const item of list) {
      const articleId = Number(item.articleId || 0);
      if (!articleId || seen.has(articleId)) {
        continue;
      }
      seen.add(articleId);
      const dateKey = kstDateKey(Number(item.writeDateTimestamp || 0));
      if (!oldest || dateKey < oldest) {
        oldest = dateKey;
      }
      if (dateKey >= START_DATE && dateKey <= END_DATE) {
        articles.push({
          cafeId,
          articleId,
          subject: item.subject || '',
          menuName: item.menuName || '',
          timestamp: Number(item.writeDateTimestamp || 0),
          writeDateKst: formatKst(new Date(Number(item.writeDateTimestamp || 0))),
          url: `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
        });
      }
    }

    if (oldest && oldest < START_DATE) {
      break;
    }
  }

  return articles;
};

const detailCache = new Map();

const getArticleDetail = async (cafeId, articleId) => {
  const key = `${cafeId}:${articleId}`;
  if (detailCache.has(key)) {
    return detailCache.get(key);
  }

  try {
    const url = `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${cafeId}/articles/${articleId}?useCafeId=true`;
    const data = await fetchJson(url);
    const article = data?.result?.article || data?.article || {};
    const detail = {
      ok: Boolean(article?.id || article?.subject),
      articleId: Number(article?.id || articleId),
      subject: article?.subject || '',
      menuName: article?.menu?.name || '',
      timestamp: Number(article?.writeDate || 0),
      writeDateKst: article?.writeDate ? formatKst(new Date(Number(article.writeDate))) : '',
      text: compactText(`${article?.subject || ''} ${article?.contentHtml || ''}`),
      url: `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
    };
    detailCache.set(key, detail);
    return detail;
  } catch (error) {
    const detail = {
      ok: false,
      articleId,
      subject: '',
      menuName: '',
      timestamp: 0,
      writeDateKst: '',
      text: '',
      url: `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`,
      error: error instanceof Error ? error.message : String(error),
    };
    detailCache.set(key, detail);
    return detail;
  }
};

const scoreMatch = (row, detail, scheduledAt) => {
  const haystack = normalize(`${detail.subject} ${detail.text}`);
  const keyword = normalize(row.keyword);
  const subject = normalize(row.subject);
  const category = normalize(row.category);
  const menuName = normalize(detail.menuName);
  const diffMinutes = Math.abs(detail.timestamp - scheduledAt.getTime()) / 60000;

  let score = 0;
  const reasons = [];

  if (keyword && haystack.includes(keyword)) {
    score += 80;
    reasons.push('키워드 본문/제목 일치');
  }
  if (subject && normalize(detail.subject).includes(subject)) {
    score += 100;
    reasons.push('제목 일치');
  }
  if (category && menuName && category === menuName) {
    score += 10;
    reasons.push('게시판 일치');
  }

  const keywordTokens = tokenize(row.keyword);
  if (keywordTokens.length >= 3) {
    const hitCount = keywordTokens.filter((token) => haystack.includes(token)).length;
    const ratio = hitCount / keywordTokens.length;
    if (hitCount >= 3 && ratio >= 0.35) {
      score += Math.round(70 * ratio);
      reasons.push(`제목 토큰 ${hitCount}/${keywordTokens.length} 일치`);
    }
  }

  if (diffMinutes <= 8) {
    score += 20;
  } else if (diffMinutes <= 20) {
    score += 10;
  }

  if (!keyword && !subject) {
    score = 0;
  }

  return { score, reasons, diffMinutes };
};

const verifyRows = async (rows, articleLists) => {
  const used = new Set();

  for (const [index, row] of rows.entries()) {
    if (index > 0 && index % 25 === 0) {
      console.error(`[verify] ${index}/${rows.length}`);
    }

    const scheduledAt = parseKstDate(row.scheduledAtKst);

    if (row.articleId) {
      const listed = (articleLists.get(row.cafeId) || []).find((article) => Number(article.articleId) === Number(row.articleId));
      if (listed) {
        row.actualStatus = '발행완료';
        row.actualSubject = listed.subject;
        row.actualMenuName = listed.menuName;
        row.publishedAtKst = row.publishedAtKst || listed.writeDateKst;
        row.articleUrl = row.articleUrl || listed.url;
        row.verification = '카페 글 목록에서 글번호 확인';
        used.add(`${row.cafeId}:${row.articleId}`);
        continue;
      }

      const detail = await getArticleDetail(row.cafeId, row.articleId);
      if (detail.ok) {
        row.actualStatus = '발행완료';
        row.actualSubject = detail.subject;
        row.actualMenuName = detail.menuName;
        row.publishedAtKst = row.publishedAtKst || detail.writeDateKst;
        row.articleUrl = row.articleUrl || detail.url;
        row.verification = '카페 글 API 직접 확인';
        used.add(`${row.cafeId}:${row.articleId}`);
      } else {
        row.actualStatus = scheduledAt > CHECKED_AT ? '예정' : '확인필요';
        row.verification = `글 API 확인 실패: ${detail.error || 'unknown'}`;
      }
      continue;
    }

    if (scheduledAt > CHECKED_AT) {
      row.actualStatus = '예정';
      row.verification = '검토 시각 이후 예약';
      continue;
    }

    const candidates = (articleLists.get(row.cafeId) || [])
      .filter((article) => !used.has(`${row.cafeId}:${article.articleId}`))
      .filter((article) => {
        const delta = article.timestamp - scheduledAt.getTime();
        return delta >= -3 * 60000 && delta <= 20 * 60000;
      })
      .sort((a, b) => {
        const aSubjectHit = normalize(a.subject).includes(normalize(row.keyword)) ? 0 : 1;
        const bSubjectHit = normalize(b.subject).includes(normalize(row.keyword)) ? 0 : 1;
        if (aSubjectHit !== bSubjectHit) return aSubjectHit - bSubjectHit;
        return Math.abs(a.timestamp - scheduledAt.getTime()) - Math.abs(b.timestamp - scheduledAt.getTime());
      })
      .slice(0, 12);

    let best = null;
    for (const article of candidates) {
      const detail = await getArticleDetail(row.cafeId, article.articleId);
      const mergedDetail = {
        ...detail,
        ok: detail.ok,
        articleId: article.articleId,
        subject: detail.subject || article.subject,
        menuName: detail.menuName || article.menuName,
        timestamp: detail.timestamp || article.timestamp,
        writeDateKst: detail.writeDateKst || article.writeDateKst,
        text: detail.text || article.subject,
        url: detail.url || article.url,
      };
      const scored = scoreMatch(row, mergedDetail, scheduledAt);
      if (!best || scored.score > best.score || (scored.score === best.score && scored.diffMinutes < best.diffMinutes)) {
        best = { ...article, ...mergedDetail, ...scored };
      }
    }

    if (best && best.score >= 80) {
      row.actualStatus = '발행완료';
      row.actualSubject = best.subject;
      row.actualMenuName = best.menuName;
      row.publishedAtKst = best.writeDateKst;
      row.articleId = best.articleId;
      row.articleUrl = best.url;
      row.verification = best.reasons.join(', ') || '카페 글 매칭';
      used.add(`${row.cafeId}:${best.articleId}`);
      continue;
    }

    if (row.ledgerStatus === 'failed' || row.queueState === 'failed') {
      row.actualStatus = '실패';
      row.verification = '카페 글 미확인 및 원장 실패 표시';
    } else {
      row.actualStatus = '미게시';
      row.verification = '예정 시각 이후 카페 글 미확인';
    }
  }

  return rows;
};

const buildSummary = (rows) => {
  const grouped = new Map();
  const add = (key, row) => {
    if (!grouped.has(key)) {
      grouped.set(key, { planned: 0, published: 0, scheduled: 0, failed: 0, missing: 0, needsCheck: 0 });
    }
    const target = grouped.get(key);
    target.planned += 1;
    if (row.actualStatus === '발행완료') target.published += 1;
    else if (row.actualStatus === '예정') target.scheduled += 1;
    else if (row.actualStatus === '실패') target.failed += 1;
    else if (row.actualStatus === '미게시') target.missing += 1;
    else target.needsCheck += 1;
  };

  for (const row of rows) {
    add(`date:${row.date}`, row);
    add(`cafe:${row.cafeName}`, row);
    add(`type:${row.postType}`, row);
  }

  return Object.fromEntries(grouped.entries());
};

const main = async () => {
  const rows = await loadScheduleRows();
  const articleLists = new Map();

  for (const cafeId of new Set(rows.map((row) => row.cafeId))) {
    console.error(`[collect] cafe ${cafeId} list start`);
    const list = await collectCafeArticles(cafeId);
    console.error(`[collect] cafe ${cafeId} list ${list.length}`);
    articleLists.set(cafeId, list);
  }

  const verified = await verifyRows(rows, articleLists);
  const output = {
    generatedAtKst: formatKst(CHECKED_AT),
    week: { start: START_DATE, end: END_DATE },
    rows: verified,
    summary: buildSummary(verified),
  };

  const outputPath = path.join(ROOT, 'tmp/cafe-week-report-2026-06-08_2026-06-14.json');
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(outputPath);
  console.log(JSON.stringify({
    generatedAtKst: output.generatedAtKst,
    rowCount: output.rows.length,
    statuses: output.rows.reduce((acc, row) => {
      acc[row.actualStatus] = (acc[row.actualStatus] || 0) + 1;
      return acc;
    }, {}),
    byCafe: [...new Set(output.rows.map((row) => row.cafeName))].map((cafeName) => ({
      cafeName,
      count: output.rows.filter((row) => row.cafeName === cafeName).length,
      published: output.rows.filter((row) => row.cafeName === cafeName && row.actualStatus === '발행완료').length,
      scheduled: output.rows.filter((row) => row.cafeName === cafeName && row.actualStatus === '예정').length,
      failedOrMissing: output.rows.filter(
        (row) => row.cafeName === cafeName && ['실패', '미게시'].includes(row.actualStatus),
      ).length,
    })),
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
