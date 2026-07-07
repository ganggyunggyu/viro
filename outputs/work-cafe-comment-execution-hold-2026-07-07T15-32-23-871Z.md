# 작업카페 댓글 실행 보류 기록

상태: 실행 보류. 사용자 명시 승인 전 댓글 생성 API 대량 호출, 큐 등록, 네이버 댓글 작성 금지.

## 현재 기준

- generatedAt: 2026-07-07T15:32:23.871Z
- collectionId: 2026-07-07T14-35-02-678Z
- loginId: 21lab
- targetCommentCount: 0
- pendingArticles: 192
- totalCommentShortage: 1119
- commenterAccounts: 19
- ownerMatchedAccounts: 7
- excludedOwnerAccounts: 0
- ownerExclusionMode: own-cafe-only
- plannedWindow: 0시간 0분
- generationEstimate: 40~90분

## 스케줄 정책

- 시작: 실행 승인 후 0분 뒤로 계산
- 전역 댓글 간격: 0초
- 계정별 최소 간격: 0분
- 같은 글에는 같은 계정을 중복 배정하지 않음
- 카페장 닉네임과 같은 댓글러는 자기 카페 글에서만 제외
- 글별 댓글을 8개 연속으로 몰지 않고 전체 글 1회차, 2회차 방식으로 분산

## 카페장 계정 처리

카페장 계정은 댓글러 풀에 포함하되, 자기 카페 글에는 배정하지 않는다.

|계정|닉네임|처리|
|---|---|---|
|dhtksk1p|빨간모자앤  1|자기 카페만 제외|
|ahfflwl123|햄부기|자기 카페만 제외|
|ghostrush7|실눈캐|자기 카페만 제외|
|k7d9x2m4|강아지강하지 1|자기 카페만 제외|
|bigfish773|고래낚시 1|자기 카페만 제외|
|produce11745|가중건다|자기 카페만 제외|
|alsrudgus531|운연정|자기 카페만 제외|

## 예상 소요시간

- 30초/댓글 기준: 9시간 19분
- 45초/댓글 기준: 13시간 59분
- 60초/댓글 기준: 18시간 38분
- 90초/댓글 기준: 27시간 57분

## 카페별 물량

|카페|카페장|대상글|댓글0글|필요댓글|
|---|---|---:|---:|---:|
|carelog702|고구마스틱2 (10개) 1|14|10|81|
|dogwalk2m4|강아지강하지 1|13|10|90|
|driveee|운연정|33|21|177|
|habitnote702|룰루랄라 2 (12개) 1|2|0|2|
|healthhhh|가중건다|30|23|189|
|infomadang702|실눈캐|2|0|3|
|localtable702|소원 1|26|20|165|
|mealtalkdht|빨간모자앤 1|13|10|83|
|menunote702|똑똑한건희씨|14|10|85|
|petinfo183|티니피쉬 1|16|10|78|
|tableclub702|고래낚시 1|25|20|160|
|talkmadang702|햄부기|4|0|6|

## 승인 후 실행 순서

1. 최신 댓글 수를 다시 수집한다.

```bash
npx tsx --env-file=.env.local scripts/collect-work-cafe-zero-comment-posts.ts --login-id=21lab --account-id=vegetable10517 --per-page=20 --max-pages=30
```

2. 새 수집 JSON을 DB에 반영하고 프롬프트를 갱신한다.

```bash
npx tsx --env-file=.env.local scripts/persist-work-cafe-comment-targets.ts --source=outputs/work-cafe-zero-comment-posts-<NEW_TIMESTAMP>.json --target-comment-count=8
```

3. 스케줄을 재생성한다.

```bash
npx tsx --env-file=.env.local scripts/build-work-cafe-comment-schedule.ts --login-id=21lab --target-comment-count=8 --start-delay-min=90 --global-gap-sec=45 --account-gap-min=8
```

4. 댓글 생성/큐 등록은 별도 승인 문구를 받은 뒤에만 진행한다.

## 산출물

- JSON: /Users/ganggyunggyu/Programing/cafe-bot/outputs/work-cafe-comment-schedule-2026-07-07T15-32-23-871Z.json
- CSV: /Users/ganggyunggyu/Programing/cafe-bot/outputs/work-cafe-comment-schedule-2026-07-07T15-32-23-871Z.csv
- MD: /Users/ganggyunggyu/Programing/cafe-bot/outputs/work-cafe-comment-execution-hold-2026-07-07T15-32-23-871Z.md
