# Kobayashi Maru

Star Trek tower defense game: TypeScript, PixiJS 8, bitECS, Vite.

@AGENTS.md

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run test         # Run all tests (Vitest)
npm test -- <file>   # Run single test file (prefer this for speed)
npm run lint         # ESLint check
npm run build        # TypeScript check + Vite production build
pnpm run e2e         # Run E2E tests (Playwright, Chromium)
pnpm run e2e:headed  # Run E2E tests in visible browser
```

## Architecture

ECS (bitECS) data-oriented pattern. Systems are pure functions processing component arrays.

```
Game.ts (facade) → GameLoopManager → SystemManager → [16 ECS systems by priority]
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

## Common Gotchas

- Components are TypedArrays indexed by entity ID: `Position.x[eid]`, not objects
- Systems run in priority order (see `src/core/Game.ts` registerSystems)
- PoolManager must be used for entity lifecycle (create/acquire/release)
- EventBus is singleton: `EventBus.getInstance()`
- Pixi objects managed only through RenderManager/spriteManager — never create directly in systems

## Validation

Before any commit: `npm run lint && npm run test && npm run build`
