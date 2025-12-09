# Copilot Instructions for Kobayashi Maru

## Repository Overview

**Kobayashi Maru** is a Star Trek-themed endless tower defense game built with TypeScript, PixiJS 8, and bitECS. The player defends the civilian freighter Kobayashi Maru against infinite enemy waves by placing and upgrading turrets.

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
npm run dev         # Start Vite dev server at http://localhost:5173
npm run test:watch  # Run tests in watch mode
```

**Important:**
- Always run `npm ci` before any other commands after cloning
- The `build` command runs `tsc && vite build` - TypeScript must compile cleanly first
- All tests must pass before committing (48 test files in `src/__tests__/`)
- Lint and test run in CI on every PR to `main`

## Project Structure

```
/                           # Repository root
├── src/                    # Source code
│   ├── main.ts            # Entry point - initializes Game class
│   ├── core/              # Game.ts (facade), managers, loop, services
│   │   ├── managers/      # GameplayManager, RenderManager, UIController, InputRouter
│   │   ├── loop/          # GameLoopManager
│   │   └── services/      # Core services
│   ├── ecs/               # ECS: components.ts, entityFactory.ts, entityPool.ts, world.ts
│   ├── systems/           # 17 ECS systems (ai, combat, ability, targeting, etc.)
│   ├── rendering/         # PixiJS: SpriteManager, BeamRenderer, ParticleSystem, textures
│   ├── audio/             # AudioManager, SoundGenerator (Web Audio API)
│   ├── ui/                # HUD, panels, overlays, menus
│   │   └── panels/        # ResourcePanel, WavePanel, ComboPanel, etc.
│   ├── game/              # WaveManager, ScoreManager, UpgradeManager, AchievementManager
│   ├── config/            # Centralized configuration files
│   ├── collision/         # SpatialHash for efficient collision detection
│   ├── services/          # DamageService, EntityPoolService, StorageService
│   ├── types/             # Constants, events, type definitions
│   │   └── config/        # Modular type configs (turrets.ts, enemies.ts, factions.ts)
│   └── __tests__/         # 48 test files
├── .github/workflows/     # CI (ci.yml) and GitHub Pages deploy (deploy-pages.yml)
├── docs/                  # Planning docs and change notes
├── index.html             # Entry HTML - loads /src/main.ts
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config (strict, ES2020, ESNext modules)
├── vite.config.ts         # Vite config (WebGPU preference)
└── eslint.config.js       # ESLint flat config with typescript-eslint
```

## Key Architecture Patterns

### ECS (Entity-Component-System)

- Components defined in `src/ecs/components.ts` using bitECS
- Entity factory in `src/ecs/entityFactory.ts` creates enemies, turrets, projectiles
- Entity templates in `src/ecs/entityTemplates.ts` for configuration-driven creation
- Systems process entities each frame in `src/systems/`

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
- `wave.config.ts` - Spawn timing, wave delays
- `ui.config.ts` - UI dimensions, colors
- `rendering.config.ts` - Visual settings
- `performance.config.ts` - Performance thresholds

### System Execution Order

Defined in `src/core/Game.ts` via SystemManager:

1. collision (priority 10)
2. ai (priority 20)
3. movement (priority 30)
4. targeting (priority 40)
5. combat (priority 50)
6. projectile (priority 60)
7. damage (priority 70)
8. statusEffect (priority 80)
9. ability (priority 90)
10. enemyCombat (priority 100)
11. enemyProjectile (priority 110)
12. turretRotation (priority 120)
13. enemyRotation (priority 130)
14. enemyCollision (priority 140)
15. render (priority 200)

## Adding New Features

**New turret type:**
1. Add to `TurretType` enum in `src/types/config/turrets.ts`
2. Add config to `TURRET_CONFIG` with stats
3. Add texture functions in `src/rendering/textures.ts`
4. Update `SpriteType` in `src/types/config/factions.ts`
5. Update `spriteManager.ts` to handle new sprite types

**New enemy faction:**
1. Add to `FactionId` enum in `src/types/config/factions.ts`
2. Add color to `FACTION_COLORS`
3. Add template in `src/ecs/entityTemplates.ts`
4. Create texture function in `src/rendering/textures.ts`

**New ability:**
1. Add to `AbilityType` in `src/types/config/enemies.ts`
2. Add config to `ABILITY_CONFIG`
3. Implement processor in `src/systems/abilitySystem.ts`

**New UI panel:**
1. Create in `src/ui/panels/`
2. Add to HUDManager initialization
3. Connect to EventBus for updates

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

**Key test areas (48 files):**
- ECS: `ecs.test.ts`, `entityPool.test.ts`
- Systems: `aiSystem.test.ts`, `combatSystem.test.ts`, `abilitySystem.test.ts`
- Managers: `gameState.test.ts`, `waveSpawner.test.ts`, `upgradeManager.test.ts`
- UI: `HUDManager.test.ts`, `GameOverScreen.test.ts`, `PauseOverlay.test.ts`

## Important Configuration Values

From `src/types/config/game.ts`:
- `GAME_CONFIG.WORLD_WIDTH/HEIGHT`: 1920x1080
- `GAME_CONFIG.COLLISION_CELL_SIZE`: 64px
- `GAME_CONFIG.INITIAL_RESOURCES`: 500
- `GAME_CONFIG.RESOURCE_REWARD`: 10 (per enemy kill)

From `src/types/config/turrets.ts`:
- 6 turret types with damage, range, fire rate, cost
- 5 upgrade paths with costs and bonuses

## Trust These Instructions

These instructions have been validated by running all commands successfully. Only search the codebase if:
1. Instructions appear incomplete for your specific task
2. A command fails unexpectedly
3. You need implementation details not covered here
