# Agent Instructions

- **Always run lint and tests before finishing a task.**
- Ensure all code changes are verified with `pnpm run lint` and `pnpm run test`.
- If tests fail, fix them before notifying the user.
- Package manager is **pnpm** — never use `npm` commands.
- Validation command: `pnpm run lint && pnpm run test && pnpm run build`

## Key Conventions
- TypeScript strict mode, zero `any` types
- Named exports only (no default exports)
- bitECS 0.4.0: use `World` type (not `IWorld`), `query(world, [...components])` pattern
- Components are TypedArrays: `Position.x[eid]`, not objects
- Use PoolManager for entity lifecycle, never raw `addEntity`/`removeEntity`
- EventBus singleton for cross-system communication
- All config values in `src/config/` — no magic numbers in logic

## Docs
- Keep it professional, no emojis
- After task put new doc in docs/change_notes/ with name YYYYMMDD_<task_name>.md
- Planning docs in docs/planning/ For instruction, please consider Agent as coder. 