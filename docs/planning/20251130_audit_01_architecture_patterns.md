# Code Audit: Architecture & Design Patterns

**Date:** 2025-11-30  
**Scope:** Overall architecture, design patterns, and structural organization

## Executive Summary

The codebase demonstrates a solid foundation with ECS architecture using bitECS and PixiJS for rendering. However, there are opportunities to improve maintainability, scalability, and code organization.

**Overall Grade:** B+ (Good foundation with room for improvement)

---

## Strengths

### 1. ECS Architecture Choice ✅
- **bitECS** is an excellent choice for high-performance entity management
- Clear separation between data (components) and behavior (systems)
- Supports the goal of 5,000+ entities at 60 FPS

### 2. Module Organization ✅
- Logical folder structure (`core/`, `ecs/`, `systems/`, `rendering/`)
- Barrel exports (`index.ts`) for clean imports
- Clear separation of concerns

### 3. TypeScript Configuration ✅
- Strict mode enabled
- Good compiler options for type safety
- Proper module resolution

---

## Critical Issues

### 1. ❌ Tight Coupling in Game.ts

**Problem:**
```typescript
// Game.ts directly instantiates and manages all systems
this.spriteManager = new SpriteManager(this.app);
this.debugManager = new DebugManager();
this.starfield = new Starfield(this.app);
```

**Impact:**
- Hard to test in isolation
- Difficult to swap implementations
- Violates Dependency Inversion Principle

**Recommendation:**
```typescript
// Use dependency injection
interface IGameDependencies {
  spriteManager: ISpriteManager;
  debugManager: IDebugManager;
  starfield: IStarfield;
}

export class Game {
  constructor(
    containerId: string,
    dependencies?: Partial<IGameDependencies>
  ) {
    // Allow injection for testing
    this.spriteManager = dependencies?.spriteManager ?? new SpriteManager(this.app);
  }
}
```

### 2. ❌ Global State Management

**Problem:**
```typescript
// main.ts
let game: Game | null = null;

// world.ts
let entityCounter = 0;
```

**Impact:**
- Makes testing difficult
- Can cause issues with hot module replacement
- Not suitable for multiple game instances

**Recommendation:**
- Move state into class instances
- Use a proper state management pattern (e.g., singleton with getInstance())
- Consider a service locator pattern for shared services

### 3. ❌ Missing Abstraction Layers

**Problem:**
- Direct PixiJS API usage throughout codebase
- No rendering abstraction layer
- Difficult to switch rendering engines

**Recommendation:**
```typescript
// Create rendering abstraction
interface IRenderer {
  init(): Promise<void>;
  render(entities: RenderableEntity[]): void;
  destroy(): void;
}

class PixiRenderer implements IRenderer {
  // PixiJS-specific implementation
}

// Game uses interface, not concrete implementation
class Game {
  constructor(private renderer: IRenderer) {}
}
```

---

## Design Pattern Recommendations

### 1. Factory Pattern Enhancement

**Current:**
```typescript
// Multiple similar factory functions
export function createKlingonShip(world: GameWorld, x: number, y: number): number
export function createRomulanShip(world: GameWorld, x: number, y: number): number
```

**Recommended:**
```typescript
// Unified factory with configuration
interface ShipConfig {
  faction: FactionId;
  health: number;
  shield: number;
  position: { x: number; y: number };
}

class ShipFactory {
  private static configs: Map<FactionId, Omit<ShipConfig, 'position'>> = new Map([
    [FactionId.KLINGON, { faction: FactionId.KLINGON, health: 80, shield: 30 }],
    [FactionId.ROMULAN, { faction: FactionId.ROMULAN, health: 70, shield: 60 }],
  ]);

  static create(world: GameWorld, faction: FactionId, x: number, y: number): number {
    const config = this.configs.get(faction);
    if (!config) throw new Error(`Unknown faction: ${faction}`);
    
    return this.createShipFromConfig(world, { ...config, position: { x, y } });
  }
}
```

### 2. Observer Pattern for Events

**Problem:** No event system for game state changes

**Recommendation:**
```typescript
// Event system for decoupled communication
class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// Usage
eventBus.on('entity:destroyed', (eid) => {
  // Update score, spawn effects, etc.
});
```

### 3. Strategy Pattern for AI Behaviors

**Future-proofing for enemy AI:**
```typescript
interface MovementStrategy {
  update(eid: number, world: GameWorld, deltaTime: number): void;
}

class DirectMovement implements MovementStrategy {
  update(eid: number, world: GameWorld, deltaTime: number): void {
    // Current implementation
  }
}

class FlowFieldMovement implements MovementStrategy {
  update(eid: number, world: GameWorld, deltaTime: number): void {
    // Flow field pathfinding
  }
}
```

---

## Architecture Improvements

### 1. Service Layer Pattern

**Create a centralized service container:**
```typescript
class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, unknown> = new Map();

  static getInstance(): ServiceContainer {
    if (!this.instance) {
      this.instance = new ServiceContainer();
    }
    return this.instance;
  }

  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) throw new Error(`Service not found: ${key}`);
    return service as T;
  }
}
```

### 2. System Manager

**Centralize system lifecycle:**
```typescript
class SystemManager {
  private systems: Array<(world: GameWorld, deltaTime: number) => void> = [];

  register(system: (world: GameWorld, deltaTime: number) => void): void {
    this.systems.push(system);
  }

  update(world: GameWorld, deltaTime: number): void {
    for (const system of this.systems) {
      system(world, deltaTime);
    }
  }
}
```

---

## Priority Action Items

1. **HIGH:** Implement dependency injection in Game class
2. **HIGH:** Remove global state variables
3. **MEDIUM:** Create rendering abstraction layer
4. **MEDIUM:** Implement event bus for decoupled communication
5. **MEDIUM:** Refactor entity factory to use configuration-based approach
6. **LOW:** Add system manager for centralized system lifecycle

---

## Testing Implications

Current architecture makes testing difficult:
- Tight coupling requires full initialization
- Global state causes test interference
- No mocking points for external dependencies

**Recommended:**
- Add interfaces for all major components
- Use dependency injection throughout
- Create test doubles for PixiJS components
- Implement integration test helpers

---

## Scalability Considerations

**Current Limitations:**
- Single game instance only
- No plugin/extension system
- Hard-coded system execution order

**Future-Proofing:**
- Design for multiple game instances
- Create plugin architecture for mods
- Implement priority-based system execution
- Add hot-reload support for development
