# cafe-bot (viro)

네이버 카페에 글/댓글/대댓글을 자동으로 발행하는 바이럴 마케팅 자동화 플랫폼. Next.js 대시보드에서 계정·카페·키워드를 관리하면 Playwright가 실제 브라우저로 네이버 카페에 로그인해 글을 쓰고, BullMQ 큐가 댓글/대댓글을 사람이 쓰는 것처럼 시간 간격을 두고 순서대로 발행한다.

수십 개 계정으로 여러 카페에 동시에 글을 올리다 보면 문제가 대부분 "타이밍"과 "순서"에서 터진다. 같은 계정이 같은 댓글을 중복으로 쓰거나, 시퀀스가 꼬여서 대댓글이 먼저 달리거나, dev 서버가 핫리로드될 때마다 Playwright 세션이 끊기는 식이다. 이 레포는 그런 문제들을 하나씩 겪고 고치면서 커진 프로젝트라, 아래 트러블슈팅 항목이 기능 목록만큼 중요하다.

## 주요 기능

- 네이버 카페 자동 글쓰기 — 카테고리 지정, 이미지 업로드, HTML 본문 변환까지 Playwright로 처리
- AI 기반 바이럴 콘텐츠 생성 — Gemini/Claude로 글 본문과 댓글/대댓글 세트를 생성하고 파싱
- 댓글/대댓글 큐잉 — BullMQ로 계정별 순서를 보장하면서 사람처럼 랜덤 간격을 두고 발행
- 다중 계정 관리 — 계정별 Playwright 브라우저 컨텍스트를 독립적으로 유지 (세션/쿠키 캐시)
- Bull Board 큐 대시보드 — 워커별 대기/진행/실패 작업을 실시간으로 모니터링
- 계정/카페 스프레드시트 동기화 — Google Sheets에서 계정 정보를 가져와 MongoDB에 반영
- 수동 발행/수정 — 큐를 거치지 않고 즉시 글을 쓰거나 기존 글을 수정하는 도구
- 원고 기반 일괄 실행 스크립트 — `scripts/` 아래 300여 개의 운영 스크립트로 캠페인 스케줄링, 노출 체크, 계정 감사 등을 자동화

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript 5 |
| 상태 관리 | Jotai |
| 스타일 | Tailwind CSS v4 |
| 브라우저 자동화 | Playwright (`rebrowser-playwright` 패키지로 감지 우회) |
| 작업 큐 | BullMQ + ioredis, Bull Board (Express) |
| 데이터베이스 | MongoDB (Mongoose) |
| 인증 | 쿠키 기반 세션 (next-auth 의존성은 있지만 실제로는 미사용) |
| AI | `@anthropic-ai/sdk`, `@google/genai` (Gemini) |
| 외부 연동 | Google Sheets API (`googleapis`), 자체 이미지 검색 API |
| 테스트 | Node.js 내장 테스트 러너 (`node --test`, `tsx --test`) |
| 린트 | ESLint 9 (flat config) |

## 아키텍처 / 폴더 구조

FSD(Feature-Sliced Design)를 변형해서 적용했다. 레이어 규칙은 `app → features/widgets → entities → shared` 순으로 내려가야 하지만, 실제로는 `features/auto-comment/batch`가 다른 feature에서도 직접 참조되는 예외가 있다(아래 알려진 제약사항 참고).

```
src/
├── app/                    # Next.js App Router — 페이지 + API 라우트
│   ├── api/                # accounts, auth, cafes, viral REST 엔드포인트
│   └── {page}/             # viral이 메인 페이지, / → /viral 리다이렉트
├── entities/                # 3계층 엔티티 패턴 (model/ + api/ + index.ts)
│   ├── account/             # NaverAccount CRUD (Server Actions)
│   ├── cafe/                 # CafeConfig CRUD (Server Actions)
│   ├── queue/                # BullMQ 큐 상태 조회 (Redis 직접 접근)
│   └── store/                 # Jotai atoms (postOptions, cafes)
├── features/                # 기능 모듈 (UI + Server Actions)
│   ├── auto-comment/        # 글쓰기 + 댓글/대댓글 배치 처리 (가장 큰 모듈)
│   ├── viral/                # AI 바이럴 콘텐츠 — 파서, 프롬프트, 배치, 디버그
│   ├── manual-post/          # 수동 발행 (큐를 거치지 않음)
│   ├── accounts/              # 계정/카페 관리 UI
│   ├── auth/                   # 로그인/로그아웃, AuthGuard
│   ├── comment/                 # 단건 댓글 발행
│   ├── post-article/             # 단건 글 발행
│   └── settings/                  # 큐 딜레이 설정 UI
├── shared/                  # 공유 계층
│   ├── api/                  # 외부 API 클라이언트 (네이버, 콘텐츠 생성, 구글 이미지)
│   ├── config/                # DB 기반 설정 (accounts.ts, cafes.ts, user.ts)
│   ├── lib/                    # 핵심 인프라 — queue/, mongodb, redis, multi-session(Playwright)
│   ├── models/                  # Mongoose 스키마 11개
│   ├── store/                    # Jotai atoms (user)
│   └── ui/                        # 공통 UI 컴포넌트
└── widgets/                 # 페이지 레이아웃 (page-layout)

scripts/                    # 운영/검증 스크립트 300여 개
├── run-with-project-root.mjs   # 모든 npm script가 거치는 cwd 고정 래퍼
├── bull-board.ts                # Bull Board 서버 (:3008)
├── sync-cafe-accounts-from-sheet.ts  # Google Sheets → MongoDB 계정 동기화
├── harness-verify.ts            # 하네스 기반 회귀 검증 CLI
└── ...                          # 캠페인 스케줄링, 노출 체크, 계정 감사 등

docs/                        # 하네스 엔지니어링 가이드, 트러블슈팅 기록
```

## 설치 및 실행 방법

### 사전 준비물

- Node.js 20 이상 (개발 환경은 v25 기준으로 검증)
- Redis (로컬 또는 원격, DB index 1을 사용)
- MongoDB (로컬 또는 Atlas)
- 네이버 계정 및 카페 정보 (Playwright 로그인용)

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고해서 `.env.local`을 만든다.

```bash
cp .env.example .env.local
```

`.env.local`에 최소한 다음 값들이 필요하다 (실제 값은 각자 발급/구성).

| 변수 | 용도 |
|------|------|
| `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | 네이버 OAuth |
| `NAVER_CAFE_ID`, `NAVER_CAFE_MENU_ID` | 기본 카페/게시판 설정 |
| `MONGODB_URI` | MongoDB 연결 문자열 |
| `REDIS_URL` | Redis 연결 문자열 (기본 `redis://localhost:6379/1`) |
| `CONTENT_API_URL` | 원고 생성용 콘텐츠 API 서버 주소 |
| `GOOGLE_IMAGE_API_URL` | 이미지 검색 API 주소 |
| `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` | AI 콘텐츠 생성용 API 키 |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth 설정값 (의존성만 존재, 실제 인증엔 미사용) |
| `PLAYWRIGHT_HEADLESS` | `false`로 두면 브라우저 창을 직접 보면서 디버깅 가능 |

시크릿 값은 이 문서에 절대 적지 않는다. 실제 키/비밀번호는 각자의 `.env.local`에만 보관한다.

### 3. Redis / MongoDB 준비

```bash
# macOS 기준 예시 (Homebrew)
brew services start redis
# MongoDB는 로컬 인스턴스를 쓰거나 Atlas URI를 MONGODB_URI에 지정
```

### 4. 개발 서버 실행

```bash
npm run dev
```

`concurrently`로 두 프로세스가 함께 뜬다.

- Next.js dev 서버: `http://localhost:3007` (기본 3000이 아님)
- Bull Board 큐 대시보드: `http://localhost:3008` (앱에서는 `/queue` 경로로 리라이트됨)

Next.js만 필요하면:

```bash
npm run dev:next
```

Bull Board만 필요하면:

```bash
npm run bull-board
```

### 5. 프로덕션 빌드

```bash
npm run build
npm run start
```

### 6. 코드 검증

```bash
npm run lint              # ESLint (src, next.config.ts)
npm run lint:strict       # 변경된 파일 기준 strict lint gate
npm run test:harness      # 큐/시퀀스 하네스 테스트 (Redis 없이 핵심 로직 검증)
npm run test:tooling      # 스크립트 자체(run-with-project-root, eslint-gate)에 대한 테스트
npm run verify:ci         # 위 전부 + build를 순서대로 실행 (CI에서 사용하는 전체 검증)
```

### 7. 계정 동기화 (선택)

Google Sheets에 정리된 계정 정보를 MongoDB로 가져올 때 사용한다.

```bash
npm run accounts:sheet:check   # 드라이런 — 변경 사항만 확인
npm run accounts:sync          # 실제 반영
```

## 트러블슈팅

실제로 겪고 고친 문제들이다. 모두 커밋 히스토리와 코드에 근거한 내용이다.

### 댓글/대댓글이 같은 시각에 2~3번씩 중복 작성됨

가장 골치 아팠던 버그. 특히 시퀀스의 **마지막 댓글**에서 집중적으로 발생했다. 원인 분석과 수정 과정은 `docs/fix-duplicate-comments.md`에 정리되어 있고, 커밋은 `1c11de8`(fix(queue): 중복 댓글/대댓글 방지).

원인은 시퀀스 대기 중 reschedule을 걸 때마다 새 잡 ID(`rescheduleToken`)를 발급했던 것이었다. 차례가 안 왔으면 매번 새 토큰으로 재등록하고 원래 잡은 완료 처리되다 보니, 오래 기다리는 마지막 댓글일수록 복사본이 계속 쌓였다. 드디어 차례가 되면 쌓인 복사본이 한꺼번에 실행되어 동일 댓글이 여러 번 달렸다.

수정은 두 겹으로 들어갔다.

1. reschedule 토큰을 고정값 `'seqwait'`로 바꿔서, BullMQ의 잡 ID 기반 중복 체크가 새로 쌓이는 걸 막는다.
2. 실제 작성 직전에 Redis `SET NX`로 원자적 write lock을 건다 (`src/shared/lib/queue/handlers/comment-handler.ts:21`, `:30`, `:132`). BullMQ stalled job 재실행이나 `attempts: 3` 재시도로 인한 중복까지 이 락에서 한 번 더 막는다.

같은 패턴이 `src/shared/lib/queue/handlers/reply-handler.ts`에도 동일하게 적용되어 있다.

### 시퀀스 대기가 무한정 블로킹되던 문제

`8df24bb`(fix(queue): improve sequence handling and retry logic)에서 손댄 부분. 원래는 자기 차례가 아니면 계속 대기만 했는데, 워커가 죽거나 이전 작업이 실패하면 뒤 작업들이 영원히 대기 상태로 멈췄다.

`src/shared/lib/queue/sequence-harness.ts:36`에 `DEFAULT_SEQUENCE_WAIT_LIMIT_MS = 30 * 1000`을 두고, 30초 넘게 기다리면 `'pending'` 상태로 판단해서 시퀀스 정보 없이 재스케줄하도록 바꿨다. 무한 대기 대신 최소한 진행은 되도록 한 트레이드오프다.

### 댓글 작성 간격이 너무 짧아서 부자연스러움

`a3ca22e`(fix: slow viral comment cadence)에서 조정. 처음에는 글 저장 후 첫 댓글까지 30초, 댓글 사이 간격은 30초~1분30초로 고정에 가까웠는데, 이 정도로는 자동화 티가 너무 났다.

첫 댓글 지연을 4~7분, 댓글 사이 간격을 4~9분 범위로 늘리고 `getRandomDelay`로 매번 랜덤하게 뽑도록 바꿨다 (`src/shared/lib/queue/handlers/post-handler.ts:136-137`, `:179`). 같은 수정을 `scripts/run-modify.ts`, `scripts/run-modify-from-manuscripts.ts`에도 반영했다.

### Playwright 세션이 Next.js dev 서버 핫리로드마다 끊김

`a69ceee`(fix(session): Playwright 세션 HMR 안정화 및 idle cleanup)에서 해결. Next.js dev 모드는 파일을 저장할 때마다 모듈을 재평가하는데, 브라우저 인스턴스와 계정별 컨텍스트를 일반 모듈 스코프 변수(`let browser`, `const contexts = new Map()`)로 들고 있다 보니 HMR이 일어날 때마다 참조가 날아가서 매번 새 브라우저를 띄웠다.

`globalThis`에 상태를 얹어서(`src/shared/lib/multi-session.ts`) 모듈이 재평가돼도 브라우저/컨텍스트/락 상태가 유지되도록 고쳤다. 여기에 추가로:

- `isContextAlive()` (`multi-session.ts:249`)로 죽은 컨텍스트를 감지해서 재생성
- `getBrowser()`에서 `browser.isConnected()` 체크 후 끊겼으면 자동 재시작 (`multi-session.ts:215`)
- `page.isClosed()` 체크 추가 (`multi-session.ts:315`)
- 일정 시간 미사용 컨텍스트는 자동으로 정리하는 idle cleanup 타이머 추가 (현재는 10~15분 랜덤 TTL, `multi-session.ts:68-70`)

### 네이버 에디터의 지도/장소 팝업이 클릭을 가로막음

`c82a419`(fix(playwright): 팝업 닫기 및 클릭 재시도 로직 추가)에서 대응. 글 작성 중 스마트에디터가 지도나 장소 검색 팝업(`.se-popup-close-button`)을 띄우면 그 위에 오버레이가 생겨서 본문 클릭이나 등록 버튼 클릭이 `intercepts pointer events` 에러로 실패했다.

`clickWithPopupRetry()` 헬퍼(`src/shared/lib/naver-cafe-writing/post-writer.ts:20`)를 만들어서, 클릭이 실패하면 팝업 닫기 버튼을 누르고 ESC까지 시도한 뒤 재시도하고, 그래도 안 되면 마지막엔 `force: true`로 강제 클릭한다. 본문 영역(`post-writer.ts:481`)과 등록 버튼(`post-writer.ts:578`) 클릭 모두 이 헬퍼를 거치도록 바꿨다.

### 다중 이미지 동시 업로드 시 일부 이미지가 누락됨

`b4cc180`(fix(image): 다중 이미지 순차 업로드 방식으로 변경)에서 발견한 문제. 네이버 에디터에 여러 파일을 한 번에 넘기면 에디터가 일부만 처리하고 나머지를 누락시키는 경우가 있었다.

이미지를 한 장씩 `filechooser` 이벤트로 넘기고 업로드 완료를 확인한 뒤 다음 이미지로 넘어가는 순차 방식으로 바꿨다 (`src/shared/lib/naver-cafe-writing/image-uploader.ts:163` `uploadSingleImageFile`, `:265` 순차 루프). 느려지긴 했지만 누락은 없어졌다.

### 구글 이미지 검색 API 응답 형식이 바뀌면서 파싱이 깨짐

`782e2de`(fix(api): 구글 이미지 API 응답 파싱 수정). 이미지 API가 응답 형식을 `{ images: string[] }`에서 `{ images: { body, individual, slide, collage } }`처럼 카테고리별 객체로 바꿨는데, 클라이언트는 옛 형식 그대로 파싱하고 있어서 이미지가 하나도 안 나왔다.

`src/shared/api/google-image-api.ts:46-49`에서 네 카테고리를 모두 펼쳐서 합치고, `http`로 시작하는 문자열만 걸러내도록 수정했다.

### HTML로 생성된 원고를 그대로 붙여넣으면 줄바꿈이 사라짐

`fdc06d8`(fix(post): HTML 태그 변환 시 줄바꿈 누락 수정). AI가 생성한 원고가 `<p>줄1</p><p>줄2</p>` 형태인데, 이걸 plain text로 변환하는 로직이 `</p><p>` 경계를 그냥 지워버려서 `줄1줄2`처럼 문장이 붙어버렸다. `</p><p>` 패턴을 줄바꿈 문자로 치환하도록 고쳐서 원래 문단 구분을 살렸다.

반대로 댓글에서는 줄바꿈이 문제였다. `c426e36`(fix(comment): 댓글 줄바꿈 강제 제거)에서, AI가 생성한 댓글에 줄바꿈이 섞여 있으면 네이버 카페 댓글창에 그대로 입력했을 때 형식이 깨졌다. `src/shared/lib/naver-cafe-writing/comment-writer.ts:271`, `:464`에서 댓글/대댓글 내용을 `fill()`하기 직전에 `\n`을 공백으로 치환하고 중복 공백도 정리하도록 했다.

### 로그아웃 후에도 이전 사용자의 카페 목록이 남아있음

`11b8359`(fix(auth): 로그아웃 시 카페 상태 초기화 추가). Jotai atom으로 관리하는 카페 목록이 로그아웃 시 초기화되지 않아서, 같은 브라우저에서 다른 계정으로 로그인하면 이전 사용자의 카페 목록이 잠깐 보이는 문제가 있었다. `resetCafesAtom`을 추가해서 로그아웃 액션에서 함께 호출하도록 했다 (`src/entities/store/cafe-atom.ts`).

## 알려진 제약사항

- `AGENTS.md`에 명시된 대로 `src/features/auto-comment/batch`는 사실상 shared 라이브러리 역할(28개 export, 5개 이상 모듈에서 참조)을 하면서도 feature 레이어에 위치해 FSD 레이어 규칙을 어기고 있다. `manual-post`, `viral`이 여기를 직접 참조하는 cross-feature import가 18곳 이상 있다.
- `shared/lib/account-manager.ts`(JSON 파일 기반)와 `shared/config/accounts.ts`(MongoDB 기반) 두 계정 소스가 공존한다. 신규 코드는 `shared/config/accounts.ts`를 써야 한다.
- `shared/lib/multi-session.ts`의 계정별 락은 promise 기반이라 완전한 원자적 락이 아니고, 동시 요청이 몰리면 이론적으로 경쟁 상태가 발생할 수 있다.
- `playwright.ts`는 deprecated 상태로 남아있다. `multi-session.ts`만 사용해야 한다.
- `src/widgets/`는 `page-layout` 하나만 있고 사실상 거의 비어있다.
- `next-auth` 의존성이 있지만 실제 인증은 쿠키 기반 커스텀 로직으로 처리한다.

## 라이선스

`private: true`로 설정된 비공개 프로젝트로, 별도 오픈소스 라이선스는 적용하지 않는다.
