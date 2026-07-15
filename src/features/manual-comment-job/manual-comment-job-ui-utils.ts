const CAFE_URL_PATTERN = /https?:\/\/[^\s]*(?:cafe\.naver\.com|naver\.me)[^\s]*/i;
export const NUMBERED_LINE_PATTERN = /^\s*\d+[.)번]\s*(.+)$/;

export interface SmartPasteResult {
  url: string | null;
  comments: string[];
}

export const parseSmartPaste = (raw: string): SmartPasteResult => {
  const urlMatch = raw.match(CAFE_URL_PATTERN);
  const comments = raw
    .split('\n')
    .map((line) => line.match(NUMBERED_LINE_PATTERN)?.[1]?.trim())
    .filter((line): line is string => Boolean(line));

  return { url: urlMatch?.[0] ?? null, comments };
};

export const parseFixedComments = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.replace(/^\d+[.)번]?\s*/, '').trim())
    .filter(Boolean);

export const formatRelativeTime = (iso: string, now: number = Date.now()): string => {
  const diffMs = now - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};
