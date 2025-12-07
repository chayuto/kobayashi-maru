# Task 04: Render Manager Extraction

**Date:** 2025-12-07  
**Priority:** P1 (Manager)  
**Estimated Effort:** 3 hours  
**Dependencies:** Task 01 (Service Container), Task 02 (Bootstrap)

---

## Problem Statement

Rendering logic is scattered throughout Game.ts `update()`:

```typescript
// In update() - 40+ lines of rendering
if (this.renderSystem) {
  this.renderSystem(this.world);
}

if (this.beamRenderer && this.combatSystem) {
  this.beamRenderer.updateCharges(deltaTime);
  this.beamRenderer.render(this.combatSystem.getActiveBeams());
}

if (this.particleSystem) {
  this.particleSystem.update(deltaTime);
}

if (this.shockwaveRenderer) {
  this.shockwaveRenderer.render(deltaTime);
}

if (this.explosionManager) {
  this.explosionManager.update(deltaTime);
}

if (this.healthBarRenderer) {
  this.healthBarRenderer.update(this.world);
}

if (this.shieldRenderer) {
  this.shieldRenderer.update(this.world, deltaTime);
}

if (this.turretUpgradeVisuals) {
  this.turretUpgradeVisuals.update();
}
```

Issues:
- Null checks for every renderer
- No clear render order documentation
- Hard to add new visual effects
- Mixing update and render concerns

---

## Solution: RenderManager Class

Create a dedicated render manager that:
- Owns all rendering subsystems
- Provides clear render order
- Eliminates null checks via ServiceContainer
- Separates update from render phases

---

## Implementation

### File: `src/core/managers/RenderManager.ts`

```typescript
/**
 * Render Manager for Kobayashi Maru
 * 
 * Consolidates all rendering logic into a single manager.
 * Handles render order, visual effects, and screen effects.
 * 
 * @module core/managers/RenderManager
 */

import { getServices } from '../services';
import type { GameWorld } from '../../ecs/world';
import type { BeamVisual } from '../../systems/combatSystem';

/**
 * Render layer order (lower = rendered first / behind)
 */
export enum RenderLayer {
  BACKGROUND = 0,    // Starfield
  ENTITIES = 100,    // Ships, turrets, enemies
  EFFECTS = 200,     // Beams, particles
  OVERLAYS = 300,    // Health bars, shields
  UI = 400,          // HUD elements
}

/**
 * Render statistics for debugging
 */
export interface RenderStats {
  spriteCount: number;
  particleCount: number;
  beamCount: number;
  drawCalls: number;
}

/**
 * Manages all rendering subsystems.
 */
export class RenderManager {
  private world: GameWorld;
  private renderSystem: ((world: GameWorld) => void) | null = null;
  
  // Cached service references (populated on init)
  private initialized: boolean = false;
  
  constructor(world: GameWorld) {
    this.world = world;
  }
  
  /**
   * Set the ECS render system.
   * Called after systems are created.
   */
  setRenderSystem(renderSystem: (world: GameWorld) => void): void {
    this.renderSystem = renderSystem;
  }
  
  /**
   * Initialize the render manager.
   * Ensures all rendering services are ready.
   */
  init(): void {
    if (this.initialized) return;
    
    // Force initialization of rendering services
    const services = getServices();
    services.get('spriteManager');
    services.get('glowManager');
    services.get('starfield');
    
    this.initialized = true;
  }
  
  // ==========================================================================
  // UPDATE PHASE (called during gameplay update)
  // ==========================================================================
  
  /**
   * Update time-based visual effects.
   * Called during the render phase of the game loop.
   * 
   * @param deltaTime - Time since last frame in seconds
   */
  updateEffects(deltaTime: number): void {
    const services = getServices();
    
    // Update particle system
    services.get('particleSystem').update(deltaTime);
    
    // Update shockwave animations
    services.get('shockwaveRenderer').render(deltaTime);
    
    // Update explosion manager
    services.get('explosionManager').update(deltaTime);
    
    // Update beam charge effects
    services.get('beamRenderer').updateCharges(deltaTime);
  }
  
  /**
   * Update background elements.
   * 
   * @param deltaTime - Time since last frame
   * @param scrollX - Horizontal scroll speed
   * @param scrollY - Vertical scroll speed
   */
  updateBackground(deltaTime: number, scrollX: number = 0, scrollY: number = 50): void {
    getServices().get('starfield').update(deltaTime, scrollX, scrollY);
  }
  
  // ==========================================================================
  // RENDER PHASE
  // ==========================================================================
  
  /**
   * Render all game visuals.
   * Called after update phase.
   * 
   * @param activeBeams - Active beam visuals from combat system
   */
  render(activeBeams: readonly BeamVisual[] = []): void {
    const services = getServices();
    
    // 1. Render entities (sprites)
    if (this.renderSystem) {
      this.renderSystem(this.world);
    }
    
    // 2. Render beam weapons
    services.get('beamRenderer').render(activeBeams);
    
    // 3. Render health bars
    services.get('healthBarRenderer').update(this.world);
    
    // 4. Render shields
    services.get('shieldRenderer').update(this.world, 0);
    
    // 5. Render turret upgrade visuals
    services.get('turretUpgradeVisuals').update();
  }
  
  /**
   * Apply post-render effects.
   * 
   * @param deltaTime - Time since last frame
   */
  applyPostEffects(deltaTime: number): void {
    const services = getServices();
    const app = services.get('app');
    const screenShake = services.get('screenShake');
    
    // Apply screen shake
    const { offsetX, offsetY } = screenShake.update(deltaTime);
    app.stage.position.set(offsetX, offsetY);
  }
  
  // ==========================================================================
  // SCREEN EFFECTS
  // ==========================================================================
  
  /**
   * Trigger screen shake effect.
   * 
   * @param intensity - Shake intensity (pixels)
   * @param duration - Shake duration (seconds)
   */
  shake(intensity: number = 5, duration: number = 0.3): void {
    getServices().get('screenShake').shake(intensity, duration);
  }
  
  /**
   * Create explosion effect at position.
   * 
   * @param x - World X coordinate
   * @param y - World Y coordinate
   * @param size - Explosion size multiplier
   */
  createExplosion(x: number, y: number, size: number = 1): void {
    getServices().get('explosionManager').createExplosion(x, y, size);
  }
  
  /**
   * Create particle burst at position.
   * 
   * @param x - World X coordinate
   * @param y - World Y coordinate
   * @param config - Particle configuration
   */
  createParticleBurst(x: number, y: number, config?: unknown): void {
    const ps = getServices().get('particleSystem');
    // Use default burst or custom config
    ps.emit(x, y, config);
  }
  
  // ==========================================================================
  // UTILITY
  // ==========================================================================
  
  /**
   * Get render statistics for debugging.
   */
  getStats(): RenderStats {
    const services = getServices();
    
    return {
      spriteCount: services.get('spriteManager').getSpriteCount?.() ?? 0,
      particleCount: services.get('particleSystem').getParticleCount?.() ?? 0,
      beamCount: 0, // Would need to track this
      drawCalls: 0, // Would need PixiJS stats
    };
  }
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.renderSystem = null;
    this.initialized = false;
  }
}
```

---

### File: `src/core/managers/index.ts`

```typescript
export { RenderManager, RenderLayer } from './RenderManager';
export type { RenderStats } from './RenderManager';
```

---

## Integration with GameLoopManager

```typescript
// In Game.ts setup
import { RenderManager } from './managers';
import { GameLoopManager } from './loop';

class Game {
  private renderManager: RenderManager;
  private loopManager: GameLoopManager;
  
  private setupUpdateCallbacks(): void {
    const services = getServices();
    
    // Background (pre-update, always runs)
    this.loopManager.onPreUpdate((dt) => {
      this.renderManager.updateBackground(dt);
    });
    
    // Effects update (render phase)
    this.loopManager.onRender((dt) => {
      // Update time-based effects
      this.renderManager.updateEffects(dt);
      
      // Render everything
      const combatSystem = services.tryGet('combatSystem');
      const activeBeams = combatSystem?.getActiveBeams() ?? [];
      this.renderManager.render(activeBeams);
    });
    
    // Post-render effects
    this.loopManager.onPostRender((dt) => {
      this.renderManager.applyPostEffects(dt);
    });
  }
}
```

---

## Render Order Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      RENDER FRAME                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 0: BACKGROUND                                      │   │
│  │ - Starfield (parallax scrolling)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 100: ENTITIES                                      │   │
│  │ - Enemy ships                                            │   │
│  │ - Kobayashi Maru                                         │   │
│  │ - Turrets                                                │   │
│  │ - Projectiles                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 200: EFFECTS                                       │   │
│  │ - Beam weapons (glow layer)                              │   │
│  │ - Particles (explosions, sparks)                         │   │
│  │ - Shockwaves                                             │   │
│  │ - Turret upgrade visuals                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 300: OVERLAYS                                      │   │
│  │ - Health bars                                            │   │
│  │ - Shield effects                                         │   │
│  │ - Status indicators                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ POST-EFFECTS                                             │   │
│  │ - Screen shake                                           │   │
│  │ - Camera offset                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

- [ ] RenderManager compiles without errors
- [ ] All rendering services accessed via ServiceContainer
- [ ] No null checks in render methods
- [ ] Render order matches current behavior
- [ ] Screen shake works correctly
- [ ] Explosion effects work correctly

---

## AI Agent Instructions

When implementing this task:

1. Create `src/core/managers/` directory
2. Create `RenderManager.ts` with the code above
3. Create `index.ts` barrel export
4. Update `src/core/index.ts` to export managers
5. Run `npm run typecheck` to verify no type errors
6. Do NOT modify Game.ts yet - that comes in Task 08

---

## Next Task

After this task is complete, proceed to:
- **Task 05: Gameplay Manager** - Consolidates game logic (waves, scoring, resources)
