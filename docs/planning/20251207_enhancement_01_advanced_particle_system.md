# Enhancement Task 01: Advanced Particle System

**Date:** 2025-12-07  
**Priority:** CRITICAL  
**Category:** Visual Effects  
**Estimated Effort:** 2-3 days  
**Dependencies:** None

---

## Objective

Upgrade the existing particle system from basic single-color circles to a rich, multi-effect system with gradient colors, sprite-based particles, trail effects, and advanced emitter patterns.

---

## Current State

**Location**: `src/rendering/ParticleSystem.ts`

**Current Capabilities**:
- Simple circular particles
- Single color per particle
- Basic spread patterns
- Alpha fade-out
- 2000 particle budget

**Limitations**:
- No texture/sprite support
- No color gradients over lifetime
- No particle trails
- Limited emitter patterns (only circular spread)
- No particle rotation or scale animation

---

## Proposed Enhancements

### 1. Particle Sprite Support

**Goal**: Support texture-based particles for fire, smoke, sparks, energy

```typescript
export interface ParticleConfig {
    // ... existing fields ...
    sprite?: 'circle' | 'square' | 'star' | 'spark' | 'smoke' | 'fire' | 'energy';
    rotation?: { min: number; max: number };
    rotationSpeed?: { min: number; max: number };
    scaleStart?: number;
    scaleEnd?: number;
}
```

**Implementation**:
- Create texture atlas for particle sprites
- Use `Graphics` to generate procedural textures
- Support both geometric and textured particles
- Add rotation animation support

### 2. Color Gradient Over Lifetime

**Goal**: Particles change color as they age (e.g., fire: yellow → orange → red → black)

```typescript
export interface ColorGradient {
    stops: Array<{ time: number; color: number; alpha: number }>;
}

export interface ParticleConfig {
    // ... existing fields ...
    colorGradient?: ColorGradient;
}
```

**Implementation**:
- Interpolate between color stops based on particle lifetime
- Support alpha channel per stop
- Pre-calculate gradient for performance

**Examples**:
- Fire: `yellow (0) → orange (0.3) → red (0.7) → dark (1.0)`
- Explosion: `white (0) → yellow (0.2) → orange (0.5) → smoke gray (1.0)`
- Energy: `cyan (0) → blue (0.5) → dark blue (1.0)`

### 3. Trail Effect System

**Goal**: Particles leave trails behind (torpedoes, sparks)

```typescript
export interface TrailConfig {
    enabled: boolean;
    length: number;      // Number of trail segments
    fadeRate: number;    // How quickly trail fades
    width: number;       // Trail width
}
```

**Implementation**:
- Store recent positions in circular buffer
- Render line segments connecting positions
- Fade alpha from head to tail
- Use PixiJS `Graphics.lineTo()` for rendering

**Use Cases**:
- Photon torpedoes with orange trails
- Plasma cannon shots with green trails
- Sparks from explosions with white trails

### 4. Advanced Emitter Patterns

**Goal**: Support various emission patterns beyond random spread

```typescript
export enum EmitterPattern {
    CIRCULAR = 'circular',      // Current behavior
    CONE = 'cone',              // Directional cone
    RING = 'ring',              // Expanding ring
    SPIRAL = 'spiral',          // Spiral pattern
    BURST = 'burst',            // All at once, same angle
    FOUNTAIN = 'fountain'       // Arc upward
}

export interface ParticleConfig {
    // ... existing fields ...
    emitterPattern?: EmitterPattern;
    emitterAngle?: number;      // For cone/fountain
    emitterWidth?: number;      // For cone width
}
```

**Implementation**:
- Calculate initial velocity based on pattern
- Cone: Limit angle within cone width
- Ring: All particles same distance from center
- Spiral: Angle increments with each particle
- Burst: All particles in same direction

### 5. Physics Properties

**Goal**: Add gravity, drag, and acceleration

```typescript
export interface Particle {
    // ... existing fields ...
    ax: number;  // Acceleration X
    ay: number;  // Acceleration Y
    drag: number; // Air resistance (0-1)
}

export interface ParticleConfig {
    // ... existing fields ...
    gravity?: number;     // Downward acceleration
    drag?: number;        // Air resistance
}
```

**Implementation**:
- Apply gravity to velocity each frame
- Apply drag to reduce velocity
- Update position based on velocity + acceleration

**Use Cases**:
- Debris falls with gravity
- Smoke rises (negative gravity)
- Energy dissipates with drag

---

## New Effect Presets

Extend `src/rendering/effectPresets.ts` with rich presets:

```typescript
export const EFFECTS = {
    // Existing effects...
    
    // Fire explosion with gradient
    FIRE_EXPLOSION: {
        count: 60,
        speed: { min: 100, max: 250 },
        life: { min: 0.4, max: 1.2 },
        size: { min: 4, max: 12 },
        sprite: 'fire',
        colorGradient: {
            stops: [
                { time: 0, color: 0xFFFFFF, alpha: 1.0 },    // White flash
                { time: 0.2, color: 0xFFFF00, alpha: 1.0 },  // Yellow
                { time: 0.5, color: 0xFF6600, alpha: 0.8 },  // Orange
                { time: 1.0, color: 0xFF0000, alpha: 0.0 }   // Red fade
            ]
        },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.CIRCULAR
    },
    
    // Sparks from impact
    IMPACT_SPARKS: {
        count: 20,
        speed: { min: 150, max: 400 },
        life: { min: 0.1, max: 0.4 },
        size: { min: 2, max: 4 },
        sprite: 'spark',
        colorGradient: {
            stops: [
                { time: 0, color: 0xFFFFFF, alpha: 1.0 },
                { time: 1.0, color: 0xFFAA00, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 0.8,
        emitterPattern: EmitterPattern.CONE,
        trail: { enabled: true, length: 5, fadeRate: 0.3, width: 1 }
    },
    
    // Plasma cannon shot trail
    PLASMA_TRAIL: {
        count: 3,
        speed: { min: 0, max: 20 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 6, max: 10 },
        sprite: 'energy',
        colorGradient: {
            stops: [
                { time: 0, color: 0x00FF88, alpha: 0.8 },
                { time: 1.0, color: 0x00AA44, alpha: 0.0 }
            ]
        },
        spread: 0,
        emitterPattern: EmitterPattern.BURST
    },
    
    // Smoke plume
    SMOKE_PLUME: {
        count: 30,
        speed: { min: 20, max: 60 },
        life: { min: 1.0, max: 2.5 },
        size: { min: 8, max: 20 },
        sprite: 'smoke',
        scaleStart: 1.0,
        scaleEnd: 3.0,
        colorGradient: {
            stops: [
                { time: 0, color: 0x444444, alpha: 0.6 },
                { time: 0.5, color: 0x666666, alpha: 0.4 },
                { time: 1.0, color: 0x888888, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 0.4,
        gravity: -50,  // Rise upward
        drag: 0.95
    },
    
    // Energy burst (shield hit)
    ENERGY_BURST: {
        count: 25,
        speed: { min: 80, max: 200 },
        life: { min: 0.2, max: 0.6 },
        size: { min: 3, max: 8 },
        sprite: 'energy',
        colorGradient: {
            stops: [
                { time: 0, color: 0x00CCFF, alpha: 1.0 },
                { time: 0.5, color: 0x0088FF, alpha: 0.6 },
                { time: 1.0, color: 0x0044AA, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.RING
    }
};
```

---

## Implementation Steps

### Step 1: Add Sprite Texture Generation
- Create `generateParticleTextures()` method
- Generate textures for: circle, square, star, spark, smoke, fire, energy
- Cache textures in `TextureCache`

### Step 2: Extend Particle Interface
- Add rotation, rotationSpeed, scale fields
- Add sprite reference field
- Add trail position buffer

### Step 3: Implement Color Gradient
- Create `ColorGradient` interpolation function
- Update particle color each frame based on lifetime
- Pre-calculate gradient LUT for performance

### Step 4: Implement Trail System
- Add position history buffer to particles
- Render trails using `Graphics.lineTo()`
- Apply alpha gradient from head to tail

### Step 5: Implement Emitter Patterns
- Create pattern calculation functions
- Modify spawn logic to use patterns
- Add configuration options

### Step 6: Add Physics
- Implement gravity and drag
- Update velocity and position calculations
- Add configuration options

### Step 7: Create New Effect Presets
- Add 10+ new presets to `effectPresets.ts`
- Test each preset visually
- Document usage

---

## Testing Requirements

### Unit Tests
```typescript
// src/__tests__/ParticleSystem.enhanced.test.ts

describe('Advanced Particle System', () => {
    test('should support sprite-based particles');
    test('should interpolate color gradients correctly');
    test('should render particle trails');
    test('should emit particles in cone pattern');
    test('should emit particles in ring pattern');
    test('should apply gravity to particles');
    test('should apply drag to particles');
    test('should respect particle budget');
    test('should scale particles over lifetime');
    test('should rotate particles');
});
```

### Integration Tests
- Visual test: Create each effect preset
- Performance test: 2000 particles at 60 FPS
- Memory test: No memory leaks over time

---

## Performance Considerations

- **Texture Atlas**: Bundle all particle sprites into single texture
- **Batch Rendering**: Use ParticleContainer for GPU batch rendering
- **Budget Management**: Enforce 2000 particle limit
- **Object Pooling**: Reuse particle objects (already implemented)
- **LOD**: Reduce particle count on low-end devices

---

## API Changes

### ParticleConfig (Breaking Changes)
```typescript
// Before
export interface ParticleConfig {
    x: number;
    y: number;
    count: number;
    speed: { min: number; max: number };
    life: { min: number; max: number };
    size: { min: number; max: number };
    color: number;
    spread: number;
}

// After (backward compatible)
export interface ParticleConfig {
    x: number;
    y: number;
    count: number;
    speed: { min: number; max: number };
    life: { min: number; max: number };
    size: { min: number; max: number };
    color?: number;  // Optional if gradient provided
    spread: number;
    
    // New optional fields
    sprite?: ParticleSpriteType;
    colorGradient?: ColorGradient;
    rotation?: { min: number; max: number };
    rotationSpeed?: { min: number; max: number };
    scaleStart?: number;
    scaleEnd?: number;
    emitterPattern?: EmitterPattern;
    emitterAngle?: number;
    emitterWidth?: number;
    trail?: TrailConfig;
    gravity?: number;
    drag?: number;
}
```

---

## Visual Examples

### Before
- ⭕ Orange circles exploding outward
- ⭕ Yellow circles for muzzle flash
- ⭕ Blue circles for shield hit

### After
- 🔥 Fire particles with yellow→orange→red gradient
- ✨ White spark trails from impacts
- 💨 Smoke plumes rising upward
- ⚡ Energy rings expanding from shield hits
- 🌟 Glowing projectile trails

---

## Success Criteria

- ✅ 8+ particle sprite types implemented
- ✅ Color gradient system working
- ✅ Trail effects rendering correctly
- ✅ 5+ emitter patterns functional
- ✅ Gravity and drag physics working
- ✅ 10+ new effect presets created
- ✅ All tests passing
- ✅ 60 FPS maintained with 2000 particles
- ✅ Visual improvement obvious and impressive

---

## Future Enhancements

- Particle collision detection
- Magnetic/attractors for particles
- Mesh-based emitters
- 3D particle support
- Custom shader effects
- Texture animation (sprite sheets)

---

## References

- Current implementation: `src/rendering/ParticleSystem.ts`
- Effect presets: `src/rendering/effectPresets.ts`
- PixiJS Graphics: https://pixijs.com/docs/guides/components/graphics
- PixiJS Textures: https://pixijs.com/docs/guides/components/textures
