# Chore Task 04: Adopt DamageService in Combat System

**Date:** 2025-12-11  
**Priority:** P2 (Medium Impact, Low Risk)  
**Estimated Effort:** 1 hour  
**Risk Level:** LOW - Consolidation of existing logic

---

## Problem Statement

The codebase has duplicate damage application logic:

### Location 1: `src/services/DamageService.ts` (Centralized)
```typescript
export function applyDamage(world: World, entityId: number, damage: number): number {
    let totalDamageDealt = 0;

    // Apply damage to shields first
    if (hasComponent(world, entityId, Shield)) {
        const currentShield = Shield.current[entityId];
        if (currentShield > 0) {
            const shieldDamage = Math.min(currentShield, damage);
            Shield.current[entityId] = currentShield - shieldDamage;
            damage -= shieldDamage;
            totalDamageDealt += shieldDamage;
        }
    }

    // Apply remaining damage to health
    if (damage > 0 && hasComponent(world, entityId, Health)) {
        const currentHealth = Health.current[entityId];
        const healthDamage = Math.min(currentHealth, damage);
        Health.current[entityId] = currentHealth - healthDamage;
        totalDamageDealt += healthDamage;
    }

    return totalDamageDealt;
}
```

### Location 2: `src/systems/combatSystem.ts` (Duplicate)
```typescript
function applyDamage(world: World, entityId: number, damage: number, hitX: number, hitY: number, currentTime: number, turretEid: number): number {
    // Similar logic but with:
    // - WeaponProperties multipliers
    // - Particle effects
    // - Status effect application
    // - Stats tracking
}
```

**Problem:** 
- Code duplication
- Inconsistent damage handling
- Hard to modify damage logic globally

---

## Solution

Extend `DamageService` to support weapon properties and use it in `combatSystem.ts`.

---

## Implementation

### Step 1: Extend DamageService

**File:** `src/services/DamageService.ts`

```typescript
/**
 * Damage Service for Kobayashi Maru
 * 
 * Centralized damage application logic.
 */
import { hasComponent, World } from 'bitecs';
import { Health, Shield, WeaponProperties } from '../ecs/components';

export interface DamageResult {
    totalDamage: number;
    shieldDamage: number;
    healthDamage: number;
    killed: boolean;
}

export interface DamageOptions {
    /** Source entity ID (for weapon properties lookup) */
    sourceEntityId?: number;
    /** Override shield damage multiplier */
    shieldMultiplier?: number;
    /** Override hull damage multiplier */
    hullMultiplier?: number;
}

/**
 * Applies damage to an entity with optional weapon modifiers.
 */
export function applyDamageWithOptions(
    world: World, 
    entityId: number, 
    baseDamage: number,
    options: DamageOptions = {}
): DamageResult {
    let shieldDamage = 0;
    let healthDamage = 0;
    let damage = baseDamage;

    // Get weapon property multipliers if source entity provided
    let shieldMult = options.shieldMultiplier ?? 1.0;
    let hullMult = options.hullMultiplier ?? 1.0;

    if (options.sourceEntityId !== undefined && hasComponent(world, options.sourceEntityId, WeaponProperties)) {
        shieldMult = WeaponProperties.shieldDamageMultiplier[options.sourceEntityId] || 1.0;
        hullMult = WeaponProperties.hullDamageMultiplier[options.sourceEntityId] || 1.0;
    }

    // Check if target has shields
    const hasShields = hasComponent(world, entityId, Shield) && Shield.current[entityId] > 0;

    // Apply appropriate multiplier
    if (hasShields) {
        damage *= shieldMult;
    } else {
        damage *= hullMult;
    }

    // Apply damage to shields first
    if (hasComponent(world, entityId, Shield)) {
        const currentShield = Shield.current[entityId];
        if (currentShield > 0) {
            shieldDamage = Math.min(currentShield, damage);
            Shield.current[entityId] = currentShield - shieldDamage;
            damage -= shieldDamage;
        }
    }

    // Apply remaining damage to health
    if (damage > 0 && hasComponent(world, entityId, Health)) {
        const currentHealth = Health.current[entityId];
        healthDamage = Math.min(currentHealth, damage);
        Health.current[entityId] = currentHealth - healthDamage;
    }

    const killed = hasComponent(world, entityId, Health) && Health.current[entityId] <= 0;

    return {
        totalDamage: shieldDamage + healthDamage,
        shieldDamage,
        healthDamage,
        killed
    };
}

// Keep original functions for backward compatibility
export function applyDamage(world: World, entityId: number, damage: number): number {
    const result = applyDamageWithOptions(world, entityId, damage);
    return result.totalDamage;
}

export function applyDamageDetailed(world: World, entityId: number, damage: number): DamageResult {
    return applyDamageWithOptions(world, entityId, damage);
}
```

### Step 2: Update Combat System

**File:** `src/systems/combatSystem.ts`

```typescript
// Before: Local applyDamage function (50+ lines)
function applyDamage(world: World, entityId: number, damage: number, hitX: number, hitY: number, currentTime: number, turretEid: number): number {
    // ... complex logic
}

// After: Use DamageService
import { applyDamageWithOptions, DamageResult } from '../services/DamageService';

function handleDamage(
    world: World, 
    targetEid: number, 
    damage: number, 
    hitX: number, 
    hitY: number, 
    currentTime: number, 
    turretEid: number
): number {
    // Apply damage using centralized service
    const result = applyDamageWithOptions(world, targetEid, damage, {
        sourceEntityId: turretEid
    });

    // Handle visual effects (shield hit)
    if (result.shieldDamage > 0 && particleSystem) {
        const targetX = Position.x[targetEid];
        const targetY = Position.y[targetEid];
        const angle = Math.atan2(hitY - targetY, hitX - targetX);

        particleSystem.spawn({
            ...EFFECTS.SHIELD_HIT,
            x: hitX,
            y: hitY,
            spread: angle
        });
    }

    // Apply status effects
    if (hasComponent(world, turretEid, WeaponProperties)) {
        const statusType = WeaponProperties.statusEffectType[turretEid];
        const statusChance = WeaponProperties.statusEffectChance[turretEid];

        if (statusType > 0 && Math.random() < statusChance) {
            if (statusType === 1) {
                applyBurning(world, targetEid, 4.0, 5.0);
            } else if (statusType === 3) {
                applyDrained(world, targetEid, 3.0);
            }
        }
    }

    // Track stats
    totalDamageDealt += result.totalDamage;
    shotsHit++;
    damageHistory.push({ time: currentTime, damage: result.totalDamage });
    damageHistory = damageHistory.filter(entry => currentTime - entry.time < DPS_WINDOW);

    return result.totalDamage;
}
```

---

## Test Coverage Required

### Update `src/__tests__/DamageService.test.ts` (NEW or UPDATE)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity, addComponent } from 'bitecs';
import { Health, Shield, WeaponProperties } from '../ecs/components';
import { applyDamage, applyDamageWithOptions, applyDamageDetailed } from '../services/DamageService';

describe('DamageService', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
    });

    describe('applyDamage', () => {
        it('should damage shields first', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            addComponent(world, eid, Shield);
            Health.current[eid] = 100;
            Health.max[eid] = 100;
            Shield.current[eid] = 50;
            Shield.max[eid] = 50;

            const dealt = applyDamage(world, eid, 30);

            expect(dealt).toBe(30);
            expect(Shield.current[eid]).toBe(20);
            expect(Health.current[eid]).toBe(100);
        });

        it('should overflow to health when shields depleted', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            addComponent(world, eid, Shield);
            Health.current[eid] = 100;
            Shield.current[eid] = 20;

            const dealt = applyDamage(world, eid, 50);

            expect(dealt).toBe(50);
            expect(Shield.current[eid]).toBe(0);
            expect(Health.current[eid]).toBe(70);
        });
    });

    describe('applyDamageWithOptions', () => {
        it('should apply shield damage multiplier', () => {
            const eid = addEntity(world);
            const sourceEid = addEntity(world);
            
            addComponent(world, eid, Health);
            addComponent(world, eid, Shield);
            Health.current[eid] = 100;
            Shield.current[eid] = 100;

            addComponent(world, sourceEid, WeaponProperties);
            WeaponProperties.shieldDamageMultiplier[sourceEid] = 3.0;
            WeaponProperties.hullDamageMultiplier[sourceEid] = 0.5;

            const result = applyDamageWithOptions(world, eid, 10, { sourceEntityId: sourceEid });

            // 10 * 3.0 = 30 damage to shields
            expect(result.shieldDamage).toBe(30);
            expect(Shield.current[eid]).toBe(70);
        });

        it('should apply hull damage multiplier when shields down', () => {
            const eid = addEntity(world);
            const sourceEid = addEntity(world);
            
            addComponent(world, eid, Health);
            addComponent(world, eid, Shield);
            Health.current[eid] = 100;
            Shield.current[eid] = 0;

            addComponent(world, sourceEid, WeaponProperties);
            WeaponProperties.shieldDamageMultiplier[sourceEid] = 3.0;
            WeaponProperties.hullDamageMultiplier[sourceEid] = 0.5;

            const result = applyDamageWithOptions(world, eid, 10, { sourceEntityId: sourceEid });

            // 10 * 0.5 = 5 damage to health
            expect(result.healthDamage).toBe(5);
            expect(Health.current[eid]).toBe(95);
        });

        it('should report killed status', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 10;

            const result = applyDamageWithOptions(world, eid, 20);

            expect(result.killed).toBe(true);
            expect(Health.current[eid]).toBe(0);
        });
    });
});
```

---

## Verification Checklist

- [ ] Extend `src/services/DamageService.ts` with `applyDamageWithOptions`
- [ ] Update `src/systems/combatSystem.ts` to use DamageService
- [ ] Create/update `src/__tests__/DamageService.test.ts`
- [ ] Verify existing combat tests still pass
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] Combat damage works correctly (manual test)

---

## AI Agent Instructions

1. Add `applyDamageWithOptions` to DamageService
2. Update combatSystem to use the new function
3. Keep particle effects and status effects in combatSystem (they're combat-specific)
4. Add comprehensive tests for the new function
5. Run all verification commands
6. Test combat in browser to verify damage works

---

## Benefits

1. **Single Source of Truth** - Damage logic in one place
2. **Testability** - DamageService can be unit tested in isolation
3. **Extensibility** - Easy to add new damage modifiers
4. **Consistency** - All systems use same damage calculation
