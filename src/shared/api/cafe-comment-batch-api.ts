import { normalizeText } from '@ganggyunggyu/shared';
import { generateContentWithPrompt } from './content-api';
import { CAFE_COMMENT_COUNT } from './cafe-comment-count';
import { DEFAULT_CAFE_COMMENT_STYLE, type CafeCommentStyle } from './cafe-comment-style';

export interface CafeCommentBatchInput {
  keyword: string;
  title?: string;
  body: string;
  model?: string;
  style?: CafeCommentStyle;
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
/** 질문형에서 "~하셨는데" 류 인용 연결어를 몇 개 댓글까지 허용할지 (8개 중). */
const MAX_QUOTE_CONNECTORS = 3;

/** 의문형 어미 없이 평서문으로 끝맺고 물음표만 붙인 문장. */
const DECLARATIVE_ENDING_PATTERN =
  /(습니다|합니다|됩니다|입니다|네요|어요|아요|군요|겠어요|같아요|싶어요|드려요)\s*\?\s*$/;

/**
 * 본문을 받아올 때 쓰는 인용 연결어. 하나에 몰리면 8개가 같은 틀로 보인다.
 * "하셨는데"만 잡으면 "고르셨는데", "챙기셨는데"를 놓치므로 선행 어간과 무관하게 어미로 잡는다.
 */
const QUOTE_CONNECTOR_PATTERN = /셨는데|셨다는데|시던데|셨다니|신다는데/;

export { CAFE_COMMENT_COUNT } from './cafe-comment-count';
export {
  CAFE_COMMENT_STYLES,
  DEFAULT_CAFE_COMMENT_STYLE,
  isCafeCommentStyle,
  type CafeCommentStyle,
} from './cafe-comment-style';

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

const STYLE_INTROS: Record<CafeCommentStyle, string> = {
  explain: `너는 네이버 카페에서 방금 이 글을 끝까지 읽은 일반 회원 ${CAFE_COMMENT_COUNT}명이야.

각자 글에서 인상 깊었던 대목을 하나씩 골라, 그 내용이 무슨 얘기였는지 자기 말로 한 번 더 풀어서 설명하는 댓글을 단다.`,
  question: `너는 네이버 카페에서 방금 이 글을 끝까지 읽은 일반 회원 ${CAFE_COMMENT_COUNT}명이야.

각자 글에서 걸리는 대목을 하나씩 짚어, 글쓴이한테 더 물어보고 싶은 걸 질문으로 던지는 댓글을 단다.`,
};

const STYLE_DIRECTIONS: Record<CafeCommentStyle, string> = {
  explain: `- 본문에서 실제로 다룬 내용 중 하나를 짚어서, 그게 어떤 얘기였는지 자기 말로 풀어서 설명한다.
- 설명한 뒤에 짧은 소감이나 인사를 한 마디만 덧붙인다.
- ${CAFE_COMMENT_COUNT}개 댓글은 각각 본문의 서로 다른 부분을 설명한다. 같은 대목을 두 번 설명하면 실패다.
- 본문을 그대로 복사하지 말고, 읽은 사람이 요약해서 되짚는 말투로 바꿔 쓴다.`,
  question: `- 각 댓글은 물음표로 끝나는 질문을 정확히 1개만 담는다. 질문을 두 개 이어 붙이지 않는다.
- 문장 끝은 의문형 어미로 맺는다("~나요?", "~까요?", "~인가요?", "~던가요?").
  "궁금합니다?", "알고 싶습니다?"처럼 평서문 끝에 물음표만 붙이면 실패다.
- 본문에 이미 답이 그대로 적혀 있는 건 묻지 않는다. 읽고 나서 자연히 더 궁금해질 만한 걸 묻는다.
- 실제 카페에서 회원끼리 말 주고받듯 짧게 쓴다.

## 댓글별 질문 각도 (index마다 지정된 각도로 쓴다)
아래 각도를 그대로 index 순서에 맞춰 배정한다. 각도가 다르면 문장 구조도 저절로 달라진다.

1. **방법** — 본문 내용을 어떻게 실행하는지 묻는다. 예) "그건 어떤 순서로 하면 되나요?"
2. **기준** — 무엇을 보고 판단하는지 묻는다. 예) "고를 때 무엇부터 보게 되나요?"
3. **상황** — 어떤 경우에 해당하는지 묻는다. 예) "이런 경우에도 똑같이 적용되나요?"
4. **비교** — 두 가지 중 어느 쪽인지 묻는다. 예) "A랑 B 중에 어느 쪽이 나은가요?"
5. **경험** — 글쓴이가 직접 겪은 결과를 묻는다. 예) "해보시니 차이가 크던가요?"
6. **예외** — 안 통하는 경우를 묻는다. 예) "잘 안 맞는 경우도 있었나요?"
7. **정도** — 얼마나/몇 번인지 수치를 묻는다. 예) "보통 어느 정도로 잡으시나요?"
8. **다음 단계** — 그다음에 뭘 하는지 묻는다. 예) "그러고 나면 뭘 확인하나요?"

## 문장 시작 방식 (아래 배분을 지킨다)
- index 1, 4, 7 — 본문 표현을 짧은 명사구로만 받아서 바로 묻는다. 예) "실내 건조 대비 로션은 성분표에서 뭘 보나요?"
- index 2, 5, 8 — 본문 인용 없이 자기 상황을 한 조각 깔고 묻는다. 예) "첫째 때는 몰라서 넘겼는데, 이건 언제부터 챙기나요?"
- index 3, 6 — "~하셨는데", "~하셨다는데" 같은 인용 연결어를 써도 된다. 여기 2개까지만이다.

${CAFE_COMMENT_COUNT}개 댓글이 전부 "~하셨는데"로 시작하면 실패다.`,
};

export const buildCafeCommentBatchPrompt = (input: CafeCommentBatchInput): string => {
  const keyword = normalizeText(input.keyword);
  const title = normalizeText(input.title ?? '');
  const body = normalizeText(input.body).slice(0, MAX_BODY_LENGTH);
  const style = input.style ?? DEFAULT_CAFE_COMMENT_STYLE;

  return `${STYLE_INTROS[style]}

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
${STYLE_DIRECTIONS[style]}

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
  style: CafeCommentStyle = DEFAULT_CAFE_COMMENT_STYLE,
): string[] => {
  const warnings: string[] = [];
  const keyword = normalizeText(keywordInput ?? '');

  if (comments.length !== CAFE_COMMENT_COUNT) {
    warnings.push(`count-mismatch:${comments.length}/${CAFE_COMMENT_COUNT}`);
  }

  const starts = new Map<string, number>();
  let quoteConnectorCount = 0;
  for (const comment of comments) {
    if (comment.content.length < MIN_COMMENT_LENGTH) warnings.push(`short:${comment.index}`);
    if (comment.content.length > MAX_COMMENT_LENGTH) warnings.push(`long:${comment.index}`);
    if (comment.content.includes('원고')) warnings.push(`contains-wongo:${comment.index}`);
    if (style === 'question') {
      if (!comment.content.includes('?')) {
        warnings.push(`missing-question:${comment.index}`);
      } else if (DECLARATIVE_ENDING_PATTERN.test(comment.content)) {
        // "궁금합니다?"처럼 평서문 끝에 물음표만 붙인 것. 물음표는 있으니 위 검사는 통과한다.
        warnings.push(`fake-question:${comment.index}`);
      }
      if (QUOTE_CONNECTOR_PATTERN.test(comment.content)) quoteConnectorCount += 1;
    }
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

  // 8개 댓글이 죄다 "~하셨는데"로 본문을 받아오면 앞 6글자는 다 달라도 한눈에 봇 티가 난다.
  if (style === 'question' && quoteConnectorCount > MAX_QUOTE_CONNECTORS) {
    warnings.push(`quote-connector-overuse:${quoteConnectorCount}/${comments.length}`);
  }

  return warnings;
};

export const generateCafeCommentBatch = async (
  input: CafeCommentBatchInput,
): Promise<CafeCommentBatchResult> => {
  const style = input.style ?? DEFAULT_CAFE_COMMENT_STYLE;
  const prompt = buildCafeCommentBatchPrompt({ ...input, style });
  const model = input.model || DEFAULT_MODEL;
  const response = await generateContentWithPrompt({ prompt, model });
  const rawContent = response.content || '';
  const keyword = normalizeText(input.keyword);
  const parsedComments = parseComments(rawContent).slice(0, CAFE_COMMENT_COUNT);
  const keywordWarnings = validateCafeComments(parsedComments, keyword, style)
    .filter((warning) => warning.startsWith('keyword-count:'));
  // 프롬프트를 어긴 댓글은 어떤 호출 경로에서도 실제 게시 대상으로 흘러가지 않게 막는다.
  const comments = parsedComments.filter(
    ({ content }) => countKeywordOccurrences(content, keyword) === 1,
  );
  const warnings = Array.from(new Set([
    ...validateCafeComments(comments, keyword, style),
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
