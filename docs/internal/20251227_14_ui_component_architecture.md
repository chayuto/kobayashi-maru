# UI Component Architecture for AI Agents

**Date:** 2025-12-27  
**Category:** UI Architecture  
**Priority:** MEDIUM  
**Effort:** Medium  

---

## Executive Summary

Consistent UI component patterns make it easier for AI coding agents to create and modify user interface elements. This document outlines best practices for UI component design, state management, and PixiJS integration.

---

## Current State Assessment

### ✅ Good UI Patterns

1. **Panel-Based Architecture** - UI split into focused panels
2. **HUDManager Coordination** - Central HUD management
3. **Event-Driven Updates** - EventBus for UI updates
4. **Responsive Design** - ResponsiveUIManager exists

### ⚠️ Enhancement Opportunities

1. **No Base Component** - No shared component class
2. **Inconsistent Lifecycle** - Some components lack destroy()
3. **Style Duplication** - Styles defined in multiple places
4. **Large Files** - HUDManager.ts is 838 lines

---

## Recommendations for AI Coding Agents

### 1. Base UI Component Class

**Recommendation:** Create a base class for all UI components.

**Pattern:**
```typescript
// src/ui/base/UIComponent.ts
import { Container, Text, Graphics } from 'pixi.js';
import { EventBus } from '../../core/EventBus';
import { UI_CONFIG } from '../../config';

/**
 * Base class for all UI components.
 * Provides common functionality for lifecycle, positioning, and events.
 */
export abstract class UIComponent {
    /** Root container for this component */
    public readonly container: Container;
    
    /** Whether the component is currently visible */
    protected _visible: boolean = true;
    
    /** Event subscriptions for cleanup */
    protected eventSubscriptions: Array<{ event: string; handler: Function }> = [];
    
    constructor() {
        this.container = new Container();
    }

    // =========================================
    // ABSTRACT METHODS (must implement)
    // =========================================
    
    /**
     * Build the component's visual elements.
     * Called once during initialization.
     */
    protected abstract build(): void;
    
    /**
     * Update the component with new data.
     * Called when data changes.
     */
    public abstract update(data: unknown): void;

    // =========================================
    // LIFECYCLE METHODS
    // =========================================
    
    /**
     * Initialize the component.
     * Calls build() and sets up initial state.
     */
    public init(): void {
        this.build();
    }
    
    /**
     * Destroy the component and clean up resources.
     */
    public destroy(): void {
        // Unsubscribe from all events
        const eventBus = EventBus.getInstance();
        for (const { event, handler } of this.eventSubscriptions) {
            eventBus.off(event as never, handler as never);
        }
        this.eventSubscriptions = [];
        
        // Destroy container and children
        this.container.destroy({ children: true });
    }

    // =========================================
    // VISIBILITY
    // =========================================
    
    public show(): void {
        this._visible = true;
        this.container.visible = true;
    }
    
    public hide(): void {
        this._visible = false;
        this.container.visible = false;
    }
    
    public get visible(): boolean {
        return this._visible;
    }

    // =========================================
    // POSITIONING
    // =========================================
    
    public setPosition(x: number, y: number): void {
        this.container.x = x;
        this.container.y = y;
    }
    
    public setAnchor(anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'): void {
        // Adjust position based on anchor
        const { width, height } = this.container.getBounds();
        switch (anchor) {
            case 'top-right':
                this.container.x -= width;
                break;
            case 'bottom-left':
                this.container.y -= height;
                break;
            case 'bottom-right':
                this.container.x -= width;
                this.container.y -= height;
                break;
            case 'center':
                this.container.x -= width / 2;
                this.container.y -= height / 2;
                break;
        }
    }

    // =========================================
    // EVENT HELPERS
    // =========================================
    
    /**
     * Subscribe to an event with automatic cleanup tracking.
     */
    protected subscribe<T>(event: string, handler: (payload: T) => void): void {
        EventBus.getInstance().on(event as never, handler as never);
        this.eventSubscriptions.push({ event, handler });
    }

    // =========================================
    // COMMON UI ELEMENTS
    // =========================================
    
    /**
     * Create a text element with standard styling.
     */
    protected createText(
        text: string,
        options: { fontSize?: number; color?: number; fontFamily?: string } = {}
    ): Text {
        return new Text({
            text,
            style: {
                fontSize: options.fontSize ?? UI_CONFIG.FONTS.SIZE.NORMAL,
                fill: options.color ?? UI_CONFIG.COLORS.TEXT,
                fontFamily: options.fontFamily ?? UI_CONFIG.FONTS.FAMILY,
            },
        });
    }
    
    /**
     * Create a panel background.
     */
    protected createBackground(
        width: number,
        height: number,
        options: { color?: number; alpha?: number; cornerRadius?: number } = {}
    ): Graphics {
        const bg = new Graphics();
        bg.roundRect(0, 0, width, height, options.cornerRadius ?? 8);
        bg.fill({ color: options.color ?? UI_CONFIG.COLORS.PANEL_BACKGROUND, alpha: options.alpha ?? 0.8 });
        return bg;
    }
}
```

**Why Agent-Friendly:**
- Common patterns in one place
- Lifecycle is consistent
- Event cleanup is automatic

**Action Items:**
- [ ] Create UIComponent base class
- [ ] Migrate existing panels
- [ ] Document in AGENTS.md

---

### 2. Panel Component Template

**Recommendation:** Use consistent panel structure.

**Template:**
```typescript
// src/ui/panels/ExamplePanel.ts
import { Container, Text, Graphics } from 'pixi.js';
import { UIComponent } from '../base/UIComponent';
import { UI_CONFIG } from '../../config';

export interface ExamplePanelData {
    value: number;
    label: string;
}

/**
 * Example panel showing a labeled value.
 */
export class ExamplePanel extends UIComponent {
    private background!: Graphics;
    private labelText!: Text;
    private valueText!: Text;

    protected build(): void {
        // Create background
        this.background = this.createBackground(
            UI_CONFIG.PANELS.EXAMPLE.WIDTH,
            UI_CONFIG.PANELS.EXAMPLE.HEIGHT
        );
        this.container.addChild(this.background);

        // Create label
        this.labelText = this.createText('', {
            fontSize: UI_CONFIG.FONTS.SIZE.SMALL,
            color: UI_CONFIG.COLORS.LABEL,
        });
        this.labelText.x = UI_CONFIG.PADDING.SMALL;
        this.labelText.y = UI_CONFIG.PADDING.SMALL;
        this.container.addChild(this.labelText);

        // Create value
        this.valueText = this.createText('', {
            fontSize: UI_CONFIG.FONTS.SIZE.LARGE,
            color: UI_CONFIG.COLORS.VALUE,
        });
        this.valueText.x = UI_CONFIG.PADDING.SMALL;
        this.valueText.y = UI_CONFIG.PADDING.SMALL + 20;
        this.container.addChild(this.valueText);
    }

    public update(data: ExamplePanelData): void {
        this.labelText.text = data.label;
        this.valueText.text = String(data.value);
    }
}
```

**Why Agent-Friendly:**
- Consistent structure
- Clear data interface
- Follows base class pattern

**Action Items:**
- [ ] Create panel templates
- [ ] Document in code snippets
- [ ] Apply to new panels

---

### 3. UI Configuration Centralization

**Recommendation:** Centralize all UI constants.

**Pattern:**
```typescript
// src/config/ui.config.ts

export const UI_CONFIG = {
    // Colors
    COLORS: {
        PANEL_BACKGROUND: 0x000033,
        PANEL_BORDER: 0x0066CC,
        TEXT: 0xFFFFFF,
        LABEL: 0x99CCFF,
        VALUE: 0xFFCC00,
        WARNING: 0xFF6600,
        DANGER: 0xFF0000,
        SUCCESS: 0x00FF00,
        
        // Faction colors
        FEDERATION: 0x0066FF,
        KLINGON: 0xFF0000,
        ROMULAN: 0x00FF00,
        BORG: 0x00FF00,
    },
    
    // Fonts
    FONTS: {
        FAMILY: 'monospace',
        SIZE: {
            SMALL: 12,
            NORMAL: 14,
            LARGE: 18,
            TITLE: 24,
        },
    },
    
    // Spacing
    PADDING: {
        SMALL: 8,
        NORMAL: 12,
        LARGE: 20,
    },
    
    MARGIN: {
        SMALL: 4,
        NORMAL: 8,
        LARGE: 16,
    },
    
    // Panel dimensions
    PANELS: {
        RESOURCE: { WIDTH: 120, HEIGHT: 60 },
        WAVE: { WIDTH: 150, HEIGHT: 80 },
        SCORE: { WIDTH: 140, HEIGHT: 50 },
        COMBO: { WIDTH: 100, HEIGHT: 70 },
        TURRET_MENU: { WIDTH: 200, HEIGHT: 400 },
        UPGRADE: { WIDTH: 300, HEIGHT: 400 },
    },
    
    // Animation
    ANIMATION: {
        FADE_DURATION: 0.3,
        SLIDE_DURATION: 0.25,
        PULSE_SPEED: 2.0,
    },
    
    // Z-ordering
    Z_INDEX: {
        BACKGROUND: 0,
        GAME: 100,
        HUD: 200,
        OVERLAY: 300,
        MODAL: 400,
        TOAST: 500,
    },
} as const;
```

**Why Agent-Friendly:**
- All constants in one place
- Easy to find and modify
- Type-safe access

**Action Items:**
- [ ] Move all UI constants to config
- [ ] Remove inline magic numbers
- [ ] Document each constant

---

### 4. State Management for UI

**Recommendation:** Use clear state patterns for complex UI.

**Pattern:**
```typescript
// State interface
interface UpgradePanelState {
    selectedTurretId: number | null;
    selectedUpgrade: UpgradePath | null;
    canAfford: boolean;
    isAnimating: boolean;
}

// State machine for complex flows
class UpgradePanel extends UIComponent {
    private state: UpgradePanelState = {
        selectedTurretId: null,
        selectedUpgrade: null,
        canAfford: false,
        isAnimating: false,
    };

    public selectTurret(turretId: number): void {
        if (this.state.isAnimating) return;
        
        this.setState({
            selectedTurretId: turretId,
            selectedUpgrade: null,
        });
    }

    public selectUpgrade(upgrade: UpgradePath): void {
        const cost = this.getUpgradeCost(upgrade);
        const resources = getServices().get('resourceManager').getAmount();
        
        this.setState({
            selectedUpgrade: upgrade,
            canAfford: resources >= cost,
        });
    }

    private setState(partial: Partial<UpgradePanelState>): void {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...partial };
        this.onStateChange(oldState, this.state);
    }

    private onStateChange(oldState: UpgradePanelState, newState: UpgradePanelState): void {
        // Only update what changed
        if (oldState.selectedTurretId !== newState.selectedTurretId) {
            this.updateTurretInfo();
        }
        if (oldState.selectedUpgrade !== newState.selectedUpgrade) {
            this.updateUpgradePreview();
        }
        if (oldState.canAfford !== newState.canAfford) {
            this.updateBuyButton();
        }
    }
}
```

**Why Agent-Friendly:**
- State is explicit
- Changes are traceable
- Updates are efficient

**Action Items:**
- [ ] Define state interfaces
- [ ] Use setState pattern
- [ ] Implement onStateChange

---

### 5. Responsive Layout System

**Recommendation:** Use flexible layout utilities.

**Pattern:**
```typescript
// src/ui/layout/Layout.ts

export type Alignment = 'start' | 'center' | 'end';
export type Direction = 'horizontal' | 'vertical';

interface LayoutOptions {
    direction: Direction;
    gap: number;
    align: Alignment;
    padding: number;
}

export function layoutChildren(
    container: Container,
    options: Partial<LayoutOptions> = {}
): void {
    const opts: LayoutOptions = {
        direction: 'vertical',
        gap: 8,
        align: 'start',
        padding: 0,
        ...options,
    };

    let offset = opts.padding;
    const isHorizontal = opts.direction === 'horizontal';

    for (const child of container.children) {
        if (!child.visible) continue;

        if (isHorizontal) {
            child.x = offset;
            offset += child.width + opts.gap;
        } else {
            child.y = offset;
            offset += child.height + opts.gap;
        }
    }
}

// Grid layout utility
export function gridLayout(
    container: Container,
    columns: number,
    cellWidth: number,
    cellHeight: number,
    gap: number = 8
): void {
    let col = 0;
    let row = 0;

    for (const child of container.children) {
        if (!child.visible) continue;

        child.x = col * (cellWidth + gap);
        child.y = row * (cellHeight + gap);

        col++;
        if (col >= columns) {
            col = 0;
            row++;
        }
    }
}
```

**Why Agent-Friendly:**
- Reusable layout functions
- Consistent spacing
- Easy to modify layouts

**Action Items:**
- [ ] Create layout utilities
- [ ] Use in panel layouts
- [ ] Document layout patterns

---

### 6. UI Animation Patterns

**Recommendation:** Standardize UI animations.

**Pattern:**
```typescript
// src/ui/animation/UIAnimator.ts

export interface AnimationOptions {
    duration: number;
    easing: (t: number) => number;
    onComplete?: () => void;
}

export class UIAnimator {
    /**
     * Fade in a container.
     */
    static fadeIn(container: Container, options: Partial<AnimationOptions> = {}): void {
        const duration = options.duration ?? UI_CONFIG.ANIMATION.FADE_DURATION;
        container.alpha = 0;
        container.visible = true;

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            container.alpha = t;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Fade out a container.
     */
    static fadeOut(container: Container, options: Partial<AnimationOptions> = {}): void {
        const duration = options.duration ?? UI_CONFIG.ANIMATION.FADE_DURATION;
        const startAlpha = container.alpha;

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            container.alpha = startAlpha * (1 - t);

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                container.visible = false;
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Slide in from edge.
     */
    static slideIn(
        container: Container,
        from: 'left' | 'right' | 'top' | 'bottom',
        distance: number,
        options: Partial<AnimationOptions> = {}
    ): void {
        const duration = options.duration ?? UI_CONFIG.ANIMATION.SLIDE_DURATION;
        const targetX = container.x;
        const targetY = container.y;

        switch (from) {
            case 'left': container.x = targetX - distance; break;
            case 'right': container.x = targetX + distance; break;
            case 'top': container.y = targetY - distance; break;
            case 'bottom': container.y = targetY + distance; break;
        }

        container.visible = true;
        const startX = container.x;
        const startY = container.y;

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            const eased = this.easeOutQuad(t);

            container.x = startX + (targetX - startX) * eased;
            container.y = startY + (targetY - startY) * eased;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    private static easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }
}
```

**Why Agent-Friendly:**
- Reusable animation methods
- Consistent timing
- Easy to trigger animations

**Action Items:**
- [ ] Create UIAnimator class
- [ ] Use for panel transitions
- [ ] Add more animation types

---

### 7. Interactive Element Patterns

**Recommendation:** Standardize interactive elements.

**Pattern:**
```typescript
// src/ui/components/Button.ts
import { Container, Graphics, Text } from 'pixi.js';
import { UI_CONFIG } from '../../config';

export interface ButtonOptions {
    text: string;
    width: number;
    height: number;
    onClick: () => void;
    disabled?: boolean;
}

export class Button {
    public readonly container: Container;
    private background: Graphics;
    private label: Text;
    private _disabled: boolean = false;

    constructor(options: ButtonOptions) {
        this.container = new Container();
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';

        // Background
        this.background = new Graphics();
        this.drawBackground(false);
        this.container.addChild(this.background);

        // Label
        this.label = new Text({
            text: options.text,
            style: {
                fontSize: UI_CONFIG.FONTS.SIZE.NORMAL,
                fill: UI_CONFIG.COLORS.TEXT,
            },
        });
        this.label.anchor.set(0.5);
        this.label.x = options.width / 2;
        this.label.y = options.height / 2;
        this.container.addChild(this.label);

        // Events
        this.container.on('pointerdown', () => {
            if (!this._disabled) {
                options.onClick();
            }
        });
        this.container.on('pointerover', () => this.drawBackground(true));
        this.container.on('pointerout', () => this.drawBackground(false));

        this._disabled = options.disabled ?? false;
        this.updateDisabledState();
    }

    private drawBackground(hover: boolean): void {
        const color = hover ? UI_CONFIG.COLORS.PANEL_BORDER : UI_CONFIG.COLORS.PANEL_BACKGROUND;
        this.background.clear();
        this.background.roundRect(0, 0, 100, 40, 4);
        this.background.fill({ color, alpha: 0.9 });
        this.background.stroke({ color: UI_CONFIG.COLORS.PANEL_BORDER, width: 2 });
    }

    public set disabled(value: boolean) {
        this._disabled = value;
        this.updateDisabledState();
    }

    private updateDisabledState(): void {
        this.container.cursor = this._disabled ? 'not-allowed' : 'pointer';
        this.container.alpha = this._disabled ? 0.5 : 1;
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}
```

**Why Agent-Friendly:**
- Reusable button component
- Hover and disabled states
- Consistent interaction patterns

**Action Items:**
- [ ] Create Button component
- [ ] Create other interactive components
- [ ] Use in panels

---

### 8. HUDManager Decomposition

**Recommendation:** Split HUDManager into smaller modules.

**Current:** 838 lines in one file

**Proposed Structure:**
```
src/ui/
├── HUDManager.ts           # Slim coordinator (~200 lines)
├── HUDLayoutManager.ts     # Position management
├── HUDUpdater.ts          # Update loop
├── panels/
│   ├── ResourcePanel.ts
│   ├── WavePanel.ts
│   ├── ScorePanel.ts
│   ├── ComboPanel.ts
│   └── ...
└── overlays/
    ├── PauseOverlay.ts
    ├── GameOverScreen.ts
    └── TurretUpgradePanel.ts
```

**Slim HUDManager:**
```typescript
// src/ui/HUDManager.ts
import { Container } from 'pixi.js';
import { HUDLayoutManager } from './HUDLayoutManager';
import { HUDUpdater } from './HUDUpdater';
import * as Panels from './panels';

export class HUDManager {
    public readonly container: Container;
    
    private layout: HUDLayoutManager;
    private updater: HUDUpdater;
    private panels: Map<string, UIComponent> = new Map();

    constructor(app: Application) {
        this.container = new Container();
        this.layout = new HUDLayoutManager(app.screen.width, app.screen.height);
        this.updater = new HUDUpdater(this.panels);
        
        this.initializePanels();
    }

    private initializePanels(): void {
        // Create panels
        this.panels.set('resource', new Panels.ResourcePanel());
        this.panels.set('wave', new Panels.WavePanel());
        this.panels.set('score', new Panels.ScorePanel());
        this.panels.set('combo', new Panels.ComboPanel());
        
        // Initialize and add to container
        for (const panel of this.panels.values()) {
            panel.init();
            this.container.addChild(panel.container);
        }
        
        // Apply layout
        this.layout.applyLayout(this.panels);
    }

    public update(snapshot: GameSnapshot): void {
        this.updater.update(snapshot);
    }

    public destroy(): void {
        for (const panel of this.panels.values()) {
            panel.destroy();
        }
        this.container.destroy({ children: true });
    }
}
```

**Why Agent-Friendly:**
- Smaller, focused files
- Clear responsibilities
- Easier to modify

**Action Items:**
- [ ] Extract HUDLayoutManager
- [ ] Extract HUDUpdater
- [ ] Keep HUDManager as coordinator

---

## Implementation Checklist

### Phase 1: Base Class (2-3 hours)
- [ ] Create UIComponent base class
- [ ] Create Button component
- [ ] Test with one panel

### Phase 2: Panel Migration (4-6 hours)
- [ ] Migrate existing panels
- [ ] Apply consistent patterns
- [ ] Update tests

### Phase 3: HUD Decomposition (3-4 hours)
- [ ] Extract layout manager
- [ ] Extract updater
- [ ] Slim down HUDManager

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| HUDManager.ts size | 838 lines | <200 lines |
| Panels using base class | 0% | 100% |
| UI config coverage | ~70% | 100% |
| Interactive components | Inline | Reusable |

---

## References

- `src/ui/HUDManager.ts` - Current HUD implementation
- `src/ui/panels/` - Panel components
- `src/config/ui.config.ts` - UI configuration

---

*This document is part of the Kobayashi Maru maintainability initiative.*
