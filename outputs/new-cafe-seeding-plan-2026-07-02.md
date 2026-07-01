# New Cafe Seeding Plan - 2026-07-02

## Content Source Mapping

- 맛집 4개: text-gen-hub `/generate/blog-filler-restaurant`
- 애견 2개: text-gen-hub `/generate/blog-filler-pet`
- 건강 2개: text-gen-hub `/generate/hanryeo`, service=`건강`
- 생활/일상 2개: text-gen-hub `/generate/blog-filler`

## Cafe Targets

| No. | Theme | Cafe | Cafe ID | Menu | Writer | Source | Keyword |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 맛집 | 맛집 밥상노트 | 31750114 | 자유게시판(1) | dhtksk1p | blog-filler-restaurant | 동네에서 부담 없이 먹기 좋은 한 끼 기록 |
| 2 | 맛집 | 맛집 동네밥상 | 31750113 | 자유게시판(1) | regular14631 | blog-filler-restaurant | 동네 식당 고를 때 확인하면 좋은 기준 |
| 3 | 맛집 | 맛집 메뉴수첩 | 31750111 | 자유게시판(1) | orangeswan630 | blog-filler-restaurant | 오늘 메뉴 정할 때 참고하기 좋은 음식 이야기 |
| 4 | 맛집 | 맛집 식탁모임 | 31750110 | 자유게시판(1) | bigfish773 | blog-filler-restaurant | 식사 모임 장소를 고를 때 살펴볼 점 |
| 5 | 애견 | 애견 반려수첩 | 31750109 | 자유게시판(1) | tinyfish183 | blog-filler-pet | 반려견 생활 관리할 때 자주 확인하는 기본 정보 |
| 6 | 애견 | 애견 산책노트 | 31750107 | 자유게시판(1) | k7d9x2m4 | blog-filler-pet | 강아지 산책 전후로 챙기면 좋은 습관 |
| 7 | 건강 | 건강 생활수첩 | 31750106 | 자유게시판(1) | fail5644 | hanryeo | 건강 생활관리 꾸준히 이어가는 방법 |
| 8 | 건강 | 건강 습관노트 | 31750105 | 자유게시판(1) | compare14310 | hanryeo | 건강 습관을 무리 없이 만드는 생활 루틴 |
| 9 | 일반 | 생활 정보마당 | 31750108 | 자유게시판(1) | ghostrush7 | blog-filler | 일상에서 알아두면 편한 생활 정보 정리 |
| 10 | 일반 | 일상 소통마당 | 31750104 | 자유게시판(1) | ahfflwl123 | blog-filler | 가볍게 나누기 좋은 하루 일상 이야기 |

## Run Notes

- 실제 발행은 `scripts/run-new-cafe-seeding.ts --generate --enqueue` 실행 시 시작된다.
- 댓글은 기본적으로 큐 핸들러의 `/generate/comment`, `/generate/recomment` 체인을 사용한다.
- 새 카페 댓글은 댓글 계정이 카페에 가입되어 있어야 성공한다. 가입 전에는 `--skip-comments`로 글만 넣거나, 가입 완료 후 댓글 계정을 지정한다.
