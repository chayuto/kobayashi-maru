# Task 7: Performance Detection

**Date:** December 1, 2025  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** None

## Objective

Detect device performance capabilities and automatically adjust quality settings for optimal mobile experience.

## Implementation

### Create PerformanceDetector

**File:** `src/core/PerformanceDetector.ts`

```typescript
export enum PerformanceTier {
  LOW = 'low',      // Old phones, 30fps target
  MEDIUM = 'medium', // Mid-range, 45fps target
  HIGH = 'high'      // Flagship, 60fps target
}

export interface PerformanceProfile {
  tier: PerformanceTier;
  maxEntities: number;
  maxParticles: number;
  enableBeams: boolean;
  enableScreenShake: boolean;
  enableHealthBars: boolean;
  particleQuality: number; // 0.0 - 1.0
  targetFPS: number;
}

export class PerformanceDetector {
  private profile: PerformanceProfile;
  private fpsHistory: number[] = [];
  private maxHistorySize: number = 60;

  constructor() {
    this.profile = this.detectInitialProfile();
  }

  private detectInitialProfile(): PerformanceProfile {
    // Detect based on:
    // 1. Hardware concurrency (CPU cores)
    // 2. Device memory (if available)
    // 3. GPU tier (via WebGL renderer info)
    // 4. User agent (mobile vs desktop)
    
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4;
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    
    let tier: PerformanceTier;
    
    if (isMobile) {
      if (cores <= 4 || memory <= 2) {
        tier = PerformanceTier.LOW;
      } else if (cores <= 6 || memory <= 4) {
        tier = PerformanceTier.MEDIUM;
      } else {
        tier = PerformanceTier.HIGH;
      }
    } else {
      tier = PerformanceTier.HIGH; // Desktop defaults to high
    }
    
    return this.createProfile(tier);
  }

  private createProfile(tier: PerformanceTier): PerformanceProfile {
    switch (tier) {
      case PerformanceTier.LOW:
        return {
          tier,
          maxEntities: 500,
          maxParticles: 50,
          enableBeams: false,
          enableScreenShake: false,
          enableHealthBars: false,
          particleQuality: 0.3,
          targetFPS: 30
        };
      
      case PerformanceTier.MEDIUM:
        return {
          tier,
          maxEntities: 1500,
          maxParticles: 150,
          enableBeams: true,
          enableScreenShake: true,
          enableHealthBars: false,
          particleQuality: 0.6,
          targetFPS: 45
        };
      
      case PerformanceTier.HIGH:
      default:
        return {
          tier,
          maxEntities: 5000,
          maxParticles: 300,
          enableBeams: true,
          enableScreenShake: true,
          enableHealthBars: true,
          particleQuality: 1.0,
          targetFPS: 60
        };
    }
  }

  public recordFrame(fps: number): void {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }
    
    // Auto-adjust if consistently below target
    if (this.fpsHistory.length >= this.maxHistorySize) {
      const avgFPS = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
      
      if (avgFPS < this.profile.targetFPS * 0.8) {
        this.downgrade();
      }
    }
  }

  private downgrade(): void {
    if (this.profile.tier === PerformanceTier.HIGH) {
      this.profile = this.createProfile(PerformanceTier.MEDIUM);
      console.log('Performance downgraded to MEDIUM');
    } else if (this.profile.tier === PerformanceTier.MEDIUM) {
      this.profile = this.createProfile(PerformanceTier.LOW);
      console.log('Performance downgraded to LOW');
    }
    this.fpsHistory = [];
  }

  public getProfile(): PerformanceProfile {
    return { ...this.profile };
  }

  public getTier(): PerformanceTier {
    return this.profile.tier;
  }
}
```

### Integrate with Game

**File:** `src/core/Game.ts`

```typescript
import { PerformanceDetector } from './PerformanceDetector';

export class Game {
  private performanceDetector: PerformanceDetector;

  constructor(containerId: string = 'app') {
    // ... existing code
    this.performanceDetector = new PerformanceDetector();
  }

  async init(): Promise<void> {
    // ... existing code
    
    const profile = this.performanceDetector.getProfile();
    console.log(`Performance tier: ${profile.tier}`);
    console.log(`Max entities: ${profile.maxEntities}`);
    console.log(`Target FPS: ${profile.targetFPS}`);
    
    // Apply profile to systems
    this.applyPerformanceProfile(profile);
  }

  private applyPerformanceProfile(profile: PerformanceProfile): void {
    // Configure particle system
    if (this.particleSystem) {
      this.particleSystem.setQuality(profile.particleQuality);
      this.particleSystem.setMaxParticles(profile.maxParticles);
    }
    
    // Configure beam renderer
    if (this.beamRenderer && !profile.enableBeams) {
      this.beamRenderer.setEnabled(false);
    }
    
    // Configure screen shake
    if (this.screenShake && !profile.enableScreenShake) {
      this.screenShake.setEnabled(false);
    }
    
    // Configure health bars
    if (this.healthBarRenderer && !profile.enableHealthBars) {
      this.healthBarRenderer.setEnabled(false);
    }
    
    // Configure wave manager entity limits
    this.waveManager.setMaxEntities(profile.maxEntities);
  }

  private update(): void {
    // ... existing code
    
    // Record FPS for performance monitoring
    const fps = this.app.ticker.FPS;
    this.performanceDetector.recordFrame(fps);
  }
}
```

## Testing

- [ ] Correct tier detected on various devices
- [ ] Quality settings applied correctly
- [ ] Auto-downgrade works when FPS drops
- [ ] No performance issues after downgrade
- [ ] Desktop maintains high quality
- [ ] Low-end mobile playable at 30fps

## Success Criteria

- Performance tier correctly detected
- Quality settings automatically applied
- Game playable on low-end devices
- High-end devices get full quality
- Auto-adjustment prevents lag

## Related Files

- `src/core/PerformanceDetector.ts` (new)
- `src/core/Game.ts` (modify)
- `src/core/index.ts` (export)

## Next Task

Task 8: Mobile Rendering Optimization
