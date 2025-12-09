# AI Agent Workflow
**Date:** 2024-05-22
**Status:** Active

## Overview

These guidelines are specifically for AI Coding Agents working on this repository. Follow these steps to ensure high-quality contributions.

## Workflow

### 1. Exploration
- **Start here**: Read `README.md` and `docs/internal/001_architecture_guidelines.md`.
- **Search**: Use `grep` or file listing tools to find relevant files. Do not guess file paths.
- **Context**: Check `.agent/rules.md` (if present) for project-specific constraints.

### 2. Planning
- **Plan First**: Always create a plan using the `set_plan` tool.
- **Break it down**: Divide complex tasks into smaller, verifiable steps.
- **Verify**: Include verification steps (tests, manual checks) in your plan.

### 3. Implementation
- **Edit Source**: Modify files in `src/`. Do NOT modify `dist/` or other artifacts.
- **One Change at a Time**: Keep changes focused.
- **Maintain Style**: Follow the existing code style (indentation, naming conventions).

### 4. Verification
- **Run Tests**: `npm test` is your best friend. Run it after every significant change.
- **Fix Regressions**: If you break a test, fix it immediately.
- **Lint**: Run `npm run lint` before finishing.

### 5. Documentation
- **Update Docs**: If you change behavior, update the relevant `docs/internal/` file or `README.md`.
- **Change Notes**: Create a new file in `docs/change_notes/YYYYMMDD_task_name.md` describing your changes.

## Common Tasks

### "Fix a Bug"
1. Reproduce the bug with a failing test case (if possible).
2. Analyze the code to find the root cause.
3. Fix the code.
4. Verify the test passes.

### "Add a Feature"
1. Design the feature: What components? What systems?
2. Create data structures (Components).
3. Implement logic (Systems).
4. Integrate into `Game.ts`.
5. Add tests.

### "Refactor"
1. Ensure current tests pass.
2. Make changes.
3. Ensure tests still pass.

## Do's and Don'ts

- **DO** read existing code to understand patterns.
- **DO** ask the user for clarification if the task is ambiguous.
- **DON'T** delete large chunks of code without understanding them.
- **DON'T** ignore linter errors.
