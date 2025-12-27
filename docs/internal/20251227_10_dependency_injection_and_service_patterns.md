# Dependency Injection and Service Patterns for AI Agents

**Date:** 2025-12-27  
**Category:** Dependency Injection  
**Priority:** MEDIUM  
**Effort:** Low  

---

## Executive Summary

The ServiceContainer pattern provides excellent dependency injection for this codebase. This document outlines best practices for AI coding agents to work with services and dependencies.

---

## Current State Assessment

### ✅ Excellent DI System

1. **ServiceContainer** - Typed dependency injection
2. **Lazy Initialization** - Services created on first access
3. **ServiceRegistry** - Type-safe service mapping
4. **Singleton Pattern** - Global container via `getServices()`

### ⚠️ Enhancement Opportunities

1. **Interface Extraction** - Services lack explicit interfaces
2. **Mock Generation** - Manual mock creation
3. **Circular Dependencies** - No explicit prevention
4. **Service Scopes** - Only singleton scope

---

## Recommendations for AI Coding Agents

### 1. Service Registration Pattern

**Recommendation:** Follow consistent service registration.

**Pattern in bootstrap/GameBootstrap.ts:**
```typescript
import { getServices } from '../services';

export function registerAllServices(app: Application, world: GameWorld): void {
    const services = getServices();
    
    // 1. Register core services first (no dependencies)
    services.register('app', () => app);
    services.register('world', () => world);
    services.register('eventBus', () => EventBus.getInstance());
    
    // 2. Register infrastructure services
    services.register('spatialHash', () => new SpatialHash(GAME_CONFIG.COLLISION_CELL_SIZE));
    services.register('audioManager', () => AudioManager.getInstance());
    
    // 3. Register game logic services (may depend on infrastructure)
    services.register('gameState', () => new GameState());
    services.register('resourceManager', () => new ResourceManager(GAME_CONFIG.INITIAL_RESOURCES));
    services.register('waveManager', () => {
        const wm = new WaveManager(
            services.get('world'),
            services.get('gameState')
        );
        return wm;
    });
    
    // 4. Register UI services last (depend on game logic)
    services.register('hudManager', () => new HUDManager(services.get('app')));
}
```

**Why Agent-Friendly:**
- Clear dependency order
- Comments explain groupings
- Easy to find registration location

**Action Items:**
- [ ] Group registrations by layer
- [ ] Add comments for each group
- [ ] Document dependencies

---

### 2. Service Interface Extraction

**Recommendation:** Define interfaces for all services.

**Pattern:**
```typescript
// src/types/interfaces/IWaveManager.ts
export interface IWaveManager {
    startWave(waveNumber: number): void;
    getCurrentWave(): number;
    getEnemiesRemaining(): number;
    isWaveComplete(): boolean;
    update(delta: number): void;
}

// src/game/waveManager.ts
import { IWaveManager } from '../types/interfaces';

export class WaveManager implements IWaveManager {
    // Implementation
}

// src/core/services/ServiceContainer.ts
export interface ServiceRegistry {
    waveManager: IWaveManager;  // Use interface, not class
    // ... other services
}
```

**Why Agent-Friendly:**
- Contracts are explicit
- Mock generation is trivial
- Substitution is type-safe

**Action Items:**
- [ ] Create interfaces for all services
- [ ] Update ServiceRegistry to use interfaces
- [ ] Update implementations

---

### 3. Service Access Patterns

**Recommendation:** Use consistent service access.

**GOOD:**
```typescript
// Import container getter
import { getServices } from '../core/services';

// In class constructor
class GameplayManager {
    private readonly waveManager: IWaveManager;
    private readonly scoreManager: IScoreManager;
    
    constructor(world: GameWorld) {
        const services = getServices();
        this.waveManager = services.get('waveManager');
        this.scoreManager = services.get('scoreManager');
    }
}

// Or use services dynamically
class UIController {
    update(): void {
        const gameState = getServices().get('gameState');
        if (gameState.isPaused()) {
            // Handle pause
        }
    }
}
```

**BAD:**
```typescript
// Direct singleton access - bypasses DI
import { GameState } from '../game/gameState';
const gameState = GameState.getInstance();  // BAD

// Creating service directly - bypasses container
const waveManager = new WaveManager(world, gameState);  // BAD
```

**Why Agent-Friendly:**
- All dependencies visible in constructor
- Services are mockable in tests
- No hidden singletons

**Action Items:**
- [ ] Audit for direct singleton usage
- [ ] Migrate to service container access
- [ ] Document access pattern

---

### 4. Testing with Service Overrides

**Recommendation:** Use service overrides for testing.

**Pattern:**
```typescript
import { describe, it, beforeEach, afterEach } from 'vitest';
import { getServices, resetServices } from '../core/services';
import { WaveManager } from '../game/waveManager';

describe('GameplayManager', () => {
    beforeEach(() => {
        // Reset services for clean state
        resetServices();
        
        // Create mock services
        const mockWaveManager = {
            startWave: vi.fn(),
            getCurrentWave: vi.fn().mockReturnValue(1),
            isWaveComplete: vi.fn().mockReturnValue(false),
        };
        
        const mockGameState = {
            isPlaying: vi.fn().mockReturnValue(true),
            isPaused: vi.fn().mockReturnValue(false),
        };
        
        // Override services with mocks
        const services = getServices();
        services.override('waveManager', mockWaveManager as unknown as WaveManager);
        services.override('gameState', mockGameState as unknown as GameState);
    });
    
    afterEach(() => {
        resetServices();
    });
    
    it('should start wave when conditions are met', () => {
        const manager = new GameplayManager(world);
        const services = getServices();
        
        manager.update(0.016);
        
        expect(services.get('waveManager').startWave).toHaveBeenCalled();
    });
});
```

**Why Agent-Friendly:**
- Mocks replace real services
- Tests are isolated
- Service behavior controllable

**Action Items:**
- [ ] Create mock factory functions
- [ ] Document test setup pattern
- [ ] Add test utilities

---

### 5. Circular Dependency Prevention

**Recommendation:** Structure services to avoid circular dependencies.

**Pattern:**
```typescript
// BAD: Circular dependency
// ServiceA depends on ServiceB, ServiceB depends on ServiceA
class ServiceA {
    constructor(serviceB: ServiceB) { }
}
class ServiceB {
    constructor(serviceA: ServiceA) { }  // CIRCULAR!
}

// GOOD: Use events to break cycles
class ServiceA {
    private eventBus = EventBus.getInstance();
    
    doSomething(): void {
        // Instead of calling serviceB directly
        this.eventBus.emit(GameEventType.SOMETHING_HAPPENED, { data });
    }
}

class ServiceB {
    constructor() {
        EventBus.getInstance().on(GameEventType.SOMETHING_HAPPENED, 
            (payload) => this.handleSomething(payload)
        );
    }
}

// GOOD: Use factory pattern with late binding
class ServiceA {
    private getServiceB: () => ServiceB;
    
    constructor(getServiceB: () => ServiceB) {
        this.getServiceB = getServiceB;
    }
    
    doSomething(): void {
        const serviceB = this.getServiceB();  // Resolved at call time
        serviceB.handle();
    }
}
```

**Why Agent-Friendly:**
- Circular dependencies are explicit
- Events provide decoupling
- Late binding breaks cycles

**Action Items:**
- [ ] Document dependency graph
- [ ] Use events for cross-layer communication
- [ ] Add cycle detection

---

### 6. Service Lifecycle Management

**Recommendation:** Implement proper lifecycle methods.

**Pattern:**
```typescript
interface IService {
    init?(): void | Promise<void>;
    destroy?(): void;
}

class ServiceContainer {
    async initAll(): Promise<void> {
        for (const name of this.initOrder) {
            const service = this.services.get(name)?.instance;
            if (service && typeof service.init === 'function') {
                await service.init();
            }
        }
    }
    
    destroy(): void {
        // Destroy in reverse order
        for (let i = this.initOrder.length - 1; i >= 0; i--) {
            const name = this.initOrder[i];
            const service = this.services.get(name)?.instance;
            if (service && typeof service.destroy === 'function') {
                try {
                    service.destroy();
                } catch (error) {
                    console.error(`Error destroying ${name}:`, error);
                }
            }
        }
    }
}

// Example service with lifecycle
class AudioManager implements IService {
    private audioContext: AudioContext | null = null;
    
    async init(): Promise<void> {
        this.audioContext = new AudioContext();
        await this.loadSounds();
    }
    
    destroy(): void {
        this.audioContext?.close();
        this.audioContext = null;
    }
}
```

**Why Agent-Friendly:**
- Initialization order is explicit
- Cleanup prevents memory leaks
- Async init is supported

**Action Items:**
- [ ] Add init() to services that need it
- [ ] Add destroy() to all services
- [ ] Call lifecycle methods in container

---

### 7. Service Factory Pattern

**Recommendation:** Use factories for complex service creation.

**Pattern:**
```typescript
// src/core/services/serviceFactories.ts

/**
 * Create WaveManager with all dependencies.
 */
export function createWaveManager(): WaveManager {
    const services = getServices();
    return new WaveManager(
        services.get('world'),
        services.get('gameState'),
        {
            eventBus: services.get('eventBus'),
            spawnerFactory: () => new EnemySpawner(services.get('world')),
        }
    );
}

/**
 * Create all game services.
 */
export function createGameServices(app: Application, world: GameWorld): void {
    const services = getServices();
    
    // Use factories for complex services
    services.register('waveManager', createWaveManager);
    services.register('combatManager', createCombatManager);
    
    // Simple services can use inline factories
    services.register('resourceManager', 
        () => new ResourceManager(GAME_CONFIG.INITIAL_RESOURCES)
    );
}
```

**Why Agent-Friendly:**
- Complex setup in dedicated functions
- Factory functions are testable
- Dependencies are explicit

**Action Items:**
- [ ] Create factories for complex services
- [ ] Organize in serviceFactories.ts
- [ ] Document factory usage

---

### 8. Optional Dependencies

**Recommendation:** Handle optional dependencies gracefully.

**Pattern:**
```typescript
// ServiceContainer with tryGet
class ServiceContainer {
    /**
     * Get a service if registered and initialized.
     * Returns undefined if not available.
     */
    tryGet<K extends keyof ServiceRegistry>(name: K): ServiceRegistry[K] | undefined {
        const entry = this.services.get(name);
        if (entry?.initialized) {
            return entry.instance as ServiceRegistry[K];
        }
        return undefined;
    }
}

// Usage for optional features
function playSound(type: SoundType): void {
    const audioManager = getServices().tryGet('audioManager');
    
    // Audio is optional - game works without it
    if (audioManager) {
        audioManager.play(type);
    }
}

// Usage in systems
function createCombatSystem(particleSystem?: ParticleSystem) {
    return function combatSystem(world: World): World {
        // Particle system is optional
        if (particleSystem) {
            particleSystem.spawn(EFFECTS.MUZZLE_FLASH);
        }
        // Combat still works without particles
        return world;
    };
}
```

**Why Agent-Friendly:**
- Optional features are explicit
- Code works without optional services
- No null pointer exceptions

**Action Items:**
- [ ] Use tryGet for optional services
- [ ] Document which services are optional
- [ ] Gracefully handle missing services

---

## Service Registration Order

```typescript
// Recommended registration order

// Layer 1: Core (no dependencies)
- app
- world
- eventBus

// Layer 2: Infrastructure (depends on core only)
- spatialHash
- audioManager
- systemManager
- poolManager

// Layer 3: Game Logic (depends on infrastructure)
- gameState
- resourceManager
- scoreManager
- waveManager
- upgradeManager
- placementManager

// Layer 4: UI (depends on game logic)
- hudManager
- gameOverScreen
- pauseOverlay
- turretMenu

// Layer 5: Rendering (depends on core + game)
- spriteManager
- particleSystem
- beamRenderer
- healthBarRenderer
```

---

## Implementation Checklist

### Phase 1: Interface Extraction (3-4 hours)
- [ ] Create interface for each service
- [ ] Update ServiceRegistry
- [ ] Update implementations

### Phase 2: Factory Organization (2 hours)
- [ ] Create serviceFactories.ts
- [ ] Move complex creation logic
- [ ] Document factories

### Phase 3: Lifecycle (2 hours)
- [ ] Add init/destroy to services
- [ ] Update container lifecycle
- [ ] Test cleanup

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Services with interfaces | ~20% | 100% |
| Services with destroy() | ~50% | 100% |
| Factory coverage | ~30% | Complex services |
| Test mock utilities | Limited | Complete |

---

## References

- `src/core/services/ServiceContainer.ts` - DI container
- `src/core/bootstrap/GameBootstrap.ts` - Service registration
- `src/core/services/index.ts` - Service exports

---

*This document is part of the Kobayashi Maru maintainability initiative.*
