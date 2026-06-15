# Compound Log

## 2026-06-15 Cafe Writer Account Policy
- 문제: 샤넬/쇼핑 writer 계정이 DB, 스케줄, 임시 스크립트, 메모리에 흩어져 서로 다른 목록을 사용했다.
- 조치: 카페별 writer 정책은 `src/shared/config/cafe-account-policy.ts`로 모으고, `account-roster-harness.ts`는 비밀번호 계정표 동기화가 아니라 DB/정책 감사 전용으로 변경했다.
- 추가 조치: DB 비활성 계정 19개를 백업 후 삭제했고, 샤넬/쇼핑에 잘못 물린 예약 16건을 큐에서 삭제했다.
- 재발 방지: `accounts:sync`는 비활성화하고, 스케줄 등록은 카페별 writer 풀이 비어 있으면 실패하게 유지한다. 큐 감사는 `scripts/audit-invalid-cafe-writer-schedules.ts`로 확인한다.
- 키워드 쏠림 방지: `SCHEDULE_FILE` 등록 시 광고 키워드 주제군 한도를 검사한다. `계류유산`, `시험관`처럼 한 주제군이 과다 반복되면 `run-schedule.ts`가 큐 등록 전 실패한다.
- 남은 조건: 샤넬/쇼핑 최신 계정 ID/PW 확보 후 에디터 진입 검증을 통과해야 큐 등록 가능.
