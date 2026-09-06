# Ply / Viro agent API

The authenticated management API uses the existing Viro bearer token. Ownership always comes from that token; request bodies cannot select a user. Existing `/api/agent/accounts` and `/context` worker credential contracts remain unchanged. A model client must never expose those worker endpoints.

| Method and path | Input / response |
| --- | --- |
| GET `/api/agent/capabilities` | `{ version: "1", capabilities, execution: { workerRequired: true, operationWorkerOnline } }` |
| GET `/api/agent/naver-accounts` | `{ accounts: [{ accountId, nickname?, role?, isActive, hasPassword }], count }` |
| POST `/api/agent/naver-accounts` | `{ accountId, password, nickname?, role?: "writer" \| "commenter" }` → 201 `{ success: true, account }` |
| GET `/api/agent/cafes` | Existing `{ cafes, count }` metadata response |
| POST `/api/agent/cafes` | `{ cafeId, cafeUrl, name, menuId }` → 201 `{ success: true, cafe }` |
| POST `/api/agent/operations` | `{ type: "join_cafe", accountId, cafeId, nickname? }` or `{ type: "write_comment", accountId, cafeId, articleId, content }` → 202 `{ success: true, operation, replayed }` |
| GET `/api/agent/operations?limit=50` | `{ operations, count }`; limit 1–100 |
| GET `/api/agent/operations/{operationId}` | `{ operation }` |

An operation requires an `Idempotency-Key` header (1–128 letters, digits, `.`, `_`, `-`). Reusing the same key and normalized body returns the original operation; changing the body returns 409. The deterministic Mongo `_id` protects concurrent retries without an optional secondary index. Account and cafe registration returns 409 for existing records and never overwrites credentials or settings.

`cafeId` and `menuId` accept numeric strings or safe integer numbers and return strings. `cafeUrl` accepts a slug or `https://cafe.naver.com/{slug}` and returns a slug. Comments allow 1–3000 characters. A cafe registration adds an existing cafe to Viro; joining uses an existing registered Naver account. Neither endpoint creates a Naver account or creates a new cafe.

Ply must read a saved account password in its trusted main process and send it directly to Viro. Passwords must never appear in model arguments, transcript, returned account metadata, errors, or logs. The metadata API also excludes account API keys and private configuration. Registration responses read the saved owner-scoped record back from Mongo.

## Worker execution and results

Run the updated Viro desktop worker or `npm run agent` against the updated API. It uses the existing local browser session, account lock, cafe membership helper and comment writer. Fresh accounts log in under the lock before comment navigation. The strict comment flow reads the actual cafe nickname from the logged-in comment composer, ignoring arbitrary account labels; missing composer identity fails before submitting. Login and join captcha requests delegate through the existing `/api/agent/captcha` broker with execution-scoped injection; scheduler secrets remain on the server. A comment request does not join a cafe implicitly; submit a join operation first if necessary. Queuing a job is not proof of publication.

Worker-only POST endpoints are `/api/agent/operations/claim` (`workerId`), `/heartbeat` (`workerId`, optional `operationId`) and `/result` (`workerId`, `operationId`, `result`). Claim returns `{ claimed: { operation, account, cafe } | null }`; only this worker response contains the account credential. Claims, heartbeats and results are scoped by user and token plus worker ID. Heartbeat and result return `{ ok }`.

`operationWorkerOnline` comes only from the `agent-operations` worker heartbeat, never from management reads or ordinary token activity. It expires after two minutes. Workers poll operations and legacy comment jobs in the existing execution loop.

Operation states: `pending`, `running`, `done`, `failed`, `needs_review`. A result includes `success`, optional `commentId`, `membershipStatus` (`joined`, `alreadyMember`, `pending`, `failed`) or `error`. A successful comment requires a new numeric comment ID, full content match and exact own nickname. Blank/error cafe pages cannot prove membership; member-only activity information is required. Approval-based cafes return `membershipStatus: pending` for a submitted application, not completed membership. Ambiguous post-submit verification sets `requiresReview: true` and `needs_review`. A worker disconnected for 30 minutes becomes `needs_review` on subsequent operation queries or claims. These operations are never automatically retried because a comment may already have been published before the connection failed. Inspect the real cafe before making a new request with a new key. An eventual report by the original worker can resolve `needs_review`.

Errors use `{ error, code }`: 400 invalid request, 401 authentication, 404 missing owned resource, 409 registration/key conflict, 413 oversized body, 503 backend unavailable. Raw database errors are not returned.

## Local checks

`npx tsx --test src/shared/lib/agent-management/*.test.ts agent/lib/operation-runner.test.ts`

Tests cover validation, credential redaction, ownership in idempotency, concurrent retries, authentication, claim ownership before execution, and avoiding duplicate writes after report failure. Live registration, cafe joining and comment posting require a separate authorized run; local tests make no real Naver writes.
