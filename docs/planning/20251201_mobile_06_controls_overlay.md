# Task 6: Mobile Controls Overlay

**Date:** December 1, 2025  
**Priority:** Medium  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 2 (Touch Input), Task 4 (Mobile HUD)

## Objective

Create virtual button overlay for mobile to replace keyboard shortcuts (ESC, R, backtick for debug).

## Implementation

### Create MobileControlsOverlay

**File:** `src/ui/MobileControlsOverlay.ts`

```typescript
export class MobileControlsOverlay {
  public container: Container;
  private pauseButton: Container;
  private restartButton: Container;
  private debugButton: Container;
  private visible: boolean = false;

  constructor() {
    this.container = new Container();
  }

  public init(): void {
    // Create floating action buttons
    this.createPauseButton();
    this.createRestartButton();
    this.createDebugButton();
    this.positionButtons();
  }

  private createPauseButton(): void {
    // Floating button top-left
    // Icon: ⏸ or ▶
  }

  private createRestartButton(): void {
    // Floating button (only visible on game over)
    // Icon: ↻
  }

  private createDebugButton(): void {
    // Floating button bottom-right (dev mode only)
    // Icon: 🐛
  }

  public show(): void {
    this.visible = true;
    this.container.visible = true;
  }

  public hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  public showRestartButton(): void {
    this.restartButton.visible = true;
  }

  public hideRestartButton(): void {
    this.restartButton.visible = false;
  }
}
```

### Integration Points

1. Add to HUDManager for mobile mode
2. Connect pause button to game state
3. Connect restart button to game restart
4. Connect debug button to debug overlay toggle

## Testing

- [ ] Buttons appear on mobile only
- [ ] Pause button toggles game state
- [ ] Restart button appears on game over
- [ ] Debug button toggles debug overlay
- [ ] Buttons positioned correctly with safe areas
- [ ] Touch targets are 44px minimum

## Related Files

- `src/ui/MobileControlsOverlay.ts` (new)
- `src/ui/HUDManager.ts` (modify)
- `src/core/Game.ts` (modify)

## Next Task

Task 7: Performance Detection
