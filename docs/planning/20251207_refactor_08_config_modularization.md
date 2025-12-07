# Refactor Task: Configuration Modularization

**Date:** December 7, 2025  
**Priority:** 🟡 Medium  
**Complexity:** Low  
**Estimated Effort:** 2-3 hours  

---

## Problem Statement

`src/types/constants.ts` is a 350+ line monolithic file containing all game configuration:

- Faction colors and IDs
- Sprite types
- Game config (world size, collision, etc.)
- Turret types and stats
- AI behavior types
- Upgrade paths and costs
- Projectile types and config

---

## Impact

- **Developer Friction:** Hard to find specific values
- **Merge Conflicts:** Multiple features touching same file
- **No Logical Grouping:** Unrelated configs mixed together
- **Testing:** Can't mock specific config sections

---

## Proposed Solution

Split into focused configuration modules:

```
src/config/
├── index.ts           - Re-exports all configs
├── game.config.ts     - Core game settings
├── factions.config.ts - Faction IDs, colors
├── turrets.config.ts  - Turret types, stats, upgrades
├── enemies.config.ts  - AI behaviors, enemy stats
├── projectiles.config.ts - Projectile types
├── ui.config.ts       - UI constants (from styles.ts)
└── sprites.config.ts  - Sprite type mappings
```

---

## Implementation

### Step 1: Create game.config.ts

```typescript
// src/config/game.config.ts
export const GAME_CONFIG = {
  TARGET_FPS: 60,
  INITIAL_ENTITY_COUNT: 5000,
  WORLD_WIDTH: 1920,
  WORLD_HEIGHT: 1080,
  COLLISION_CELL_SIZE: 64,
  MIN_TURRET_DISTANCE: 64,
  INITIAL_RESOURCES: 500,
  RESOURCE_REWARD: 10,
  ENEMY_COLLISION_RADIUS: 40,
  ENEMY_COLLISION_DAMAGE: 25,
  SLOW_MODE_MULTIPLIER: 0.5,
  ORBIT_RADIUS: 300,
  ORBIT_SPEED: 50,
  ORBIT_APPROACH_SPEED: 40,
  KOBAYASHI_MARU_RADIUS: 40,
  TURRET_RADIUS: 20,
  KOBAYASHI_MARU_DEFENSE_RANGE: 250,
  KOBAYASHI_MARU_DEFENSE_FIRE_RATE: 2,
  KOBAYASHI_MARU_DEFENSE_DAMAGE: 15
} as const;

export type GameConfigType = typeof GAME_CONFIG;
```

### Step 2: Create factions.config.ts

```typescript
// src/config/factions.config.ts
export const FACTION_COLORS = {
  FEDERATION: 0x33CC99,
  KLINGON: 0xDD4444,
  ROMULAN: 0x99CC33,
  BORG: 0x22EE22,
  THOLIAN: 0xFF7700,
  SPECIES_8472: 0xCC99FF,
  PROJECTILE: 0xFF6600
} as const;

export const FactionId = {
  FEDERATION: 0,
  KLINGON: 1,
  ROMULAN: 2,
  BORG: 3,
  THOLIAN: 4,
  SPECIES_8472: 5,
  PROJECTILE: 99,
  ENEMY_PROJECTILE: 98
} as const;

export type FactionIdType = typeof FactionId[keyof typeof FactionId];

export const LCARS_COLORS = {
  GOLDEN_ORANGE: 0xFF9900,
  GALAXY_BLUE: 0x99CCFF,
  BACKGROUND: 0x000000
} as const;
```

### Step 3: Create turrets.config.ts

```typescript
// src/config/turrets.config.ts
export const TurretType = {
  PHASER_ARRAY: 0,
  TORPEDO_LAUNCHER: 1,
  DISRUPTOR_BANK: 2,
  TETRYON_BEAM: 3,
  PLASMA_CANNON: 4,
  POLARON_BEAM: 5
} as const;

export type TurretTypeId = typeof TurretType[keyof typeof TurretType];

export interface TurretConfig {
  range: number;
  fireRate: number;
  damage: number;
  cost: number;
  health: number;
  shield: number;
  name: string;
  description: string;
  special?: string;
}

export const TURRET_CONFIG: Record<number, TurretConfig> = {
  [TurretType.PHASER_ARRAY]: {
    range: 200, fireRate: 4, damage: 10, cost: 100,
    health: 50, shield: 25,
    name: 'Phaser Array',
    description: 'Fast-firing energy weapon',
    special: 'High fire rate, good for swarms'
  },
  // ... other turrets
};

// Upgrade configuration
export const UpgradePath = {
  DAMAGE: 0,
  RANGE: 1,
  FIRE_RATE: 2,
  MULTI_TARGET: 3,
  SPECIAL: 4
} as const;

export const UPGRADE_CONFIG = { /* ... */ };
export const TURRET_SPECIAL_UPGRADES = { /* ... */ };
export const TURRET_SELL_REFUND_PERCENT = 0.75;
```

### Step 4: Create enemies.config.ts

```typescript
// src/config/enemies.config.ts
export const AIBehaviorType = {
  DIRECT: 0,
  STRAFE: 1,
  FLANK: 2,
  SWARM: 3,
  HUNTER: 4,
  ORBIT: 5
} as const;

export type AIBehaviorTypeId = typeof AIBehaviorType[keyof typeof AIBehaviorType];

// Enemy stats could go here too
export const ENEMY_STATS = {
  KLINGON: { health: 80, shield: 30, speed: 100 },
  ROMULAN: { health: 70, shield: 60, speed: 80 },
  // ...
};
```

### Step 5: Create projectiles.config.ts

```typescript
// src/config/projectiles.config.ts
export const ProjectileType = {
  PHOTON_TORPEDO: 0,
  QUANTUM_TORPEDO: 1,
  DISRUPTOR_BOLT: 2
} as const;

export type ProjectileTypeId = typeof ProjectileType[keyof typeof ProjectileType];

export const PROJECTILE_CONFIG: Record<number, {
  speed: number;
  lifetime: number;
  size: number;
  color: number;
}> = {
  [ProjectileType.PHOTON_TORPEDO]: {
    speed: 400, lifetime: 5, size: 8, color: 0xFF6600
  },
  // ...
};
```

### Step 6: Create index.ts barrel export

```typescript
// src/config/index.ts
export * from './game.config';
export * from './factions.config';
export * from './turrets.config';
export * from './enemies.config';
export * from './projectiles.config';
export * from './sprites.config';
```

### Step 7: Update imports across codebase

```typescript
// BEFORE
import { GAME_CONFIG, TurretType, FactionId } from '../types/constants';

// AFTER
import { GAME_CONFIG } from '../config/game.config';
import { TurretType } from '../config/turrets.config';
import { FactionId } from '../config/factions.config';

// OR use barrel import
import { GAME_CONFIG, TurretType, FactionId } from '../config';
```

---

## Migration Strategy

1. Create new config files with copied content
2. Update `src/types/constants.ts` to re-export from new files (backward compat)
3. Gradually update imports across codebase
4. Remove re-exports from constants.ts once all migrated

---

## Validation Criteria

1. **All imports resolve** - no broken references
2. **Tests pass** - functionality unchanged
3. **Each config file < 100 lines** - focused and readable
4. **No duplicate definitions** - single source of truth

---

## Files to Create

- `src/config/game.config.ts`
- `src/config/factions.config.ts`
- `src/config/turrets.config.ts`
- `src/config/enemies.config.ts`
- `src/config/projectiles.config.ts`
- `src/config/sprites.config.ts`
- `src/config/index.ts`

## Files to Modify

- `src/types/constants.ts` - Deprecate, re-export from config/
- All files importing from constants.ts - Update imports
