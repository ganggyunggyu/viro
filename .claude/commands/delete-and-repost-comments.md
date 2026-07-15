# 댓글 전체 삭제 후 재작성

카페 글의 기존 댓글을 전부 지우고 새 댓글로 다시 채우는 스킬입니다.

## 핵심 원칙: 로직을 직접 호출한다 (스크립트를 새로 짜지 않는다)

이 작업은 **Playwright 스크립트를 즉석에서 짜지 않는다.** 이미 `manual-comment-job` 잡큐 + pm2 워커(`manual-comment-worker`)에 삭제 로직이 내장되어 있으므로, 이 스킬은 그 로직을 호출하는 잡을 큐에 등록하기만 하면 된다.

- 삭제/작성 실행 로직: `src/shared/lib/naver-cafe-writing/comment-deleter.ts`(`listLiveComments`, `deleteCommentWithAccount`), `comment-writer.ts`(`writeCommentWithAccount`)
- 오케스트레이션: `scripts/run-manual-comment-worker.ts`의 `deleteExistingComments()` → `processJob()`
- 잡 생성 진입점: `src/features/manual-comment-job/actions.ts`의 `createManualCommentJobForUser(userId, input)`
- 웹 UI: `/comment-jobs` 페이지의 "기존 댓글 전체 삭제 후 재작성" 토글 (같은 로직을 호출함 — 사용자가 직접 써도 됨)

## 작업 흐름

### 1단계: 입력 확인

- **글 URL**: `cafe.naver.com/...` 또는 `naver.me/...` 단축링크 모두 지원 (`parseCafeArticleUrl`이 자동 해석).
- **새 댓글 내용**: 사용자가 번호매긴 텍스트를 통째로 붙여넣는 경우가 많음 ("1.", "1)", "1번" 형식 전부 인식). 없으면(그냥 "다시 달아"만 요청) 기존 댓글 내용을 그대로 재사용.
- **딜레이**: 기본 30초~3분(0.5~3분).

### 2단계: 잡 등록

직접 스크립트를 짜지 말고 아래처럼 `createManualCommentJobForUser`를 호출한다 (단발성 실행 스크립트에서 임포트해서 호출하거나, 이미 앱이 떠있다면 웹 UI 사용):

```ts
import { createManualCommentJobForUser } from '@/features/manual-comment-job/actions';

await createManualCommentJobForUser('user-1768955529317', {
  articleUrl: 'https://naver.me/xxxxx',
  mode: 'fixed',
  fixedComments: ['댓글1', '댓글2', '...'],
  deleteExisting: true,
  delayMinMinutes: 0.5,
  delayMaxMinutes: 3,
});
```

userId는 실제 계정/카페가 귀속된 값(`user-1768955529317`)을 사용한다 — 코드 기본값(`default-user`)이 아님. 헷갈리면 기존 `ManualCommentJob`/`Account`/`Cafe` 문서에서 실제 쓰이는 userId를 먼저 확인한다.

### 3단계: 처리 확인

- pm2로 `manual-comment-worker`가 이미 상시 실행 중인지 확인 (`pm2 list`).
- 잡은 20초 폴링으로 자동 처리됨. 상태는 `ManualCommentJob.status`(pending→running→done/failed), 진행 상세는 `job.deleteResults`(삭제 결과)와 `job.results`(작성 결과)로 확인.
- **개별 계정 실패(캡차 로그인 실패 등)는 잡 전체를 막지 않는다** — 그 댓글만 원본이 남고 나머지는 정상 처리됨. 실패한 항목만 `deleteResults`/`results`의 `error` 필드로 남는다.

### 4단계: 결과 보고

- 삭제 성공/실패 건수, 작성 성공/실패 건수를 `deleteResults`/`results` 배열 기준으로 정확히 집계해서 보고한다.
- 라이브 상태를 신뢰의 기준으로 삼는다 — DB `commentCount`만 보고 끝내지 말고, 필요하면 `listLiveComments()`로 직접 재확인한다.

## 주의사항

- **절대 페이지 전체에서 "삭제" 텍스트를 찾는 방식을 쓰지 않는다** — 댓글 삭제 드롭다운(`.LayerMore`)은 반드시 해당 `.CommentItem` 요소 내부로 스코프해서 찾는다. 과거 이 원칙을 어겨 무관한 글이 삭제된 것으로 추정되는 사고가 있었음.
- pm2 워커는 코드를 변경해도 프로세스를 재시작하기 전까지 새 로직을 반영하지 않는다 — 삭제 로직을 수정했다면 재시작 필요 여부를 확인할 것. 단, 재시작 시점에 다른 잡이 진행 중이면(특히 `mode:fixed`) 재시작 후 해당 잡이 처음부터 다시 시도되며 이미 성공한 인덱스의 댓글이 중복 게시될 수 있으니, 진행 중인 잡이 없을 때 재시작한다.
