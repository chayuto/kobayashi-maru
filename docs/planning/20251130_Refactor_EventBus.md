# Refactor: Global Event Bus

## Objective
Implement a type-safe, global Event Bus to decouple systems and remove manual callback wiring in `Game.ts`.

## Context
Currently, systems communicate via direct callbacks (e.g., `DamageSystem` calls `Game.ts` callback, which calls `ScoreManager`). This creates tight coupling and makes adding new interactions (like achievements or sound effects) difficult.

## Requirements

### 1. Event Bus Implementation (`src/core/EventBus.ts`)
- Create a singleton or globally accessible `EventBus` class.
- Support strongly-typed events.
- Methods: `emit(event, payload)`, `on(event, handler)`, `off(event, handler)`.

### 2. Define Events (`src/types/events.ts`)
- Define an enum or union type for all game events:
  - `ENEMY_KILLED`: { entityId, factionId, x, y }
  - `WAVE_STARTED`: { waveNumber }
  - `WAVE_COMPLETED`: { waveNumber }
  - `PLAYER_DAMAGED`: { currentHealth }
  - `RESOURCE_UPDATED`: { current, amount }
  - `GAME_OVER`: { score }

### 3. Refactor Systems
- **DamageSystem**: Emit `ENEMY_KILLED` instead of calling callback.
- **WaveManager**: Emit `WAVE_STARTED`, `WAVE_COMPLETED`.
- **ResourceManager**: Emit `RESOURCE_UPDATED`.
- **ScoreManager**: Listen for `ENEMY_KILLED`, `WAVE_COMPLETED`.
- **AudioManager**: Listen for events to play sounds (decouple from systems).
- **Game.ts**: Remove manual wiring.

## Acceptance Criteria
- [ ] `EventBus` class implemented.
- [ ] Systems emit events instead of callbacks.
- [ ] `Game.ts` is significantly cleaner (no callback hell).
- [ ] New systems can listen to events without modifying the emitter.

## Files to Create/Modify
- `src/core/EventBus.ts` (NEW)
- `src/types/events.ts` (NEW)
- `src/systems/damageSystem.ts`
- `src/game/waveManager.ts`
- `src/game/resourceManager.ts`
- `src/game/scoreManager.ts`
- `src/core/Game.ts`
