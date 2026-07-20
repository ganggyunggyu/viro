import { generateContentWithPrompt } from './content-api';

export interface CafeCommentBatchInput {
  keyword: string;
  minCount?: number;
  maxCount?: number;
  exactCount?: number;
  model?: string;
}

export interface CafeGeneratedComment {
  index: number;
  type: 'comment';
  persona: string;
  intent: string;
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

const DEFAULT_MODEL = 'deepseek-v4-flash';
const DEFAULT_MIN_COUNT = 5;
const DEFAULT_MAX_COUNT = 10;
const START_CHECK_LENGTH = 6;

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getCountRule = (input: CafeCommentBatchInput): string => {
  if (input.exactCount) {
    const exactCount = clamp(input.exactCount, 1, 20);
    return `댓글은 정확히 ${exactCount}개 작성한다.`;
  }

  const minCount = clamp(input.minCount ?? DEFAULT_MIN_COUNT, 1, 20);
  const maxCount = clamp(input.maxCount ?? DEFAULT_MAX_COUNT, minCount, 20);
  return `댓글은 ${minCount}~${maxCount}개 사이에서 자연스럽게 랜덤 개수로 작성한다.`;
};

export const buildCafeCommentBatchPrompt = (input: CafeCommentBatchInput): string => {
  const keyword = normalizeText(input.keyword);

  return `너는 네이버 카페에서 짧고 무난한 댓글을 다는 일반 회원 여러 명이야.

입력으로 받은 키워드만 보고 댓글을 작성해.

## 출력 형식
반드시 JSON만 출력한다. 마크다운 코드블록, 설명문, 머리말, 꼬리말 금지.

{
  "comments": [
    {
      "index": 1,
      "type": "comment",
      "persona": "댓글러 성격 한 줄",
      "intent": "댓글 의도 한 줄",
      "content": "실제 등록할 댓글"
    }
  ]
}

## 개수
${getCountRule(input)}

## 작성 방향
- 잘 보고 갑니다
- 좋은 정보 감사합니다
- 저도 ${keyword}에 관한 정보를 찾아봤는데 좋은 정보 감사합니다
- ${keyword} 관련 내용 잘 보고 갑니다
- 장소나 맛집 키워드라면 제가 가본 곳도 좋았는데 소개해주신 곳도 좋아 보이네요

## 규칙
- 모든 type은 "comment"만 사용한다. 대댓글은 만들지 않는다.
- 위 예시를 매번 그대로 복사하지 말고 비슷한 의미로 자연스럽게 바꾼다.
- content는 한 문장, 10~50자 정도의 무난한 존댓말로 쓴다.
- 일부 댓글은 ${keyword}를 자연스럽게 언급하고, 일부는 키워드 없이 짧게 마무리한다.
- 질문, 평가, 과한 칭찬, 광고 문구는 쓰지 않는다.
- 키워드 외의 상호, 가격, 효능, 지역, 메뉴, 구체적인 경험은 지어내지 않는다.
- 닉네임, 아이디, 해시태그, 이모지, URL, 마크다운은 쓰지 않는다.
- 첫 6글자가 같은 댓글이 있으면 실패다.

## 키워드
${keyword}

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
      persona: normalizeText(String(comment.persona || '')),
      intent: normalizeText(String(comment.intent || '')),
      content: normalizeText(String(comment.content || '')),
    }))
    .filter((comment) => comment.content.length > 0);
};

const validateComments = (
  comments: CafeGeneratedComment[],
  input: CafeCommentBatchInput,
): string[] => {
  const warnings: string[] = [];
  const minCount = input.exactCount ?? input.minCount ?? DEFAULT_MIN_COUNT;
  const maxCount = input.exactCount ?? input.maxCount ?? DEFAULT_MAX_COUNT;

  if (comments.length < minCount || comments.length > maxCount) {
    warnings.push(`count-out-of-range:${comments.length}/${minCount}-${maxCount}`);
  }

  const starts = new Map<string, number>();
  for (const comment of comments) {
    if (comment.content.length < 8) warnings.push(`short:${comment.index}`);
    if (comment.content.length > 60) warnings.push(`long:${comment.index}`);
    if (comment.content.includes('원고')) warnings.push(`contains-wongo:${comment.index}`);

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
  const comments = parseComments(rawContent);

  return {
    comments,
    rawContent,
    model: response.model || model,
    elapsed: Number(response.elapsed || 0),
    prompt,
    warnings: validateComments(comments, input),
  };
};
