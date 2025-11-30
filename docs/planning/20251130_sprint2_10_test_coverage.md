# Task 10: Unit Test Coverage Improvements

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** CRITICAL  
**Estimated Effort:** 2-3 days

## Objective
Increase unit test coverage from current level to 80%+ with comprehensive tests for all core systems, addressing the critical gap identified in the code audit.

## Context
Current test state:
- 203 tests pass across 17 test files
- Tests exist for: collision, combat, damage, ECS, entity pool, game state, high score, movement, pathfinding, render, resource manager, score manager, spatial hash, targeting, turret, wave spawner, storage service
- Code audit identified ~20% coverage (target: 80%)
- Missing tests for integration scenarios and edge cases
- No mock utilities for PixiJS Application

## Requirements

### 1. Create Test Utilities (`src/__tests__/testUtils.ts`)
```typescript
// Mock PixiJS Application
export function createMockApp(): MockApplication;

// Mock Spatial Hash
export function createMockSpatialHash(): SpatialHash;

// Factory for test entities
export function createTestEntity(world: GameWorld, options?: EntityOptions): number;

// Cleanup utility
export function cleanupWorld(world: GameWorld): void;

// Time simulation
export function advanceTime(deltaMs: number): void;
```

### 2. Add Missing System Tests

#### Wave Manager Extended Tests (`waveSpawner.test.ts`)
- [ ] Test wave difficulty scaling
- [ ] Test spawn rate limiting
- [ ] Test event emission order
- [ ] Test auto-start next wave behavior
- [ ] Test reset during active wave

#### Combat System Extended Tests (`combatSystem.test.ts`)
- [ ] Test multiple turrets firing simultaneously
- [ ] Test target prioritization
- [ ] Test fire rate accuracy
- [ ] Test beam visual generation
- [ ] Test invalid target handling

#### Targeting System Extended Tests (`targetingSystem.test.ts`)
- [ ] Test range boundary conditions
- [ ] Test target switching when closer enemy appears
- [ ] Test target retention when still valid
- [ ] Test federation entities not targeted
- [ ] Test dead entities not targeted

### 3. Add Integration Tests (`src/__tests__/integration/`)

#### Game Flow Test (`gameFlow.test.ts`)
```typescript
describe('Game Flow Integration', () => {
  test('complete wave cycle');
  test('enemy reaches Kobayashi Maru');
  test('turret destroys enemy');
  test('game over triggers correctly');
  test('restart resets all systems');
});
```

#### Combat Integration Test (`combatIntegration.test.ts`)
```typescript
describe('Combat Integration', () => {
  test('turret acquires target, fires, destroys enemy');
  test('shield absorbs damage then hull takes damage');
  test('multiple turrets focus same target');
  test('combat updates score');
});
```

### 4. Add Edge Case Tests

#### Boundary Conditions
- Entity at world edge (0, 0)
- Entity at max world coordinate
- Entity with zero velocity
- Entity with zero health
- Empty spatial hash queries
- Maximum entity count

#### Error Handling
- Invalid faction ID
- Invalid turret type
- Null world reference
- Missing components

### 5. Add Performance Tests (`src/__tests__/performance/`)
```typescript
describe('Performance Benchmarks', () => {
  test('spawn 1000 entities under 100ms', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      createKlingonShip(world, Math.random() * 1920, Math.random() * 1080);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
  
  test('movement system processes 1000 entities under 5ms');
  test('collision system processes 1000 entities under 10ms');
  test('targeting system processes 100 turrets under 5ms');
});
```

### 6. Test Coverage Configuration (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### 7. Mock Implementations

#### PixiJS Mock (`src/__tests__/mocks/pixiMock.ts`)
```typescript
export const mockApplication = {
  stage: { addChild: vi.fn(), removeChild: vi.fn() },
  ticker: { add: vi.fn(), deltaMS: 16.67 },
  renderer: { resize: vi.fn() },
  canvas: document.createElement('canvas'),
  init: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn()
};

export const mockContainer = {
  addChild: vi.fn(),
  removeChild: vi.fn(),
  destroy: vi.fn(),
  children: [],
  position: { set: vi.fn() }
};

export const mockGraphics = {
  circle: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clear: vi.fn(),
  destroy: vi.fn()
};
```

#### Web Audio Mock (`src/__tests__/mocks/audioMock.ts`)
```typescript
export const mockAudioContext = {
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  createBuffer: vi.fn(),
  destination: {},
  suspend: vi.fn(),
  resume: vi.fn(),
  state: 'running'
};
```

### 8. Required Test Files to Create/Update

| File | Status | Target Coverage |
|------|--------|-----------------|
| `src/__tests__/testUtils.ts` | Create | N/A |
| `src/__tests__/mocks/pixiMock.ts` | Create | N/A |
| `src/__tests__/mocks/audioMock.ts` | Create | N/A |
| `src/__tests__/integration/gameFlow.test.ts` | Create | N/A |
| `src/__tests__/integration/combatIntegration.test.ts` | Create | N/A |
| `src/__tests__/performance/benchmarks.test.ts` | Create | N/A |
| `src/__tests__/Game.test.ts` | Create | 80% |
| `src/__tests__/placementSystem.test.ts` | Create | 80% |
| `src/__tests__/DebugManager.test.ts` | Create | 80% |
| `src/__tests__/spriteManager.test.ts` | Create | 80% |
| `src/__tests__/Starfield.test.ts` | Create | 80% |
| `src/__tests__/BeamRenderer.test.ts` | Create | 80% |

## Acceptance Criteria
- [ ] Test utilities module created
- [ ] PixiJS mock created and working
- [ ] At least 5 new integration tests
- [ ] At least 3 performance benchmark tests
- [ ] Coverage threshold configured
- [ ] All existing tests continue to pass
- [ ] New tests pass
- [ ] Coverage report shows 80%+ on core modules
- [ ] No TypeScript compilation errors

## Files to Create
- `src/__tests__/testUtils.ts`
- `src/__tests__/mocks/pixiMock.ts`
- `src/__tests__/mocks/audioMock.ts`
- `src/__tests__/integration/gameFlow.test.ts`
- `src/__tests__/integration/combatIntegration.test.ts`
- `src/__tests__/performance/benchmarks.test.ts`
- `src/__tests__/Game.test.ts`
- `src/__tests__/placementSystem.test.ts`
- Additional test files as needed

## Files to Modify
- `vitest.config.ts` - Add coverage configuration
- `package.json` - Add coverage scripts

## Testing Requirements (Meta!)
- Verify test utilities work correctly
- Verify mocks don't break other tests
- Run full test suite after changes
- Generate and review coverage report

## Technical Notes
- Use Vitest for testing (already configured)
- Use `vi.fn()` for mocks
- Use `beforeEach`/`afterEach` for setup/teardown
- Isolate tests - no shared state between tests
- Use `describe.skip` for temporarily disabled tests
- Use `test.todo` to mark planned tests

## Example Test Patterns

### Unit Test Pattern
```typescript
describe('ShieldSystem', () => {
  let world: GameWorld;
  
  beforeEach(() => {
    world = createGameWorld();
  });
  
  afterEach(() => {
    cleanupWorld(world);
  });
  
  test('should regenerate shields after delay', () => {
    const eid = createTestEntity(world, {
      shield: { current: 50, max: 100 },
      shieldRegen: { rate: 10, delay: 2, lastDamage: 0 }
    });
    
    // Advance time past delay
    const system = createShieldSystem();
    system(world, 0.1, 2.5); // deltaTime=0.1s, currentTime=2.5s
    
    expect(Shield.current[eid]).toBe(51); // 50 + (10 * 0.1)
  });
});
```

### Integration Test Pattern
```typescript
describe('Combat Integration', () => {
  test('turret acquires and destroys enemy', () => {
    // Setup
    const world = createGameWorld();
    const spatialHash = new SpatialHash(64, 1920, 1080);
    
    // Create turret at center
    const turret = createTurret(world, 960, 540, TurretType.PHASER_ARRAY);
    
    // Create enemy in range
    const enemy = createKlingonShip(world, 1000, 540);
    Health.current[enemy] = 10; // Low health
    
    // Update spatial hash
    spatialHash.insert(enemy, 1000, 540);
    
    // Run systems
    const targeting = createTargetingSystem(spatialHash);
    const combat = createCombatSystem();
    
    targeting(world);
    combat.update(world, 0.016, 1.0);
    
    // Verify
    expect(Target.hasTarget[turret]).toBe(1);
    expect(Health.current[enemy]).toBeLessThan(10);
  });
});
```

### Performance Test Pattern
```typescript
describe('Performance', () => {
  test('processes 1000 entities efficiently', () => {
    const world = createGameWorld();
    
    // Spawn many entities
    for (let i = 0; i < 1000; i++) {
      createKlingonShip(world, Math.random() * 1920, Math.random() * 1080);
    }
    
    const movement = createMovementSystem();
    
    // Benchmark
    const start = performance.now();
    for (let frame = 0; frame < 60; frame++) {
      movement(world, 0.016);
    }
    const elapsed = performance.now() - start;
    
    // Should process 60 frames in under 100ms
    expect(elapsed).toBeLessThan(100);
  });
});
```
