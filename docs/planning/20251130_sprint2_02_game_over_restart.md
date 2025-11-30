# Task 02: Game Over Screen and Restart

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** HIGH  
**Estimated Effort:** 1 day

## Objective
Implement a proper game over screen that displays when the Kobayashi Maru is destroyed, showing final score and providing restart functionality.

## Context
The game currently:
- Has `GameState` manager with `GAME_OVER` state
- Detects when Kobayashi Maru health reaches zero (`checkGameOver()` in `Game.ts`)
- Saves scores via `HighScoreManager`
- Logs game over to console

Missing functionality:
- Visual game over screen
- Final score display with breakdown
- High score comparison
- Restart button/key
- Reset of all game systems

## Requirements

### 1. Create Game Over Screen (`src/ui/GameOverScreen.ts`)
- **Class:** `GameOverScreen`
- **Properties:**
  - `container`: PixiJS Container
  - `visible`: boolean
  - `onRestart`: callback function

- **Methods:**
  - `init(app: Application)`: Create UI elements
  - `show(scoreData: ScoreData, isHighScore: boolean)`: Display with score
  - `hide()`: Hide the screen
  - `destroy()`: Clean up

### 2. UI Elements
Design a dramatic game over overlay:
- **Background:** Semi-transparent dark overlay
- **Title:** "SIMULATION ENDED" or "KOBAYASHI MARU LOST"
- **Score Panel:**
  - Time Survived: XX:XX format
  - Wave Reached: #
  - Enemies Defeated: #
  - Total Score: calculated value
- **High Score Indicator:** "NEW HIGH SCORE!" if applicable
- **Previous High Score:** Show for comparison
- **Actions:**
  - "PRESS ENTER TO RESTART" text prompt
  - Optional: clickable button

### 3. Score Calculation Display
Show how final score is calculated:
```
Time Survived:     2m 45s  x 10  =  1,650
Enemies Defeated:      47  x 100 =  4,700
Wave Reached:           8  x 500 =  4,000
───────────────────────────────────────────
TOTAL SCORE:                       10,350
```

### 4. Restart System (`src/core/Game.ts`)
Add restart capability:
- `restart()` method that:
  - Resets `GameState` to `MENU` then `PLAYING`
  - Clears all entities (enemies, turrets)
  - Re-spawns Kobayashi Maru
  - Resets `WaveManager`
  - Resets `ScoreManager`
  - Resets `ResourceManager`
  - Hides game over screen
  - Starts wave 1

### 5. Input Handling
- Listen for Enter key to restart when game over screen is visible
- Listen for 'R' key as alternative restart trigger
- Add click handler on restart button

### 6. State Integration
Update `GameState` valid transitions:
```typescript
[GameStateType.GAME_OVER]: [GameStateType.MENU, GameStateType.PLAYING]
```

## Acceptance Criteria
- [ ] Game over screen appears when Kobayashi Maru is destroyed
- [ ] Final score is displayed with breakdown
- [ ] "NEW HIGH SCORE!" appears when applicable
- [ ] Pressing Enter restarts the game
- [ ] All game systems reset properly on restart
- [ ] Wave 1 starts after restart
- [ ] Resources reset to initial value
- [ ] Game over screen is styled with LCARS theme
- [ ] Unit tests cover restart functionality
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/ui/GameOverScreen.ts`
- `src/__tests__/GameOverScreen.test.ts`

## Files to Modify
- `src/core/Game.ts` - Add game over screen and restart
- `src/game/gameState.ts` - Update valid transitions if needed
- `src/ui/index.ts` - Export new module

## Testing Requirements
- Unit tests for `GameOverScreen` show/hide
- Unit tests for score display formatting
- Unit tests for `Game.restart()` functionality
- Test that all managers are properly reset
- Test input handling (Enter key triggers restart)

## Technical Notes
- Use `Container` with high `zIndex` to overlay game
- Use `Graphics` for semi-transparent background
- Use `Text` with LCARS font styling
- Consider animation/tween for dramatic reveal
- Ensure input handlers are properly cleaned up on destroy
- Reference `PlacementSystem` for keyboard event handling patterns

## Score Calculation Formula
```typescript
const calculateScore = (data: ScoreData): number => {
  const timeScore = Math.floor(data.timeSurvived) * 10;
  const killScore = data.enemiesDefeated * 100;
  const waveScore = data.waveReached * 500;
  return timeScore + killScore + waveScore;
};
```
