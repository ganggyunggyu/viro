import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDaySummary,
  buildVerificationArticleDateFilter,
  detectArticleIssues,
  getDefaultTargetForCafe,
  inferTargetFromWriterLimits,
  normalizeCommentContent,
  parseVerifyArgs,
  reconcileCafePostCounts,
  reconcileVerificationReportCounts,
  renderGoalStatusReport,
} from './verify-cafe-posts';

test('normalizeCommentContent collapses whitespace and lowercases', () => {
  assert.equal(
    normalizeCommentContent('  저도   먹어봤어요 \n 괜찮았어요  '),
    '저도 먹어봤어요 괜찮았어요',
  );
});

test('detectArticleIssues flags duplicated comments and suspicious phrases', () => {
  const issues = detectArticleIssues({
    cafeId: '25729954',
    articleId: 101,
    title: '테스트 글',
    writerAccountId: 'writer-a',
    postType: 'daily',
    commentCount: 1,
    replyCount: 0,
    comments: [
      {
        accountId: 'commenter-a',
        content: '[댓글1] 강추입니다 😊',
        type: 'comment',
        createdAt: '2026-04-14T01:00:00.000Z',
      },
      {
        accountId: 'commenter-b',
        content: '[댓글1] 강추입니다 😊',
        type: 'comment',
        createdAt: '2026-04-14T01:01:00.000Z',
      },
    ],
  });

  assert.ok(issues.some(({ code }) => code === 'duplicate_comment_in_article'));
  assert.ok(issues.some(({ code }) => code === 'prompt_tag_leak'));
  assert.ok(issues.some(({ code }) => code === 'emoji_detected'));
  assert.ok(issues.some(({ code }) => code === 'sales_phrase'));
  assert.ok(issues.some(({ code }) => code === 'comment_count_mismatch'));
});

test('buildDaySummary compares target and carries cross-article duplicate warnings', () => {
  const summary = buildDaySummary([
    {
      cafeId: '25729954',
      articleId: 201,
      title: '첫 글',
      writerAccountId: 'writer-a',
      postType: 'daily',
      commentCount: 1,
      replyCount: 0,
      publishedAt: '2026-04-14T01:00:00.000Z',
      comments: [
        {
          accountId: 'commenter-a',
          content: '저는 이건 좀 애매했어요',
          type: 'comment',
          createdAt: '2026-04-14T01:10:00.000Z',
        },
      ],
    },
    {
      cafeId: '25729954',
      articleId: 202,
      title: '둘째 글',
      writerAccountId: 'writer-b',
      postType: 'daily',
      commentCount: 1,
      replyCount: 0,
      publishedAt: '2026-04-14T02:00:00.000Z',
      comments: [
        {
          accountId: 'commenter-b',
          content: '저는 이건 좀 애매했어요',
          type: 'comment',
          createdAt: '2026-04-14T02:10:00.000Z',
        },
      ],
    },
  ], {
    dateKey: '2026-04-14',
    target: { value: 3, source: 'explicit' },
    commentWarnThreshold: 1,
  });

  assert.equal(summary.actualPosts, 2);
  assert.equal(summary.targetStatus, 'fail');
  assert.equal(summary.diffFromTarget, -1);
  assert.equal(summary.problemArticleCount, 2);
  assert.ok(summary.articles.every(({ issues }) =>
    issues.some(({ code }) => code === 'cross_article_duplicate_comment'),
  ));
});

test('inferTargetFromWriterLimits sums dailyPostLimit for recent writers', () => {
  assert.deepEqual(
    inferTargetFromWriterLimits(
      ['writer-a', 'writer-c'],
      [
        { accountId: 'writer-a', dailyPostLimit: 4 },
        { accountId: 'writer-b', dailyPostLimit: 3 },
        { accountId: 'writer-c', dailyPostLimit: 2 },
      ],
    ),
    {
      value: 6,
      source: 'inferred',
      note: '2개 writer dailyPostLimit 합',
    },
  );
});

test('parseVerifyArgs reads summary and default target flags', () => {
  assert.deepEqual(
    parseVerifyArgs([
      '--cafe',
      '쇼핑지름신',
      '--default-targets',
      '--summary-only',
    ]),
    {
      cafes: ['쇼핑지름신'],
      baseDateKey: parseVerifyArgs([]).baseDateKey,
      cafeTargets: [],
      commentWarnThreshold: 3,
      sampleLimit: 8,
      json: false,
      help: false,
      defaultTargets: true,
      summaryOnly: true,
    },
  );
});

test('getDefaultTargetForCafe returns standard campaign goal for known cafe', () => {
  assert.deepEqual(
    getDefaultTargetForCafe({
      cafeId: '25729954',
      name: '쇼핑지름신',
    }),
    {
      value: 15,
      source: 'preset',
      note: '기본 운영 목표치',
    },
  );
});

test('renderGoalStatusReport prints compact yesterday and today goal status', () => {
  const report = renderGoalStatusReport({
    generatedAt: '2026-04-14T12:00:00.000Z',
    baseDateKey: '2026-04-14',
    previousDateKey: '2026-04-13',
    cafes: [
      {
        cafeId: '25729954',
        cafeName: '쇼핑지름신',
        yesterday: {
          dateKey: '2026-04-13',
          actualPosts: 15,
          target: { value: 15, source: 'preset', note: '기본 운영 목표치' },
          targetStatus: 'pass',
          diffFromTarget: 0,
          writerBreakdown: [],
          problemArticleCount: 0,
          totalIssueCount: 0,
          articles: [],
        },
        today: {
          dateKey: '2026-04-14',
          actualPosts: 12,
          target: { value: 15, source: 'preset', note: '기본 운영 목표치' },
          targetStatus: 'fail',
          diffFromTarget: -3,
          writerBreakdown: [],
          problemArticleCount: 0,
          totalIssueCount: 0,
          articles: [],
        },
      },
    ],
  });

  assert.match(report, /쇼핑지름신 \(25729954\)/);
  assert.match(report, /전일 2026-04-13 \| PASS \| 목표 15건 \/ 실제 15건/);
  assert.match(report, /금일 2026-04-14 \| FAIL \| 목표 15건 \/ 실제 12건 \(-3\)/);
});

test('reconcileCafePostCounts reports a three-way match', () => {
  assert.deepEqual(
    reconcileCafePostCounts({ dbCount: 12, sheetCount: 12, liveCount: 12 }),
    {
      matches: true,
      dbCount: 12,
      sheetCount: 12,
      liveCount: 12,
      db: { direction: 'match', difference: 0 },
      sheet: { direction: 'match', difference: 0 },
    },
  );
});

test('reconcileCafePostCounts reports DB records missing against live UI', () => {
  const result = reconcileCafePostCounts({ dbCount: 10, sheetCount: 12, liveCount: 12 });

  assert.equal(result.matches, false);
  assert.deepEqual(result.db, { direction: 'missing', difference: -2 });
  assert.deepEqual(result.sheet, { direction: 'match', difference: 0 });
});

test('reconcileCafePostCounts reports DB ghost records above live UI', () => {
  const result = reconcileCafePostCounts({ dbCount: 14, sheetCount: 12, liveCount: 12 });

  assert.equal(result.matches, false);
  assert.deepEqual(result.db, { direction: 'excess', difference: 2 });
  assert.deepEqual(result.sheet, { direction: 'match', difference: 0 });
});

test('reconcileCafePostCounts reports sheet mismatch independently', () => {
  const result = reconcileCafePostCounts({ dbCount: 12, sheetCount: 9, liveCount: 12 });

  assert.equal(result.matches, false);
  assert.deepEqual(result.db, { direction: 'match', difference: 0 });
  assert.deepEqual(result.sheet, { direction: 'missing', difference: -3 });
});

test('verification article date filter excludes only explicitly external records', () => {
  const start = new Date('2026-04-13T00:00:00.000Z');
  const end = new Date('2026-04-15T00:00:00.000Z');

  assert.deepEqual(buildVerificationArticleDateFilter(start, end), {
    isExternal: { $ne: true },
    $or: [
      { publishedAt: { $gte: start, $lt: end } },
      { createdAt: { $gte: start, $lt: end } },
    ],
  });
});

test('reconcileVerificationReportCounts wires injected sheet and live count collectors', async () => {
  const requests: string[][] = [];
  const report = await reconcileVerificationReportCounts({
    generatedAt: '2026-04-14T12:00:00.000Z',
    baseDateKey: '2026-04-14',
    previousDateKey: '2026-04-13',
    cafes: [
      {
        cafeId: '25729954',
        cafeName: '쇼핑지름신',
        yesterday: buildDaySummary([], { dateKey: '2026-04-13' }),
        today: buildDaySummary([], { dateKey: '2026-04-14' }),
      },
    ],
  }, {
    collectSheetCounts: async (countRequests) => {
      requests.push(countRequests.map(({ source }) => source));
      return countRequests.map(({ cafeId, dateKey }) => ({ cafeId, dateKey, count: 0 }));
    },
    collectLiveCounts: async (countRequests) => {
      requests.push(countRequests.map(({ source }) => source));
      return countRequests.map(({ cafeId, dateKey }) => ({ cafeId, dateKey, count: 0 }));
    },
  });

  assert.deepEqual(requests, [
    ['sheet', 'sheet'],
    ['live', 'live'],
  ]);
  assert.equal(report.cafes[0]?.today.countReconciliation?.matches, true);
  assert.equal(report.cafes[0]?.yesterday.countReconciliation?.matches, true);
});
