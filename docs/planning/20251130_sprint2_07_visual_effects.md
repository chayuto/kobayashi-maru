# Task 07: Visual Effects and Polish

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

## Objective
Add visual polish and effects to enhance gameplay feel, including explosions, shield impacts, and damage indicators.

## Context
Current visuals:
- Basic faction shapes rendered via `textures.ts` (circles, triangles, squares, etc.)
- Beam weapons render lines via `BeamRenderer.ts`
- Starfield background via `Starfield.ts`
- No particle effects or animations
- No feedback when entities take damage

Missing visual feedback:
- Explosion when enemies die
- Shield shimmer when hit
- Health bar indicators
- Damage numbers (optional)
- Muzzle flash when firing

## Requirements

### 1. Create Particle System (`src/rendering/ParticleSystem.ts`)
Simple particle system for visual effects:
```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
}

class ParticleSystem {
  particles: Particle[];
  container: Container;
  
  init(app: Application): void;
  spawn(config: ParticleConfig): void;
  update(deltaTime: number): void;
  destroy(): void;
}

interface ParticleConfig {
  x: number;
  y: number;
  count: number;
  speed: { min: number; max: number };
  life: { min: number; max: number };
  size: { min: number; max: number };
  color: number;
  spread: number; // Angle spread in radians (2*PI for full circle)
}
```

### 2. Effect Presets (`src/rendering/effectPresets.ts`)
```typescript
export const EFFECTS = {
  EXPLOSION_SMALL: {
    count: 20,
    speed: { min: 50, max: 150 },
    life: { min: 0.2, max: 0.5 },
    size: { min: 2, max: 6 },
    color: 0xFF6600,
    spread: Math.PI * 2
  },
  EXPLOSION_LARGE: {
    count: 40,
    speed: { min: 80, max: 200 },
    life: { min: 0.3, max: 0.8 },
    size: { min: 3, max: 10 },
    color: 0xFF4400,
    spread: Math.PI * 2
  },
  SHIELD_HIT: {
    count: 10,
    speed: { min: 30, max: 80 },
    life: { min: 0.1, max: 0.3 },
    size: { min: 2, max: 4 },
    color: 0x66AAFF,
    spread: Math.PI * 0.5 // Limited spread toward impact point
  },
  MUZZLE_FLASH: {
    count: 8,
    speed: { min: 100, max: 200 },
    life: { min: 0.05, max: 0.15 },
    size: { min: 2, max: 5 },
    color: 0xFFFF00,
    spread: Math.PI * 0.3
  }
};
```

### 3. Entity Health Bars (`src/rendering/HealthBarRenderer.ts`)
Render health bars above damaged entities:
```typescript
class HealthBarRenderer {
  init(app: Application): void;
  update(world: IWorld): void; // Render bars for damaged entities
  showHealthBar(eid: number, current: number, max: number, x: number, y: number): void;
  hideHealthBar(eid: number): void;
  destroy(): void;
}
```

Configuration:
- Bar width: 32px
- Bar height: 4px
- Position: Above entity sprite
- Colors: Green (>50%), Yellow (25-50%), Red (<25%)
- Only show when damaged (current < max)
- Fade out after 3 seconds of no damage

### 4. Screen Shake (`src/rendering/ScreenShake.ts`)
Camera shake for impacts:
```typescript
class ScreenShake {
  intensity: number;
  duration: number;
  
  shake(intensity: number, duration: number): void;
  update(deltaTime: number): { offsetX: number; offsetY: number };
  isActive(): boolean;
}
```

Apply to stage position during update.

### 5. Integrate Effects with Systems
- **damageSystem.ts**: Spawn explosion on enemy death
- **combatSystem.ts**: Spawn shield hit particles when shield absorbs damage
- **combatSystem.ts**: Spawn muzzle flash when firing
- **Game.ts**: Apply screen shake on Kobayashi Maru damage

### 6. Damage Numbers (Optional)
Floating damage numbers that rise and fade:
```typescript
interface DamageNumber {
  x: number;
  y: number;
  text: Text;
  life: number;
}

class DamageNumberRenderer {
  spawn(x: number, y: number, amount: number, color: number): void;
  update(deltaTime: number): void;
}
```

## Acceptance Criteria
- [ ] Explosions appear when enemies die
- [ ] Shield hit particles show when shields absorb damage
- [ ] Muzzle flash appears when turrets fire (beam weapons)
- [ ] Health bars show above damaged entities
- [ ] Health bar colors indicate health percentage
- [ ] Health bars fade when entity is at full health
- [ ] Screen shakes when Kobayashi Maru takes damage
- [ ] Particle system handles 100+ simultaneous particles
- [ ] Effects don't significantly impact performance
- [ ] Unit tests cover particle spawning
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/rendering/ParticleSystem.ts`
- `src/rendering/effectPresets.ts`
- `src/rendering/HealthBarRenderer.ts`
- `src/rendering/ScreenShake.ts`
- `src/rendering/DamageNumberRenderer.ts` (optional)
- `src/__tests__/ParticleSystem.test.ts`

## Files to Modify
- `src/systems/damageSystem.ts` - Trigger explosion effects
- `src/systems/combatSystem.ts` - Trigger muzzle flash and shield effects
- `src/rendering/index.ts` - Export new modules
- `src/core/Game.ts` - Initialize and update effects systems

## Testing Requirements
- Unit test: Particle spawning with correct properties
- Unit test: Particle lifetime management
- Unit test: Health bar visibility logic
- Unit test: Screen shake decay
- Performance test: Many particles don't cause frame drops

## Technical Notes
- Use `Graphics` or `ParticleContainer` for particles
- Object pool particles to avoid GC
- Keep particle count reasonable (max 500)
- Use simple physics (velocity + gravity optional)
- Consider using sprite sheets for complex particles
- Health bars can use `Graphics` rectangles

## Particle Update Loop
```typescript
update(deltaTime: number): void {
  for (let i = this.particles.length - 1; i >= 0; i--) {
    const p = this.particles[i];
    
    // Update position
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    
    // Update life
    p.life -= deltaTime;
    
    // Calculate alpha based on remaining life
    p.alpha = p.life / p.maxLife;
    
    // Remove dead particles
    if (p.life <= 0) {
      this.returnToPool(p);
      this.particles.splice(i, 1);
    } else {
      // Update visual
      this.updateParticleVisual(p);
    }
  }
}
```

## Health Bar Implementation
```typescript
update(world: IWorld): void {
  const entities = healthQuery(world);
  
  for (const eid of entities) {
    const current = Health.current[eid];
    const max = Health.max[eid];
    
    if (current < max) {
      const x = Position.x[eid];
      const y = Position.y[eid] - 20; // Above entity
      this.showHealthBar(eid, current, max, x, y);
    } else {
      this.hideHealthBar(eid);
    }
  }
}
```
