# 로그인 기반 기능 API

Viro 앱과 `npm run agent:login`은 동일한 로그인 API를 사용한다. 사용자에게 인증 문자열 복사를 요구하지 않는다. CLI 워커도 앱과 같은 `~/.viro-agent/config.json`에서 로그인 상태를 읽는다. 운영 서비스 계정으로 로그인하고 그 계정으로 워커를 시작해야 한다.

## 변경 위치

| 책임 | 모듈 |
| --- | --- |
| 로그인 검증 및 기존 비밀번호 해시 전환 | shared/lib/agent-management/login-service.ts |
| 로그인 DB 접근 | shared/lib/agent-management/login-store.ts |
| 인증 문자열 검증 | shared/lib/agent-broker/auth.ts |
| 가입·댓글 입력/명세 | shared/lib/agent-management/contract.ts, capability-schema.ts |
| 데스크톱 기능 입력/명세 | shared/lib/agent-management/action-contract.ts, action-capabilities.ts |
| 중복 접수 방지 | shared/lib/agent-management/idempotent-request.ts |
| 데스크톱 기능 저장·소유자·워커 임대 | shared/lib/agent-management/action-store.ts |
| 개별 실행 | agent/actions/{join,nickname,exposure,cafe-create,publish,modify,rewrite}.ts |
| 실행·하트비트·결과 보고 | agent/lib/action-client.ts |

웹 세션 쿠키도 사용자 ID를 직접 신뢰하지 않고 서버에서 검증하는 로그인 세션으로 바뀐다. 이 버전 배포 후 기존 웹 사용자는 한 번 다시 로그인해야 한다. 비활성화한 사용자와 만료한 웹 세션은 거부한다.

## API

- GET `/api/agent/capabilities`: 로그인한 사용자의 기능, 입력 스키마, 워커 상태.
- POST `/api/agent/actions/validate`: 입력과 소유 자원 및 작업 프로그램 연결을 검증한다. 외부 작업을 실행하거나 큐에 넣지 않는다.
- POST `/api/agent/actions`: `Idempotency-Key`와 검증된 작업 객체로 접수. `{success, task, replayed}`, HTTP 202.
- GET `/api/agent/actions?id=작업ID`: 해당 사용자 작업 결과. id 생략 시 최근 50개.
- `/actions/claim`, `/actions/heartbeat`, `/actions/result`: 워커 전용. Ply의 범용 조회 허용 목록에 넣지 않는다.

기존 `/operations` 가입·댓글 API는 그대로 유지된다. 새 8개 기능은 `actionWorkerOnline`을 별도로 확인한다. 기존 0.2.4 워커의 `operationWorkerOnline`만으로 새 기능을 접수하지 않는다.

`pending/running`은 완료가 아니다. 완료 응답도 항목별 결과를 확인한다. 실행 도중 연결이 끊기거나 결과가 불확실하면 `needs_review`로 남기며 자동 재실행하지 않는다. API 등록은 네이버 실제 작업의 성공 증명이 아니다.

원격 원고 발행·수정은 카페를 명시해야 한다. PC 로컬 파일을 원격 요청으로 읽지 않도록 이미지 경로를 받지 않는다. 이미지 업로드는 별도 자산 API가 필요하며 현재 원격 원고는 텍스트만 지원한다.

## 상시 실행과 배포

API는 Vercel에, 브라우저 워커는 상시 실행 호스트에 배포한다. 새 API를 먼저 배포한 뒤 같은 버전 워커를 설치한다. CLI의 로그인 파일은 운영 계정만 읽을 수 있게 유지한다. 서비스 관리자에서 워커의 비정상 종료 시 재시작하도록 설정한다. 사용자 Mac의 절전·종료 중에는 로컬 워커가 실행되지 않으므로 상시 운영 증거로 취급하지 않는다.

현재 변경은 로컬 구현이다. 운영 호스트 선정, 서비스 관리자 설치, 재부팅 복구 및 실제 로그인 후 하트비트 검증은 별도 운영 적용 단계다.
