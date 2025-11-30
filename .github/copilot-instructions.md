# Copilot Instructions for Kobayashi Maru

## Repository Overview

**Kobayashi Maru** is a Star Trek-themed endless tower defense game built with TypeScript, PixiJS 8, and bitECS. The player defends the civilian freighter Kobayashi Maru against infinite enemy waves by placing turrets.

- **Language**: TypeScript (strict mode)
- **Renderer**: PixiJS 8 (WebGPU preferred, WebGL fallback)
- **ECS**: bitECS for entity-component-system architecture (5,000+ entity capacity)
- **Build Tool**: Vite 7
- **Testing**: Vitest
- **Linting**: ESLint 9 with typescript-eslint
- **Node Version**: 20 (as used in CI)

## Build and Validation Commands

**Always run commands in this order for validation:**

```bash
npm ci              # Install dependencies (use ci, not install, for clean installs)
npm run lint        # Run ESLint - must pass before committing
npm run test        # Run Vitest tests - must pass before committing
npm run build       # TypeScript compilation + Vite production build
```

**Development:**
```bash
npm run dev         # Start Vite dev server at http://localhost:3000
npm run test:watch  # Run tests in watch mode
```

**Important:**
- Always run `npm ci` before any other commands after cloning
- The `build` command runs `tsc && vite build` - TypeScript must compile cleanly first
- All tests must pass before committing (tests located in `src/__tests__/`)
- Lint and test run in CI on every PR to `main`

## Project Structure

```
/                           # Repository root
├── src/                    # Source code
│   ├── main.ts            # Entry point - initializes Game class
│   ├── core/              # Game.ts (main loop), DebugManager, PerformanceMonitor
│   ├── ecs/               # ECS: components.ts, entityFactory.ts, entityPool.ts, world.ts
│   ├── systems/           # ECS systems: ai, combat, collision, damage, movement, projectile, targeting, render
│   ├── rendering/         # PixiJS: SpriteManager, BeamRenderer, ParticleSystem, effects
│   ├── audio/             # AudioManager, SoundGenerator (Web Audio API)
│   ├── ui/                # HUD, GameOverScreen, TurretMenu, HealthBar
│   ├── game/              # GameState, WaveManager, ScoreManager, ResourceManager, PlacementManager
│   ├── collision/         # SpatialHash for efficient collision detection
│   ├── pathfinding/       # Flow field pathfinding (costField, flowField, grid)
│   ├── types/             # constants.ts (GAME_CONFIG, FACTION_COLORS, TURRET_CONFIG, etc.)
│   ├── services/          # StorageService (localStorage)
│   ├── utils/             # BinaryHeap utility
│   └── __tests__/         # All test files
├── .github/workflows/     # CI (ci.yml) and GitHub Pages deploy (deploy-pages.yml)
├── docs/                  # Planning docs and change notes (not essential for coding)
├── index.html             # Entry HTML - loads /src/main.ts
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config (strict, ES2020, ESNext modules)
├── vite.config.ts         # Vite config (WebGPU preference, port 3000)
└── eslint.config.js       # ESLint flat config with typescript-eslint
```

## Key Architecture Patterns

**ECS (Entity-Component-System):**
- Components defined in `src/ecs/components.ts` using bitECS
- Entity factory in `src/ecs/entityFactory.ts` creates enemies, turrets, projectiles
- Systems process entities each frame in `src/systems/`

**System Execution Order** (defined in `src/core/Game.ts`):
1. collision (priority 10)
2. ai (priority 20)
3. movement (priority 30)
4. targeting (priority 40)
5. combat (priority 50)
6. projectile (priority 60)
7. damage (priority 70)

**Adding New Features:**
- New components: add to `src/ecs/components.ts`
- New systems: create in `src/systems/`, register in `Game.ts`
- New UI: add to `src/ui/`, initialize in `Game.ts`
- New game config: update `src/types/constants.ts`

## CI/CD Workflows

**CI (`.github/workflows/ci.yml`)** - Runs on PRs and pushes to main:
1. Checkout
2. Setup Node.js 20
3. `npm ci`
4. `npm run lint`
5. `npm run test`
6. `npm run build`

**Deploy Pages (`.github/workflows/deploy-pages.yml`)** - Deploys to GitHub Pages on main push.

## Testing Guidelines

Tests are in `src/__tests__/` using Vitest with jsdom environment.

**Test patterns:**
- Mock bitECS world with `createWorld()` for ECS tests
- Use `beforeEach` to reset world state
- Mock DOM/Canvas for rendering tests
- Test files follow `*.test.ts` naming

**Key test files:**
- `ecs.test.ts` - Component and entity tests
- `*System.test.ts` - Individual system tests
- `gameState.test.ts` - State machine tests
- `waveSpawner.test.ts` - Wave system tests

## Important Configuration Values

From `src/types/constants.ts`:
- `GAME_CONFIG.WORLD_WIDTH/HEIGHT`: 1920x1080
- `GAME_CONFIG.COLLISION_CELL_SIZE`: 64px
- `GAME_CONFIG.INITIAL_RESOURCES`: 500
- `GAME_CONFIG.RESOURCE_REWARD`: 10 (per enemy kill)

## Trust These Instructions

These instructions have been validated by running all commands successfully. Only search the codebase if:
1. Instructions appear incomplete for your specific task
2. A command fails unexpectedly
3. You need implementation details not covered here
