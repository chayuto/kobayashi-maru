# Enhancement Task 02: Dynamic Lighting & Glow Effects

**Date:** 2025-12-07  
**Priority:** CRITICAL  
**Category:** Visual Effects  
**Estimated Effort:** 2-3 days  
**Dependencies:** None

---

## Objective

Implement dynamic lighting, bloom/glow effects, and shield visuals using PixiJS filters to create a visually stunning, atmospheric game with energy-based visual feedback.

---

## Current State

**Current Rendering**: `src/rendering/`
- Basic sprite rendering
- Simple beam lines
- No lighting effects
- No glow/bloom
- No shield visuals

**Limitations**:
- Flat, lifeless visuals
- No sense of energy or power
- Shields are invisible
- No visual depth
- Missed opportunity for GPU-accelerated effects

---

## Proposed Enhancements

### 1. Bloom/Glow Filter

**Goal**: Add glow to energy weapons, explosions, and projectiles

**Implementation**: Use PixiJS `BloomFilter`

```typescript
// src/rendering/filters/GlowManager.ts

import { BloomFilter, Container } from 'pixi.js';

export interface GlowConfig {
    strength: number;    // 0-10, bloom intensity
    blur: number;        // 0-20, blur amount
    quality: number;     // 1-10, filter quality
    threshold: number;   // 0-1, brightness threshold
}

export class GlowManager {
    private bloomFilter: BloomFilter;
    private glowLayers: Map<string, Container> = new Map();
    
    constructor() {
        this.bloomFilter = new BloomFilter({
            strength: 2,
            blur: 8,
            quality: 5,
            threshold: 0.5
        });
    }
    
    /**
     * Create a glow layer for specific entities
     */
    createGlowLayer(name: string, config: GlowConfig): Container {
        const container = new Container();
        container.filters = [
            new BloomFilter({
                strength: config.strength,
                blur: config.blur,
                quality: config.quality,
                threshold: config.threshold
            })
        ];
        this.glowLayers.set(name, container);
        return container;
    }
    
    /**
     * Pulse glow intensity (for charging effects)
     */
    pulseGlow(layerName: string, deltaTime: number): void {
        const layer = this.glowLayers.get(layerName);
        if (!layer) return;
        
        const filter = layer.filters?.[0] as BloomFilter;
        if (filter) {
            // Sine wave pulsing
            const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
            filter.strength = 2 + pulse * 3;
        }
    }
}
```

**Glow Layers**:
- **Weapons Layer**: Glow for beams, projectiles, muzzle flash
- **Explosion Layer**: Intense glow for explosions
- **Shield Layer**: Soft glow for shields
- **UI Layer**: Glow for UI elements (optional)

### 2. Shield Bubble Visuals

**Goal**: Render visible shield bubbles with Fresnel effect

**Implementation**: Use `Graphics` with alpha gradient

```typescript
// src/rendering/ShieldRenderer.ts

import { Graphics, Container, Application } from 'pixi.js';

export interface ShieldVisual {
    entityId: number;
    x: number;
    y: number;
    radius: number;
    strength: number;  // 0-1, shield health percentage
    hitAnimation: number;  // Timer for hit flash
}

export class ShieldRenderer {
    private graphics: Graphics;
    private shields: Map<number, ShieldVisual> = new Map();
    
    constructor(private app: Application) {
        this.graphics = new Graphics();
    }
    
    /**
     * Add or update shield visual
     */
    setShield(entityId: number, x: number, y: number, radius: number, strength: number): void {
        this.shields.set(entityId, { entityId, x, y, radius, strength, hitAnimation: 0 });
    }
    
    /**
     * Trigger shield hit animation
     */
    hitShield(entityId: number): void {
        const shield = this.shields.get(entityId);
        if (shield) {
            shield.hitAnimation = 0.3; // 300ms flash
        }
    }
    
    /**
     * Render all shields
     */
    render(deltaTime: number): void {
        this.graphics.clear();
        
        for (const shield of this.shields.values()) {
            // Update hit animation
            if (shield.hitAnimation > 0) {
                shield.hitAnimation -= deltaTime;
            }
            
            // Calculate alpha based on strength and hit
            const baseAlpha = 0.15 + (shield.strength * 0.1);
            const hitAlpha = shield.hitAnimation > 0 ? 0.6 : 0;
            const alpha = Math.min(1, baseAlpha + hitAlpha);
            
            // Fresnel effect - brighter at edges
            this.drawFresnelShield(
                shield.x,
                shield.y,
                shield.radius,
                alpha,
                shield.strength
            );
        }
    }
    
    /**
     * Draw shield with Fresnel-like edge glow
     */
    private drawFresnelShield(x: number, y: number, radius: number, alpha: number, strength: number): void {
        // Color based on strength: cyan full → yellow mid → red low
        let color = 0x00CCFF; // Cyan (full)
        if (strength < 0.3) {
            color = 0xFF4444; // Red (low)
        } else if (strength < 0.6) {
            color = 0xFFCC00; // Yellow (mid)
        }
        
        // Outer glow ring
        this.graphics.circle(x, y, radius);
        this.graphics.fill({ color, alpha: alpha * 0.8 });
        
        // Inner darker fill
        this.graphics.circle(x, y, radius - 2);
        this.graphics.fill({ color, alpha: alpha * 0.3 });
        
        // Edge highlight
        this.graphics.circle(x, y, radius);
        this.graphics.stroke({ color: 0xFFFFFF, width: 2, alpha: alpha * 1.2 });
    }
    
    /**
     * Remove shield visual
     */
    removeShield(entityId: number): void {
        this.shields.delete(entityId);
    }
}
```

**Shield States**:
- **Full**: Cyan, faint alpha (0.2)
- **Mid**: Yellow, moderate alpha (0.4)
- **Low**: Red, high alpha (0.6)
- **Hit**: White flash for 300ms
- **Broken**: Explosion effect, remove visual

### 3. Point Light System

**Goal**: Dynamic light sources from weapons, explosions, and effects

**Implementation**: Layered approach with additive blend mode

```typescript
// src/rendering/LightingSystem.ts

import { Graphics, Container, BlendMode } from 'pixi.js';

export interface Light {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: number;
    intensity: number;  // 0-1
    flicker?: boolean;
}

export class LightingSystem {
    private lightLayer: Container;
    private lights: Map<string, Light> = new Map();
    
    constructor() {
        this.lightLayer = new Container();
        this.lightLayer.blendMode = BlendMode.ADD;
    }
    
    /**
     * Add a light source
     */
    addLight(id: string, x: number, y: number, radius: number, color: number, intensity: number, flicker?: boolean): void {
        this.lights.set(id, { id, x, y, radius, color, intensity, flicker });
    }
    
    /**
     * Remove a light source
     */
    removeLight(id: string): void {
        this.lights.delete(id);
    }
    
    /**
     * Render all lights
     */
    render(graphics: Graphics, deltaTime: number): void {
        graphics.clear();
        
        for (const light of this.lights.values()) {
            let intensity = light.intensity;
            
            // Flicker effect
            if (light.flicker) {
                intensity *= 0.8 + Math.random() * 0.4;
            }
            
            // Radial gradient using concentric circles
            this.drawRadialGradient(
                graphics,
                light.x,
                light.y,
                light.radius,
                light.color,
                intensity
            );
        }
    }
    
    /**
     * Draw radial gradient light
     */
    private drawRadialGradient(graphics: Graphics, x: number, y: number, radius: number, color: number, intensity: number): void {
        const steps = 8;
        for (let i = 0; i < steps; i++) {
            const r = radius * (i / steps);
            const alpha = intensity * (1 - i / steps);
            graphics.circle(x, y, r);
            graphics.fill({ color, alpha });
        }
    }
}
```

**Light Sources**:
- **Weapon Fire**: Orange/blue light flash (0.1s duration)
- **Explosions**: Yellow/orange expanding light (0.5s duration)
- **Beams**: Continuous light at fire point and impact
- **Kobayashi Maru**: Constant cyan light (low intensity)
- **Turrets**: Faint blue light when active

### 4. Energy Field Distortion

**Goal**: Warp/distortion effect for shields and special abilities

**Implementation**: Use PixiJS `DisplacementFilter`

```typescript
// src/rendering/filters/DistortionManager.ts

import { DisplacementFilter, Sprite, Texture, Application } from 'pixi.js';

export class DistortionManager {
    private displacementSprite: Sprite;
    private displacementFilter: DisplacementFilter;
    
    constructor(private app: Application) {
        // Create displacement map texture
        this.displacementSprite = this.createDisplacementTexture();
        this.displacementFilter = new DisplacementFilter({
            sprite: this.displacementSprite,
            scale: { x: 20, y: 20 }
        });
    }
    
    /**
     * Create animated noise texture for displacement
     */
    private createDisplacementTexture(): Sprite {
        // Generate Perlin-like noise texture
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = ctx.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const value = Math.random() * 255;
            imageData.data[i] = value;     // R
            imageData.data[i + 1] = value; // G
            imageData.data[i + 2] = value; // B
            imageData.data[i + 3] = 255;   // A
        }
        ctx.putImageData(imageData, 0, 0);
        
        const texture = Texture.from(canvas);
        return Sprite.from(texture);
    }
    
    /**
     * Apply distortion to container
     */
    applyDistortion(container: Container, intensity: number): void {
        this.displacementFilter.scale = {
            x: intensity * 20,
            y: intensity * 20
        };
        container.filters = [this.displacementFilter];
    }
    
    /**
     * Animate displacement for energy effects
     */
    update(deltaTime: number): void {
        // Rotate displacement sprite for animated effect
        this.displacementSprite.x += deltaTime * 10;
        this.displacementSprite.y += deltaTime * 15;
    }
}
```

**Distortion Effects**:
- **Shield Hit**: Ripple distortion on impact
- **Cloaking**: Shimmer effect when Species 8472 cloaks
- **Warp Entry**: Distortion during wave transitions
- **Ion Storm**: Environmental distortion effect

---

## Integration Points

### Rendering System Changes

Update `src/rendering/RenderingSystem.ts`:

```typescript
export class RenderingSystem {
    private glowManager: GlowManager;
    private shieldRenderer: ShieldRenderer;
    private lightingSystem: LightingSystem;
    private distortionManager: DistortionManager;
    
    init(app: Application): void {
        // Initialize managers
        this.glowManager = new GlowManager();
        this.shieldRenderer = new ShieldRenderer(app);
        this.lightingSystem = new LightingSystem();
        this.distortionManager = new DistortionManager(app);
        
        // Setup rendering layers
        const weaponGlowLayer = this.glowManager.createGlowLayer('weapons', {
            strength: 3,
            blur: 10,
            quality: 5,
            threshold: 0.4
        });
        app.stage.addChild(weaponGlowLayer);
        
        const lightingLayer = new Container();
        lightingLayer.filters = [new BlendMode.ADD];
        app.stage.addChild(lightingLayer);
    }
    
    render(world: GameWorld, deltaTime: number): void {
        // ... existing rendering ...
        
        // Render shields
        this.shieldRenderer.render(deltaTime);
        
        // Render lighting
        this.lightingSystem.render(this.lightingGraphics, deltaTime);
        
        // Update distortion
        this.distortionManager.update(deltaTime);
    }
}
```

### Combat System Integration

Update `src/systems/combatSystem.ts` to trigger effects:

```typescript
function fireBeamWeapon(world: GameWorld, turret: number, target: number): void {
    // ... existing beam logic ...
    
    // Add weapon fire light
    const x = Position.x[turret];
    const y = Position.y[turret];
    world.lightingSystem.addLight(
        `weapon-${turret}-${Date.now()}`,
        x, y,
        100,  // radius
        0xFF9900,  // orange
        0.8,  // intensity
        true  // flicker
    );
    
    // Remove light after 0.1s
    setTimeout(() => {
        world.lightingSystem.removeLight(`weapon-${turret}-${Date.now()}`);
    }, 100);
}
```

### Damage System Integration

Update `src/systems/damageSystem.ts` to trigger shield effects:

```typescript
function applyDamage(world: GameWorld, entity: number, damage: number): void {
    // ... existing damage logic ...
    
    // If entity has shield, trigger shield hit visual
    if (hasComponent(world, Shield, entity)) {
        world.shieldRenderer.hitShield(entity);
    }
}
```

---

## Performance Considerations

### Filter Optimization
- **Quality Settings**: Lower quality on mobile/low-end devices
- **Filter Pooling**: Reuse filter instances
- **Selective Filtering**: Only apply to visible entities
- **LOD**: Reduce filter quality at distance

### Rendering Layers
- **Batch Rendering**: Group similar effects
- **Culling**: Skip off-screen effects
- **Update Frequency**: Update lights at 30Hz, not 60Hz

---

## Configuration

Add to `src/types/constants.ts`:

```typescript
export const VISUAL_EFFECTS_CONFIG = {
    // Bloom/Glow
    BLOOM_ENABLED: true,
    BLOOM_STRENGTH: 2,
    BLOOM_BLUR: 8,
    BLOOM_QUALITY: 5,
    
    // Shields
    SHIELD_VISIBLE: true,
    SHIELD_BASE_ALPHA: 0.15,
    SHIELD_HIT_ALPHA: 0.6,
    SHIELD_HIT_DURATION: 0.3,
    
    // Lighting
    DYNAMIC_LIGHTING: true,
    LIGHT_QUALITY: 8,  // Gradient steps
    
    // Distortion
    DISTORTION_ENABLED: true,
    DISTORTION_SCALE: 20
};
```

---

## Testing Requirements

### Unit Tests
```typescript
// src/__tests__/GlowManager.test.ts
describe('GlowManager', () => {
    test('should create glow layer with config');
    test('should pulse glow intensity');
    test('should handle multiple layers');
});

// src/__tests__/ShieldRenderer.test.ts
describe('ShieldRenderer', () => {
    test('should render shield at correct position');
    test('should change color based on strength');
    test('should animate hit flash');
    test('should remove destroyed shields');
});

// src/__tests__/LightingSystem.test.ts
describe('LightingSystem', () => {
    test('should add and remove lights');
    test('should flicker lights when enabled');
    test('should render radial gradient');
});
```

### Visual Tests
- Glow on weapon fire
- Shield hit animation
- Light fade in/out
- Distortion effect

---

## Success Criteria

- ✅ Bloom filter applied to weapons and explosions
- ✅ Shield bubbles visible on all ships with shields
- ✅ Dynamic lights from weapon fire
- ✅ Explosion lights expand and fade
- ✅ Shield hit animation triggers correctly
- ✅ Distortion effects work on special abilities
- ✅ 60 FPS maintained with all effects
- ✅ Configurable quality settings
- ✅ All tests passing

---

## Visual Impact

### Before
- Flat sprites with no depth
- Invisible shields
- No sense of energy or power

### After
- Glowing weapons and explosions
- Visible, reactive shield bubbles
- Dynamic lighting creates atmosphere
- Energy distortion adds sci-fi feel
- Professional, polished appearance

---

## Future Enhancements

- Volumetric lighting
- Shadow casting
- Color grading filter
- Chromatic aberration
- HDR tonemapping
- Post-processing pipeline

---

## References

- PixiJS BloomFilter: https://pixijs.com/docs/guides/components/filter-bloom
- PixiJS DisplacementFilter: https://pixijs.com/docs/guides/components/filter-displacement
- Shield VFX techniques: Game VFX tutorial resources
