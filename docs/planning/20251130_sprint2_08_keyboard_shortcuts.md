# Task 08: Keyboard Shortcuts for Turret Placement

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** HIGH  
**Estimated Effort:** 0.5 day

## Objective
Add keyboard shortcuts for quick turret selection and placement, improving gameplay flow for keyboard users.

## Context
Current placement system:
- `PlacementSystem` handles mouse/touch placement
- Must call `startPlacing(turretType)` to enter placement mode
- Escape key cancels placement (already implemented)
- No UI for turret selection yet
- Three turret types: Phaser Array, Torpedo Launcher, Disruptor Bank

Keyboard shortcuts allow:
- Quick turret selection without UI
- Faster gameplay for experienced players
- Accessibility for keyboard-only users

## Requirements

### 1. Create Input Manager (`src/input/InputManager.ts`)
Centralized keyboard input handling:
```typescript
class InputManager {
  private keyBindings: Map<string, () => void>;
  private enabled: boolean;
  
  init(): void;
  bind(key: string, action: () => void): void;
  unbind(key: string): void;
  enable(): void;
  disable(): void;
  destroy(): void;
}
```

### 2. Default Key Bindings (`src/input/keyBindings.ts`)
```typescript
export const DEFAULT_KEYBINDINGS = {
  // Turret selection
  TURRET_PHASER: '1',        // Select Phaser Array
  TURRET_TORPEDO: '2',       // Select Torpedo Launcher
  TURRET_DISRUPTOR: '3',     // Select Disruptor Bank
  
  // Placement
  CANCEL_PLACEMENT: 'Escape', // Cancel (already in PlacementSystem)
  CONFIRM_PLACEMENT: 'Enter', // Confirm at cursor position
  
  // Game controls
  PAUSE: 'p',                // Pause/unpause game
  RESTART: 'r',              // Restart (when game over)
  
  // Debug
  DEBUG_TOGGLE: '`',         // Toggle debug overlay
  
  // Camera (future)
  PAN_UP: 'w',
  PAN_DOWN: 's',
  PAN_LEFT: 'a',
  PAN_RIGHT: 'd'
};
```

### 3. Integrate with Placement System
Update `PlacementSystem` or create wrapper:
```typescript
// In InputManager or PlacementSystem
private handleKeyDown(e: KeyboardEvent): void {
  switch (e.key) {
    case '1':
      this.startPlacing(TurretType.PHASER_ARRAY);
      break;
    case '2':
      this.startPlacing(TurretType.TORPEDO_LAUNCHER);
      break;
    case '3':
      this.startPlacing(TurretType.DISRUPTOR_BANK);
      break;
    case 'Escape':
      this.cancelPlacement();
      break;
  }
}
```

### 4. Visual Feedback
When turret is selected via keyboard:
- Show cursor position indicator (even before mouse move)
- Display selected turret name in HUD or tooltip
- Show range preview circle
- Display cost in UI

### 5. Keyboard Placement Flow
1. Press 1/2/3 to select turret type
2. Move mouse to position
3. Click or press Enter to place
4. Press Escape to cancel

### 6. Pause System (`src/game/pauseSystem.ts`)
Simple pause toggle:
```typescript
class PauseSystem {
  isPaused: boolean;
  
  togglePause(): void;
  pause(): void;
  resume(): void;
}
```

Integrate with:
- `GameState` (set to PAUSED)
- Game update loop (skip updates when paused)
- InputManager (P key binding)

### 7. Quick-Place Mode (Optional Enhancement)
Allow placing multiple turrets without re-selecting:
- Hold Shift while placing to stay in placement mode
- Automatically deselect after single placement without Shift

## Acceptance Criteria
- [ ] Pressing 1 selects Phaser Array
- [ ] Pressing 2 selects Torpedo Launcher
- [ ] Pressing 3 selects Disruptor Bank
- [ ] Escape cancels placement mode
- [ ] P pauses/unpauses the game
- [ ] R restarts when game over
- [ ] ` (backtick) toggles debug overlay
- [ ] Selected turret shows visual feedback
- [ ] Key bindings work when game is focused
- [ ] Key bindings don't conflict with browser shortcuts
- [ ] Unit tests cover input handling
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/input/InputManager.ts`
- `src/input/keyBindings.ts`
- `src/input/index.ts` (barrel export)
- `src/__tests__/InputManager.test.ts`

## Files to Modify
- `src/core/Game.ts` - Initialize InputManager, connect to systems
- `src/game/placementSystem.ts` - Expose methods for InputManager
- `src/core/DebugManager.ts` - Add toggle method
- `src/game/gameState.ts` - Ensure PAUSED state works

## Testing Requirements
- Unit test: Key binding registration
- Unit test: Key press triggers action
- Unit test: Enable/disable input handling
- Unit test: Multiple bindings work correctly
- Test: Escape doesn't interfere with browser behavior

## Technical Notes
- Use `keydown` event, not `keypress` (deprecated)
- Prevent default for game keys (avoid scrolling with arrows)
- Don't prevent default for browser shortcuts (Ctrl+R, F5)
- Consider gamepad support in future
- Store InputManager instance in Game class
- Use `e.key` not `e.keyCode` (deprecated)

## Input Manager Implementation
```typescript
export class InputManager {
  private bindings: Map<string, () => void> = new Map();
  private enabled: boolean = true;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandler = this.handleKeyDown.bind(this);
  }

  init(): void {
    document.addEventListener('keydown', this.boundHandler);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;
    
    // Don't intercept when typing in input fields
    if (e.target instanceof HTMLInputElement) return;
    
    const action = this.bindings.get(e.key.toLowerCase());
    if (action) {
      e.preventDefault();
      action();
    }
  }

  bind(key: string, action: () => void): void {
    this.bindings.set(key.toLowerCase(), action);
  }

  unbind(key: string): void {
    this.bindings.delete(key.toLowerCase());
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.boundHandler);
    this.bindings.clear();
  }
}
```

## Game Integration
```typescript
// In Game.ts constructor
this.inputManager = new InputManager();

// In Game.init()
this.inputManager.init();
this.setupKeyBindings();

// Setup method
private setupKeyBindings(): void {
  this.inputManager.bind('1', () => {
    this.placementSystem?.startPlacing(TurretType.PHASER_ARRAY);
  });
  this.inputManager.bind('2', () => {
    this.placementSystem?.startPlacing(TurretType.TORPEDO_LAUNCHER);
  });
  this.inputManager.bind('3', () => {
    this.placementSystem?.startPlacing(TurretType.DISRUPTOR_BANK);
  });
  this.inputManager.bind('p', () => {
    this.togglePause();
  });
  this.inputManager.bind('`', () => {
    this.debugManager?.toggle();
  });
}
```
