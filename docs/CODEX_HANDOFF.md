# CODEX_HANDOFF — VIRO 카페봇 정합성/안정성 개선 (frozen seed)

> 이 문서는 요구사항을 얼려둔 계약(seed)이다. 구현 중 요구사항이 흔들리면 이 문서를 기준으로 되돌린다.
> 역할분담: **오케스트레이터 = Claude(냥냥돌쇠)**, **구현자 = Codex (`gpt-5.6-sol`, reasoning high)**.
> 원칙 근거: `AGENTS.md`(HARNESS ENGINEERING), `docs/HARNESS_ENGINEERING.md`.

## 왜 이 작업을 하나 (유저 원문 요약)

로직이 오락가락하고 데이터 형태가 제각각이다. 구체적으로:

1. 아티클 아이디는 저장하는데 **링크를 제대로 저장 안 함**.
2. **아티클 아이디 리턴이 안 되면 게시글 발행이 완료돼도 실패로 나옴** (그리고 재시도로 중복 발행).
3. 글/댓글 검증은 **UI로 해야 하는데 정리 안 된 DB를 사용**.
4. 계정 정보는 **DB보다 시트가 정확한데** 자꾸 동기화 안 된 DB를 바라봄.
5. 이 부정확함 때문에 에러가 많다.

## 테스트 카페 (라이브 E2E 전용)

- 카페명: 맛집 밥상노트 / slug: `mealtalkdht` / URL: `https://cafe.naver.com/mealtalkdht`
- 별도 참조: `babsangnote702` (같은 오너 "빨간모자앤 1"), cafeId 후보 `31750114`
- 이 카페는 "시트엔 없지만 실제 운영 중"으로 교차검증됨 → 시트-DB 불일치 사례 그 자체.
- ⚠️ `mealtalkdht`는 `scripts/collect-work-cafe-zero-comment-posts.ts`에 실운영 카페로 등록돼 있음. 라이브 실발행/실댓글은 되돌릴 수 없으므로 WP-6 규칙을 따를 것.

## 하드 규칙 (모든 WP 공통)

- **테스트 우선**: 각 WP는 실패하는 계약 테스트부터 작성 → 구현 → 통과. `node:test`(tsx --test) + DI seam 사용. Redis/Mongo/Playwright/네이버 실호출 없이 도는 순수 하네스가 기본.
- **DI seam**: 외부 의존성(모델, 큐, 시트 클라이언트, writer)은 주입 가능한 인자로 뽑아 fake 주입으로 테스트. 기존 `task-job-harness.ts`/`sequence-harness.ts` 패턴을 따른다.
- **범위 최소화**: 해당 WP에 명시된 파일/동작만 수정. 무관한 리팩터/파일 이동 금지. 대규모 모델 통합은 하지 않음(별도 후속).
- **코드 스타일**: 화살표 함수, 구조분해, named handler. 무관한 설명 주석 금지. 이모지 금지.
- **검증 루프**: WP 끝날 때마다 `npm run test:harness` 통과 + 변경 파일 `npm run lint`(strict changed-file) 무경고 + `git diff --stat` 로 범위 확인.
- **커밋 금지**(오케스트레이터가 검증 후 결정). 작업은 커밋 가능한 단위로 정리만.
- 실제 발행/가입/캡차처럼 브라우저 라이브가 필요한 부분은 harness-di로 못 하니 `needs-live-browser`로 분리하고 순수 로직만 계약 테스트.

## 문제 → 버그 매핑 (근거: file:line)

| ID | 심각도 | 파일:라인 | 요지 |
|----|--------|-----------|------|
| BUG-1 | critical | `post-writer.ts:611,633,638-645` | submit 클릭으로 글은 이미 발행됐는데 URL에서 articleId 추출 실패 시 `success:false` 반환 |
| BUG-2 | high | `post-handler.ts:66-74` | `success:true`인데 `articleId` 없으면 `throw` → 발행 성공을 실패로 뒤집음 |
| BUG-1/2 증폭 | critical | `queue/index.ts:29` | `attempts:5` + exponential → throw된 post job 최대 5회 재시도 = 같은 글 중복 발행 |
| BUG-3 | high | `post-handler.ts:56-63,81-84` | 저장(create/logSheet)이 `articleId` 있을 때만 → 추출 실패 시 실제 URL(`result.articleUrl`) 유실 |
| BUG-4 | medium | `post-writer.ts:257`(구현), 사용처 0 | `findRecentArticleBySubject` 복구 폴백이 write 경로에 미연결 |
| BUG-5 | low | `post-handler.ts:112,320` | 저장 URL이 관측값 아닌 `ca-fe/cafes/{cafeId}/articles/{id}` 재조립본 |
| CLAIM-GAP | critical | `keyword-processor.ts:91` 有 / `post-handler.ts` 無 | `claimPostAttempt` 멱등 가드가 배치에만 있고 큐 핸들러엔 없음 |
| SYNC-DEACT | high | `sync-cafe-accounts-from-sheet.ts:98` | active만 순회, 비활성 계정을 DB `isActive:false`로 안 내림 (stale) |
| CAFEID-VOID | high | `cafe-account-policy.ts:58,69` | `void cafeId` — 시트의 계정별 대상카페 매핑을 런타임이 무시 |
| RUNTIME-DB-ONLY | high | `config/accounts.ts:5-15` | 워커가 계정을 DB에서만 읽고 시트를 안 봄 |
| STUB-POLLUTION | medium | `published-article.ts: addCommentToArticle` | 외부 글 댓글 시 `status:'published'` 스텁 생성 → 발행글/노출체크 오염 |
| VERIFY-DB | high | `scripts/verify-cafe-posts.ts` | 검증이 DB(mongoose) 카운트 기반 (UI 아님). live 검증은 `verify-cafe-goals-live.ts`에 별도로만 존재 |
| SOFT-FAIL | high | `workers.ts` return vs throw | 소프트실패 return이 BullMQ 'completed'로 기록 → 상태보고 왜곡 |
| REPLY-IDEMP | medium | reply 핸들러 | DB 중복체크 없이 600초 Redis 락에만 의존 → 락 만료 후 중복 대댓글 |
| TEST-ORPHAN | high | `package.json` test:harness | 테스트 23개 중 ~18개만 CI 목록 → 고아 테스트가 verify:ci 미실행 |

## 작업 패키지

각 WP는 독립 커밋 단위. 오케스트레이터가 WP 번호를 지정해 `codex exec`로 호출한다.

### WP-0 — 테스트 러너 글로벌 발견 (선행)
- 목표: 앞으로 추가되는 모든 `*.test.ts`가 자동으로 CI에서 돌게.
- 수정: `package.json` `test:harness`를 손 목록 대신 glob 발견으로. `tsx --test`가 `src/**/*.test.ts` + `scripts/**/*.test.ts`를 발견하되, **네이버 실호출/Playwright 라이브 테스트는 파일명 규약(`*.live.test.ts`)으로 분리**해 기본 스위트에서 제외. `verify:ci`가 이 스위트를 돌도록.
- 테스트 계약: 고아였던 9개(예: `viral-parser`, `build-hanryeo-cafe-prompt`, `cafe-account-policy`, `password`, `cafe-unexposed-keyword-selector`, `verify-cafe-posts` 등)가 실제로 발견·실행되는지 확인.
- 검증: `npm run test:harness`가 23개 전부(라이브 제외) 수집·통과.

### WP-1 — 발행 정합성 코어 (BUG-1~5 + CLAIM-GAP) ★최우선
- 목표: "발행됐으면 절대 실패로 기록하지 않고, 링크를 항상 남기고, 재시도로 중복 발행하지 않는다."
- 설계: `handlePostJob`의 결정 로직을 **순수 오케스트레이터 함수**로 추출 (예: `resolvePostOutcome({ writeResult, deps })`). 의존성(writer, PublishedArticle, sheet logger, claimPostAttempt, findRecentArticle)은 주입.
- 수정 동작:
  1. `claimPostAttempt(cafeId, accountId, keyword||subject)`를 **writePostWithAccount 직전**에 호출. 이미 claim된(재시도/중복) 경우 발행 스킵하고 성공/스킵으로 반환. (keyword-processor.ts:91과 동일 패턴)
  2. write 결과가 articleId 없음이면 즉시 실패로 떨어지지 말고 `findRecentArticleBySubject`(ArticleListV2dot1.json + subject + publishStartedAt)로 **복구 시도**. 복구되면 success로 승격.
  3. 그래도 못 구하면 `throw` 금지. `PublishedArticle`에 `status:'published-unverified'`로 **`result.articleUrl`(관측 URL) 저장** + 시트 로깅. job은 성공 반환(재시도 안 함).
  4. 저장 URL은 **`result.articleUrl` 우선**, 없을 때만 재조립 폴백.
  5. post 큐 `attempts`를 낮춰(1~2) 재시도 증폭 차단. claim 가드와 함께 이중 방어.
- 테스트 계약(harness-di):
  - write 성공+articleId → create 호출/올바른 URL 저장/댓글체인 적재.
  - write 성공+articleId 없음+복구 성공 → success 승격, 재발행 없음.
  - write 성공+articleId 없음+복구 실패 → throw 안 함, `published-unverified` + 관측 URL 저장, 시트 기록됨.
  - 같은 (cafe,account,keyword,day) 재시도 → 두 번째 실행은 claim 거부로 submit 스킵(멱등). `claimPostAttempt`의 E11000→false 분기 fake 모델로.
  - 저장 URL이 `result.articleUrl` 우선인지.
- 검증: `npm run test:harness` + 신규 `post-handler`/오케스트레이터 테스트 통과.

### WP-2 — 계정/카페 source of truth (SYNC-DEACT / CAFEID-VOID / meta)
- 목표: "시트가 마스터. DB는 시트에 수렴. 런타임은 stale DB로 오작동하지 않는다."
- 수정:
  1. sync를 reconcile로: 시트에 없거나 FALSE인 계정을 DB `isActive:false`로 내림(시트 accountId 집합 기준 updateMany). `buildSheetAccountSyncPlan`에 deactivate 대상 포함.
  2. 계정별 `targetCafes`를 Account에 영속(필드 추가) + `getCafeWriterAccounts`/`getCafeCommenterAccounts`의 `void cafeId` 제거 → 저장된 매핑으로 실제 필터링.
  3. mvpn(PC/모바일)·메타는 쓸 거면 DB 필드 승격, 안 쓸 거면 "동기화 대상 아님" 명시.
  4. cafe slug/cafeId 정규화: 저장 시 `toCafeSlug` 경유 일관화.
- 테스트 계약(harness-di): 시트 활성→비활성 후 sync → DB isActive:false. 대상카페 지정 writer가 타 카페 배치에서 제외. sync가 보존/드롭하는 필드 스냅샷.
- 검증: `npm run accounts:sheet:check` (read-only) + 신규 sync plan 테스트.

### WP-3 — 검증 UI/live 기준 + stub 오염 제거 (VERIFY-DB / STUB-POLLUTION)
- 수정:
  1. `addCommentToArticle` 스텁을 `status:'published'` 대신 `isExternal:true`/별도 status로. `getRecentPublishedArticles`·노출체크 후보 쿼리에서 external 제외.
  2. 목표/검증 판정을 DB 단독이 아니라 **live(`verify-cafe-goals-live`) 대조**로. "DB=시트=실제" 3자 정합성 리포트 계약.
- 테스트 계약(harness-di): 외부글 댓글 후 발행글 목록에 안 섞임. 정합성 대조 함수 순수 로직.
- 검증: 신규 테스트 통과 + `verify-cafe-posts` 스텁 제외 확인.

### WP-4 — 큐 상태/멱등성 (SOFT-FAIL / REPLY-IDEMP / 시퀀스 드랍 / 카운트 절단)
- 수정: 소프트실패를 completed로 뭉개지 말고 requeued 상태 구분. reply DB 멱등(commentId/유니크). 시퀀스 force-advance 건너뛴 index 회수. `getQueueStatus` 계정별 카운팅/보존정책(removeOnComplete:100/Fail:50) 절단 순수함수 분리.
- 테스트 계약(harness-di): 5개 큐 갭 전부.

### WP-5 — 8개 기능 계약 테스트 + 재등록 차단
- 수정: addAccountAction/addCafeAction soft-delete 재등록 차단(존재 확인에 isActive 포함 또는 upsert). 댓글 계정배정 규칙, cafe join/create 순수 헬퍼(`sanitizeCafeNickname`/`extractCafeMemberCount`/`toCafeSlug`), like/disable job 계약 테스트.
- 검증: 신규 테스트 통과.

### WP-6 — 밥상노트(mealtalkdht) 라이브 E2E
- 목표: 계정/카페관리/글작성/댓글작성/글+댓글/큐 라이브 흐름 스크립트화(`*.live.test.ts` 또는 `scripts/e2e-mealtalkdht.ts`).
- ⚠️ 실제 발행/실댓글은 **되돌릴 수 없음** → 실행 직전 오케스트레이터가 사용자에게 고지하고 승인받는다. 계정생성·카페생성은 무거우니 기본 게이트(dry-run/read-only 우선).
- harness-di 불가 부분은 라이브 스위트로만.

## 완료 기준 (DoD)

- 5대 문제 각각에 대해 회귀를 막는 계약 테스트가 존재하고 `npm run test:harness`에서 실행된다.
- `npm run verify:ci`(lint strict + test:harness + test:tooling + build) 그린.
- 발행 경로: "발행 성공인데 실패처리" / "재시도 중복발행" / "링크 유실"이 테스트로 재현→차단됨.
- 계정 경로: 시트→DB reconcile로 stale 제거, 대상카페 매핑 반영.
- 검증 경로: 외부글 stub이 발행/노출 목록을 오염시키지 않음, live 대조 경로 존재.
- 변경은 WP 단위로 커밋 가능하게 정리(커밋은 오케스트레이터 승인 후).

## WP-1-HARDENING (적대 리뷰 발견 — 반드시 후속 수정)

WP-1 구현 후 독립 리뷰(실제 Redis/BullMQ/mongod 재현)에서 발견. 우선순위대로:

- **H1 (critical)**: `task-job-harness.ts` `createAddTaskJob`이 `attempts: getAttempts(data)`를 항상 옵션에 박아, post 아닌 타입은 `attempts: undefined`가 되어 큐 `defaultJobOptions.attempts:5`를 덮어씀 → comment/reply/like/disable 재시도 0회. **수정**: attempts가 정의됐을 때만 옵션에 포함(`...(attempts === undefined ? {} : { attempts })`). **테스트**: 옵션 객체에 attempts 키가 '존재하지 않음'(`'attempts' in opts === false`)을 검증하도록 기존 테스트 교정.
- **H2 (critical)**: claim leak. `resolvePostOutcome`이 claim을 write 전에 잡고, `!observedPublish`로 throw할 때 claim을 안 푼다 → 재시도가 E11000으로 skip되어 completed로 무음 누락(KST-day 스코프라 하루 종일). **수정**: `releaseClaim(cafeId, account, keyword)` dep 추가(=PostAttempt attemptKey 문서 delete), `!observedPublish` throw 직전에 호출. writer가 throw한 경우(타임아웃 등, 발행 여부 불명)는 claim 유지(중복 방지). **테스트**: "claim 성공 → writer가 success:false&URL없음 → claim 해제되어 재시도 시 다시 write" 계약 추가.
- **H3 (high)**: partial unique index 마이그레이션. 코드 스키마 변경만으로 기존 Atlas 인덱스 `cafeId_1_articleId_1`가 안 바뀜(code 86 conflict). **수정**: `scripts/migrate-published-article-index.ts`(구 인덱스 dropIndex → partial unique 재생성) 작성. 배포 순서 문서화: 인덱스 마이그레이션 먼저 → 스키마 코드 배포. create 실패를 runNonFatal이 무음으로 삼키지 않도록 unverified 저장 실패는 error 레벨로 명확히 로깅.
- **H4 (high)**: `post-writer.ts` articleId 추출(:558) 성공 후 `saveCookiesForAccount`(:561)/`incrementActivity`(:573)가 throw하면 catch-all(:619-625)이 articleId/articleUrl 없이 `success:false` 반환 → 실제 발행 성공 유실. **수정**: articleId/currentUrl을 try 바깥 `let`으로 hoist하거나 후속 호출을 자체 try/catch로 감싸, 최소한 관측 URL과 articleId를 반환.
- **H5 (medium)**: `findRecentArticleBySubject` 복구가 subject 정확일치만 봄(작성자 구분 없음) → 동일 subject 동시 발행 시 남의 articleId 오매칭 가능. **수정**: 가능한 식별자(가장 좁은 시간창, 단일 후보일 때만 채택 등)로 오매칭 방어. 불가하면 다중 후보 시 복구 포기.
- **H6 (low)**: 순수 fn `findRecentArticleBySubject` fallback이 `publishStartedAt`을 무시(호출부가 재검증으로 우연히 막음). **수정**: 순수 fn 자체가 `publishStartedAt` 하드 컷오프를 강제.

DoD 추가: H1은 "옵션 attempts 키 부재" 테스트로, H2는 "claim 해제 후 재시도 재작성" 테스트로 회귀 고정. H3 마이그레이션 스크립트 존재. `npm run test:harness` 그린 유지.
