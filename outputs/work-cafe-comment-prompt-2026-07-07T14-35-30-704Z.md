# 작업카페 댓글 생성 프롬프트

- generatedAt: 2026-07-07T14:35:30.704Z
- sourcePath: outputs/work-cafe-zero-comment-posts-2026-07-07T14-35-02-678Z.json
- model: deepseek-v4-flash
- targetCommentCount: 8
- pendingTargets: 147

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
댓글은 정확히 8개 작성한다.

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
|healthhhh|52|부모님선물 추천 리스트 (선물 총정리)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/52|
|healthhhh|51|부모님 생신선물 추천 리스트, 종류별로 골라드려요|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/51|
|healthhhh|50|흑염소진액 효능 체질 자가진단, 고르는 법까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/50|
|healthhhh|49|시어머님 생신선물 추천 리스트 (가격대·브랜드)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/49|
|healthhhh|48|시아버님 생신선물 추천 리스트 며느리 센스|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/48|
|healthhhh|47|시아버지 생신선물 추천 리스트 체질과 취향까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/47|
|healthhhh|46|시아버지 생신선물 추천 리스트 가이드|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/46|
|healthhhh|45|시어머니 생신선물 추천 리스트|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/45|
|healthhhh|44|시어머니 생신선물 추천 리스트, 센스 있게 골라드려요|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/44|
|healthhhh|43|회사 답례품 실용성과 연령대, 단체주문 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/43|
|healthhhh|42|답례품 종류와 가격대, 상황별 고르는 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/42|
|healthhhh|41|군화 깔창 재질별 차이와 전투화 매칭, 관리법까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/41|
|healthhhh|40|군대 깔창 효과와 종류, 사이즈 고르는 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/40|
|healthhhh|39|장에 좋은 음식 발효식품과 식이섬유, 프로바이오틱스까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/39|
|healthhhh|38|푸룬주스 효능과 변비 원리, 하루 섭취량과 부작용까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/38|
|healthhhh|37|평발 깔창 고르는 기준과 연령별 선택, 가격대 비교|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/37|
|healthhhh|36|깔창 효과와 재질별 차이, 족저근막염 고르는 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/36|
|healthhhh|35|올리브오일 효능과 등급 차이, 발연점 기준 고르는 법까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/35|
|healthhhh|34|두유제조기 효능과 생콩 사용법, 종류별 고르는 기준까지|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/34|
|healthhhh|33|할머니 선물 추천 리스트 고민이라면|5|https://cafe.naver.com/ca-fe/cafes/31746910/articles/33|
|healthhhh|32|시어머니 생신선물 추천  (가격대·체질·취향까지)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/32|
|healthhhh|31|임산부 선물 추천 리스트 (유형·예산별 총정리, 실패 없는 선택법)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/31|
|healthhhh|30|할머니 생신선물 추천 가이드|5|https://cafe.naver.com/ca-fe/cafes/31746910/articles/30|
|healthhhh|29|60대 할머니 생신선물, 체질 따라 골라드리는 센스|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/29|
|healthhhh|28|70대 할머니 생신선물 추천 리스트, 가격대·체질별 총정리|5|https://cafe.naver.com/ca-fe/cafes/31746910/articles/28|
|healthhhh|27|장모님 생신선물 총정리, 가격대별로 골라봤어요|1|https://cafe.naver.com/ca-fe/cafes/31746910/articles/27|
|healthhhh|26|장인어른 생신선물 추천 (카테고리·예산·고르는 원칙 한눈에)|0|https://cafe.naver.com/ca-fe/cafes/31746910/articles/26|
|driveee|51|부모님 선물 추천 리스트 취향에 맞게|0|https://cafe.naver.com/ca-fe/cafes/31746635/articles/51|
|driveee|50|부모님 생신선물 추천 리스트 (가격대·브랜드)|0|https://cafe.naver.com/ca-fe/cafes/31746635/articles/50|
|driveee|49|시아버님 생신선물 리스트 공유해요|6|https://cafe.naver.com/ca-fe/cafes/31746635/articles/49|
