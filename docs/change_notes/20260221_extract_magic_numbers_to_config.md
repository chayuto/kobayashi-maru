# Extract Magic Numbers to Centralized Config

**Date:** 2026-02-21  
**Type:** Chore / Safe Refactor  
**Risk Level:** LOW  
**Tests:** 2519 passed (3 new tests added)

## Summary

Extracted hardcoded magic numbers from 6 production source files into 2 centralized config files. This improves maintainability by making audio volumes and AI behavior parameters tunable from a single location, eliminating scattered literals and fixing inconsistencies.

## Changes Made

### 1. Audio SFX Volume Extraction (`AUDIO_CONFIG.SFX`)

**Config file:** `src/config/audio.config.ts`

Added `SFX` section with 8 named volume constants:

| Constant | Value | Used By |
|----------|-------|---------|
| `TURRET_SELECT` | 0.5 | PlacementManager |
| `TURRET_PLACE` | 0.6 | PlacementManager |
| `TURRET_UPGRADE` | 0.7 | UpgradeManager |
| `ERROR_BEEP` | 0.5 | PlacementManager, UpgradeManager |
| `WAVE_START` | 0.7 | WaveManager |
| `WAVE_COMPLETE` | 0.7 | WaveManager |
| `EXPLOSION_LARGE` | 0.8 | DamageSystem |
| `EXPLOSION_SMALL` | 0.6 | DamageSystem, EnemyCollisionSystem |

**Inconsistency fixed:** `EXPLOSION_LARGE` was 0.7 for turrets and 0.8 for bosses — unified to 0.8. `EXPLOSION_SMALL` was 0.5 for normal enemies and 0.6 for elites — unified to 0.6.

**Files updated:**
- `src/game/PlacementManager.ts` — 4 volume literals → config refs
- `src/game/UpgradeManager.ts` — 2 volume literals → config refs
- `src/game/waveManager.ts` — 2 volume literals → config refs
- `src/systems/damageSystem.ts` — 5 volume literals → config refs (fixed inconsistencies)
- `src/systems/enemyCollisionSystem.ts` — 1 volume literal → config ref

### 2. AI Behavior Parameter Extraction (`AI_CONFIG`)

**Config file:** `src/config/ai.config.ts`

Added new parameters to existing config:

**`AI_CONFIG.BEHAVIOR` (new entries):**

| Constant | Value | Purpose |
|----------|-------|---------|
| `FLANK_ANGLE` | Math.PI / 4 | Maximum flank angle (45°) |
| `SWARM_PHASE_MULTIPLIER` | 0.1 | Entity ID multiplier for swarm noise phase offset |

**`AI_CONFIG.ORBIT` (new section):**

| Constant | Value | Purpose |
|----------|-------|---------|
| `DISTANCE_BUFFER` | 20 | Distance buffer before entering orbit phase |
| `CORRECTION_STRENGTH` | 0.3 | Radius error correction strength |
| `OSCILLATION_FREQUENCY` | 0.5 | Oscillation frequency for orbit variation |
| `OSCILLATION_AMPLITUDE` | 0.1 | Oscillation amplitude for orbit variation |

**File updated:**
- `src/systems/aiSystem.ts` — 7 magic numbers replaced with config references across strafe, swarm, flank, and orbit behaviors

### 3. Test Coverage

**File:** `src/__tests__/config.test.ts`

Added 3 new test cases (7→10 total):
- **AI behavior parameters** — validates FLANK_ANGLE, SWARM_NOISE_FREQUENCY, SWARM_NOISE_AMPLITUDE, SWARM_PHASE_MULTIPLIER
- **AI orbit parameters** — validates all 4 ORBIT config values with range checks
- **Audio SFX volumes** — validates all 8 SFX volume keys exist and are in valid 0-1 range

## Verification

- ✅ `pnpm run lint` — passes
- ✅ `pnpm run test` — 2519/2519 tests pass (3 new)
- ✅ `pnpm run build` — succeeds

## Files Changed (9 total)

| File | Change Type |
|------|-------------|
| `src/config/audio.config.ts` | Added SFX volume section |
| `src/config/ai.config.ts` | Added ORBIT section, BEHAVIOR entries |
| `src/game/PlacementManager.ts` | Replaced 4 hardcoded volumes |
| `src/game/UpgradeManager.ts` | Replaced 2 hardcoded volumes |
| `src/game/waveManager.ts` | Replaced 2 hardcoded volumes |
| `src/systems/damageSystem.ts` | Replaced 5 hardcoded volumes |
| `src/systems/enemyCollisionSystem.ts` | Replaced 1 hardcoded volume |
| `src/systems/aiSystem.ts` | Replaced 7 magic numbers |
| `src/__tests__/config.test.ts` | Added 3 test cases |
