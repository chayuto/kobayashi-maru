# Recommendation: Environmental Hazards

**Date:** 2025-12-01  
**Priority:** MEDIUM  
**Complexity:** Medium  
**Impact:** Map variety, tactical decisions, emergent gameplay

---

## Overview

Introduce dynamic environmental hazards and space phenomena that affect both enemies and turrets, creating tactical opportunities and forcing adaptive strategies.

---

## Current State

The battlefield is currently a static, empty void:
- Pure black background with parallax starfield
- No obstacles or terrain features
- No environmental effects
- Every game plays on identical map

**Problems:**
- Lack of tactical variety
- No reason to consider battlefield zones
- Missing Star Trek environmental flavor
- Repetitive visual experience

---

## Proposed Environmental System

### Hazard Categories

| Category | Affects | Duration | Spawning |
|----------|---------|----------|----------|
| **Nebulae** | Targeting/Shields | Permanent | Map zones |
| **Asteroids** | Movement/Collisions | Permanent | Scattered |
| **Anomalies** | Various effects | Temporary | Wave-based |
| **Debris Fields** | Speed/Damage | Wave-created | Enemy deaths |

---

## Nebula Types

### 1. **Mutara Nebula** (Sensor Disruption)

**"Shields and sensors are useless here."**

```typescript
interface MutaraNebula {
  type: 'SENSOR_DISRUPTION',
  effects: {
    turrets: {
      rangeReduction: 0.5,        // -50% targeting range
      accuracyPenalty: 0.2        // 20% miss chance
    },
    enemies: {
      shieldDisabled: true,       // Shields offline
      speedBonus: 0               // No speed change
    },
    kobayashiMaru: {
      shieldRegenHalted: true     // No shield regen in nebula
    }
  },
  visual: 'Purple/pink swirling gas',
  size: 200-400 pixels radius
}
```

**Strategic Impact:**
- Enemies lose shields (easier kills)
- Turrets have reduced effectiveness
- Trade-off: place turrets outside nebula, lure enemies in

---

### 2. **Briar Patch** (Metreon Gas)

**"One phaser shot and we'll all go up in flames."**

```typescript
interface BriarPatch {
  type: 'EXPLOSIVE_GAS',
  effects: {
    projectiles: {
      detonateOnEntry: true,      // Torpedoes explode
      explosionRadius: 100,       // Chain reactions
      friendlyFire: true          // Damages everything
    },
    beamWeapons: {
      ignite: true,               // Beam fire ignites gas
      burnDamage: 5               // Damage per second in area
    }
  },
  visual: 'Orange/yellow cloudy patches',
  size: 150-300 pixels radius
}
```

**Strategic Impact:**
- Avoid placing Torpedo Launchers near
- Beam weapons create persistent damage zones
- Enemies take damage passing through ignited areas

---

### 3. **Badlands Plasma Storm**

**"Plasma eddies ahead!"**

```typescript
interface PlasmaStorm {
  type: 'PLASMA_STORM',
  effects: {
    periodic: {
      interval: 3000,             // Every 3 seconds
      damage: 15,                 // To all entities in zone
      shieldBypass: 0.5           // 50% bypasses shields
    },
    movement: {
      pushDirection: 'outward',   // Push away from center
      pushStrength: 20            // Pixels per second
    }
  },
  visual: 'Red/orange lightning arcs',
  size: 100-200 pixels radius
}
```

**Strategic Impact:**
- Avoid placing turrets in storm zones
- Pushes enemies away (can delay their approach)
- Damages both friend and foe

---

## Asteroid Field

### Static Asteroids

```typescript
interface Asteroid {
  position: { x: number, y: number },
  radius: 30-80,  // Variable sizes
  type: 'SOLID' | 'BREAKABLE' | 'RESOURCE',
  
  collisionEffects: {
    enemies: {
      damage: 20,                 // Per collision
      speedReduction: 0.5,        // Slowed on impact
      pathRecalculation: true     // Must navigate around
    },
    projectiles: {
      blocked: true,              // Stops projectiles
      breakable: false            // Unless BREAKABLE type
    }
  }
}
```

**Strategic Impact:**
- Enemies must path around asteroids
- Natural chokepoints for turret placement
- Blocks line of sight for ranged attacks

### Resource Asteroids

```typescript
interface ResourceAsteroid {
  type: 'RESOURCE',
  resourceYield: 50,              // Matter when destroyed
  health: 100,
  
  // Player can target with turrets to harvest
  harvestable: true
}
```

**Strategic Impact:**
- Risk/reward: spend firepower on resources
- Strategic timing: harvest during quiet moments

---

## Temporal Anomalies

### Time Dilation Zone

**"Time is... moving differently here."**

```typescript
interface TimeDilationZone {
  type: 'TIME_DILATION',
  spawnTrigger: 'random per wave',
  duration: 15000,                // 15 seconds
  
  effects: {
    inside: {
      gameSpeedMultiplier: 0.5,   // Half speed
      appliesTo: 'all entities'
    }
  },
  visual: 'Blue rippling bubble',
  radius: 150
}
```

**Strategic Impact:**
- Slows incoming enemies (defensive tool)
- Also slows turret fire rate if placed inside
- Timing-based tactical decisions

---

### Spatial Rift

**"Something's tearing through subspace!"**

```typescript
interface SpatialRift {
  type: 'SPATIAL_RIFT',
  spawnTrigger: 'wave milestone (every 5 waves)',
  duration: 20000,
  
  behavior: {
    teleport: {
      entry: { x: number, y: number },
      exit: { x: number, y: number },
      applies: 'enemies and projectiles'
    }
  },
  visual: 'Swirling blue/white portal',
  radius: 50
}
```

**Strategic Impact:**
- Enemies teleport to unexpected locations
- Can be exploited: place turrets at exit
- Projectiles also teleport (aim through rifts)

---

## Wave-Specific Phenomena

### Borg Transwarp Conduit (Wave 7+)

```typescript
interface TranswarpConduit {
  trigger: 'Borg waves',
  effect: 'Borg spawn directly at conduit location',
  position: 'Random, but always 200px from center',
  visual: 'Green swirling vortex'
}
```

**Strategic Impact:**
- Borg bypass normal spawn points
- Forces turret coverage adjustment
- Creates urgency to destroy Borg quickly

### Romulan Cloaking Field (Wave 4+)

```typescript
interface CloakingField {
  trigger: 'Romulan waves',
  effect: 'Zone where enemies are invisible',
  position: 'Random edge of screen',
  radius: 150,
  visual: 'Shimmering transparent area'
}
```

**Strategic Impact:**
- Romulan spawns hidden until they exit field
- AOE weapons can still hit invisible enemies
- Creates "emergence" moments

---

## Debris System

### Enemy Death Debris

```typescript
// When enemies are destroyed, leave debris
interface Debris {
  source: 'enemy death',
  effects: {
    blocking: false,              // Doesn't block movement
    slowZone: 0.8,                // 20% slow in debris
    duration: 5000                // Despawns after 5 seconds
  },
  visual: 'Scattered metal fragments'
}
```

**Strategic Impact:**
- Kill zones become temporary slow zones
- Rewards focused fire in specific areas
- Visual feedback for combat hot spots

### Kobayashi Maru Damage Debris

```typescript
// When KM takes damage, emit debris
interface KMDebris {
  trigger: 'KM takes damage',
  count: Math.ceil(damage / 50),  // More debris for big hits
  effects: {
    enemyDamage: 5,               // Damages enemies on contact
    duration: 10000
  },
  visual: 'Burning hull fragments'
}
```

**Strategic Impact:**
- Taking damage creates defensive debris
- Psychological: see the destruction spreading
- Slight benefit from damage taken

---

## Implementation Architecture

### EnvironmentManager

```typescript
class EnvironmentManager {
  private nebulae: Nebula[] = [];
  private asteroids: Asteroid[] = [];
  private anomalies: Anomaly[] = [];
  private debris: Debris[] = [];
  
  // Generate map layout
  generateEnvironment(seed: number): void {
    this.placeNebulae(seed);
    this.placeAsteroids(seed);
  }
  
  // Wave-specific additions
  onWaveStart(waveNumber: number): void {
    this.spawnAnomalies(waveNumber);
  }
  
  // Check entity interactions
  update(world: GameWorld, deltaTime: number): void {
    this.processNebulaEffects(world);
    this.processAsteroidCollisions(world);
    this.processAnomalyEffects(world, deltaTime);
    this.updateDebris(deltaTime);
  }
}
```

### Integration with Movement System

```typescript
// In movementSystem.ts
function movementSystem(world: GameWorld, deltaTime: number) {
  const entities = movementQuery(world);
  
  for (const eid of entities) {
    // Get base velocity
    let vx = Velocity.x[eid];
    let vy = Velocity.y[eid];
    
    // Check environmental effects
    const envEffects = environmentManager.getEffectsAt(
      Position.x[eid], 
      Position.y[eid]
    );
    
    // Apply slowdowns
    if (envEffects.slowMultiplier) {
      vx *= envEffects.slowMultiplier;
      vy *= envEffects.slowMultiplier;
    }
    
    // Apply push forces
    if (envEffects.pushForce) {
      vx += envEffects.pushForce.x;
      vy += envEffects.pushForce.y;
    }
    
    // Update position
    Position.x[eid] += vx * deltaTime;
    Position.y[eid] += vy * deltaTime;
  }
}
```

---

## Visual Rendering

### Layered Rendering Order

```
1. Deep background (stars)
2. Nebulae (large, semi-transparent)
3. Asteroids (solid objects)
4. Enemies and projectiles
5. Turrets
6. Anomaly effects (particles, lightning)
7. Debris (foreground particles)
8. UI overlay
```

### Performance Considerations

```typescript
// Use texture atlases for environment elements
// Limit particle counts per zone
// Cull off-screen environmental effects
// Use spatial partitioning for effect queries
```

---

## Map Variety

### Pre-Built Layouts

| Layout | Nebulae | Asteroids | Theme |
|--------|---------|-----------|-------|
| **Open Space** | 0-1 | 3-5 | Classic, minimal obstruction |
| **Nebula Dense** | 3-4 | 0-2 | Sensor warfare |
| **Asteroid Field** | 0-1 | 15-20 | Cover and chokepoints |
| **Badlands** | 2-3 | 5-10 | Hazardous throughout |
| **Graveyard** | 1-2 | 8-12 | Ship debris as obstacles |

### Random Generation

```typescript
function generateMapLayout(): MapLayout {
  const layout = new MapLayout();
  
  // Guarantee some clear space around KM
  const safeRadius = 300;
  
  // Random nebulae (0-3)
  for (let i = 0; i < random(0, 3); i++) {
    layout.addNebula(randomPositionOutside(safeRadius));
  }
  
  // Random asteroids (5-15)
  for (let i = 0; i < random(5, 15); i++) {
    layout.addAsteroid(randomPositionOutside(safeRadius / 2));
  }
  
  return layout;
}
```

---

## Player Engagement Benefits

### Tactical Decisions
- "Should I place turrets in the nebula?"
- "Can I funnel enemies through asteroids?"
- "Is this anomaly beneficial or harmful?"

### Emergent Gameplay
- Explosive chain reactions in Briar Patch
- Using debris fields strategically
- Teleporting torpedoes through rifts

### Visual Interest
- Every game looks different
- Dynamic battlefield feel
- Star Trek environmental authenticity

### Replayability
- Map variety forces strategy adaptation
- No "solved" optimal turret placement
- Learn to read terrain advantages

---

## Balance Considerations

### No Unfair Starts
- Safe zone around Kobayashi Maru always clear
- Initial turret placement area guaranteed safe
- Hazards don't spawn directly on KM

### Equal Opportunity
- Environmental effects hurt enemies too
- Most hazards can be exploited by player
- No purely negative environmental effects

### Scaling with Difficulty
- Higher waves: more anomalies
- Boss waves: specific themed environments
- Procedural waves: random but balanced generation

---

## Conclusion

Environmental hazards transform the static battlefield into a dynamic tactical puzzle. Players must read terrain, exploit phenomena, and adapt their strategies to ever-changing conditions. Combined with the Star Trek thematic elements, this creates a richer, more immersive, and highly replayable experience.

**Estimated Implementation Time:** 4-5 days  
**Risk Level:** Medium (requires rendering changes)  
**ROI:** Significant variety and immersion improvement
