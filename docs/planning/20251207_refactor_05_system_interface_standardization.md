# Refactoring Task: System Interface Standardization

**Date:** 2025-12-07  
**Priority:** MEDIUM  
**Estimated Effort:** 1-2 days  
**AI Friendliness Impact:** HIGH

---

## Problem Statement

The ECS systems in this project use inconsistent function signatures and return patterns, which confuses AI coding assistants:

```typescript
// Type 1: Returns world
type SystemFunction = (world: IWorld, delta: number) => IWorld;

// Type 2: Returns world with gameTime
type ExtendedSystemFunction = (world: IWorld, delta: number, gameTime: number) => IWorld | void;

// Type 3: Only takes world
type WorldOnlySystemFunction = (world: IWorld) => IWorld | void;

// Type 4: Object with update method
interface SystemWithUpdate {
  update: (world: IWorld, ...args: number[]) => IWorld | void;
}
```

The `SystemManager` handles all these, but the variety makes it harder to:
- Understand what a system needs
- Know what pattern to follow when creating new systems
- Predict system behavior

---

## Current System Signatures

| System | File | Pattern | Returns | Needs Delta | Needs GameTime |
|--------|------|---------|---------|-------------|----------------|
| `movementSystem` | movementSystem.ts | function | world | ✅ | ❌ |
| `aiSystem` | aiSystem.ts | function | world | ✅ | ✅ |
| `combatSystem` | combatSystem.ts | object | world | ✅ | ✅ |
| `damageSystem` | damageSystem.ts | object | world | ❌ | ❌ |
| `collisionSystem` | collisionSystem.ts | object | world | ❌ | ❌ |
| `targetingSystem` | targetingSystem.ts | function | void | ❌ | ❌ |
| `renderSystem` | renderSystem.ts | function | void | ❌ | ❌ |
| `projectileSystem` | projectileSystem.ts | object | world | ✅ | ✅ |
| `statusEffectSystem` | statusEffectSystem.ts | function | world | ✅ | ✅ |

---

## Recommended Actions

### 1. Define Single Canonical System Interface

```typescript
// src/systems/types.ts

import { IWorld } from 'bitecs';

/**
 * Context provided to all systems during update.
 * Encapsulates all timing and state information systems might need.
 */
export interface SystemContext {
  /** Time since last frame in seconds */
  delta: number;
  
  /** Total game time since start in seconds */
  gameTime: number;
  
  /** Current game state (for conditional logic) */
  isPaused: boolean;
  
  /** Speed multiplier (for slow motion effects) */
  timeScale: number;
}

/**
 * Standard system interface.
 * All systems should implement this interface.
 */
export interface System {
  /** Unique name for debugging and registration */
  readonly name: string;
  
  /** Execution priority (lower runs first) */
  readonly priority: number;
  
  /**
   * Update the system for one frame.
   * 
   * @param world - The ECS world
   * @param ctx - Timing and state context
   * @returns The world (for chaining) or void
   */
  update(world: IWorld, ctx: SystemContext): IWorld | void;
  
  /**
   * Optional cleanup when system is disabled or game ends.
   */
  destroy?(): void;
  
  /**
   * Optional: Whether this system should run when paused.
   * Default: false
   */
  runWhenPaused?: boolean;
}
```

### 2. Create System Base Class

```typescript
// src/systems/BaseSystem.ts

import { IWorld } from 'bitecs';
import { System, SystemContext } from './types';

/**
 * Abstract base class for systems.
 * Provides common functionality and enforces interface.
 */
export abstract class BaseSystem implements System {
  abstract readonly name: string;
  abstract readonly priority: number;
  
  runWhenPaused = false;
  
  abstract update(world: IWorld, ctx: SystemContext): IWorld | void;
  
  /**
   * Default no-op destroy. Override if cleanup needed.
   */
  destroy(): void {
    // Override in subclass if needed
  }
}
```

### 3. Refactor Systems to New Pattern

**Before (combatSystem.ts):**
```typescript
export function createCombatSystem(particleSystem?: ParticleSystem) {
  const activeBeams: BeamVisual[] = [];
  // ... state
  
  function combatSystem(world: IWorld, _deltaTime: number, currentTime: number): IWorld {
    // ... logic
    return world;
  }
  
  return {
    update: combatSystem,
    getActiveBeams: () => activeBeams,
    getStats,
    resetStats,
  };
}
```

**After (combatSystem.ts):**
```typescript
import { BaseSystem, SystemContext } from './types';

export interface CombatSystemOptions {
  particleSystem?: ParticleSystem;
}

export class CombatSystem extends BaseSystem {
  readonly name = 'combat';
  readonly priority = 300;
  
  private activeBeams: BeamVisual[] = [];
  private particleSystem?: ParticleSystem;
  private stats: CombatStats = { /* ... */ };
  
  constructor(options: CombatSystemOptions = {}) {
    super();
    this.particleSystem = options.particleSystem;
  }
  
  update(world: IWorld, ctx: SystemContext): IWorld {
    this.activeBeams.length = 0;
    
    const turrets = combatQuery(world);
    for (const turretEid of turrets) {
      // Use ctx.gameTime instead of separate parameter
      this.processTurret(world, turretEid, ctx);
    }
    
    return world;
  }
  
  private processTurret(world: IWorld, eid: number, ctx: SystemContext): void {
    // ... combat logic using ctx.gameTime
  }
  
  getActiveBeams(): readonly BeamVisual[] {
    return this.activeBeams;
  }
  
  getStats(): Readonly<CombatStats> {
    return { ...this.stats };
  }
  
  resetStats(): void {
    this.stats = { totalDamageDealt: 0, /* ... */ };
  }
  
  destroy(): void {
    this.activeBeams.length = 0;
  }
}

// Factory function for backwards compatibility
export function createCombatSystem(particleSystem?: ParticleSystem): CombatSystem {
  return new CombatSystem({ particleSystem });
}
```

### 4. Update SystemManager to Use New Interface

```typescript
// src/systems/SystemManager.ts

import { IWorld } from 'bitecs';
import { System, SystemContext } from './types';

export class SystemManager {
  private systems: Map<string, System> = new Map();
  private sortedSystems: System[] = [];
  private needsSort = false;
  
  /**
   * Register a system.
   * 
   * @param system - System instance implementing System interface
   */
  register(system: System): void {
    if (this.systems.has(system.name)) {
      console.warn(`System "${system.name}" already registered. Overwriting.`);
    }
    this.systems.set(system.name, system);
    this.needsSort = true;
  }
  
  /**
   * Run all enabled systems.
   */
  run(world: IWorld, ctx: SystemContext): IWorld {
    this.ensureSorted();
    
    let currentWorld = world;
    
    for (const system of this.sortedSystems) {
      // Skip paused systems unless they opt in
      if (ctx.isPaused && !system.runWhenPaused) {
        continue;
      }
      
      try {
        const result = system.update(currentWorld, ctx);
        if (result) {
          currentWorld = result;
        }
      } catch (error) {
        console.error(`Error in system "${system.name}":`, error);
      }
    }
    
    return currentWorld;
  }
  
  /**
   * Get a specific system by name (for accessing system-specific methods).
   */
  get<T extends System>(name: string): T | undefined {
    return this.systems.get(name) as T | undefined;
  }
  
  private ensureSorted(): void {
    if (this.needsSort) {
      this.sortedSystems = Array.from(this.systems.values())
        .sort((a, b) => a.priority - b.priority);
      this.needsSort = false;
    }
  }
  
  destroy(): void {
    for (const system of this.systems.values()) {
      system.destroy?.();
    }
    this.systems.clear();
    this.sortedSystems = [];
  }
}
```

### 5. Create System Context Helper

```typescript
// src/systems/context.ts

import { SystemContext } from './types';

/**
 * Creates a system context from game loop values.
 */
export function createContext(
  delta: number,
  gameTime: number,
  options: { isPaused?: boolean; timeScale?: number } = {}
): SystemContext {
  return {
    delta,
    gameTime,
    isPaused: options.isPaused ?? false,
    timeScale: options.timeScale ?? 1.0,
  };
}
```

---

## Migration Path

1. **Week 1:** Create new types and base class
2. **Week 2:** Convert 2-3 systems to new pattern with backwards-compat wrappers
3. **Week 3:** Convert remaining systems
4. **Week 4:** Remove legacy SystemManager code

---

## Benefits for AI Coding

1. **Predictable Pattern** - AI knows exactly what a system looks like
2. **Clear Context** - All timing info in one `ctx` object
3. **Type Safety** - Interface enforces correct implementation
4. **Discoverable API** - `system.name`, `system.priority` always available
5. **Lifecycle Hooks** - `destroy()` ensures proper cleanup

---

## Verification

- [ ] All systems implement System interface
- [ ] SystemContext provides all needed timing info
- [ ] Game loop correctly creates and passes context
- [ ] No performance regression
- [ ] All tests pass

---

## Dependencies

- None - can start immediately
- File decomposition task may affect which file systems go in
