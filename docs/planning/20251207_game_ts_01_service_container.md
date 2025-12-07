# Task 01: Service Container Implementation

**Date:** 2025-12-07  
**Priority:** P0 (Foundation)  
**Estimated Effort:** 2 hours  
**Dependencies:** None

---

## Problem Statement

Game.ts has 50+ class properties, most of which are nullable managers/systems:

```typescript
// Current: Nullable properties everywhere
private spriteManager: SpriteManager;
private beamRenderer: BeamRenderer | null = null;
private particleSystem: ParticleSystem | null = null;
private healthBarRenderer: HealthBarRenderer | null = null;
// ... 40+ more
```

This causes:
1. Null checks scattered throughout code
2. Unclear initialization order
3. Difficult for AI to understand what's available when
4. No clear dependency graph

---

## Solution: Service Container Pattern

Create a typed service container that:
- Provides lazy initialization
- Guarantees services are available when accessed
- Makes dependencies explicit
- Enables easy mocking for tests

---

## Implementation

### File: `src/core/services/ServiceContainer.ts`

```typescript
/**
 * Service Container for Kobayashi Maru
 * 
 * Provides typed dependency injection with lazy initialization.
 * Services are created on first access and cached.
 * 
 * @example
 * ```typescript
 * const services = new ServiceContainer();
 * services.register('spriteManager', () => new SpriteManager(app));
 * 
 * // Later - guaranteed non-null
 * const sprites = services.get('spriteManager');
 * ```
 */

import { Application } from 'pixi.js';

// Forward declarations to avoid circular imports
import type { SpriteManager } from '../../rendering/spriteManager';
import type { BeamRenderer } from '../../rendering/BeamRenderer';
import type { ParticleSystem } from '../../rendering/ParticleSystem';
import type { HealthBarRenderer } from '../../rendering/HealthBarRenderer';
import type { ShieldRenderer } from '../../rendering/ShieldRenderer';
import type { ShockwaveRenderer } from '../../rendering/ShockwaveRenderer';
import type { ExplosionManager } from '../../rendering/ExplosionManager';
import type { GlowManager } from '../../rendering/filters/GlowManager';
import type { TurretUpgradeVisuals } from '../../rendering/TurretUpgradeVisuals';
import type { PlacementRenderer } from '../../rendering/PlacementRenderer';
import type { Starfield } from '../../rendering/Starfield';
import type { ScreenShake } from '../../rendering/ScreenShake';

import type { WaveManager } from '../../game/waveManager';
import type { GameState } from '../../game/gameState';
import type { ScoreManager } from '../../game/scoreManager';
import type { HighScoreManager } from '../../game/highScoreManager';
import type { ResourceManager } from '../../game/resourceManager';
import type { PlacementManager } from '../../game/PlacementManager';
import type { UpgradeManager } from '../../game/UpgradeManager';

import type { HUDManager } from '../../ui/HUDManager';
import type { GameOverScreen } from '../../ui/GameOverScreen';
import type { PauseOverlay } from '../../ui/PauseOverlay';

import type { AudioManager } from '../../audio/AudioManager';
import type { SpatialHash } from '../../collision/SpatialHash';
import type { SystemManager } from '../../systems/SystemManager';

import type { InputManager } from '../InputManager';
import type { TouchInputManager } from '../TouchInputManager';
import type { PerformanceMonitor } from '../PerformanceMonitor';
import type { QualityManager } from '../QualityManager';
import type { HapticManager } from '../HapticManager';
import type { DebugManager } from '../DebugManager';
import type { EventBus } from '../EventBus';
import type { GameWorld } from '../../ecs/world';

/**
 * Service registry type map.
 * Maps service names to their types for type-safe access.
 */
export interface ServiceRegistry {
  // Core
  app: Application;
  world: GameWorld;
  eventBus: EventBus;
  
  // Rendering
  spriteManager: SpriteManager;
  beamRenderer: BeamRenderer;
  particleSystem: ParticleSystem;
  healthBarRenderer: HealthBarRenderer;
  shieldRenderer: ShieldRenderer;
  shockwaveRenderer: ShockwaveRenderer;
  explosionManager: ExplosionManager;
  glowManager: GlowManager;
  turretUpgradeVisuals: TurretUpgradeVisuals;
  placementRenderer: PlacementRenderer;
  starfield: Starfield;
  screenShake: ScreenShake;
  
  // Game Logic
  waveManager: WaveManager;
  gameState: GameState;
  scoreManager: ScoreManager;
  highScoreManager: HighScoreManager;
  resourceManager: ResourceManager;
  placementManager: PlacementManager;
  upgradeManager: UpgradeManager;
  
  // Systems
  systemManager: SystemManager;
  spatialHash: SpatialHash;
  
  // UI
  hudManager: HUDManager;
  gameOverScreen: GameOverScreen;
  pauseOverlay: PauseOverlay;
  
  // Input
  inputManager: InputManager;
  touchInputManager: TouchInputManager;
  
  // Performance
  performanceMonitor: PerformanceMonitor;
  qualityManager: QualityManager;
  hapticManager: HapticManager;
  debugManager: DebugManager;
  
  // Audio
  audioManager: AudioManager;
}

/**
 * Service factory function type
 */
type ServiceFactory<T> = () => T;

/**
 * Service entry with factory and cached instance
 */
interface ServiceEntry<T> {
  factory: ServiceFactory<T>;
  instance: T | null;
  initialized: boolean;
}

/**
 * Typed service container with lazy initialization.
 */
export class ServiceContainer {
  private services = new Map<keyof ServiceRegistry, ServiceEntry<unknown>>();
  private initOrder: (keyof ServiceRegistry)[] = [];
  
  /**
   * Register a service factory.
   * The factory is called lazily on first get().
   * 
   * @param name - Service name (must be in ServiceRegistry)
   * @param factory - Function that creates the service
   */
  register<K extends keyof ServiceRegistry>(
    name: K,
    factory: ServiceFactory<ServiceRegistry[K]>
  ): void {
    this.services.set(name, {
      factory: factory as ServiceFactory<unknown>,
      instance: null,
      initialized: false,
    });
  }
  
  /**
   * Get a service by name.
   * Creates the service on first access.
   * 
   * @param name - Service name
   * @returns The service instance (never null)
   * @throws Error if service not registered
   */
  get<K extends keyof ServiceRegistry>(name: K): ServiceRegistry[K] {
    const entry = this.services.get(name);
    
    if (!entry) {
      throw new Error(`Service "${name}" not registered`);
    }
    
    if (!entry.initialized) {
      entry.instance = entry.factory();
      entry.initialized = true;
      this.initOrder.push(name);
    }
    
    return entry.instance as ServiceRegistry[K];
  }
  
  /**
   * Check if a service is registered.
   */
  has(name: keyof ServiceRegistry): boolean {
    return this.services.has(name);
  }
  
  /**
   * Check if a service has been initialized.
   */
  isInitialized(name: keyof ServiceRegistry): boolean {
    return this.services.get(name)?.initialized ?? false;
  }
  
  /**
   * Get a service if it exists and is initialized, otherwise return undefined.
   * Useful for optional services.
   */
  tryGet<K extends keyof ServiceRegistry>(name: K): ServiceRegistry[K] | undefined {
    const entry = this.services.get(name);
    if (entry?.initialized) {
      return entry.instance as ServiceRegistry[K];
    }
    return undefined;
  }
  
  /**
   * Override a service (useful for testing).
   * 
   * @param name - Service name
   * @param instance - Instance to use
   */
  override<K extends keyof ServiceRegistry>(
    name: K,
    instance: ServiceRegistry[K]
  ): void {
    this.services.set(name, {
      factory: () => instance,
      instance,
      initialized: true,
    });
  }
  
  /**
   * Destroy all services in reverse initialization order.
   */
  destroy(): void {
    // Destroy in reverse order
    for (let i = this.initOrder.length - 1; i >= 0; i--) {
      const name = this.initOrder[i];
      const entry = this.services.get(name);
      
      if (entry?.instance && typeof (entry.instance as { destroy?: () => void }).destroy === 'function') {
        try {
          (entry.instance as { destroy: () => void }).destroy();
        } catch (error) {
          console.error(`Error destroying service "${name}":`, error);
        }
      }
      
      if (entry) {
        entry.instance = null;
        entry.initialized = false;
      }
    }
    
    this.initOrder = [];
  }
  
  /**
   * Get list of initialized services (for debugging).
   */
  getInitializedServices(): string[] {
    return [...this.initOrder];
  }
}

/**
 * Global service container instance.
 * Use this for production code.
 */
let globalContainer: ServiceContainer | null = null;

/**
 * Get the global service container.
 * Creates one if it doesn't exist.
 */
export function getServices(): ServiceContainer {
  if (!globalContainer) {
    globalContainer = new ServiceContainer();
  }
  return globalContainer;
}

/**
 * Reset the global service container.
 * Useful for testing or game restart.
 */
export function resetServices(): void {
  if (globalContainer) {
    globalContainer.destroy();
    globalContainer = null;
  }
}
```

---

### File: `src/core/services/index.ts`

```typescript
export { ServiceContainer, getServices, resetServices } from './ServiceContainer';
export type { ServiceRegistry } from './ServiceContainer';
```

---

## Usage Example

### Before (in Game.ts):

```typescript
// Scattered null checks
if (this.particleSystem) {
  this.particleSystem.update(deltaTime);
}

if (this.shockwaveRenderer) {
  this.shockwaveRenderer.render(deltaTime);
}

if (this.explosionManager) {
  this.explosionManager.update(deltaTime);
}
```

### After:

```typescript
// Clean, guaranteed access
const services = getServices();
services.get('particleSystem').update(deltaTime);
services.get('shockwaveRenderer').render(deltaTime);
services.get('explosionManager').update(deltaTime);
```

---

## Registration Example

```typescript
// In GameBootstrap.ts (Task 02)
import { getServices } from './services';

function registerServices(app: Application, world: GameWorld): void {
  const services = getServices();
  
  // Core services
  services.register('app', () => app);
  services.register('world', () => world);
  services.register('eventBus', () => EventBus.getInstance());
  
  // Rendering services (lazy - created when first accessed)
  services.register('spriteManager', () => {
    const mgr = new SpriteManager(services.get('app'));
    mgr.init();
    return mgr;
  });
  
  services.register('glowManager', () => {
    const mgr = new GlowManager();
    mgr.init();
    return mgr;
  });
  
  services.register('particleSystem', () => {
    const ps = new ParticleSystem();
    const settings = services.get('qualityManager').getSettings();
    const glowLayer = services.get('glowManager').getLayer(GlowLayer.EXPLOSIONS);
    ps.init(services.get('app'), settings.maxParticles, settings.particleSpawnRate, glowLayer);
    return ps;
  });
  
  // ... more registrations
}
```

---

## Verification Checklist

- [ ] ServiceContainer compiles without errors
- [ ] All service types are correctly mapped
- [ ] get() throws for unregistered services
- [ ] tryGet() returns undefined for uninitialized services
- [ ] destroy() calls destroy on all services in reverse order
- [ ] No circular dependency issues with type imports

---

## AI Agent Instructions

When implementing this task:

1. Create `src/core/services/` directory
2. Create `ServiceContainer.ts` with the code above
3. Create `index.ts` barrel export
4. Update `src/core/index.ts` to export services
5. Run `npm run typecheck` to verify no type errors
6. Do NOT modify Game.ts yet - that comes in later tasks

---

## Next Task

After this task is complete, proceed to:
- **Task 02: Bootstrap Extraction** - Uses ServiceContainer to register all services
