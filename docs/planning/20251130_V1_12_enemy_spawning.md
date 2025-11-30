# Task 12: Enemy Spawning System

## Objective
Implement a Wave Manager to spawn enemies in waves.

## Context
The game needs a progression of difficulty. Enemies should spawn at the edges of the map and move towards the center (Kobayashi Maru).

## Requirements

### 1. Wave Manager (`src/game/WaveManager.ts`)
- **State:** `currentWave`, `waveTimer`, `enemiesRemaining`.
- **Config:** Define waves (e.g., Wave 1: 10 Klingons; Wave 2: 5 Romulans).
- **Methods:**
  - `update(deltaTime)`: Handle timing.
  - `spawnWave()`: Trigger spawning of the next wave.
  - `spawnEnemy()`: Pick a random edge location and spawn using `EntityFactory`.

### 2. Integration
- Call `WaveManager.update()` in `Game.update()`.
- Display wave info (Task 14).

## Acceptance Criteria
- [ ] Enemies spawn in waves.
- [ ] Enemies spawn at map edges.
- [ ] Next wave starts after a delay or when previous wave is cleared.
- [ ] Difficulty increases with waves.

## Files to Create/Modify
- `src/game/WaveManager.ts`
- `src/core/Game.ts`
