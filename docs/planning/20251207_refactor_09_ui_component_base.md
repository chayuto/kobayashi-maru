# Refactor Task: UI Component Base Class

**Date:** December 7, 2025  
**Priority:** 🟡 Medium  
**Complexity:** Medium  
**Estimated Effort:** 3-4 hours  

---

## Problem Statement

UI components in `src/ui/` have no shared base class or interface. Each implements its own patterns for:

- Show/hide visibility
- Position setting
- Container management
- Cleanup/destroy
- Event handling

### Current Inconsistencies

| Component | Show Method | Hide Method | Position Method | Destroy |
|-----------|-------------|-------------|-----------------|---------|
| TurretMenu | N/A | N/A | setPosition() | destroy() |
| TurretUpgradePanel | show() | hide() | setPosition() | destroy() |
| GameOverScreen | show() | hide() | N/A | N/A |
| PauseOverlay | show() | hide() | N/A | destroy() |
| MessageLog | N/A | N/A | setPosition() | N/A |
| MobileControlsOverlay | show() | hide() | updateLayout() | destroy() |

---

## Impact

- **Inconsistent API:** Different method names for same operations
- **Code Duplication:** Each component reimplements visibility logic
- **Missing Cleanup:** Some components lack destroy() methods
- **Hard to Extend:** No template for new UI components


---

## Proposed Solution

Create a base class and interface that all UI components extend:

```
src/ui/
├── UIComponent.ts      (NEW - base class)
├── types.ts            (UPDATE - add interfaces)
├── HUDManager.ts
├── TurretMenu.ts       (UPDATE - extend base)
├── TurretUpgradePanel.ts
├── GameOverScreen.ts
├── PauseOverlay.ts
├── MessageLog.ts
├── MobileControlsOverlay.ts
└── ...
```

---

## Implementation

### Step 1: Create UIComponent Interface and Base Class

```typescript
// src/ui/UIComponent.ts
import { Container, Application } from 'pixi.js';

/**
 * Interface for all UI components
 */
export interface IUIComponent {
  readonly container: Container;
  readonly isVisible: boolean;
  
  init(app: Application): void;
  show(): void;
  hide(): void;
  setPosition(x: number, y: number): void;
  setScale(scale: number): void;
  update?(deltaTime: number): void;
  destroy(): void;
}

/**
 * Base class for UI components
 * Provides common functionality for visibility, positioning, and lifecycle
 */
export abstract class UIComponent implements IUIComponent {
  public readonly container: Container;
  protected app: Application | null = null;
  protected _isVisible: boolean = true;
  protected _scale: number = 1;

  constructor() {
    this.container = new Container();
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Initialize the component with PixiJS Application
   * Override to add custom initialization
   */
  init(app: Application): void {
    this.app = app;
    this.createElements();
  }

  /**
   * Create UI elements - override in subclass
   */
  protected abstract createElements(): void;

  /**
   * Show the component
   */
  show(): void {
    this._isVisible = true;
    this.container.visible = true;
    this.onShow();
  }

  /**
   * Hide the component
   */
  hide(): void {
    this._isVisible = false;
    this.container.visible = false;
    this.onHide();
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this._isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set component position
   */
  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  /**
   * Set component scale
   */
  setScale(scale: number): void {
    this._scale = scale;
    this.container.scale.set(scale);
  }

  /**
   * Called when component is shown - override for custom behavior
   */
  protected onShow(): void {}

  /**
   * Called when component is hidden - override for custom behavior
   */
  protected onHide(): void {}

  /**
   * Update component - override if component needs per-frame updates
   */
  update(_deltaTime: number): void {}

  /**
   * Clean up resources
   */
  destroy(): void {
    this.container.destroy({ children: true });
    this.app = null;
  }
}
```

### Step 2: Update TurretUpgradePanel to Extend Base

```typescript
// src/ui/TurretUpgradePanel.ts
import { Graphics, Text, TextStyle } from 'pixi.js';
import { UIComponent } from './UIComponent';
import { UI_STYLES } from './styles';

export class TurretUpgradePanel extends UIComponent {
  private background!: Graphics;
  private titleText!: Text;
  private statsText!: Text;
  // ... other properties

  constructor() {
    super();
    this.container.visible = false; // Hidden by default
    this._isVisible = false;
  }

  protected createElements(): void {
    this.createBackground();
    this.createTitle();
    this.createStats();
    this.createUpgradeButtons();
    this.createSellButton();
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.container.addChild(this.background);
  }

  // ... rest of implementation

  /**
   * Show panel with turret data
   */
  showWithData(info: TurretUpgradeInfo, resources: number, refund: number): void {
    this.updateContent(info, resources, refund);
    this.show(); // Use base class method
  }

  protected onShow(): void {
    // Play show animation or sound if needed
  }

  protected onHide(): void {
    // Clean up any temporary state
  }
}
```

### Step 3: Update GameOverScreen to Extend Base

```typescript
// src/ui/GameOverScreen.ts
import { UIComponent } from './UIComponent';

export class GameOverScreen extends UIComponent {
  private onRestartCallback: (() => void) | null = null;

  constructor() {
    super();
    this.container.visible = false;
    this._isVisible = false;
  }

  protected createElements(): void {
    this.createBackground();
    this.createTitle();
    this.createScoreDisplay();
    this.createRestartButton();
  }

  /**
   * Show with score data
   */
  showWithScore(score: ScoreData, isNewHighScore: boolean, previousBest: number): void {
    this.updateScoreDisplay(score, isNewHighScore, previousBest);
    this.show();
  }

  setOnRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  // ... implementation
}
```

### Step 4: Update PauseOverlay to Extend Base

```typescript
// src/ui/PauseOverlay.ts
import { UIComponent } from './UIComponent';

export class PauseOverlay extends UIComponent {
  private onResumeCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onQuitCallback: (() => void) | null = null;

  constructor() {
    super();
    this.container.visible = false;
    this._isVisible = false;
  }

  protected createElements(): void {
    this.createDimBackground();
    this.createPausePanel();
    this.createButtons();
  }

  // Callback setters
  setOnResume(callback: () => void): void { this.onResumeCallback = callback; }
  setOnRestart(callback: () => void): void { this.onRestartCallback = callback; }
  setOnQuit(callback: () => void): void { this.onQuitCallback = callback; }
}
```

### Step 5: Create UIManager for Centralized Control

```typescript
// src/ui/UIManager.ts
import { Application } from 'pixi.js';
import { IUIComponent } from './UIComponent';

/**
 * Manages all UI components
 */
export class UIManager {
  private components: Map<string, IUIComponent> = new Map();
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Register a UI component
   */
  register(name: string, component: IUIComponent): void {
    component.init(this.app);
    this.app.stage.addChild(component.container);
    this.components.set(name, component);
  }

  /**
   * Get a component by name
   */
  get<T extends IUIComponent>(name: string): T | undefined {
    return this.components.get(name) as T | undefined;
  }

  /**
   * Show a component by name
   */
  show(name: string): void {
    this.components.get(name)?.show();
  }

  /**
   * Hide a component by name
   */
  hide(name: string): void {
    this.components.get(name)?.hide();
  }

  /**
   * Hide all components
   */
  hideAll(): void {
    for (const component of this.components.values()) {
      component.hide();
    }
  }

  /**
   * Update all components
   */
  update(deltaTime: number): void {
    for (const component of this.components.values()) {
      component.update?.(deltaTime);
    }
  }

  /**
   * Apply scale to all components
   */
  setGlobalScale(scale: number): void {
    for (const component of this.components.values()) {
      component.setScale(scale);
    }
  }

  /**
   * Destroy all components
   */
  destroy(): void {
    for (const component of this.components.values()) {
      component.destroy();
    }
    this.components.clear();
  }
}
```

---

## Migration Strategy

1. Create `UIComponent.ts` base class
2. Update one component at a time to extend base
3. Test each component after migration
4. Create `UIManager` once all components migrated
5. Update `HUDManager` to use `UIManager`

---

## Validation Criteria

1. **All UI components extend UIComponent** or implement IUIComponent
2. **Consistent API** - show(), hide(), setPosition(), destroy() on all
3. **No functionality regression** - all UI works as before
4. **Proper cleanup** - all components have working destroy()

---

## Files to Create

- `src/ui/UIComponent.ts`
- `src/ui/UIManager.ts`

## Files to Modify

- `src/ui/TurretUpgradePanel.ts` - Extend UIComponent
- `src/ui/GameOverScreen.ts` - Extend UIComponent
- `src/ui/PauseOverlay.ts` - Extend UIComponent
- `src/ui/TurretMenu.ts` - Extend UIComponent
- `src/ui/MessageLog.ts` - Extend UIComponent
- `src/ui/MobileControlsOverlay.ts` - Extend UIComponent
- `src/ui/index.ts` - Export new classes
