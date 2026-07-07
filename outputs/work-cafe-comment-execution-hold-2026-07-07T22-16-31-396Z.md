# 작업카페 댓글 실행 보류 기록

상태: 실행 보류. 사용자 명시 승인 전 댓글 생성 API 대량 호출, 큐 등록, 네이버 댓글 작성 금지.

## 현재 기준

- generatedAt: 2026-07-07T22:16:31.396Z
- collectionId: 2026-07-07T21-03-44-190Z
- loginId: 21lab
- targetCommentCount: 8
- pendingArticles: 160
- totalCommentShortage: 791
- commenterAccounts: 20
- ownerMatchedAccounts: 5
- excludedOwnerAccounts: 0
- ownerExclusionMode: own-cafe-only
- plannedWindow: 9시간 53분
- generationEstimate: 40~90분

## 스케줄 정책

- 시작: 실행 승인 후 90분 뒤로 계산
- 전역 댓글 간격: 45초
- 계정별 최소 간격: 8분
- 같은 글에는 같은 계정을 중복 배정하지 않음
- 카페장 닉네임과 같은 댓글러는 자기 카페 글에서만 제외
- 글별 댓글을 8개 연속으로 몰지 않고 전체 글 1회차, 2회차 방식으로 분산

## 카페장 계정 처리

카페장 계정은 댓글러 풀에 포함하되, 자기 카페 글에는 배정하지 않는다.

|계정|닉네임|처리|
|---|---|---|
|dhtksk1p|빨간모자앤  1|자기 카페만 제외|
|k7d9x2m4|강아지강하지 1|자기 카페만 제외|
|bigfish773|고래낚시 1|자기 카페만 제외|
|produce11745|가중건다|자기 카페만 제외|
|alsrudgus531|운연정|자기 카페만 제외|

## 예상 소요시간

- 30초/댓글 기준: 6시간 35분
- 45초/댓글 기준: 9시간 53분
- 60초/댓글 기준: 13시간 10분
- 90초/댓글 기준: 19시간 45분

## 카페별 물량

|카페|카페장|대상글|댓글0글|필요댓글|
|---|---|---:|---:|---:|
|babsangnote702|맛집 밥상노트|12|12|96|
|carelog702|고구마스틱2 (10개) 1|10|0|32|
|dogwalk2m4|강아지강하지 1|10|0|41|
|driveee|운연정|25|2|133|
|healthhhh|가중건다|27|1|131|
|localtable702|소원 1|21|0|89|
|mealtalkdht|빨간모자앤 1|11|0|54|
|menunote702|똑똑한건희씨|10|0|34|
|petinfo183|티니피쉬 1|10|1|58|
|petnote702|애견 반려수첩|1|1|8|
|tableclub702|고래낚시 1|22|0|107|
|walknote702|애견 산책노트|1|1|8|

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

- JSON: /Users/ganggyunggyu/Programing/cafe-bot/outputs/work-cafe-comment-schedule-2026-07-07T22-16-31-396Z.json
- CSV: /Users/ganggyunggyu/Programing/cafe-bot/outputs/work-cafe-comment-schedule-2026-07-07T22-16-31-396Z.csv
- MD: /Users/ganggyunggyu/Programing/cafe-bot/outputs/work-cafe-comment-execution-hold-2026-07-07T22-16-31-396Z.md
