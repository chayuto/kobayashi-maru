# Enhancement Task 04: Explosion Shockwaves & Advanced Effects

**Date:** 2025-12-07  
**Priority:** CRITICAL  
**Category:** Visual Effects  
**Estimated Effort:** 1-2 days  
**Dependencies:** Task 01 (Advanced Particle System)

---

## Objective

Create visually spectacular explosions with expanding shockwaves, debris physics, smoke plumes, and size-appropriate effects for different explosion types.

---

## Current State

**Current Explosions**: Basic particle effects from `effectPresets.ts`
- `EXPLOSION_SMALL`: 20 orange particles
- `EXPLOSION_LARGE`: 40 orange particles
- Simple circular spread
- Fade out over time

**Limitations**:
- No shockwave rings
- No debris or secondary effects
- All explosions look similar
- No size differentiation
- No impact on nearby entities

---

## Proposed Enhancements

### 1. Shockwave Ring System

**Goal**: Expanding circular rings that emanate from explosion center

```typescript
// src/rendering/ShockwaveRenderer.ts

export interface Shockwave {
    id: string;
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    width: number;
    color: number;
    alpha: number;
    duration: number;
    elapsed: number;
    distortionIntensity?: number; // Optional distortion effect
}

export class ShockwaveRenderer {
    private shockwaves: Shockwave[] = [];
    private graphics: Graphics;
    
    constructor() {
        this.graphics = new Graphics();
    }
    
    /**
     * Create a shockwave
     */
    create(x: number, y: number, maxRadius: number, color: number, duration: number, distortion?: number): string {
        const id = `shockwave-${Date.now()}-${Math.random()}`;
        
        this.shockwaves.push({
            id,
            x,
            y,
            radius: 0,
            maxRadius,
            width: 8,
            color,
            alpha: 1.0,
            duration,
            elapsed: 0,
            distortionIntensity: distortion
        });
        
        return id;
    }
    
    /**
     * Update and render shockwaves
     */
    render(deltaTime: number): void {
        this.graphics.clear();
        
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const wave = this.shockwaves[i];
            wave.elapsed += deltaTime;
            
            // Remove expired shockwaves
            if (wave.elapsed >= wave.duration) {
                this.shockwaves.splice(i, 1);
                continue;
            }
            
            // Calculate progress
            const progress = wave.elapsed / wave.duration;
            wave.radius = wave.maxRadius * progress;
            wave.alpha = 1 - progress;
            
            // Render ring
            this.graphics.circle(wave.x, wave.y, wave.radius);
            this.graphics.stroke({
                color: wave.color,
                width: wave.width * (1 - progress * 0.5), // Width decreases
                alpha: wave.alpha
            });
            
            // Inner glow
            if (progress < 0.3) {
                const glowAlpha = (1 - progress / 0.3) * wave.alpha;
                this.graphics.circle(wave.x, wave.y, wave.radius * 0.8);
                this.graphics.stroke({
                    color: 0xFFFFFF,
                    width: wave.width * 2,
                    alpha: glowAlpha * 0.5
                });
            }
        }
    }
    
    /**
     * Get container for adding to stage
     */
    getGraphics(): Graphics {
        return this.graphics;
    }
}
```

### 2. Debris Physics System

**Goal**: Physical debris particles with gravity, rotation, and bounce

```typescript
// Add to ParticleSystem or create DebrisSystem

export interface DebrisParticle extends Particle {
    rotation: number;
    rotationSpeed: number;
    bounces: number;
    bounceDamping: number;
}

export interface DebrisConfig extends ParticleConfig {
    debrisTypes: ('metal' | 'hull' | 'spark' | 'chunk')[];
    rotationSpeed: { min: number; max: number };
    bounceCount: number;
    bounceDamping: number;
    gravity: number;
}

// Spawn debris
function spawnDebris(x: number, y: number, config: DebrisConfig): void {
    for (let i = 0; i < config.count; i++) {
        const debris: DebrisParticle = {
            // ... standard particle fields ...
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: config.rotationSpeed.min + 
                          Math.random() * (config.rotationSpeed.max - config.rotationSpeed.min),
            bounces: config.bounceCount,
            bounceDamping: config.bounceDamping
        };
        
        // Apply gravity
        debris.ay = config.gravity;
    }
}

// Update debris with physics
function updateDebris(debris: DebrisParticle, deltaTime: number): void {
    // Apply gravity
    debris.vy += debris.ay * deltaTime;
    
    // Apply rotation
    debris.rotation += debris.rotationSpeed * deltaTime;
    
    // Bounce off ground (y = GAME_HEIGHT)
    if (debris.y + debris.vy * deltaTime >= GAME_CONFIG.WORLD_HEIGHT) {
        if (debris.bounces > 0) {
            debris.vy *= -debris.bounceDamping;
            debris.bounces--;
            debris.rotationSpeed *= debris.bounceDamping;
        } else {
            debris.vy = 0;
            debris.rotationSpeed = 0;
        }
    }
}
```

### 3. Multi-Stage Explosions

**Goal**: Explosions with multiple stages (flash → fire → smoke)

```typescript
export interface ExplosionStage {
    delay: number;           // Delay before this stage starts (seconds)
    particles: ParticleConfig;
    shockwave?: {
        radius: number;
        color: number;
        duration: number;
    };
    debris?: DebrisConfig;
}

export interface ExplosionSequence {
    stages: ExplosionStage[];
}

export class ExplosionManager {
    private activeExplosions: Map<string, { 
        sequence: ExplosionSequence; 
        elapsed: number;
        stagesTriggered: boolean[];
    }> = new Map();
    
    /**
     * Trigger multi-stage explosion
     */
    explode(x: number, y: number, sequence: ExplosionSequence): void {
        const id = `explosion-${Date.now()}`;
        
        this.activeExplosions.set(id, {
            sequence,
            elapsed: 0,
            stagesTriggered: new Array(sequence.stages.length).fill(false)
        });
    }
    
    /**
     * Update active explosions
     */
    update(deltaTime: number): void {
        for (const [id, explosion] of this.activeExplosions) {
            explosion.elapsed += deltaTime;
            
            // Check each stage
            for (let i = 0; i < explosion.sequence.stages.length; i++) {
                const stage = explosion.sequence.stages[i];
                
                // Trigger stage if time reached and not yet triggered
                if (!explosion.stagesTriggered[i] && explosion.elapsed >= stage.delay) {
                    this.triggerStage(stage, explosion);
                    explosion.stagesTriggered[i] = true;
                }
            }
            
            // Remove if all stages complete
            const allComplete = explosion.stagesTriggered.every(t => t);
            const lastStage = explosion.sequence.stages[explosion.sequence.stages.length - 1];
            const totalDuration = lastStage.delay + (lastStage.particles.life.max || 1);
            
            if (allComplete && explosion.elapsed >= totalDuration) {
                this.activeExplosions.delete(id);
            }
        }
    }
    
    /**
     * Trigger a single stage
     */
    private triggerStage(stage: ExplosionStage, explosion: any): void {
        // Spawn particles
        this.particleSystem.spawn(stage.particles);
        
        // Create shockwave if defined
        if (stage.shockwave) {
            this.shockwaveRenderer.create(
                stage.particles.x,
                stage.particles.y,
                stage.shockwave.radius,
                stage.shockwave.color,
                stage.shockwave.duration
            );
        }
        
        // Spawn debris if defined
        if (stage.debris) {
            this.spawnDebris(stage.debris);
        }
    }
}
```

### 4. Explosion Type Presets

**Goal**: Pre-defined explosion sequences for different scenarios

```typescript
// Add to effectPresets.ts

export const EXPLOSION_SEQUENCES = {
    // Small enemy death
    SMALL_EXPLOSION: {
        stages: [
            {
                delay: 0,
                particles: {
                    x: 0, y: 0,  // Set at runtime
                    count: 30,
                    speed: { min: 100, max: 250 },
                    life: { min: 0.3, max: 0.7 },
                    size: { min: 3, max: 8 },
                    sprite: 'fire',
                    colorGradient: {
                        stops: [
                            { time: 0, color: 0xFFFFFF, alpha: 1.0 },
                            { time: 0.2, color: 0xFFFF00, alpha: 1.0 },
                            { time: 0.6, color: 0xFF6600, alpha: 0.6 },
                            { time: 1.0, color: 0x663300, alpha: 0.0 }
                        ]
                    },
                    spread: Math.PI * 2
                },
                shockwave: {
                    radius: 60,
                    color: 0xFF9900,
                    duration: 0.3
                }
            }
        ]
    },
    
    // Large enemy or turret destruction
    LARGE_EXPLOSION: {
        stages: [
            // Stage 1: Initial flash
            {
                delay: 0,
                particles: {
                    x: 0, y: 0,
                    count: 50,
                    speed: { min: 150, max: 400 },
                    life: { min: 0.4, max: 1.0 },
                    size: { min: 5, max: 15 },
                    sprite: 'fire',
                    colorGradient: {
                        stops: [
                            { time: 0, color: 0xFFFFFF, alpha: 1.0 },
                            { time: 0.1, color: 0xFFFF00, alpha: 1.0 },
                            { time: 0.4, color: 0xFF6600, alpha: 0.8 },
                            { time: 0.8, color: 0xFF3300, alpha: 0.4 },
                            { time: 1.0, color: 0x440000, alpha: 0.0 }
                        ]
                    },
                    spread: Math.PI * 2
                },
                shockwave: {
                    radius: 120,
                    color: 0xFFFFFF,
                    duration: 0.5
                },
                debris: {
                    count: 15,
                    debrisTypes: ['metal', 'chunk'],
                    rotationSpeed: { min: -5, max: 5 },
                    bounceCount: 2,
                    bounceDamping: 0.6,
                    gravity: 200
                }
            },
            // Stage 2: Secondary burst
            {
                delay: 0.15,
                particles: {
                    x: 0, y: 0,
                    count: 30,
                    speed: { min: 80, max: 180 },
                    life: { min: 0.6, max: 1.4 },
                    size: { min: 8, max: 20 },
                    sprite: 'smoke',
                    colorGradient: {
                        stops: [
                            { time: 0, color: 0x666666, alpha: 0.8 },
                            { time: 0.5, color: 0x888888, alpha: 0.5 },
                            { time: 1.0, color: 0xAAAAAA, alpha: 0.0 }
                        ]
                    },
                    spread: Math.PI * 2,
                    gravity: -30  // Rise upward
                },
                shockwave: {
                    radius: 100,
                    color: 0xFF6600,
                    duration: 0.4
                }
            },
            // Stage 3: Smoke plume
            {
                delay: 0.4,
                particles: {
                    x: 0, y: 0,
                    count: 40,
                    speed: { min: 30, max: 80 },
                    life: { min: 1.5, max: 3.0 },
                    size: { min: 10, max: 30 },
                    sprite: 'smoke',
                    scaleStart: 1.0,
                    scaleEnd: 3.0,
                    colorGradient: {
                        stops: [
                            { time: 0, color: 0x333333, alpha: 0.7 },
                            { time: 0.6, color: 0x666666, alpha: 0.4 },
                            { time: 1.0, color: 0x999999, alpha: 0.0 }
                        ]
                    },
                    spread: Math.PI * 0.6,
                    gravity: -40,
                    drag: 0.95
                }
            }
        ]
    },
    
    // Massive Kobayashi Maru destruction
    KOBAYASHI_MARU_EXPLOSION: {
        stages: [
            // Stage 1: Core breach
            {
                delay: 0,
                particles: {
                    x: 0, y: 0,
                    count: 100,
                    speed: { min: 200, max: 600 },
                    life: { min: 0.5, max: 1.5 },
                    size: { min: 8, max: 25 },
                    sprite: 'fire',
                    colorGradient: {
                        stops: [
                            { time: 0, color: 0xFFFFFF, alpha: 1.0 },
                            { time: 0.1, color: 0x00CCFF, alpha: 1.0 },  // Blue flash
                            { time: 0.3, color: 0xFFFF00, alpha: 1.0 },
                            { time: 0.6, color: 0xFF3300, alpha: 0.8 },
                            { time: 1.0, color: 0x220000, alpha: 0.0 }
                        ]
                    },
                    spread: Math.PI * 2
                },
                shockwave: {
                    radius: 250,
                    color: 0x00CCFF,
                    duration: 0.8
                },
                debris: {
                    count: 30,
                    debrisTypes: ['hull', 'metal', 'spark'],
                    rotationSpeed: { min: -8, max: 8 },
                    bounceCount: 3,
                    bounceDamping: 0.5,
                    gravity: 250
                }
            },
            // ... additional stages ...
        ]
    }
};
```

### 5. Screen Shake Integration

**Goal**: Camera shake intensity based on explosion size

```typescript
// Update src/rendering/ScreenShake.ts

export class ScreenShake {
    /**
     * Shake based on explosion size and distance
     */
    shakeFromExplosion(explosionX: number, explosionY: number, explosionSize: 'small' | 'medium' | 'large', cameraX: number, cameraY: number): void {
        // Calculate distance
        const dist = Math.sqrt(
            (explosionX - cameraX) ** 2 + 
            (explosionY - cameraY) ** 2
        );
        
        // Base intensity by size
        const baseIntensity = {
            small: 5,
            medium: 15,
            large: 30
        }[explosionSize];
        
        // Reduce intensity with distance (falloff)
        const maxDist = 500;
        const distFactor = Math.max(0, 1 - dist / maxDist);
        const intensity = baseIntensity * distFactor;
        
        // Duration based on size
        const duration = explosionSize === 'large' ? 0.5 : 0.3;
        
        this.shake(intensity, duration);
    }
}
```

---

## Integration Points

### Damage System
Update `src/systems/damageSystem.ts`:

```typescript
function handleEntityDeath(world: GameWorld, entity: number): void {
    const x = Position.x[entity];
    const y = Position.y[entity];
    
    // Determine explosion size
    let explosionType: 'small' | 'medium' | 'large';
    if (hasComponent(world, Turret, entity)) {
        explosionType = 'medium';
    } else if (entity === world.kobayashiMaruEntity) {
        explosionType = 'large';
    } else {
        explosionType = 'small';
    }
    
    // Trigger explosion
    const sequence = EXPLOSION_SEQUENCES[
        explosionType === 'large' ? 'KOBAYASHI_MARU_EXPLOSION' :
        explosionType === 'medium' ? 'LARGE_EXPLOSION' :
        'SMALL_EXPLOSION'
    ];
    
    world.explosionManager.explode(x, y, sequence);
    
    // Screen shake
    world.screenShake.shakeFromExplosion(x, y, explosionType, 960, 540);
    
    // Audio
    world.audioManager.play(explosionType === 'large' ? 'explosionLarge' : 'explosionSmall');
}
```

---

## Performance Considerations

- **Particle Budget**: Limit total particles across all stages
- **Debris Culling**: Remove off-screen debris
- **Shockwave Pooling**: Reuse shockwave objects
- **LOD**: Reduce particle count for distant explosions

---

## Testing Requirements

### Unit Tests
```typescript
// src/__tests__/ExplosionManager.test.ts

describe('ExplosionManager', () => {
    test('should trigger multi-stage explosions');
    test('should delay stages correctly');
    test('should spawn particles, shockwaves, and debris');
    test('should clean up completed explosions');
});

// src/__tests__/ShockwaveRenderer.test.ts

describe('ShockwaveRenderer', () => {
    test('should create shockwave with correct properties');
    test('should expand shockwave over time');
    test('should fade out shockwave');
    test('should remove expired shockwaves');
});
```

---

## Success Criteria

- ✅ Explosions have expanding shockwave rings
- ✅ Debris particles with physics and rotation
- ✅ Multi-stage explosions (flash → fire → smoke)
- ✅ Screen shake intensity based on explosion size and distance
- ✅ 3+ explosion types (small, medium, large)
- ✅ Visual quality dramatically improved
- ✅ All tests passing
- ✅ 60 FPS maintained

---

## Visual Comparison

### Before
- ⭕⭕⭕ Simple orange circles
- No shockwave
- Instant disappearance

### After
- 💥 White flash
- ⭕⭕⭕ Expanding shockwave ring
- 🔥🔥🔥 Fire particles
- 🪨🪨 Debris with physics
- 💨💨💨 Rising smoke plume
- 📱 Screen shake

---

## References

- Current effects: `src/rendering/effectPresets.ts`
- Particle system: `src/rendering/ParticleSystem.ts`
- Screen shake: `src/rendering/ScreenShake.ts`
- Damage system: `src/systems/damageSystem.ts`
