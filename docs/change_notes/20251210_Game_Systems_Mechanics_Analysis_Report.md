# Kobayashi Maru: Game Systems & Mechanics Analysis Report

**Prepared for:** Senior Game Designer  
**Date:** December 10, 2025  
**Report Type:** Technical Analysis with Improvement Recommendations  

---

## Executive Summary

This report provides a comprehensive analysis of the **Kobayashi Maru** game codebase, mapping current implementation against the research recommendations outlined in the "Game Improvement Report." The game is a Star Trek-themed tower defense with survivor-like mechanics, built on a modern ECS architecture (bitECS + PixiJS v8).

### Key Findings

| Area | Current State | Research Alignment | Priority |
|------|---------------|-------------------|----------|
| **AI System** | 5 behavior types | Partial - Missing boids | HIGH |
| **Wave System** | Procedural + Boss waves | Good foundation | MEDIUM |
| **Visual Effects** | Basic particles/shake | Missing advanced shaders | HIGH |
| **Meta-Progression** | Not implemented | Critical gap | HIGH |
| **LCARS UI** | Basic implementation | Needs modernization | MEDIUM |
| **Audio** | Sound effects only | Missing procedural audio | MEDIUM |

---

## 1. Entity-Component-System Architecture

### 1.1 Current Components

The game uses a well-designed ECS with typed arrays for performance:

```typescript
// Core Components (src/ecs/components.ts)
Position { x: f32, y: f32 }
Velocity { vx: f32, vy: f32 }
Health { current: f32, max: f32 }
Shield { current: f32, max: f32 }
Faction { id: ui8 }
AIBehavior { behaviorType: ui8, stateTimer: f32, targetX: f32, targetY: f32, aggression: f32 }
Turret { range: f32, fireRate: f32, damage: f32, lastFired: f32, turretType: ui8 }
```

### 1.2 Status Effect Components

```typescript
Burning { damagePerTick: f32, tickInterval: f32, timeRemaining: f32 }
Slowed { factor: f32, timeRemaining: f32, stackCount: ui8 }
Drained { duration: f32, disabledSystems: ui8 }  // Bitfield: 1=weapons, 2=engines, 4=shields
```

### 1.3 Enemy Variant System

```typescript
EnemyVariant { rank: ui8 }  // NORMAL=0, ELITE=1, BOSS=2
EnemyAbility { abilityType: ui8, cooldownRemaining: f32, isActive: ui8 }
```

**✅ STRENGTH:** Clean separation of concerns, cache-friendly typed arrays  
**⚠️ GAP:** No components for boid flocking (separation, alignment, cohesion vectors)

---

## 2. AI & Movement System

### 2.1 Current AI Behaviors

| Behavior | Code Location | Implementation | Research Recommendation |
|----------|---------------|----------------|------------------------|
| **DIRECT** | `aiSystem.ts:141-155` | Straight line to target | Klingon "Wolf Pack" boids |
| **STRAFE** | `aiSystem.ts:157-204` | Sinusoidal weaving | Romulan encirclement |
| **FLANK** | `aiSystem.ts:206-241` | Side approach | More organic flanking |
| **SWARM** | `aiSystem.ts:243-276` | Group movement | Full boids implementation |
| **ORBIT** | `aiSystem.ts:302-349` | Circular approach | Tholian web formation |

### 2.2 Boids Implementation Gap

**Current:** Each enemy moves independently with simple target-seeking.

**Recommended:** Full boids algorithm with:
- **Separation:** Steer to avoid crowding neighbors
- **Alignment:** Steer toward average heading of neighbors  
- **Cohesion:** Steer toward average position of neighbors
- **Pursuit:** Target player/Kobayashi Maru

**Implementation Priority:** HIGH

```typescript
// Suggested new component
FlockingBehavior {
  separationWeight: f32,
  alignmentWeight: f32,
  cohesionWeight: f32,
  viewRadius: f32
}
```

### 2.3 Faction-Specific Boid Tuning (From Research)

| Faction | Separation | Alignment | Cohesion | Behavior |
|---------|------------|-----------|----------|----------|
| Klingon | High (1.5) | High (1.2) | Medium (0.8) | Wolf pack swoops |
| Romulan | Very High (2.0) | Low (0.5) | Low (0.5) | Encirclement |
| Borg | Zero (0.0) | High (2.0) | High (2.0) | Terrifying wall |
| Tholian | Low (0.5) | High (1.5) | Very High (3.0) | Geometric web |

---

## 3. Combat System Analysis

### 3.1 Turret Types

| Type | Range | Fire Rate | Damage | Cost | Special Effect |
|------|-------|-----------|--------|------|----------------|
| **Phaser Array** | 200 | 4.0 | 10 | 100 | High fire rate |
| **Torpedo Launcher** | 350 | 0.5 | 50 | 200 | Highest damage/range |
| **Disruptor Bank** | 250 | 2.0 | 15 | 150 | Balanced |
| **Tetryon Beam** | 220 | 3.0 | 12 | 150 | 3x shield damage |
| **Plasma Cannon** | 200 | 1.0 | 8 | 180 | Burning DOT |
| **Polaron Beam** | 230 | 2.5 | 11 | 160 | Stacking slow |

### 3.2 Upgrade System (Per Turret)

| Path | Max Level | Costs | Effect |
|------|-----------|-------|--------|
| Damage | 3 | 50/100/200 | +25%/50%/100% |
| Range | 3 | 40/80/160 | +20%/40%/80% |
| Fire Rate | 3 | 60/120/240 | +30%/60%/120% |
| Multi-Target | 2 | 150/300 | 2/3 targets |
| Special | 3 | 75/150/300 | Turret-specific |

**✅ STRENGTH:** Good variety of weapon types with meaningful specialization  
**⚠️ GAP:** Special upgrades not fully implemented (level 3 effects)

### 3.3 Beam Visual System

```typescript
// Current beam implementation (combatSystem.ts:57-120)
BeamSegment { startX, startY, endX, endY, offset }
BEAM_SEGMENT_COUNT = 5  // Electricity jitter effect
JITTER: { PHASER: 6, DISRUPTOR: 10, TETRYON: 12, POLARON: 9, PLASMA: 8 }
```

**✅ STRENGTH:** Jitter effect creates visual variety  
**⚠️ GAP:** Missing shader-based glow and intensity pulsing

---

## 4. Enemy Faction System

### 4.1 Current Factions

| Faction | Texture | Base Stats | Behavior |
|---------|---------|------------|----------|
| **FEDERATION** | Circle | Player turrets | N/A |
| **KLINGON** | Bird of Prey | Fast, aggressive | DIRECT |
| **ROMULAN** | Warbird | Evasive | STRAFE |
| **BORG** | Cube | Slow, tanky | Relentless |
| **THOLIAN** | Crystalline | Fast | Web formation |
| **SPECIES_8472** | Bioship | Very powerful | Elite threat |

### 4.2 Enemy Ranks & Multipliers

| Rank | Health | Damage | Size | Score | Resources |
|------|--------|--------|------|-------|-----------|
| Normal | 1.0x | 1.0x | 1.0x | 1.0x | 1.0x |
| Elite | 3.0x | 1.5x | 1.3x | 3.0x | 3.0x |
| Boss | 10.0x | 2.0x | 2.0x | 10.0x | 10.0x |

### 4.3 Boss Abilities

| Ability | Cooldown | Duration | Effect |
|---------|----------|----------|--------|
| TELEPORT | 8.0s | Instant | Range: 300px |
| CLOAK | 15.0s | 5.0s | Alpha: 0.2 |
| SHIELD_REGEN | Passive | - | 5% per tick |
| SPLIT | On death | - | 2-3 fragments |
| SUMMON | 20.0s | Instant | Range: 100px |
| DRAIN | 5.0s | 3.0s | Range: 200px |
| EMP_BURST | 12.0s | 2.0s | Range: 250px |
| RAMMING_SPEED | 10.0s | 3.0s | Speed boost |

**✅ STRENGTH:** Good variety of boss mechanics  
**⚠️ GAP:** No visual feedback for ability activation

---

## 5. Wave System

### 5.1 Wave Configuration

```typescript
// Pre-defined waves (1-10)
WAVE_CONFIGS: WaveConfig[]

// Procedural generation (11+)
generateProceduralWave(waveNumber): WaveConfig

// Difficulty scaling
getDifficultyScale(waveNumber): number  // Scales health/speed
```

### 5.2 Boss Wave Schedule

| Wave | Boss Type | Count | Abilities | Support Enemies |
|------|-----------|-------|-----------|-----------------|
| 5 | Borg | 1 | SHIELD_REGEN, SUMMON | 10 Klingon |
| 10 | Species 8472 | 1 | TELEPORT, DRAIN | 15 Klingon, 10 Romulan |
| 20 | Species 8472 | 2 | SHIELD_REGEN, SPLIT | 20 Borg, 10 Tholian |

### 5.3 Story System

```typescript
// 50 unique story entries (waveStories.json)
// Loops after wave 50
getWaveStoryText(waveNumber): string
```

**✅ STRENGTH:** Procedural wave generation with thematic story texts  
**⚠️ GAP:** No "Director" AI for adaptive pacing (research recommendation)

---

## 6. Visual & Rendering System

### 6.1 Particle System

```typescript
// Emitter patterns (ParticleSystem.ts)
EmitterPattern {
  CIRCULAR, CONE, RING, SPIRAL, BURST, FOUNTAIN
}

// Particle configuration
ParticleConfig {
  x, y, count,
  speed: { min, max },
  life: { min, max },
  size: { min, max },
  color, colorGradient?,
  gravity?, drag?, trail?
}
```

### 6.2 Screen Shake Implementation

```typescript
// Current (ScreenShake.ts) - Uses random noise
shake(intensity, duration): void
update(deltaTime): { offsetX, offsetY }
// Random formula: (Math.random() - 0.5) * 2 * currentIntensity
```

**⚠️ GAP:** Research recommends **Perlin noise** for shake:
> "Random noise feels 'jittery'; Perlin noise feels 'heavy,' simulating the inertia of a massive starship"

### 6.3 Missing Visual Effects (From Research)

| Effect | Priority | Description |
|--------|----------|-------------|
| **SDF Shield Shader** | HIGH | Localized ripple at impact point |
| **Warp Speed Filter** | MEDIUM | Radial blur for level-up moments |
| **Bloom Effect** | MEDIUM | Glow for phasers, engines, explosions |
| **Chromatic Aberration** | LOW | Increases as health decreases |

---

## 7. UI System Analysis

### 7.1 Current UI Components

| Component | Status | Notes |
|-----------|--------|-------|
| HUDManager | ✅ Complete | Wave, health, resources |
| TurretMenu | ✅ Complete | Turret selection |
| TurretUpgradePanel | ✅ Complete | Upgrade interface |
| GameOverScreen | ✅ Complete | Score breakdown |
| PauseOverlay | ✅ Complete | Pause/resume/quit |
| MessageLog | ✅ Complete | Event notifications |

### 7.2 Game Over Score Calculation

```typescript
SCORE_MULTIPLIERS = {
  TIME: 10,      // 10 points per second survived
  KILLS: 100,    // 100 points per enemy defeated
  WAVE: 500      // 500 points per wave reached
}
```

### 7.3 LCARS Modernization Gaps

Per research recommendations:
- ❌ Dynamic UI reaction to game state (glitches when shields hit)
- ❌ Strict color coding (Orange=interactable, Blue=data, Red=warnings)
- ❌ Diegetic UI integration (shield bar as LCARS element)

---

## 8. Critical Missing Systems

### 8.1 Meta-Progression (NOT IMPLEMENTED)

**Research Priority: CRITICAL**

The research document strongly emphasizes meta-progression as "the glue that holds the Survivor-like genre together."

**Recommended Implementation:**

```typescript
// Persistent entities between runs
PersistentStats {
  totalPlayTime: f32,
  totalEnemiesDefeated: u32,
  highestWaveReached: u16,
  shiipsUnlocked: u8[]
}

// Unlockable "Simulation Overrides"
SimulationOverride {
  id: string,
  name: string,
  effect: UpgradeEffect,
  cost: number  // "Log Data" or "Merits"
}
```

### 8.2 Flow Field Pathfinding (NOT IMPLEMENTED)

**Research Priority: HIGH**

Current: Individual A* or direct paths (O(N) per entity)  
Recommended: Flow field for 5000+ entities (O(1) per entity)

```typescript
// Flow field grid
FlowField {
  cellSize: number,
  grid: Vector2[][],  // Direction vectors
  target: Vector2
}
```

### 8.3 "Director" AI (NOT IMPLEMENTED)

**Research Priority: MEDIUM**

Adaptive difficulty controller to manage pacing:

```typescript
DirectorState {
  intensityCurve: 'buildup' | 'peak' | 'relief',
  playerStressLevel: f32,
  spawnRateMultiplier: f32
}
```

---

## 9. Performance Optimizations

### 9.1 Current Optimizations

| Feature | Implementation | Notes |
|---------|---------------|-------|
| Entity Pooling | ✅ `PoolManager.ts` | Reuses enemy/projectile entities |
| Spatial Hashing | ✅ `collision/` | O(N) collision detection |
| Texture Caching | ✅ `TextureCache.ts` | Reuses faction textures |
| Quality Scaling | ✅ `QualityManager.ts` | Adjusts particle count |

### 9.2 Recommended Optimizations (From Research)

| Optimization | Current | Recommended |
|--------------|---------|-------------|
| **ParticleContainer** | Standard Container | PixiJS v8 ParticleContainer with static properties |
| **Texture Atlas** | Individual textures | Single spritesheet for all enemies |
| **Instanced Rendering** | N/A | For 5000+ projectiles |
| **Spatial Partitioning** | Hash grid | Quadtree for boid neighbor queries |

---

## 10. Improvement Recommendations

### 10.1 Priority 1 - Core Gameplay Loop

| Feature | Effort | Impact | Recommendation |
|---------|--------|--------|----------------|
| Boids Algorithm | Medium | HIGH | Implement for Klingon/Borg factions first |
| Meta-Progression | High | CRITICAL | Start with ship unlocks and permanent stat boosts |
| Director AI | Medium | HIGH | Implement intensity curve and spawn modulation |

### 10.2 Priority 2 - Visual Polish

| Feature | Effort | Impact | Recommendation |
|---------|--------|--------|----------------|
| Perlin Screen Shake | Low | MEDIUM | Replace random noise with coherent shake |
| Shield Impact Shader | Medium | HIGH | SDF-based ripple at damage location |
| Bloom Effect | Low | MEDIUM | Add to phasers and explosions |

### 10.3 Priority 3 - Audio Enhancement

| Feature | Effort | Impact | Recommendation |
|---------|--------|--------|----------------|
| Procedural Phasers | Medium | MEDIUM | Web Audio API synthesis with variation |
| Adaptive Music | High | MEDIUM | Layer-based intensity system |
| Computer Voice | Low | MEDIUM | "Shields at 20%" warnings |

---

## 11. Technical Debt

| Issue | Location | Risk | Action |
|-------|----------|------|--------|
| `any` type usage | Multiple files | Low | Convert to proper types |
| Unused color params | `textures.ts` | Low | Clean up function signatures |
| Hard-coded constants | Various | Medium | Centralize in config files |
| Missing test coverage | ECS systems | Medium | Add unit tests for core systems |

---

## 12. Conclusion

The Kobayashi Maru game has a **solid technical foundation** with its ECS architecture, wave system, and turret variety. However, to achieve the "visually stunning experience" outlined in the research document, the following areas require immediate attention:

1. **Boids Algorithm:** Transform enemy movement from robotic paths to organic swarms
2. **Meta-Progression:** Implement the "Cheating the Kobayashi Maru" upgrade system
3. **Visual Effects:** Add shader-based shield impacts and improved screen shake
4. **Director AI:** Implement adaptive pacing for tension/relief cycles

The game's Star Trek theming provides excellent narrative justification for the "endless defeat" mechanics—each death is a simulation run, contributing data for future attempts. This alignment between narrative and mechanics is a key strength that should be preserved and enhanced.

---

## Appendix A: File Reference

| System | Primary Files |
|--------|---------------|
| ECS Core | `src/ecs/components.ts`, `src/ecs/world.ts` |
| AI System | `src/systems/aiSystem.ts` |
| Combat | `src/systems/combatSystem.ts`, `src/systems/damageSystem.ts` |
| Wave System | `src/game/waveManager.ts`, `src/game/waveConfig.ts` |
| Rendering | `src/rendering/ParticleSystem.ts`, `src/rendering/textures.ts` |
| UI | `src/ui/HUDManager.ts`, `src/ui/GameOverScreen.ts` |
| Config | `src/types/config/turrets.ts`, `src/types/config/enemies.ts` |

## Appendix B: Research Document Reference

Source: `docs/research/Kobayashi Maru Game Improvement Report.md`

Key sections referenced:
- Section 4.1: Boids Algorithm Implementation
- Section 5.1: Reframing "Game Over"
- Section 5.2: Meta-Progression
- Section 6.1: Modernizing LCARS
- Section 6.2: Visual Effects via Shaders
