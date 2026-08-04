/**
 * 댓글 개수는 전 경로에서 8개로 고정한다. 랜덤 개수/범위 옵션은 두지 않는다.
 *
 * cafe-comment-batch-api는 @google/genai와 서버 환경변수를 끌어오므로 클라이언트 컴포넌트에서
 * import할 수 없다. 개수만 화면에 표시하려는 곳이 그 모듈 전체를 번들에 넣지 않도록 상수만 분리했다.
 */
export const CAFE_COMMENT_COUNT = 8;
