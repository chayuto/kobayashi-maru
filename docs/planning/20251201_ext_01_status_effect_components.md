# Status Effect Components

**Date:** December 1, 2025  
**Priority:** HIGH  
**Estimated Time:** 2-3 hours  
**Dependencies:** None  
**Phase:** 1 - Week 1

## Objective

Add bitECS component definitions for status effects (Burn, Slow, Drain) and weapon properties to support new weapon mechanics.

## Current State

**What Exists:**
- ✅ bitECS component system in `src/ecs/components.ts`
- ✅ Damage system that can be extended
- ✅ Weapon firing system

**What's Missing:**
- ❌ Status effect components
- ❌ Weapon property components for special mechanics
- ❌ Status effect tracking on entities

## Implementation

### File: `src/ecs/components.ts` (modify)

Add these component definitions at the end of the file:

```typescript
// ============================================================================
// STATUS EFFECT COMPONENTS
// ============================================================================

/**
 * Burning status - DOT damage over time
 * Used by: Plasma Cannon
 */
export const BurningStatus = defineComponent({
  damagePerTick: Types.f32,    // Damage dealt per tick
  ticksRemaining: Types.ui8,   // Number of ticks left
  tickInterval: Types.f32,     // Time between ticks (seconds)
  lastTickTime: Types.f32      // Last time damage was applied
});

/**
 * Slowed status - Reduces movement speed
 * Used by: Chroniton Torpedo, Polaron Beam
 */
export const SlowedStatus = defineComponent({
  slowPercent: Types.f32,      // 0.0 to 1.0 (0.5 = 50% slow)
  duration: Types.f32,         // Time remaining (seconds)
  originalSpeed: Types.f32     // Speed before slow applied
});

/**
 * Drained status - Stacking power drain
 * Used by: Polaron Beam Emitter
 */
export const DrainedStatus = defineComponent({
  stacks: Types.ui8,           // 0-3 stacks
  duration: Types.f32          // Time remaining per stack
});

/**
 * Disabled status - Systems offline
 * Used by: Phaser Array (5% chance)
 */
export const DisabledStatus = defineComponent({
  duration: Types.f32,         // Time remaining (seconds)
  disabledSystems: Types.ui8   // Bitfield: 1=weapons, 2=engines, 4=shields
});

// ============================================================================
// WEAPON PROPERTY COMPONENTS
// ============================================================================

/**
 * Extended weapon properties for special mechanics
 * Attached to turret entities
 */
export const WeaponProperties = defineComponent({
  shieldDamageMultiplier: Types.f32,  // Damage multiplier vs shields (default 1.0)
  hullDamageMultiplier: Types.f32,    // Damage multiplier vs hull (default 1.0)
  critChance: Types.f32,              // Critical hit chance 0.0-1.0
  critMultiplier: Types.f32,          // Critical damage multiplier (default 2.0)
  aoeRadius: Types.f32,               // AOE explosion radius (0 = no AOE)
  statusEffectType: Types.ui8,        // 0=none, 1=burn, 2=slow, 3=drain, 4=disable
  statusEffectChance: Types.f32       // Chance to apply status 0.0-1.0
});
```

## Testing

### Verification Checklist

- [ ] File compiles without TypeScript errors
- [ ] All components use proper bitECS Types
- [ ] Components are exported (defineComponent does this automatically)
- [ ] No naming conflicts with existing components
- [ ] Run `npm run build` successfully

### Integration Test

Create a simple test to verify components work:

```typescript
// In a test file or console
import { createWorld, addComponent } from 'bitecs';
import { BurningStatus, SlowedStatus } from './components';

const world = createWorld();
const eid = world.createEntity();

// Should not throw errors
addComponent(world, BurningStatus, eid);
BurningStatus.damagePerTick[eid] = 5.0;
console.log('Burning damage:', BurningStatus.damagePerTick[eid]); // Should log 5.0
```

## Success Criteria

- ✅ All 5 status effect components defined
- ✅ WeaponProperties component defined
- ✅ No TypeScript compilation errors
- ✅ Components follow bitECS best practices
- ✅ Proper JSDoc comments for each component
- ✅ Build passes

## Notes for Agent

- These are just component definitions - no systems yet
- Components use TypedArrays via bitECS Types
- Status effects will be processed by systems in next tasks
- WeaponProperties will be set when turrets are created
- Keep component data minimal (ECS best practice)

## Next Steps

After completing this task:
1. Task 02: Create Status Effect System
2. Task 03: Add Tetryon Beam weapon
3. Task 04: Add Plasma Cannon weapon

## Related Files

- `src/ecs/components.ts` (modify)
- Future: `src/systems/statusEffectSystem.ts` (will use these)
- Future: `src/systems/combatSystem.ts` (will use WeaponProperties)
