# Refactor: External Game Configuration

## Objective
Move hardcoded game balance constants into a loadable configuration system to facilitate balancing and modding.

## Context
`constants.ts` contains all game balance data (turret stats, enemy speeds, wave configs). Changing balance requires recompiling the code.

## Requirements

### 1. Config Interface (`src/types/config.ts`)
- Define interfaces for:
  - `TurretConfig`
  - `EnemyConfig`
  - `WaveConfig`
  - `GlobalConfig` (resources, world size)

### 2. Config Loader (`src/core/ConfigLoader.ts`)
- Load JSON files (or a single large JSON).
- Validate loaded data against interfaces (optional but recommended).
- Provide a global `GameConfig` object that systems access.

### 3. Externalize Data
- Create `assets/config/game_balance.json`.
- Move data from `constants.ts` to this JSON.

### 4. Refactor Usage
- Replace `TURRET_CONFIG[...]` with `GameConfig.turrets[...]`.
- Replace `GAME_CONFIG.INITIAL_RESOURCES` with `GameConfig.global.initialResources`.

## Acceptance Criteria
- [ ] `game_balance.json` exists.
- [ ] `ConfigLoader` loads data at runtime (or build time if preferred, but runtime allows hot-reloading).
- [ ] `constants.ts` is reduced to only true constants (enums, colors).
- [ ] Game behaves identically to before.

## Files to Create/Modify
- `src/core/ConfigLoader.ts` (NEW)
- `src/types/config.ts` (NEW)
- `assets/config/game_balance.json` (NEW)
- `src/types/constants.ts`
- `src/game/placementSystem.ts`
- `src/game/waveManager.ts`
