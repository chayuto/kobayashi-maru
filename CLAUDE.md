# Kobayashi Maru

Star Trek tower defense game: TypeScript, PixiJS 8, bitECS 0.4.0, Vite.

@AGENTS.md

## Commands

```bash
pnpm run dev         # Dev server at localhost:3000
pnpm run test        # Run all tests (Vitest, 2500+ tests)
pnpm run test -- <file>  # Run single test file (prefer this for speed)
pnpm run lint        # ESLint check
pnpm run build       # TypeScript check + Vite production build
pnpm run e2e         # Run E2E tests (Playwright, Chromium)
pnpm run e2e:headed  # Run E2E tests in visible browser
```

## Architecture

ECS (bitECS 0.4.0) data-oriented pattern. Systems are pure functions processing component arrays.

```
Game.ts (facade) → GameLoopManager → SystemManager → [14 ECS systems by priority]
                 → RenderManager   → PixiJS rendering pipeline
                 → GameplayManager → Wave/Score/Resource/Upgrade managers
                 → UIController    → HUD panels + overlays
```

Services registered in ServiceContainer (typed DI with lazy init).
Cross-system communication via EventBus (pub/sub), never direct references.

## Key Conventions

- TypeScript strict mode, zero `any` types
- Named exports only (no default exports)
- All game config in `src/config/` — no magic numbers in logic
- Entity creation via templates in `src/ecs/entityTemplates.ts`
- Interfaces for services in `src/types/interfaces/`
- Tests use Arrange-Act-Assert pattern with Vitest
- Package manager: pnpm (not npm)

## Common Gotchas

- Components are TypedArrays indexed by entity ID: `Position.x[eid]`, not objects
- bitECS 0.4.0 uses `World` type (not `IWorld`) and `query(world, [...components])`
- Systems run in priority order (see `src/core/Game.ts` registerSystems)
- PoolManager must be used for entity lifecycle (create/acquire/release)
- EventBus is singleton: `EventBus.getInstance()`
- Pixi objects managed only through RenderManager/spriteManager — never create directly in systems

## Validation

Before any commit: `pnpm run lint && pnpm run test && pnpm run build`
