# Refactoring Task: Factory Pattern Consolidation

**Date:** 2025-12-07  
**Priority:** HIGH  
**Estimated Effort:** 2 days  
**AI Friendliness Impact:** HIGH

---

## Problem Statement

The `entityFactory.ts` file contains 11 separate entity creation functions with nearly identical structure. This repetition:

- Makes AI harder to understand the patterns (too much code to read)
- Causes copy-paste errors when adding new entity types
- Requires updating multiple functions for common changes
- Obscures the actual differences between entity types

### Current State Analysis

```typescript
// All 11 functions follow this pattern:
export function createXXXShip(world: GameWorld, x: number, y: number): number {
  const eid = EntityPool.alloc(world, 'enemy');  // or addEntity(world)
  
  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;
  
  addComponent(world, Velocity, eid);
  // Set velocity values...
  
  addComponent(world, Health, eid);
  // Set health values...
  
  // ... more components with faction-specific values
  
  return eid;
}
```

**Key Insight:** Only the _configuration values_ differ between functions, not the _structure_.

---

## Recommended Actions

### 1. Define Entity Configuration Schema

```typescript
// src/ecs/entityConfigs.ts

import { FactionId, AIBehaviorType, TurretType, ProjectileType } from '../types/constants';

/**
 * Component configuration with default values.
 * Keys must match component names exactly.
 */
export interface ComponentValues {
  Position?: { x: number; y: number };
  Velocity?: { x: number; y: number };
  Health?: { current: number; max: number };
  Shield?: { current: number; max: number };
  Faction?: { id: number };
  SpriteRef?: { index: number };
  Collider?: { radius: number; layer: number; mask: number };
  AIBehavior?: { 
    behaviorType: number; 
    stateTimer: number;
    targetX: number;
    targetY: number;
    aggression: number;
  };
  Turret?: {
    range: number;
    fireRate: number;
    damage: number;
    turretType: number;
  };
  Target?: { hasTarget: number };
  Projectile?: {
    damage: number;
    speed: number;
    lifetime: number;
    projectileType: number;
  };
}

/**
 * Complete entity template definition.
 */
export interface EntityTemplate {
  /** Unique identifier for this template */
  id: string;
  
  /** Entity pool category for reuse */
  poolCategory: 'enemy' | 'turret' | 'projectile' | 'effect' | null;
  
  /** Components to add with their default values */
  components: ComponentValues;
  
  /** Optional initialization callback for complex setup */
  onInit?: (world: GameWorld, eid: number, x: number, y: number) => void;
}
```

### 2. Create Entity Templates Registry

```typescript
// src/ecs/entityTemplates.ts

import { EntityTemplate } from './entityConfigs';
import { COLLISION_LAYERS, COLLISION_MASKS } from '../types/constants';

/**
 * Enemy ship templates by faction.
 */
export const ENEMY_TEMPLATES: Record<number, EntityTemplate> = {
  [FactionId.KLINGON]: {
    id: 'klingon_ship',
    poolCategory: 'enemy',
    components: {
      Position: { x: 0, y: 0 },
      Velocity: { x: 0, y: 0 },
      Health: { current: 100, max: 100 },
      Shield: { current: 50, max: 50 },
      Faction: { id: FactionId.KLINGON },
      SpriteRef: { index: 0 },
      Collider: {
        radius: 16,
        layer: COLLISION_LAYERS.ENEMY,
        mask: COLLISION_MASKS.ENEMY,
      },
      AIBehavior: {
        behaviorType: AIBehaviorType.DIRECT,
        stateTimer: 0,
        targetX: 0,
        targetY: 0,
        aggression: 0.8,
      },
    },
  },
  
  [FactionId.ROMULAN]: {
    id: 'romulan_ship',
    poolCategory: 'enemy',
    components: {
      Position: { x: 0, y: 0 },
      Velocity: { x: 0, y: 0 },
      Health: { current: 80, max: 80 },
      Shield: { current: 100, max: 100 },
      Faction: { id: FactionId.ROMULAN },
      SpriteRef: { index: 0 },
      Collider: {
        radius: 14,
        layer: COLLISION_LAYERS.ENEMY,
        mask: COLLISION_MASKS.ENEMY,
      },
      AIBehavior: {
        behaviorType: AIBehaviorType.STRAFE,
        stateTimer: 0,
        targetX: 0,
        targetY: 0,
        aggression: 0.6,
      },
    },
  },
  
  // ... other factions
};

/**
 * Turret templates by type.
 */
export const TURRET_TEMPLATES: Record<number, EntityTemplate> = {
  [TurretType.PHASER_ARRAY]: {
    id: 'phaser_array',
    poolCategory: 'turret',
    components: {
      Position: { x: 0, y: 0 },
      Faction: { id: FactionId.FEDERATION },
      SpriteRef: { index: 0 },
      Collider: {
        radius: 20,
        layer: COLLISION_LAYERS.TURRET,
        mask: COLLISION_MASKS.TURRET,
      },
      Turret: {
        range: 200,
        fireRate: 4,
        damage: 10,
        turretType: TurretType.PHASER_ARRAY,
      },
      Target: { hasTarget: 0 },
    },
  },
  // ... other turret types
};
```

### 3. Create Generic Entity Factory

```typescript
// src/ecs/genericFactory.ts

import { addEntity, addComponent, IWorld } from 'bitecs';
import { EntityTemplate, ComponentValues } from './entityConfigs';
import { EntityPool } from './entityPool';
import { GameWorld, incrementEntityCount } from './world';
import * as Components from './components';

/**
 * Component name to actual component mapping.
 */
const COMPONENT_MAP: Record<string, any> = {
  Position: Components.Position,
  Velocity: Components.Velocity,
  Health: Components.Health,
  Shield: Components.Shield,
  Faction: Components.Faction,
  SpriteRef: Components.SpriteRef,
  Collider: Components.Collider,
  AIBehavior: Components.AIBehavior,
  Turret: Components.Turret,
  Target: Components.Target,
  Projectile: Components.Projectile,
  // Add new components here
};

/**
 * Creates an entity from a template definition.
 * 
 * @param world - The ECS world
 * @param template - Entity template with component configuration
 * @param x - Initial X position (overrides template Position.x)
 * @param y - Initial Y position (overrides template Position.y)
 * @returns Entity ID
 * 
 * @example
 * ```typescript
 * const eid = createFromTemplate(world, ENEMY_TEMPLATES[FactionId.KLINGON], 100, 200);
 * ```
 */
export function createFromTemplate(
  world: GameWorld,
  template: EntityTemplate,
  x: number,
  y: number
): number {
  // Allocate entity (from pool or new)
  const eid = template.poolCategory
    ? EntityPool.alloc(world, template.poolCategory)
    : addEntity(world);
  
  // Add and initialize each component
  for (const [componentName, values] of Object.entries(template.components)) {
    const Component = COMPONENT_MAP[componentName];
    if (!Component) {
      console.warn(`Unknown component: ${componentName}`);
      continue;
    }
    
    addComponent(world, Component, eid);
    
    // Set component values
    for (const [field, value] of Object.entries(values as Record<string, number>)) {
      if (Component[field] !== undefined) {
        Component[field][eid] = value;
      }
    }
  }
  
  // Override position with provided coordinates
  if (template.components.Position) {
    Components.Position.x[eid] = x;
    Components.Position.y[eid] = y;
  }
  
  // Run custom initialization if defined
  if (template.onInit) {
    template.onInit(world, eid, x, y);
  }
  
  incrementEntityCount(world);
  return eid;
}

/**
 * Convenience wrapper for creating enemies.
 */
export function createEnemy(
  world: GameWorld,
  faction: number,
  x: number,
  y: number
): number {
  const template = ENEMY_TEMPLATES[faction];
  if (!template) {
    throw new Error(`Unknown faction: ${faction}`);
  }
  return createFromTemplate(world, template, x, y);
}

/**
 * Convenience wrapper for creating turrets.
 */
export function createTurret(
  world: GameWorld,
  turretType: number,
  x: number,
  y: number
): number {
  const template = TURRET_TEMPLATES[turretType];
  if (!template) {
    throw new Error(`Unknown turret type: ${turretType}`);
  }
  return createFromTemplate(world, template, x, y);
}
```

### 4. Update Entity Factory Exports

```typescript
// src/ecs/entityFactory.ts (simplified)

export { createFromTemplate, createEnemy, createTurret } from './genericFactory';
export { ENEMY_TEMPLATES, TURRET_TEMPLATES } from './entityTemplates';

// Legacy function wrappers for backwards compatibility
import { createEnemy } from './genericFactory';
import { FactionId } from '../types/constants';

/** @deprecated Use createEnemy(world, FactionId.KLINGON, x, y) */
export const createKlingonShip = (world: GameWorld, x: number, y: number) =>
  createEnemy(world, FactionId.KLINGON, x, y);

/** @deprecated Use createEnemy(world, FactionId.ROMULAN, x, y) */
export const createRomulanShip = (world: GameWorld, x: number, y: number) =>
  createEnemy(world, FactionId.ROMULAN, x, y);

// ... other legacy wrappers
```

---

## Benefits for AI Coding

1. **Single Source of Truth** - Add new entity types by adding a template object
2. **Clear Structure** - AI can understand entity differences at a glance
3. **Type Safety** - TypeScript validates template structure
4. **Less Code to Read** - ~100 lines instead of ~500 lines
5. **Easier Modifications** - Change one template, affects all instances

---

## Verification

- [ ] All existing entity creation scenarios work identically
- [ ] Unit tests for new factory functions pass
- [ ] Legacy function wrappers maintain backwards compatibility
- [ ] No performance regression in entity creation
- [ ] New entity types can be added with just template definition

---

## Dependencies

- Can be done in parallel with other refactoring tasks
- Should update JSDoc documentation after completion
