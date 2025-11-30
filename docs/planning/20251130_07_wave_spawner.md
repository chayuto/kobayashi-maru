# Task 07: Wave Spawner System

## Objective
Create a wave management system that spawns enemies in escalating waves, forming the core gameplay loop.

## Context
The game needs structured enemy spawning that increases in difficulty over time. Enemies should spawn from the edges of the screen and navigate toward the Kobayashi Maru.

## Requirements

### 1. Create Wave Manager (`src/game/waveManager.ts`)
- Track current wave number
- Define wave configurations (enemy counts, types, spawn patterns)
- `WaveManager.startWave(waveNumber)` - begin spawning a wave
- `WaveManager.update(deltaTime)` - process spawning over time
- `WaveManager.isWaveComplete()` - check if all enemies defeated
- Emit events for wave start/complete

### 2. Create Spawn Points System
- Define spawn positions along screen edges
- Support multiple spawn patterns:
  - Random edge positions
  - Clustered groups
  - Formation patterns (V-shape for Klingons)
- `SpawnPoint.getSpawnPosition()` - get next spawn location

### 3. Wave Configuration
- Define wave data structure:
```typescript
interface WaveConfig {
  waveNumber: number;
  enemies: {
    faction: FactionId;
    count: number;
    spawnDelay: number; // ms between spawns
    formation?: 'random' | 'cluster' | 'v-formation';
  }[];
}
```
- Create initial wave definitions (waves 1-10)
- Implement procedural wave generation for waves 10+

### 4. Difficulty Scaling
- Increase enemy count per wave (linear then exponential)
- Mix in stronger enemy types at higher waves:
  - Waves 1-3: Klingons only
  - Waves 4-6: Add Romulans
  - Waves 7-9: Add Borg
  - Wave 10+: All enemy types
- Scale enemy health/speed slightly per wave

### 5. Integration with Game
- Initialize WaveManager in Game class
- Start wave 1 when game begins
- Auto-start next wave when current completes (after delay)

## Acceptance Criteria
- [ ] Waves spawn enemies over time (not all at once)
- [ ] Enemy types escalate with wave number
- [ ] Spawn patterns work correctly
- [ ] Wave completion is detected
- [ ] Difficulty increases appropriately
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/game/waveManager.ts` (new)
- `src/game/waveConfig.ts` (new - wave definitions)
- `src/game/spawnPoints.ts` (new)
- `src/game/index.ts` (new - barrel export)
- `src/core/Game.ts` (modify)

## Technical Notes
- Use a timer/accumulator pattern for spawn delays
- Stagger spawns to prevent frame spikes (max 10 spawns per frame)
- Consider adding brief invulnerability to newly spawned enemies
- Store wave configs in data files for easy balancing
