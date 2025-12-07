# Enhancement Task 12: Environmental Hazards

**Date:** 2025-12-07  
**Priority:** MEDIUM  
**Category:** Gameplay Feature  
**Estimated Effort:** 2-3 days  
**Dependencies:** None

---

## Objective

Introduce dynamic environmental hazards including asteroid fields, ion storms, vision-reducing nebula zones, and spatial anomalies to create varied tactical challenges and strategic depth.

---

## Current State

**Environment**: Static, predictable
- No environmental hazards
- No dynamic map elements
- No visibility modifiers
- No terrain/obstacles

**Impact**:
- Repetitive gameplay
- Limited strategic options
- No environmental awareness needed
- Missed opportunity for variety

---

## Proposed Implementation

### 1. Hazard System Architecture

```typescript
// src/game/hazards/types.ts

export enum HazardType {
    ASTEROID_FIELD = 'asteroid_field',
    ION_STORM = 'ion_storm',
    NEBULA_ZONE = 'nebula_zone',
    SPATIAL_ANOMALY = 'spatial_anomaly',
    WORMHOLE = 'wormhole'
}

export interface Hazard {
    id: string;
    type: HazardType;
    x: number;
    y: number;
    radius: number;
    active: boolean;
    duration: number;
    elapsed: number;
    intensity: number;  // 0-1
}

export interface HazardEffect {
    damagePerSecond?: number;
    slowPercent?: number;
    accuracyDebuff?: number;
    visionReduction?: number;
}
```

### 2. Asteroid Field

**Goal**: Physical obstacles that damage entities on collision

```typescript
// src/game/hazards/AsteroidField.ts

export class AsteroidField {
    private asteroids: Asteroid[] = [];
    private container: Container;
    
    /**
     * Spawn asteroid field
     */
    spawn(x: number, y: number, count: number, radius: number): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const ax = x + Math.cos(angle) * distance;
            const ay = y + Math.sin(angle) * distance;
            
            this.createAsteroid(ax, ay);
        }
    }
    
    /**
     * Create single asteroid
     */
    private createAsteroid(x: number, y: number): void {
        const size = 10 + Math.random() * 30;
        const entity = createWorld().createEntity();
        
        // Add components
        addComponent(world, Position, entity);
        Position.x[entity] = x;
        Position.y[entity] = y;
        
        addComponent(world, Collider, entity);
        Collider.radius[entity] = size;
        Collider.layer[entity] = CollisionLayer.OBSTACLE;
        
        addComponent(world, Health, entity);
        Health.current[entity] = 100 + size * 5;
        Health.max[entity] = Health.current[entity];
        
        // Visual
        const sprite = this.createAsteroidSprite(size);
        sprite.position.set(x, y);
        this.container.addChild(sprite);
        
        this.asteroids.push({
            entity,
            sprite,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.5
        });
    }
    
    /**
     * Create asteroid sprite
     */
    private createAsteroidSprite(size: number): Graphics {
        const graphics = new Graphics();
        
        // Irregular polygon
        const points = 8;
        for (let i = 0; i <= points; i++) {
            const angle = (Math.PI * 2 * i) / points;
            const variance = 0.7 + Math.random() * 0.6;
            const r = size * variance;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            if (i === 0) {
                graphics.moveTo(x, y);
            } else {
                graphics.lineTo(x, y);
            }
        }
        graphics.closePath();
        graphics.fill({ color: 0x666666 });
        graphics.stroke({ color: 0x444444, width: 1 });
        
        // Add surface detail (craters)
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * size * 0.5;
            const cx = Math.cos(angle) * dist;
            const cy = Math.sin(angle) * dist;
            const cr = size * 0.2;
            
            graphics.circle(cx, cy, cr);
            graphics.fill({ color: 0x444444 });
        }
        
        return graphics;
    }
    
    /**
     * Update asteroids (rotation)
     */
    update(deltaTime: number): void {
        for (const asteroid of this.asteroids) {
            asteroid.rotation += asteroid.rotationSpeed * deltaTime;
            asteroid.sprite.rotation = asteroid.rotation;
        }
    }
    
    /**
     * Check collision and apply damage
     */
    checkCollision(entity: number, world: GameWorld): void {
        const ex = Position.x[entity];
        const ey = Position.y[entity];
        const er = Collider.radius[entity];
        
        for (const asteroid of this.asteroids) {
            const ax = Position.x[asteroid.entity];
            const ay = Position.y[asteroid.entity];
            const ar = Collider.radius[asteroid.entity];
            
            const dist = Math.sqrt((ex - ax) ** 2 + (ey - ay) ** 2);
            
            if (dist < er + ar) {
                // Apply damage to both
                if (hasComponent(world, Health, entity)) {
                    Health.current[entity] -= 5;
                }
                
                Health.current[asteroid.entity] -= 10;
                
                // Remove asteroid if destroyed
                if (Health.current[asteroid.entity] <= 0) {
                    this.destroyAsteroid(asteroid, world);
                }
                
                // Collision particles
                world.particleSystem.spawn({
                    x: ax, y: ay,
                    count: 10,
                    speed: { min: 50, max: 150 },
                    life: { min: 0.3, max: 0.6 },
                    size: { min: 2, max: 6 },
                    color: 0x999999,
                    spread: Math.PI * 2
                });
            }
        }
    }
    
    /**
     * Destroy asteroid
     */
    private destroyAsteroid(asteroid: Asteroid, world: GameWorld): void {
        // Remove entity
        removeEntity(world, asteroid.entity);
        
        // Remove sprite
        this.container.removeChild(asteroid.sprite);
        
        // Remove from array
        const index = this.asteroids.indexOf(asteroid);
        if (index !== -1) {
            this.asteroids.splice(index, 1);
        }
        
        // Explosion
        world.explosionManager.explode(
            Position.x[asteroid.entity],
            Position.y[asteroid.entity],
            EXPLOSION_SEQUENCES.SMALL_EXPLOSION
        );
    }
}
```

### 3. Ion Storm

**Goal**: Electrical storm that damages shields and reduces accuracy

```typescript
// src/game/hazards/IonStorm.ts

export class IonStorm implements Hazard {
    id: string;
    type = HazardType.ION_STORM;
    x: number;
    y: number;
    radius: number;
    active = true;
    duration: number;
    elapsed = 0;
    intensity = 1.0;
    
    private lightning: Lightning[] = [];
    private container: Container;
    
    constructor(x: number, y: number, radius: number, duration: number) {
        this.id = `ion-storm-${Date.now()}`;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.container = new Container();
    }
    
    /**
     * Update storm
     */
    update(deltaTime: number, world: GameWorld): void {
        this.elapsed += deltaTime;
        
        if (this.elapsed >= this.duration) {
            this.active = false;
            return;
        }
        
        // Spawn lightning periodically
        if (Math.random() < 0.1) {
            this.spawnLightning();
        }
        
        // Update lightning
        for (let i = this.lightning.length - 1; i >= 0; i--) {
            this.lightning[i].lifetime -= deltaTime;
            
            if (this.lightning[i].lifetime <= 0) {
                this.lightning.splice(i, 1);
            }
        }
        
        // Apply effects to entities in range
        this.applyEffects(world);
        
        // Render
        this.render();
    }
    
    /**
     * Spawn lightning bolt
     */
    private spawnLightning(): void {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.radius;
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        this.lightning.push({
            x,
            y,
            length: 50 + Math.random() * 100,
            angle: Math.random() * Math.PI * 2,
            lifetime: 0.1,
            branches: []
        });
    }
    
    /**
     * Apply storm effects
     */
    private applyEffects(world: GameWorld): void {
        const query = defineQuery([Position, Health, Shield]);
        const entities = query(world);
        
        for (let i = 0; i < entities.length; i++) {
            const eid = entities[i];
            const dx = Position.x[eid] - this.x;
            const dy = Position.y[eid] - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= this.radius) {
                // Damage shields
                if (hasComponent(world, Shield, eid)) {
                    Shield.current[eid] = Math.max(0, Shield.current[eid] - 2);
                }
                
                // Reduce accuracy (for turrets)
                if (hasComponent(world, Turret, eid)) {
                    // Apply accuracy debuff (handled in combat system)
                    // Store debuff in temporary component
                }
                
                // Visual effect
                if (Math.random() < 0.05) {
                    world.particleSystem.spawn({
                        x: Position.x[eid],
                        y: Position.y[eid],
                        count: 5,
                        speed: { min: 30, max: 80 },
                        life: { min: 0.2, max: 0.4 },
                        size: { min: 2, max: 4 },
                        color: 0x00CCFF,
                        spread: Math.PI * 2
                    });
                }
            }
        }
    }
    
    /**
     * Render storm visuals
     */
    private render(): void {
        const graphics = new Graphics();
        
        // Storm boundary (pulsing circle)
        const pulse = Math.sin(this.elapsed * 5) * 0.3 + 0.7;
        graphics.circle(this.x, this.y, this.radius);
        graphics.stroke({ color: 0x00CCFF, width: 2, alpha: 0.3 * pulse });
        
        // Lightning bolts
        for (const bolt of this.lightning) {
            const endX = bolt.x + Math.cos(bolt.angle) * bolt.length;
            const endY = bolt.y + Math.sin(bolt.angle) * bolt.length;
            
            graphics.moveTo(bolt.x, bolt.y);
            graphics.lineTo(endX, endY);
            graphics.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.9 });
        }
        
        // Update container
        this.container.removeChildren();
        this.container.addChild(graphics);
    }
    
    /**
     * Get container
     */
    getContainer(): Container {
        return this.container;
    }
}
```

### 4. Nebula Zone

**Goal**: Reduce vision range for strategic positioning

```typescript
// src/game/hazards/NebulaZone.ts

export class NebulaZone implements Hazard {
    id: string;
    type = HazardType.NEBULA_ZONE;
    x: number;
    y: number;
    radius: number;
    active = true;
    duration: number;
    elapsed = 0;
    intensity = 1.0;
    
    private container: Container;
    private fogSprite: Graphics;
    
    constructor(x: number, y: number, radius: number, duration: number) {
        this.id = `nebula-${Date.now()}`;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.duration = duration;
        this.container = new Container();
        
        this.createFog();
    }
    
    /**
     * Create fog visual
     */
    private createFog(): void {
        this.fogSprite = new Graphics();
        
        // Gradient fog
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const r = this.radius * (i / steps);
            const alpha = 0.5 * (1 - i / steps);
            
            this.fogSprite.circle(this.x, this.y, r);
            this.fogSprite.fill({ color: 0x9966FF, alpha });
        }
        
        this.fogSprite.blendMode = BlendMode.ADD;
        this.container.addChild(this.fogSprite);
    }
    
    /**
     * Update nebula
     */
    update(deltaTime: number, world: GameWorld): void {
        this.elapsed += deltaTime;
        
        if (this.elapsed >= this.duration) {
            this.active = false;
            return;
        }
        
        // Apply vision reduction to turrets
        this.applyVisionReduction(world);
    }
    
    /**
     * Reduce turret range in nebula
     */
    private applyVisionReduction(world: GameWorld): void {
        const turretQuery = defineQuery([Turret, Position]);
        const turrets = turretQuery(world);
        
        for (let i = 0; i < turrets.length; i++) {
            const eid = turrets[i];
            const dx = Position.x[eid] - this.x;
            const dy = Position.y[eid] - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= this.radius) {
                // Reduce range by 30%
                Turret.range[eid] *= 0.7;
            }
        }
    }
    
    /**
     * Check if position is in nebula
     */
    contains(x: number, y: number): boolean {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }
}
```

### 5. Hazard Manager

```typescript
// src/game/hazards/HazardManager.ts

export class HazardManager {
    private hazards: Map<string, Hazard> = new Map();
    private container: Container;
    
    constructor() {
        this.container = new Container();
    }
    
    /**
     * Spawn random hazard
     */
    spawnRandomHazard(world: GameWorld): void {
        const types = Object.values(HazardType);
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Random position (avoid center where Kobayashi Maru is)
        const angle = Math.random() * Math.PI * 2;
        const distance = 300 + Math.random() * 500;
        const x = GAME_CONFIG.WORLD_WIDTH / 2 + Math.cos(angle) * distance;
        const y = GAME_CONFIG.WORLD_HEIGHT / 2 + Math.sin(angle) * distance;
        
        this.spawnHazard(type, x, y, world);
    }
    
    /**
     * Spawn specific hazard
     */
    spawnHazard(type: HazardType, x: number, y: number, world: GameWorld): void {
        let hazard: Hazard;
        
        switch (type) {
            case HazardType.ASTEROID_FIELD:
                const asteroidField = new AsteroidField();
                asteroidField.spawn(x, y, 10, 200);
                hazard = asteroidField as any;
                break;
                
            case HazardType.ION_STORM:
                hazard = new IonStorm(x, y, 300, 30);
                break;
                
            case HazardType.NEBULA_ZONE:
                hazard = new NebulaZone(x, y, 250, 45);
                break;
                
            default:
                return;
        }
        
        this.hazards.set(hazard.id, hazard);
        this.container.addChild(hazard.getContainer());
        
        // Show warning
        world.messageLog.addMessage(`Warning: ${type} detected at sector ${Math.floor(x / 100)}-${Math.floor(y / 100)}`);
    }
    
    /**
     * Update all hazards
     */
    update(deltaTime: number, world: GameWorld): void {
        for (const [id, hazard] of this.hazards) {
            if (!hazard.active) {
                this.removeHazard(id);
                continue;
            }
            
            hazard.update(deltaTime, world);
        }
    }
    
    /**
     * Remove hazard
     */
    private removeHazard(id: string): void {
        const hazard = this.hazards.get(id);
        if (!hazard) return;
        
        this.container.removeChild(hazard.getContainer());
        this.hazards.delete(id);
    }
    
    /**
     * Get container
     */
    getContainer(): Container {
        return this.container;
    }
}
```

---

## Integration with Wave System

```typescript
// Spawn hazards during waves
export class WaveManager {
    private spawnHazardForWave(waveNumber: number): void {
        // Increase hazard frequency with wave number
        const hazardChance = Math.min(0.5, waveNumber * 0.05);
        
        if (Math.random() < hazardChance) {
            this.hazardManager.spawnRandomHazard(this.world);
        }
    }
}
```

---

## Configuration

```typescript
export const HAZARD_CONFIG = {
    // Asteroid Field
    ASTEROID_DAMAGE: 5,
    ASTEROID_HEALTH: { min: 100, max: 300 },
    ASTEROID_SIZE: { min: 10, max: 30 },
    
    // Ion Storm
    ION_STORM_SHIELD_DAMAGE: 2,
    ION_STORM_ACCURACY_DEBUFF: 0.3,
    ION_STORM_RADIUS: 300,
    ION_STORM_DURATION: 30,
    
    // Nebula Zone
    NEBULA_VISION_REDUCTION: 0.3,
    NEBULA_RADIUS: 250,
    NEBULA_DURATION: 45,
    
    // Spawn rates
    HAZARD_SPAWN_CHANCE_BASE: 0.1,
    HAZARD_SPAWN_CHANCE_PER_WAVE: 0.05
};
```

---

## Testing Requirements

```typescript
// src/__tests__/HazardManager.test.ts

describe('HazardManager', () => {
    test('should spawn asteroid field');
    test('should spawn ion storm');
    test('should spawn nebula zone');
    test('should apply hazard effects');
    test('should remove expired hazards');
    test('should detect collision with asteroids');
});
```

---

## Success Criteria

- ✅ Asteroid fields spawn and deal collision damage
- ✅ Ion storms reduce accuracy and damage shields
- ✅ Nebula zones reduce vision range
- ✅ Hazards expire after duration
- ✅ Visual indicators clear and distinct
- ✅ Warning messages on hazard spawn
- ✅ Performance maintained at 60 FPS
- ✅ All tests passing

---

## Future Enhancements

- Black holes (pull entities toward center)
- Wormholes (teleport entities)
- Solar flares (periodic damage waves)
- Debris fields (slow movement)
- Radiation zones (damage over time)
- Gravity wells (affect projectiles)

---

## References

- Collision system: `src/collision/SpatialHash.ts`
- Wave manager: `src/game/waveManager.ts`
- Message log: `src/ui/MessageLog.ts`
