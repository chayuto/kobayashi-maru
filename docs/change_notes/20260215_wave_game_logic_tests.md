# Wave & Spawn Logic Tests

**Date:** 2026-02-15
**File:** `src/__tests__/waveGameLogic.test.ts`
**Tests:** 49

## Summary

Created comprehensive test coverage for wave configuration, spawn point logic, difficulty scaling, and enemy spawner systems.

## Test Coverage

### Wave Config - Structure & Validity (6 tests)
- Sequential wave numbers 1-10
- Positive spawn delays and enemy counts for all groups
- Valid faction IDs and formation types
- Increasing total enemy counts across waves

### Procedural Wave Generation (6 tests)
- 5 factions present in procedural waves
- Base multiplier formula verification (exact count calculations)
- Decreasing spawn delays as waves progress
- Delay multiplier clamping at 0.5 minimum
- Correct formation type assignments
- getWaveConfig delegation to procedural generator for wave > 10

### Difficulty Scaling (4 tests)
- Base scale of 1.0 for wave 1
- 5% linear increase per wave for waves 1-10
- Exponential growth (1.03^n) after wave 10
- Monotonically increasing values through wave 50

### Wave Story Text (5 tests)
- Correct story text content for waves 1 and 10
- Story cycling after wave 50
- Cycling verification for wave 100
- Fallback text pattern validation

### Spawn Points - Edge Positions (7 tests)
- Exact coordinate verification for all 4 edges (top, right, bottom, left)
- Position at start (0) and end (1) of edge
- getRandomEdge returns valid edge types

### Spawn Points - Formations (6 tests)
- Exact count for cluster positions
- Cluster positions within specified radius
- V-formation leader position and wing distance
- getFormationPositions delegation
- Single-entity formation handling

### SpawnPoints Class (6 tests)
- Initial zero remaining count
- Correct remaining count after setup
- Decrement tracking during consumption
- Valid fallback positions after exhaustion
- Reset behavior
- Re-setup after reset

### DifficultyScaler (4 tests)
- Health scaling with multiplier
- Shield scaling with multiplier
- Floor to integer verification
- Scale of 1.0 preserves original values

### EnemySpawner (5 tests)
- Returns -1 when world is not set
- Creates entity when world is set
- Sets velocity toward world center
- Normalized velocity direction from different corners
- Speed scale increases with wave number

## Source Files Tested
- `src/game/waveConfig.ts`
- `src/game/spawnPoints.ts`
- `src/game/wave/DifficultyScaler.ts`
- `src/game/wave/EnemySpawner.ts`

## Validation
- `npm run lint` -- passed
- `npm run test` -- 1500 tests passed (83 files), 0 failures
