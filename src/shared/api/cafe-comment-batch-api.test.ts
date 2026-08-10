import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAFE_COMMENT_COUNT,
  buildCafeCommentBatchPrompt,
  resolveCafeCommentKeyword,
  validateCafeComments,
} from './cafe-comment-batch-api';

const BODY = [
  '무릎이 시큰거려서 강아지 관절 영양제를 찾아봤습니다.',
  '글루코사민과 MSM이 같이 들어간 제품을 주로 본다고 하네요.',
  '급여량은 체중 기준으로 나눠서 주는 게 기본이라고 합니다.',
].join('\n');

test('프롬프트는 댓글 개수를 8개로 고정한다', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    title: '강아지 관절 영양제 알아본 후기',
    body: BODY,
  });

  assert.equal(CAFE_COMMENT_COUNT, 8);
  assert.match(prompt, /정확히 8개/);
  assert.doesNotMatch(prompt, /랜덤 개수/);
  assert.doesNotMatch(prompt, /\d+~\d+개 사이/);
});

test('프롬프트는 원고 제목과 본문을 그대로 싣는다', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    title: '강아지 관절 영양제 알아본 후기',
    body: BODY,
  });

  assert.match(prompt, /강아지 관절 영양제 알아본 후기/);
  assert.match(prompt, /글루코사민과 MSM이 같이 들어간 제품/);
  assert.match(prompt, /본문/);
});

test('프롬프트는 본문 내용을 다시 풀어 설명하는 댓글을 요구한다', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    body: BODY,
  });

  assert.match(prompt, /본문에서 실제로 다룬 내용/);
  assert.match(prompt, /풀어서 설명/);
  assert.match(prompt, /서로 다른 부분/);
});

test('프롬프트는 모든 댓글에 키워드를 정확히 한 번씩 요구한다', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    body: BODY,
  });

  assert.match(prompt, /각 댓글마다 "강아지 관절 영양제"를 정확히 1번/);
  assert.doesNotMatch(prompt, /직접 언급은 전체에서 최대 2개/);
});

test('프롬프트에서 옛 정형 예시 문구는 사라졌다', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    body: BODY,
  });

  assert.doesNotMatch(prompt, /잘 보고 갑니다/);
  assert.doesNotMatch(prompt, /좋은 정보 감사합니다/);
  assert.doesNotMatch(prompt, /제가 가본 곳도 좋았는데/);
  assert.doesNotMatch(prompt, /persona/i);
});

test('본문이 길면 앞부분만 잘라서 싣는다', () => {
  const longBody = `${'가'.repeat(5000)}끝문장`;
  const prompt = buildCafeCommentBatchPrompt({ keyword: '테스트', body: longBody });

  assert.ok(prompt.length < 5000);
  assert.doesNotMatch(prompt, /끝문장/);
});

const buildComments = (contents: string[]) =>
  contents.map((content, index) => ({
    index: index + 1,
    type: 'comment' as const,
    content,
  }));

const EIGHT_OK = [
  '글루코사민이랑 MSM이 같이 들어간 걸 본다는 얘기가 도움이 됐어요',
  '급여량을 체중 기준으로 나눠서 준다는 부분 메모해뒀습니다',
  '무릎이 시큰거릴 때부터 찾아보셨다는 흐름이 이해가 잘 되네요',
  '성분 두 가지를 같이 보는 이유가 정리돼 있어서 읽기 편했어요',
  '체중별로 양이 달라진다는 설명이 특히 실용적이었습니다',
  '관절 쪽은 미리 챙겨야 한다는 맥락으로 읽었어요',
  '제품 고를 때 성분표부터 본다는 얘기로 이해했습니다',
  '처음 알아보는 입장에서 순서대로 정리돼 있어 좋았어요',
];

test('댓글이 8개면 개수 경고가 없다', () => {
  const warnings = validateCafeComments(buildComments(EIGHT_OK));
  assert.deepEqual(
    warnings.filter((warning) => warning.startsWith('count-')),
    [],
  );
});

test('댓글이 8개가 아니면 개수 경고가 붙는다', () => {
  const warnings = validateCafeComments(buildComments(EIGHT_OK.slice(0, 5)));
  assert.ok(warnings.includes('count-mismatch:5/8'));
});

test('앞 6글자가 겹치면 중복 경고가 붙는다', () => {
  const duplicated = [...EIGHT_OK.slice(0, 7), EIGHT_OK[0]];
  const warnings = validateCafeComments(buildComments(duplicated));
  assert.ok(warnings.some((warning) => warning.startsWith('duplicate-start:')));
});

test('원고라는 단어가 들어가면 경고가 붙는다', () => {
  const withWongo = [...EIGHT_OK.slice(0, 7), '원고에 적어주신 급여량 설명이 도움이 많이 됐습니다'];
  const warnings = validateCafeComments(buildComments(withWongo));
  assert.ok(warnings.some((warning) => warning.startsWith('contains-wongo:')));
});

test('각 댓글의 키워드 언급 횟수가 1회가 아니면 경고가 붙는다', () => {
  const keyword = '강아지 관절 영양제';
  const contents = [
    `${keyword} 성분을 함께 본다는 설명이 이해하기 쉬웠어요`,
    '체중별 급여량을 나눈다는 부분을 잘 읽었습니다',
    `${keyword} 선택 기준에서 ${keyword} 성분표를 본다는 점이 기억에 남네요`,
    ...EIGHT_OK.slice(3).map((content) => `${keyword} ${content}`),
  ];
  const warnings = validateCafeComments(buildComments(contents), keyword);

  assert.ok(warnings.includes('keyword-count:2:0'));
  assert.ok(warnings.includes('keyword-count:3:2'));
  assert.ok(!warnings.includes('keyword-count:1:1'));
});

test('저장 키워드가 없으면 제목에서 짧은 댓글 키워드를 고른다', () => {
  assert.equal(
    resolveCafeCommentKeyword('', '종로웨딩밴드 오래 낄 형태'),
    '종로웨딩밴드',
  );
  assert.equal(
    resolveCafeCommentKeyword('', '나만 알고싶은 신촌 맛집 추천 산산바베큐'),
    '신촌 맛집 추천',
  );
  assert.equal(
    resolveCafeCommentKeyword('', '마운자로 처방 전 확인할 점'),
    '마운자로 처방',
  );
});

const EIGHT_QUESTIONS = [
  '글루코사민이랑 MSM을 같이 보라고 하셨는데 둘 중 뭘 우선해야 할까요?',
  '체중 기준 급여량은 하루 한 번에 다 주는 건가요?',
  '무릎이 시큰거리기 시작하면 바로 챙기는 게 나을까요?',
  '성분 두 가지가 다 들어간 제품은 가격대가 어느 정도인가요?',
  '급여량을 나눠 줄 때 사료에 섞어도 괜찮을까요?',
  '관절 쪽은 몇 살부터 미리 챙기는 게 좋은가요?',
  '성분표에서 함량은 어느 정도를 기준으로 보시나요?',
  '처음 먹일 때 적응 기간을 따로 두셨는지 궁금해요?',
];

test('질문형 프롬프트는 explain 전용 지시를 싣지 않는다', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    title: '강아지 관절 영양제 알아본 후기',
    body: BODY,
    style: 'question',
  });

  assert.match(prompt, /질문/);
  assert.match(prompt, /물음표로 끝나는 질문을 정확히 1개/);
  assert.doesNotMatch(prompt, /풀어서 설명한다/);
  assert.doesNotMatch(prompt, /소감이나 인사를 한 마디만/);
  assert.match(prompt, /정확히 8개/);
});

test('질문형 프롬프트는 댓글마다 다른 질문 각도를 배정한다', () => {
  const prompt = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    body: BODY,
    style: 'question',
  });

  // 금지형("~하면 실패다")만으로는 인용 연결어 쏠림이 안 잡혀서 각도를 지정하는 방식으로 바꿨다.
  for (const angle of ['방법', '기준', '상황', '비교', '경험', '예외', '정도', '다음 단계']) {
    assert.match(prompt, new RegExp(angle));
  }
  assert.match(prompt, /index 1, 4, 7/);
  assert.match(prompt, /index 2, 5, 8/);
  assert.match(prompt, /index 3, 6/);
});

test('style을 지정하지 않으면 explain 프롬프트가 그대로 나온다', () => {
  const withoutStyle = buildCafeCommentBatchPrompt({ keyword: '강아지 관절 영양제', body: BODY });
  const explicitExplain = buildCafeCommentBatchPrompt({
    keyword: '강아지 관절 영양제',
    body: BODY,
    style: 'explain',
  });

  assert.equal(withoutStyle, explicitExplain);
});

test('질문형 검증은 물음표 없는 댓글을 잡아낸다', () => {
  const noQuestionMark = [...EIGHT_QUESTIONS.slice(0, 7), '성분표부터 본다는 얘기로 이해했습니다'];
  const warnings = validateCafeComments(buildComments(noQuestionMark), undefined, 'question');

  assert.ok(warnings.includes('missing-question:8'));
  assert.ok(!warnings.includes('missing-question:1'));
});

test('질문형 검증은 물음표가 다 있으면 통과한다', () => {
  const warnings = validateCafeComments(buildComments(EIGHT_QUESTIONS), undefined, 'question');

  assert.ok(!warnings.some((w) => w.startsWith('missing-question')));
});

test('explain 검증은 물음표 유무를 따지지 않는다', () => {
  const warnings = validateCafeComments(buildComments(EIGHT_OK), undefined, 'explain');

  assert.ok(!warnings.some((w) => w.startsWith('missing-question')));
});

test('질문형 검증은 평서문 끝에 물음표만 붙인 것을 잡아낸다', () => {
  const faked = [
    ...EIGHT_QUESTIONS.slice(0, 6),
    '두세 개로 좁힌 뒤 반응을 보셨다는데 눈치채지 않게 꺼낸 방식이 궁금합니다?',
    '추천 외에 체형이나 목 상태도 따로 고려해야 하는지 알고 싶습니다?',
  ];
  const warnings = validateCafeComments(buildComments(faked), undefined, 'question');

  assert.ok(warnings.includes('fake-question:7'));
  assert.ok(warnings.includes('fake-question:8'));
  assert.ok(!warnings.includes('fake-question:1'));
  assert.ok(!warnings.some((w) => w.startsWith('missing-question')));
});

test('질문형 검증은 인용 연결어가 몰리면 경고한다', () => {
  const sameFrame = [
    '식단을 며칠 적어보라고 하셨는데, 어떤 항목을 빠뜨리지 않아야 할까요?',
    '표시를 확인하라고 하셨는데, 온라인에만 보이면 무엇을 기준으로 볼까요?',
    '연령 표기가 중요하다고 하셨는데, 경계 연령이면 어느 쪽을 따를까요?',
    '원재료명을 앞에서부터 읽으라고 하셨는데, 첨가물은 어디까지 볼까요?',
    '함량을 비교하라고 하셨는데, 기준치 표기가 없으면 어떻게 비교하나요?',
    '한 알 기준이 다르다고 하셨는데, 하루 섭취량 환산은 어떻게 하나요?',
    '총량이 올라간다고 하셨는데, 겹치는 성분은 어떤 식으로 정리하나요?',
    '급여량을 나눈다고 하셨는데, 사료에 섞어도 괜찮은가요?',
  ];
  const warnings = validateCafeComments(buildComments(sameFrame), undefined, 'question');

  assert.ok(warnings.some((w) => w.startsWith('quote-connector-overuse')));
});

test('인용 연결어가 3개 이하면 경고하지 않는다', () => {
  const mixed = [
    '식단을 며칠 적어보라고 하셨는데, 어떤 항목을 빠뜨리지 않아야 할까요?',
    '연령 표기는 경계 연령이면 어느 쪽을 따르는 게 맞을까요?',
    '원재료명에서 첨가물은 어디까지 살펴야 하나요?',
    '기준치 표기가 없는 제품끼리는 무엇으로 비교하나요?',
    '하루 섭취량 환산은 어떤 계산으로 하면 되나요?',
    '겹치는 성분은 어떤 식으로 정리해두시나요?',
    '사료에 섞어서 급여해도 괜찮은가요?',
    '처음 먹일 때 적응 기간을 따로 두시나요?',
  ];
  const warnings = validateCafeComments(buildComments(mixed), undefined, 'question');

  assert.ok(!warnings.some((w) => w.startsWith('quote-connector-overuse')));
});

test('explain 스타일은 인용 연결어와 평서문 종결을 문제 삼지 않는다', () => {
  const warnings = validateCafeComments(buildComments(EIGHT_OK), undefined, 'explain');

  assert.ok(!warnings.some((w) => w.startsWith('quote-connector-overuse')));
  assert.ok(!warnings.some((w) => w.startsWith('fake-question')));
});
