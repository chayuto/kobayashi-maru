# Refactoring Task: Dependency Injection

**Date:** 2025-12-07  
**Priority:** LOW  
**Estimated Effort:** 2-3 days  
**AI Friendliness Impact:** MEDIUM

---

## Problem Statement

Direct class instantiation throughout the codebase makes it difficult to:
- Mock dependencies for testing
- Swap implementations for different environments
- Understand what a class depends on
- Make changes without ripple effects

### Current Patterns

```typescript
// Direct instantiation in Game.ts
export class Game {
  constructor(containerId: string) {
    this.spriteManager = new SpriteManager(this.app);  // Hard dependency
    this.debugManager = new DebugManager();            // Hard dependency
    this.starfield = new Starfield(this.app);          // Hard dependency
    this.waveManager = new WaveManager(/* ... */);     // Hard dependency
    // ... 10+ more directly instantiated dependencies
  }
}

// Singletons everywhere
class AudioManager {
  private static instance: AudioManager;
  static getInstance(): AudioManager { /* ... */ }
}
```

**AI Pain Points:**
- Can't easily see all dependencies at a glance
- Hard to test classes in isolation
- Unclear which dependencies are required vs optional

---

## Recommended Actions

### 1. Define Dependency Interfaces

```typescript
// src/core/interfaces.ts

import type { Application, Container } from 'pixi.js';
import type { GameWorld } from '../ecs/world';
import type { BeamVisual, CombatStats } from '../types';

/**
 * Interface for sprite management.
 */
export interface ISpriteManager {
  init(): void;
  createSprite(eid: number, textureIndex: number): void;
  updateSprite(eid: number, x: number, y: number, rotation?: number): void;
  removeSprite(eid: number): void;
  destroy(): void;
}

/**
 * Interface for debug overlay.
 */
export interface IDebugManager {
  isVisible(): boolean;
  toggle(): void;
  update(fps: number, entityCount: number, memoryMB?: number): void;
  show(): void;
  hide(): void;
  destroy(): void;
}

/**
 * Interface for audio playback.
 */
export interface IAudioManager {
  init(): Promise<void>;
  play(soundType: number, options?: { volume?: number }): void;
  toggleMute(): boolean;
  isMuted(): boolean;
  setMasterVolume(volume: number): void;
  destroy(): void;
}

/**
 * Interface for combat system.
 */
export interface ICombatSystem {
  update(world: GameWorld, ctx: SystemContext): GameWorld;
  getActiveBeams(): readonly BeamVisual[];
  getStats(): Readonly<CombatStats>;
  resetStats(): void;
}

/**
 * Interface for wave management.
 */
export interface IWaveManager {
  startNextWave(): void;
  update(world: GameWorld, deltaTime: number): void;
  getCurrentWave(): number;
  getActiveEnemies(): number;
  onEnemyKilled(): void;
  reset(): void;
}

// Export all interfaces
export type {
  ISpriteManager,
  IDebugManager,
  IAudioManager,
  ICombatSystem,
  IWaveManager,
};
```

### 2. Create Dependency Container

```typescript
// src/core/Container.ts

import type { Application } from 'pixi.js';
import type {
  ISpriteManager,
  IDebugManager,
  IAudioManager,
  IWaveManager,
} from './interfaces';

/**
 * Factory function type for creating dependencies.
 */
type Factory<T> = (container: GameContainer) => T;

/**
 * Dependency injection container for game services.
 */
export class GameContainer {
  private singletons = new Map<string, unknown>();
  private factories = new Map<string, Factory<unknown>>();
  
  constructor(private app: Application) {}
  
  /**
   * Register a singleton factory.
   */
  registerSingleton<T>(key: string, factory: Factory<T>): this {
    this.factories.set(key, factory as Factory<unknown>);
    return this;
  }
  
  /**
   * Register a pre-created instance.
   */
  registerInstance<T>(key: string, instance: T): this {
    this.singletons.set(key, instance);
    return this;
  }
  
  /**
   * Resolve a dependency by key.
   */
  resolve<T>(key: string): T {
    // Check if already created
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }
    
    // Check if factory exists
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`Dependency not registered: ${key}`);
    }
    
    // Create instance and cache
    const instance = factory(this);
    this.singletons.set(key, instance);
    return instance as T;
  }
  
  /**
   * Get the PixiJS application.
   */
  getApp(): Application {
    return this.app;
  }
  
  /**
   * Clean up all singletons.
   */
  destroy(): void {
    for (const instance of this.singletons.values()) {
      if (instance && typeof (instance as { destroy?: () => void }).destroy === 'function') {
        (instance as { destroy: () => void }).destroy();
      }
    }
    this.singletons.clear();
  }
}

/**
 * Dependency keys for type-safe resolution.
 */
export const DEPS = {
  SPRITE_MANAGER: 'spriteManager',
  DEBUG_MANAGER: 'debugManager',
  AUDIO_MANAGER: 'audioManager',
  WAVE_MANAGER: 'waveManager',
  SCORE_MANAGER: 'scoreManager',
  RESOURCE_MANAGER: 'resourceManager',
  PARTICLE_SYSTEM: 'particleSystem',
  COMBAT_SYSTEM: 'combatSystem',
  HUD_MANAGER: 'hudManager',
} as const;

export type DependencyKey = typeof DEPS[keyof typeof DEPS];
```

### 3. Create Container Setup Module

```typescript
// src/core/containerSetup.ts

import { Application } from 'pixi.js';
import { GameContainer, DEPS } from './Container';

// Import implementations
import { SpriteManager } from '../rendering/spriteManager';
import { DebugManager } from './DebugManager';
import { AudioManager } from '../audio/AudioManager';
import { WaveManager } from '../game/waveManager';
import { ScoreManager } from '../game/scoreManager';
import { ResourceManager } from '../game/resourceManager';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { createCombatSystem } from '../systems/combatSystem';
import { HUDManager } from '../ui/HUDManager';

/**
 * Sets up the dependency container with all game services.
 * 
 * @param app - PixiJS Application instance
 * @returns Configured GameContainer
 */
export function setupContainer(app: Application): GameContainer {
  const container = new GameContainer(app);
  
  // Register core services
  container
    .registerSingleton(DEPS.SPRITE_MANAGER, (c) => 
      new SpriteManager(c.getApp())
    )
    .registerSingleton(DEPS.DEBUG_MANAGER, () => 
      new DebugManager()
    )
    .registerSingleton(DEPS.AUDIO_MANAGER, () => 
      AudioManager.getInstance()
    )
    .registerSingleton(DEPS.PARTICLE_SYSTEM, (c) => 
      new ParticleSystem(c.getApp())
    )
    .registerSingleton(DEPS.COMBAT_SYSTEM, (c) => 
      createCombatSystem(c.resolve(DEPS.PARTICLE_SYSTEM))
    )
    .registerSingleton(DEPS.SCORE_MANAGER, () => 
      new ScoreManager()
    )
    .registerSingleton(DEPS.RESOURCE_MANAGER, () => 
      new ResourceManager()
    )
    .registerSingleton(DEPS.HUD_MANAGER, () => 
      new HUDManager()
    );
  
  // Wave manager depends on multiple services
  container.registerSingleton(DEPS.WAVE_MANAGER, (c) => 
    new WaveManager(
      c.resolve(DEPS.AUDIO_MANAGER),
      c.resolve(DEPS.PARTICLE_SYSTEM)
    )
  );
  
  return container;
}

/**
 * Creates a test container with mock dependencies.
 */
export function setupTestContainer(
  mocks: Partial<Record<DependencyKey, unknown>> = {}
): GameContainer {
  const mockApp = {} as Application; // Minimal mock
  const container = new GameContainer(mockApp);
  
  // Register mocks
  for (const [key, mock] of Object.entries(mocks)) {
    container.registerInstance(key, mock);
  }
  
  return container;
}
```

### 4. Update Game Class to Use Container

```typescript
// src/core/Game.ts

import { Application } from 'pixi.js';
import { GameContainer, DEPS } from './Container';
import { setupContainer } from './containerSetup';
import type { 
  ISpriteManager, 
  IDebugManager, 
  IWaveManager 
} from './interfaces';

export class Game {
  private container: GameContainer;
  
  // Dependencies resolved from container
  private spriteManager: ISpriteManager;
  private debugManager: IDebugManager;
  private waveManager: IWaveManager;
  
  constructor(
    containerId: string,
    options?: {
      /** Provide custom container for testing */
      container?: GameContainer;
    }
  ) {
    // Use provided container or create default
    if (options?.container) {
      this.container = options.container;
    } else {
      // Container setup happens after app init (see below)
    }
  }
  
  async init(): Promise<void> {
    // Initialize PixiJS
    await this.app.init({ /* ... */ });
    
    // Setup dependency container if not provided
    if (!this.container) {
      this.container = setupContainer(this.app);
    }
    
    // Resolve dependencies
    this.spriteManager = this.container.resolve<ISpriteManager>(DEPS.SPRITE_MANAGER);
    this.debugManager = this.container.resolve<IDebugManager>(DEPS.DEBUG_MANAGER);
    this.waveManager = this.container.resolve<IWaveManager>(DEPS.WAVE_MANAGER);
    
    // Initialize resolved dependencies
    this.spriteManager.init();
    // ...
  }
  
  destroy(): void {
    this.container.destroy();
  }
}
```

### 5. Benefits for Testing

```typescript
// src/__tests__/unit/core/game.test.ts

import { describe, it, expect, vi } from 'vitest';
import { Game } from '../../../core/Game';
import { setupTestContainer } from '../../../core/containerSetup';
import { DEPS } from '../../../core/Container';

describe('Game', () => {
  it('should use injected dependencies', async () => {
    // Create mock dependencies
    const mockSpriteManager = {
      init: vi.fn(),
      createSprite: vi.fn(),
      updateSprite: vi.fn(),
      removeSprite: vi.fn(),
      destroy: vi.fn(),
    };
    
    const mockAudioManager = {
      init: vi.fn().mockResolvedValue(undefined),
      play: vi.fn(),
      toggleMute: vi.fn(),
      isMuted: vi.fn().mockReturnValue(false),
      destroy: vi.fn(),
    };
    
    // Setup container with mocks
    const container = setupTestContainer({
      [DEPS.SPRITE_MANAGER]: mockSpriteManager,
      [DEPS.AUDIO_MANAGER]: mockAudioManager,
    });
    
    // Create game with mock container
    const game = new Game('test', { container });
    await game.init();
    
    // Verify mocks were used
    expect(mockSpriteManager.init).toHaveBeenCalled();
  });
});
```

---

## Migration Strategy

1. **Phase 1:** Create interfaces for major services
2. **Phase 2:** Create container and registration
3. **Phase 3:** Update Game class to use container
4. **Phase 4:** Gradually migrate other classes
5. **Phase 5:** Update tests to use container

---

## Verification

- [ ] All dependencies registered in container
- [ ] Game initializes correctly with container
- [ ] Tests can inject mock dependencies
- [ ] No regressions in game behavior
- [ ] Circular dependency check passes

---

## Dependencies

- Interface definitions should align with system interface standardization
- Error handling patterns apply to container operations
