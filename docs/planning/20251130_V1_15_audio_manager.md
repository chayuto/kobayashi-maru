# Task 15: Audio Manager

## Objective
Implement sound effects and background music.

## Context
Audio provides vital feedback (shooting, explosions) and atmosphere.

## Requirements

### 1. Audio Manager (`src/core/AudioManager.ts`)
- **Properties:**
  - `sounds`: Map<string, AudioBuffer>
  - `context`: AudioContext
- **Methods:**
  - `loadSounds()`: Load audio files (can be part of AssetManager).
  - `playSfx(id)`: Play a sound effect (fire-and-forget).
  - `playMusic(id, loop)`: Play background music.

### 2. Integration
- **Events:**
  - `playSfx('shoot')` when turret fires.
  - `playSfx('explosion')` when enemy dies.
  - `playSfx('place')` when turret placed.
  - `playMusic('bgm')` on game start.

## Acceptance Criteria
- [ ] Sounds play when actions occur (shooting, explosion).
- [ ] Background music loops.
- [ ] Audio does not crash the game if files are missing (graceful failure).

## Files to Create/Modify
- `src/core/AudioManager.ts`
- `src/ecs/systems/turretSystem.ts`
- `src/ecs/systems/collisionSystem.ts`
