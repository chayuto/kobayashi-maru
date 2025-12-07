# Refactor Task: Particle System Optimization

**Date:** December 7, 2025  
**Priority:** 🟠 High  
**Complexity:** High  
**Estimated Effort:** 4-5 hours  

---

## Problem Statement

`src/rendering/ParticleSystem.ts` has several performance issues:

### Issue 1: Graphics Object Per Particle
```typescript
// Current: Creates new Graphics for each particle
private getParticle(): Particle {
  return {
    // ...
    sprite: new Graphics(),  // NEW OBJECT EVERY TIME
    // ...
  };
}
```

### Issue 2: Redraw on Every Color Change
```typescript
// Current: Redraws entire particle when color changes
if (p.colorGradient) {
  this.drawParticle(p);  // FULL REDRAW EVERY FRAME
}
```

### Issue 3: No Batching
Each particle is a separate Graphics object added to Container, resulting in one draw call per particle.

### Issue 4: Trail Graphics Overhead
```typescript
// Current: Separate Graphics object for each trail
particle.trail = {
  graphics: new Graphics(),  // ANOTHER OBJECT
  // ...
};
```

---

## Impact

- **Draw Calls:** 100 particles = 100+ draw calls
- **GC Pressure:** Graphics objects created/destroyed frequently
- **Frame Drops:** Explosions with 50+ particles cause stuttering
- **Memory:** Trail graphics accumulate

---

## Proposed Solution

Rewrite particle system using PixiJS ParticleContainer with texture-based particles:

1. Pre-generate particle textures for each shape
2. Use ParticleContainer for batched rendering
3. Implement color tinting instead of redrawing
4. Use single Graphics for all trails

---

## Implementation

### Step 1: Create Particle Texture Atlas

```typescript
// src/rendering/ParticleTextures.ts
import { Application, Graphics, RenderTexture, Texture } from 'pixi.js';

export type ParticleShape = 'circle' | 'square' | 'star' | 'spark' | 'smoke' | 'fire' | 'energy';

/**
 * Pre-generates textures for all particle shapes
 * Call once during initialization
 */
export class ParticleTextureAtlas {
  private textures: Map<ParticleShape, Texture> = new Map();
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  init(): void {
    const shapes: ParticleShape[] = ['circle', 'square', 'star', 'spark', 'smoke', 'fire', 'energy'];
    const size = 32; // Base size, will be scaled

    for (const shape of shapes) {
      const graphics = new Graphics();
      graphics.beginFill(0xFFFFFF); // White base, tint for color
      
      this.drawShape(graphics, shape, size);
      
      graphics.endFill();

      // Render to texture
      const texture = this.app.renderer.generateTexture({
        target: graphics,
        resolution: 2 // Higher res for quality
      });

      this.textures.set(shape, texture);
      graphics.destroy();
    }

    console.log(`ParticleTextureAtlas: Generated ${this.textures.size} textures`);
  }

  private drawShape(graphics: Graphics, shape: ParticleShape, size: number): void {
    const half = size / 2;
    
    switch (shape) {
      case 'circle':
        graphics.drawCircle(half, half, half);
        break;
      case 'square':
        graphics.drawRect(0, 0, size, size);
        break;
      case 'star':
        this.drawStar(graphics, half, half, 5, half, half * 0.5);
        break;
      case 'spark':
        graphics.moveTo(half, 0);
        graphics.lineTo(half + 4, half);
        graphics.lineTo(half, size);
        graphics.lineTo(half - 4, half);
        graphics.closePath();
        break;
      case 'smoke':
        graphics.drawCircle(half, half, half);
        break;
      case 'fire':
        this.drawFlame(graphics, half, half, half);
        break;
      case 'energy':
        this.drawHexagon(graphics, half, half, half);
        break;
    }
  }

  private drawStar(g: Graphics, cx: number, cy: number, points: number, outer: number, inner: number): void {
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (Math.PI * i) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
  }

  private drawFlame(g: Graphics, cx: number, cy: number, size: number): void {
    g.moveTo(cx, cy - size);
    g.quadraticCurveTo(cx + size, cy, cx, cy + size * 0.8);
    g.quadraticCurveTo(cx - size, cy, cx, cy - size);
  }

  private drawHexagon(g: Graphics, cx: number, cy: number, size: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
  }

  getTexture(shape: ParticleShape): Texture {
    return this.textures.get(shape) ?? this.textures.get('circle')!;
  }

  destroy(): void {
    for (const texture of this.textures.values()) {
      texture.destroy(true);
    }
    this.textures.clear();
  }
}
```

### Step 2: Optimized Particle System

```typescript
// src/rendering/OptimizedParticleSystem.ts
import { Application, Container, Sprite, ParticleContainer } from 'pixi.js';
import { ParticleTextureAtlas, ParticleShape } from './ParticleTextures';

interface OptimizedParticle {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  maxLife: number;
  scaleStart: number;
  scaleEnd: number;
  alphaStart: number;
  alphaEnd: number;
  rotation: number;
  rotationSpeed: number;
  colorStart: number;
  colorEnd: number;
  active: boolean;
}

export class OptimizedParticleSystem {
  private app: Application;
  private textureAtlas: ParticleTextureAtlas;
  private container: ParticleContainer;
  private particles: OptimizedParticle[] = [];
  private pool: OptimizedParticle[] = [];
  private maxParticles: number;

  constructor(app: Application, maxParticles: number = 2000) {
    this.app = app;
    this.maxParticles = maxParticles;
    this.textureAtlas = new ParticleTextureAtlas(app);
    
    // ParticleContainer for batched rendering
    this.container = new ParticleContainer(maxParticles, {
      position: true,
      scale: true,
      rotation: true,
      tint: true,
      alpha: true
    });
  }

  init(parentContainer?: Container): void {
    this.textureAtlas.init();
    
    // Pre-allocate particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      const sprite = new Sprite(this.textureAtlas.getTexture('circle'));
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.container.addChild(sprite);
      
      this.pool.push({
        sprite,
        x: 0, y: 0,
        vx: 0, vy: 0,
        ax: 0, ay: 0,
        life: 0, maxLife: 0,
        scaleStart: 1, scaleEnd: 1,
        alphaStart: 1, alphaEnd: 0,
        rotation: 0, rotationSpeed: 0,
        colorStart: 0xFFFFFF, colorEnd: 0xFFFFFF,
        active: false
      });
    }

    if (parentContainer) {
      parentContainer.addChild(this.container);
    } else {
      this.app.stage.addChild(this.container);
    }

    console.log(`OptimizedParticleSystem: Pre-allocated ${this.maxParticles} particles`);
  }

  spawn(config: ParticleConfig): void {
    const count = Math.min(config.count, this.pool.length);
    
    for (let i = 0; i < count; i++) {
      const particle = this.pool.pop();
      if (!particle) break;

      // Configure particle
      particle.x = config.x;
      particle.y = config.y;
      
      const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
      const angle = (Math.random() - 0.5) * config.spread;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      
      particle.ax = 0;
      particle.ay = config.gravity ?? 0;
      
      particle.life = config.life.min + Math.random() * (config.life.max - config.life.min);
      particle.maxLife = particle.life;
      
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);
      particle.scaleStart = size / 32; // Normalize to texture size
      particle.scaleEnd = (config.scaleEnd ?? 1) * particle.scaleStart;
      
      particle.colorStart = config.color ?? 0xFFFFFF;
      particle.colorEnd = config.colorGradient?.stops[config.colorGradient.stops.length - 1]?.color ?? particle.colorStart;
      
      particle.rotation = config.rotation?.min ?? 0;
      particle.rotationSpeed = config.rotationSpeed?.min ?? 0;
      
      particle.active = true;

      // Update sprite
      particle.sprite.texture = this.textureAtlas.getTexture(config.sprite ?? 'circle');
      particle.sprite.visible = true;
      particle.sprite.position.set(particle.x, particle.y);
      particle.sprite.scale.set(particle.scaleStart);
      particle.sprite.tint = particle.colorStart;
      particle.sprite.alpha = 1;

      this.particles.push(particle);
    }
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Physics
      p.vx += p.ax * deltaTime;
      p.vy += p.ay * deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.rotation += p.rotationSpeed * deltaTime;
      
      // Life
      p.life -= deltaTime;
      const t = 1 - (p.life / p.maxLife); // 0 to 1 over lifetime
      
      // Interpolate properties
      const scale = p.scaleStart + (p.scaleEnd - p.scaleStart) * t;
      const alpha = 1 - t; // Simple fade out
      const color = this.lerpColor(p.colorStart, p.colorEnd, t);
      
      // Update sprite (no redraw needed!)
      p.sprite.position.set(p.x, p.y);
      p.sprite.scale.set(scale);
      p.sprite.rotation = p.rotation;
      p.sprite.alpha = alpha;
      p.sprite.tint = color;
      
      // Return to pool if dead
      if (p.life <= 0) {
        p.active = false;
        p.sprite.visible = false;
        this.particles.splice(i, 1);
        this.pool.push(p);
      }
    }
  }

  private lerpColor(start: number, end: number, t: number): number {
    const sr = (start >> 16) & 0xFF;
    const sg = (start >> 8) & 0xFF;
    const sb = start & 0xFF;
    const er = (end >> 16) & 0xFF;
    const eg = (end >> 8) & 0xFF;
    const eb = end & 0xFF;
    
    const r = Math.round(sr + (er - sr) * t);
    const g = Math.round(sg + (eg - sg) * t);
    const b = Math.round(sb + (eb - sb) * t);
    
    return (r << 16) | (g << 8) | b;
  }

  getActiveCount(): number {
    return this.particles.length;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.textureAtlas.destroy();
    this.particles = [];
    this.pool = [];
  }
}
```

### Step 3: Migration Strategy

1. Create new `OptimizedParticleSystem` alongside existing
2. Add feature flag to switch between systems
3. Verify visual parity
4. Remove old system once validated

```typescript
// In Game.ts or wherever particle system is created
const USE_OPTIMIZED_PARTICLES = true;

if (USE_OPTIMIZED_PARTICLES) {
  this.particleSystem = new OptimizedParticleSystem(this.app, 2000);
} else {
  this.particleSystem = new ParticleSystem();
}
```

---

## Validation Criteria

1. **Draw calls reduced** - 100 particles = 1 draw call (batched)
2. **No GC during effects** - verify with Chrome DevTools
3. **Visual parity** - effects look the same
4. **Frame rate stable** - 60 FPS during explosions
5. **All effect presets work** - test each EFFECTS preset

---

## Performance Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Draw calls (100 particles) | ~100 | 1 |
| GC during explosion | ~10ms | 0ms |
| Frame time (50 particles) | ~8ms | ~2ms |
| Memory per particle | ~2KB | ~200B |

---

## Files to Create

- `src/rendering/ParticleTextures.ts`
- `src/rendering/OptimizedParticleSystem.ts`

## Files to Modify

- `src/rendering/index.ts` - Export new system
- `src/core/Game.ts` - Use optimized system
- `src/rendering/effectPresets.ts` - Verify compatibility
