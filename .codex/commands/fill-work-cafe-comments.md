# 작업카페 댓글 채우기 (work-cafe 댓글 부족 해소)

15개 작업카페(healthhhh, driveee, mealtalkdht, localtable702, menunote702, tableclub702, petinfo183, dogwalk2m4, carelog702, habitnote702, infomadang702, talkmadang702, walknote702, petnote702, babsangnote702) 전체를 훑어서 댓글이 부족한 글에 자연스러운 댓글을 채우는 스킬.

## 입력 확인

사용자에게 아래 정보를 확인 (기본값 있으면 되물을 필요 없음):
- **목표 댓글 개수 범위**: 기본 5~10개 (글마다 랜덤 목표, 5-13도 가능)
- **딜레이**: 기본 계정간격 3분/전역 10초/글간격 25분. 시간 촉박하면 1분/3초/5분까지 줄일 수 있음
- **마감 시간**: 있으면 그 시간까지 최대한 밀어붙이는 설정으로 조정
- **브라우저 표시 여부**: 기본 headless, 요청 있으면 `PLAYWRIGHT_HEADLESS=false`로 실제 창 띄움

## 작업 흐름

### 1단계: 댓글 0건/부족 글 수집

```bash
npx tsx --env-file=.env.local scripts/collect-work-cafe-zero-comment-posts.ts --login-id=21lab --per-page=20 --max-pages=30
```

15개 카페 전체를 순회하며 댓글 0건 글을 수집. `outputs/work-cafe-zero-comment-posts-<timestamp>.json/.csv/.md` 생성.

**결과 확인**: 카페별 전체글/댓글0건 개수를 표로 정리해서 사용자에게 보고. 심각도 순(댓글0 많은 순)으로 정렬.

### 2단계: 목표 개수 반영 (DB에 persist)

댓글 0건뿐 아니라 목표치 미달(예: 5~10개 목표인데 3개뿐)인 글도 같이 잡으려면 `--target-min`/`--target-max`로 범위 지정 (글마다 랜덤 목표):

```bash
npx tsx --env-file=.env.local scripts/persist-work-cafe-comment-targets.ts \
  --source=outputs/work-cafe-zero-comment-posts-<timestamp>.json \
  --target-min=5 --target-max=10
```

고정 개수로 하려면 `--target-comment-count=8` 사용.

### 3단계: 스케줄 생성

```bash
npx tsx --env-file=.env.local scripts/build-work-cafe-comment-schedule.ts --login-id=21lab
```

- 카페장 계정은 커멘터 풀에 포함하되 **자기 카페 글에서만 자동 제외** (own-cafe-only, 기본값). 전체 제외하려면 `--exclude-owner-accounts-global` 추가하되, 그러면 풀이 확 줄어드니 웬만하면 쓰지 않는다.
- `excludeFromAutoComment: true`로 플래그된 계정(다른 업체 전용 계정 등)은 자동으로 커멘터 풀에서 빠짐 — 계정 관리 페이지(`/accounts`)에서 "자동 댓글 작업 풀에서 제외" 체크박스로 관리.
- 재실행해도 이미 채워진 만큼은 자동으로 빠지고 부족분만 다시 스케줄됨 (WorkCafeArticle.commentCount 기준 재계산) — 프로세스가 죽어도 데이터 안 날아감, 다시 이 스텝부터 돌리면 이어서 진행.

### 4단계: 실행

```bash
PLAYWRIGHT_HEADLESS=false npx tsx --env-file=.env.local scripts/run-work-cafe-comment-parallel.ts \
  --schedule=outputs/work-cafe-comment-schedule-<timestamp>.json \
  --login-id=21lab \
  --account-gap-min=1 \
  --global-gap-sec=3 \
  --article-gap-min=5 \
  --skip-warmup \
  --canary-success-target=0 \
  --max-active=20 \
  > /tmp/bulk-comment-run.log 2>&1 &
```

- 본문을 실제로 읽고(`readCafeArticleContent`) DeepSeek(`deepseek-v4-flash`, text-gen-hub 경유)으로 원고 기반 댓글을 생성 → 계정별로 배정해서 순차 등록.
- **시간 촉박할 때**: `--skip-warmup`(계정 순차 워밍업 생략, 캡차 실패 계정 하나가 전체를 막는 것 방지) + `--canary-success-target=0`(사전 검증 단계 생략, 바로 `--max-active` 전체 병렬로 진입) 조합이 가장 빠름. 기본값(워밍업+캐너리5)은 안전하지만 느림.
- 계정 하나가 캡차/로그인 실패해도 그 계정만 해당 글에서 자동 스킵되고(`runtime-pair-blocked`) 나머지 계정으로 계속 진행됨 — 별도 조치 불필요.

### 5단계: 진행상황 모니터링

```bash
grep -c "COMMENT-DB.*저장 성공" <로그파일>   # 누적 성공
grep -c "실패 seq=" <로그파일>              # 누적 실패
grep "progress success=" <로그파일> | tail -1  # 30초 단위 진행률 (success/failed/generatedArticles)
```

- 장시간(수 시간) 걸리는 작업이므로 Monitor 툴로 `progress success=`/`run-ended` 라인을 감시하거나, ScheduleWakeup으로 20~30분 간격 체크가 적절함. 매 이벤트마다 응답할 필요는 없고, 유의미한 변화(실패 급증, 프로세스 죽음)에만 반응.
- 프로세스가 죽으면 3단계(스케줄 재생성)부터 다시 실행 — DB 상태 기준으로 자동 이어서 진행됨.
- 마감 시간이 있으면: 현재 페이스(성공 건수/경과 시간)로 남은 시간 내 예상 처리량을 계산해서 사용자에게 솔직하게 보고. 딜레이를 이미 최소로 줄인 상태라면 그 이상 줄이지 말고(캡차/밴 리스크), 대신 캐너리/워밍업 생략 여부를 먼저 확인.

## 주의사항 (이번 세션에서 발견한 함정)

1. **오염 계정 필터링**: `Account.find(...)`로 직접 커멘터를 조회하는 스크립트는 `excludeFromAutoComment: { $ne: true }` 조건을 반드시 넣을 것. 빠뜨리면 다른 업체 전용 계정(예: 안과의원 노출용 계정)이 무관한 카페에 댓글을 달아버림 — 실제로 `build-work-cafe-comment-schedule.ts`, `run-schedule.ts`, `run-campaign.ts`에서 이 버그가 있었고 수정됨.
2. **카페장 닉네임 오기재 확인**: `collect-work-cafe-zero-comment-posts.ts`의 `WORK_CAFES` 배열 `ownerName`은 반드시 **실제 계정 닉네임**이어야 함 (카페 설명/이름이 아님). 틀리면 카페장 본인 계정이 자기 글에 댓글 다는 걸 못 막음. 구글시트 "카페정보 및 링크" 탭(스프레드시트 ID: `1JMNXyIaTR55aX4SRcD4Kp09W-WNjqMwMi0Xt2TV7ZYw`, 카페장계정/카페장닉네임 컬럼)이 있으면 그걸로 교차검증.
3. **스케줄 재빌드 시 `--exclude-owner-accounts-global` 남용 금지**: 커멘터 풀이 크게 줄어서 처리 속도가 느려짐. own-cafe-only(기본값)로 충분.
4. **바로 실행 전 text-gen-hub 서버 확인**: `curl -sS -m 5 http://localhost:8000/openapi.json`로 200 확인. 죽어있으면 `cd <text-gen-hub 경로> && uv run uvicorn api:app --host 0.0.0.0 --port 8000 --no-access-log --env-file .env.local &`로 재기동 (DeepSeek 등 실제 키는 그 프로젝트 `.env.local`에 있음).

## 사용법

```
/fill-work-cafe-comments
```
