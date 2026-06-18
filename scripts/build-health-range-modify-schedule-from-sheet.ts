import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import mongoose from "mongoose";
import { PublishedArticle } from "@/shared/models/published-article";
import {
  inferKeywordTheme,
  isExposedStatus,
  normalizeKeyword,
} from "./cafe-unexposed-keyword-selector";

interface CsvKeywordRow {
  rowNumber: number;
  keyword: string;
  exposureStatus: string;
  cafeName: string;
}

interface ScheduleItem {
  link: string;
  keyword: string;
  category: string;
}

interface PlannedLedgerRow {
  recordedAtKst: string;
  modifiedAtKst: string;
  publishedAtKst: string;
  cafeName: string;
  cafeId: string;
  articleId: string;
  articleUrl: string;
  oldKeyword: string;
  keyword: string;
  postType: string;
  writerAccountId: string;
  oldTitle: string;
  newTitle: string;
  source: string;
  scheduleFile: string;
  logFile: string;
  status: string;
  note: string;
}

const SPREADSHEET_ID = "1gyipTIEogC9Qopj8w3ggBmD0k5KvAw6yNdIMXQDnwms";
const SHEET_GID = "1923976827";
const SHEET_NAME = "카페키워드";
const CAFE_ID = process.env.CAFE_ID || "25636798";
const CAFE_NAME = process.env.CAFE_NAME || "건강한노후준비";
const START_DATE = process.env.START_DATE || "2026-06-15";
const END_DATE = process.env.END_DATE || "2026-06-17";
const CSV_FILE =
  process.env.SHEET_CSV_FILE || "work/hanryeo-cafe-keywords-2026-06-18.csv";
const BASE_NAME =
  process.env.OUTPUT_BASE ||
  `health-modify-schedule-${START_DATE}-${END_DATE}-freemapleafreecabj-sheet-unexposed`;
const SCHEDULE_FILE =
  process.env.SCHEDULE_FILE ||
  `scripts/artifacts/${BASE_NAME}.text-gen-hub-hanryeo.json`;
const FIRST_SCHEDULE_FILE =
  process.env.FIRST_SCHEDULE_FILE ||
  `scripts/artifacts/${BASE_NAME}.first.text-gen-hub-hanryeo.json`;
const REMAINING_SCHEDULE_FILE =
  process.env.REMAINING_SCHEDULE_FILE ||
  `scripts/artifacts/${BASE_NAME}.remaining.text-gen-hub-hanryeo.json`;
const SUMMARY_FILE =
  process.env.SUMMARY_FILE || `scripts/artifacts/${BASE_NAME}.summary.json`;
const LOG_FILE =
  process.env.LOG_FILE ||
  `scripts/artifacts/health-modify-run-${START_DATE}-${END_DATE}-freemapleafreecabj-sheet-unexposed.text-gen-hub-hanryeo.log`;
const MAX_PER_THEME = Number(process.env.MAX_PER_THEME || "3");
const INCLUDE_ALREADY_MODIFIED = process.env.INCLUDE_ALREADY_MODIFIED === "true";

const LEDGER_HEADERS: Array<keyof PlannedLedgerRow> = [
  "recordedAtKst",
  "modifiedAtKst",
  "publishedAtKst",
  "cafeName",
  "cafeId",
  "articleId",
  "articleUrl",
  "oldKeyword",
  "keyword",
  "postType",
  "writerAccountId",
  "oldTitle",
  "newTitle",
  "source",
  "scheduleFile",
  "logFile",
  "status",
  "note",
];

const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
};

const parseKeywordRows = (csvText: string): CsvKeywordRow[] =>
  parseCsv(csvText)
    .slice(1)
    .flatMap((row, index) => {
      const keyword = (row[0] || "").trim();
      if (!keyword) return [];

      return [
        {
          rowNumber: index + 2,
          keyword,
          exposureStatus: (row[1] || "").trim(),
          cafeName: (row[3] || "").trim(),
        },
      ];
    });

const kstDateToDate = (dateKey: string): Date =>
  new Date(`${dateKey}T00:00:00+09:00`);

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const formatKst = (date: Date): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
};

const todayKstDate = (): string => formatKst(new Date()).slice(0, 10);

const csvEscape = (value: string): string => {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};

const serializeCsv = (rows: PlannedLedgerRow[]): string => {
  const lines = [
    LEDGER_HEADERS.join(","),
    ...rows.map((row) =>
      LEDGER_HEADERS.map((header) => csvEscape(row[header] || "")).join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
};

const parseLedgerRows = (text: string): PlannedLedgerRow[] => {
  const [headerRow, ...dataRows] = parseCsv(text);
  const headers = headerRow as Array<keyof PlannedLedgerRow>;

  return dataRows.flatMap((row) => {
    if (row.every((value) => !value)) return [];
    const record = Object.fromEntries(
      headers.map((header, index) => [header, row[index] || ""]),
    ) as PlannedLedgerRow;
    return [record];
  });
};

const readLedgerKeywords = (): Set<string> => {
  const keywords = new Set<string>();
  if (!existsSync("scripts/artifacts")) return keywords;

  for (const fileName of readdirSync("scripts/artifacts")) {
    if (!/^cafe-modify-ledger-\d{4}-\d{2}-\d{2}\.csv$/.test(fileName)) {
      continue;
    }

    const rows = parseLedgerRows(
      readFileSync(`scripts/artifacts/${fileName}`, "utf8"),
    );
    for (const row of rows) {
      if (row.keyword) keywords.add(normalizeKeyword(row.keyword));
    }
  }

  return keywords;
};

const createRandom = (seed: string): (() => number) => {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T>(items: T[], seed: string): T[] => {
  const random = createRandom(seed);
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const selectKeywords = (
  rows: CsvKeywordRow[],
  count: number,
  excludedKeywords: Set<string>,
  seed: string,
): Array<CsvKeywordRow & { theme: string }> => {
  const seen = new Set<string>();
  const candidates = rows.flatMap((row) => {
    if (isExposedStatus(row.exposureStatus)) return [];

    const normalized = normalizeKeyword(row.keyword);
    if (seen.has(normalized) || excludedKeywords.has(normalized)) return [];
    seen.add(normalized);

    return [{ ...row, theme: inferKeywordTheme(row.keyword) }];
  });

  const shuffled = shuffle(candidates, seed);
  const themeCounts = new Map<string, number>();
  const selected: Array<CsvKeywordRow & { theme: string }> = [];

  for (const candidate of shuffled) {
    const themeCount = themeCounts.get(candidate.theme) || 0;
    if (themeCount >= MAX_PER_THEME) continue;

    selected.push(candidate);
    themeCounts.set(candidate.theme, themeCount + 1);

    if (selected.length === count) return selected;
  }

  for (const candidate of shuffled) {
    if (selected.some((item) => item.rowNumber === candidate.rowNumber)) continue;
    selected.push(candidate);
    if (selected.length === count) return selected;
  }

  throw new Error(`미노출 키워드 후보 부족: ${selected.length}/${count}`);
};

const mergeLedgerRows = (
  ledgerFile: string,
  plannedRows: PlannedLedgerRow[],
): PlannedLedgerRow[] => {
  const existingRows = existsSync(ledgerFile)
    ? parseLedgerRows(readFileSync(ledgerFile, "utf8"))
    : [];
  const plannedKeys = new Set(
    plannedRows.map((row) => `${row.cafeId}:${row.articleId}:${row.scheduleFile}`),
  );

  return [
    ...existingRows.filter(
      (row) => !plannedKeys.has(`${row.cafeId}:${row.articleId}:${row.scheduleFile}`),
    ),
    ...plannedRows,
  ];
};

const main = async (): Promise<void> => {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");
  if (!existsSync(CSV_FILE)) throw new Error(`CSV file not found: ${CSV_FILE}`);

  const generatedAtKst = formatKst(new Date());
  const start = kstDateToDate(START_DATE);
  const endExclusive = addDays(kstDateToDate(END_DATE), 1);
  const seed = `${CAFE_ID}:${START_DATE}:${END_DATE}:${SPREADSHEET_ID}:${SHEET_GID}`;

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const articles = await PublishedArticle.find({
    cafeId: CAFE_ID,
    publishedAt: { $gte: start, $lt: endExclusive },
  })
    .sort({ publishedAt: 1, articleId: 1 })
    .lean();

  const pendingArticles = INCLUDE_ALREADY_MODIFIED
    ? articles
    : articles.filter((article) => article.status !== "modified");
  const preModifiedArticles = articles.filter((article) => article.status === "modified");

  const sheetRows = parseKeywordRows(readFileSync(CSV_FILE, "utf8"));
  const excludedKeywords = readLedgerKeywords();
  for (const article of articles) {
    excludedKeywords.add(normalizeKeyword(String(article.keyword || "")));
  }

  const keywordSelectionTargetArticles = pendingArticles.filter(
    (article) => !(INCLUDE_ALREADY_MODIFIED && article.status === "modified"),
  );
  const selected = selectKeywords(
    sheetRows,
    keywordSelectionTargetArticles.length,
    excludedKeywords,
    seed,
  );

  let selectedIndex = 0;
  const schedule = pendingArticles.map((article): ScheduleItem => {
    const keyword =
      INCLUDE_ALREADY_MODIFIED && article.status === "modified"
        ? String(article.keyword || "")
        : selected[selectedIndex++].keyword;

    return {
      link:
        article.articleUrl ||
        `https://cafe.naver.com/ca-fe/cafes/${article.cafeId}/articles/${article.articleId}`,
      keyword,
      category: "",
    };
  });
  const [firstSchedule, ...remainingSchedule] = schedule;

  writeFileSync(SCHEDULE_FILE, `${JSON.stringify(schedule, null, 2)}\n`);
  writeFileSync(FIRST_SCHEDULE_FILE, `${JSON.stringify(firstSchedule ? [firstSchedule] : [], null, 2)}\n`);
  writeFileSync(REMAINING_SCHEDULE_FILE, `${JSON.stringify(remainingSchedule, null, 2)}\n`);

  let summarySelectedIndex = 0;
  const selectedSummaries = pendingArticles.map((article) => {
    const selectedKeyword =
      INCLUDE_ALREADY_MODIFIED && article.status === "modified"
        ? undefined
        : selected[summarySelectedIndex++];
    return {
      articleId: article.articleId,
      publishedAtKst: formatKst(article.publishedAt as Date),
      oldKeyword: article.keyword,
      keyword: selectedKeyword?.keyword || String(article.keyword || ""),
      sourceRowNumber: selectedKeyword?.rowNumber || null,
      theme: selectedKeyword?.theme || "existing-modified-keyword",
      writerAccountId: article.writerAccountId,
      statusBefore: article.status,
    };
  });

  const summary = {
    generatedAtKst,
    skill: "cafe-hanryeo-modify",
    target: {
      cafeName: CAFE_NAME,
      cafeId: CAFE_ID,
      dateRangeKst: {
        start: START_DATE,
        endInclusive: END_DATE,
      },
      totalArticles: articles.length,
      pendingArticles: pendingArticles.length,
      alreadyModifiedArticles: preModifiedArticles.length,
      alreadyModifiedArticleIds: preModifiedArticles.map((article) => article.articleId),
      includeAlreadyModified: INCLUDE_ALREADY_MODIFIED,
    },
    sourceSheet: {
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_NAME,
      gid: Number(SHEET_GID),
      csvFile: CSV_FILE,
      totalRows: sheetRows.length + 1,
      exposedRowsSkipped: sheetRows.filter((row) =>
        isExposedStatus(row.exposureStatus),
      ).length,
      ledgerOrCurrentKeywordsExcluded: excludedKeywords.size,
    },
    keywordSelection: {
      seed,
      maxPerTheme: MAX_PER_THEME,
      selected: selectedSummaries,
    },
    files: {
      scheduleFile: SCHEDULE_FILE,
      firstScheduleFile: FIRST_SCHEDULE_FILE,
      remainingScheduleFile: REMAINING_SCHEDULE_FILE,
      summaryFile: SUMMARY_FILE,
      logFile: LOG_FILE,
      ledgerCsvFile: `scripts/artifacts/cafe-modify-ledger-${todayKstDate()}.csv`,
      ledgerJsonFile: `scripts/artifacts/cafe-modify-ledger-${todayKstDate()}.json`,
    },
  };

  writeFileSync(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`);

  const ledgerCsvFile = summary.files.ledgerCsvFile;
  const ledgerJsonFile = summary.files.ledgerJsonFile;
  let ledgerSelectedIndex = 0;
  const plannedRows = pendingArticles.map((article): PlannedLedgerRow => {
    const articleUrl =
      article.articleUrl ||
      `https://cafe.naver.com/ca-fe/cafes/${article.cafeId}/articles/${article.articleId}`;
    const selectedKeyword =
      INCLUDE_ALREADY_MODIFIED && article.status === "modified"
        ? undefined
        : selected[ledgerSelectedIndex++];
    const keyword = selectedKeyword?.keyword || String(article.keyword || "");
    const sourceRow = selectedKeyword?.rowNumber
      ? ` row ${selectedKeyword.rowNumber}`
      : " existing modified keyword";
    const theme = selectedKeyword?.theme || "existing-modified-keyword";

    return {
      recordedAtKst: generatedAtKst,
      modifiedAtKst: "",
      publishedAtKst: formatKst(article.publishedAt as Date),
      cafeName: CAFE_NAME,
      cafeId: String(article.cafeId),
      articleId: String(article.articleId),
      articleUrl,
      oldKeyword: String(article.keyword || ""),
      keyword,
      postType: String(article.postType || ""),
      writerAccountId: String(article.writerAccountId || ""),
      oldTitle: String(article.title || ""),
      newTitle: "",
      source: "text-gen-hub-hanryeo",
      scheduleFile: SCHEDULE_FILE,
      logFile: LOG_FILE,
      status: "scheduled",
      note: `skill cafe-hanryeo-modify; source sheet ${SHEET_NAME} gid ${SHEET_GID}${sourceRow}; theme ${theme}; seed ${seed}`,
    };
  });

  const mergedLedgerRows = mergeLedgerRows(ledgerCsvFile, plannedRows);
  writeFileSync(ledgerCsvFile, serializeCsv(mergedLedgerRows));
  writeFileSync(ledgerJsonFile, `${JSON.stringify(mergedLedgerRows, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        scheduleFile: SCHEDULE_FILE,
        firstScheduleFile: FIRST_SCHEDULE_FILE,
        remainingScheduleFile: REMAINING_SCHEDULE_FILE,
        summaryFile: SUMMARY_FILE,
        logFile: LOG_FILE,
        ledgerCsvFile,
        totalArticles: articles.length,
        pendingArticles: pendingArticles.length,
        alreadyModifiedArticles: preModifiedArticles.length,
        firstArticleId: pendingArticles[0]?.articleId,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
