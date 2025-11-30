# Task 03: Starfield Background

## Objective
Create a performant, scrolling starfield background to give the game a sense of depth and motion.

## Context
The game takes place in space. A static black background is boring. We need a multi-layered starfield that provides parallax or simple depth.

## Requirements

### 1. Starfield Component (`src/rendering/Starfield.ts`)
- Use PixiJS `TilingSprite` or a `ParticleContainer` for stars.
- **Layers:**
  - Background stars (slow movement/static).
  - Foreground stars (faster movement for parallax effect).
- **Methods:**
  - `initialize(app: Application)`: Add to stage (at z-index 0).
  - `update(deltaTime, speed)`: Scroll the stars based on game speed/camera movement.

### 2. Procedural Generation
- Generate star textures programmatically (white circles with varying alpha/size) to avoid loading external assets for now.

## Acceptance Criteria
- [ ] Starfield is visible behind game entities.
- [ ] Stars look random and natural.
- [ ] Performance is high (using TilingSprite or ParticleContainer).
- [ ] Can be updated to simulate movement.

## Files to Create/Modify
- `src/rendering/Starfield.ts`
