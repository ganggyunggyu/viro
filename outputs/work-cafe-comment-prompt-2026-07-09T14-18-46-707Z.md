# 작업카페 댓글 생성 프롬프트

- generatedAt: 2026-07-09T14:18:46.707Z
- sourcePath: outputs/work-cafe-zero-comment-posts-2026-07-09T12-57-21-387Z.json
- model: deepseek-v4-flash
- targetCommentCount: 10
- pendingTargets: 416

## 실행 방식

1. WorkCafeArticle에서 `needsCommentWork=true`, `commentWorkStatus=pending` 글을 가져온다.
2. 네이버 실제 글 URL을 열어 제목/본문을 다시 읽는다.
3. 아래 프롬프트 형식으로 DeepSeek에 원고를 넣고 댓글 8개 JSON을 받는다.
4. 첫 6글자/시작어/길이/중복 검증 후 댓글 큐에 넣는다.

## Prompt Template

```text
너는 네이버 카페 댓글 작성자 여러 명을 시뮬레이션한다.

아래 카페 원고를 읽고, 원고 내용과 직접 연결되는 일반 댓글만 만든다.

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
댓글은 정확히 10개 작성한다.

## 댓글 작성 규칙
- 모든 type은 "comment"만 사용한다. 대댓글은 만들지 않는다.
- content는 실제 카페 댓글처럼 한 줄로 작성한다.
- content는 35~120자 사이로 쓴다.
- 모든 문장은 존댓말로 쓴다.
- 원고의 구체 요소를 받아서 말한다. 제목만 보고 쓴 듯한 포괄 댓글 금지.
- 원고에 없는 상호, 가격, 지역, 효능, 후기, 병원명, 제품명을 새로 만들지 않는다.
- 원고에 없는 방문 경험, 품절 경험, 대기 시간, 메뉴명, 좌석 수, 주차 상황을 실제로 겪은 것처럼 꾸며내지 않는다.
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
- 원고의 특정 문장을 보고 추가 질문하는 사람
- 살짝 조심스럽게 다른 기준을 덧붙이는 사람

## 원고 정보
제목: {ARTICLE_TITLE}
키워드: {ARTICLE_TITLE_OR_KEYWORD}
카테고리: {CAFE_CATEGORY}

## 원고 본문
{LIVE_NAVER_ARTICLE_BODY}

JSON만 출력한다.
```

## Pending Targets Sample

|카페|글ID|제목|현재댓글|링크|
|---|---:|---|---:|---|
|healthhhh|83|아버지 생신선물 추천 고민 끝!|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/83|
|healthhhh|82|60대 아빠 생일선물 리스트 (가격대·브랜드별)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/82|
|healthhhh|81|남자친구 부모님선물 부담 없이 고르는 법|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/81|
|healthhhh|80|흑염소진액 효과 복용법|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/80|
|healthhhh|79|SAT학원 수강료와 디지털 시험 대비, 고르는 기준|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/79|
|healthhhh|78|음식물분쇄기 합법 기준과 과태료 100만 원, 인증 확인법|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/78|
|healthhhh|77|음식물처리기 방식별 감량률과 전기요금, 보조금 조건까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/77|
|healthhhh|76|조문 답례품 종류와 가격대, 전달 시기와 인사말 문구까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/76|
|healthhhh|75|흑염소진액 복용법 효능 (제대로 알고 드세요)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/75|
|healthhhh|74|흑염소진액 부작용 총정리, 효능·고르는 법까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/74|
|healthhhh|73|올리브오일 등급과 폴리페놀 기준, 발연점과 고르는 법까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/73|
|healthhhh|72|족저근막염 깔창 효과와 맞춤 기성품 차이, 고르는 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/72|
|healthhhh|71|무지외반증 교정기 효과와 각도 변화 수치, 고르는 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/71|
|healthhhh|70|부모님 첫인사 선물 고르는 법|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/70|
|healthhhh|69|부모님 생일선물 추천 나이·성향별로 골라봤어요|5|https://cafe.naver.com/ca-fe/cafes/31746910/articles/69|
|healthhhh|68|부모님선물 추천 고르는법 (가격대·브랜드별)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/68|
|healthhhh|67|80대 할아버지 선물 (정석·상태·취미별)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/67|
|healthhhh|66|80대 할머니 선물 추천 리스트 (거동·청력·기력별 맞춤 총정리)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/66|
|healthhhh|65|깔창이란 무엇이고 어떤 역할을 할까, 부작용과 관리까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/65|
|healthhhh|64|올리브오일 등급 차이와 효능, 발연점과 보관법까지 정리|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/64|
|healthhhh|63|신발깔창 종류와 소재별 차이, 용도별 고르는 기준까지 정리|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/63|
|healthhhh|62|족저근막염 신발 고르는 기준과 발 타입별 선택, 관리법까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/62|
|healthhhh|61|아치 깔창 효과와 평발 고르는 기준, 부작용까지 정리|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/61|
|healthhhh|60|족저근막염 깔창 고르는 기준과 종류별 차이, 원인 유형부터 부작용까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/60|
|healthhhh|59|거북목 교정기 종류와 고르는 법, 운동 병행부터 부작용까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/59|
|healthhhh|58|무지외반증 교정기 고르는 기준과 종류별 차이, 자가진단부터 부작용까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/58|
|healthhhh|57|알파CD 효능과 지방 흡착 원리, 복용법부터 부작용까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/57|
|healthhhh|56|쿼드쎄라 펜타 효과와 5중 주파수, 모드별 사용법부터 고르는 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/56|
|healthhhh|54|흑염소즙 즐기는 법 보양의 대명사|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/54|
|healthhhh|53|흑염소진액 추천 고르는법|5|https://cafe.naver.com/ca-fe/cafes/31746910/articles/53|
