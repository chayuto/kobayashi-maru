# Refactor Task: Damage Service Extraction

**Date:** December 7, 2025  
**Priority:** 🔴 Critical  
**Complexity:** Medium  
**Estimated Effort:** 2-3 hours  

---

## Problem Statement

The `applyDamage()` function is duplicated across three files with slight variations:

1. **`src/systems/combatSystem.ts`** (lines 95-145)
   - Handles weapon properties (shield/hull multipliers)
   - Applies status effects
   - Spawns particle effects
   - Tracks combat stats

2. **`src/systems/projectileSystem.ts`** (lines 95-115)
   - Basic shield-then-health damage
   - No weapon properties
   - No particle effects
   - Comment: "Duplicated from combatSystem - should ideally be a shared utility"

3. **`src/systems/enemyProjectileSystem.ts`** (assumed similar pattern)
   - Handles enemy projectile damage to player entities

---

## Impact

- **Bug Risk:** Fixing damage calculation in one place doesn't fix others
- **Inconsistency:** Different damage behaviors for same scenarios
- **Maintenance:** 3x effort to modify damage logic
- **Testing:** Must test same logic in multiple places

---

## Proposed Solution

Create a centralized `DamageService` that handles all damage application:

### New File Structure

```
src/services/
├── DamageService.ts    (NEW)
├── StorageService.ts   (existing)
└── index.ts            (update exports)
```

---

## Implementation

### Step 1: Create DamageService.ts

```typescript
// src/services/DamageService.ts
import { IWorld, hasComponent } from 'bitecs';
import { Health, Shield, Position, WeaponProperties } from '../ecs/components';
import { ParticleSystem, EFFECTS } from '../rendering';

export interface DamageResult {
  totalDamage: number;
  shieldDamage: number;
  healthDamage: number;
  targetDestroyed: boolean;
}

export interface DamageOptions {
  /** Source entity ID (for weapon properties lookup) */
  sourceEntityId?: number;
  /** Position for visual effects */
  hitX?: number;
  hitY?: number;
  /** Particle system for effects */
  particleSystem?: ParticleSystem;
  /** Whether to apply status effects */
  applyStatusEffects?: boolean;
}

/**
 * Centralized damage application service
 * Handles shield/health priority, weapon modifiers, and visual effects
 */
export class DamageService {
  private static instance: DamageService | null = null;

  static getInstance(): DamageService {
    if (!DamageService.instance) {
      DamageService.instance = new DamageService();
    }
    return DamageService.instance;
  }

  /**
   * Apply damage to an entity
   * @param world - ECS world
   * @param targetId - Entity receiving damage
   * @param baseDamage - Base damage amount
   * @param options - Additional options for damage calculation
   * @returns Damage result with breakdown
   */
  applyDamage(
    world: IWorld,
    targetId: number,
    baseDamage: number,
    options: DamageOptions = {}
  ): DamageResult {
    const result: DamageResult = {
      totalDamage: 0,
      shieldDamage: 0,
      healthDamage: 0,
      targetDestroyed: false
    };

    // Calculate final damage with weapon modifiers
    let damage = this.calculateModifiedDamage(world, baseDamage, targetId, options.sourceEntityId);

    // Apply to shields first
    if (hasComponent(world, Shield, targetId)) {
      const currentShield = Shield.current[targetId];
      if (currentShield > 0) {
        const shieldDamage = Math.min(currentShield, damage);
        Shield.current[targetId] = currentShield - shieldDamage;
        result.shieldDamage = shieldDamage;
        damage -= shieldDamage;

        // Shield hit effect
        this.spawnShieldHitEffect(world, targetId, options);
      }
    }

    // Apply remaining to health
    if (damage > 0 && hasComponent(world, Health, targetId)) {
      const currentHealth = Health.current[targetId];
      const healthDamage = Math.min(currentHealth, damage);
      Health.current[targetId] = currentHealth - damage;
      result.healthDamage = healthDamage;

      if (Health.current[targetId] <= 0) {
        result.targetDestroyed = true;
      }
    }

    result.totalDamage = result.shieldDamage + result.healthDamage;

    // Apply status effects if enabled
    if (options.applyStatusEffects && options.sourceEntityId !== undefined) {
      this.applyStatusEffects(world, targetId, options.sourceEntityId);
    }

    return result;
  }

  /**
   * Calculate damage with weapon property modifiers
   */
  private calculateModifiedDamage(
    world: IWorld,
    baseDamage: number,
    targetId: number,
    sourceId?: number
  ): number {
    if (sourceId === undefined) return baseDamage;
    if (!hasComponent(world, WeaponProperties, sourceId)) return baseDamage;

    const hasShield = hasComponent(world, Shield, targetId) && Shield.current[targetId] > 0;

    if (hasShield) {
      const shieldMult = WeaponProperties.shieldDamageMultiplier[sourceId] || 1.0;
      return baseDamage * shieldMult;
    } else {
      const hullMult = WeaponProperties.hullDamageMultiplier[sourceId] || 1.0;
      return baseDamage * hullMult;
    }
  }

  /**
   * Spawn shield hit particle effect
   */
  private spawnShieldHitEffect(
    world: IWorld,
    targetId: number,
    options: DamageOptions
  ): void {
    if (!options.particleSystem || options.hitX === undefined || options.hitY === undefined) {
      return;
    }

    const targetX = Position.x[targetId];
    const targetY = Position.y[targetId];
    const angle = Math.atan2(options.hitY - targetY, options.hitX - targetX);

    options.particleSystem.spawn({
      ...EFFECTS.SHIELD_HIT,
      x: options.hitX,
      y: options.hitY,
      spread: angle
    });
  }

  /**
   * Apply status effects from weapon properties
   */
  private applyStatusEffects(world: IWorld, targetId: number, sourceId: number): void {
    if (!hasComponent(world, WeaponProperties, sourceId)) return;

    const statusType = WeaponProperties.statusEffectType[sourceId];
    const statusChance = WeaponProperties.statusEffectChance[sourceId];

    if (statusType > 0 && Math.random() < statusChance) {
      // Import and call status effect application
      // This avoids circular dependency by lazy importing
      import('./statusEffectHelpers').then(({ applyStatusByType }) => {
        applyStatusByType(world, targetId, statusType);
      });
    }
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    DamageService.instance = null;
  }
}

// Convenience function for quick access
export function applyDamage(
  world: IWorld,
  targetId: number,
  damage: number,
  options?: DamageOptions
): DamageResult {
  return DamageService.getInstance().applyDamage(world, targetId, damage, options);
}
```

### Step 2: Update combatSystem.ts

```typescript
// In combatSystem.ts - replace applyDamage function with import
import { applyDamage, DamageResult } from '../services/DamageService';

// In the combat loop:
const result = applyDamage(world, targetEid, damage, {
  sourceEntityId: turretEid,
  hitX: targetX,
  hitY: targetY,
  particleSystem,
  applyStatusEffects: true
});

// Track stats
totalDamageDealt += result.totalDamage;
shotsHit++;
```

### Step 3: Update projectileSystem.ts

```typescript
// In projectileSystem.ts - replace local applyDamage
import { applyDamage } from '../services/DamageService';

// In collision handling:
const result = applyDamage(world, targetEid, damage);
if (result.totalDamage > 0 && onHitCallback) {
  onHitCallback(result.totalDamage, gameTime);
}
```

### Step 4: Update enemyProjectileSystem.ts

```typescript
// Similar pattern - use centralized service
import { applyDamage } from '../services/DamageService';
```

---

## Validation Criteria

1. **All damage goes through DamageService**
2. **No duplicate applyDamage functions** in codebase
3. **Existing tests pass** without modification
4. **Damage behavior unchanged** - same shield/health priority
5. **Status effects still apply** correctly

---

## Testing Strategy

1. Unit test DamageService in isolation
2. Test shield-first damage priority
3. Test weapon property modifiers
4. Test status effect application
5. Integration test with combat and projectile systems

---

## Files to Create

- `src/services/DamageService.ts`
- `src/services/statusEffectHelpers.ts` (optional, for lazy loading)

## Files to Modify

- `src/systems/combatSystem.ts` - Remove local applyDamage, use service
- `src/systems/projectileSystem.ts` - Remove local applyDamage, use service
- `src/systems/enemyProjectileSystem.ts` - Use service
- `src/services/index.ts` - Export DamageService
