# Refactor Task: Entity Pool Integration

**Date:** December 7, 2025  
**Priority:** 🟠 High  
**Complexity:** Medium  
**Estimated Effort:** 3-4 hours  

---

## Problem Statement

`src/ecs/entityPool.ts` contains a fully implemented `EntityPool` class designed to prevent GC spikes by pre-allocating entities. However, **it is never used anywhere in the codebase**.

### Current State

All entity creation goes through `addEntity()` directly:

```typescript
// entityFactory.ts - current pattern
export function createKlingonShip(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);  // Direct allocation - causes GC
  // ... add components ...
  return eid;
}
```

### EntityPool Capabilities (Unused)

```typescript
// entityPool.ts - exists but unused
export class EntityPool {
  constructor(world: GameWorld, initialSize: number = 10000) { ... }
  acquire(): number { ... }      // Get entity from pool
  release(eid: number): void { ... }  // Return to pool
  expand(count: number): void { ... }  // Grow pool
}
```

---

## Impact

- **GC Spikes:** Every enemy spawn allocates memory
- **Frame Drops:** Noticeable during wave starts with many spawns
- **Wasted Code:** 120 lines of pool code sitting unused
- **Performance:** Could handle 10,000+ entities smoothly with pooling

---

## Proposed Solution

Integrate EntityPool into the entity creation and destruction flow:

1. Create pool during game initialization
2. Modify entityFactory to use pool
3. Modify damageSystem to return entities to pool
4. Add pool monitoring to debug overlay

---

## Implementation

### Step 1: Create Pool Manager

```typescript
// src/ecs/PoolManager.ts
import { EntityPool } from './entityPool';
import type { GameWorld } from './world';

/**
 * Singleton manager for entity pools
 * Separates pools by entity type for better memory management
 */
export class PoolManager {
  private static instance: PoolManager | null = null;
  
  private enemyPool: EntityPool | null = null;
  private projectilePool: EntityPool | null = null;
  private effectPool: EntityPool | null = null;
  
  private world: GameWorld | null = null;

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  /**
   * Initialize pools with the game world
   * Call once during game initialization
   */
  init(world: GameWorld): void {
    this.world = world;
    
    // Pre-allocate pools based on expected usage
    this.enemyPool = new EntityPool(world, 500);      // Enemies
    this.projectilePool = new EntityPool(world, 1000); // Projectiles
    this.effectPool = new EntityPool(world, 200);      // Particles/effects
    
    console.log('PoolManager initialized with pre-allocated entities');
  }

  /**
   * Acquire an entity for enemy use
   */
  acquireEnemy(): number {
    if (!this.enemyPool) throw new Error('PoolManager not initialized');
    return this.enemyPool.acquire();
  }

  /**
   * Acquire an entity for projectile use
   */
  acquireProjectile(): number {
    if (!this.projectilePool) throw new Error('PoolManager not initialized');
    return this.projectilePool.acquire();
  }

  /**
   * Release an enemy entity back to pool
   */
  releaseEnemy(eid: number): void {
    this.enemyPool?.release(eid);
  }

  /**
   * Release a projectile entity back to pool
   */
  releaseProjectile(eid: number): void {
    this.projectilePool?.release(eid);
  }

  /**
   * Get pool statistics for debugging
   */
  getStats(): {
    enemies: { available: number; inUse: number };
    projectiles: { available: number; inUse: number };
  } {
    return {
      enemies: {
        available: this.enemyPool?.getAvailableCount() ?? 0,
        inUse: this.enemyPool?.getInUseCount() ?? 0
      },
      projectiles: {
        available: this.projectilePool?.getAvailableCount() ?? 0,
        inUse: this.projectilePool?.getInUseCount() ?? 0
      }
    };
  }

  /**
   * Clear all pools (for game restart)
   */
  clear(): void {
    this.enemyPool?.clear();
    this.projectilePool?.clear();
    this.effectPool?.clear();
  }

  /**
   * Destroy pools and reset singleton
   */
  destroy(): void {
    this.enemyPool?.destroy();
    this.projectilePool?.destroy();
    this.effectPool?.destroy();
    this.world = null;
    PoolManager.instance = null;
  }
}
```

### Step 2: Update EntityFactory

```typescript
// src/ecs/entityFactory.ts

import { PoolManager } from './PoolManager';

// Add flag to control pooling (for gradual rollout)
const USE_POOLING = true;

/**
 * Creates a Klingon ship entity
 */
export function createKlingonShip(world: GameWorld, x: number, y: number): number {
  // Use pool if enabled, otherwise direct allocation
  const eid = USE_POOLING 
    ? PoolManager.getInstance().acquireEnemy()
    : addEntity(world);

  // Clear any existing component data (important for recycled entities!)
  resetEntityComponents(eid);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  // ... rest of component setup ...

  if (!USE_POOLING) incrementEntityCount();
  return eid;
}

/**
 * Reset component values for a recycled entity
 */
function resetEntityComponents(eid: number): void {
  // Reset all component arrays to default values
  Position.x[eid] = 0;
  Position.y[eid] = 0;
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;
  Health.current[eid] = 0;
  Health.max[eid] = 0;
  Shield.current[eid] = 0;
  Shield.max[eid] = 0;
  // ... reset other components ...
}

/**
 * Creates a projectile entity
 */
export function createProjectile(
  world: GameWorld,
  x: number, y: number,
  targetX: number, targetY: number,
  damage: number,
  projectileType: number,
  targetEntityId: number = 0
): number {
  const eid = USE_POOLING
    ? PoolManager.getInstance().acquireProjectile()
    : addEntity(world);

  resetEntityComponents(eid);
  
  // ... component setup ...

  if (!USE_POOLING) incrementEntityCount();
  return eid;
}
```

### Step 3: Update DamageSystem

```typescript
// src/systems/damageSystem.ts

import { PoolManager } from '../ecs/PoolManager';
import { FactionId } from '../types/constants';

export function createDamageSystem(particleSystem?: ParticleSystem) {
  const poolManager = PoolManager.getInstance();

  function damageSystem(world: IWorld): IWorld {
    const entities = healthQuery(world);

    for (const eid of entities) {
      if (Health.current[eid] > 0) continue;

      const factionId = Faction.id[eid];
      
      // ... explosion effects, events ...

      // Return to appropriate pool instead of removing
      if (factionId !== FactionId.FEDERATION && factionId !== FactionId.PROJECTILE) {
        // Enemy entity
        poolManager.releaseEnemy(eid);
      } else if (factionId === FactionId.PROJECTILE) {
        // Projectile entity
        poolManager.releaseProjectile(eid);
      } else {
        // Federation entities (turrets, Kobayashi Maru) - actually remove
        removeEntity(world, eid);
        decrementEntityCount();
      }
    }

    return world;
  }

  return { update: damageSystem, /* ... */ };
}
```

### Step 4: Update ProjectileSystem

```typescript
// src/systems/projectileSystem.ts

import { PoolManager } from '../ecs/PoolManager';

export function createProjectileSystem(spatialHash: SpatialHash) {
  const poolManager = PoolManager.getInstance();

  function projectileSystem(world: IWorld, deltaTime: number): IWorld {
    const projectiles = projectileQuery(world);

    for (const eid of projectiles) {
      // Lifetime expired
      if (Projectile.lifetime[eid] <= 0) {
        poolManager.releaseProjectile(eid);  // Return to pool
        continue;
      }

      // ... collision detection ...

      if (hit) {
        poolManager.releaseProjectile(eid);  // Return to pool
      }
    }

    return world;
  }

  return { update: projectileSystem, /* ... */ };
}
```

### Step 5: Initialize in Game.ts

```typescript
// src/core/Game.ts

import { PoolManager } from '../ecs/PoolManager';

async init(): Promise<void> {
  // ... PixiJS init ...
  
  this.world = createGameWorld();
  
  // Initialize entity pools BEFORE creating any entities
  PoolManager.getInstance().init(this.world);
  
  // ... rest of initialization ...
}

restart(): void {
  // Clear pools (returns all entities to available)
  PoolManager.getInstance().clear();
  
  // ... rest of restart logic ...
}

destroy(): void {
  PoolManager.getInstance().destroy();
  // ... cleanup ...
}
```

### Step 6: Add Debug Stats

```typescript
// In DebugManager.ts - add pool stats display
updatePoolStats(): void {
  const stats = PoolManager.getInstance().getStats();
  this.poolStatsText.text = 
    `Enemies: ${stats.enemies.inUse}/${stats.enemies.available + stats.enemies.inUse}\n` +
    `Projectiles: ${stats.projectiles.inUse}/${stats.projectiles.available + stats.projectiles.inUse}`;
}
```

---

## Validation Criteria

1. **No GC spikes** during wave spawns (verify with Chrome DevTools)
2. **Pool reuse working** - available count decreases on spawn, increases on death
3. **Entity recycling correct** - no stale component data
4. **All tests pass** - existing functionality unchanged
5. **Memory stable** - no growth over multiple waves

---

## Testing Strategy

1. Unit test PoolManager acquire/release
2. Test entity component reset
3. Profile GC with Chrome DevTools before/after
4. Stress test with 500+ enemies
5. Test game restart clears pools correctly

---

## Performance Metrics

| Metric | Before | Target |
|--------|--------|--------|
| GC during wave spawn | ~50ms | <5ms |
| Entity creation time | ~0.5ms | ~0.1ms |
| Memory growth per wave | +2MB | ~0MB |

---

## Files to Create

- `src/ecs/PoolManager.ts`

## Files to Modify

- `src/ecs/entityFactory.ts` - Use pool for entity creation
- `src/ecs/entityPool.ts` - Add component reset helper
- `src/systems/damageSystem.ts` - Return entities to pool
- `src/systems/projectileSystem.ts` - Return projectiles to pool
- `src/core/Game.ts` - Initialize and manage pools
- `src/core/DebugManager.ts` - Display pool stats
- `src/ecs/index.ts` - Export PoolManager
