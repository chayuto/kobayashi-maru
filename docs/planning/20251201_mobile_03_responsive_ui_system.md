# Task 3: Responsive UI System

**Date:** December 1, 2025  
**Priority:** Critical  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1 (Viewport), Task 2 (Touch Input)

## Objective

Create a responsive UI system that adapts layout, sizing, and positioning based on screen size. Ensure all UI elements are readable and touchable on mobile devices.

## Current State

- Fixed UI positions and sizes for 1920x1080
- UI elements too small for mobile touch targets (minimum 44x44px)
- Text sizes not responsive
- No breakpoint system
- HUD panels positioned absolutely

## Architecture

### ResponsiveUIManager Class

**Location:** `src/ui/ResponsiveUIManager.ts`

Manages screen size detection, breakpoints, and provides scaling utilities.

```typescript
export enum ScreenSize {
  SMALL = 'small',      // < 480px width (iPhone SE)
  MEDIUM = 'medium',    // 480-768px (standard phones)
  LARGE = 'large',      // 768-1024px (tablets)
  XLARGE = 'xlarge'     // > 1024px (desktop)
}

export interface ResponsiveConfig {
  screenSize: ScreenSize;
  width: number;
  height: number;
  scale: number;
  isMobile: boolean;
  isPortrait: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export class ResponsiveUIManager {
  private config: ResponsiveConfig;
  private listeners: Array<(config: ResponsiveConfig) => void> = [];
  
  constructor();
  
  public init(): void;
  public getConfig(): ResponsiveConfig;
  public getScreenSize(): ScreenSize;
  public isMobile(): boolean;
  public getScale(): number;
  public scaleValue(value: number): number;
  public scaleFontSize(baseSize: number): number;
  public getTouchTargetSize(): number;
  public onChange(callback: (config: ResponsiveConfig) => void): void;
  private updateConfig(): void;
  private detectScreenSize(): ScreenSize;
  private calculateScale(): number;
}
```

## Implementation

### 1. Create ResponsiveUIManager

**File:** `src/ui/ResponsiveUIManager.ts`

```typescript
export enum ScreenSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge'
}

export interface ResponsiveConfig {
  screenSize: ScreenSize;
  width: number;
  height: number;
  scale: number;
  isMobile: boolean;
  isPortrait: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export class ResponsiveUIManager {
  private config: ResponsiveConfig;
  private listeners: Array<(config: ResponsiveConfig) => void> = [];
  private boundResize: () => void;
  private boundOrientationChange: () => void;

  constructor() {
    this.config = this.createInitialConfig();
    this.boundResize = this.handleResize.bind(this);
    this.boundOrientationChange = this.handleOrientationChange.bind(this);
  }

  public init(): void {
    this.updateConfig();
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('orientationchange', this.boundOrientationChange);
  }

  public destroy(): void {
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('orientationchange', this.boundOrientationChange);
    this.listeners = [];
  }

  private createInitialConfig(): ResponsiveConfig {
    return {
      screenSize: ScreenSize.XLARGE,
      width: window.innerWidth,
      height: window.innerHeight,
      scale: 1,
      isMobile: false,
      isPortrait: false,
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    };
  }

  private handleResize(): void {
    this.updateConfig();
  }

  private handleOrientationChange(): void {
    // Delay to allow orientation change to complete
    setTimeout(() => {
      this.updateConfig();
    }, 100);
  }

  private updateConfig(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenSize = this.detectScreenSize();
    const scale = this.calculateScale();
    const isMobile = screenSize === ScreenSize.SMALL || screenSize === ScreenSize.MEDIUM;
    const isPortrait = height > width;

    this.config = {
      screenSize,
      width,
      height,
      scale,
      isMobile,
      isPortrait,
      safeAreaInsets: this.getSafeAreaInsets()
    };

    // Notify listeners
    this.listeners.forEach(callback => callback(this.config));
  }

  private detectScreenSize(): ScreenSize {
    const width = window.innerWidth;
    
    if (width < 480) return ScreenSize.SMALL;
    if (width < 768) return ScreenSize.MEDIUM;
    if (width < 1024) return ScreenSize.LARGE;
    return ScreenSize.XLARGE;
  }

  private calculateScale(): number {
    const width = window.innerWidth;
    const screenSize = this.detectScreenSize();
    
    // Scale factor based on screen size
    switch (screenSize) {
      case ScreenSize.SMALL:
        return 0.5; // 50% scale for small phones
      case ScreenSize.MEDIUM:
        return 0.65; // 65% scale for standard phones
      case ScreenSize.LARGE:
        return 0.85; // 85% scale for tablets
      case ScreenSize.XLARGE:
      default:
        return 1.0; // 100% scale for desktop
    }
  }

  private getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    // Try to get CSS env() values for safe area insets
    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
    };
  }

  public getConfig(): ResponsiveConfig {
    return { ...this.config };
  }

  public getScreenSize(): ScreenSize {
    return this.config.screenSize;
  }

  public isMobile(): boolean {
    return this.config.isMobile;
  }

  public getScale(): number {
    return this.config.scale;
  }

  public scaleValue(value: number): number {
    return value * this.config.scale;
  }

  public scaleFontSize(baseSize: number): number {
    // Font sizes scale slightly less aggressively
    const fontScale = 0.7 + (this.config.scale * 0.3);
    return Math.max(10, baseSize * fontScale); // Minimum 10px
  }

  public getTouchTargetSize(): number {
    // Minimum touch target size (44px on iOS, 48px on Android)
    // Return scaled value but never less than 44px
    return Math.max(44, this.scaleValue(60));
  }

  public onChange(callback: (config: ResponsiveConfig) => void): void {
    this.listeners.push(callback);
  }

  public offChange(callback: (config: ResponsiveConfig) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
}
```

### 2. Update UI Styles

**File:** `src/ui/styles.ts`

Add responsive style utilities:

```typescript
import { ResponsiveUIManager, ScreenSize } from './ResponsiveUIManager';

// Existing UI_STYLES...

/**
 * Get responsive UI styles based on screen size
 */
export function getResponsiveStyles(responsiveManager: ResponsiveUIManager) {
  const config = responsiveManager.getConfig();
  const scale = config.scale;
  
  return {
    // Scaled padding
    PADDING: Math.max(8, UI_STYLES.PADDING * scale),
    
    // Scaled font sizes
    FONT_SIZE_SMALL: responsiveManager.scaleFontSize(UI_STYLES.FONT_SIZE_SMALL),
    FONT_SIZE_MEDIUM: responsiveManager.scaleFontSize(UI_STYLES.FONT_SIZE_MEDIUM),
    FONT_SIZE_LARGE: responsiveManager.scaleFontSize(UI_STYLES.FONT_SIZE_LARGE),
    
    // Scaled bar dimensions
    BAR_WIDTH: responsiveManager.scaleValue(UI_STYLES.BAR_WIDTH),
    BAR_HEIGHT: Math.max(8, responsiveManager.scaleValue(UI_STYLES.BAR_HEIGHT)),
    
    // Touch target size
    TOUCH_TARGET_SIZE: responsiveManager.getTouchTargetSize(),
    
    // Panel sizes based on screen size
    PANEL_WIDTH: config.isMobile ? 
      Math.min(200, config.width * 0.4) : 
      200,
    
    // Safe area insets
    SAFE_AREA: config.safeAreaInsets,
    
    // Layout mode
    COMPACT_MODE: config.screenSize === ScreenSize.SMALL,
    
    // Colors (unchanged)
    COLORS: UI_STYLES.COLORS,
    FONT_FAMILY: UI_STYLES.FONT_FAMILY
  };
}
```

### 3. Update HUDManager for Responsive Layout

**File:** `src/ui/HUDManager.ts`

Modify HUDManager to use ResponsiveUIManager:

```typescript
import { ResponsiveUIManager, getResponsiveStyles } from './ResponsiveUIManager';

export class HUDManager {
  // ... existing properties
  private responsiveManager: ResponsiveUIManager;
  private responsiveStyles: ReturnType<typeof getResponsiveStyles>;

  constructor() {
    this.container = new Container();
    this.responsiveManager = new ResponsiveUIManager();
  }

  init(app: Application): void {
    this.app = app;
    this.responsiveManager.init();
    this.responsiveStyles = getResponsiveStyles(this.responsiveManager);
    
    // Listen for screen size changes
    this.responsiveManager.onChange(() => {
      this.handleResize();
    });
    
    // Add HUD container to stage
    this.app.stage.addChild(this.container);
    
    // Create all HUD elements with responsive styles
    this.createAllPanels();
  }

  private handleResize(): void {
    // Update responsive styles
    this.responsiveStyles = getResponsiveStyles(this.responsiveManager);
    
    // Recreate all panels with new sizes
    this.container.removeChildren();
    this.createAllPanels();
  }

  private createAllPanels(): void {
    const config = this.responsiveManager.getConfig();
    
    if (config.isMobile) {
      // Mobile layout - compact, essential info only
      this.createMobileLayout();
    } else {
      // Desktop layout - full panels
      this.createDesktopLayout();
    }
  }

  private createMobileLayout(): void {
    // Simplified mobile HUD
    // Top bar: Wave + Resources
    // Bottom bar: KM Status + Quick Stats
    this.createMobileTopBar();
    this.createMobileBottomBar();
    this.createMobileTurretMenu();
  }

  private createDesktopLayout(): void {
    // Existing desktop layout
    this.createTopLeftPanel();
    this.createTopRightPanel();
    this.createBottomLeftPanel();
    this.createBottomCenterPanel();
    this.createBottomRightPanel();
  }

  // New mobile-specific panel methods
  private createMobileTopBar(): void {
    // Compact top bar with wave info and resources
    // Implementation details...
  }

  private createMobileBottomBar(): void {
    // Compact bottom bar with KM status
    // Implementation details...
  }

  private createMobileTurretMenu(): void {
    // Mobile-optimized turret menu (bottom sheet style)
    // Implementation details...
  }

  destroy(): void {
    this.responsiveManager.destroy();
    // ... existing destroy code
  }
}
```

### 4. Update TurretMenu for Touch Targets

**File:** `src/ui/TurretMenu.ts`

Make turret buttons touch-friendly:

```typescript
export class TurretMenu {
  private responsiveManager: ResponsiveUIManager | null = null;

  constructor(responsiveManager?: ResponsiveUIManager) {
    this.container = new Container();
    this.responsiveManager = responsiveManager || null;
    this.createMenu();
  }

  private createMenu(): void {
    const touchTargetSize = this.responsiveManager?.getTouchTargetSize() || 60;
    const buttonWidth = Math.max(180, touchTargetSize * 3);
    const buttonHeight = Math.max(60, touchTargetSize);
    
    // Rest of implementation with scaled sizes...
  }
}
```

### 5. Integrate with Game Class

**File:** `src/core/Game.ts`

```typescript
import { ResponsiveUIManager } from '../ui/ResponsiveUIManager';

export class Game {
  private responsiveUIManager: ResponsiveUIManager;

  constructor(containerId: string = 'app') {
    // ... existing code
    this.responsiveUIManager = new ResponsiveUIManager();
  }

  async init(): Promise<void> {
    // ... existing code
    
    // Initialize responsive UI
    this.responsiveUIManager.init();
    
    // Pass to HUD manager
    if (this.hudManager) {
      this.hudManager.init(this.app, this.responsiveUIManager);
    }
  }

  destroy(): void {
    this.responsiveUIManager.destroy();
    // ... existing code
  }
}
```

## Testing

### Unit Tests

**File:** `src/__tests__/ResponsiveUIManager.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ResponsiveUIManager, ScreenSize } from '../ui/ResponsiveUIManager';

describe('ResponsiveUIManager', () => {
  let manager: ResponsiveUIManager;

  beforeEach(() => {
    manager = new ResponsiveUIManager();
  });

  it('should initialize with default config', () => {
    manager.init();
    const config = manager.getConfig();
    expect(config).toBeDefined();
    expect(config.width).toBeGreaterThan(0);
    expect(config.height).toBeGreaterThan(0);
  });

  it('should detect mobile screens', () => {
    // Would need to mock window.innerWidth
    manager.init();
    expect(typeof manager.isMobile()).toBe('boolean');
  });

  it('should scale values correctly', () => {
    manager.init();
    const scaled = manager.scaleValue(100);
    expect(scaled).toBeGreaterThan(0);
  });

  it('should provide minimum touch target size', () => {
    manager.init();
    const size = manager.getTouchTargetSize();
    expect(size).toBeGreaterThanOrEqual(44);
  });
});
```

### Manual Testing Checklist

- [ ] UI scales correctly on different screen sizes
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable on small screens
- [ ] Layout switches between mobile/desktop modes
- [ ] Safe area insets respected on iOS
- [ ] Orientation changes handled smoothly
- [ ] No UI overlap or clipping
- [ ] All panels visible and accessible

## Success Criteria

- ResponsiveUIManager detects screen size correctly
- UI elements scale appropriately for mobile
- Touch targets meet minimum size requirements (44px)
- Layout adapts between mobile and desktop modes
- Safe area insets properly applied
- Orientation changes handled gracefully
- No performance issues from resize events
- Unit tests passing

## Notes for Agent

- Focus on making UI touch-friendly first
- Ensure minimum touch target sizes (44x44px)
- Test on various screen sizes using browser dev tools
- Consider creating simplified mobile layouts
- Keep desktop experience unchanged
- Add debouncing to resize handler if needed

## Related Files

- `src/ui/ResponsiveUIManager.ts` (new)
- `src/ui/styles.ts` (modify)
- `src/ui/HUDManager.ts` (modify)
- `src/ui/TurretMenu.ts` (modify)
- `src/core/Game.ts` (modify)
- `src/__tests__/ResponsiveUIManager.test.ts` (new)

## Next Task

After completing this task, proceed to **Task 4: Mobile HUD Redesign** to create mobile-optimized HUD layouts.
