# Viro Agent (이용자 로컬 에이전트)

웹서비스(Vercel 컨트롤플레인)가 적재한 잡을, **이용자 로컬 머신**에서 꺼내
**로컬 크롬(가정용 IP)**으로 실행하는 러너. 데이터센터 IP 밴을 피하려는 구조.

```
[웹서비스] 잡 적재(userId) → Mongo 큐 → [이 에이전트] claim → 로컬 Playwright 실행 → result 리포트
```

에이전트는 DB/큐 자격증명을 갖지 않는다. `AGENT_TOKEN`(웹에서 발급) + `BROKER_URL`만
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

## 토큰 발급 (운영자)

```bash
tsx --env-file=.env.local scripts/issue-agent-token.ts <userId> [label]
# 출력된 AGENT_TOKEN 을 이용자 에이전트에 전달
```

## 구성 (진행 상황)

- `lib/config.ts` — 에이전트 설정 로드
- `lib/broker-client.ts` — 브로커 HTTP 클라이언트 (claim/heartbeat/result)
- `lib/ensure-chromium.ts` — 첫 실행 시 rebrowser 크롬 자동 설치
- _(다음)_ `runtime.ts` — claim→로컬 실행→report 루프 (posting 로직 재사용 + 계정 전달)
- _(다음)_ `cli.ts` — CLI 진입점 (MVP 검증용)
- _(다음)_ `electron/` — Windows 우선 데스크톱 앱 셸 (셋업+토큰+Start/Stop)
