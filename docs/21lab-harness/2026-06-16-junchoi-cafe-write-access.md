# 2026-06-16 Junchoi Cafe Write Access

## Purpose
- Check whether the 준최 블로그 리스트 accounts can open the write editor in 샤넬오픈런 and 쇼핑지름신.

## Outputs
- Sanitized execution report under `reports/`.
- Final account list that can write per target cafe.

## Constraints
- Do not publish, save drafts, submit forms, delete data, or change production settings.
- Treat passwords and session cookies as secrets. Do not write them to docs, reports, or final messages.
- Use the spreadsheet range `21lab 블로그 계정LIST!B34:H78` as the account source.

## Plan
- [x] Confirm spreadsheet tab and target range.
- [x] Review existing cafe login/editor verification scripts.
- [x] Add stdin-based verification harness.
- [x] Run sequential login and write-editor checks for both cafes.
- [x] Review the sanitized report for secret leakage.
- [x] Report accounts with editor access.

## Verification
- Run the script with `.env.local` loaded and account rows passed through stdin.
- Expected result: every valid account row receives one status per target cafe, with no password in stdout or report.
- Final report: `reports/junchoi-cafe-write-access-2026-06-16T01-55-33-855Z.json`.
- Result: 39 unique accounts checked, 0 editor-ok checks, 11 accounts failed login verification, 28 accounts logged in but had no write button for both target cafes.
