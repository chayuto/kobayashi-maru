# Task 03: Game Loop Extraction

**Date:** 2025-12-07  
**Priority:** P0 (Foundation)  
**Estimated Effort:** 2 hours  
**Dependencies:** Task 01 (Service Container)

---

## Problem Statement

Game.ts `update()` method is 150+ lines handling multiple concerns:

```typescript
private update(): void {
  // 1. Frame timing (5 lines)
  this.performanceMonitor.startFrame();
  const deltaTime = this.app.ticker.deltaMS / 1000;
  
  // 2. Starfield update (5 lines)
  if (this.starfield) { this.starfield.update(deltaTime, 0, 50); }
  
  // 3. Gameplay systems (20 lines)
  if (this.gameState.isPlaying()) {
    this.gameTime += deltaTime;
    this.scoreManager.update(deltaTime);
    this.waveManager.update(deltaTime);
    this.systemManager.run(this.world, deltaTime, this.gameTime);
    this.checkGameOver();
    // ... screen shake check
  }
  
  // 4. Rendering (40 lines)
  if (this.renderSystem) { this.renderSystem(this.world); }
  if (this.beamRenderer && this.combatSystem) { ... }
  if (this.particleSystem) { ... }
  // ... many more
  
  // 5. Debug/HUD updates (50 lines)
  if (this.debugManager) { ... }
  if (this.hudManager) { ... }
  
  // 6. Frame end (5 lines)
  this.performanceMonitor.endFrame();
}
```

Issues:
- Mixed gameplay, rendering, and UI logic
- Null checks everywhere
- Hard to modify one aspect without understanding all
- Performance measurement scattered throughout

---

## Solution: GameLoopManager Class

Extract the game loop into a dedicated manager that:
- Separates update phases clearly
- Uses ServiceContainer for dependencies
- Provides hooks for custom update logic
- Handles timing and performance measurement

---

## Implementation

### File: `src/core/loop/GameLoopManager.ts`

```typescript
/**
 * Game Loop Manager for Kobayashi Maru
 * 
 * Manages the main game loop with clear update phases.
 * Separates gameplay, rendering, and UI updates.
 * 
 * @module core/loop/GameLoopManager
 */

import { Application, Ticker } from 'pixi.js';
import { getServices } from '../services';
import type { GameWorld } from '../../ecs/world';

/**
 * Update phase callback type
 */
export type UpdateCallback = (deltaTime: number, gameTime: number) => void;

/**
 * Loop configuration
 */
export interface LoopConfig {
  /** Target FPS (0 = unlimited) */
  targetFPS?: number;
  
  /** Enable performance monitoring */
  enableProfiling?: boolean;
}

/**
 * Loop state for external queries
 */
export interface LoopState {
  /** Is the loop running */
  running: boolean;
  
  /** Total game time in seconds */
  gameTime: number;
  
  /** Current delta time */
  deltaTime: number;
  
  /** Current FPS */
  fps: number;
}

/**
 * Manages the main game loop with phased updates.
 */
export class GameLoopManager {
  private app: Application;
  private world: GameWorld;
  private running: boolean = false;
  private gameTime: number = 0;
  private deltaTime: number = 0;
  private paused: boolean = false;
  
  // Update phase callbacks
  private preUpdateCallbacks: UpdateCallback[] = [];
  private gameplayCallbacks: UpdateCallback[] = [];
  private physicsCallbacks: UpdateCallback[] = [];
  private renderCallbacks: UpdateCallback[] = [];
  private postRenderCallbacks: UpdateCallback[] = [];
  private uiCallbacks: UpdateCallback[] = [];
  
  // Bound update function
  private boundUpdate: () => void;
  
  constructor(app: Application, world: GameWorld) {
    this.app = app;
    this.world = world;
    this.boundUpdate = this.update.bind(this);
  }
  
  /**
   * Start the game loop.
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.app.ticker.add(this.boundUpdate);
    console.log('Game loop started');
  }
  
  /**
   * Stop the game loop.
   */
  stop(): void {
    if (!this.running) return;
    
    this.running = false;
    this.app.ticker.remove(this.boundUpdate);
    console.log('Game loop stopped');
  }
  
  /**
   * Pause gameplay updates (rendering continues).
   */
  pause(): void {
    this.paused = true;
  }
  
  /**
   * Resume gameplay updates.
   */
  resume(): void {
    this.paused = false;
  }
  
  /**
   * Check if paused.
   */
  isPaused(): boolean {
    return this.paused;
  }
  
  /**
   * Get current loop state.
   */
  getState(): LoopState {
    return {
      running: this.running,
      gameTime: this.gameTime,
      deltaTime: this.deltaTime,
      fps: this.app.ticker.FPS,
    };
  }
  
  /**
   * Get total game time.
   */
  getGameTime(): number {
    return this.gameTime;
  }
  
  /**
   * Reset game time (for restart).
   */
  resetGameTime(): void {
    this.gameTime = 0;
  }
  
  // ==========================================================================
  // CALLBACK REGISTRATION
  // ==========================================================================
  
  /**
   * Register a pre-update callback (runs first, always).
   * Use for: input polling, performance start
   */
  onPreUpdate(callback: UpdateCallback): () => void {
    this.preUpdateCallbacks.push(callback);
    return () => this.removeCallback(this.preUpdateCallbacks, callback);
  }
  
  /**
   * Register a gameplay callback (runs when not paused).
   * Use for: game logic, AI, scoring
   */
  onGameplay(callback: UpdateCallback): () => void {
    this.gameplayCallbacks.push(callback);
    return () => this.removeCallback(this.gameplayCallbacks, callback);
  }
  
  /**
   * Register a physics callback (runs when not paused).
   * Use for: ECS systems, collision, movement
   */
  onPhysics(callback: UpdateCallback): () => void {
    this.physicsCallbacks.push(callback);
    return () => this.removeCallback(this.physicsCallbacks, callback);
  }
  
  /**
   * Register a render callback (runs always).
   * Use for: sprite updates, visual effects
   */
  onRender(callback: UpdateCallback): () => void {
    this.renderCallbacks.push(callback);
    return () => this.removeCallback(this.renderCallbacks, callback);
  }
  
  /**
   * Register a post-render callback (runs always).
   * Use for: screen shake, camera effects
   */
  onPostRender(callback: UpdateCallback): () => void {
    this.postRenderCallbacks.push(callback);
    return () => this.removeCallback(this.postRenderCallbacks, callback);
  }
  
  /**
   * Register a UI callback (runs always).
   * Use for: HUD updates, debug overlay
   */
  onUI(callback: UpdateCallback): () => void {
    this.uiCallbacks.push(callback);
    return () => this.removeCallback(this.uiCallbacks, callback);
  }
  
  /**
   * Remove a callback from an array.
   */
  private removeCallback(array: UpdateCallback[], callback: UpdateCallback): void {
    const index = array.indexOf(callback);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }
  
  // ==========================================================================
  // MAIN UPDATE LOOP
  // ==========================================================================
  
  /**
   * Main update loop - called by PixiJS ticker.
   */
  private update(): void {
    const services = getServices();
    const perfMon = services.tryGet('performanceMonitor');
    
    // Start frame timing
    perfMon?.startFrame();
    
    // Calculate delta time in seconds
    this.deltaTime = this.app.ticker.deltaMS / 1000;
    
    // Phase 1: Pre-update (always runs)
    this.runCallbacks(this.preUpdateCallbacks);
    
    // Phase 2: Gameplay (only when not paused)
    if (!this.paused) {
      this.gameTime += this.deltaTime;
      
      perfMon?.startMeasure('gameplay');
      this.runCallbacks(this.gameplayCallbacks);
      perfMon?.endMeasure('gameplay');
      
      // Phase 3: Physics/Systems (only when not paused)
      perfMon?.startMeasure('systems');
      this.runCallbacks(this.physicsCallbacks);
      perfMon?.endMeasure('systems');
    }
    
    // Phase 4: Rendering (always runs)
    perfMon?.startRender();
    this.runCallbacks(this.renderCallbacks);
    perfMon?.endRender();
    
    // Phase 5: Post-render (always runs)
    this.runCallbacks(this.postRenderCallbacks);
    
    // Phase 6: UI (always runs)
    this.runCallbacks(this.uiCallbacks);
    
    // End frame timing
    perfMon?.endFrame();
  }
  
  /**
   * Run all callbacks in an array.
   */
  private runCallbacks(callbacks: UpdateCallback[]): void {
    for (const callback of callbacks) {
      try {
        callback(this.deltaTime, this.gameTime);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    }
  }
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.stop();
    this.preUpdateCallbacks = [];
    this.gameplayCallbacks = [];
    this.physicsCallbacks = [];
    this.renderCallbacks = [];
    this.postRenderCallbacks = [];
    this.uiCallbacks = [];
  }
}
```

---

### File: `src/core/loop/index.ts`

```typescript
export { GameLoopManager } from './GameLoopManager';
export type { UpdateCallback, LoopConfig, LoopState } from './GameLoopManager';
```

---

## Usage Example

### Before (Game.ts):

```typescript
class Game {
  private update(): void {
    // 150+ lines of mixed concerns
  }
  
  start(): void {
    this.app.ticker.add(this.update.bind(this));
  }
}
```

### After (Game.ts):

```typescript
import { GameLoopManager } from './loop';
import { getServices } from './services';

class Game {
  private loopManager: GameLoopManager;
  
  async init(): Promise<void> {
    // ... bootstrap
    
    this.loopManager = new GameLoopManager(this.app, this.world);
    this.setupUpdateCallbacks();
  }
  
  private setupUpdateCallbacks(): void {
    const services = getServices();
    
    // Starfield (always runs)
    this.loopManager.onPreUpdate((dt) => {
      services.get('starfield').update(dt, 0, 50);
    });
    
    // Gameplay logic
    this.loopManager.onGameplay((dt) => {
      services.get('scoreManager').update(dt);
      services.get('waveManager').update(dt);
      this.checkGameOver();
    });
    
    // ECS systems
    this.loopManager.onPhysics((dt, gameTime) => {
      services.get('systemManager').run(this.world, dt, gameTime);
    });
    
    // Rendering
    this.loopManager.onRender((dt) => {
      this.renderSystem?.(this.world);
      services.get('beamRenderer').render(/* ... */);
      services.get('particleSystem').update(dt);
      // ... other renderers
    });
    
    // UI updates
    this.loopManager.onUI(() => {
      this.updateHUD();
      this.updateDebugOverlay();
    });
  }
  
  start(): void {
    this.loopManager.start();
  }
  
  pause(): void {
    this.loopManager.pause();
    services.get('pauseOverlay').show();
  }
  
  resume(): void {
    this.loopManager.resume();
    services.get('pauseOverlay').hide();
  }
}
```

---

## Update Phase Order

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRAME START                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. PRE-UPDATE (always)                                          │
│    - Performance monitoring start                               │
│    - Input polling                                              │
│    - Starfield animation                                        │
├─────────────────────────────────────────────────────────────────┤
│ 2. GAMEPLAY (when not paused)                                   │
│    - Game time accumulation                                     │
│    - Score updates                                              │
│    - Wave management                                            │
│    - Game over checks                                           │
├─────────────────────────────────────────────────────────────────┤
│ 3. PHYSICS (when not paused)                                    │
│    - ECS system execution                                       │
│    - Collision detection                                        │
│    - Movement updates                                           │
│    - Combat resolution                                          │
├─────────────────────────────────────────────────────────────────┤
│ 4. RENDER (always)                                              │
│    - Sprite rendering                                           │
│    - Beam effects                                               │
│    - Particle systems                                           │
│    - Health bars                                                │
│    - Shields                                                    │
├─────────────────────────────────────────────────────────────────┤
│ 5. POST-RENDER (always)                                         │
│    - Screen shake                                               │
│    - Camera effects                                             │
├─────────────────────────────────────────────────────────────────┤
│ 6. UI (always)                                                  │
│    - HUD updates                                                │
│    - Debug overlay                                              │
│    - Performance stats                                          │
├─────────────────────────────────────────────────────────────────┤
│                        FRAME END                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

- [ ] GameLoopManager compiles without errors
- [ ] Callbacks execute in correct phase order
- [ ] Pausing stops gameplay/physics but not rendering
- [ ] Game time only accumulates when not paused
- [ ] Performance monitoring integrates correctly
- [ ] Callback removal works correctly

---

## AI Agent Instructions

When implementing this task:

1. Create `src/core/loop/` directory
2. Create `GameLoopManager.ts` with the code above
3. Create `index.ts` barrel export
4. Update `src/core/index.ts` to export loop
5. Run `npm run typecheck` to verify no type errors
6. Do NOT modify Game.ts yet - that comes in Task 08

---

## Next Task

After this task is complete, proceed to:
- **Task 04: Render Manager** - Consolidates all rendering logic
