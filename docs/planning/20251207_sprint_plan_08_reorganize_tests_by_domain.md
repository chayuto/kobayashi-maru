# Task: Reorganize Tests by Domain

**Priority:** 🟡 Medium  
**Estimated Effort:** Medium (2-3 hours)  
**Dependencies:** None  
**File Focus:** `src/__tests__/`

---

## Background

All 47 test files are in a single flat directory `src/__tests__/`. This makes it difficult to find related tests and doesn't reflect the modular structure of the source code.

## Current State

```
src/__tests__/
├── AudioManager.test.ts
├── BeamRenderer.test.ts
├── combatSystem.test.ts
├── ecs.test.ts
├── HUDManager.test.ts
├── ... (47 files total)
```

---

## Objective

Reorganize tests into domain-based subdirectories matching the source structure.

---

## Target Structure

```
src/__tests__/
├── audio/
│   └── AudioManager.test.ts
├── core/
│   ├── EventBus.test.ts
│   ├── InputManager.test.ts
│   ├── PerformanceMonitor.test.ts
│   ├── GestureManager.test.ts
│   └── HapticManager.test.ts
├── ecs/
│   ├── ecs.test.ts
│   └── entityPool.test.ts
├── game/
│   ├── gameState.test.ts
│   ├── resourceManager.test.ts
│   ├── scoreManager.test.ts
│   ├── highScoreManager.test.ts
│   └── waveSpawner.test.ts
├── rendering/
│   ├── BeamRenderer.test.ts
│   ├── ExplosionManager.test.ts
│   ├── ParticleSystem.test.ts
│   ├── ParticleSystem.enhanced.test.ts
│   ├── ShieldRenderer.test.ts
│   ├── ShockwaveRenderer.test.ts
│   ├── GlowManager.test.ts
│   └── turretUpgradeVisuals.test.ts
├── services/
│   └── StorageService.test.ts
├── systems/
│   ├── abilitySystem.test.ts
│   ├── aiSystem.test.ts
│   ├── collisionSystem.test.ts
│   ├── combatSystem.test.ts
│   ├── damageSystem.test.ts
│   ├── enemyCollisionSystem.test.ts
│   ├── movementSystem.test.ts
│   ├── pathfinding.test.ts
│   ├── projectileSystem.test.ts
│   ├── renderSystem.test.ts
│   ├── spatialHash.test.ts
│   ├── SystemManager.test.ts
│   └── targetingSystem.test.ts
├── ui/
│   ├── GameOverScreen.test.ts
│   ├── HUDManager.test.ts
│   ├── MessageLog.test.ts
│   ├── PauseOverlay.test.ts
│   ├── ResponsiveUIManager.test.ts
│   ├── PlacementManager.test.ts
│   └── upgradeManager.test.ts
└── integration/
    └── turretUpgradePanel.integration.test.ts
```

---

## Implementation Steps

### Step 1: Create Directory Structure

```bash
mkdir -p src/__tests__/{audio,core,ecs,game,rendering,services,systems,ui,integration}
```

### Step 2: Move Files by Category

Use git mv to preserve history:

```bash
# Audio
git mv src/__tests__/AudioManager.test.ts src/__tests__/audio/

# Core
git mv src/__tests__/EventBus.test.ts src/__tests__/core/
git mv src/__tests__/InputManager.test.ts src/__tests__/core/
# ... etc

# Systems
git mv src/__tests__/combatSystem.test.ts src/__tests__/systems/
# ... etc
```

### Step 3: Update Import Paths

After moving, some relative imports may break. Update any that reference sibling test files.

### Step 4: Verify Tests Run

```bash
npm test
```

Vitest should discover tests in subdirectories automatically.

---

## File Moves

| Current Location | New Location |
|-----------------|--------------|
| `AudioManager.test.ts` | `audio/` |
| `EventBus.test.ts` | `core/` |
| `InputManager.test.ts` | `core/` |
| `PerformanceMonitor.test.ts` | `core/` |
| `GestureManager.test.ts` | `core/` |
| `HapticManager.test.ts` | `core/` |
| `ecs.test.ts` | `ecs/` |
| `entityPool.test.ts` | `ecs/` |
| `gameState.test.ts` | `game/` |
| `resourceManager.test.ts` | `game/` |
| `scoreManager.test.ts` | `game/` |
| `highScoreManager.test.ts` | `game/` |
| `waveSpawner.test.ts` | `game/` |
| `bossWaves.test.ts` | `game/` |
| `enemyVariants.test.ts` | `game/` |
| `BeamRenderer.test.ts` | `rendering/` |
| `ExplosionManager.test.ts` | `rendering/` |
| `ParticleSystem*.test.ts` | `rendering/` |
| `ShieldRenderer.test.ts` | `rendering/` |
| `ShockwaveRenderer.test.ts` | `rendering/` |
| `GlowManager.test.ts` | `rendering/` |
| `turretUpgradeVisuals.test.ts` | `rendering/` |
| `StorageService.test.ts` | `services/` |
| `*System*.test.ts` | `systems/` |
| `*Manager.test.ts` (UI) | `ui/` |
| `*.integration.test.ts` | `integration/` |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ Tests organized into 9+ subdirectories
3. ✅ No test files in root `__tests__/` directory
4. ✅ Git history preserved via `git mv`

---

## Verification Commands

```bash
# Run all tests
npm test

# Count test files per directory
find src/__tests__ -name "*.test.ts" -type f | head -50

# Verify no files in root
ls src/__tests__/*.test.ts 2>/dev/null && echo "Files still in root!" || echo "Clean!"
```

---

## Risk Assessment

- **Low risk** - Only moving files, no logic changes
- **Verify:** All tests still discovered after move
