# Refactor Task: System Interface Simplification

**Date:** December 7, 2025  
**Priority:** 🟡 Medium  
**Complexity:** Medium  
**Estimated Effort:** 2-3 hours  

---

## Problem Statement

`src/systems/SystemManager.ts` supports 4 different system function signatures:

```typescript
// 1. Standard bitECS system
type SystemFunction = (world: IWorld, delta: number) => IWorld;

// 2. Extended with game time
type ExtendedSystemFunction = (world: IWorld, delta: number, gameTime: number) => IWorld | void;

// 3. World only (no delta)
type WorldOnlySystemFunction = (world: IWorld) => IWorld | void;

// 4. Object with update method
interface SystemWithUpdate {
  update: (world: IWorld, ...args: number[]) => IWorld | void;
}
```

This complexity leads to:
- Runtime type checking with `isSystemWithUpdate()`
- Confusing registration options (`requiresDelta`, `requiresGameTime`)
- Inconsistent return types (`IWorld | void`)

---

## Impact

- **Confusion:** Which signature should new systems use?
- **Runtime Overhead:** Type checking every frame
- **Error Prone:** Easy to register with wrong options
- **Maintenance:** Complex union types hard to modify

---

## Proposed Solution

Standardize on a single system interface with optional context object:

```typescript
interface SystemContext {
  delta: number;
  gameTime: number;
  // Future: paused, speedMultiplier, etc.
}

type GameSystem = (world: IWorld, ctx: SystemContext) => void;
```

---

## Implementation

### Step 1: Define New System Interface

```typescript
// src/systems/types.ts
import { IWorld } from 'bitecs';

/**
 * Context passed to all systems each frame
 */
export interface SystemContext {
  /** Time since last frame in seconds */
  delta: number;
  /** Total game time in seconds */
  gameTime: number;
}

/**
 * Standard game system function signature
 * All systems should conform to this interface
 */
export type GameSystem = (world: IWorld, ctx: SystemContext) => void;

/**
 * System with additional methods (stats, cleanup, etc.)
 */
export interface GameSystemWithMethods {
  update: GameSystem;
  [key: string]: unknown;
}
```

### Step 2: Simplify SystemManager

```typescript
// src/systems/SystemManager.ts
import { IWorld } from 'bitecs';
import { GameSystem, GameSystemWithMethods, SystemContext } from './types';

type AnySystem = GameSystem | GameSystemWithMethods;

interface RegisteredSystem {
  name: string;
  system: AnySystem;
  priority: number;
  enabled: boolean;
}

export class SystemManager {
  private systems: Map<string, RegisteredSystem> = new Map();
  private sortedSystems: RegisteredSystem[] = [];
  private needsSort: boolean = false;

  /**
   * Register a system with priority
   * @param name - Unique system name
   * @param system - System function or object with update method
   * @param priority - Lower numbers run first
   */
  register(name: string, system: AnySystem, priority: number): void {
    if (this.systems.has(name)) {
      console.warn(`System "${name}" already registered. Overwriting.`);
    }

    this.systems.set(name, {
      name,
      system,
      priority,
      enabled: true
    });
    this.needsSort = true;
  }

  /**
   * Run all enabled systems
   */
  run(world: IWorld, delta: number, gameTime: number): void {
    this.ensureSorted();

    const ctx: SystemContext = { delta, gameTime };

    for (const entry of this.sortedSystems) {
      if (!entry.enabled) continue;

      try {
        if (this.isSystemWithMethods(entry.system)) {
          entry.system.update(world, ctx);
        } else {
          entry.system(world, ctx);
        }
      } catch (error) {
        console.error(`Error in system "${entry.name}":`, error);
      }
    }
  }

  private isSystemWithMethods(system: AnySystem): system is GameSystemWithMethods {
    return typeof system === 'object' && 'update' in system;
  }

  private ensureSorted(): void {
    if (this.needsSort) {
      this.sortedSystems = Array.from(this.systems.values())
        .sort((a, b) => a.priority - b.priority);
      this.needsSort = false;
    }
  }

  // ... other methods unchanged
}
```

### Step 3: Update Systems to New Interface

```typescript
// src/systems/movementSystem.ts
import { SystemContext } from './types';

export function createMovementSystem(getSpeedMultiplier?: () => number) {
  return function movementSystem(world: IWorld, ctx: SystemContext): void {
    const { delta } = ctx;
    const entities = movementQuery(world);
    // ... use delta from context
  };
}
```

```typescript
// src/systems/combatSystem.ts
import { SystemContext } from './types';

export function createCombatSystem(particleSystem?: ParticleSystem) {
  function combatSystem(world: IWorld, ctx: SystemContext): void {
    const { gameTime } = ctx;
    // ... use gameTime from context
  }

  return {
    update: combatSystem,
    getActiveBeams: () => activeBeams,
    getStats,
    resetStats
  };
}
```

```typescript
// src/systems/collisionSystem.ts
import { SystemContext } from './types';

export function createCollisionSystem(spatialHash: SpatialHash) {
  return {
    update: function collisionSystem(world: IWorld, _ctx: SystemContext): void {
      // Doesn't need delta or gameTime, but accepts context
      spatialHash.clear();
      // ...
    }
  };
}
```

### Step 4: Update Registration in Game.ts

```typescript
// BEFORE
this.systemManager.register('collision', this.collisionSystem, 10, { requiresDelta: false });
this.systemManager.register('ai', this.aiSystem, 20, { requiresGameTime: true });

// AFTER - simpler!
this.systemManager.register('collision', this.collisionSystem, 10);
this.systemManager.register('ai', this.aiSystem, 20);
```

---

## Migration Strategy

1. Create new `types.ts` with simplified interfaces
2. Update `SystemManager` to use new interface
3. Update systems one at a time to accept `SystemContext`
4. Remove old type definitions once all migrated

---

## Validation Criteria

1. **Single system signature** - all systems use `GameSystem` type
2. **No registration options** - just name, system, priority
3. **All tests pass** - functionality unchanged
4. **Cleaner code** - no runtime type checking

---

## Files to Create

- `src/systems/types.ts`

## Files to Modify

- `src/systems/SystemManager.ts` - Simplify
- `src/systems/movementSystem.ts` - Update signature
- `src/systems/combatSystem.ts` - Update signature
- `src/systems/collisionSystem.ts` - Update signature
- `src/systems/aiSystem.ts` - Update signature
- `src/systems/targetingSystem.ts` - Update signature
- `src/systems/damageSystem.ts` - Update signature
- `src/systems/projectileSystem.ts` - Update signature
- `src/systems/statusEffectSystem.ts` - Update signature
- `src/systems/enemyCollisionSystem.ts` - Update signature
- `src/systems/enemyCombatSystem.ts` - Update signature
- `src/systems/enemyProjectileSystem.ts` - Update signature
- `src/core/Game.ts` - Update registration calls
