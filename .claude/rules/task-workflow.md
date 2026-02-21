# Task Workflow

- Before starting: deep read relevant source files, understand existing patterns
- All changes must be safe, self-contained, and reversible
- All changed lines must be covered by tests
- Before completing: `pnpm run lint && pnpm run test && pnpm run build` must all pass
- For UI changes: also run `pnpm run e2e` to verify no visual regressions
- Generate completion report in `docs/change_notes/YYYYMMDD_<description>.md`
