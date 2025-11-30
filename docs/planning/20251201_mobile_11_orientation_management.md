# Task 11: Orientation Management

**Date:** December 1, 2025  
**Priority:** Medium  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 3 (Responsive UI)

## Objective

Handle device orientation changes, encourage landscape mode, and provide orientation lock where supported.

## Implementation

### Create OrientationManager

**File:** `src/core/OrientationManager.ts`

```typescript
export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

export class OrientationManager {
  private currentOrientation: Orientation;
  private preferredOrientation: Orientation = Orientation.LANDSCAPE;
  private listeners: Array<(orientation: Orientation) => void> = [];
  private warningOverlay: HTMLDivElement | null = null;

  constructor() {
    this.currentOrientation = this.detectOrientation();
  }

  public init(): void {
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Check initial orientation
    this.checkOrientation();
  }

  public destroy(): void {
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.hideWarning();
  }

  private detectOrientation(): Orientation {
    if (window.innerWidth > window.innerHeight) {
      return Orientation.LANDSCAPE;
    }
    return Orientation.PORTRAIT;
  }

  private handleOrientationChange(): void {
    setTimeout(() => {
      this.checkOrientation();
    }, 100);
  }

  private handleResize(): void {
    this.checkOrientation();
  }

  private checkOrientation(): void {
    const newOrientation = this.detectOrientation();
    
    if (newOrientation !== this.currentOrientation) {
      this.currentOrientation = newOrientation;
      this.notifyListeners();
    }

    // Show warning if in portrait mode
    if (this.currentOrientation === Orientation.PORTRAIT && this.isMobile()) {
      this.showWarning();
    } else {
      this.hideWarning();
    }
  }

  private isMobile(): boolean {
    return /iPhone|iPad|Android/i.test(navigator.userAgent);
  }

  private showWarning(): void {
    if (this.warningOverlay) return;

    this.warningOverlay = document.createElement('div');
    this.warningOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: #99CCFF;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding: 20px;
    `;

    this.warningOverlay.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📱 ↻</div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
        ROTATE DEVICE
      </div>
      <div style="font-size: 16px; color: #FF9900;">
        Please rotate your device to landscape mode<br>
        for the best experience
      </div>
    `;

    document.body.appendChild(this.warningOverlay);
  }

  private hideWarning(): void {
    if (this.warningOverlay) {
      document.body.removeChild(this.warningOverlay);
      this.warningOverlay = null;
    }
  }

  public async lockOrientation(orientation: Orientation): Promise<boolean> {
    // Try to lock orientation using Screen Orientation API
    if ('orientation' in screen && 'lock' in screen.orientation) {
      try {
        const lockType = orientation === Orientation.LANDSCAPE 
          ? 'landscape' 
          : 'portrait';
        await (screen.orientation as any).lock(lockType);
        return true;
      } catch (error) {
        console.warn('Orientation lock not supported or failed:', error);
        return false;
      }
    }
    return false;
  }

  public async unlockOrientation(): Promise<void> {
    if ('orientation' in screen && 'unlock' in screen.orientation) {
      try {
        (screen.orientation as any).unlock();
      } catch (error) {
        console.warn('Orientation unlock failed:', error);
      }
    }
  }

  public getOrientation(): Orientation {
    return this.currentOrientation;
  }

  public isLandscape(): boolean {
    return this.currentOrientation === Orientation.LANDSCAPE;
  }

  public isPortrait(): boolean {
    return this.currentOrientation === Orientation.PORTRAIT;
  }

  public onChange(callback: (orientation: Orientation) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentOrientation));
  }
}
```

### Integrate with Game

**File:** `src/core/Game.ts`

```typescript
import { OrientationManager, Orientation } from './OrientationManager';

export class Game {
  private orientationManager: OrientationManager;

  constructor(containerId: string = 'app') {
    // ... existing code
    this.orientationManager = new OrientationManager();
  }

  async init(): Promise<void> {
    // ... existing code
    
    // Initialize orientation manager
    this.orientationManager.init();
    
    // Try to lock to landscape on mobile
    if (this.responsiveUIManager.isMobile()) {
      await this.orientationManager.lockOrientation(Orientation.LANDSCAPE);
    }
    
    // Listen for orientation changes
    this.orientationManager.onChange((orientation) => {
      console.log(`Orientation changed to: ${orientation}`);
      // Trigger resize/layout update
      this.handleResize();
    });
  }

  destroy(): void {
    this.orientationManager.destroy();
    // ... existing code
  }
}
```

### Add to ResponsiveUIManager

**File:** `src/ui/ResponsiveUIManager.ts`

```typescript
export interface ResponsiveConfig {
  // ... existing properties
  orientation: 'portrait' | 'landscape';
}

export class ResponsiveUIManager {
  private updateConfig(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenSize = this.detectScreenSize();
    const scale = this.calculateScale();
    const isMobile = screenSize === ScreenSize.SMALL || screenSize === ScreenSize.MEDIUM;
    const isPortrait = height > width;
    const orientation = isPortrait ? 'portrait' : 'landscape';

    this.config = {
      screenSize,
      width,
      height,
      scale,
      isMobile,
      isPortrait,
      orientation,
      safeAreaInsets: this.getSafeAreaInsets()
    };

    this.listeners.forEach(callback => callback(this.config));
  }
}
```

## Testing

- [ ] Orientation detected correctly
- [ ] Warning shown in portrait mode on mobile
- [ ] Warning hidden in landscape mode
- [ ] Orientation lock works (where supported)
- [ ] Layout updates on orientation change
- [ ] No issues on desktop
- [ ] Smooth transitions
- [ ] Warning overlay styled correctly

## Success Criteria

- Orientation changes detected
- Portrait warning displayed on mobile
- Landscape mode encouraged
- Orientation lock attempted on mobile
- Layout adapts to orientation changes
- No impact on desktop experience

## Notes

- Screen Orientation API has limited support
- iOS Safari doesn't support orientation lock
- Android Chrome supports orientation lock in fullscreen
- Warning overlay is fallback for unsupported devices
- Desktop should ignore orientation management

## Related Files

- `src/core/OrientationManager.ts` (new)
- `src/core/Game.ts` (modify)
- `src/core/index.ts` (export)
- `src/ui/ResponsiveUIManager.ts` (modify)

## Next Task

Task 12: Mobile Testing & Polish
