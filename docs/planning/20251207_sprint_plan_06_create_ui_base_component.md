# Task: Create UI Base Component Abstract Class

**Priority:** 🟠 High  
**Estimated Effort:** Medium (2-3 hours)  
**Dependencies:** None  
**File Focus:** `src/ui/`

---

## Background

The UI components in `src/ui/` have no common base class or interface. Each implements its own patterns for initialization, visibility, positioning, and cleanup. This leads to inconsistent behavior and code duplication.

## Current State

Existing UI components:
- `HUDManager.ts` - 953 lines
- `TurretMenu.ts` - 284 lines
- `TurretUpgradePanel.ts` - 314 lines
- `GameOverScreen.ts` - 307 lines
- `PauseOverlay.ts` - 128 lines
- `MessageLog.ts` - 137 lines
- `HealthBar.ts` - 98 lines
- `OrientationOverlay.ts` - 64 lines
- `MobileControlsOverlay.ts` - 91 lines

Each has varying implementations of:
- `init()` - Different signatures
- `show()` / `hide()` - Sometimes missing
- `update()` - Different signatures
- `destroy()` - Sometimes incomplete
- `handleResize()` - Often missing

---

## Objective

Create `BaseUIComponent` abstract class that standardizes UI component patterns.

---

## Implementation Steps

### Step 1: Create BaseUIComponent.ts

```typescript
// src/ui/BaseUIComponent.ts
import { Application, Container } from 'pixi.js';

export interface UIComponentConfig {
  zIndex?: number;
  initiallyVisible?: boolean;
}

export abstract class BaseUIComponent {
  public readonly container: Container;
  protected app: Application | null = null;
  protected visible: boolean = true;
  
  constructor(config?: UIComponentConfig) {
    this.container = new Container();
    if (config?.zIndex !== undefined) {
      this.container.zIndex = config.zIndex;
    }
    this.visible = config?.initiallyVisible ?? true;
  }
  
  /** Initialize with PixiJS Application */
  init(app: Application): void {
    this.app = app;
    this.create();
    app.stage.addChild(this.container);
    this.container.visible = this.visible;
  }
  
  /** Create component elements - override in subclass */
  protected abstract create(): void;
  
  /** Update component - override if needed */
  update(_data?: unknown): void {}
  
  /** Handle window resize - override if needed */
  handleResize(_width: number, _height: number): void {}
  
  /** Show the component */
  show(): void {
    this.visible = true;
    this.container.visible = true;
  }
  
  /** Hide the component */
  hide(): void {
    this.visible = false;
    this.container.visible = false;
  }
  
  /** Toggle visibility */
  toggle(): void {
    this.visible ? this.hide() : this.show();
  }
  
  /** Check visibility */
  isVisible(): boolean {
    return this.visible;
  }
  
  /** Clean up resources */
  destroy(): void {
    this.container.removeFromParent();
    this.container.destroy({ children: true });
    this.app = null;
  }
}
```

### Step 2: Update One Simple Component (Example: HealthBar)

```typescript
// src/ui/HealthBar.ts
import { BaseUIComponent } from './BaseUIComponent';

interface HealthBarData {
  current: number;
  max: number;
}

export class HealthBar extends BaseUIComponent {
  protected create(): void {
    // Existing creation logic
  }
  
  update(data: HealthBarData): void {
    // Existing update logic
  }
}
```

### Step 3: Migrate Other Simple Components

Apply pattern to:
- `MessageLog.ts`
- `HealthBar.ts` 
- `OrientationOverlay.ts`
- `MobileControlsOverlay.ts`
- `PauseOverlay.ts`

### Step 4: Update Barrel Export

```typescript
// src/ui/index.ts
export { BaseUIComponent } from './BaseUIComponent';
export type { UIComponentConfig } from './BaseUIComponent';
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/ui/BaseUIComponent.ts` | Abstract base class for UI components |

## Files to Modify

| File | Changes |
|------|---------|
| `src/ui/index.ts` | Export BaseUIComponent |
| `src/ui/HealthBar.ts` | Extend BaseUIComponent |
| `src/ui/MessageLog.ts` | Extend BaseUIComponent |
| `src/ui/PauseOverlay.ts` | Extend BaseUIComponent |
| Other simple UI components | Extend BaseUIComponent |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ At least 3 components extend BaseUIComponent
4. ✅ Consistent show/hide/destroy behavior across components

---

## Verification Commands

```bash
# Run all tests
npm test

# Type check
npx tsc --noEmit

# Verify inheritance
grep -rn "extends BaseUIComponent" src/ui/ --include="*.ts"
```

---

## Risk Assessment

- **Medium risk** - Changing inheritance for existing components
- **Mitigation:** Migrate one component at a time, test after each
