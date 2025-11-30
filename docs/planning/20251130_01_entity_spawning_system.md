# Task 01: Entity Spawning System

## Objective
Create a robust entity spawning system using bitECS to spawn and manage 5,000+ entities efficiently.

## Context
The game currently has basic ECS components defined (Position, Velocity, Faction, SpriteRef, Health, Shield) but lacks the actual entity spawning and management logic. We need to create the spawning infrastructure.

## Requirements

### 1. Create Entity Factory (`src/ecs/entityFactory.ts`)
- Create functions to spawn entities with pre-configured component values
- `createFederationShip(world, x, y)` - spawns a Federation entity
- `createKlingonShip(world, x, y)` - spawns a Klingon enemy
- `createRomulanShip(world, x, y)` - spawns a Romulan enemy
- `createBorgShip(world, x, y)` - spawns a Borg enemy
- `createTholianShip(world, x, y)` - spawns a Tholian enemy
- `createSpecies8472Ship(world, x, y)` - spawns a Species 8472 enemy
- `createKobayashiMaru(world, x, y)` - spawns the Kobayashi Maru (center objective)

### 2. Entity Pool System (`src/ecs/entityPool.ts`)
- Implement object pooling to avoid garbage collection spikes
- Pre-allocate entity slots for common entity types
- `EntityPool.acquire()` - get an entity from the pool
- `EntityPool.release(eid)` - return an entity to the pool
- Support pool sizes of 10,000+ entities

### 3. Update World Module (`src/ecs/world.ts`)
- Export entity creation utilities alongside world creation
- Provide helper to get entity count

### 4. Integrate with Game Class
- Update `Game.ts` to spawn test entities on initialization
- Spawn Kobayashi Maru at center of screen
- Spawn 100 test enemies at random positions around the edges

## Acceptance Criteria
- [ ] Entity factory functions are created and exported
- [ ] Entity pool system prevents GC spikes
- [ ] Test entities spawn correctly on game init
- [ ] Console logs entity count on startup
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/ecs/entityFactory.ts` (new)
- `src/ecs/entityPool.ts` (new)
- `src/ecs/world.ts` (modify)
- `src/ecs/index.ts` (modify to export new modules)
- `src/core/Game.ts` (modify)

## Technical Notes
- Use bitECS `addEntity()` and `removeEntity()` functions
- Use `addComponent()` to attach components to entities
- Reference `FactionId` from `src/types/constants.ts` for faction assignment
