# Entity Factory and Component Patterns for AI Agents

**Date:** 2025-12-27  
**Category:** ECS Patterns  
**Priority:** HIGH  
**Effort:** Medium  

---

## Executive Summary

Consistent entity creation and component patterns are essential for AI coding agents working with the ECS architecture. This document outlines best practices for entity factories, component design, and template-driven entity creation.

---

## Current State Assessment

### ✅ Good ECS Patterns

1. **Generic Factory** - `createEnemy()` with templates
2. **Entity Templates** - Configuration-driven entity definitions
3. **Pool Manager** - Entity reuse for performance
4. **Component Separation** - Clear component definitions

### ⚠️ Enhancement Opportunities

1. **Deprecated Factories** - Old faction-specific functions remain
2. **Inconsistent Reset** - Not all components properly reset
3. **Template Coverage** - Not all entities use templates
4. **Component Docs** - Some components lack documentation

---

## Recommendations for AI Coding Agents

### 1. Template-Driven Entity Creation

**Recommendation:** Use templates for all entity types.

**Current Pattern (Good):**
```typescript
// src/ecs/entityTemplates.ts
export interface EnemyTemplate {
    faction: number;
    health: number;
    shield: number;
    speed: number;
    damage: number;
    behavior: AIBehaviorType;
    abilities?: AbilityType[];
    weapon?: WeaponConfig;
}

export const ENEMY_TEMPLATES: Record<number, EnemyTemplate> = {
    [FactionId.KLINGON]: {
        faction: FactionId.KLINGON,
        health: 80,
        shield: 30,
        speed: 60,
        damage: 10,
        behavior: AIBehaviorType.DIRECT,
    },
    [FactionId.ROMULAN]: {
        faction: FactionId.ROMULAN,
        health: 70,
        shield: 60,
        speed: 50,
        damage: 8,
        behavior: AIBehaviorType.STRAFE,
    },
    // ... more templates
};

// Usage
const enemy = createEnemy(world, FactionId.KLINGON, x, y);
```

**Extend to All Entity Types:**
```typescript
// Turret templates
export interface TurretTemplate {
    type: TurretType;
    range: number;
    fireRate: number;
    damage: number;
    cost: number;
    health: number;
    shield: number;
    weaponProperties?: WeaponPropertiesConfig;
}

// Projectile templates
export interface ProjectileTemplate {
    type: ProjectileType;
    speed: number;
    damage: number;
    lifetime: number;
    size: number;
    homing: boolean;
}

// Generic create function
function createFromTemplate<T extends EntityTemplate>(
    world: GameWorld,
    template: T,
    x: number,
    y: number
): number {
    const eid = PoolManager.getInstance().acquire(template.entityType);
    applyTemplate(eid, template, x, y);
    return eid;
}
```

**Why Agent-Friendly:**
- Entity configuration is data, not code
- Adding new entities doesn't require new functions
- Templates are easily auditable

**Action Items:**
- [ ] Create templates for turrets
- [ ] Create templates for projectiles
- [ ] Unify creation pattern

---

### 2. Component Design Guidelines

**Recommendation:** Follow consistent component patterns.

**Component Structure:**
```typescript
/**
 * Component for [description].
 * 
 * @property propertyName - Description with units
 * 
 * @example
 * ```typescript
 * // Setting values
 * ComponentName.property[entityId] = value;
 * 
 * // Reading values
 * const value = ComponentName.property[entityId];
 * ```
 */
export const ComponentName = {
    /** Description of property1 (units: pixels) */
    property1: [] as number[],
    
    /** Description of property2 (range: 0.0 to 1.0) */
    property2: [] as number[],
    
    /** Flags stored as 0/1 integers */
    isActive: [] as number[],
};
```

**Component Categories:**
```typescript
// 1. Transform Components (position, movement)
Position, Velocity, Rotation

// 2. Identity Components (what is this entity?)
Faction, SpriteRef, EnemyVariant

// 3. Combat Components (health, weapons)
Health, Shield, Turret, Projectile, EnemyWeapon

// 4. Behavior Components (AI, targeting)
AIBehavior, Target, SpecialAbility

// 5. Status Components (temporary effects)
BurningStatus, SlowedStatus, DrainedStatus, DisabledStatus

// 6. Upgrade Components (progression)
TurretUpgrade, WeaponProperties
```

**Why Agent-Friendly:**
- Clear component organization
- Predictable property access
- Categories guide where to add new components

**Action Items:**
- [ ] Document all components with JSDoc
- [ ] Group components by category
- [ ] Add usage examples

---

### 3. Entity Reset Patterns

**Recommendation:** Standardize component reset on entity reuse.

**Pattern:**
```typescript
// src/ecs/entityReset.ts

/**
 * Reset all components for an entity to default state.
 * Used when returning entity to pool.
 */
export function resetEntity(eid: number): void {
    // Transform
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;
    Rotation.angle[eid] = 0;
    
    // Identity
    Faction.id[eid] = 0;
    SpriteRef.index[eid] = 0;
    
    // Combat
    Health.current[eid] = 0;
    Health.max[eid] = 0;
    Shield.current[eid] = 0;
    Shield.max[eid] = 0;
    
    // Clear status effects
    resetStatusEffects(eid);
}

/**
 * Reset status effect components.
 */
function resetStatusEffects(eid: number): void {
    BurningStatus.damagePerTick[eid] = 0;
    BurningStatus.ticksRemaining[eid] = 0;
    SlowedStatus.slowPercent[eid] = 0;
    SlowedStatus.duration[eid] = 0;
    // ... other status effects
}

/**
 * Reset projectile-specific components.
 */
export function resetProjectile(eid: number): void {
    resetEntity(eid);
    Projectile.damage[eid] = 0;
    Projectile.speed[eid] = 0;
    Projectile.lifetime[eid] = 0;
    Projectile.targetEntityId[eid] = 0;
}
```

**Why Agent-Friendly:**
- Entity reuse is safe
- No stale component data
- Reset functions are composable

**Action Items:**
- [ ] Create reset functions for each entity type
- [ ] Use in PoolManager release
- [ ] Test reset completeness

---

### 4. Component Validation

**Recommendation:** Validate component state in development.

**Pattern:**
```typescript
// src/ecs/componentValidation.ts

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate entity has consistent component state.
 */
export function validateEntity(world: World, eid: number): ValidationResult {
    const errors: string[] = [];
    
    // Position should be within world bounds
    if (hasComponent(world, eid, Position)) {
        const x = Position.x[eid];
        const y = Position.y[eid];
        if (x < -100 || x > GAME_CONFIG.WORLD_WIDTH + 100) {
            errors.push(`Position.x out of bounds: ${x}`);
        }
        if (y < -100 || y > GAME_CONFIG.WORLD_HEIGHT + 100) {
            errors.push(`Position.y out of bounds: ${y}`);
        }
    }
    
    // Health should be non-negative and <= max
    if (hasComponent(world, eid, Health)) {
        const current = Health.current[eid];
        const max = Health.max[eid];
        if (current < 0) {
            errors.push(`Health.current is negative: ${current}`);
        }
        if (current > max) {
            errors.push(`Health.current exceeds max: ${current} > ${max}`);
        }
    }
    
    // Shield similar validation
    if (hasComponent(world, eid, Shield)) {
        const current = Shield.current[eid];
        const max = Shield.max[eid];
        if (current < 0 || current > max) {
            errors.push(`Shield values invalid: ${current}/${max}`);
        }
    }
    
    // Turret should have valid type
    if (hasComponent(world, eid, Turret)) {
        const type = Turret.turretType[eid];
        if (!TURRET_CONFIG[type]) {
            errors.push(`Invalid turret type: ${type}`);
        }
    }
    
    return { valid: errors.length === 0, errors };
}

// Use in development
if (import.meta.env.DEV) {
    const result = validateEntity(world, newEntity);
    if (!result.valid) {
        console.warn('Entity validation failed:', result.errors);
    }
}
```

**Why Agent-Friendly:**
- Catches invalid states early
- Clear error messages
- Development-only overhead

**Action Items:**
- [ ] Create validation for all entity types
- [ ] Add to entity creation in dev mode
- [ ] Log validation failures

---

### 5. Query Patterns

**Recommendation:** Standardize query definition and caching.

**Pattern:**
```typescript
// Define queries at module scope (cached by bitECS)
import { defineQuery, hasComponent } from 'bitecs';

// System-specific queries
const turretQuery = defineQuery([Position, Turret, Target, Faction]);
const enemyQuery = defineQuery([Position, Health, Faction, AIBehavior]);
const projectileQuery = defineQuery([Position, Velocity, Projectile]);

// Composite queries for specific behaviors
const burningEnemyQuery = defineQuery([Health, BurningStatus]);
const slowedEnemyQuery = defineQuery([Velocity, SlowedStatus]);

// Using queries in systems
function combatSystem(world: World): World {
    // Query returns array of entity IDs
    const turrets = turretQuery(world);
    
    for (let i = 0; i < turrets.length; i++) {
        const eid = turrets[i];
        // Process turret
    }
    
    return world;
}

// Filtering within query results
function processEnemies(world: World): void {
    const enemies = enemyQuery(world);
    
    for (let i = 0; i < enemies.length; i++) {
        const eid = enemies[i];
        
        // Skip if not hostile
        if (Faction.id[eid] === FactionId.FEDERATION) continue;
        
        // Additional component check
        if (hasComponent(world, eid, SpecialAbility)) {
            processAbility(world, eid);
        }
    }
}
```

**Why Agent-Friendly:**
- Queries are defined once
- Performance is optimal
- Pattern is consistent

**Action Items:**
- [ ] Ensure all queries use defineQuery
- [ ] Place at module scope
- [ ] Document query patterns

---

### 6. Entity Lifecycle Events

**Recommendation:** Emit events for entity lifecycle.

**Pattern:**
```typescript
// Entity lifecycle events
export enum EntityEventType {
    ENTITY_CREATED = 'ENTITY_CREATED',
    ENTITY_DESTROYED = 'ENTITY_DESTROYED',
    ENTITY_POOLED = 'ENTITY_POOLED',
    ENTITY_ACQUIRED = 'ENTITY_ACQUIRED',
}

// Event payloads
interface EntityCreatedPayload {
    entityId: number;
    entityType: 'enemy' | 'turret' | 'projectile' | 'effect';
    template?: string;
}

interface EntityDestroyedPayload {
    entityId: number;
    reason: 'killed' | 'expired' | 'sold' | 'cleanup';
}

// Emit in factory functions
export function createEnemy(world: GameWorld, factionId: number, x: number, y: number): number {
    const eid = PoolManager.getInstance().acquireEnemy();
    
    // Apply template...
    
    EventBus.getInstance().emit(EntityEventType.ENTITY_CREATED, {
        entityId: eid,
        entityType: 'enemy',
        template: `faction_${factionId}`,
    });
    
    return eid;
}

// Use for debugging, analytics, achievements
EventBus.getInstance().on(EntityEventType.ENTITY_CREATED, (payload) => {
    console.debug(`Created ${payload.entityType} #${payload.entityId}`);
});
```

**Why Agent-Friendly:**
- Entity flow is observable
- Debugging is easier
- Analytics can track entity counts

**Action Items:**
- [ ] Define entity lifecycle events
- [ ] Emit in factory functions
- [ ] Use for debugging

---

### 7. Entity Archetype Patterns

**Recommendation:** Define archetypes for common entity configurations.

**Pattern:**
```typescript
// src/ecs/archetypes.ts

/**
 * Archetype defines which components an entity type has.
 * Used for documentation and validation.
 */
export interface EntityArchetype {
    name: string;
    required: Component[];
    optional: Component[];
}

export const ARCHETYPES = {
    ENEMY: {
        name: 'Enemy',
        required: [Position, Velocity, Rotation, Faction, Health, Shield, AIBehavior, SpriteRef, Collider],
        optional: [EnemyWeapon, SpecialAbility, EnemyVariant],
    },
    TURRET: {
        name: 'Turret',
        required: [Position, Rotation, Faction, Health, Shield, Turret, Target, CompositeSpriteRef],
        optional: [TurretUpgrade, WeaponProperties],
    },
    PROJECTILE: {
        name: 'Projectile',
        required: [Position, Velocity, Rotation, Faction, Projectile, Collider, SpriteRef],
        optional: [],
    },
    KOBAYASHI_MARU: {
        name: 'Kobayashi Maru',
        required: [Position, Velocity, Rotation, Faction, Health, Shield, Turret, Target, SpriteRef],
        optional: [],
    },
};

/**
 * Validate entity matches archetype.
 */
export function validateArchetype(world: World, eid: number, archetype: EntityArchetype): boolean {
    for (const component of archetype.required) {
        if (!hasComponent(world, eid, component)) {
            console.error(`Entity ${eid} missing required component for ${archetype.name}`);
            return false;
        }
    }
    return true;
}
```

**Why Agent-Friendly:**
- Entity composition is documented
- Validation catches missing components
- Clear reference for new entities

**Action Items:**
- [ ] Define archetypes for all entity types
- [ ] Use in factory validation
- [ ] Document in AGENTS.md

---

### 8. Deprecated Factory Migration

**Recommendation:** Complete migration to generic factories.

**Current State:**
```typescript
// These are deprecated but still exist
/** @deprecated Use createEnemy(world, FactionId.KLINGON, x, y) */
export function createKlingonShip(world: GameWorld, x: number, y: number): number;
```

**Migration Steps:**
1. Find all usages of deprecated functions
2. Replace with generic factory calls
3. Remove deprecated functions
4. Update tests

```typescript
// Find usages
grep -r "createKlingonShip\|createRomulanShip\|createBorgShip" src/

// Replace with:
createEnemy(world, FactionId.KLINGON, x, y)
createEnemy(world, FactionId.ROMULAN, x, y)
createEnemy(world, FactionId.BORG, x, y)
```

**Why Agent-Friendly:**
- Single factory to understand
- Less code to maintain
- Consistent API

**Action Items:**
- [ ] Search for deprecated function usage
- [ ] Replace all usages
- [ ] Remove deprecated functions
- [ ] Update documentation

---

## Implementation Checklist

### Phase 1: Template Expansion (2-3 hours)
- [ ] Create turret templates
- [ ] Create projectile templates
- [ ] Unify creation pattern

### Phase 2: Component Documentation (2 hours)
- [ ] Add JSDoc to all components
- [ ] Group by category
- [ ] Add examples

### Phase 3: Reset Standardization (1-2 hours)
- [ ] Create reset functions
- [ ] Integrate with PoolManager
- [ ] Test reset completeness

### Phase 4: Deprecated Removal (1 hour)
- [ ] Find deprecated usages
- [ ] Replace with generic calls
- [ ] Remove deprecated code

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Template coverage | ~50% | 100% |
| Component JSDoc | ~60% | 100% |
| Deprecated functions | 6 | 0 |
| Reset function coverage | ~50% | 100% |

---

## References

- `src/ecs/entityFactory.ts` - Factory functions
- `src/ecs/entityTemplates.ts` - Entity templates
- `src/ecs/genericFactory.ts` - Generic factory
- `src/ecs/components.ts` - Component definitions
- `src/ecs/PoolManager.ts` - Entity pooling

---

*This document is part of the Kobayashi Maru maintainability initiative.*
