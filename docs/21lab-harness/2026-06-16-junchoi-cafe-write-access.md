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
- [ ] Add stdin-based verification harness.
- [ ] Run sequential login and write-editor checks for both cafes.
- [ ] Review the sanitized report for secret leakage.
- [ ] Report accounts with editor access.

## Verification
- Run the script with `.env.local` loaded and account rows passed through stdin.
- Expected result: every valid account row receives one status per target cafe, with no password in stdout or report.
