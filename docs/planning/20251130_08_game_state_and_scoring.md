# Task 08: Game State and Scoring System

## Objective
Implement game state management and scoring to track player progress, handle game over conditions, and record metrics.

## Context
The game needs to track time survived, enemies defeated, waves completed, and detect when the Kobayashi Maru is destroyed (game over).

## Requirements

### 1. Create Game State Manager (`src/game/gameState.ts`)
- Define game states: `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`
- Track current state with transitions
- `GameState.setState(newState)` - change state with validation
- `GameState.getState()` - get current state
- Emit events on state changes

### 2. Create Score Manager (`src/game/scoreManager.ts`)
- Track gameplay metrics:
  - `timeSurvived: number` - seconds survived
  - `waveReached: number` - highest wave completed
  - `enemiesDefeated: number` - total kills
  - `civiliansSaved: number` - Kobayashi Maru survivors (future feature)
- `ScoreManager.update(deltaTime)` - increment time
- `ScoreManager.addKill(factionId)` - record enemy kill
- `ScoreManager.reset()` - reset for new game

### 3. Game Over Detection
- Monitor Kobayashi Maru health
- When health <= 0, trigger game over
- Create game over system that:
  1. Sets state to GAME_OVER
  2. Stops spawning
  3. Preserves final score

### 4. High Score Persistence
- Save high scores to localStorage
- Track top 10 runs by time survived
- `HighScoreManager.saveScore(score)` - save if qualifies
- `HighScoreManager.getHighScores()` - retrieve leaderboard

### 5. Integrate with Game Loop
- Only run gameplay systems when state is PLAYING
- Pause systems when state is PAUSED
- Display appropriate UI for each state

## Acceptance Criteria
- [ ] Game states transition correctly
- [ ] Time survived increments during play
- [ ] Enemy kills are counted
- [ ] Game over triggers when Kobayashi Maru destroyed
- [ ] High scores persist across sessions
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/game/gameState.ts` (new)
- `src/game/scoreManager.ts` (new)
- `src/game/highScoreManager.ts` (new)
- `src/game/index.ts` (modify to export)
- `src/core/Game.ts` (modify)

## Technical Notes
- Use a simple state machine pattern
- Consider using an event emitter for state change notifications
- localStorage key: 'kobayashi-maru-highscores'
- JSON serialize scores with timestamp
- Time survived is the primary ranking metric
