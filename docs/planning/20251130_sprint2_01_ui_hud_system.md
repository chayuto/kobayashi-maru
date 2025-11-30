# Task 01: UI/HUD System

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** HIGH  
**Estimated Effort:** 1-2 days

## Objective
Implement a comprehensive in-game HUD (Heads-Up Display) system to show player-critical information including wave status, resources, score, and Kobayashi Maru health.

## Context
The game currently has a debug overlay (`DebugManager.ts`) showing FPS and entity counts, but lacks a player-facing HUD. Players need to see:
- Current wave number and progress
- Available resources for turret placement
- Time survived and enemies defeated
- Kobayashi Maru health/shield status
- Active turret count

The existing systems provide all the data needed:
- `ScoreManager` - tracks time survived, enemies defeated, wave reached
- `ResourceManager` - tracks available resources
- `WaveManager` - tracks current wave, state, active enemies
- `Health/Shield` components - entity health data

## Requirements

### 1. Create HUD Manager (`src/ui/HUDManager.ts`)
- **Class:** `HUDManager`
- **Properties:**
  - `container`: PixiJS Container for HUD elements
  - `elements`: Map of UI element references
  - `visible`: boolean

- **Methods:**
  - `init(app: Application)`: Initialize HUD with PixiJS Graphics/Text
  - `update(data: HUDData)`: Update all display values
  - `show()` / `hide()`: Toggle visibility
  - `destroy()`: Clean up resources

### 2. HUD Data Interface (`src/ui/types.ts`)
```typescript
interface HUDData {
  waveNumber: number;
  waveState: 'idle' | 'spawning' | 'active' | 'complete';
  activeEnemies: number;
  resources: number;
  timeSurvived: number;
  enemiesDefeated: number;
  kobayashiMaruHealth: number;
  kobayashiMaruMaxHealth: number;
  kobayashiMaruShield: number;
  kobayashiMaruMaxShield: number;
  turretCount: number;
}
```

### 3. Visual Layout
Create LCARS-style UI elements positioned at screen edges:
- **Top-left:** Wave info (Wave #, state indicator, enemy count)
- **Top-right:** Resources display with icon
- **Bottom-left:** Score info (Time survived, enemies defeated)
- **Bottom-center:** Kobayashi Maru status bar (health + shield)
- **Bottom-right:** Turret count indicator

### 4. LCARS Styling Constants (`src/ui/styles.ts`)
```typescript
export const UI_STYLES = {
  FONT_FAMILY: 'monospace',
  FONT_SIZE_LARGE: 24,
  FONT_SIZE_MEDIUM: 18,
  FONT_SIZE_SMALL: 14,
  PADDING: 16,
  BAR_HEIGHT: 20,
  BAR_WIDTH: 300,
  COLORS: {
    PRIMARY: 0xFF9900,    // LCARS Golden Orange
    SECONDARY: 0x99CCFF,  // LCARS Galaxy Blue
    HEALTH: 0x33CC99,     // Federation Teal
    SHIELD: 0x66AAFF,     // Shield Blue
    DANGER: 0xDD4444,     // Red for low health
    BACKGROUND: 0x000000
  }
};
```

### 5. Integrate with Game Class
- Add `HUDManager` as property in `Game.ts`
- Initialize in `init()` method
- Update in `update()` loop with current game data
- Destroy in `destroy()` method

### 6. Health Bar Component (`src/ui/HealthBar.ts`)
Reusable component for displaying health/shield bars:
- Properties: `x`, `y`, `width`, `height`, `currentValue`, `maxValue`, `color`
- Methods: `update(current, max)`, `setPosition(x, y)`
- Should show percentage and numeric value

## Acceptance Criteria
- [ ] HUD displays all required information
- [ ] Values update in real-time during gameplay
- [ ] LCARS color scheme is followed
- [ ] HUD does not interfere with gameplay visibility
- [ ] Kobayashi Maru health bar shows both health and shield
- [ ] Wave state is clearly indicated (spawning/active/complete)
- [ ] Resources display updates when spending/earning resources
- [ ] Unit tests cover HUDManager initialization and updates
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/ui/HUDManager.ts`
- `src/ui/HealthBar.ts`
- `src/ui/types.ts`
- `src/ui/styles.ts`
- `src/ui/index.ts` (barrel export)
- `src/__tests__/HUDManager.test.ts`

## Files to Modify
- `src/core/Game.ts` - Add HUD integration

## Testing Requirements
- Unit tests for `HUDManager` initialization
- Unit tests for `HealthBar` calculations
- Unit tests for data update handling
- Mock PixiJS Application for testing

## Technical Notes
- Use PixiJS `Text` for text elements (faster than bitmap fonts for small numbers)
- Use `Graphics` for bars and backgrounds
- Consider using `Container` hierarchy for organized updates
- Keep draw calls minimal for performance
- Reference `DebugManager.ts` for DOM overlay patterns (HUD should be canvas-based)
