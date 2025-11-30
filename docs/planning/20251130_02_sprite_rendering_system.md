# Task 02: Sprite Rendering System

## Objective
Create a rendering system that efficiently draws 5,000+ entities using PixiJS ParticleContainer for maximum performance.

## Context
The game has texture generation for faction shapes but lacks the rendering system to display ECS entities on screen. We need to bridge bitECS entities to PixiJS sprites.

## Requirements

### 1. Create Render System (`src/systems/renderSystem.ts`)
- Create a bitECS system that syncs entity positions to sprites
- Use `defineQuery` to get all entities with Position and SpriteRef components
- Update sprite x/y from Position component each frame
- Handle sprite creation when SpriteRef.index is unset

### 2. Create Sprite Manager (`src/rendering/spriteManager.ts`)
- Manage a PixiJS `ParticleContainer` for high-performance rendering
- Support 10,000+ sprites at 60 FPS
- `SpriteManager.createSprite(factionId)` - creates sprite with correct texture
- `SpriteManager.updateSprite(index, x, y)` - updates sprite position
- `SpriteManager.removeSprite(index)` - removes and pools sprite

### 3. Initialize Textures in Game
- Call `createFactionTextures(app)` during game init
- Pass textures to SpriteManager

### 4. Connect ECS to Rendering
- Update Game class to run render system each frame
- Ensure sprites are added to stage via ParticleContainer

## Acceptance Criteria
- [ ] Sprites render for all spawned entities
- [ ] Each faction displays correct geometric shape
- [ ] ParticleContainer is used for performance
- [ ] Sprites update position each frame
- [ ] Maintains 60 FPS with 5,000 entities
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/systems/renderSystem.ts` (new)
- `src/systems/index.ts` (new - barrel export)
- `src/rendering/spriteManager.ts` (new)
- `src/rendering/index.ts` (modify to export spriteManager)
- `src/core/Game.ts` (modify)

## Technical Notes
- Use `ParticleContainer` with `{positions: true, tint: false, rotation: false}`
- Pre-create sprites in pool for fast allocation
- Use `defineQuery([Position, SpriteRef, Faction])` for the render query
- Use `defineSystem` to create the render system function
