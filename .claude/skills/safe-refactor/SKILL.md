---
name: safe-refactor
description: Safely refactor a module with full test coverage verification
user-invocable: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
argument-hint: "[module-path]"
---

Safely refactor the specified module or file ($ARGUMENTS). Follow this process:

## 1. Analyze
- Read the target file and all its imports/exports
- Find all callers using Grep
- Read existing tests for this module
- Document current behavior

## 2. Verify Baseline
- Run existing tests: `npm test -- $ARGUMENTS`
- Run full suite: `npm run test`
- Note current test count and pass rate

## 3. Refactor
- Make changes incrementally
- Each change must be isolated and reversible
- No breaking API changes unless explicitly requested

## 4. Verify
- Run tests after each change
- Ensure test count has not decreased
- Run `npm run lint && npm run test && npm run build`

## 5. Report
- Summarize what changed and why
- Show before/after metrics (file size, test count)
- Generate report at `docs/change_notes/` if changes were made
