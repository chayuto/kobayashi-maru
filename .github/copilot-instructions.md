# Copilot Instructions for Kobayashi Maru

## Repository Overview

**Kobayashi Maru** is a Star Trek-themed endless tower defense game built with TypeScript, PixiJS 8, and bitECS. The player defends the civilian freighter Kobayashi Maru against infinite enemy waves by placing and upgrading turrets.

- **Language**: TypeScript (strict mode)
- **Renderer**: PixiJS 8 (WebGPU preferred, WebGL fallback)
- **ECS**: bitECS 0.4.0 for entity-component-system architecture
- **Build Tool**: Vite 7
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint 9 with typescript-eslint
- **Package Manager**: pnpm (CI uses pnpm 10)
- **Node Version**: 20 (as used in CI)

## Build and Validation Commands

**Always run commands in this order for validation:**

```bash
pnpm install                # Install dependencies
pnpm run lint               # Run ESLint - must pass before committing
pnpm run test               # Run Vitest tests - must pass before committing
pnpm run build              # TypeScript compilation + Vite production build
```

**Development:**
```bash
pnpm run dev                # Start Vite dev server at http://localhost:3000
pnpm run test:watch         # Run tests in watch mode
pnpm run e2e                # Run Playwright E2E tests (headless Chromium)
pnpm run e2e:headed         # Run E2E tests in visible browser
```

**Important:**
- The project uses **pnpm** — always use `pnpm` commands, not `npm`
- The `build` command runs `tsc && vite build` - TypeScript must compile cleanly first
- All tests must pass before committing (113+ test files in `src/__tests__/`, 2500+ tests)
- Lint and test run in CI on every PR to `main`
- E2E tests are non-blocking in CI (`continue-on-error: true`)

## Project Structure

```
/                           # Repository root
├── src/                    # Source code
│   ├── main.ts            # Entry point - initializes Game class
│   ├── core/              # Game.ts (facade), managers, loop, services
│   │   ├── managers/      # GameplayManager, RenderManager, UIController, InputRouter
│   │   ├── loop/          # GameLoopManager
│   │   ├── bootstrap/     # GameBootstrap (initialization sequence)
│   │   └── services/      # ServiceContainer (typed DI with lazy init)
│   ├── ecs/               # ECS: components.ts, entityFactory.ts, PoolManager.ts, world.ts
│   ├── systems/           # 15 ECS systems + SystemManager (ai, combat, ability, targeting, etc.)
│   ├── ai/                # AI autoplay: ThreatAnalyzer, ActionPlanner, spatial maps, behaviors
│   ├── rendering/         # PixiJS: SpriteManager, BeamRenderer, ParticleSystem
│   │   ├── textures/      # Texture generation (faction, turret, utils)
│   │   ├── particles/     # Particle effects
│   │   └── filters/       # Post-processing filters (bloom/glow)
│   ├── audio/             # AudioManager, MusicManager, SoundGenerator (Web Audio API)
│   ├── ui/                # HUD, panels, overlays, menus
│   │   ├── panels/        # ResourcePanel, WavePanel, ComboPanel, AIPanel, etc.
│   │   ├── overlays/      # AlertStatus, Tutorial, WaveAnnouncement
│   │   ├── screens/       # MainMenu
│   │   ├── components/    # Button, IconButton, ToggleButton
│   │   ├── base/          # UIComponent base class
│   │   ├── animation/     # UIAnimator
│   │   ├── layout/        # Layout utilities
│   │   └── managers/      # HUDPanelManager
│   ├── game/              # WaveManager, ScoreManager, UpgradeManager, AchievementManager
│   │   └── wave/          # Wave spawning sub-modules
│   ├── config/            # Centralized configuration files
│   ├── collision/         # SpatialHash for efficient collision detection
│   ├── pathfinding/       # Pathfinding algorithms
│   ├── services/          # DamageService, EntityPoolService, StorageService
│   ├── testing/           # E2E test bridge (e2eTestBridge.ts)
│   ├── utils/             # BinaryHeap and other utilities
│   ├── types/             # Constants, events, type definitions
│   │   ├── config/        # Modular type configs (turrets.ts, enemies.ts, factions.ts)
│   │   └── interfaces/    # Service interfaces (IWaveManager, IGameState, etc.)
│   └── __tests__/         # 113+ test files (Vitest)
├── e2e/                   # Playwright E2E tests
│   ├── tests/             # E2E test specs
│   ├── fixtures/          # Custom game fixture helpers
│   └── helpers/           # Game bridge type definitions
├── .github/workflows/     # CI (ci.yml) and GitHub Pages deploy (deploy-pages.yml)
├── docs/                  # Planning docs and change notes
├── index.html             # Entry HTML - loads /src/main.ts
├── package.json           # Dependencies and scripts
├── pnpm-lock.yaml         # pnpm lockfile
├── tsconfig.json          # TypeScript config (strict, ES2020, ESNext modules)
├── vite.config.ts         # Vite config (port 3000, WebGPU preference)
└── eslint.config.js       # ESLint flat config with typescript-eslint
```

## Key Architecture Patterns

### ECS (Entity-Component-System)

- Components defined in `src/ecs/components.ts` using bitECS 0.4.0 TypedArrays
- Components are accessed by entity ID: `Position.x[eid]`, not as objects
- Entity factory in `src/ecs/entityFactory.ts` creates enemies, turrets, projectiles
- Entity templates in `src/ecs/entityTemplates.ts` for configuration-driven creation
- Generic factory in `src/ecs/genericFactory.ts` for template-based entity creation
- PoolManager in `src/ecs/PoolManager.ts` for entity lifecycle (create/acquire/release)
- Systems process entities each frame in `src/systems/`
- World type: `import { World } from 'bitecs'` (bitECS 0.4.0 uses `World`, not `IWorld`)

### Manager Pattern

The game uses a manager pattern to separate concerns:
- **GameplayManager**: Game logic, waves, scoring, game flow
- **RenderManager**: All rendering coordination
- **UIController**: UI state and interactions
- **InputRouter**: Input handling and action dispatch
- **WaveManager**: Wave spawning and progression
- **UpgradeManager**: Turret upgrades and selling

### Event Bus

Decoupled communication via `EventBus` singleton:
- Events defined in `src/types/events.ts`
- Components subscribe/emit without direct dependencies
- Key events: ENEMY_KILLED, WAVE_STARTED, WAVE_COMPLETED, COMBO_UPDATED

### Centralized Configuration

All magic numbers in `src/config/`:
- `combat.config.ts` - Beam settings, DPS calculations
- `combat.damageTypes.ts` - Damage type resistances
- `wave.config.ts` - Spawn timing, wave delays
- `ui.config.ts` - UI dimensions, colors
- `rendering.config.ts` - Visual settings
- `performance.config.ts` - Performance thresholds
- `ai.config.ts` - AI autoplay parameters
- `audio.config.ts` - Sound settings
- `ability.config.ts` - Ability cooldowns
- `score.config.ts` - Scoring multipliers
- `quality.config.ts` - Graphics quality levels

### System Execution Order

Defined in `src/core/Game.ts` via SystemManager (lower priority = runs first):

| Priority | System | Purpose |
|----------|--------|---------|
| 10 | collision | Spatial hash updates |
| 20 | ai | AI behavior decisions |
| 25 | ability | Special abilities |
| 30 | movement | Position updates |
| 31 | turret-rotation | Turret aiming |
| 32 | enemy-rotation | Enemy facing |
| 35 | status-effects | Buff/debuff processing |
| 38 | enemy-collision | Enemy-to-target collision |
| 40 | targeting | Target acquisition |
| 50 | combat | Turret firing |
| 55 | enemy-combat | Enemy firing |
| 60 | projectile | Projectile movement |
| 62 | enemy-projectile | Enemy projectile movement |
| 70 | damage | Health/shield processing |

Note: The render system is managed separately by RenderManager, not in this priority list.

## Adding New Features

**New turret type:**
1. Add to `TurretType` object in `src/types/config/turrets.ts`
2. Add config to `TURRET_CONFIG` with stats
3. Add texture functions in `src/rendering/textures/turretTextures.ts`
4. Update `SpriteType` in `src/types/config/factions.ts`
5. Update `spriteManager.ts` to handle new sprite types
6. Add special upgrade config in `TURRET_SPECIAL_UPGRADES`

**New enemy faction:**
1. Add to `FactionId` object in `src/types/config/factions.ts`
2. Add color to `FACTION_COLORS`
3. Add template in `src/ecs/entityTemplates.ts`
4. Create texture function in `src/rendering/textures/factionTextures.ts`

**New ability:**
1. Add to `AbilityType` object in `src/types/config/enemies.ts`
2. Add config to `ABILITY_CONFIG`
3. Implement processor in `src/systems/abilitySystem.ts`

**New UI panel:**
1. Create in `src/ui/panels/`
2. Add to HUDManager initialization
3. Connect to EventBus for updates

**New ECS system:**
1. Create system in `src/systems/newSystem.ts`
2. System signature: `(world: World, delta: number) => World`
3. Register in `Game.ts` `registerSystems()`: `systemManager.register('name', system, priority)`

## CI/CD Workflows

**CI (`.github/workflows/ci.yml`)** - Runs on PRs and pushes to main:
1. Checkout
2. Install pnpm 10
3. Setup Node.js 20 (with pnpm cache)
4. `pnpm install --frozen-lockfile`
5. `pnpm run lint`
6. `pnpm run test`
7. `pnpm run build`

A separate **e2e-tests** job runs Playwright E2E tests (non-blocking, `continue-on-error: true`).

**Deploy Pages (`.github/workflows/deploy-pages.yml`)** - Deploys to GitHub Pages on main push.

## Testing Guidelines

Tests are in `src/__tests__/` using Vitest with jsdom environment.

**Test patterns:**
- Mock bitECS world with `createWorld()` for ECS tests
- Use `beforeEach` to reset world state
- Mock DOM/Canvas for rendering tests
- Test files follow `*.test.ts` naming
- Use Arrange-Act-Assert pattern
- Run single file for speed: `pnpm run test -- <filename>`

**Key test areas (113+ files, 2500+ tests):**
- ECS: `ecs.test.ts`, `entityPool.test.ts`, `entityTemplates.test.ts`, `archetypes.test.ts`
- Systems: `aiSystem.test.ts`, `combatSystem.test.ts`, `abilitySystem.test.ts`, `damageSystem.test.ts`
- Managers: `gameState.test.ts`, `waveSpawner.test.ts`, `upgradeManager.test.ts`, `scoreManager.test.ts`
- AI: `UtilityAI.test.ts`, `AIAutoPlayManager.test.ts`, `BehaviorPredictor.test.ts`
- UI: `HUDManager.test.ts`, `GameOverScreen.test.ts`, `PauseOverlay.test.ts`, `MainMenu.test.ts`
- Config: `config.test.ts`, `configExpanded.test.ts`

**E2E tests** (Playwright):
- Live in `e2e/tests/`, separate from unit tests
- Use custom fixture from `e2e/fixtures/game.fixture.ts`
- Run with `pnpm run e2e`

## Important Configuration Values

From `src/types/config/game.ts`:
- `GAME_CONFIG.WORLD_WIDTH/HEIGHT`: 1920x1080
- `GAME_CONFIG.COLLISION_CELL_SIZE`: 64px
- `GAME_CONFIG.INITIAL_RESOURCES`: 500
- `GAME_CONFIG.RESOURCE_REWARD`: 12 (per enemy kill)

From `src/types/config/turrets.ts`:
- 6 turret types (Phaser, Torpedo, Disruptor, Tetryon, Plasma, Polaron)
- 5 upgrade paths (Damage, Range, Fire Rate, Multi-Target, Special)
- Each turret has unique special upgrade with 3 levels

## Common Gotchas

- Components are TypedArrays indexed by entity ID: `Position.x[eid]`, not objects
- bitECS 0.4.0 uses `World` type, not `IWorld`
- Use `query()` from bitECS, not `defineQuery()` at module scope (bitECS 0.4.0 API)
- PoolManager must be used for entity lifecycle — never raw `addEntity`/`removeEntity` in game logic
- EventBus is singleton: `EventBus.getInstance()`
- Pixi objects managed only through RenderManager/spriteManager — never create directly in systems
- Systems run in priority order (lower number = earlier execution)

## Trust These Instructions

These instructions have been validated against the actual codebase. Only search the codebase if:
1. Instructions appear incomplete for your specific task
2. A command fails unexpectedly
3. You need implementation details not covered here

**Last validated**: 2026-02-21 against 232 source files, 113 test files, 2516 tests.
