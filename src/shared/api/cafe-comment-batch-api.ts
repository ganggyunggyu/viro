import { normalizeText } from '@ganggyunggyu/shared';
import { generateContentWithPrompt } from './content-api';

export interface CafeCommentBatchInput {
  keyword: string;
  title?: string;
  body: string;
  model?: string;
}

export interface CafeGeneratedComment {
  index: number;
  type: 'comment';
  content: string;
}

export interface CafeCommentBatchResult {
  comments: CafeGeneratedComment[];
  rawContent: string;
  model: string;
  elapsed: number;
  prompt: string;
  warnings: string[];
}

interface ParsedCommentPayload {
  comments?: Array<Partial<CafeGeneratedComment>>;
}

const DEFAULT_MODEL = process.env.CAFE_COMMENT_MODEL || 'deepseek-v4-flash';
const START_CHECK_LENGTH = 6;
const MIN_COMMENT_LENGTH = 15;
const MAX_COMMENT_LENGTH = 140;
const MAX_BODY_LENGTH = 2500;

/** 댓글 개수는 전 경로에서 8개로 고정한다. 랜덤 개수/범위 옵션은 두지 않는다. */
export const CAFE_COMMENT_COUNT = 8;

const TWO_WORD_KEYWORD_SUFFIXES = new Set([
  '가격', '비용', '부작용', '복용법', '섭취법', '원인', '증상', '처방', '추천', '후기', '효능',
]);

export const resolveCafeCommentKeyword = (
  storedKeywordInput: string | null | undefined,
  titleInput: string,
): string => {
  const storedKeyword = normalizeText(storedKeywordInput ?? '');
  const title = normalizeText(titleInput);
  if (storedKeyword && storedKeyword !== title) return storedKeyword;

  const restaurantKeyword = title.match(/([가-힣A-Za-z0-9]+\s+맛집\s+추천|[가-힣A-Za-z0-9]+맛집)/)?.[1];
  if (restaurantKeyword) return normalizeText(restaurantKeyword);

  const words = title.split(/\s+/).filter(Boolean);
  if (words[0] && words[1] && TWO_WORD_KEYWORD_SUFFIXES.has(words[1])) {
    return `${words[0]} ${words[1]}`;
  }
  return words[0] || storedKeyword || '카페 글';
};

export const buildCafeCommentBatchPrompt = (input: CafeCommentBatchInput): string => {
  const keyword = normalizeText(input.keyword);
  const title = normalizeText(input.title ?? '');
  const body = normalizeText(input.body).slice(0, MAX_BODY_LENGTH);

  return `너는 네이버 카페에서 방금 이 글을 끝까지 읽은 일반 회원 ${CAFE_COMMENT_COUNT}명이야.

각자 글에서 인상 깊었던 대목을 하나씩 골라, 그 내용이 무슨 얘기였는지 자기 말로 한 번 더 풀어서 설명하는 댓글을 단다.

## 출력 형식
반드시 JSON만 출력한다. 마크다운 코드블록, 설명문, 머리말, 꼬리말 금지.

{
  "comments": [
    {
      "index": 1,
      "type": "comment",
      "content": "실제 등록할 댓글"
    }
  ]
}

## 개수
댓글은 정확히 ${CAFE_COMMENT_COUNT}개 작성한다.

## 작성 방향
- 본문에서 실제로 다룬 내용 중 하나를 짚어서, 그게 어떤 얘기였는지 자기 말로 풀어서 설명한다.
- 설명한 뒤에 짧은 소감이나 인사를 한 마디만 덧붙인다.
- ${CAFE_COMMENT_COUNT}개 댓글은 각각 본문의 서로 다른 부분을 설명한다. 같은 대목을 두 번 설명하면 실패다.
- 본문을 그대로 복사하지 말고, 읽은 사람이 요약해서 되짚는 말투로 바꿔 쓴다.

## 규칙
- 모든 type은 "comment"만 사용한다. 대댓글은 만들지 않는다.
- index, type, content 외의 필드는 만들지 않는다.
- content는 1~2문장, ${MIN_COMMENT_LENGTH}~${MAX_COMMENT_LENGTH}자 사이의 존댓말로 쓴다.
- 본문에 없는 상호, 가격, 효능, 수치, 지역, 개인 경험은 지어내지 않는다.
- 각 댓글마다 "${keyword}"를 정확히 1번 포함한다. 빠뜨리거나 한 댓글에서 2번 이상 반복하면 실패다.
- 키워드는 문장 앞에만 몰아넣지 말고, 문장 중간이나 뒤에도 자연스럽게 배치한다.
- 평가, 훈수, 과한 칭찬, 광고 문구, 구매 유도는 쓰지 않는다.
- "원고", "글쓴이님이 쓰신 원고" 같은 표현은 쓰지 않는다.
- 닉네임, 아이디, 해시태그, 이모지, URL, 마크다운은 쓰지 않는다.
- 첫 ${START_CHECK_LENGTH}글자가 같은 댓글이 있으면 실패다.

## 키워드
${keyword}

## 글 제목
${title || '(제목 없음)'}

## 글 본문
${body}

JSON만 출력한다.`;
};

const extractJsonText = (rawContent: string): string => {
  const trimmed = rawContent.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const parseComments = (rawContent: string): CafeGeneratedComment[] => {
  const parsed = JSON.parse(extractJsonText(rawContent)) as ParsedCommentPayload;
  return (parsed.comments || [])
    .map((comment, index) => ({
      index: Number(comment.index || index + 1),
      type: 'comment' as const,
      content: normalizeText(String(comment.content || '')),
    }))
    .filter((comment) => comment.content.length > 0);
};

const countKeywordOccurrences = (content: string, keyword: string): number => {
  if (!keyword) return 0;

  let count = 0;
  let offset = 0;
  while (offset <= content.length - keyword.length) {
    const index = content.indexOf(keyword, offset);
    if (index < 0) break;
    count += 1;
    offset = index + keyword.length;
  }
  return count;
};

export const validateCafeComments = (
  comments: CafeGeneratedComment[],
  keywordInput?: string,
): string[] => {
  const warnings: string[] = [];
  const keyword = normalizeText(keywordInput ?? '');

  if (comments.length !== CAFE_COMMENT_COUNT) {
    warnings.push(`count-mismatch:${comments.length}/${CAFE_COMMENT_COUNT}`);
  }

  const starts = new Map<string, number>();
  for (const comment of comments) {
    if (comment.content.length < MIN_COMMENT_LENGTH) warnings.push(`short:${comment.index}`);
    if (comment.content.length > MAX_COMMENT_LENGTH) warnings.push(`long:${comment.index}`);
    if (comment.content.includes('원고')) warnings.push(`contains-wongo:${comment.index}`);
    if (keyword) {
      const keywordCount = countKeywordOccurrences(comment.content, keyword);
      if (keywordCount !== 1) warnings.push(`keyword-count:${comment.index}:${keywordCount}`);
    }

    const start = comment.content.slice(0, START_CHECK_LENGTH);
    starts.set(start, (starts.get(start) || 0) + 1);
  }

  for (const [start, count] of starts) {
    if (count > 1) warnings.push(`duplicate-start:${start}`);
  }

  return warnings;
};

export const generateCafeCommentBatch = async (
  input: CafeCommentBatchInput,
): Promise<CafeCommentBatchResult> => {
  const prompt = buildCafeCommentBatchPrompt(input);
  const model = input.model || DEFAULT_MODEL;
  const response = await generateContentWithPrompt({ prompt, model });
  const rawContent = response.content || '';
  const keyword = normalizeText(input.keyword);
  const parsedComments = parseComments(rawContent).slice(0, CAFE_COMMENT_COUNT);
  const keywordWarnings = validateCafeComments(parsedComments, keyword)
    .filter((warning) => warning.startsWith('keyword-count:'));
  // 프롬프트를 어긴 댓글은 어떤 호출 경로에서도 실제 게시 대상으로 흘러가지 않게 막는다.
  const comments = parsedComments.filter(
    ({ content }) => countKeywordOccurrences(content, keyword) === 1,
  );
  const warnings = Array.from(new Set([
    ...validateCafeComments(comments, keyword),
    ...keywordWarnings,
  ]));

  return {
    comments,
    rawContent,
    model: response.model || model,
    elapsed: Number(response.elapsed || 0),
    prompt,
    warnings,
  };
};
