# Task 5: Touch Turret Placement

**Date:** December 1, 2025  
**Priority:** High  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 2 (Touch Input), Task 4 (Mobile HUD)

## Objective

Enhance PlacementManager to work seamlessly with touch input, including visual feedback, drag-to-place, and mobile-optimized ghost preview.

## Current State

- Basic touch support exists (touchmove, touchend)
- No visual feedback during touch
- No drag-to-place workflow
- Ghost preview may be too small on mobile

## Required Changes

### 1. Enhance PlacementManager Touch Support

**File:** `src/game/PlacementManager.ts`

**Changes:**
- Integrate with TouchInputManager
- Add touch-specific visual feedback
- Implement drag-to-place workflow
- Scale ghost preview for mobile
- Add haptic feedback (will be implemented in Task 10)

```typescript
import { TouchInputManager } from '../input';

export class PlacementManager {
  private touchInputManager: TouchInputManager | null = null;
  private isTouchDevice: boolean = false;

  constructor(
    app: Application,
    world: GameWorld,
    resourceManager: ResourceManager,
    touchInputManager?: TouchInputManager
  ) {
    // ... existing code
    this.touchInputManager = touchInputManager || null;
    this.isTouchDevice = 'ontouchstart' in window;
  }

  startPlacing(turretType: number): void {
    // ... existing code
    
    if (this.isTouchDevice && this.touchInputManager) {
      // Use touch input manager for better gesture support
      this.setupTouchPlacement();
    } else {
      // Use existing mouse handlers
      this.setupMousePlacement();
    }
  }

  private setupTouchPlacement(): void {
    if (!this.touchInputManager) return;
    
    // Listen for pan gesture to move ghost
    this.touchInputManager.on('pan', (gesture) => {
      if (this.state === PlacementState.PLACING) {
        this.cursorX = gesture.x;
        this.cursorY = gesture.y;
        this.isValidPosition = this.validatePosition(this.cursorX, this.cursorY);
        this.updatePreview();
      }
    });
    
    // Listen for tap to confirm placement
    this.touchInputManager.on('tap', (gesture) => {
      if (this.state === PlacementState.PLACING) {
        this.cursorX = gesture.x;
        this.cursorY = gesture.y;
        this.confirmPlacement();
      }
    });
  }

  private setupMousePlacement(): void {
    // Existing mouse event setup
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.addEventListener('mousemove', this.boundMouseMove);
      canvas.addEventListener('click', this.boundMouseClick);
    }
  }

  private updateGhostAppearance(): void {
    const config = TURRET_CONFIG[this.currentTurretType];
    const scale = this.isTouchDevice ? 1.5 : 1.0; // Larger on mobile
    const radius = 16 * scale;

    this.ghostSprite.clear();
    this.ghostSprite.circle(0, 0, radius);
    this.ghostSprite.fill({ color: 0x33CC99, alpha: 0.5 });
    this.ghostSprite.stroke({ color: 0x33CC99, width: 2 * scale, alpha: 0.8 });

    this.rangeCircle.clear();
    this.rangeCircle.circle(0, 0, config.range);
    this.rangeCircle.stroke({ color: 0x33CC99, width: 2, alpha: 0.3 });
  }

  cancelPlacement(): void {
    // ... existing code
    
    // Clean up touch listeners
    if (this.touchInputManager) {
      // Touch input manager handles cleanup automatically
    }
  }
}
```

### 2. Connect Mobile HUD to Placement

**File:** `src/ui/MobileHUD.ts`

Add placement manager integration:

```typescript
export class MobileHUD {
  private placementManager: PlacementManager | null = null;

  public setPlacementManager(manager: PlacementManager): void {
    this.placementManager = manager;
    
    // Connect turret buttons
    this.turretButtons.forEach((button, turretType) => {
      this.setTurretButtonCallback(turretType, () => {
        if (this.placementManager) {
          this.placementManager.startPlacing(turretType);
        }
      });
    });
  }
}
```

### 3. Update Game Class Integration

**File:** `src/core/Game.ts`

```typescript
async init(): Promise<void> {
  // ... existing code
  
  // Initialize placement manager with touch support
  this.placementManager = new PlacementManager(
    this.app,
    this.world,
    this.resourceManager,
    this.touchInputManager
  );
  
  // Connect to mobile HUD if in mobile mode
  if (this.hudManager && this.hudManager.getMobileHUD()) {
    this.hudManager.getMobileHUD()!.setPlacementManager(this.placementManager);
  }
}
```

## Testing Checklist

- [ ] Touch to select turret from mobile HUD
- [ ] Drag finger to position ghost preview
- [ ] Ghost preview visible and scaled appropriately
- [ ] Range circle shows turret range
- [ ] Valid/invalid positions indicated by color
- [ ] Tap to confirm placement
- [ ] ESC or back gesture cancels placement
- [ ] Works on both touch and mouse devices
- [ ] No conflicts between touch and mouse input

## Success Criteria

- Turret placement works smoothly with touch
- Visual feedback clear and responsive
- Ghost preview appropriately sized for mobile
- Placement feels natural and intuitive
- No input lag or missed touches
- Works on both mobile and desktop

## Notes for Agent

- Reuse existing PlacementManager logic where possible
- Add touch-specific enhancements
- Ensure backward compatibility with mouse input
- Test on real touch devices if possible
- Consider adding visual touch indicators

## Related Files

- `src/game/PlacementManager.ts` (modify)
- `src/ui/MobileHUD.ts` (modify)
- `src/core/Game.ts` (modify)

## Next Task

After completing this task, proceed to **Task 6: Mobile Controls Overlay** for virtual buttons.
