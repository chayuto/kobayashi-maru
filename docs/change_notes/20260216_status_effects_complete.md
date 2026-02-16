# Status Effects System - Complete Implementation

**Date:** 2026-02-16
**Task:** G1 - Complete Status Effects System

## Summary

Completed the status effects system so all 4 status types (burn, slow, drain, disable) are fully wired end-to-end: from turret WeaponProperties through combatSystem application to event emission.

## Changes

### 1. `src/systems/combatSystem.ts`
- Added imports for `applySlowed` and `applyDisabled` from statusEffectSystem
- Added handling for status effect types 2 (slow) and 4 (disable) in the damage application block
  - Type 2: `applySlowed(world, entityId, 0.3, 3.0)` -- 30% slow for 3 seconds
  - Type 4: `applyDisabled(world, entityId, 2.0, 1)` -- 2 second weapon disable

### 2. `src/ecs/entityFactory.ts`
- Added WeaponProperties for **Phaser Array** (type 4 / disable, 5% chance)
- Added WeaponProperties for **Disruptor Bank** (type 2 / slow, 15% chance)
- Existing Plasma Cannon (burn) and Polaron Beam (drain) unchanged

### 3. `src/types/events.ts`
- Added `STATUS_EFFECT_APPLIED` and `STATUS_EFFECT_REMOVED` to `GameEventType` enum
- Added `StatusEffectAppliedPayload` interface (entityId, effectType, duration)
- Added `StatusEffectRemovedPayload` interface (entityId, effectType)
- Added both event types to `GameEventMap`

### 4. `src/systems/statusEffectSystem.ts`
- Added EventBus and GameEventType imports
- Emit `STATUS_EFFECT_APPLIED` in all 4 apply functions (applyBurning, applySlowed, applyDrained, applyDisabled)
- Emit `STATUS_EFFECT_REMOVED` in all 4 process functions when effects expire and components are removed

### 5. `src/__tests__/statusEffectsComplete.test.ts` (new)
- 21 tests covering:
  - WeaponProperties assignment for all turret types (Phaser, Disruptor, Plasma, Polaron, Tetryon)
  - Status effect application functions (burn, slow, drain, disable)
  - STATUS_EFFECT_APPLIED event emission for all 4 types
  - STATUS_EFFECT_REMOVED event emission for all 4 types
  - Status effect processing behavior (DOT damage, velocity reduction, stacking, bitmask)

## Validation

- `npm run lint` -- passes
- `npm run test` -- 2432 tests pass (109 files)
- `npm run build` -- TypeScript check + Vite build successful
