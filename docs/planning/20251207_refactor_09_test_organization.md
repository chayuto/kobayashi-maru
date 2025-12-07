# Refactoring Task: Test Organization

**Date:** 2025-12-07  
**Priority:** LOW  
**Estimated Effort:** 1-2 days  
**AI Friendliness Impact:** MEDIUM

---

## Problem Statement

Test file organization affects AI's ability to:
- Find relevant tests for a feature
- Understand expected behavior from test descriptions
- Add new tests in the right location
- Run focused test suites

### Current Test Structure

```
src/__tests__/
├── BinaryHeap.test.ts
├── BeamRenderer.test.ts
├── PerformanceMonitor.test.ts
├── combatSystem.test.ts
├── resourceManager.test.ts
├── StorageService.test.ts
├── turretUpgradeVisuals.test.ts
├── movementSystem.test.ts
├── ecs.test.ts
├── ShockwaveRenderer.test.ts
├── turret.test.ts
├── waveSpawner.test.ts
├── ExplosionManager.test.ts
└── ... (44 total files)
```

**Issues:**
- All tests in one flat directory
- Naming inconsistencies (`combatSystem.test.ts` vs `ecs.test.ts`)
- No clear grouping by feature/domain
- Mixed unit and integration tests

---

## Recommended Actions

### 1. Reorganize into Domain-Based Structure

```
src/__tests__/
├── unit/                          # Pure unit tests
│   ├── ecs/
│   │   ├── components.test.ts
│   │   ├── entityFactory.test.ts
│   │   └── entityPool.test.ts
│   ├── systems/
│   │   ├── movementSystem.test.ts
│   │   ├── combatSystem.test.ts
│   │   ├── damageSystem.test.ts
│   │   ├── aiSystem.test.ts
│   │   ├── targetingSystem.test.ts
│   │   └── projectileSystem.test.ts
│   ├── game/
│   │   ├── gameState.test.ts
│   │   ├── waveManager.test.ts
│   │   ├── resourceManager.test.ts
│   │   ├── scoreManager.test.ts
│   │   └── placementManager.test.ts
│   ├── rendering/
│   │   ├── beamRenderer.test.ts
│   │   ├── explosionManager.test.ts
│   │   ├── particleSystem.test.ts
│   │   └── shockwaveRenderer.test.ts
│   ├── ui/
│   │   ├── hudManager.test.ts
│   │   ├── turretMenu.test.ts
│   │   └── gameOverScreen.test.ts
│   ├── audio/
│   │   └── audioManager.test.ts
│   └── utils/
│       ├── binaryHeap.test.ts
│       └── validation.test.ts
│
├── integration/                   # Tests involving multiple systems
│   ├── gameLoop.test.ts
│   ├── combatFlow.test.ts
│   ├── waveProgression.test.ts
│   └── turretPlacement.test.ts
│
└── helpers/                       # Test utilities and mocks
    ├── mockWorld.ts
    ├── mockPixi.ts
    ├── mockAudio.ts
    ├── entityHelpers.ts
    └── testConfig.ts
```

### 2. Create Test Naming Convention

```markdown
## Test Naming Convention

### File Names
- Match source file: `combatSystem.ts` → `combatSystem.test.ts`
- Use camelCase: `combatSystem.test.ts` (not `combat-system.test.ts`)

### Describe Blocks
```typescript
describe('CombatSystem', () => {
  describe('when turret has valid target', () => {
    it('should fire at fire rate interval', () => {});
    it('should apply damage to target', () => {});
  });
  
  describe('when turret has no target', () => {
    it('should not fire', () => {});
  });
});
```

### Test Names
- Start with "should" for behavior: `it('should apply damage to health')`
- Be specific: `it('should reduce health by damage amount after shields depleted')`
- Avoid implementation details: NOT `it('calls applyDamage function')`
```

### 3. Create Test Helpers Module

```typescript
// src/__tests__/helpers/mockWorld.ts

import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, Health, Faction } from '../../ecs/components';
import type { GameWorld } from '../../ecs/world';

/**
 * Creates a mock world for testing.
 */
export function createMockWorld(): GameWorld {
  const world = createWorld() as GameWorld;
  world.time = { delta: 0, elapsed: 0 };
  return world;
}

/**
 * Creates a test entity with common components.
 */
export function createTestEntity(
  world: GameWorld,
  options: {
    x?: number;
    y?: number;
    health?: number;
    faction?: number;
  } = {}
): number {
  const eid = addEntity(world);
  
  addComponent(world, Position, eid);
  Position.x[eid] = options.x ?? 100;
  Position.y[eid] = options.y ?? 100;
  
  if (options.health !== undefined) {
    addComponent(world, Health, eid);
    Health.current[eid] = options.health;
    Health.max[eid] = options.health;
  }
  
  if (options.faction !== undefined) {
    addComponent(world, Faction, eid);
    Faction.id[eid] = options.faction;
  }
  
  return eid;
}

/**
 * Creates multiple entities at once.
 */
export function createTestEntities(
  world: GameWorld,
  count: number,
  options: Parameters<typeof createTestEntity>[1] = {}
): number[] {
  return Array.from({ length: count }, () => 
    createTestEntity(world, options)
  );
}
```

```typescript
// src/__tests__/helpers/mockPixi.ts

import { vi } from 'vitest';

/**
 * Mocks PixiJS modules for testing.
 */
export function mockPixi() {
  vi.mock('pixi.js', () => ({
    Application: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      stage: {
        addChild: vi.fn(),
        removeChild: vi.fn(),
      },
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
        deltaMS: 16.67,
      },
      renderer: {
        width: 1920,
        height: 1080,
      },
      canvas: document.createElement('canvas'),
    })),
    Container: vi.fn().mockImplementation(() => ({
      addChild: vi.fn(),
      removeChild: vi.fn(),
      destroy: vi.fn(),
      position: { set: vi.fn() },
      scale: { set: vi.fn() },
    })),
    Graphics: vi.fn().mockImplementation(() => ({
      rect: vi.fn().mockReturnThis(),
      fill: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
      roundRect: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    })),
    Text: vi.fn().mockImplementation(() => ({
      text: '',
      style: {},
      position: { set: vi.fn() },
      destroy: vi.fn(),
    })),
    TextStyle: vi.fn().mockImplementation((options) => options),
  }));
}
```

```typescript
// src/__tests__/helpers/testConfig.ts

/**
 * Common test configuration values.
 */
export const TEST_CONFIG = {
  /** Standard test timeout in ms */
  DEFAULT_TIMEOUT: 5000,
  
  /** Delta time for system updates */
  FRAME_DELTA: 1 / 60,
  
  /** World dimensions for tests */
  WORLD: {
    WIDTH: 1920,
    HEIGHT: 1080,
  },
  
  /** Entity positions for tests */
  POSITIONS: {
    CENTER: { x: 960, y: 540 },
    TOP_LEFT: { x: 100, y: 100 },
    BOTTOM_RIGHT: { x: 1820, y: 980 },
  },
};

/**
 * Creates a system context for testing.
 */
export function createTestContext(overrides = {}) {
  return {
    delta: TEST_CONFIG.FRAME_DELTA,
    gameTime: 0,
    isPaused: false,
    timeScale: 1.0,
    ...overrides,
  };
}
```

### 4. Add Test Coverage Configuration

```typescript
// vitest.config.ts (update)

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/__tests__/**',
        'src/main.ts',
        'src/vite-env.d.ts',
      ],
      // Target 80% coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    // Organize test output
    reporters: ['verbose'],
    // Speed up tests
    pool: 'threads',
    testTimeout: 5000,
  },
});
```

### 5. Update Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run src/__tests__/unit",
    "test:integration": "vitest run src/__tests__/integration",
    "test:systems": "vitest run src/__tests__/unit/systems"
  }
}
```

---

## Migration Strategy

1. Create new directory structure
2. Move tests one module at a time
3. Update imports in each test
4. Verify tests still pass after each move
5. Delete old flat directory

---

## Verification

- [ ] All tests pass after reorganization
- [ ] Coverage report generates correctly
- [ ] Focused test commands work (`npm run test:systems`)
- [ ] No duplicate test files
- [ ] Helper modules are reusable

---

## Dependencies

- None - can be done in parallel
- May affect file decomposition task (test file locations)
