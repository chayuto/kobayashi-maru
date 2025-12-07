# Explosion Effects Usage Guide

This guide demonstrates how to use the new explosion shockwave and debris physics features.

## Quick Start

### 1. Using ShockwaveRenderer

The `ShockwaveRenderer` creates expanding circular ring effects:

```typescript
import { ShockwaveRenderer } from './rendering';

// Create renderer
const shockwaveRenderer = new ShockwaveRenderer();
shockwaveRenderer.init(explosionsGlowLayer); // Optional glow container

// Create a shockwave
shockwaveRenderer.create(
  x,          // X position
  y,          // Y position
  200,        // Max radius
  0xFF6600,   // Color (orange)
  1.0         // Duration in seconds
);

// Update in game loop
shockwaveRenderer.render(deltaTime);
```

### 2. Using Debris Physics

Particles now support realistic bounce physics:

```typescript
import { ParticleSystem } from './rendering';
import { EFFECTS } from './rendering/effectPresets';

// Spawn metal debris with bounces
particleSystem.spawn({
  ...EFFECTS.METAL_DEBRIS,
  x: explosionX,
  y: explosionY
});
```

**Available Debris Presets:**
- `METAL_DEBRIS`: Heavy metal chunks (2 bounces, 0.6 damping)
- `HULL_FRAGMENTS`: Larger hull pieces (3 bounces, 0.7 damping)
- `SPARK_DEBRIS`: Light sparks with trails (1 bounce, 0.5 damping)

### 3. Using ExplosionManager

The `ExplosionManager` coordinates multi-stage explosions:

```typescript
import { ExplosionManager } from './rendering';

// Create manager (requires ParticleSystem and ShockwaveRenderer)
const explosionManager = new ExplosionManager(particleSystem, shockwaveRenderer);

// Simple explosion with particles and shockwave
explosionManager.createSimpleExplosion(
  x,
  y,
  EFFECTS.FIRE_EXPLOSION,
  {
    radius: 200,
    color: 0xFF6600,
    duration: 1.0
  }
);

// Update in game loop
explosionManager.update(deltaTime);
```

## Advanced Usage

### Multi-Stage Explosions

Create complex explosions with multiple delayed stages:

```typescript
const complexExplosion = {
  stages: [
    // Stage 1: Initial flash and shockwave (immediate)
    {
      delay: 0,
      particles: EFFECTS.FIRE_EXPLOSION,
      shockwave: {
        radius: 150,
        color: 0xFFFFFF,
        duration: 0.5
      }
    },
    // Stage 2: Secondary fire burst (0.1s later)
    {
      delay: 0.1,
      particles: {
        ...EFFECTS.FIRE_EXPLOSION,
        count: 40,
        speed: { min: 80, max: 180 }
      }
    },
    // Stage 3: Smoke and debris (0.3s later)
    {
      delay: 0.3,
      particles: EFFECTS.SMOKE_PLUME
    },
    // Stage 4: Metal debris (0.4s later)
    {
      delay: 0.4,
      particles: EFFECTS.METAL_DEBRIS,
      shockwave: {
        radius: 300,
        color: 0x888888,
        duration: 1.5
      }
    }
  ]
};

explosionManager.createExplosion(x, y, complexExplosion);
```

### Custom Debris Physics

Create custom debris with specific physics parameters:

```typescript
particleSystem.spawn({
  x: 100,
  y: 100,
  count: 20,
  speed: { min: 100, max: 200 },
  life: { min: 1.0, max: 2.0 },
  size: { min: 3, max: 7 },
  sprite: 'square',
  colorGradient: {
    stops: [
      { time: 0, color: 0xAAAAAA, alpha: 1.0 },
      { time: 1.0, color: 0x444444, alpha: 0.0 }
    ]
  },
  rotation: { min: 0, max: Math.PI * 2 },
  rotationSpeed: { min: -8, max: 8 },
  spread: Math.PI * 2,
  gravity: 300,           // Downward gravity
  drag: 0.97,             // Air resistance
  bounceCount: 3,         // Number of bounces before stopping
  bounceDamping: 0.7,     // Velocity retention per bounce (70%)
  groundY: 1080           // Ground level (use GAME_CONFIG.WORLD_HEIGHT)
});
```

## Integration in Game.ts

The systems are already integrated in `Game.ts`:

1. **Initialization** (lines 257-266):
   - ShockwaveRenderer initialized with explosions glow layer
   - ExplosionManager created with particle system and shockwave renderer

2. **Update Loop** (lines 605-612):
   - ShockwaveRenderer renders shockwaves each frame
   - ExplosionManager updates active explosions

3. **Cleanup** (line 1039-1041):
   - ShockwaveRenderer properly destroyed

## Best Practices

1. **Use Constants**: Always use `GAME_CONFIG.WORLD_HEIGHT` for `groundY` parameter
2. **Layer Effects**: Combine particles, shockwaves, and debris for rich explosions
3. **Performance**: Monitor particle count - debris physics is more expensive than basic particles
4. **Timing**: Use multi-stage explosions for cinematic effects
5. **Colors**: Match shockwave colors to particle colors for cohesion

## Effect Presets Reference

All available effect presets from `effectPresets.ts`:

**Legacy Effects:**
- `EXPLOSION_SMALL`: Basic small explosion
- `EXPLOSION_LARGE`: Basic large explosion
- `SHIELD_HIT`: Shield impact particles
- `MUZZLE_FLASH`: Weapon fire flash

**Advanced Effects:**
- `FIRE_EXPLOSION`: Colorful fire with gradient
- `IMPACT_SPARKS`: Sparking impacts with trails
- `PLASMA_TRAIL`: Energy weapon trail
- `SMOKE_PLUME`: Rising smoke
- `ENERGY_BURST`: Ring-shaped energy burst
- `STAR_BURST`: Rotating star particles
- `SPIRAL_VORTEX`: Spiraling particles
- `FOUNTAIN_SPRAY`: Fountain-like spray
- `DEBRIS_SHOWER`: Simple falling debris
- `ELECTRIC_DISCHARGE`: Electric spark ring
- `WARP_FLASH`: Expanding flash effect

**Debris Effects (with physics):**
- `METAL_DEBRIS`: Metal chunks with bounces
- `HULL_FRAGMENTS`: Hull pieces with multiple bounces
- `SPARK_DEBRIS`: Sparks with trails and bounces

## Example: Ship Destruction Effect

```typescript
function createShipDestructionEffect(x: number, y: number): void {
  // Create multi-stage explosion
  explosionManager.createExplosion(x, y, {
    stages: [
      // Initial explosion
      {
        delay: 0,
        particles: EFFECTS.FIRE_EXPLOSION,
        shockwave: {
          radius: 200,
          color: 0xFFFFFF,
          duration: 0.8
        }
      },
      // Metal debris
      {
        delay: 0.05,
        particles: EFFECTS.METAL_DEBRIS
      },
      // Hull fragments
      {
        delay: 0.1,
        particles: EFFECTS.HULL_FRAGMENTS
      },
      // Sparks
      {
        delay: 0.15,
        particles: EFFECTS.SPARK_DEBRIS
      },
      // Secondary explosion
      {
        delay: 0.3,
        particles: {
          ...EFFECTS.FIRE_EXPLOSION,
          count: 30
        },
        shockwave: {
          radius: 250,
          color: 0xFF6600,
          duration: 1.2
        }
      },
      // Smoke plume
      {
        delay: 0.5,
        particles: EFFECTS.SMOKE_PLUME
      }
    ]
  });
}
```

## Testing

All features are thoroughly tested:
- `ShockwaveRenderer.test.ts`: 16 tests covering initialization, rendering, and cleanup
- `ExplosionManager.test.ts`: 11 tests covering simple and multi-stage explosions
- `ParticleSystem.test.ts`: 8 tests including 3 new debris physics tests

Run tests with: `npm run test`
