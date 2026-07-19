import { generateContentWithPrompt } from './content-api';

export interface CafeCommentBatchInput {
  title: string;
  body: string;
  keyword?: string;
  category?: string;
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
const MAX_BODY_CHARS = 4500;
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
  const title = normalizeText(input.title);
  const body = normalizeText(input.body).slice(0, MAX_BODY_CHARS);
  const keyword = normalizeText(input.keyword || '');
  const category = normalizeText(input.category || '');
  const keywordRule = keyword
    ? `- 댓글 중 3개 정도는 "${keyword}"를 문장에 자연스럽게 그대로 포함시킨다. 전체 개수가 3개보다 적으면 가능한 만큼만 포함한다.`
    : '';

  return `너는 네이버 카페 댓글 작성자 여러 명을 시뮬레이션한다.

아래 카페 글을 읽고, 글 내용과 직접 연결되는 일반 댓글만 만든다.

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

## 댓글 작성 규칙
- 모든 type은 "comment"만 사용한다. 대댓글은 만들지 않는다.
- content는 실제 카페 댓글처럼 한 줄로 작성한다.
- content는 35~120자 사이로 쓴다.
- 모든 문장은 존댓말로 쓴다.
- 글의 구체 요소를 받아서 말한다. 제목만 보고 쓴 듯한 포괄 댓글 금지.
- 글에 없는 상호, 가격, 지역, 효능, 후기, 병원명, 제품명을 새로 만들지 않는다.
${keywordRule}
- 글에 없는 방문 경험, 품절 경험, 대기 시간, 메뉴명, 좌석 수, 주차 상황을 실제로 겪은 것처럼 꾸며내지 않는다.
- content에 "원고"라는 단어를 절대 쓰지 않는다. 실제 카페 회원은 "원고"라고 말하지 않는다. 글을 가리킬 때는 "글", "내용", "정보", "여기"라고 쓰거나 아예 지칭을 생략한다.
- 글 제목이나 카페 이름이 영문/숫자 코드(예: livingnote702)로만 되어 있으면, 그 코드를 댓글에 그대로 옮기지 않는다. 본문 내용을 근거로 자연스럽게 쓴다.
- 개인 경험형 댓글도 "이런 경우가 있더라고요" 수준으로 일반화한다. "지난번에 갔을 때", "제가 갔던 곳은"처럼 실방문을 단정하지 않는다.
- 닉네임, 아이디, 해시태그, 이모지, URL, 마크다운, 따옴표 과다 사용 금지.
- 광고처럼 보이는 추천, 구매 유도, 문의 유도 금지.
- "저도", "저는", "맞아요", "공감돼요", "좋은 정보"로 시작하는 댓글은 전체에서 각각 최대 1개만 허용한다.
- 첫 6글자가 같은 댓글이 있으면 실패다.
- 문장 끝도 모두 비슷하면 실패다. "~같아요", "~네요", "~더라고요", 질문형, 짧은 반응형을 섞는다.
- 모든 댓글이 칭찬/공감이면 실패다. 질문, 경험, 비교, 주의, 생활 장면, 메모/저장, 조건 확인을 섞는다.

## 페르소나 분산
아래 유형 중 최소 5개 이상을 섞는다.
- 처음 방문 전 체크하는 사람
- 실제 다녀온 경험을 떠올리는 사람
- 숫자/시간/동선/좌석 같은 조건을 확인하는 사람
- 사진보다 편의성을 보는 사람
- 가족/친구/반려동물 동행을 생각하는 사람
- 주말 혼잡이나 대기 시간을 걱정하는 사람
- 저장해두고 나중에 보려는 사람
- 글의 특정 문장을 보고 추가 질문하는 사람
- 살짝 조심스럽게 다른 기준을 덧붙이는 사람

## 글 정보
제목: ${title}
키워드: ${keyword || '(없음)'}
카테고리: ${category || '(없음)'}

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
    if (comment.content.length < 20) warnings.push(`short:${comment.index}`);
    if (comment.content.length > 140) warnings.push(`long:${comment.index}`);
    if (comment.content.includes('원고')) warnings.push(`contains-wongo:${comment.index}`);

    const start = comment.content.slice(0, START_CHECK_LENGTH);
    starts.set(start, (starts.get(start) || 0) + 1);
  }

  for (const [start, count] of starts) {
    if (count > 1) warnings.push(`duplicate-start:${start}`);
  }

  const bannedStartCounts = ['저도', '저는', '맞아요', '공감돼요', '좋은 정보'].map((token) => ({
    token,
    count: comments.filter((comment) => comment.content.startsWith(token)).length,
  }));

  for (const { token, count } of bannedStartCounts) {
    if (count > 1) warnings.push(`repeated-opening:${token}:${count}`);
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
