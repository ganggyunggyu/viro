import { readFile, writeFile } from 'node:fs/promises';

const ROOT = '/Users/ganggyunggyu/Programing/cafe-bot';
const REPORT = `${ROOT}/tmp/cafe-week-report-2026-06-08_2026-06-14.json`;
const SHEET_ID = 0;

const asCell = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r?\n/g, ' ').replace(/\t/g, ' ').trim();
};

const hyperlink = (url) => {
  if (!url) return '';
  return `=HYPERLINK("${String(url).replace(/"/g, '""')}","열기")`;
};

const report = JSON.parse(await readFile(REPORT, 'utf8'));

const detailHeader = [
  '주간',
  '예정일',
  '예정시각',
  '카페',
  '유형',
  '키워드/주제',
  '계정',
  '카테고리',
  '계획출처',
  '실제게시시각',
  '실제상태',
  '글번호',
  '실제제목',
  '글URL',
  '확인근거',
  '실패/비고',
];

const rows = [
  ['카페 자동발행 운영 기록'],
  ['대상 주간', `${report.week.start} ~ ${report.week.end}`],
  ['최종 확인', `${report.generatedAtKst} KST`],
  ['확인 기준', 'DB 미사용 / 네이버 카페 글 목록·글 API 기준'],
  [],
  ['전체 요약', '계획', '발행완료', '예정', '실패', '미게시', '완료율'],
  ['전체', '=COUNTA($A$19:$A)', '=COUNTIF($K$19:$K,"발행완료")', '=COUNTIF($K$19:$K,"예정")', '=COUNTIF($K$19:$K,"실패")', '=COUNTIF($K$19:$K,"미게시")', '=IFERROR(C7/(B7-D7),"")'],
  [],
  ['카페별 요약', '계획', '발행완료', '예정', '실패', '미게시', '완료율'],
  ['건강한노후준비', '=COUNTIF($D$19:$D,A10)', '=COUNTIFS($D$19:$D,A10,$K$19:$K,"발행완료")', '=COUNTIFS($D$19:$D,A10,$K$19:$K,"예정")', '=COUNTIFS($D$19:$D,A10,$K$19:$K,"실패")', '=COUNTIFS($D$19:$D,A10,$K$19:$K,"미게시")', '=IFERROR(C10/(B10-D10),"")'],
  ['건강관리소', '=COUNTIF($D$19:$D,A11)', '=COUNTIFS($D$19:$D,A11,$K$19:$K,"발행완료")', '=COUNTIFS($D$19:$D,A11,$K$19:$K,"예정")', '=COUNTIFS($D$19:$D,A11,$K$19:$K,"실패")', '=COUNTIFS($D$19:$D,A11,$K$19:$K,"미게시")', '=IFERROR(C11/(B11-D11),"")'],
  ['쇼핑지름신', '=COUNTIF($D$19:$D,A12)', '=COUNTIFS($D$19:$D,A12,$K$19:$K,"발행완료")', '=COUNTIFS($D$19:$D,A12,$K$19:$K,"예정")', '=COUNTIFS($D$19:$D,A12,$K$19:$K,"실패")', '=COUNTIFS($D$19:$D,A12,$K$19:$K,"미게시")', '=IFERROR(C12/(B12-D12),"")'],
  ['샤넬오픈런', '=COUNTIF($D$19:$D,A13)', '=COUNTIFS($D$19:$D,A13,$K$19:$K,"발행완료")', '=COUNTIFS($D$19:$D,A13,$K$19:$K,"예정")', '=COUNTIFS($D$19:$D,A13,$K$19:$K,"실패")', '=COUNTIFS($D$19:$D,A13,$K$19:$K,"미게시")', '=IFERROR(C13/(B13-D13),"")'],
  [],
  ['유형별 요약', '계획', '발행완료', '예정', '실패', '미게시', '완료율'],
  ['ad', '=COUNTIF($E$19:$E,A16)', '=COUNTIFS($E$19:$E,A16,$K$19:$K,"발행완료")', '=COUNTIFS($E$19:$E,A16,$K$19:$K,"예정")', '=COUNTIFS($E$19:$E,A16,$K$19:$K,"실패")', '=COUNTIFS($E$19:$E,A16,$K$19:$K,"미게시")', '=IFERROR(C16/(B16-D16),"")'],
  ['daily', '=COUNTIF($E$19:$E,A17)', '=COUNTIFS($E$19:$E,A17,$K$19:$K,"발행완료")', '=COUNTIFS($E$19:$E,A17,$K$19:$K,"예정")', '=COUNTIFS($E$19:$E,A17,$K$19:$K,"실패")', '=COUNTIFS($E$19:$E,A17,$K$19:$K,"미게시")', '=IFERROR(C17/(B17-D17),"")'],
  ['daily-ad', '=COUNTIF($E$19:$E,A18)', '=COUNTIFS($E$19:$E,A18,$K$19:$K,"발행완료")', '=COUNTIFS($E$19:$E,A18,$K$19:$K,"예정")', '=COUNTIFS($E$19:$E,A18,$K$19:$K,"실패")', '=COUNTIFS($E$19:$E,A18,$K$19:$K,"미게시")', '=IFERROR(C18/(B18-D18),"")'],
  detailHeader,
];

for (const row of report.rows) {
  rows.push([
    row.week,
    row.date,
    row.scheduledTime,
    row.cafeName,
    row.postType,
    row.keyword,
    row.accountId,
    row.category,
    row.plannedSource,
    row.publishedAtKst,
    row.actualStatus,
    row.articleId,
    row.actualSubject,
    hyperlink(row.articleUrl),
    row.verification,
    row.failedReason,
  ].map(asCell));
}

const tsv = rows.map((row) => row.map(asCell).join('\t')).join('\n');

const requests = [
  {
    updateCells: {
      range: {
        sheetId: SHEET_ID,
        startRowIndex: 0,
        endRowIndex: 1000,
        startColumnIndex: 0,
        endColumnIndex: 26,
      },
      rows: [],
      fields: 'userEnteredValue,userEnteredFormat,dataValidation,note',
    },
  },
  {
    pasteData: {
      coordinate: { sheetId: SHEET_ID, rowIndex: 0, columnIndex: 0 },
      data: tsv,
      type: 'PASTE_NORMAL',
      delimiter: '\t',
    },
  },
  {
    updateSheetProperties: {
      properties: {
        sheetId: SHEET_ID,
        gridProperties: {
          frozenRowCount: 19,
          rowCount: Math.max(rows.length + 20, 220),
          columnCount: 16,
        },
      },
      fields: 'gridProperties.frozenRowCount,gridProperties.rowCount,gridProperties.columnCount',
    },
  },
  {
    repeatCell: {
      range: { sheetId: SHEET_ID, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 16 },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 14 },
        },
      },
      fields: 'userEnteredFormat.textFormat',
    },
  },
  {
    repeatCell: {
      range: { sheetId: SHEET_ID, startRowIndex: 18, endRowIndex: 19, startColumnIndex: 0, endColumnIndex: 16 },
      cell: {
        userEnteredFormat: {
          backgroundColorStyle: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } },
          textFormat: { bold: true },
          horizontalAlignment: 'CENTER',
        },
      },
      fields: 'userEnteredFormat(backgroundColorStyle,textFormat,horizontalAlignment)',
    },
  },
  {
    repeatCell: {
      range: { sheetId: SHEET_ID, startRowIndex: 5, endRowIndex: 18, startColumnIndex: 0, endColumnIndex: 7 },
      cell: {
        userEnteredFormat: {
          backgroundColorStyle: { rgbColor: { red: 0.97, green: 0.97, blue: 0.97 } },
        },
      },
      fields: 'userEnteredFormat.backgroundColorStyle',
    },
  },
  {
    repeatCell: {
      range: { sheetId: SHEET_ID, startRowIndex: 18, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: 16 },
      cell: {
        userEnteredFormat: {
          verticalAlignment: 'MIDDLE',
          wrapStrategy: 'WRAP',
        },
      },
      fields: 'userEnteredFormat(verticalAlignment,wrapStrategy)',
    },
  },
  {
    repeatCell: {
      range: { sheetId: SHEET_ID, startRowIndex: 6, endRowIndex: 18, startColumnIndex: 6, endColumnIndex: 7 },
      cell: {
        userEnteredFormat: {
          numberFormat: { type: 'PERCENT', pattern: '0.0%' },
        },
      },
      fields: 'userEnteredFormat.numberFormat',
    },
  },
  {
    setBasicFilter: {
      filter: {
        range: { sheetId: SHEET_ID, startRowIndex: 18, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: 16 },
      },
    },
  },
  {
    setDataValidation: {
      range: { sheetId: SHEET_ID, startRowIndex: 19, endRowIndex: rows.length, startColumnIndex: 10, endColumnIndex: 11 },
      rule: {
        condition: {
          type: 'ONE_OF_LIST',
          values: [
            { userEnteredValue: '발행완료' },
            { userEnteredValue: '예정' },
            { userEnteredValue: '실패' },
            { userEnteredValue: '미게시' },
            { userEnteredValue: '확인필요' },
          ],
        },
        strict: false,
        showCustomUi: true,
      },
    },
  },
  ...[
    ['발행완료', { red: 0.85, green: 0.95, blue: 0.86 }],
    ['예정', { red: 0.9, green: 0.94, blue: 1 }],
    ['실패', { red: 1, green: 0.88, blue: 0.86 }],
    ['미게시', { red: 1, green: 0.94, blue: 0.8 }],
  ].map(([status, color]) => ({
    addConditionalFormatRule: {
      rule: {
        ranges: [{ sheetId: SHEET_ID, startRowIndex: 19, endRowIndex: rows.length, startColumnIndex: 10, endColumnIndex: 11 }],
        booleanRule: {
          condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: status }] },
          format: { backgroundColorStyle: { rgbColor: color } },
        },
      },
      index: 0,
    },
  })),
  {
    updateDimensionProperties: {
      range: { sheetId: SHEET_ID, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 150 },
      fields: 'pixelSize',
    },
  },
  {
    updateDimensionProperties: {
      range: { sheetId: SHEET_ID, dimension: 'COLUMNS', startIndex: 1, endIndex: 5 },
      properties: { pixelSize: 105 },
      fields: 'pixelSize',
    },
  },
  {
    updateDimensionProperties: {
      range: { sheetId: SHEET_ID, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 },
      properties: { pixelSize: 280 },
      fields: 'pixelSize',
    },
  },
  {
    updateDimensionProperties: {
      range: { sheetId: SHEET_ID, dimension: 'COLUMNS', startIndex: 9, endIndex: 11 },
      properties: { pixelSize: 120 },
      fields: 'pixelSize',
    },
  },
  {
    updateDimensionProperties: {
      range: { sheetId: SHEET_ID, dimension: 'COLUMNS', startIndex: 12, endIndex: 16 },
      properties: { pixelSize: 220 },
      fields: 'pixelSize',
    },
  },
];

const output = { requests, rowCount: rows.length, detailRowCount: report.rows.length };
await writeFile(`${ROOT}/tmp/cafe-sheet-requests.json`, `${JSON.stringify(output)}\n`);
await writeFile(`${ROOT}/tmp/cafe-sheet.tsv`, `${tsv}\n`);
console.log(JSON.stringify({ path: `${ROOT}/tmp/cafe-sheet-requests.json`, rowCount: rows.length, detailRowCount: report.rows.length }, null, 2));
