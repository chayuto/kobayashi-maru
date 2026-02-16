---
name: verify
description: Run full verification suite (lint, test, build) and report results
user-invocable: true
allowed-tools: Bash, Read
---

Run the full project verification pipeline and report results clearly:

1. Run `pnpm run lint` — report pass/fail and any errors
2. Run `pnpm run test` — report total tests, pass/fail count
3. Run `pnpm run build` — report pass/fail and any TypeScript errors
4. If changes touch `src/ui/`, `src/rendering/`, `e2e/`, or `src/testing/`: also run `pnpm run e2e` — report total E2E tests, pass/fail count

Summarize results in a table:

| Check | Status | Details |
|-------|--------|---------|
| Lint  | ...    | ...     |
| Tests | ...    | ...     |
| Build | ...    | ...     |
| E2E   | ...    | ...     |

If any check fails, analyze the errors and suggest fixes.

Notes:
- E2E tests require a dev server (Playwright starts it automatically via `webServer` config)
- Visual baseline mismatches: run `pnpm run e2e:update` to regenerate, then verify with `pnpm run e2e`
- E2E failures on CI are non-blocking (`continue-on-error: true` in CI workflow)
