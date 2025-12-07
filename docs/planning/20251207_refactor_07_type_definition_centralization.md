# Refactoring Task: Type Definition Centralization

**Date:** 2025-12-07  
**Priority:** MEDIUM  
**Estimated Effort:** 1 day  
**AI Friendliness Impact:** HIGH

---

## Problem Statement

Type definitions and constants are scattered across multiple files, making it difficult for AI to:

- Find authoritative type definitions
- Understand relationships between types
- Know which file to modify for type changes
- Avoid creating duplicate or conflicting types

### Current Type Location Audit

| Type/Constant | Current Location | Should Be |
|---------------|------------------|-----------|
| `GAME_CONFIG` | `src/types/constants.ts` | `src/config/game.config.ts` |
| `FactionId` | `src/types/constants.ts` | ✅ Keep |
| `TurretType` | `src/types/constants.ts` | ✅ Keep |
| `AIBehaviorType` | `src/types/constants.ts` | ✅ Keep |
| `GameWorld` | `src/ecs/world.ts` | ✅ Keep |
| `HUDData` | `src/ui/types.ts` | ✅ Keep |
| `BeamVisual` | `src/systems/combatSystem.ts` | `src/types/combat.ts` |
| `CombatStats` | `src/systems/combatSystem.ts` | `src/types/combat.ts` |
| `WaveConfig` | `src/game/waveConfig.ts` | ✅ Keep (co-located) |
| `EnemySpawnConfig` | `src/game/waveConfig.ts` | ✅ Keep (co-located) |
| `ParticleConfig` | `src/rendering/ParticleSystem.ts` | `src/types/rendering.ts` |
| `ExplosionConfig` | Inline in multiple files | `src/types/rendering.ts` |
| `EntityTemplate` | Doesn't exist | `src/types/entities.ts` |

---

## Recommended Actions

### 1. Create Domain-Specific Type Modules

**`src/types/combat.ts`** (new):
```typescript
/**
 * Combat-related type definitions.
 */

/**
 * Beam segment for multi-segment beams with electricity jitter effect.
 */
export interface BeamSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** Random perpendicular offset for jitter effect */
  offset: number;
}

/**
 * Complete beam visual data for rendering.
 */
export interface BeamVisual {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** Turret type that fired this beam */
  turretType: number;
  /** Intensity for pulsing effect (0-1) */
  intensity: number;
  /** Individual segments with jitter offsets */
  segments: BeamSegment[];
  /** Time since beam was created (for animation) */
  age: number;
}

/**
 * Combat statistics for HUD and debugging.
 */
export interface CombatStats {
  totalDamageDealt: number;
  totalShotsFired: number;
  shotsHit: number;
  /** Damage per second (rolling average) */
  dps: number;
  /** Hit rate as decimal (0-1) */
  accuracy: number;
}

/**
 * Damage event for damage system processing.
 */
export interface DamageEvent {
  targetEntityId: number;
  sourceEntityId: number;
  amount: number;
  damageType: 'beam' | 'projectile' | 'collision' | 'status';
  timestamp: number;
}
```

**`src/types/rendering.ts`** (new):
```typescript
/**
 * Rendering-related type definitions.
 */

/**
 * Particle configuration for spawning particle effects.
 */
export interface ParticleConfig {
  /** Effect position X */
  x: number;
  /** Effect position Y */
  y: number;
  /** Number of particles to spawn */
  count?: number;
  /** Base color (can be modified per particle) */
  color?: number;
  /** Particle lifetime in seconds */
  lifetime?: number;
  /** Initial velocity spread in radians */
  spread?: number;
  /** Initial speed range */
  speed?: { min: number; max: number };
  /** Particle size range */
  size?: { min: number; max: number };
  /** Alpha fade over lifetime */
  fadeOut?: boolean;
  /** Gravity effect */
  gravity?: number;
}

/**
 * Explosion effect configuration.
 */
export interface ExplosionConfig {
  x: number;
  y: number;
  /** Base radius before expansion */
  radius: number;
  /** Expansion speed in pixels/second */
  expansionRate?: number;
  /** Primary explosion color */
  color?: number;
  /** Secondary flash color */
  flashColor?: number;
  /** Total duration in seconds */
  duration?: number;
  /** Whether to spawn debris particles */
  spawnDebris?: boolean;
  /** Screen shake intensity (0 = none) */
  shakeIntensity?: number;
}

/**
 * Shockwave effect configuration.
 */
export interface ShockwaveConfig {
  x: number;
  y: number;
  maxRadius: number;
  duration: number;
  color?: number;
  thickness?: number;
}
```

**`src/types/entities.ts`** (new):
```typescript
/**
 * Entity-related type definitions for factory and templates.
 */

import type { IWorld } from 'bitecs';
import type { GameWorld } from '../ecs/world';

/**
 * Entity pool categories for efficient allocation.
 */
export type EntityPoolCategory = 'enemy' | 'turret' | 'projectile' | 'effect' | null;

/**
 * Component field values (generic).
 */
export type ComponentFieldValues = Record<string, number>;

/**
 * Component configuration with typed values.
 */
export type ComponentConfig = Record<string, ComponentFieldValues>;

/**
 * Complete entity template definition.
 */
export interface EntityTemplate {
  /** Unique identifier for this template */
  id: string;
  
  /** Human-readable name for debugging */
  displayName?: string;
  
  /** Entity pool category for allocation */
  poolCategory: EntityPoolCategory;
  
  /** Components and their default values */
  components: ComponentConfig;
  
  /** Optional initialization callback */
  onInit?: (world: GameWorld, eid: number, x: number, y: number) => void;
  
  /** Optional cleanup callback when entity is destroyed */
  onDestroy?: (world: IWorld, eid: number) => void;
}

/**
 * Entity spawn options.
 */
export interface SpawnOptions {
  x: number;
  y: number;
  /** Override component values from template */
  overrides?: ComponentConfig;
  /** Skip pool allocation (always create new entity) */
  forceNew?: boolean;
}
```

**`src/types/events.ts`** (new):
```typescript
/**
 * Event payload type definitions for EventBus.
 */

/**
 * Payload for ENEMY_KILLED event.
 */
export interface EnemyKilledPayload {
  entityId: number;
  factionId: number;
  position: { x: number; y: number };
  killedBy: 'turret' | 'projectile' | 'status';
}

/**
 * Payload for WAVE_STARTED event.
 */
export interface WaveStartedPayload {
  waveNumber: number;
  totalEnemies: number;
}

/**
 * Payload for WAVE_COMPLETED event.
 */
export interface WaveCompletedPayload {
  waveNumber: number;
  timeToComplete: number;
  enemiesDestroyed: number;
}

/**
 * Payload for TURRET_PLACED event.
 */
export interface TurretPlacedPayload {
  entityId: number;
  turretType: number;
  position: { x: number; y: number };
  cost: number;
}

/**
 * Payload for GAME_STATE_CHANGED event.
 */
export interface GameStateChangedPayload {
  previousState: string;
  newState: string;
  timestamp: number;
}

/**
 * All event types mapped to their payloads.
 */
export interface GameEventMap {
  'ENEMY_KILLED': EnemyKilledPayload;
  'WAVE_STARTED': WaveStartedPayload;
  'WAVE_COMPLETED': WaveCompletedPayload;
  'TURRET_PLACED': TurretPlacedPayload;
  'GAME_STATE_CHANGED': GameStateChangedPayload;
  'DAMAGE_DEALT': { amount: number; targetId: number };
  'RESOURCE_CHANGED': { newAmount: number; delta: number };
}

export type GameEventType = keyof GameEventMap;
```

### 2. Update Main Types Index

**`src/types/index.ts`** (update):
```typescript
/**
 * Central type definitions for Kobayashi Maru.
 */

// Game constants and enums
export {
  GAME_CONFIG,
  FactionId,
  type FactionIdType,
  AIBehaviorType,
  TurretType,
  ProjectileType,
  COLLISION_LAYERS,
  COLLISION_MASKS,
} from './constants';

// Combat types
export type {
  BeamSegment,
  BeamVisual,
  CombatStats,
  DamageEvent,
} from './combat';

// Rendering types
export type {
  ParticleConfig,
  ExplosionConfig,
  ShockwaveConfig,
} from './rendering';

// Entity types
export type {
  EntityPoolCategory,
  ComponentConfig,
  EntityTemplate,
  SpawnOptions,
} from './entities';

// Event types
export type {
  EnemyKilledPayload,
  WaveStartedPayload,
  WaveCompletedPayload,
  TurretPlacedPayload,
  GameStateChangedPayload,
  GameEventMap,
  GameEventType,
} from './events';
```

### 3. Update Consuming Files

```typescript
// Before (scattered type definitions)
// src/systems/combatSystem.ts
export interface BeamVisual { /* ... */ }

// After (centralized imports)
import type { BeamVisual, CombatStats } from '../types';

// Implementation uses imported types
const activeBeams: BeamVisual[] = [];
```

---

## Type Naming Conventions

Establish and document these conventions:

```markdown
## Type Naming Conventions

1. **Interfaces** - PascalCase, noun describing the data
   - `BeamVisual`, `CombatStats`, `EntityTemplate`

2. **Type Aliases** - PascalCase, descriptive
   - `EntityPoolCategory`, `GameEventType`

3. **Enums/Constants** - SCREAMING_SNAKE_CASE
   - `GAME_CONFIG`, `FactionId`, `TurretType`

4. **Event Payloads** - `<EventName>Payload`
   - `EnemyKilledPayload`, `WaveStartedPayload`

5. **Config Types** - `<Domain>Config`
   - `ParticleConfig`, `ExplosionConfig`
```

---

## Verification

- [ ] All shared types are in `src/types/`
- [ ] No duplicate type definitions
- [ ] All imports resolve correctly
- [ ] TypeScript strict mode passes
- [ ] IDE intellisense shows correct types

---

## Dependencies

- Configuration externalization task creates `src/config/`
- Should be done before or alongside barrel export organization
