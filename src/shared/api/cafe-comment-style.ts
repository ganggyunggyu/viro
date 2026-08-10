/**
 * 댓글 어조(스타일). cafe-comment-batch-api는 서버 전용 모듈이라 클라이언트 컴포넌트에서
 * import할 수 없어서, 선택지만 쓰는 화면이 그 모듈 전체를 번들에 넣지 않도록 상수만 분리했다.
 */
export const CAFE_COMMENT_STYLES = ['explain', 'question'] as const;

export type CafeCommentStyle = (typeof CAFE_COMMENT_STYLES)[number];

export const DEFAULT_CAFE_COMMENT_STYLE: CafeCommentStyle = 'explain';

export const CAFE_COMMENT_STYLE_LABELS: Record<CafeCommentStyle, string> = {
  explain: '본문 되짚기',
  question: '티키타카 질문',
};

export const CAFE_COMMENT_STYLE_DESCRIPTIONS: Record<CafeCommentStyle, string> = {
  explain: '본문에서 인상 깊은 대목을 각자 자기 말로 풀어 설명합니다',
  question: '본문을 읽고 더 궁금한 점을 글쓴이에게 물어보는 질문형 댓글을 답니다',
};

export const isCafeCommentStyle = (value: unknown): value is CafeCommentStyle =>
  CAFE_COMMENT_STYLES.includes(value as CafeCommentStyle);
