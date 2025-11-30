# Task 09: Basic Turret Placement System

## Objective
Allow players to place Federation defense turrets that will automatically target and shoot at enemies.

## Context
The core gameplay involves the player placing automated defenses. This task implements the placement mechanism; combat/shooting will be a separate task.

## Requirements

### 1. Create Turret Component (`src/ecs/components.ts`)
- Add turret-specific components:
  - `Turret.range: Types.f32` - targeting range in pixels
  - `Turret.fireRate: Types.f32` - shots per second
  - `Turret.damage: Types.f32` - damage per shot
  - `Turret.lastFired: Types.f32` - timestamp of last shot

### 2. Create Turret Factory (`src/ecs/entityFactory.ts`)
- `createTurret(world, x, y, turretType)` - spawn turret entity
- Define turret types:
  - `PHASER_ARRAY` - fast fire rate, low damage, medium range
  - `TORPEDO_LAUNCHER` - slow fire rate, high damage, long range
  - `DISRUPTOR_BANK` - medium fire rate, stacking debuff

### 3. Create Placement System (`src/game/placementSystem.ts`)
- Handle mouse/touch input for turret placement
- Show placement preview (ghost turret) at cursor position
- Validate placement (not too close to other turrets, within bounds)
- `PlacementSystem.startPlacing(turretType)` - enter placement mode
- `PlacementSystem.confirmPlacement()` - place turret at current position
- `PlacementSystem.cancelPlacement()` - exit placement mode

### 4. Resource Cost System
- Define resource type: "Replication Matter"
- Track player's current resources
- Each turret has a cost
- Prevent placement if insufficient resources
- Gain resources from defeating enemies (future task)

### 5. Placement UI Integration
- Visual feedback for valid/invalid placement positions
- Green ghost = valid, Red ghost = invalid
- Show range circle preview during placement

## Acceptance Criteria
- [ ] Player can enter turret placement mode
- [ ] Ghost turret follows cursor
- [ ] Click places turret at valid positions
- [ ] Invalid positions are rejected with feedback
- [ ] Multiple turret types available
- [ ] Resource cost is checked before placement
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/ecs/components.ts` (modify - add Turret)
- `src/ecs/entityFactory.ts` (modify - add turret factory)
- `src/game/placementSystem.ts` (new)
- `src/game/resourceManager.ts` (new)
- `src/game/index.ts` (modify to export)
- `src/core/Game.ts` (modify)

## Technical Notes
- Use PixiJS InteractiveEvent for mouse handling
- Placement preview uses alpha = 0.5
- Minimum distance between turrets: 64 pixels
- Initial resource amount: 500
- Turret costs: Phaser 100, Torpedo 200, Disruptor 150
