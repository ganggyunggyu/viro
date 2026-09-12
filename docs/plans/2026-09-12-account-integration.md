# Viro linked credential retirement

Keep Dabut as the identity authority and retain each existing Viro `userId` as the owner of accounts, cafes and work. Do not delete member rows or move operational data. Production database execution is outside this change.

1. `dabut-auth/store.ts`, `link.ts` and retirement tests: after verified linking, remove the local password, set `authProvider: 'dabut'`, and revoke independent local sessions. Repeated connection retries must finish retirement without changing the owner ID or central sessions.
2. `dabut-auth/retirement.ts`, `retirement-store.ts`, `scripts/retire-linked-viro-credentials*.ts`: plan by an explicit pair of owner and central member IDs. Default to read-only; require `--apply` for mutation. Reject absent, mismatched or ambiguous mappings. Read and write only `users` and `agenttokens`.

```ts
type RetirementSelector = { userId: string; dabutUserId: string };
type RetirementOptions = RetirementSelector & { apply: boolean };
```

3. Settings server actions: authenticate before DB or provider access; scope account API keys by current owner and active account. Global queue setting reads and mutations require the centrally verified `viro` admin role. Preserve global worker configuration semantics.
4. Verify missing/revoked sessions, cross-owner mutation attempts, common member versus admin access, credential-safe responses, successful/repeated retirement, mapping mismatch and default dry-run. Run focused tests, strict changed-file lint, harness/tooling suites and production build. Commit only these files.

Deployment source: production alias `cafe-bot-two.vercel.app` currently resolves to `dpl_7XNGsTpZPcyrTdwsQ9fWeomhGJBY`; common-auth baseline is `718041d8`. Deployment readiness is separate from source/test results.

## Verification

- Initial targeted checks reproduced six credential-retirement and authorization failures. Additional checks reproduced empty provider response success and the concurrent-link retirement gap before correction.
- Final `npm run verify:ci`: strict lint passed; 488 harness tests and seven tooling tests passed; production build including TypeScript passed.
- Migration scripts separately passed strict TypeScript checks. CLI failure tests do not connect to a database; synthetic migration fixtures verify dry-run, explicit apply, repeated apply, mapping conflicts and preservation of common sessions and operational collections.
- Worktree-local dependencies were installed with `npm ci` after Turbopack rejected an external `node_modules` symlink. No product workaround was introduced.
- No production database migration or deployment was executed. A real dry-run awaits an explicit owner/central member pair.
