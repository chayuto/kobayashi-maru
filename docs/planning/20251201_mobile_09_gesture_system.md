# Task 9: Touch Gesture System

**Date:** December 1, 2025  
**Priority:** Medium  
**Estimated Time:** 45 minutes  
**Dependencies:** Task 2 (Touch Input Manager)

## Objective

Implement advanced touch gestures for enhanced mobile UX: pinch-to-zoom (camera), pan (camera), swipe (menu navigation).

## Implementation

### 1. Add Camera Control to Game

**File:** `src/core/CameraController.ts` (new)

```typescript
export class CameraController {
  private app: Application;
  private minZoom: number = 0.5;
  private maxZoom: number = 2.0;
  private currentZoom: number = 1.0;
  private panX: number = 0;
  private panY: number = 0;
  private enabled: boolean = false;

  constructor(app: Application) {
    this.app = app;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  public zoom(scale: number, centerX: number, centerY: number): void {
    if (!this.enabled) return;
    
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, scale));
    this.currentZoom = newZoom;
    
    this.app.stage.scale.set(newZoom);
    // Adjust position to zoom toward center point
  }

  public pan(deltaX: number, deltaY: number): void {
    if (!this.enabled) return;
    
    this.panX += deltaX;
    this.panY += deltaY;
    
    // Clamp to world bounds
    this.app.stage.position.set(this.panX, this.panY);
  }

  public reset(): void {
    this.currentZoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.app.stage.scale.set(1.0);
    this.app.stage.position.set(0, 0);
  }
}
```

### 2. Connect Gestures to Camera

**File:** `src/core/Game.ts`

```typescript
import { CameraController } from './CameraController';

export class Game {
  private cameraController: CameraController;

  constructor(containerId: string = 'app') {
    // ... existing code
    this.cameraController = new CameraController(this.app);
  }

  async init(): Promise<void> {
    // ... existing code
    
    // Enable camera control on mobile
    const isMobile = this.responsiveUIManager.isMobile();
    this.cameraController.setEnabled(isMobile);
    
    // Connect touch gestures to camera
    if (this.touchInputManager && isMobile) {
      this.touchInputManager.on('pinch', (gesture) => {
        if (gesture.scale) {
          this.cameraController.zoom(gesture.scale, gesture.x, gesture.y);
        }
      });
      
      // Pan only when not placing turrets
      this.touchInputManager.on('pan', (gesture) => {
        if (!this.placementManager?.isPlacing() && gesture.deltaX && gesture.deltaY) {
          this.cameraController.pan(gesture.deltaX, gesture.deltaY);
        }
      });
    }
  }
}
```

### 3. Add Swipe Navigation for Menus

**File:** `src/ui/MobileHUD.ts`

```typescript
export class MobileHUD {
  private touchInputManager: TouchInputManager | null = null;
  private menuExpanded: boolean = false;

  public setTouchInputManager(manager: TouchInputManager): void {
    this.touchInputManager = manager;
    
    // Swipe up to expand turret menu
    this.touchInputManager.on('swipe', (gesture) => {
      if (gesture.direction === 'up' && !this.menuExpanded) {
        this.expandMenu();
      } else if (gesture.direction === 'down' && this.menuExpanded) {
        this.collapseMenu();
      }
    });
  }

  private expandMenu(): void {
    this.menuExpanded = true;
    // Animate turret bar expansion
    // Show additional info/options
  }

  private collapseMenu(): void {
    this.menuExpanded = false;
    // Animate turret bar collapse
  }
}
```

## Testing

- [ ] Pinch gesture zooms camera
- [ ] Pan gesture moves camera
- [ ] Swipe up expands menu
- [ ] Swipe down collapses menu
- [ ] Gestures don't interfere with turret placement
- [ ] Camera resets properly
- [ ] Smooth animations
- [ ] No gesture conflicts

## Success Criteria

- Pinch-to-zoom works smoothly
- Pan gesture moves camera
- Swipe gestures navigate menus
- No conflicts with other touch interactions
- Camera bounds respected
- Gestures feel natural and responsive

## Related Files

- `src/core/CameraController.ts` (new)
- `src/core/Game.ts` (modify)
- `src/ui/MobileHUD.ts` (modify)

## Next Task

Task 10: Haptic Feedback
