# Viro 데스크톱 프로그램

Viro 웹 화면 전체를 Electron 창으로 제공하면서, Playwright/Chrome이 필요한 카페 작업은
이용자 PC에서 실행하는 데스크톱 프로그램이다. Vercel은 로그인·데이터·작업 등록을 맡고,
브라우저 자동화는 로컬 실행부가 맡는다.

```
[Viro 웹 UI] 작업 적재(userId) → Mongo 브로커 → [데스크톱 앱] claim → 로컬 Playwright 실행 → 결과 리포트
```

프로그램은 DB/큐 자격증명을 갖지 않는다. `AGENT_TOKEN`(웹에서 발급) + `BROKER_URL`만
갖고 브로커 HTTP API(`/api/agent/{claim,heartbeat,result}`)로만 통신한다. pull 방식이라
방화벽/NAT 설정이 필요 없다.

## 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `BROKER_URL` | ✅ | 웹서비스 주소 (예: `https://cafe-bot-two.vercel.app`) |
| `AGENT_TOKEN` | ✅ | 웹에서 발급한 페어링 토큰 |
| `PLAYWRIGHT_BROWSERS_PATH` | | 크롬 설치 경로 (기본: `~/.viro-agent/browsers`) |
| `AGENT_WORKER_ID` | | 워커 식별자 (기본: `agent-<pid>`) |
| `AGENT_POLL_INTERVAL_MS` | | 큐 폴링 간격 (기본: 15000) |

## 데스크톱 앱 실행

```bash
npm run agent:app
```

앱은 설정 전용 화면이 아니라 운영 Viro 전체 UI를 연다. 로그인 후 `프로그램` 메뉴에서
연결 토큰을 발급하면 현재 PC에 자동 저장되고 로컬 실행부가 시작된다. 저장된 토큰이 있으면
다음 실행부터 로컬 실행부도 자동으로 시작한다.

## 설치본 생성

```bash
npm run agent:app:dist
```

산출물은 `agent/electron/out/`에 생성된다. macOS 로컬 빌드는 ad-hoc 서명으로 번들
무결성을 검증할 수 있지만, 일반 사용자에게 경고 없는 더블클릭 설치를 제공하려면 Apple
Developer ID 서명과 공증이 추가로 필요하다.

첫 실행 시 Chromium을 `~/.viro-agent/browsers`에 자동으로 내려받는다. 패키징된 Electron
바이너리를 Node 모드로 실행해 Playwright CLI를 호출하므로 별도 Node.js 설치가 필요 없다.

## 현재 로컬 실행 범위

- 수동 원고 발행·수정, 키워드 글 발행, 기존 글 재작성
- 댓글 작업 `fixed`·`generate`·`agent`, 소유 댓글 삭제, 카페 가입 확인
- 계정 로그인 확인, 카페 일괄 가입, 닉네임 변경, 카페 개설, 노출 확인
- AI 원고·댓글 계획·캡차 해석과 DB/시트 기록은 웹 서버가 담당
- 네이버 본문 읽기·글/댓글 작성·수정·검색·가입·개설은 로컬 Playwright가 담당

브라우저 의존 기능은 모두 `window.viroDesktop.executeAction()`을 통해 Electron 메인
프로세스에서 실행한다. 일반 웹 브라우저에는 이 브리지가 없으므로 실행을 시작하지 않고
Viro 데스크톱 프로그램 사용을 안내한다. 웹 서버에서 Playwright를 직접 실행하는 기존
Server Action은 호환 코드로만 남아 있으며 사용자 UI에서는 호출하지 않는다.

## 구성

- `lib/config.ts` — 에이전트 설정 로드
- `lib/broker-client.ts` — 브로커 HTTP 클라이언트 (작업, 컨텍스트, 준비, 결과 동기화)
- `desktop-actions.ts` — 전체 UI에서 호출하는 로컬 브라우저 작업 디스패처
- `lib/ensure-chromium.ts` — 첫 실행 시 rebrowser 크롬 자동 설치
- `runtime.ts` — claim→본문읽기/삭제→계획 수령→로컬 posting→report 루프
- `cli.ts` — CLI 진입점 (env 세팅 → 크롬 설치 → 루프)
- `electron/` — 전체 Viro UI 셸, 연결 상태/로그, 앱 패키징
