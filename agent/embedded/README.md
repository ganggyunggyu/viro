# Viro embedded worker

Run this package only inside Ply's dedicated child process, with an owner-specific working directory and umask 077. Send `brokerUrl`, `token`, `workerId`, `browsersPath`, and `pollIntervalMs` by IPC. Never pass credentials in arguments, environment variables or files.

`createEmbeddedWorker(config, { onProgress? })` returns `prepare()`, `execute(kind, id)`, and `close()`.

- `prepare()` verifies `/api/agent/embedded`, installs/verifies Chromium, then starts both worker heartbeats. It never claims queued work.
- `execute('operation' | 'action', id)` claims only the named pending record, checks/renews its lease, executes the existing Viro implementation and reports its outcome. The caller must read the broker record for the final domain result. A failed report never retries the browser write.
- `close()` stops heartbeats, invalidates execution ownership, closes browsers and waits for active work. The caller may terminate an unresponsive child.

Safe error codes: `server_update_required`, `authentication_required`, `browser_prepare_failed`, `broker_unavailable`, `execution_uncertain`. Progress messages are fixed Korean text. Bundled legacy console calls are removed.

The only external runtime dependency is the pinned rebrowser Playwright npm alias. Browser paths and sessions belong to the child process. No dotenv, MongoDB, Redis, provider key or local repository path is needed. The embedded build omits browser-side local `DailyActivity` counters; durable operation/action results and publication sync remain broker-owned.

Build from Viro: `npm run agent:embedded:build`. The tarball is generated under `agent/embedded/out/` and can be installed by Ply using a `file:vendor/...tgz` dependency. No install hook downloads Chromium; `prepare()` does so on first use.
