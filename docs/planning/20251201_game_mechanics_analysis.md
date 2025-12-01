# Kobayashi Maru - Game Mechanics Analysis

**Date:** 2025-12-01  
**Version:** 1.0  
**Status:** Complete Analysis  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Game Loop](#core-game-loop)
3. [Player Objective](#player-objective)
4. [Resource System](#resource-system)
5. [Turret System](#turret-system)
6. [Enemy Factions](#enemy-factions)
7. [AI Behavior System](#ai-behavior-system)
8. [Combat System](#combat-system)
9. [Wave System](#wave-system)
10. [Scoring System](#scoring-system)
11. [Status Effects System](#status-effects-system)
12. [Technical Implementation](#technical-implementation)

---

## Executive Summary

**Kobayashi Maru** is a Star Trek-themed endless tower defense game where players protect the civilian freighter Kobayashi Maru from infinite waves of enemy ships. Built with TypeScript, PixiJS 8, and bitECS, the game features:

- **6 Enemy Factions** with unique behaviors and stats
- **6 Turret Types** with distinct weapons and special effects
- **Procedural Wave Generation** beyond wave 10
- **Status Effects** including burning, slowing, and draining
- **ECS Architecture** supporting 5,000+ entities

**Genre:** Endless Tower Defense / Wave Survival  
**Win Condition:** None - survive as long as possible  
**Primary Metrics:** Time Survived, Waves Completed, Enemies Defeated

---

## Core Game Loop

```
┌─────────────────────────────────────────────────────────────┐
│                        GAME START                           │
│                    (500 Resources)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    PLACEMENT PHASE                          │
│  • Player selects turret type (1-6 hotkeys or UI)          │
│  • Click to place turrets on battlefield                   │
│  • Resources deducted per turret cost                      │
│  • Minimum 64px spacing between turrets                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMBAT PHASE                             │
│  • Enemies spawn from screen edges                         │
│  • Enemies navigate toward Kobayashi Maru (center)         │
│  • Turrets auto-target and fire at enemies                 │
│  • Player earns +10 resources per enemy killed             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  WAVE COMPLETION                            │
│  • All enemies defeated                                    │
│  • 3-second delay                                          │
│  • Next wave starts automatically                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               GAME OVER (If Kobayashi Maru destroyed)       │
│  • Final score calculated                                  │
│  • High score saved to localStorage                        │
│  • Option to restart                                       │
└─────────────────────────────────────────────────────────────┘
```

### Game States

| State | Description | Valid Transitions |
|-------|-------------|-------------------|
| `MENU` | Main menu (placeholder) | → PLAYING |
| `PLAYING` | Active gameplay | → PAUSED, GAME_OVER |
| `PAUSED` | Game frozen | → PLAYING, MENU |
| `GAME_OVER` | Kobayashi Maru destroyed | → MENU, PLAYING |

---

## Player Objective

### Primary Objective
**Protect the Kobayashi Maru** - The civilian freighter positioned at the center of the screen (960, 540).

### Kobayashi Maru Stats
| Stat | Value |
|------|-------|
| Health | 500 HP |
| Shield | 200 SP |
| Collision Radius | 40 pixels |
| Position | Center (1920/2, 1080/2) |

### Failure Condition
The game ends when Kobayashi Maru's health reaches 0.

### Success Metrics
- **Time Survived** (seconds)
- **Waves Completed**
- **Enemies Defeated**
- **Civilians Saved** (future feature)

---

## Resource System

### Replication Matter
The player's primary currency for building turrets.

| Property | Value |
|----------|-------|
| Starting Amount | 500 Matter |
| Per Enemy Kill | +10 Matter |
| Minimum Balance | 0 |

### Resource Flow
```
Enemy Kill → +10 Matter → Bank
                           ↓
                    Player Decision
                           ↓
              ┌───────────────────────────────┐
              │                               │
        Save Matter              Spend on Turret
        for later               (deduct cost)
```

### Resource Events
- `RESOURCE_UPDATED` - Emitted when resources change
- Resources displayed in HUD at all times

---

## Turret System

### Turret Types (6 Total)

| ID | Name | Range | Fire Rate | Damage | Cost | Health | Shield | Special |
|----|------|-------|-----------|--------|------|--------|--------|---------|
| 0 | **Phaser Array** | 200px | 4/sec | 10 | 100 | 50 | 25 | Beam weapon, reliable |
| 1 | **Torpedo Launcher** | 350px | 0.5/sec | 50 | 200 | 75 | 40 | Projectile, high damage |
| 2 | **Disruptor Bank** | 250px | 2/sec | 15 | 150 | 60 | 30 | Beam weapon |
| 3 | **Tetryon Beam** | 220px | 3/sec | 12 | 150 | 55 | 28 | 3x shield damage, 0.5x hull |
| 4 | **Plasma Cannon** | 200px | 1/sec | 8 | 180 | 65 | 35 | Applies burning DOT |
| 5 | **Polaron Beam** | 230px | 2.5/sec | 11 | 160 | 58 | 32 | Applies stacking slow |

### Turret Placement Rules
- **Minimum Distance:** 64 pixels between turrets
- **Boundary Margin:** 32 pixels from screen edge
- **Validation:** Must afford cost + valid position

### Weapon Categories

#### Beam Weapons (Instant Hit)
- Phaser Array
- Disruptor Bank
- Tetryon Beam
- Polaron Beam

#### Projectile Weapons (Travel Time)
- Torpedo Launcher
- Plasma Cannon

### Damage Calculation

```typescript
// Standard damage flow
finalDamage = baseDamage

// Check for weapon properties
if (hasShield && hasWeaponProperties) {
  finalDamage *= shieldDamageMultiplier
} else if (!hasShield && hasWeaponProperties) {
  finalDamage *= hullDamageMultiplier
}

// Apply to shields first
if (currentShield > 0) {
  shieldDamage = min(currentShield, finalDamage)
  shield -= shieldDamage
  finalDamage -= shieldDamage
}

// Apply remaining to health
health -= finalDamage
```

---

## Enemy Factions

### Faction Overview

| ID | Faction | Shape | Color | Health | Shield | Behavior | Introduction |
|----|---------|-------|-------|--------|--------|----------|--------------|
| 1 | **Klingon** | Triangle | #DD4444 (Red) | 80 | 30 | DIRECT | Wave 1 |
| 2 | **Romulan** | Crescent | #99CC33 (Lime) | 70 | 60 | STRAFE | Wave 4 |
| 3 | **Borg** | Square | #22EE22 (Green) | 150 | 100 | SWARM | Wave 7 |
| 4 | **Tholian** | Diamond | #FF7700 (Orange) | 60 | 40 | ORBIT | Wave 10 |
| 5 | **Species 8472** | Tripod | #CC99FF (Lavender) | 200 | 0 | HUNTER | Wave 10 |

### Faction Details

#### Klingon Empire
- **Role:** Basic attacker
- **Behavior:** Aggressive bee-line to target
- **Aggression:** 1.0 (maximum)
- **Strategy:** Fast, direct assault in V-formations

#### Romulan Star Empire
- **Role:** Evasive attacker
- **Behavior:** Sinusoidal movement while approaching
- **Aggression:** 0.6 (cautious)
- **Strategy:** Hard to hit, higher shields than health

#### Borg Collective
- **Role:** Tank
- **Behavior:** Swarm movement with organic noise
- **Aggression:** 0.8 (relentless)
- **Strategy:** High survivability, slow but inevitable

#### Tholian Assembly
- **Role:** Ranged attacker
- **Behavior:** Approach slowly, then orbit and shoot
- **Aggression:** 0.5 (defensive)
- **Weapon:** Disruptor Bolt (15 damage, 0.5/sec fire rate, 350 range)
- **Strategy:** Maintains distance, fires projectiles

#### Species 8472
- **Role:** Turret hunter (boss-tier)
- **Behavior:** Prioritizes attacking nearest turret
- **Aggression:** 1.0 (maximum)
- **Strategy:** No shields but massive health, targets defenses

---

## AI Behavior System

### Behavior Types (6 Patterns)

#### 1. DIRECT (Klingon)
```
Calculate direction to Kobayashi Maru
Maintain current speed magnitude
Move directly toward target
```

#### 2. STRAFE (Romulan)
```
Calculate direction to target
Add sinusoidal perpendicular movement
Frequency: 3 Hz
Amplitude: 0.5
Result: Weaving approach pattern
```

#### 3. FLANK (Tholian alternate)
```
Determine flank side based on entity ID
Apply rotation to movement vector
Angle = 45° at distance, decreasing as approach
Result: Spiral approach from sides
```

#### 4. SWARM (Borg)
```
Calculate direction to target
Add noise using sin/cos functions
Frequency: 0.5 Hz
Amplitude: 0.2
Result: Organic, group-like movement
```

#### 5. HUNTER (Species 8472)
```
Find nearest turret using spatial query
If turret found: target turret
Else: target Kobayashi Maru
Use DIRECT movement toward target
```

#### 6. ORBIT (Tholian)
```
Phase 1: Approach slowly until within orbit radius (300px)
Phase 2: Circle around target at orbit speed (50 px/sec)
  - Maintain orbit distance with correction factor
  - Add slight oscillation for variety
Fire weapons while orbiting
```

### Orbit Configuration
| Parameter | Value |
|-----------|-------|
| Orbit Radius | 300 pixels |
| Orbit Speed | 50 px/sec |
| Approach Speed | 40 px/sec |

---

## Combat System

### Turret Targeting Logic

```
1. Check current target validity:
   - Still exists
   - Still has health > 0
   - Still in range
   - Still an enemy

2. If current target invalid:
   - Query spatial hash for entities in range
   - Filter for enemies only (non-Federation)
   - Select closest enemy
   - Set as new target

3. Fire rate cooldown:
   - cooldown = 1 / fireRate seconds
   - Check (currentTime - lastFired) >= cooldown

4. Fire weapon:
   - Beam weapons: instant hit damage
   - Projectiles: spawn entity toward target
   - Apply status effects if weapon has them
```

### Enemy Combat (Tholians)

Tholian ships have an `EnemyWeapon` component:
- Fire disruptor bolts at Kobayashi Maru
- Range: 350 pixels
- Fire rate: 0.5/sec (every 2 seconds)
- Damage: 15 per hit

### Collision Damage

When enemies collide with Kobayashi Maru:
- **Collision Radius:** 40 pixels
- **Collision Damage:** 25 HP

---

## Wave System

### Pre-defined Waves (1-10)

| Wave | Klingon | Romulan | Borg | Tholian | S.8472 | Total | Theme |
|------|---------|---------|------|---------|--------|-------|-------|
| 1 | 5 | - | - | - | - | 5 | Introduction |
| 2 | 8 | - | - | - | - | 8 | More Klingons |
| 3 | 10 | - | - | - | - | 10 | V-Formation |
| 4 | 8 | 4 | - | - | - | 12 | Romulan Introduction |
| 5 | 10 | 6 | - | - | - | 16 | Mixed Forces |
| 6 | 6 | 10 | - | - | - | 16 | Romulan Focus |
| 7 | 8 | 6 | 2 | - | - | 16 | Borg Introduction |
| 8 | 10 | 8 | 4 | - | - | 22 | Borg Presence |
| 9 | 12 | 10 | 6 | - | - | 28 | Full Assault |
| 10 | 15 | 12 | 8 | 4 | 2 | 41 | All Factions |

### Procedural Generation (Wave 11+)

```typescript
// After wave 10, waves are procedurally generated
baseMultiplier = 1 + (waveNumber - 10) * 0.2  // +20% per wave
exponentialFactor = 1.1^(waveNumber - 10)

// Spawn delays decrease (faster spawning)
delayMultiplier = max(0.5, 1 - (waveNumber - 10) * 0.05)

// Example Wave 15:
// Klingon: 15 * 2.0 * 1.61 = ~48 ships
// Romulan: 12 * 2.0 * 1.61 = ~39 ships
// Borg: 8 * 2.0 * 1.61 = ~26 ships
// Tholian: 4 * 2.0 * 1.61 = ~13 ships
// Species 8472: 2 * 2.0 * 1.61 = ~6 ships
```

### Difficulty Scaling

```typescript
// Health/Shield multiplier per wave
if (waveNumber <= 10) {
  scale = 1 + (waveNumber - 1) * 0.05  // +5% per wave
} else {
  baseScale = 1.45  // Wave 10 scale
  scale = baseScale * 1.03^(waveNumber - 10)  // +3% exponential
}

// Example: Wave 10 = 1.45x stats, Wave 20 = 1.95x stats
```

### Spawn Formations

| Formation | Description | Used By |
|-----------|-------------|---------|
| `random` | Random positions along screen edges | Default |
| `cluster` | Grouped spawning | Romulan, Borg |
| `v-formation` | V-shaped formation | Klingon |

### Wave Events
- `WAVE_STARTED` - New wave begins
- `WAVE_COMPLETED` - All enemies defeated
- 3-second delay between waves

---

## Scoring System

### Score Data Structure

```typescript
interface ScoreData {
  timeSurvived: number;     // Seconds survived
  waveReached: number;      // Highest wave completed
  enemiesDefeated: number;  // Total kills
  civiliansSaved: number;   // Future feature
}
```

### Score Calculation

```typescript
function calculateScore(data: ScoreData): number {
  const timePoints = Math.floor(data.timeSurvived * 10);
  const wavePoints = data.waveReached * 1000;
  const killPoints = data.enemiesDefeated * 50;
  
  return timePoints + wavePoints + killPoints;
}
```

### High Score Persistence
- Stored in localStorage
- Top 10 scores retained
- Sorted by calculated score (descending)

---

## Status Effects System

### Available Status Effects

#### 1. Burning (Plasma Cannon)
| Property | Value |
|----------|-------|
| Damage per Tick | 4 HP |
| Duration | 5 seconds |
| Tick Interval | 1 second |
| Total Damage | 20 HP |

#### 2. Slowed (Polaron Beam)
| Property | Value |
|----------|-------|
| Slow Amount | Configurable |
| Effect | Reduces velocity |
| Duration | Configurable |

#### 3. Drained (Polaron Beam)
| Property | Value |
|----------|-------|
| Max Stacks | 3 |
| Slow per Stack | 10% |
| Duration per Stack | 3 seconds |

#### 4. Disabled (Phaser - 5% chance)
| Property | Value |
|----------|-------|
| Systems | Weapons (1), Engines (2), Shields (4) |
| Duration | Configurable |
| Effect | Systems offline |

### Status Effect Processing Order

1. Update burning timers, apply damage
2. Decrement slow duration, restore speed on expire
3. Decrement drain duration, reduce stacks on expire
4. Decrement disabled duration, restore systems on expire

---

## Technical Implementation

### ECS Architecture

```
World (bitECS)
├── Components (data containers)
│   ├── Position { x, y }
│   ├── Velocity { x, y }
│   ├── Health { current, max }
│   ├── Shield { current, max }
│   ├── Faction { id }
│   ├── Turret { range, fireRate, damage, lastFired, turretType }
│   ├── Target { entityId, hasTarget }
│   ├── AIBehavior { behaviorType, stateTimer, targetX, targetY, aggression }
│   ├── Projectile { damage, speed, lifetime, targetEntityId, projectileType }
│   ├── WeaponProperties { shieldMult, hullMult, critChance, aoeRadius, statusType }
│   └── Status Effects { Burning, Slowed, Drained, Disabled }
│
├── Systems (logic processors)
│   ├── CollisionSystem (priority 10)
│   ├── AISystem (priority 20)
│   ├── MovementSystem (priority 30)
│   ├── StatusEffectSystem (priority 35)
│   ├── EnemyCollisionSystem (priority 38)
│   ├── TargetingSystem (priority 40)
│   ├── CombatSystem (priority 50)
│   ├── EnemyCombatSystem (priority 55)
│   ├── ProjectileSystem (priority 60)
│   ├── EnemyProjectileSystem (priority 62)
│   └── DamageSystem (priority 70)
│
└── Entity Factory
    ├── createFederationShip()
    ├── createKlingonShip()
    ├── createRomulanShip()
    ├── createBorgShip()
    ├── createTholianShip()
    ├── createSpecies8472Ship()
    ├── createKobayashiMaru()
    ├── createTurret()
    ├── createProjectile()
    └── createEnemyProjectile()
```

### System Execution Order

| Priority | System | Dependencies |
|----------|--------|--------------|
| 10 | Collision | - |
| 20 | AI | gameTime |
| 30 | Movement | deltaTime |
| 35 | Status Effects | deltaTime |
| 38 | Enemy Collision | - |
| 40 | Targeting | - |
| 50 | Combat | gameTime |
| 55 | Enemy Combat | gameTime |
| 60 | Projectile | deltaTime |
| 62 | Enemy Projectile | deltaTime |
| 70 | Damage | - |

### Spatial Hash Optimization

```typescript
Cell Size: 64 pixels
Grid: 30x17 cells (1920/64 x 1080/64)
Query Complexity: O(N) where N = entities in nearby cells
```

### Event System (EventBus)

| Event | Payload | Triggers |
|-------|---------|----------|
| `ENEMY_KILLED` | entityId, factionId, x, y | Enemy health reaches 0 |
| `WAVE_STARTED` | waveNumber, totalEnemies | Wave begins |
| `WAVE_COMPLETED` | waveNumber | All enemies defeated |
| `RESOURCE_UPDATED` | current, amount | Resources change |

---

## Game Configuration Constants

```typescript
// Core Game Settings
GAME_CONFIG = {
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
  TURRET_RADIUS: 20
}
```

---

## Summary

Kobayashi Maru implements a complete tower defense gameplay loop with:

1. **Strategic Turret Placement** - 6 turret types with unique roles
2. **Dynamic Enemy Behaviors** - 6 factions with distinct AI patterns
3. **Progressive Difficulty** - Scripted early waves, procedural late game
4. **Status Effect Combat** - Burning, slowing, and draining mechanics
5. **Resource Management** - Earn from kills, spend on turrets
6. **Infinite Replayability** - Endless waves with scaling difficulty

The game successfully captures the Star Trek theme while providing engaging tower defense mechanics. The ECS architecture ensures performance at scale, and the procedural wave generation provides endless challenge.
