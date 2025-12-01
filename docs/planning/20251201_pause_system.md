# Pause System Implementation

**Date:** December 1, 2025  
**Priority:** HIGH  
**Estimated Time:** 1-2 hours  
**Dependencies:** None

## Objective

Implement a complete pause system that allows players to pause/resume the game using the ESC key, with a visual overlay and proper game state management.

## Current State

**What Exists:**
- ✅ GameState has `PAUSED` state defined
- ✅ State transitions work (`setState()`, `isPaused()`)
- ✅ Game loop checks `isPlaying()` before running systems

**What's Missing:**
- ❌ No keyboard shortcut to trigger pause
- ❌ No pause overlay UI
- ❌ No visual indication of paused state
- ❌ No resume/restart/quit buttons

## Implementation

### 1. Add Pause Overlay UI

**File:** `src/ui/PauseOverlay.ts` (new)

```typescript
/**
 * Pause Overlay UI
 * Displays when game is paused with resume/restart/quit options
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { GAME_CONFIG } from '../types/constants';

export class PauseOverlay {
  public container: Container;
  private visible: boolean = false;
  private app: Application | null = null;
  
  // Callbacks
  private onResumeCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onQuitCallback: (() => void) | null = null;
  
  // UI Elements
  private overlay: Graphics;
  private titleText: Text;
  private resumeButton: Container;
  private restartButton: Container;
  private quitButton: Container;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
  }

  public init(app: Application): void {
    this.app = app;
    
    // Create semi-transparent overlay
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    this.overlay.fill({ color: 0x000000, alpha: 0.8 });
    this.container.addChild(this.overlay);
    
    // Create title
    const titleStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 48,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.titleText = new Text({ text: 'PAUSED', style: titleStyle });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(GAME_CONFIG.WORLD_WIDTH / 2, 200);
    this.container.addChild(this.titleText);
    
    // Create buttons
    this.resumeButton = this.createButton('RESUME (ESC)', GAME_CONFIG.WORLD_WIDTH / 2, 400);
    this.restartButton = this.createButton('RESTART (R)', GAME_CONFIG.WORLD_WIDTH / 2, 500);
    this.quitButton = this.createButton('QUIT (Q)', GAME_CONFIG.WORLD_WIDTH / 2, 600);
    
    this.container.addChild(this.resumeButton);
    this.container.addChild(this.restartButton);
    this.container.addChild(this.quitButton);
    
    // Add to stage
    this.app.stage.addChild(this.container);
  }

  private createButton(text: string, x: number, y: number): Container {
    const button = new Container();
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    // Button background
    const bg = new Graphics();
    bg.roundRect(-150, -30, 300, 60, 8);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
    bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
    button.addChild(bg);
    
    // Button text
    const textStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.SECONDARY,
      fontWeight: 'bold'
    });
    const buttonText = new Text({ text, style: textStyle });
    buttonText.anchor.set(0.5);
    button.addChild(buttonText);
    
    // Hover effects
    button.on('pointerover', () => {
      bg.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 3 });
      buttonText.style.fill = UI_STYLES.COLORS.PRIMARY;
    });
    
    button.on('pointerout', () => {
      bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
      buttonText.style.fill = UI_STYLES.COLORS.SECONDARY;
    });
    
    // Click handlers
    if (text.includes('RESUME')) {
      button.on('pointerdown', () => this.onResumeCallback?.());
    } else if (text.includes('RESTART')) {
      button.on('pointerdown', () => this.onRestartCallback?.());
    } else if (text.includes('QUIT')) {
      button.on('pointerdown', () => this.onQuitCallback?.());
    }
    
    return button;
  }

  public show(): void {
    this.visible = true;
    this.container.visible = true;
  }

  public hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setOnResume(callback: () => void): void {
    this.onResumeCallback = callback;
  }

  public setOnRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  public setOnQuit(callback: () => void): void {
    this.onQuitCallback = callback;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
```

### 2. Export PauseOverlay

**File:** `src/ui/index.ts` (modify)

```typescript
// Add to existing exports
export { PauseOverlay } from './PauseOverlay';
```

### 3. Integrate with Game Class

**File:** `src/core/Game.ts` (modify)

Add pause overlay property:

```typescript
export class Game {
  // ... existing properties
  private pauseOverlay: PauseOverlay | null = null;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;

  constructor(containerId: string = 'app') {
    // ... existing code
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }
```

Initialize pause overlay in `init()`:

```typescript
async init(): Promise<void> {
  // ... existing init code
  
  // Initialize pause overlay
  this.pauseOverlay = new PauseOverlay();
  this.pauseOverlay.init(this.app);
  this.pauseOverlay.setOnResume(() => this.resume());
  this.pauseOverlay.setOnRestart(() => {
    this.resume();
    this.restart();
  });
  this.pauseOverlay.setOnQuit(() => {
    this.resume();
    // TODO: Return to main menu when implemented
    console.log('Quit to main menu (not yet implemented)');
  });
  
  // Add keyboard listener for pause
  window.addEventListener('keydown', this.boundHandleKeyDown);
  
  // ... rest of init
}
```

Add keyboard handler method:

```typescript
/**
 * Handle keyboard input for pause and other shortcuts
 */
private handleKeyDown(e: KeyboardEvent): void {
  // ESC key - Toggle pause
  if (e.key === 'Escape') {
    if (this.gameState.isPlaying()) {
      this.pause();
    } else if (this.gameState.isPaused()) {
      this.resume();
    }
  }
  
  // R key - Restart (when paused)
  if (e.key === 'r' || e.key === 'R') {
    if (this.gameState.isPaused()) {
      this.resume();
      this.restart();
    }
  }
  
  // Q key - Quit (when paused)
  if (e.key === 'q' || e.key === 'Q') {
    if (this.gameState.isPaused()) {
      this.resume();
      // TODO: Return to main menu when implemented
      console.log('Quit to main menu (not yet implemented)');
    }
  }
}
```

Add pause/resume methods:

```typescript
/**
 * Pause the game
 */
public pause(): void {
  if (!this.gameState.isPlaying()) {
    return;
  }
  
  this.gameState.setState(GameStateType.PAUSED);
  
  // Show pause overlay
  if (this.pauseOverlay) {
    this.pauseOverlay.show();
  }
  
  // Hide HUD (optional - or keep it visible)
  // if (this.hudManager) {
  //   this.hudManager.hide();
  // }
  
  console.log('Game paused');
}

/**
 * Resume the game
 */
public resume(): void {
  if (!this.gameState.isPaused()) {
    return;
  }
  
  this.gameState.setState(GameStateType.PLAYING);
  
  // Hide pause overlay
  if (this.pauseOverlay) {
    this.pauseOverlay.hide();
  }
  
  // Show HUD
  // if (this.hudManager) {
  //   this.hudManager.show();
  // }
  
  console.log('Game resumed');
}

/**
 * Get pause state
 */
public isPaused(): boolean {
  return this.gameState.isPaused();
}
```

Update destroy method:

```typescript
destroy(): void {
  window.removeEventListener('keydown', this.boundHandleKeyDown);
  
  if (this.pauseOverlay) {
    this.pauseOverlay.destroy();
  }
  
  // ... existing destroy code
}
```

### 4. Update Game Loop

**File:** `src/core/Game.ts` (modify)

The game loop already checks `isPlaying()` before running systems, so it will automatically skip updates when paused. No changes needed to `update()` method!

```typescript
private update(): void {
  // ... existing code
  
  // Only run gameplay systems when playing (already exists!)
  if (this.gameState.isPlaying()) {
    // Systems run here
  }
  
  // Rendering always runs (shows paused state)
}
```

## Testing

### Manual Testing Checklist

- [ ] Press ESC during gameplay - game pauses
- [ ] Pause overlay appears with semi-transparent background
- [ ] Game systems stop updating (enemies freeze)
- [ ] Rendering continues (can see frozen game state)
- [ ] Press ESC again - game resumes
- [ ] Click "RESUME" button - game resumes
- [ ] Press R while paused - game restarts
- [ ] Click "RESTART" button - game restarts
- [ ] Press Q while paused - logs quit message
- [ ] Click "QUIT" button - logs quit message
- [ ] HUD remains visible during pause (or hides if preferred)
- [ ] Audio continues/stops appropriately
- [ ] No performance issues
- [ ] Can pause/resume multiple times

### Edge Cases

- [ ] Pause during game over - should not work
- [ ] Pause during menu (when implemented) - should not work
- [ ] Rapid ESC key presses - no issues
- [ ] Pause with placement mode active - ghost preview freezes

## Success Criteria

- ✅ ESC key pauses and resumes game
- ✅ Pause overlay displays with clear UI
- ✅ Game systems stop when paused
- ✅ Rendering continues (frozen frame visible)
- ✅ Resume button works
- ✅ Restart button works
- ✅ Keyboard shortcuts work (ESC, R, Q)
- ✅ No bugs or performance issues
- ✅ Professional UX

## Notes for Agent

- Keep it simple - just pause/resume functionality
- Overlay should be clear and obvious
- Keyboard shortcuts are important for quick pause/resume
- Game loop already handles paused state correctly
- Consider whether to hide HUD during pause (optional)
- Audio should probably continue (or add mute option)
- Quit button is placeholder until main menu exists

## Related Files

- `src/ui/PauseOverlay.ts` (new)
- `src/ui/index.ts` (modify - add export)
- `src/core/Game.ts` (modify - add pause/resume methods and keyboard handler)

## Next Steps

After implementing pause system:
1. Test thoroughly
2. Adjust UI styling if needed
3. Consider adding pause icon to HUD
4. Move to Main Menu implementation
