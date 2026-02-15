---
name: verify
description: Run full verification suite (lint, test, build) and report results
user-invocable: true
allowed-tools: Bash, Read
---

Run the full project verification pipeline and report results clearly:

1. Run `npm run lint` — report pass/fail and any errors
2. Run `npm run test` — report total tests, pass/fail count
3. Run `npm run build` — report pass/fail and any TypeScript errors

Summarize results in a table:

| Check | Status | Details |
|-------|--------|---------|
| Lint  | ...    | ...     |
| Tests | ...    | ...     |
| Build | ...    | ...     |

If any check fails, analyze the errors and suggest fixes.
