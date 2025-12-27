# Testing Strategies and Patterns for AI Agent Friendliness

**Date:** 2025-12-27  
**Category:** Testing  
**Priority:** HIGH  
**Effort:** Medium  

---

## Executive Summary

Comprehensive testing is essential for AI coding agents to make safe modifications. This document outlines testing strategies, patterns, and best practices to maintain the 650+ test suite and ensure agents can confidently add and modify tests.

---

## Current State Assessment

### ✅ Strengths

1. **Strong Test Suite** - 653 passing tests
2. **71% Code Coverage** - Good for a game with rendering
3. **Vitest Framework** - Modern, fast test runner
4. **jsdom Environment** - DOM testing support
5. **ECS Test Patterns** - Established world creation/cleanup

### ⚠️ Areas for Improvement

1. **Flat Test Directory** - All tests in `src/__tests__/`
2. **Rendering Coverage** - 35% (expected for PixiJS)
3. **Integration Tests** - Limited end-to-end coverage
4. **Mock Organization** - Scattered mock definitions

---

## Recommendations for AI Coding Agents

### 1. Test File Structure Template

**Recommendation:** Provide consistent test file structure.

**Standard Template:**
```typescript
/**
 * Tests for [ModuleName]
 * @module __tests__/[path]/[ModuleName].test.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import module under test
import { ModuleUnderTest } from '../path/to/module';

// Import dependencies for mocking
import { Dependency } from '../path/to/dependency';

// Mock external dependencies
vi.mock('../path/to/dependency', () => ({
    Dependency: vi.fn().mockImplementation(() => ({
        method: vi.fn(),
    })),
}));

describe('ModuleName', () => {
    // Shared test fixtures
    let instance: ModuleUnderTest;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Create fresh instance
        instance = new ModuleUnderTest();
    });

    afterEach(() => {
        // Cleanup if needed
        instance?.destroy?.();
    });

    describe('methodName', () => {
        it('should [expected behavior] when [condition]', () => {
            // Arrange
            const input = 'test';

            // Act
            const result = instance.methodName(input);

            // Assert
            expect(result).toBe('expected');
        });

        it('should throw when [error condition]', () => {
            expect(() => instance.methodName(null)).toThrow('Error message');
        });
    });

    describe('edge cases', () => {
        it('should handle empty input', () => { });
        it('should handle maximum values', () => { });
        it('should handle concurrent calls', () => { });
    });
});
```

**Why Agent-Friendly:**
- Consistent structure across all tests
- Clear Arrange-Act-Assert pattern
- Edge cases explicitly documented

**Action Items:**
- [ ] Create test file template in `.github/`
- [ ] Document template in AGENTS.md
- [ ] Add code snippets to IDE

---

### 2. ECS Testing Patterns

**Recommendation:** Standardize ECS component and system testing.

**Pattern for Testing ECS Systems:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld, GameWorld } from '../ecs/world';
import { PoolManager } from '../ecs/PoolManager';
import { createEnemy, createTurret } from '../ecs/entityFactory';
import { Position, Health, Turret, Target } from '../ecs/components';
import { createCombatSystem } from '../systems/combatSystem';
import { FactionId, TurretType } from '../types/constants';

describe('CombatSystem', () => {
    let world: GameWorld;
    let combatSystem: ReturnType<typeof createCombatSystem>;

    beforeEach(() => {
        // Always create fresh world
        world = createGameWorld();
        
        // Initialize PoolManager with this world
        PoolManager.getInstance().init(world);
        
        // Create system under test
        combatSystem = createCombatSystem();
    });

    afterEach(() => {
        // Always cleanup PoolManager
        PoolManager.getInstance().destroy();
    });

    describe('targeting', () => {
        it('should damage target when in range', () => {
            // Create entities
            const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
            const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

            // Set up targeting relationship
            Target.entityId[turretId] = enemyId;
            Target.hasTarget[turretId] = 1;
            Turret.lastFired[turretId] = 0;

            const initialHealth = Health.current[enemyId];

            // Run system
            combatSystem.update(world, 0.016, 1);

            // Verify damage was applied
            expect(Health.current[enemyId]).toBeLessThan(initialHealth);
        });
    });
});
```

**Why Agent-Friendly:**
- Clear setup/teardown for ECS world
- PoolManager lifecycle handled
- Component access is explicit

**Action Items:**
- [ ] Document ECS testing pattern in AGENTS.md
- [ ] Create ECS test utilities module
- [ ] Standardize across all system tests

---

### 3. Mock Organization and Reuse

**Recommendation:** Centralize common mocks.

**Create `/src/__tests__/mocks/` directory:**
```
src/__tests__/mocks/
├── index.ts          # Barrel exports
├── pixiMocks.ts      # PixiJS mocks
├── audiMocks.ts      # Web Audio mocks
├── domMocks.ts       # DOM/Canvas mocks
├── serviceMocks.ts   # Service container mocks
└── ecsMocks.ts       # ECS world helpers
```

**Example: src/__tests__/mocks/pixiMocks.ts**
```typescript
import { vi } from 'vitest';

export const mockApplication = () => ({
    stage: {
        addChild: vi.fn(),
        removeChild: vi.fn(),
        children: [],
    },
    renderer: {
        resize: vi.fn(),
        width: 1920,
        height: 1080,
    },
    ticker: {
        add: vi.fn(),
        remove: vi.fn(),
    },
    destroy: vi.fn(),
});

export const mockContainer = () => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    visible: true,
    destroy: vi.fn(),
});

export const mockSprite = () => ({
    ...mockContainer(),
    texture: null,
    anchor: { set: vi.fn() },
    tint: 0xffffff,
});
```

**Why Agent-Friendly:**
- Mocks are discoverable and reusable
- Consistent mock behavior across tests
- Easy to update when PixiJS changes

**Action Items:**
- [ ] Create mocks directory structure
- [ ] Extract mocks from existing tests
- [ ] Update tests to use shared mocks

---

### 4. Test Categories and Coverage Targets

**Recommendation:** Define clear coverage targets by category.

**Coverage Targets:**
| Category | Current | Target | Notes |
|----------|---------|--------|-------|
| config/ | 100% | 100% | Pure data, easy to test |
| types/ | 100% | 100% | Type definitions |
| collision/ | 100% | 100% | Critical algorithm |
| pathfinding/ | 96% | 95% | Complex algorithms |
| core/ | 94% | 90% | Manager coordination |
| ui/ | 89% | 85% | DOM interaction |
| game/ | 87% | 85% | Business logic |
| ecs/ | 81% | 80% | Component data |
| systems/ | 66% | 80% | **Needs improvement** |
| services/ | 39% | 70% | **Needs improvement** |
| rendering/ | 35% | 50% | PixiJS integration |

**Why Agent-Friendly:**
- Clear targets for coverage improvement
- Agents know where to focus testing effort
- Rendering exceptions are documented

**Action Items:**
- [ ] Add coverage thresholds to vitest.config
- [ ] Create coverage report in CI
- [ ] Document category-specific testing approaches

---

### 5. Integration Test Patterns

**Recommendation:** Add integration tests for complex flows.

**Example: Wave Spawning Integration Test**
```typescript
describe('Wave Spawning Integration', () => {
    let world: GameWorld;
    let waveManager: WaveManager;
    let gameState: GameState;

    beforeEach(async () => {
        // Initialize full game services
        const services = getServices();
        world = createGameWorld();
        services.override('world', world);
        
        waveManager = services.get('waveManager');
        gameState = services.get('gameState');
        
        gameState.start();
    });

    afterEach(() => {
        resetServices();
    });

    it('should spawn enemies when wave starts', async () => {
        // Start wave 1
        waveManager.startWave(1);
        
        // Run game loop for spawning
        for (let i = 0; i < 60; i++) {
            waveManager.update(1/60);
        }
        
        // Verify enemies were spawned
        const enemies = query(world, [Faction]).filter(
            e => Faction.id[e] !== FactionId.FEDERATION
        );
        expect(enemies.length).toBeGreaterThan(0);
    });

    it('should emit WAVE_COMPLETED when all enemies killed', async () => {
        const completedHandler = vi.fn();
        EventBus.getInstance().on(GameEventType.WAVE_COMPLETED, completedHandler);
        
        waveManager.startWave(1);
        
        // Kill all spawned enemies
        const enemies = query(world, [Health, Faction]).filter(
            e => Faction.id[e] !== FactionId.FEDERATION
        );
        enemies.forEach(e => Health.current[e] = 0);
        
        // Update to process deaths
        waveManager.update(1/60);
        
        expect(completedHandler).toHaveBeenCalledWith({ waveNumber: 1 });
    });
});
```

**Why Agent-Friendly:**
- Tests real interactions between systems
- Catches integration issues early
- Documents expected behavior flows

**Action Items:**
- [ ] Create integration test directory
- [ ] Add wave flow integration tests
- [ ] Add combat flow integration tests

---

### 6. Test Naming Conventions

**Recommendation:** Use descriptive test names that explain intent.

**Pattern: "should [expected outcome] when [condition]"**

```typescript
// GOOD: Clear intent
it('should apply damage to shields first when enemy has shields', () => { });
it('should apply remaining damage to health when shields depleted', () => { });
it('should clear target reference when target is destroyed', () => { });
it('should not fire when turret is on cooldown', () => { });

// BAD: Unclear purpose
it('test damage', () => { });
it('works correctly', () => { });
it('handles edge case', () => { });
```

**Why Agent-Friendly:**
- Test names serve as documentation
- Failure messages are self-explanatory
- Easy to find tests for specific behavior

**Action Items:**
- [ ] Audit existing test names
- [ ] Rename unclear tests
- [ ] Add naming guidelines to style guide

---

### 7. Test Data Builders

**Recommendation:** Create builder patterns for complex test data.

**Example:**
```typescript
// src/__tests__/builders/enemyBuilder.ts
import { FactionId } from '../../types/constants';

interface EnemyTestConfig {
    x: number;
    y: number;
    factionId: number;
    health: number;
    shield: number;
}

export class EnemyBuilder {
    private config: EnemyTestConfig = {
        x: 0,
        y: 0,
        factionId: FactionId.KLINGON,
        health: 100,
        shield: 50,
    };

    at(x: number, y: number): this {
        this.config.x = x;
        this.config.y = y;
        return this;
    }

    withFaction(factionId: number): this {
        this.config.factionId = factionId;
        return this;
    }

    withHealth(health: number): this {
        this.config.health = health;
        return this;
    }

    withNoShields(): this {
        this.config.shield = 0;
        return this;
    }

    build(world: GameWorld): number {
        const eid = createEnemy(world, this.config.factionId, this.config.x, this.config.y);
        Health.current[eid] = this.config.health;
        Shield.current[eid] = this.config.shield;
        return eid;
    }
}

// Usage in tests
const enemy = new EnemyBuilder()
    .at(500, 500)
    .withFaction(FactionId.BORG)
    .withNoShields()
    .build(world);
```

**Why Agent-Friendly:**
- Readable test setup
- Reusable across tests
- Easy to add new configuration options

**Action Items:**
- [ ] Create builders for common entity types
- [ ] Create builders for complex configurations
- [ ] Document builder usage

---

### 8. Snapshot Testing for Complex Objects

**Recommendation:** Use snapshots for large configuration validation.

```typescript
import { expect, it } from 'vitest';
import { TURRET_CONFIG } from '../types/constants';

describe('Configuration Snapshots', () => {
    it('should match turret configuration snapshot', () => {
        expect(TURRET_CONFIG).toMatchSnapshot();
    });

    it('should match wave configuration snapshot', () => {
        expect(WAVE_CONFIG).toMatchSnapshot();
    });
});
```

**Why Agent-Friendly:**
- Catches unintentional config changes
- Documents current configuration
- Easy to update when intentional

**Action Items:**
- [ ] Add snapshot tests for configurations
- [ ] Add snapshot tests for component schemas
- [ ] Document snapshot update process

---

## Implementation Checklist

### Phase 1: Mock Organization (2 hours)
- [ ] Create mocks directory
- [ ] Extract and centralize mocks
- [ ] Update existing tests

### Phase 2: Test Patterns (3-4 hours)
- [ ] Create test template
- [ ] Add ECS testing utilities
- [ ] Create test data builders

### Phase 3: Integration Tests (4-6 hours)
- [ ] Create integration test directory
- [ ] Add wave flow tests
- [ ] Add combat flow tests

### Phase 4: Coverage Improvement (4-6 hours)
- [ ] Improve systems/ coverage
- [ ] Improve services/ coverage
- [ ] Add coverage thresholds

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Total tests | 653 | 700+ |
| Overall coverage | 71% | 75% |
| Systems coverage | 66% | 80% |
| Services coverage | 39% | 70% |
| Integration tests | ~5 | 20+ |

---

## References

- `src/__tests__/combatSystem.test.ts` - Good ECS test example
- `src/__tests__/ecs.test.ts` - Entity factory tests
- `vitest.config.ts` - Test configuration

---

*This document is part of the Kobayashi Maru maintainability initiative.*
