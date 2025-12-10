# Agent Instructions for Kobayashi Maru

Instructions for AI coding agents working on this codebase.

## Quick Reference

```bash
npm ci              # Install dependencies
npm run lint        # Must pass before commit
npm run test        # Must pass before commit
npm run build       # Verify build works
npm run dev         # Development server
```

## Architecture Overview

### ECS Pattern

```
Components (data) → Systems (logic) → Entities (IDs linking components)
```

- **Components**: `src/ecs/components.ts` - Position, Velocity, Health, Turret, Target, etc.
- **Systems**: `src/systems/` - Process entities with specific components
- **Entities**: Created via `src/ecs/entityFactory.ts`

### Manager Pattern

```
Game.ts (facade)
    ├── GameplayManager (game logic, waves, scoring)
    ├── RenderManager (rendering coordination)
    ├── UIController (UI state)
    └── InputRouter (input dispatch)
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/ecs/` | ECS core: components, entities, world |
| `src/systems/` | 17 game systems (ai, combat, ability, etc.) |
| `src/game/` | Managers: Wave, Score, Upgrade, Achievement |
| `src/config/` | Centralized configuration files |
| `src/rendering/` | PixiJS rendering, textures, effects |
| `src/ui/` | HUD, panels, overlays |
| `src/types/config/` | Type definitions: turrets, enemies, factions |

## Common Tasks

### Add New Turret Type

1. **Add type constant** - `src/types/config/turrets.ts`
   ```typescript
   export const TurretType = {
     // existing...
     NEW_TURRET: 6
   } as const;
   ```

2. **Add config** - Same file
   ```typescript
   [TurretType.NEW_TURRET]: {
     range: 200, fireRate: 2, damage: 20, cost: 175,
     health: 60, shield: 30,
     name: 'New Turret', description: 'Description here'
   }
   ```

3. **Add sprite types** - `src/types/config/factions.ts`
   ```typescript
   TURRET_BASE_NEW: 112,
   TURRET_BARREL_NEW: 113,
   ```

4. **Create textures** - `src/rendering/textures.ts`

5. **Update sprite manager** - `src/rendering/spriteManager.ts`

### Add New Enemy Ability

1. **Add type** - `src/types/config/enemies.ts`
   ```typescript
   export const AbilityType = {
     // existing...
     NEW_ABILITY: 8
   } as const;
   ```

2. **Add config** - Same file
   ```typescript
   [AbilityType.NEW_ABILITY]: { cooldown: 10.0, duration: 3.0, range: 200 }
   ```

3. **Implement processor** - `src/systems/abilitySystem.ts`
   ```typescript
   function processNewAbility(world: IWorld, entity: number, ...): void {
     // Implementation
   }
   ```

4. **Add to system switch** - Same file in `createAbilitySystem`

### Add New UI Panel

1. **Create panel** - `src/ui/panels/NewPanel.ts`
   ```typescript
   export class NewPanel {
     public container: Container;
     constructor() { /* ... */ }
     update(data: SomeData): void { /* ... */ }
   }
   ```

2. **Add to HUDManager** - `src/ui/HUDManager.ts`

3. **Subscribe to events** - Use EventBus for reactive updates

### Add New System

1. **Create system** - `src/systems/newSystem.ts`
   ```typescript
   import { defineQuery, IWorld } from 'bitecs';
   import { Position, NewComponent } from '../ecs/components';

   const query = defineQuery([Position, NewComponent]);

   export function createNewSystem() {
     return function newSystem(world: IWorld, deltaTime: number): IWorld {
       const entities = query(world);
       for (const eid of entities) {
         // Process entity
       }
       return world;
     };
   }
   ```

2. **Register in Game.ts** - `registerSystems()` method
   ```typescript
   this.systemManager.register('newSystem', {
     update: createNewSystem()
   }, 150); // priority
   ```

## Configuration System

Import from centralized config:

```typescript
import { COMBAT_CONFIG, UI_CONFIG, WAVE_CONFIG } from '../config';

// Use values
const segmentCount = COMBAT_CONFIG.BEAM.SEGMENT_COUNT;
const delay = WAVE_CONFIG.TIMING.COMPLETE_DELAY_MS;
```

Available configs:
- `COMBAT_CONFIG` - Combat mechanics
- `WAVE_CONFIG` - Wave timing and spawning
- `UI_CONFIG` - UI dimensions and styling
- `RENDERING_CONFIG` - Visual settings
- `PERFORMANCE_CONFIG` - Performance thresholds

## Event System

Subscribe to events:

```typescript
import { EventBus } from '../core/EventBus';
import { GameEventType, EnemyKilledPayload } from '../types/events';

const eventBus = EventBus.getInstance();

eventBus.on(GameEventType.ENEMY_KILLED, (payload: EnemyKilledPayload) => {
  console.log(`Enemy ${payload.entityId} killed at (${payload.x}, ${payload.y})`);
});
```

Available events:
- `ENEMY_KILLED`, `WAVE_STARTED`, `WAVE_COMPLETED`
- `PLAYER_DAMAGED`, `RESOURCE_UPDATED`, `GAME_OVER`
- `COMBO_UPDATED`, `ACHIEVEMENT_UNLOCKED`

## Testing Patterns

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld } from 'bitecs';

describe('NewFeature', () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  it('should do something', () => {
    // Arrange
    const entity = addEntity(world);
    
    // Act
    someFunction(world, entity);
    
    // Assert
    expect(Component.value[entity]).toBe(expected);
  });
});
```

## Code Conventions

- Use TypeScript strict mode
- Export types and interfaces
- Document public APIs with JSDoc
- Keep systems pure (no side effects except ECS mutations)
- Use EventBus for cross-system communication
- Prefer composition over inheritance

## Validation Checklist

Before completing any task:

- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all 48 tests)
- [ ] `npm run build` succeeds
- [ ] New code has tests where applicable


## IDE Specifc
- IF YOU ARE KIRO, dont edit code or run command, you can only read files, searches files and update docs