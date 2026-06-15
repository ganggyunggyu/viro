# 2026-06-15 Cafe Writer Account Policy

## 목적
- 샤넬오픈런/쇼핑지름신 글쓰기 계정 정의가 DB, 스케줄, 검증 스크립트에서 서로 엇갈리지 않게 고정한다.

## 원장
- 계정 활성/비활성, role 값 원장: MongoDB `Account` 컬렉션
- 카페별 writer 정책 원장: `src/shared/config/cafe-account-policy.ts`
- 실제 로그인/글쓰기 에디터 검증: `scripts/verify-cafe-writer-editor-access.ts`

## 정책
- 샤넬오픈런, 쇼핑지름신 writer 후보는 `LUXURY_CAFE_WRITER_ACCOUNT_IDS`만 사용한다.
- writer 후보는 반드시 DB에서 `isActive: true`이고 `role: "writer"`인 계정만 통과한다.
- 건강 카페 writer 후보는 샤넬/쇼핑 writer 후보를 제외한 active writer만 사용한다.
- commenter는 글쓰기 후보로 승격하지 않는다.
- 스케줄 큐 등록 시 해당 카페 writer 풀이 비어 있으면 다른 카페 writer로 대체하지 않고 실패시킨다.

## 현재 상태
- 2026-06-15 검증 기준, 샤넬오픈런/쇼핑지름신 writer 풀은 비어 있다.
- 기존 샤넬/쇼핑 후보 중 `4giccokx`, `uqgidh2690`, `eytkgy5500`, `yenalk`는 로그인 검증 실패 후 비활성 DB 레코드까지 삭제했다.
- `olgdmp9921`은 DB 계정 레코드가 없다.
- 현재 active writer 전체를 후보로 넓혀 확인해도 샤넬/쇼핑 글쓰기 에디터 진입 성공 계정은 없었다.
- DB의 비활성 계정은 혼선 방지를 위해 모두 삭제했다. 삭제 전 백업: `/Users/ganggyunggyu/.codex/backups/cafe-bot/inactive-accounts-21lab-2026-06-15-182831.json`
- 샤넬/쇼핑에 건강 카페 writer가 물린 예약 16건은 Redis 큐에서 삭제했다. writer 풀이 비어 있어 대체 예약은 생성하지 않았다.
- `계류유산` 반복 같은 미노출 키워드 쏠림은 최종 스케줄 등록 단계에서 차단한다. `SCHEDULE_FILE`로 `run-schedule.ts`를 실행하면 광고 키워드 주제군 한도(`SCHEDULE_MAX_THEME_PER_DAY`, `SCHEDULE_MAX_THEME_PER_CAFE`)를 넘는 즉시 큐 등록 전 실패한다.

## 검증 명령
```bash
node scripts/run-with-project-root.mjs tsx --test src/shared/config/cafe-account-policy.test.ts
node scripts/eslint-gate.mjs scripts/audit-invalid-cafe-writer-schedules.ts scripts/account-roster-harness.ts scripts/account-roster-harness.test.ts scripts/check-session-cache.ts scripts/check-writer-login.ts scripts/verify-accounts-temp.ts scripts/verify-cafe-writer-editor-access.ts src/shared/config/cafe-account-policy.ts src/shared/config/cafe-account-policy.test.ts scripts/run-schedule.ts
node scripts/run-with-project-root.mjs tsx --env-file=.env.local scripts/audit-invalid-cafe-writer-schedules.ts
SCHEDULE_FILE=scripts/artifacts/cafe-schedule-2026-06-15-unexposed-standard.json node scripts/run-with-project-root.mjs tsx --env-file=.env.local scripts/run-schedule.ts
npm run accounts:check
```

## 운영 절차
- 샤넬/쇼핑 최신 계정 ID/PW를 확보한다.
- `import-accounts-and-join-cafes.ts` 또는 명시적 DB 업데이트 스크립트로 해당 계정을 `role: "writer"`, `isActive: true`로 넣는다.
- `scripts/verify-cafe-writer-editor-access.ts`로 로그인과 글쓰기 에디터 진입을 확인한다.
- `npm run accounts:check`가 통과한 뒤 스케줄 큐를 등록한다.

## 금지
- `account-roster-harness.ts`에 비밀번호 계정표를 다시 하드코딩하지 않는다.
- `accounts:sync`로 예전 계정표를 DB에 덮어쓰지 않는다.
- 샤넬/쇼핑 writer 풀이 비어 있을 때 건강 카페 writer로 임의 대체하지 않는다.
