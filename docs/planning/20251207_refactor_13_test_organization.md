# Refactor Task: Test File Organization

**Date:** December 7, 2025  
**Priority:** 🟢 Low  
**Complexity:** Low  
**Estimated Effort:** 1-2 hours  

---

## Problem Statement

All 45 test files are in a single flat directory `src/__tests__/`:

```
src/__tests__/
├── aiSystem.test.ts
├── AudioManager.test.ts
├── BeamRenderer.test.ts
├── BinaryHeap.test.ts
├── collisionSystem.test.ts
├── combatSystem.test.ts
├── damageSystem.test.ts
├── ecs.test.ts
├── enemyCollisionSystem.test.ts
├── entityPool.test.ts
├── EventBus.test.ts
├── ExplosionManager.test.ts
├── GameOverScreen.test.ts
├── gameState.test.ts
├── GestureManager.test.ts
├── GlowManager.test.ts
├── HapticManager.test.ts
├── highScoreManager.test.ts
├── HUDManager.test.ts
├── InputManager.test.ts
├── MessageLog.test.ts
├── movementSystem.test.ts
├── ParticleSystem.enhanced.test.ts
├── ParticleSystem.test.ts
├── pathfinding.test.ts
├── PauseOverlay.test.ts
├── PerformanceMonitor.test.ts
├── PlacementManager.test.ts
├── projectileSystem.test.ts
├── renderSystem.test.ts
├── resourceManager.test.ts
├── ResponsiveUIManager.test.ts
├── scoreManager.test.ts
├── ShieldRenderer.test.ts
├── ShockwaveRenderer.test.ts
├── spatialHash.test.ts
├── StorageService.test.ts
├── SystemManager.test.ts
├── targetingSystem.test.ts
├── turret.test.ts
├── turretUpgradePanel.integration.test.ts
├── turretUpgradeVisuals.test.ts
├── upgradeManager.test.ts
└── waveSpawner.test.ts
```

---

## Impact

- **Hard to Find:** Which tests cover the combat system?
- **No Grouping:** Related tests scattered alphabetically
- **Unclear Coverage:** Can't see at a glance what's tested
- **CI Reports:** Flat structure makes reports harder to read

---

## Proposed Solution

Organize tests to mirror source structure:

```
src/__tests__/
├── core/
│   ├── EventBus.test.ts
│   ├── Game.test.ts
│   ├── GestureManager.test.ts
│   ├── HapticManager.test.ts
│   ├── InputManager.test.ts
│   └── PerformanceMonitor.test.ts
├── ecs/
│   ├── components.test.ts
│   ├── entityFactory.test.ts
│   ├── entityPool.test.ts
│   └── world.test.ts
├── systems/
│   ├── aiSystem.test.ts
│   ├── collisionSystem.test.ts
│   ├── combatSystem.test.ts
│   ├── damageSystem.test.ts
│   ├── enemyCollisionSystem.test.ts
│   ├── movementSystem.test.ts
│   ├── projectileSystem.test.ts
│   ├── SystemManager.test.ts
│   └── targetingSystem.test.ts
├── rendering/
│   ├── BeamRenderer.test.ts
│   ├── ExplosionManager.test.ts
│   ├── GlowManager.test.ts
│   ├── ParticleSystem.test.ts
│   ├── renderSystem.test.ts
│   ├── ShieldRenderer.test.ts
│   ├── ShockwaveRenderer.test.ts
│   └── turretUpgradeVisuals.test.ts
├── game/
│   ├── gameState.test.ts
│   ├── highScoreManager.test.ts
│   ├── PlacementManager.test.ts
│   ├── resourceManager.test.ts
│   ├── scoreManager.test.ts
│   ├── upgradeManager.test.ts
│   └── waveSpawner.test.ts
├── ui/
│   ├── GameOverScreen.test.ts
│   ├── HUDManager.test.ts
│   ├── MessageLog.test.ts
│   ├── PauseOverlay.test.ts
│   ├── ResponsiveUIManager.test.ts
│   └── turretUpgradePanel.integration.test.ts
├── audio/
│   └── AudioManager.test.ts
├── collision/
│   └── spatialHash.test.ts
├── pathfinding/
│   └── pathfinding.test.ts
├── services/
│   └── StorageService.test.ts
├── utils/
│   └── BinaryHeap.test.ts
└── integration/
    └── turret.test.ts
```

---

## Implementation

### Step 1: Create Directory Structure

```bash
# Create test subdirectories
mkdir -p src/__tests__/{core,ecs,systems,rendering,game,ui,audio,collision,pathfinding,services,utils,integration}
```

### Step 2: Move Files

```bash
# Core tests
mv src/__tests__/EventBus.test.ts src/__tests__/core/
mv src/__tests__/GestureManager.test.ts src/__tests__/core/
mv src/__tests__/HapticManager.test.ts src/__tests__/core/
mv src/__tests__/InputManager.test.ts src/__tests__/core/
mv src/__tests__/PerformanceMonitor.test.ts src/__tests__/core/

# ECS tests
mv src/__tests__/ecs.test.ts src/__tests__/ecs/
mv src/__tests__/entityPool.test.ts src/__tests__/ecs/

# System tests
mv src/__tests__/aiSystem.test.ts src/__tests__/systems/
mv src/__tests__/collisionSystem.test.ts src/__tests__/systems/
mv src/__tests__/combatSystem.test.ts src/__tests__/systems/
mv src/__tests__/damageSystem.test.ts src/__tests__/systems/
mv src/__tests__/enemyCollisionSystem.test.ts src/__tests__/systems/
mv src/__tests__/movementSystem.test.ts src/__tests__/systems/
mv src/__tests__/projectileSystem.test.ts src/__tests__/systems/
mv src/__tests__/SystemManager.test.ts src/__tests__/systems/
mv src/__tests__/targetingSystem.test.ts src/__tests__/systems/

# ... continue for other directories
```

### Step 3: Update Import Paths

After moving files, update relative imports:

```typescript
// BEFORE (in src/__tests__/EventBus.test.ts)
import { EventBus } from '../core/EventBus';

// AFTER (in src/__tests__/core/EventBus.test.ts)
import { EventBus } from '../../core/EventBus';
```

### Step 4: Update Vitest Config (if needed)

```typescript
// vite.config.ts or vitest.config.ts
export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    // Coverage reporting by directory
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**']
    }
  }
});
```

### Step 5: Add README for Test Structure

```markdown
<!-- src/__tests__/README.md -->
# Test Organization

Tests are organized to mirror the source code structure:

- `core/` - Core game infrastructure (EventBus, Input, etc.)
- `ecs/` - Entity Component System tests
- `systems/` - Game systems (AI, Combat, Movement, etc.)
- `rendering/` - Visual rendering tests
- `game/` - Game logic (waves, scoring, resources)
- `ui/` - User interface components
- `audio/` - Audio system tests
- `collision/` - Spatial hashing and collision
- `pathfinding/` - Pathfinding algorithms
- `services/` - Service layer tests
- `utils/` - Utility function tests
- `integration/` - Cross-system integration tests

## Running Tests

```bash
# Run all tests
npm test

# Run specific directory
npm test -- src/__tests__/systems/

# Run specific file
npm test -- src/__tests__/systems/combatSystem.test.ts
```
```

---

## Validation Criteria

1. **All tests still run** - `npm test` passes
2. **No broken imports** - all relative paths updated
3. **Coverage unchanged** - same files covered
4. **CI passes** - GitHub Actions still work

---

## Files to Move

45 test files to be reorganized into subdirectories.

## Files to Create

- `src/__tests__/README.md` - Documentation
- Directory structure as outlined above

## Files to Modify

- All moved test files - Update import paths
- `vite.config.ts` - Verify test glob pattern works
