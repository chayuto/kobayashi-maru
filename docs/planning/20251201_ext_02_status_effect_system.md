# Status Effect System

**Date:** December 1, 2025  
**Priority:** HIGH  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 01 (Status Effect Components)  
**Phase:** 1 - Week 1

## Objective

Create a system that processes all status effects each frame: applies DOT damage, modifies velocity for slows, handles duration/expiration, and manages stacking.

## Current State

**What Exists:**
- ✅ Status effect components defined (Task 01)
- ✅ Damage system in `src/systems/damageSystem.ts`
- ✅ Velocity component for movement

**What's Missing:**
- ❌ System to process status effects
- ❌ Status effect application logic
- ❌ Status effect expiration logic
- ❌ Visual feedback for status effects

## Implementation

### File: `src/systems/statusEffectSystem.ts` (new)

```typescript
/**
 * Status Effect System
 * Processes burning, slowed, drained, and disabled status effects
 */
import { defineQuery, removeComponent } from 'bitecs';
import type { World } from '../types';
import {
  BurningStatus,
  SlowedStatus,
  DrainedStatus,
  DisabledStatus,
  Health,
  Velocity,
  Enemy
} from '../ecs/components';

// Queries for entities with status effects
const burningQuery = defineQuery([BurningStatus, Health, Enemy]);
const slowedQuery = defineQuery([SlowedStatus, Velocity, Enemy]);
const drainedQuery = defineQuery([DrainedStatus, Velocity, Enemy]);
const disabledQuery = defineQuery([DisabledStatus, Enemy]);

/**
 * Process all status effects
 */
export function statusEffectSystem(world: World, deltaTime: number): void {
  processBurning(world, deltaTime);
  processSlowed(world, deltaTime);
  processDrained(world, deltaTime);
  processDisabled(world, deltaTime);
}

/**
 * Process burning status - Apply DOT damage
 */
function processBurning(world: World, deltaTime: number): void {
  const entities = burningQuery(world);
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    // Update tick timer
    BurningStatus.lastTickTime[eid] += deltaTime;
    
    // Check if it's time for next tick
    if (BurningStatus.lastTickTime[eid] >= BurningStatus.tickInterval[eid]) {
      // Apply damage
      const damage = BurningStatus.damagePerTick[eid];
      Health.current[eid] = Math.max(0, Health.current[eid] - damage);
      
      // Decrement ticks
      BurningStatus.ticksRemaining[eid]--;
      BurningStatus.lastTickTime[eid] = 0;
      
      // Remove if expired
      if (BurningStatus.ticksRemaining[eid] <= 0) {
        removeComponent(world, BurningStatus, eid);
      }
    }
  }
}

/**
 * Process slowed status - Reduce movement speed
 */
function processSlowed(world: World, deltaTime: number): void {
  const entities = slowedQuery(world);
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    // Decrement duration
    SlowedStatus.duration[eid] -= deltaTime;
    
    // Remove if expired
    if (SlowedStatus.duration[eid] <= 0) {
      // Restore original speed
      const originalSpeed = SlowedStatus.originalSpeed[eid];
      Velocity.x[eid] = (Velocity.x[eid] / (1 - SlowedStatus.slowPercent[eid])) * originalSpeed;
      Velocity.y[eid] = (Velocity.y[eid] / (1 - SlowedStatus.slowPercent[eid])) * originalSpeed;
      
      removeComponent(world, SlowedStatus, eid);
    }
  }
}

/**
 * Process drained status - Stacking speed reduction
 */
function processDrained(world: World, deltaTime: number): void {
  const entities = drainedQuery(world);
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    // Decrement duration
    DrainedStatus.duration[eid] -= deltaTime;
    
    // Remove if expired
    if (DrainedStatus.duration[eid] <= 0) {
      // Reduce stacks
      DrainedStatus.stacks[eid]--;
      
      if (DrainedStatus.stacks[eid] <= 0) {
        removeComponent(world, DrainedStatus, eid);
      } else {
        // Reset duration for remaining stacks
        DrainedStatus.duration[eid] = 3.0; // 3 second duration per stack
      }
    }
  }
}

/**
 * Process disabled status - Systems offline
 */
function processDisabled(world: World, deltaTime: number): void {
  const entities = disabledQuery(world);
  
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    
    // Decrement duration
    DisabledStatus.duration[eid] -= deltaTime;
    
    // Remove if expired
    if (DisabledStatus.duration[eid] <= 0) {
      removeComponent(world, DisabledStatus, eid);
    }
  }
}

/**
 * Apply burning status to an entity
 */
export function applyBurning(
  world: World,
  eid: number,
  damagePerTick: number,
  duration: number
): void {
  const tickInterval = 1.0; // 1 second per tick
  const ticks = Math.floor(duration / tickInterval);
  
  BurningStatus.damagePerTick[eid] = damagePerTick;
  BurningStatus.ticksRemaining[eid] = ticks;
  BurningStatus.tickInterval[eid] = tickInterval;
  BurningStatus.lastTickTime[eid] = 0;
}

/**
 * Apply slowed status to an entity
 */
export function applySlowed(
  world: World,
  eid: number,
  slowPercent: number,
  duration: number
): void {
  // Store original speed if not already slowed
  if (!SlowedStatus.originalSpeed[eid]) {
    const currentSpeed = Math.sqrt(
      Velocity.x[eid] ** 2 + Velocity.y[eid] ** 2
    );
    SlowedStatus.originalSpeed[eid] = currentSpeed;
  }
  
  SlowedStatus.slowPercent[eid] = slowPercent;
  SlowedStatus.duration[eid] = duration;
  
  // Apply slow to velocity
  const multiplier = 1 - slowPercent;
  Velocity.x[eid] *= multiplier;
  Velocity.y[eid] *= multiplier;
}

/**
 * Apply drained status to an entity (stacking)
 */
export function applyDrained(
  world: World,
  eid: number,
  duration: number
): void {
  const currentStacks = DrainedStatus.stacks[eid] || 0;
  const maxStacks = 3;
  
  DrainedStatus.stacks[eid] = Math.min(currentStacks + 1, maxStacks);
  DrainedStatus.duration[eid] = duration;
  
  // Apply speed reduction (10% per stack)
  const slowAmount = 0.1 * DrainedStatus.stacks[eid];
  Velocity.x[eid] *= (1 - slowAmount);
  Velocity.y[eid] *= (1 - slowAmount);
}

/**
 * Apply disabled status to an entity
 */
export function applyDisabled(
  world: World,
  eid: number,
  duration: number,
  systems: number = 1 // Default: weapons only
): void {
  DisabledStatus.duration[eid] = duration;
  DisabledStatus.disabledSystems[eid] = systems;
}
```

### File: `src/core/Game.ts` (modify)

Add status effect system to game loop:

```typescript
// Import
import { statusEffectSystem } from '../systems/statusEffectSystem';

// In update() method, add after movement system:
private update(): void {
  // ... existing systems
  
  // Process status effects
  statusEffectSystem(this.world, deltaTime);
  
  // ... rest of systems
}
```

## Testing

### Manual Testing Checklist

- [ ] Apply burning status - entity takes DOT damage
- [ ] Burning expires after duration
- [ ] Apply slowed status - entity moves slower
- [ ] Slowed expires and speed restored
- [ ] Apply drained status - stacks up to 3
- [ ] Drained reduces speed per stack
- [ ] Apply disabled status - expires after duration
- [ ] Multiple status effects can coexist
- [ ] Status effects removed when entity dies
- [ ] No performance issues with many status effects

### Debug Testing

Add temporary test code in Game.ts init():

```typescript
// Test status effects on first enemy
setTimeout(() => {
  const enemies = enemyQuery(this.world);
  if (enemies.length > 0) {
    const testEnemy = enemies[0];
    applyBurning(this.world, testEnemy, 5, 5); // 5 dmg/sec for 5 sec
    console.log('Applied burning to enemy', testEnemy);
  }
}, 5000);
```

## Success Criteria

- ✅ Status effect system processes all effects
- ✅ Burning applies DOT damage correctly
- ✅ Slowed reduces movement speed
- ✅ Drained stacks up to 3 times
- ✅ Disabled prevents actions (foundation for future)
- ✅ Status effects expire properly
- ✅ Helper functions for applying effects
- ✅ No performance degradation
- ✅ System integrated into game loop

## Notes for Agent

- System runs every frame, checks timers
- Use removeComponent() to clean up expired effects
- Slowed must restore original speed on expiration
- Drained uses stacking mechanic (max 3)
- Disabled is foundation for future weapon disable mechanics
- Keep performance in mind - this runs every frame

## Next Steps

After completing this task:
1. Task 03: Add visual feedback for status effects
2. Task 04: Integrate with weapon systems
3. Task 05: Add new weapons that use status effects

## Related Files

- `src/systems/statusEffectSystem.ts` (new)
- `src/core/Game.ts` (modify - add to game loop)
- `src/ecs/components.ts` (uses components from Task 01)
