# Scheduler service protocol

Viro persists new operations/actions with `executionTarget: 'scheduler'`, a 64-character lowercase hex `dispatchId`, and delivery state in the same document. Valid requests remain HTTP 202 while the execution server is offline. Legacy documents are never migrated or consumed by this protocol.

## Service authentication

Both servers configure `VIRO_SCHEDULER_SERVICE_SECRET` (at least 32 UTF-8 bytes). Viro also configures `VIRO_SCHEDULER_URL`. Never send a user token, password, owner ID, or service secret in the body or logs.

Every request sends `x-viro-timestamp` as Unix seconds and `x-viro-signature` as lowercase hex HMAC-SHA256 over the exact UTF-8 string:

```text
${timestamp}\n${METHOD}\n${pathname}\n${rawBody}
```

The timestamp must be within 60 seconds. Sign the exact serialized body sent over HTTP. Requests require HTTPS except explicit loopback development URLs. Redirects are forbidden. Request failures use fixed error codes without raw upstream errors.

## Dispatch and recovery

- Viro → scheduler `POST /viro/tasks`: `{kind:'operation'|'action', id, dispatchId}`. Scheduler responds HTTP 202 only after durable queue insertion. Queue identity is kind + id, with no account credentials or article contents in Redis.
- Scheduler → Viro `POST /api/agent/scheduler/outbox/recover`: `{limit?:number}` (1–100; default 50). Viro retries only new scheduler documents still pending delivery, and checks stale running leases. Returns delivery counts; no credentials. Scheduler calls this at startup and periodically.
- Scheduler → Viro `POST /api/agent/scheduler/worker`: `{workerId}`. Refreshes one global scheduler availability heartbeat. This is informational; accepting durable work does not depend on heartbeat.

## Exact-task endpoints

All paths below are `POST /api/agent/scheduler/tasks/{kind}/{id}/{verb}`. Operation IDs are 24 lowercase hex characters; action IDs are 64. A matching scheduler-target document and exact dispatch ID are mandatory. The database document supplies the owner; unknown owner fields are rejected.

| Verb | Body | Response |
|---|---|---|
| authorize | `{dispatchId}` | `{authorized:true, ownerScope}` |
| claim | `{dispatchId,workerId}` | `{claimed:null}` or `{claimed:{ownerScope,leaseId,operation,account,cafe}}` for operations, `{claimed:{ownerScope,leaseId,task}}` for actions |
| heartbeat | `{dispatchId,workerId,leaseId}` | `{ok:true}`; HTTP 409 if lease lost |
| result | `{dispatchId,workerId,leaseId,result}`; actions also require `uncertain:boolean` | `{ok:true}`; HTTP 409 on mismatched/lost lease or conflicting terminal report |
| abort | `{dispatchId,workerId,code:'preparation_failed'|'execution_uncertain'}` | `{ok:true}`; pending becomes failed, the same worker's running task becomes needs_review, terminal tasks stay unchanged |
| context | `{dispatchId,workerId,leaseId}` | `{accounts,cafes}` limited to the task owner's required resources |
| sync | `{dispatchId,workerId,leaseId,operation,payload}` | Existing sync response; operation/payload must fit the claimed action |
| prepare | `{dispatchId,workerId,leaseId,operation,payload}` | Existing preparation response; operation/payload must fit the claimed action |
| captcha | `{dispatchId,workerId,leaseId,payload:{image,question?,kind}}` | `{answer,kind}` after scheduler forwarding and a second active-lease check |
| captcha-authorize | `{dispatchId,workerId,leaseId,captchaKind}` | `{authorized:true,ownerScope}`; active lease and permitted CAPTCHA kind required |

`ownerScope` is lowercase SHA-256 of the database `userId`. `leaseId` is a random per-claim UUID. Authorize returns no credentials and does not claim work. Only `pending` documents can be claimed; neither duplicate dispatch nor worker restart can reexecute a running/completed/uncertain task. The 30-minute lease window is renewed by heartbeat. Expired work becomes `needs_review`, never pending. Context/sync/prepare/captcha/captcha-authorize require a current running lease.

Unknown routes/body fields fail closed. Authentication failure returns 401; invalid input 400; missing scheduler task/dispatch 404; lease conflict 409; transient backend failure 503. Responses use `Cache-Control: private, no-store`. Public user-token claim routes exclude scheduler documents.

Sync has a durable receipt in the same task document. Identical completed sync requests return the recorded response without applying effects again. An interrupted/inconclusive sync is never repeated automatically and marks the task `needs_review`. This covers publication counters/Sheet updates as well as other broker sync operations.

## CAPTCHA forwarding

The child sends CAPTCHA images only through its exact task's `captcha` endpoint. Viro validates the stored owner, dispatch, running lease and CAPTCHA kind before calling scheduler `POST /viro/captcha` with HMAC authentication and this strict body:

```json
{"task":{"kind":"operation","id":"24 lowercase hex characters","dispatchId":"64 lowercase hex characters"},"workerId":"scheduler worker ID","leaseId":"claim UUID","ownerScope":"SHA-256 of database userId","captcha":{"image":"canonical raw base64","question":"login challenge question","kind":"login"}}
```

Scheduler validates the request against Viro's `captcha-authorize` endpoint and checks the returned owner scope. The worker never supplies an owner ID. Viro checks the stored owner and active lease again after receiving the answer; lease loss returns HTTP 409 `lease_lost` and withholds the answer.

`kind` is exactly `login`, `cafe-join` or `cafe-create`. Login challenges are allowed for known browser operations/actions. Cafe-join challenges are limited to `join_cafe` operations and `cafe-join-all` actions; cafe-create challenges are limited to `cafe-create` actions. This authorization scope does not add solver calls to executors that do not already use one.

Images must be nonempty canonical raw base64, without a data-URL prefix, at most 1,398,104 encoded characters and 1,048,576 decoded bytes. An optional question must be a nonblank string of at most 2,000 characters; login challenges require it. Unknown request fields, owner injection and malformed payloads return HTTP 400. A disallowed task/CAPTCHA combination returns HTTP 403 `task_scope_denied`.

The response is exactly `{answer:string,kind}`. The kind must match the request; the answer is trimmed, nonblank, at most 1,000 original characters, and contains no ASCII control characters. Provider response bodies are bounded to 8 KiB. Viro forbids redirects, limits forwarding to 75 seconds, and configures the task route for 120 seconds; the embedded client allows 90 seconds for CAPTCHA requests. Other client task requests keep their existing timeout.

CAPTCHA infrastructure failures use only `captcha_service_authentication_required`, `captcha_service_unavailable` or `captcha_service_invalid_response` (HTTP 502 from the Viro forwarder). A strict recognized upstream code is preserved; arbitrary provider error text, service credentials and response bodies are never reflected. These failures stop the attempt. `captcha_required` remains the reason for an actual unsuccessful authentication challenge, distinct from a missing or unavailable solver service.

## Safe operation failure reasons

Operation results optionally include `errorCode`. The strict 14-value enum is `captcha_required`, `authentication_required`, `additional_authentication_required`, `login_failed`, `comment_permission_denied`, `article_unavailable`, `self_comment_forbidden`, `result_unverified`, `resource_not_found`, `preparation_failed`, `operation_failed`, `captcha_service_authentication_required`, `captcha_service_unavailable`, or `captcha_service_invalid_response`. The existing `error` field contains only fixed Korean text selected by this code; upstream text, credentials and nicknames are never reflected. Older clients may keep sending only `error`; known patterns are classified server-side, while unknown errors retain the generic failure message. Successful results remain compatible and cannot supply a failure code.

`requiresReview: true` always selects `result_unverified`, even if a nested error mentions login or CAPTCHA. This preserves the distinction between a failed preparation and a write whose result could not be verified. `authentication_required` also recognizes the embedded SDK's fixed message, without treating it as proof of an incorrect Naver password. Previously stored generic errors cannot reconstruct a discarded cause, and existing task statuses are not rewritten by this change.

## Safe action failure reasons

Action responses also accept optional `errorCode` from the same strict enum and optional boolean `requiresReview`. Both fields are validated in the response and retained nested results. Known top-level or nested failures select fixed Korean text; a generic outer error does not hide a specific nested cause. Unknown action failures keep the existing generic action message. Credentials, raw error strings and unknown fields are removed. Successful rows and aggregate counts remain available, while any retained failed row makes the overall response unsuccessful.

Any nested `requiresReview: true` or `result_unverified` reason takes precedence over authentication errors and propagates `requiresReview: true`. The fixed action verification message is `작업 결과를 확인하지 못했습니다. 재요청 전에 실제 결과를 확인해 주세요.` Repeated sanitization preserves the same codes, text, flags and nested result structure, so the desktop dispatcher, worker runner and service can apply this boundary without losing the reason.
