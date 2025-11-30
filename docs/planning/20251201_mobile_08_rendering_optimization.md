# Task 8: Mobile Rendering Optimization

**Date:** December 1, 2025  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 7 (Performance Detection)

## Objective

Optimize rendering systems for mobile devices with quality scaling, reduced draw calls, and mobile-specific optimizations.

## Implementation

### 1. Add Quality Settings to ParticleSystem

**File:** `src/rendering/ParticleSystem.ts`

```typescript
export class ParticleSystem {
  private quality: number = 1.0;
  private maxParticles: number = 300;
  private enabled: boolean = true;

  public setQuality(quality: number): void {
    this.quality = Math.max(0, Math.min(1, quality));
  }

  public setMaxParticles(max: number): void {
    this.maxParticles = max;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public emit(config: ParticleConfig): void {
    if (!this.enabled) return;
    
    // Scale particle count by quality
    const count = Math.floor(config.count * this.quality);
    
    // Limit total particles
    if (this.particles.length + count > this.maxParticles) {
      return;
    }
    
    // ... rest of emit logic
  }
}
```

### 2. Add Enable/Disable to BeamRenderer

**File:** `src/rendering/BeamRenderer.ts`

```typescript
export class BeamRenderer {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.container.visible = false;
    }
  }

  public render(beams: ActiveBeam[]): void {
    if (!this.enabled) return;
    // ... existing render logic
  }
}
```

### 3. Add Enable/Disable to ScreenShake

**File:** `src/rendering/ScreenShake.ts`

```typescript
export class ScreenShake {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public update(deltaTime: number): { offsetX: number; offsetY: number } {
    if (!this.enabled) {
      return { offsetX: 0, offsetY: 0 };
    }
    // ... existing update logic
  }
}
```

### 4. Add Enable/Disable to HealthBarRenderer

**File:** `src/rendering/HealthBarRenderer.ts`

```typescript
export class HealthBarRenderer {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.container.visible = false;
    }
  }

  public update(world: GameWorld): void {
    if (!this.enabled) return;
    // ... existing update logic
  }
}
```

### 5. Add Entity Limit to WaveManager

**File:** `src/game/waveManager.ts`

```typescript
export class WaveManager {
  private maxEntities: number = 5000;

  public setMaxEntities(max: number): void {
    this.maxEntities = max;
  }

  private spawnEnemy(): void {
    // Check entity count before spawning
    if (getEntityCount() >= this.maxEntities) {
      return; // Don't spawn if at limit
    }
    
    // ... existing spawn logic
  }
}
```

### 6. Mobile-Specific Renderer Settings

**File:** `src/core/Game.ts`

```typescript
async init(): Promise<void> {
  const profile = this.performanceDetector.getProfile();
  
  // Mobile-specific PixiJS settings
  await this.app.init({
    width: GAME_CONFIG.WORLD_WIDTH,
    height: GAME_CONFIG.WORLD_HEIGHT,
    backgroundColor: LCARS_COLORS.BACKGROUND,
    resolution: profile.tier === PerformanceTier.LOW ? 1 : window.devicePixelRatio,
    autoDensity: true,
    preference: profile.tier === PerformanceTier.HIGH ? 'webgpu' : 'webgl',
    antialias: profile.tier !== PerformanceTier.LOW,
    powerPreference: 'high-performance'
  });
  
  // ... rest of init
}
```

## Testing

- [ ] Low quality mode reduces particle count
- [ ] Beams can be disabled
- [ ] Screen shake can be disabled
- [ ] Health bars can be disabled
- [ ] Entity spawning respects limits
- [ ] Performance improves on low-end devices
- [ ] Visual quality acceptable at all tiers
- [ ] No crashes or errors

## Success Criteria

- All rendering systems support quality scaling
- Performance tier settings applied correctly
- Low-end devices maintain 30fps
- Mid-range devices maintain 45fps
- High-end devices maintain 60fps
- Visual quality degrades gracefully

## Related Files

- `src/rendering/ParticleSystem.ts` (modify)
- `src/rendering/BeamRenderer.ts` (modify)
- `src/rendering/ScreenShake.ts` (modify)
- `src/rendering/HealthBarRenderer.ts` (modify)
- `src/game/waveManager.ts` (modify)
- `src/core/Game.ts` (modify)

## Next Task

Task 9: Touch Gesture System
