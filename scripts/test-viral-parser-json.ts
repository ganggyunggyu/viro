import { parseViralResponse, getCommentStats } from '../src/features/viral/viral-parser';

const SAMPLE_JSON = `[
  {"index":1,"type":"comment","content":"저장합니다 진짜 너무 꼼꼼하게 써주셨다"},
  {"index":1,"type":"author_reply","parentIndex":1,"content":"감사해요 ㅠ 도움 되셨으면 좋겠어요"},
  {"index":2,"type":"comment","content":"저도 작년에 검사 받았는데 그때 우셨다는 부분 읽다가 눈물 날 뻔 했어요"},
  {"index":3,"type":"author_reply","parentIndex":2,"content":"맞아요 그 기다리는 시간이 제일 힘들더라고요"},
  {"index":4,"type":"commenter_reply","parentIndex":2,"content":"저도 결과 기다리는 중인데 위로됐어요"},
  {"index":3,"type":"comment","content":"CIN1이면 자연 소실도 많다고 들었는데 맞죠?"},
  {"index":6,"type":"author_reply","parentIndex":3,"content":"네 선생님도 그렇게 말씀해주셨어요"},
  {"index":99,"type":"other_reply","parentIndex":777,"content":"고아 대댓 - 부모 못 찾아도 살아남아야 함"},
  {"index":50,"type":"comment","content":"비교표 너무 잘 정리해주셨다"}
]`;

const SAMPLE_RESPONSE = `[제목]
JSON 댓글 파싱 테스트 제목입니다

[본문]
이건 본문 내용임. 별로 길지 않은 본문.
두 번째 줄도 있음.

[댓글]
${SAMPLE_JSON}
`;

const parsed = parseViralResponse(SAMPLE_RESPONSE);

if (!parsed) {
  console.error('❌ 파싱 실패');
  process.exit(1);
}

console.log('=== 제목 ===');
console.log(parsed.title);
console.log('\n=== 본문 ===');
console.log(parsed.body);
console.log('\n=== 댓글 통계 ===');
console.log(getCommentStats(parsed.comments));
console.log('\n=== 파싱된 댓글 ===');
for (const c of parsed.comments) {
  const parent = c.parentIndex !== undefined ? ` → parent:${c.parentIndex}` : '';
  console.log(`  [${c.type}] index=${c.index}${parent}  ${c.content.slice(0, 40)}`);
}

const mainComments = parsed.comments.filter((c) => c.type === 'comment');
const replies = parsed.comments.filter((c) => c.type !== 'comment');
const orphanReplies = replies.filter(
  (r) => !mainComments.some((c) => c.index === r.parentIndex),
);

console.log('\n=== 검증 ===');
console.log(`메인 댓글: ${mainComments.length}건 (기대: 4)`);
console.log(`대댓글: ${replies.length}건 (기대: 5)`);
console.log(`고아 대댓글: ${orphanReplies.length}건 (기대: 0 — 자동 부모 매핑)`);

const indexUnique = new Set(parsed.comments.map((c) => c.index)).size === parsed.comments.length;
console.log(`index 중복 없음: ${indexUnique ? 'OK' : 'FAIL'}`);

const allOk =
  mainComments.length === 4 &&
  replies.length === 5 &&
  orphanReplies.length === 0 &&
  indexUnique;

console.log(`\n${allOk ? '✅ 전체 OK' : '❌ 검증 실패'}`);
process.exit(allOk ? 0 : 1);
