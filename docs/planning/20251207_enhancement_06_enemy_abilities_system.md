# Enhancement Task 06: Enemy Abilities & Special Mechanics

**Date:** 2025-12-07  
**Priority:** HIGH  
**Category:** Gameplay Feature  
**Estimated Effort:** 2-3 days  
**Dependencies:** None

---

## Objective

Implement boss enemies with special abilities, elite variants with enhanced stats, and unique mechanics like teleportation, cloaking, and shield regeneration to create varied and challenging gameplay.

---

## Current State

**Enemy Types**: 5 factions with different AI behaviors
- Klingon (Direct)
- Romulan (Strafe)
- Borg (Swarm)
- Tholian (Flank/Orbit)
- Species 8472 (Hunter)

**Limitations**:
- All enemies of same type are identical
- No special abilities
- No boss enemies
- No elite variants
- Predictable gameplay

---

## Proposed Implementation

### 1. Enemy Variant System

**Goal**: Tag enemies as Normal, Elite, or Boss with stat multipliers

```typescript
// Add to src/ecs/components.ts

/**
 * EnemyVariant component - identifies enemy rank/variant
 */
export const EnemyVariant = defineComponent({
    rank: Types.ui8,           // 0=Normal, 1=Elite, 2=Boss
    sizeScale: Types.f32,      // Visual size multiplier
    statMultiplier: Types.f32  // Health/damage multiplier
});

/**
 * SpecialAbility component - tracks ability cooldowns
 */
export const SpecialAbility = defineComponent({
    abilityType: Types.ui8,      // Type of special ability
    cooldown: Types.f32,         // Time between uses
    lastUsed: Types.f32,         // Timestamp of last use
    duration: Types.f32,         // Duration of ability effect
    active: Types.ui8            // 0/1 flag if currently active
});
```

**Rank Constants**:
```typescript
export const EnemyRank = {
    NORMAL: 0,
    ELITE: 1,
    BOSS: 2
} as const;

export const RANK_MULTIPLIERS = {
    [EnemyRank.NORMAL]: {
        health: 1.0,
        damage: 1.0,
        size: 1.0,
        score: 1.0,
        resources: 1.0
    },
    [EnemyRank.ELITE]: {
        health: 3.0,
        damage: 1.5,
        size: 1.3,
        score: 3.0,
        resources: 3.0
    },
    [EnemyRank.BOSS]: {
        health: 10.0,
        damage: 2.0,
        size: 2.0,
        score: 10.0,
        resources: 10.0
    }
};
```

### 2. Special Abilities

**Ability Types**:

```typescript
export const AbilityType = {
    TELEPORT: 0,           // Instant relocation
    CLOAK: 1,              // Invisibility
    SHIELD_REGEN: 2,       // Regenerate shields
    SPLIT: 3,              // Split into smaller enemies
    SUMMON: 4,             // Summon reinforcements
    DRAIN: 5,              // Drain turret energy
    EMP_BURST: 6,          // Disable nearby turrets
    RAMMING_SPEED: 7       // High-speed charge
} as const;
```

**Implementation Examples**:

#### Teleport Ability
```typescript
// src/systems/abilitySystem.ts

function processTeleportAbility(world: GameWorld, entity: number): void {
    // Check cooldown
    if (SpecialAbility.lastUsed[entity] + SpecialAbility.cooldown[entity] > world.time) {
        return;
    }
    
    // Check if in danger (low health or being targeted)
    const healthPercent = Health.current[entity] / Health.max[entity];
    const isTargeted = isBeingTargeted(world, entity);
    
    if (healthPercent < 0.3 || isTargeted) {
        // Teleport to random safe location
        const newPos = findSafePosition(world);
        
        // Teleport effect at old position
        world.particleSystem.spawn({
            x: Position.x[entity],
            y: Position.y[entity],
            count: 30,
            speed: { min: 100, max: 200 },
            life: { min: 0.3, max: 0.6 },
            size: { min: 4, max: 10 },
            colorGradient: {
                stops: [
                    { time: 0, color: 0xCC99FF, alpha: 1.0 },
                    { time: 1.0, color: 0x6633CC, alpha: 0.0 }
                ]
            },
            spread: Math.PI * 2
        });
        
        // Update position
        Position.x[entity] = newPos.x;
        Position.y[entity] = newPos.y;
        
        // Teleport effect at new position
        world.particleSystem.spawn({
            x: newPos.x,
            y: newPos.y,
            count: 30,
            speed: { min: 50, max: 150 },
            life: { min: 0.3, max: 0.6 },
            size: { min: 4, max: 10 },
            colorGradient: {
                stops: [
                    { time: 0, color: 0x6633CC, alpha: 0.0 },
                    { time: 1.0, color: 0xCC99FF, alpha: 1.0 }
                ]
            },
            spread: Math.PI * 2
        });
        
        // Update cooldown
        SpecialAbility.lastUsed[entity] = world.time;
        
        // Audio
        world.audioManager.play('teleport');
    }
}

function findSafePosition(world: GameWorld): { x: number; y: number } {
    // Find position far from turrets and Kobayashi Maru
    const margin = 200;
    let attempts = 0;
    
    while (attempts < 10) {
        const x = margin + Math.random() * (GAME_CONFIG.WORLD_WIDTH - margin * 2);
        const y = margin + Math.random() * (GAME_CONFIG.WORLD_HEIGHT - margin * 2);
        
        // Check if far enough from threats
        if (isSafePosition(world, x, y, 300)) {
            return { x, y };
        }
        
        attempts++;
    }
    
    // Fallback: edge of screen
    return {
        x: Math.random() < 0.5 ? margin : GAME_CONFIG.WORLD_WIDTH - margin,
        y: Math.random() * GAME_CONFIG.WORLD_HEIGHT
    };
}
```

#### Cloaking Ability
```typescript
function processCloakAbility(world: GameWorld, entity: number): void {
    // Activate cloak when health is low
    const healthPercent = Health.current[entity] / Health.max[entity];
    
    if (healthPercent < 0.5 && SpecialAbility.active[entity] === 0) {
        // Check cooldown
        if (SpecialAbility.lastUsed[entity] + SpecialAbility.cooldown[entity] > world.time) {
            return;
        }
        
        // Activate cloak
        SpecialAbility.active[entity] = 1;
        SpecialAbility.lastUsed[entity] = world.time;
        
        // Reduce sprite alpha
        const spriteIndex = SpriteRef.index[entity];
        world.spriteManager.setAlpha(spriteIndex, 0.2);
        
        // Cloak particles
        world.particleSystem.spawn({
            x: Position.x[entity],
            y: Position.y[entity],
            count: 20,
            speed: { min: 30, max: 80 },
            life: { min: 0.5, max: 1.0 },
            size: { min: 2, max: 6 },
            colorGradient: {
                stops: [
                    { time: 0, color: 0x00FF00, alpha: 0.8 },
                    { time: 1.0, color: 0x00FF00, alpha: 0.0 }
                ]
            },
            spread: Math.PI * 2
        });
        
        // Audio
        world.audioManager.play('cloak');
    }
    
    // Deactivate after duration
    if (SpecialAbility.active[entity] === 1) {
        if (world.time - SpecialAbility.lastUsed[entity] >= SpecialAbility.duration[entity]) {
            SpecialAbility.active[entity] = 0;
            
            // Restore sprite alpha
            const spriteIndex = SpriteRef.index[entity];
            world.spriteManager.setAlpha(spriteIndex, 1.0);
            
            // Decloak particles
            world.particleSystem.spawn({
                x: Position.x[entity],
                y: Position.y[entity],
                count: 20,
                speed: { min: 30, max: 80 },
                life: { min: 0.5, max: 1.0 },
                size: { min: 2, max: 6 },
                colorGradient: {
                    stops: [
                        { time: 0, color: 0x00FF00, alpha: 0.0 },
                        { time: 1.0, color: 0x00FF00, alpha: 0.8 }
                    ]
                },
                spread: Math.PI * 2
            });
        }
    }
}
```

#### Shield Regeneration
```typescript
function processShieldRegenAbility(world: GameWorld, entity: number): void {
    // Passive shield regen
    if (hasComponent(world, Shield, entity)) {
        const currentShield = Shield.current[entity];
        const maxShield = Shield.max[entity];
        
        if (currentShield < maxShield) {
            // Regen rate: 5% of max per second
            const regenRate = maxShield * 0.05;
            Shield.current[entity] = Math.min(
                maxShield,
                currentShield + regenRate * deltaTime
            );
            
            // Visual feedback every 0.5s
            if (Math.floor(world.time * 2) !== Math.floor((world.time - deltaTime) * 2)) {
                world.particleSystem.spawn({
                    x: Position.x[entity],
                    y: Position.y[entity],
                    count: 5,
                    speed: { min: 20, max: 50 },
                    life: { min: 0.2, max: 0.4 },
                    size: { min: 2, max: 4 },
                    color: 0x00CCFF,
                    spread: Math.PI * 2
                });
            }
        }
    }
}
```

#### Split Ability
```typescript
function processSplitAbility(world: GameWorld, entity: number): void {
    // On death, split into 2-3 smaller enemies
    if (Health.current[entity] <= 0) {
        const x = Position.x[entity];
        const y = Position.y[entity];
        const faction = Faction.id[entity];
        
        const splitCount = 2 + Math.floor(Math.random() * 2); // 2-3 enemies
        
        for (let i = 0; i < splitCount; i++) {
            const angle = (Math.PI * 2 * i) / splitCount;
            const offsetX = Math.cos(angle) * 50;
            const offsetY = Math.sin(angle) * 50;
            
            // Spawn smaller enemy
            const newEnemy = world.entityFactory.createEnemy(
                x + offsetX,
                y + offsetY,
                faction,
                AIBehaviorType.DIRECT
            );
            
            // Reduce stats (half of original)
            Health.max[newEnemy] *= 0.5;
            Health.current[newEnemy] *= 0.5;
            
            // Scale down sprite
            const spriteIndex = SpriteRef.index[newEnemy];
            world.spriteManager.setScale(spriteIndex, 0.7);
        }
        
        // Split particles
        world.particleSystem.spawn({
            x, y,
            count: 40,
            speed: { min: 150, max: 300 },
            life: { min: 0.3, max: 0.6 },
            size: { min: 3, max: 8 },
            color: FACTION_COLORS[faction],
            spread: Math.PI * 2
        });
    }
}
```

### 3. Boss Wave System

**Goal**: Special waves with boss enemies

```typescript
// Add to src/game/waveConfig.ts

export interface BossWaveConfig {
    waveNumber: number;
    bossType: FactionIdType;
    bossCount: number;
    bossAbilities: AbilityType[];
    supportEnemies: {
        faction: FactionIdType;
        count: number;
    }[];
    rewardMultiplier: number;
}

export const BOSS_WAVES: BossWaveConfig[] = [
    {
        waveNumber: 5,
        bossType: FactionId.BORG,
        bossCount: 1,
        bossAbilities: [AbilityType.SHIELD_REGEN, AbilityType.SUMMON],
        supportEnemies: [
            { faction: FactionId.BORG, count: 10 }
        ],
        rewardMultiplier: 2.0
    },
    {
        waveNumber: 10,
        bossType: FactionId.SPECIES_8472,
        bossCount: 1,
        bossAbilities: [AbilityType.TELEPORT, AbilityType.CLOAK],
        supportEnemies: [
            { faction: FactionId.SPECIES_8472, count: 5 }
        ],
        rewardMultiplier: 3.0
    },
    {
        waveNumber: 15,
        bossType: FactionId.ROMULAN,
        bossCount: 2,
        bossAbilities: [AbilityType.CLOAK, AbilityType.EMP_BURST],
        supportEnemies: [
            { faction: FactionId.ROMULAN, count: 15 },
            { faction: FactionId.KLINGON, count: 10 }
        ],
        rewardMultiplier: 4.0
    }
];
```

### 4. Elite Enemy Spawning

**Update**: `src/game/waveManager.ts`

```typescript
export class WaveManager {
    /**
     * Spawn enemy with variant consideration
     */
    private spawnEnemy(faction: FactionIdType, behavior: AIBehaviorTypeId): number {
        const x = this.getSpawnX();
        const y = this.getSpawnY();
        
        // Determine variant (10% elite chance, increases with wave)
        const eliteChance = 0.1 + (this.currentWave * 0.01);
        const isElite = Math.random() < eliteChance;
        
        // Create enemy
        const enemy = this.entityFactory.createEnemy(x, y, faction, behavior);
        
        if (isElite) {
            // Add variant component
            addComponent(this.world, EnemyVariant, enemy);
            EnemyVariant.rank[enemy] = EnemyRank.ELITE;
            EnemyVariant.sizeScale[enemy] = RANK_MULTIPLIERS[EnemyRank.ELITE].size;
            EnemyVariant.statMultiplier[enemy] = RANK_MULTIPLIERS[EnemyRank.ELITE].health;
            
            // Apply multipliers
            Health.max[enemy] *= RANK_MULTIPLIERS[EnemyRank.ELITE].health;
            Health.current[enemy] *= RANK_MULTIPLIERS[EnemyRank.ELITE].health;
            
            if (hasComponent(this.world, EnemyWeapon, enemy)) {
                EnemyWeapon.damage[enemy] *= RANK_MULTIPLIERS[EnemyRank.ELITE].damage;
            }
            
            // Scale sprite
            const spriteIndex = SpriteRef.index[enemy];
            this.spriteManager.setScale(spriteIndex, RANK_MULTIPLIERS[EnemyRank.ELITE].size);
            
            // Add visual indicator (glow)
            this.addEliteGlow(enemy);
        }
        
        return enemy;
    }
    
    /**
     * Add visual glow to elite enemies
     */
    private addEliteGlow(enemy: number): void {
        // Add glow ring particle effect that follows enemy
        const glowId = `elite-glow-${enemy}`;
        // Implementation depends on particle system
    }
}
```

### 5. Ability System

**New System**: `src/systems/abilitySystem.ts`

```typescript
export function abilitySystem(world: GameWorld, deltaTime: number): void {
    const abilityQuery = defineQuery([SpecialAbility, Position, Health]);
    const entities = abilityQuery(world);
    
    for (let i = 0; i < entities.length; i++) {
        const eid = entities[i];
        const abilityType = SpecialAbility.abilityType[eid];
        
        switch (abilityType) {
            case AbilityType.TELEPORT:
                processTeleportAbility(world, eid);
                break;
            case AbilityType.CLOAK:
                processCloakAbility(world, eid);
                break;
            case AbilityType.SHIELD_REGEN:
                processShieldRegenAbility(world, eid);
                break;
            case AbilityType.SPLIT:
                processSplitAbility(world, eid);
                break;
            // ... other abilities
        }
    }
}
```

---

## Visual Indicators

### Elite Enemies
- 1.3x size
- Glowing aura (particle ring)
- Different color tint
- Health bar with "ELITE" tag

### Boss Enemies
- 2.0x size
- Intense glow effect
- Special intro animation
- Boss health bar at top of screen
- Name display

---

## Configuration

Add to `src/types/constants.ts`:

```typescript
export const ABILITY_CONFIG = {
    [AbilityType.TELEPORT]: {
        cooldown: 8.0,
        duration: 0,
        range: 0
    },
    [AbilityType.CLOAK]: {
        cooldown: 15.0,
        duration: 5.0,
        alphaWhileCloaked: 0.2
    },
    [AbilityType.SHIELD_REGEN]: {
        cooldown: 0,  // Passive
        regenRate: 0.05,  // 5% per second
        duration: 0
    },
    [AbilityType.SPLIT]: {
        cooldown: 0,  // On death
        splitCount: { min: 2, max: 3 },
        duration: 0
    }
};
```

---

## Testing Requirements

### Unit Tests
```typescript
// src/__tests__/abilitySystem.test.ts

describe('Ability System', () => {
    test('should teleport enemy when low health');
    test('should cloak enemy and reduce alpha');
    test('should regenerate shields over time');
    test('should split enemy on death');
    test('should respect cooldowns');
});

// src/__tests__/enemyVariants.test.ts

describe('Enemy Variants', () => {
    test('should spawn elite enemies with stat multipliers');
    test('should spawn boss enemies');
    test('should apply size scaling');
    test('should award bonus resources');
});
```

---

## Success Criteria

- ✅ Elite enemies spawn with enhanced stats
- ✅ Boss enemies appear on special waves
- ✅ 5+ special abilities implemented
- ✅ Teleport works and triggers correctly
- ✅ Cloaking reduces visibility
- ✅ Shield regeneration visible
- ✅ Split creates multiple enemies
- ✅ Visual indicators for elite/boss
- ✅ All tests passing
- ✅ Performance maintained

---

## Future Enhancements

- Mini-boss enemies
- Unique abilities per faction
- Boss phases (enraged at low health)
- Ability combos
- Environmental abilities (asteroid summon)
- Boss loot drops

---

## References

- Entity factory: `src/ecs/entityFactory.ts`
- Wave manager: `src/game/waveManager.ts`
- AI system: `src/systems/aiSystem.ts`
