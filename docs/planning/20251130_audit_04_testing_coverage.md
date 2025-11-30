# Code Audit: Testing & Quality Assurance

**Date:** 2025-11-30  
**Scope:** Test coverage, testing strategies, and quality assurance practices

## Executive Summary

Testing infrastructure is in place with Vitest, but coverage is minimal. Only basic unit tests exist for ECS components. Integration tests, system tests, and rendering tests are missing.

**Overall Grade:** C (Basic testing with significant gaps)

---

## Current Test Coverage

### Existing Tests ✅

1. **ECS Component Tests** (`ecs.test.ts`)
   - World creation
   - Entity counting
   - Entity factory functions
   - Component data validation

2. **Entity Pool Tests** (`entityPool.test.ts`)
   - Pool initialization
   - Acquire/release operations
   - Pool expansion
   - Clear and destroy operations

3. **Basic Coverage:** ~15-20% (estimated)

### Missing Tests ❌

1. **System Tests**
   - Movement system
   - Render system
   - Pathfinding systems

2. **Integration Tests**
   - Game initialization flow
   - System interactions
   - Sprite manager integration

3. **Rendering Tests**
   - Texture generation
   - Sprite creation/destruction
   - ParticleContainer behavior

4. **Performance Tests**
   - Entity pool under load
   - Rendering with 5,000+ entities
   - Pathfinding performance

5. **Edge Case Tests**
   - Boundary conditions
   - Error handling
   - Resource exhaustion

---

## Critical Testing Gaps

### 1. ❌ No System Tests

**Problem:**
```typescript
// movementSystem.ts has NO tests
export function createMovementSystem() {
  return defineSystem((world: IWorld, delta: number) => {
    // Complex boundary wrapping logic - untested!
    Position.x[eid] = ((x % worldWidth) + worldWidth) % worldWidth;
  });
}
```

**Impact:**
- Boundary wrapping bugs could go unnoticed
- Velocity calculations not verified
- Frame-independent movement not tested

**Recommendation:**
```typescript
// src/__tests__/movementSystem.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createFederationShip } from '../ecs';
import { createMovementSystem } from '../systems/movementSystem';
import { Position, Velocity } from '../ecs/components';
import { GAME_CONFIG } from '../types';

describe('Movement System', () => {
  let world: ReturnType<typeof createGameWorld>;
  let movementSystem: ReturnType<typeof createMovementSystem>;

  beforeEach(() => {
    world = createGameWorld();
    movementSystem = createMovementSystem();
  });

  it('should update position based on velocity and delta time', () => {
    const eid = createFederationShip(world, 100, 100);
    Velocity.x[eid] = 50; // 50 pixels per second
    Velocity.y[eid] = 100; // 100 pixels per second

    movementSystem(world, 1.0); // 1 second

    expect(Position.x[eid]).toBe(150);
    expect(Position.y[eid]).toBe(200);
  });

  it('should be frame-independent', () => {
    const eid = createFederationShip(world, 0, 0);
    Velocity.x[eid] = 60; // 60 pixels per second

    // Two frames at 30 FPS (0.033s each)
    movementSystem(world, 0.033);
    movementSystem(world, 0.033);

    const pos1 = Position.x[eid];

    // Reset
    const eid2 = createFederationShip(world, 0, 0);
    Velocity.x[eid2] = 60;

    // One frame at 60 FPS (0.016s)
    movementSystem(world, 0.016);
    movementSystem(world, 0.016);
    movementSystem(world, 0.016);
    movementSystem(world, 0.016);

    const pos2 = Position.x[eid2];

    // Should be approximately equal (within floating point error)
    expect(Math.abs(pos1 - pos2)).toBeLessThan(0.01);
  });

  it('should wrap around at world boundaries', () => {
    const eid = createFederationShip(world, GAME_CONFIG.WORLD_WIDTH - 10, 100);
    Velocity.x[eid] = 50;

    movementSystem(world, 1.0);

    // Should wrap to left side
    expect(Position.x[eid]).toBeLessThan(50);
    expect(Position.x[eid]).toBeGreaterThanOrEqual(0);
  });

  it('should handle negative velocities correctly', () => {
    const eid = createFederationShip(world, 10, 100);
    Velocity.x[eid] = -50;

    movementSystem(world, 1.0);

    // Should wrap to right side
    expect(Position.x[eid]).toBeGreaterThan(GAME_CONFIG.WORLD_WIDTH - 50);
  });

  it('should handle zero velocity', () => {
    const eid = createFederationShip(world, 100, 100);
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    movementSystem(world, 1.0);

    expect(Position.x[eid]).toBe(100);
    expect(Position.y[eid]).toBe(100);
  });
});
```

### 2. ❌ No Rendering Tests

**Problem:**
```typescript
// spriteManager.ts - Complex sprite management, no tests
createSprite(factionId: number, x: number, y: number): number {
  // Particle pooling logic - untested
  // Container management - untested
  // Index tracking - untested
}
```

**Recommendation:**
```typescript
// src/__tests__/spriteManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application } from 'pixi.js';
import { SpriteManager } from '../rendering/spriteManager';
import { FactionId } from '../types';

// Mock PixiJS Application
vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    renderer: {
      render: vi.fn(),
      generateTexture: vi.fn(() => ({ destroy: vi.fn() }))
    },
    stage: {
      addChild: vi.fn()
    }
  })),
  ParticleContainer: vi.fn(() => ({
    addParticle: vi.fn(),
    removeParticle: vi.fn()
  })),
  Particle: vi.fn(() => ({
    x: 0,
    y: 0
  })),
  Graphics: vi.fn(() => ({
    circle: vi.fn(),
    fill: vi.fn(),
    destroy: vi.fn()
  })),
  RenderTexture: {
    create: vi.fn(() => ({ destroy: vi.fn() }))
  }
}));

describe('SpriteManager', () => {
  let app: Application;
  let spriteManager: SpriteManager;

  beforeEach(() => {
    app = new Application();
    spriteManager = new SpriteManager(app);
    spriteManager.init();
  });

  it('should create sprites for each faction', () => {
    const index1 = spriteManager.createSprite(FactionId.FEDERATION, 100, 100);
    const index2 = spriteManager.createSprite(FactionId.KLINGON, 200, 200);

    expect(index1).toBeGreaterThan(0);
    expect(index2).toBeGreaterThan(0);
    expect(index1).not.toBe(index2);
    expect(spriteManager.getActiveCount()).toBe(2);
  });

  it('should update sprite positions', () => {
    const index = spriteManager.createSprite(FactionId.FEDERATION, 100, 100);
    
    spriteManager.updateSprite(index, 200, 300);
    
    // Verify position updated (would need access to internal state)
    expect(spriteManager.getActiveCount()).toBe(1);
  });

  it('should remove sprites and return to pool', () => {
    const index = spriteManager.createSprite(FactionId.FEDERATION, 100, 100);
    expect(spriteManager.getActiveCount()).toBe(1);
    
    spriteManager.removeSprite(index);
    
    expect(spriteManager.getActiveCount()).toBe(0);
    expect(spriteManager.getPoolCount()).toBeGreaterThan(0);
  });

  it('should reuse pooled sprites', () => {
    const index1 = spriteManager.createSprite(FactionId.FEDERATION, 100, 100);
    spriteManager.removeSprite(index1);
    
    const poolCountBefore = spriteManager.getPoolCount();
    const index2 = spriteManager.createSprite(FactionId.FEDERATION, 200, 200);
    const poolCountAfter = spriteManager.getPoolCount();
    
    expect(poolCountAfter).toBe(poolCountBefore - 1);
    expect(index2).toBeGreaterThan(0);
  });

  it('should handle maximum particle limit', () => {
    const MAX_PARTICLES = 15000;
    const indices: number[] = [];
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const index = spriteManager.createSprite(FactionId.FEDERATION, i, i);
      if (index > 0) indices.push(index);
    }
    
    // Should stop at max
    const overLimit = spriteManager.createSprite(FactionId.FEDERATION, 0, 0);
    expect(overLimit).toBe(0);
  });
});
```

### 3. ❌ No Integration Tests

**Problem:** No tests verify that systems work together correctly

**Recommendation:**
```typescript
// src/__tests__/integration/gameFlow.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../core/Game';

describe('Game Integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.id = 'test-app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize game successfully', async () => {
    const game = new Game('test-app');
    
    await expect(game.init()).resolves.not.toThrow();
    
    expect(game.app).toBeDefined();
    expect(game.world).toBeDefined();
  });

  it('should spawn entities on init', async () => {
    const game = new Game('test-app');
    await game.init();
    
    const entityCount = getEntityCount();
    
    // Should have Kobayashi Maru + 100 enemies
    expect(entityCount).toBe(101);
  });

  it('should update entities over time', async () => {
    const game = new Game('test-app');
    await game.init();
    game.start();
    
    // Get initial positions
    const entities = renderQuery(game.world);
    const initialPositions = new Map();
    for (const eid of entities) {
      initialPositions.set(eid, {
        x: Position.x[eid],
        y: Position.y[eid]
      });
    }
    
    // Simulate several frames
    for (let i = 0; i < 10; i++) {
      game.app.ticker.update();
    }
    
    // Verify entities moved
    let movedCount = 0;
    for (const eid of entities) {
      const initial = initialPositions.get(eid);
      const current = { x: Position.x[eid], y: Position.y[eid] };
      
      if (initial.x !== current.x || initial.y !== current.y) {
        movedCount++;
      }
    }
    
    // Most entities should have moved (those with velocity)
    expect(movedCount).toBeGreaterThan(50);
  });
});
```

---

## Testing Strategy Recommendations

### 1. Unit Tests (Target: 80% coverage)

**What to test:**
- Individual functions
- Component creation
- Data transformations
- Utility functions

**Example:**
```typescript
// Test pure functions thoroughly
describe('Grid Utilities', () => {
  it('should convert world coordinates to cell index', () => {
    const grid = new Grid();
    const index = grid.getCellIndex(64, 64);
    expect(index).toBe(grid.cols + 2); // Row 2, Col 2
  });

  it('should clamp out-of-bounds coordinates', () => {
    const grid = new Grid();
    const index = grid.getCellIndex(-100, -100);
    expect(index).toBe(0); // Should clamp to (0, 0)
  });
});
```

### 2. Integration Tests (Target: Key flows covered)

**What to test:**
- System interactions
- Game initialization
- Entity lifecycle
- Rendering pipeline

### 3. Performance Tests

**What to test:**
- Entity pool under load
- Pathfinding with large grids
- Rendering with 5,000+ entities

**Example:**
```typescript
describe('Performance Tests', () => {
  it('should handle 5000 entities at 60 FPS', async () => {
    const game = new Game('test-app');
    await game.init();
    
    // Spawn 5000 entities
    for (let i = 0; i < 5000; i++) {
      createKlingonShip(game.world, 
        Math.random() * GAME_CONFIG.WORLD_WIDTH,
        Math.random() * GAME_CONFIG.WORLD_HEIGHT
      );
    }
    
    // Measure frame time
    const frameTimes: number[] = [];
    for (let i = 0; i < 60; i++) {
      const start = performance.now();
      game.app.ticker.update();
      frameTimes.push(performance.now() - start);
    }
    
    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const targetFrameTime = 1000 / 60; // 16.67ms for 60 FPS
    
    expect(avgFrameTime).toBeLessThan(targetFrameTime);
  });
});
```

### 4. Visual Regression Tests

**Recommendation:** Use Playwright or Puppeteer for screenshot comparison

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test('game renders correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for game to initialize
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000);
  
  // Take screenshot
  await expect(page).toHaveScreenshot('game-initial-state.png', {
    maxDiffPixels: 100
  });
});
```

---

## Test Infrastructure Improvements

### 1. Add Test Utilities

```typescript
// src/__tests__/utils/testHelpers.ts

/**
 * Creates a test world with pre-configured entities
 */
export function createTestWorld(entityCount: number = 10) {
  const world = createGameWorld();
  const entities: number[] = [];
  
  for (let i = 0; i < entityCount; i++) {
    const eid = createFederationShip(world, i * 10, i * 10);
    entities.push(eid);
  }
  
  return { world, entities };
}

/**
 * Simulates game ticks
 */
export function simulateTicks(
  game: Game,
  tickCount: number,
  deltaTime: number = 1/60
): void {
  for (let i = 0; i < tickCount; i++) {
    game.app.ticker.deltaMS = deltaTime * 1000;
    game.app.ticker.update();
  }
}

/**
 * Asserts entity is at position (with tolerance)
 */
export function expectEntityAt(
  eid: number,
  x: number,
  y: number,
  tolerance: number = 0.01
): void {
  expect(Math.abs(Position.x[eid] - x)).toBeLessThan(tolerance);
  expect(Math.abs(Position.y[eid] - y)).toBeLessThan(tolerance);
}
```

### 2. Mock PixiJS for Unit Tests

```typescript
// src/__tests__/mocks/pixi.ts
import { vi } from 'vitest';

export const mockApplication = {
  init: vi.fn().mockResolvedValue(undefined),
  renderer: {
    name: 'MockRenderer',
    resize: vi.fn(),
    render: vi.fn(),
    generateTexture: vi.fn(() => ({
      destroy: vi.fn()
    }))
  },
  stage: {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    scale: { set: vi.fn() }
  },
  ticker: {
    add: vi.fn(),
    deltaMS: 16.67,
    update: vi.fn()
  },
  canvas: document.createElement('canvas'),
  destroy: vi.fn()
};

export function setupPixiMocks() {
  vi.mock('pixi.js', () => ({
    Application: vi.fn(() => mockApplication),
    Container: vi.fn(() => ({
      addChild: vi.fn(),
      removeChild: vi.fn(),
      destroy: vi.fn()
    })),
    // ... other mocks
  }));
}
```

### 3. Add Coverage Reporting

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^4.0.14",
    "@vitest/ui": "^4.0.14"
  }
}
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
});
```

---

## Priority Action Items

1. **CRITICAL:** Add movement system tests
2. **CRITICAL:** Add render system tests
3. **HIGH:** Create test utilities and helpers
4. **HIGH:** Add integration tests for game flow
5. **HIGH:** Setup coverage reporting
6. **MEDIUM:** Add performance benchmarks
7. **MEDIUM:** Mock PixiJS for unit tests
8. **LOW:** Add visual regression tests
9. **LOW:** Add E2E tests with Playwright

---

## Testing Best Practices

### DO ✅
- Test behavior, not implementation
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests fast (<100ms per test)
- Use test utilities to reduce duplication

### DON'T ❌
- Test private methods directly
- Rely on test execution order
- Use real timers (use fake timers)
- Test multiple things in one test
- Ignore flaky tests
- Skip error case testing
- Couple tests to implementation details

---

## Coverage Goals

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| Unit Tests | ~20% | 80% | HIGH |
| Integration Tests | 0% | 60% | HIGH |
| System Tests | 0% | 90% | CRITICAL |
| E2E Tests | 0% | 20% | MEDIUM |
| Performance Tests | 0% | Key paths | HIGH |
