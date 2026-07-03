# 작업카페 계정별 복구 플랜

- schedule: outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json
- safeAccounts: 12
- blockedAccounts: 8
- commentFailures: 10
- membershipProblems: 14

## 안전 계정 댓글 재개

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --exclude-account-id=ahffkekd12,dhtksk1p,dq1h3bjy,geenl,k7d9x2m4,laghunter8,q9v3m7a2,vegetable10517 --skip-article=31746910:25
```

## 격리 계정

|계정|닉네임|댓글실패|가입문제|
|---|---|---:|---:|
|ahffkekd12|긍정이백퍼  1|1|0|
|dhtksk1p|빨간모자앤  1|1|0|
|dq1h3bjy|에스앤비안과, 29년 경력 (노출)|1|2|
|geenl|모험 - 교체|1|12|
|k7d9x2m4|강아지강하지 1|1|0|
|laghunter8|도도 1|1|0|
|q9v3m7a2|포비 1|2|0|
|vegetable10517|렙용|1|0|

## 계정별 복구 순서

### ahffkekd12 / 긍정이백퍼  1

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=ahffkekd12
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=ahffkekd12 --skip-article=31746910:25
```

### dhtksk1p / 빨간모자앤  1

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=dhtksk1p
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=dhtksk1p --skip-article=31746910:25
```

### dq1h3bjy / 에스앤비안과, 29년 경력 (노출)

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=dq1h3bjy
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=dq1h3bjy --skip-article=31746910:25
```

### geenl / 모험 - 교체

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=geenl
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=geenl --skip-article=31746910:25
```

### k7d9x2m4 / 강아지강하지 1

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=k7d9x2m4
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=k7d9x2m4 --skip-article=31746910:25
```

### laghunter8 / 도도 1

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=laghunter8
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=laghunter8 --skip-article=31746910:25
```

### q9v3m7a2 / 포비 1

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=q9v3m7a2
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=q9v3m7a2 --skip-article=31746910:25
```

### vegetable10517 / 렙용

가입 보정:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/ensure-work-cafe-memberships.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-concurrency=1 --login-wait-min=10 --account-id=vegetable10517
```

가입 완료 후 댓글 재개:

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts --schedule=outputs/work-cafe-comment-schedule-2026-07-03T06-59-52-593Z.json --login-id=21lab --account-gap-min=3 --global-gap-sec=10 --article-gap-min=25 --generation-concurrency=4 --prefetch-articles=0 --max-active=12 --screenshot-every=25 --login-wait-min=10 --account-id=vegetable10517 --skip-article=31746910:25
```

