# Architecture Documentation

This document describes the architecture of Kobayashi Maru, outlining design patterns, layer structure, and conventions for maintaining a clean, agent-friendly codebase.

## Layer Architecture

The codebase is organized into distinct layers with clear dependencies:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                   (src/ui/, src/rendering/)                  │
│  HUDManager, GameOverScreen, SpriteManager, ParticleSystem  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│               (src/core/managers/, src/game/)                │
│  GameplayManager, RenderManager, UIController, InputRouter  │
│  WaveManager, ScoreManager, ResourceManager, UpgradeManager │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│                  (src/ecs/, src/systems/)                    │
│  Components, EntityFactory, SystemManager, ECS Systems       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│          (src/services/, src/audio/, src/collision/)         │
│  DamageService, StorageService, AudioManager, SpatialHash   │
└─────────────────────────────────────────────────────────────┘
```

### Layer Rules

1. **Upper layers may import from lower layers** - Presentation can import from Application, Domain, and Infrastructure.
2. **Lower layers NEVER import from upper layers** - Domain layer should not import from Presentation.
3. **Same-layer imports require explicit interfaces** - Use interfaces for cross-module communication within the same layer.

## Design Patterns

### 1. Entity-Component-System (ECS)

The game uses bitECS for entity management:

- **Components**: Data containers defined in `src/ecs/components.ts`
- **Systems**: Logic processors in `src/systems/`
- **Entities**: Integer IDs linking components together

```typescript
// Components are typed arrays for performance
const Position = defineComponent({ x: Types.f32, y: Types.f32 });

// Systems query and process entities
const query = defineQuery([Position, Velocity]);
function movementSystem(world: World, delta: number): World {
  for (const eid of query(world)) {
    Position.x[eid] += Velocity.x[eid] * delta;
    Position.y[eid] += Velocity.y[eid] * delta;
  }
  return world;
}
```

### 2. Manager Pattern

Core game logic is delegated to specialized managers:

```
Game.ts (thin facade)
├── GameplayManager - Game logic, waves, scoring, game flow
├── RenderManager - Rendering coordination
├── UIController - UI state and interactions
└── InputRouter - Input handling and action dispatch
```

Each manager has a single responsibility and exposes a clear API.

### 3. Service Container (Dependency Injection)

Services are registered and accessed via `ServiceContainer`:

```typescript
// Registration with lazy initialization
services.register('waveManager', () => new WaveManager());

// Access (creates on first use)
const waveManager = services.get('waveManager');

// Optional access for non-critical services
const optional = services.tryGet('debugManager');
```

### 4. Event Bus (Pub/Sub)

Decoupled communication via `EventBus`:

```typescript
// Subscribe to events
eventBus.on(GameEventType.ENEMY_KILLED, (payload) => {
  scoreManager.addKill(payload.factionId);
});

// Emit events
eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 5 });
```

### 5. Factory Pattern

Entity creation is standardized through factories:

```typescript
// Template-based creation
const enemy = createEnemy(world, FactionId.KLINGON, x, y);

// Batch creation for wave spawning
const enemies = createEnemies(world, faction, positions);
```

## Interface-First Design

All services should have corresponding interfaces in `src/types/interfaces/`:

```typescript
// Interface defines the contract
export interface IWaveManager {
  startWave(waveNumber: number): void;
  getCurrentWave(): number;
  getActiveEnemyCount(): number;
  isWaveComplete(): boolean;
}

// Implementation fulfills the contract
export class WaveManager implements IWaveManager {
  // ...
}
```

Benefits:
- Agents can understand contracts without reading implementation
- Mock generation is trivial for testing
- Type system enforces correct usage

## System Execution

Systems are executed in priority order via `SystemManager`:

| Priority | System | Purpose |
|----------|--------|---------|
| 10 | collision | Spatial hash updates |
| 20 | ai | AI behavior decisions |
| 25 | ability | Special abilities |
| 30 | movement | Position updates |
| 31 | turret-rotation | Turret aiming |
| 32 | enemy-rotation | Enemy facing |
| 35 | status-effects | Buff/debuff processing |
| 38 | enemy-collision | Enemy-to-target collision |
| 40 | targeting | Target acquisition |
| 50 | combat | Turret firing |
| 55 | enemy-combat | Enemy firing |
| 60 | projectile | Projectile movement |
| 62 | enemy-projectile | Enemy projectile movement |
| 70 | damage | Health/shield processing |

### System Context

Systems receive a consistent context for execution:

```typescript
interface SystemContext {
  delta: number;      // Frame delta time
  gameTime: number;   // Total game time
  services: ServiceContainer;
}
```

## Configuration Management

All configuration values are centralized in `src/config/`:

- `combat.config.ts` - Beam settings, DPS calculations
- `wave.config.ts` - Spawn timing, wave delays
- `ui.config.ts` - UI dimensions, colors
- `rendering.config.ts` - Visual settings
- `performance.config.ts` - Performance thresholds

## File Organization Guidelines

### Size Limits
- **Soft limit**: 300-400 lines of code per file
- **Hard limit**: 500 lines of code

### Single Responsibility Principle
Each file should have exactly ONE reason to change:
- ✅ `WaveManager.ts` - Wave spawning logic only
- ✅ `ScoreManager.ts` - Score tracking only
- ❌ `GameManager.ts` with mixed rendering, input, and logic

### Naming Conventions
- **Managers**: `*Manager.ts` - Coordinate complex operations
- **Services**: `*Service.ts` - Provide utility functions
- **Systems**: `*System.ts` - ECS processing logic
- **Interfaces**: `I*.ts` - Interface definitions

## Testing Conventions

Tests live in `src/__tests__/` with `.test.ts` suffix:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld } from 'bitecs';

describe('WaveManager', () => {
  let world: ReturnType<typeof createWorld>;
  let waveManager: WaveManager;

  beforeEach(() => {
    world = createWorld();
    waveManager = new WaveManager();
  });

  it('should track wave progression', () => {
    waveManager.startWave(1);
    expect(waveManager.getCurrentWave()).toBe(1);
  });
});
```

## References

- `src/core/services/ServiceContainer.ts` - DI implementation
- `src/systems/SystemManager.ts` - System orchestration
- `src/ecs/genericFactory.ts` - Entity creation patterns
- `AGENTS.md` - Quick reference for AI agents
