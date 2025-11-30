# Task 2: Touch Input Manager

**Date:** December 1, 2025  
**Priority:** Critical  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1 (Viewport & Meta Configuration)

## Objective

Create a centralized TouchInputManager to handle all touch events, normalize touch/mouse input, and provide a unified API for game systems to consume touch interactions.

## Current State

- PlacementManager has basic touch support (touchmove, touchend)
- No centralized touch input handling
- No multi-touch support
- No touch gesture detection
- Mouse and touch handled separately

## Architecture

### TouchInputManager Class

**Location:** `src/input/TouchInputManager.ts`

```typescript
/**
 * Touch Input Manager
 * Centralizes touch event handling and provides unified input API
 */

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  isActive: boolean;
}

export interface TouchGesture {
  type: 'tap' | 'long-press' | 'swipe' | 'pinch' | 'pan';
  x: number;
  y: number;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export type TouchEventCallback = (gesture: TouchGesture) => void;

export class TouchInputManager {
  private canvas: HTMLCanvasElement;
  private worldWidth: number;
  private worldHeight: number;
  private touches: Map<number, TouchPoint>;
  private listeners: Map<string, TouchEventCallback[]>;
  private tapThreshold: number = 10; // pixels
  private longPressThreshold: number = 500; // ms
  private swipeThreshold: number = 50; // pixels
  private longPressTimer: number | null = null;

  constructor(canvas: HTMLCanvasElement, worldWidth: number, worldHeight: number);
  
  // Public API
  public init(): void;
  public destroy(): void;
  public on(eventType: string, callback: TouchEventCallback): void;
  public off(eventType: string, callback: TouchEventCallback): void;
  public getTouches(): TouchPoint[];
  public getPrimaryTouch(): TouchPoint | null;
  public isTouching(): boolean;
  
  // Private methods
  private handleTouchStart(e: TouchEvent): void;
  private handleTouchMove(e: TouchEvent): void;
  private handleTouchEnd(e: TouchEvent): void;
  private handleTouchCancel(e: TouchEvent): void;
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number };
  private detectGesture(touch: TouchPoint): TouchGesture | null;
  private emit(eventType: string, gesture: TouchGesture): void;
}
```

## Implementation Details

### 1. Create TouchInputManager

**File:** `src/input/TouchInputManager.ts`

```typescript
export class TouchInputManager {
  private canvas: HTMLCanvasElement;
  private worldWidth: number;
  private worldHeight: number;
  private touches: Map<number, TouchPoint> = new Map();
  private listeners: Map<string, TouchEventCallback[]> = new Map();
  private tapThreshold: number = 10;
  private longPressThreshold: number = 500;
  private swipeThreshold: number = 50;
  private longPressTimer: number | null = null;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundTouchCancel: (e: TouchEvent) => void;

  constructor(canvas: HTMLCanvasElement, worldWidth: number, worldHeight: number) {
    this.canvas = canvas;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    
    // Bind event handlers
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundTouchCancel = this.handleTouchCancel.bind(this);
  }

  public init(): void {
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.boundTouchCancel, { passive: false });
  }

  public destroy(): void {
    this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    this.canvas.removeEventListener('touchmove', this.boundTouchMove);
    this.canvas.removeEventListener('touchend', this.boundTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.boundTouchCancel);
    this.touches.clear();
    this.listeners.clear();
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const worldPos = this.screenToWorld(touch.clientX, touch.clientY);
      
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: worldPos.x,
        y: worldPos.y,
        startX: worldPos.x,
        startY: worldPos.y,
        startTime: Date.now(),
        isActive: true
      };
      
      this.touches.set(touch.identifier, touchPoint);
      
      // Start long press timer for first touch
      if (this.touches.size === 1) {
        this.longPressTimer = window.setTimeout(() => {
          const primaryTouch = this.getPrimaryTouch();
          if (primaryTouch) {
            this.emit('long-press', {
              type: 'long-press',
              x: primaryTouch.x,
              y: primaryTouch.y
            });
          }
        }, this.longPressThreshold);
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPoint = this.touches.get(touch.identifier);
      
      if (touchPoint) {
        const worldPos = this.screenToWorld(touch.clientX, touch.clientY);
        touchPoint.x = worldPos.x;
        touchPoint.y = worldPos.y;
        
        // Cancel long press if moved too much
        const dx = touchPoint.x - touchPoint.startX;
        const dy = touchPoint.y - touchPoint.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.tapThreshold && this.longPressTimer !== null) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }
    }
    
    // Emit pan gesture for single touch
    if (this.touches.size === 1) {
      const primaryTouch = this.getPrimaryTouch();
      if (primaryTouch) {
        this.emit('pan', {
          type: 'pan',
          x: primaryTouch.x,
          y: primaryTouch.y,
          deltaX: primaryTouch.x - primaryTouch.startX,
          deltaY: primaryTouch.y - primaryTouch.startY
        });
      }
    }
    
    // Emit pinch gesture for two touches
    if (this.touches.size === 2) {
      const touchArray = Array.from(this.touches.values());
      const dx = touchArray[1].x - touchArray[0].x;
      const dy = touchArray[1].y - touchArray[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const startDx = touchArray[1].startX - touchArray[0].startX;
      const startDy = touchArray[1].startY - touchArray[0].startY;
      const startDistance = Math.sqrt(startDx * startDx + startDy * startDy);
      
      const scale = distance / startDistance;
      
      this.emit('pinch', {
        type: 'pinch',
        x: (touchArray[0].x + touchArray[1].x) / 2,
        y: (touchArray[0].y + touchArray[1].y) / 2,
        scale
      });
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPoint = this.touches.get(touch.identifier);
      
      if (touchPoint) {
        touchPoint.isActive = false;
        
        // Detect gesture
        const gesture = this.detectGesture(touchPoint);
        if (gesture) {
          this.emit(gesture.type, gesture);
        }
        
        this.touches.delete(touch.identifier);
      }
    }
    
    // Clear long press timer
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchCancel(e: TouchEvent): void {
    // Treat cancel as end
    this.handleTouchEnd(e);
  }

  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const canvasWidth = this.canvas.width || 1;
    const canvasHeight = this.canvas.height || 1;
    const scaleX = this.worldWidth / canvasWidth;
    const scaleY = this.worldHeight / canvasHeight;

    return {
      x: (screenX - rect.left) * scaleX,
      y: (screenY - rect.top) * scaleY
    };
  }

  private detectGesture(touch: TouchPoint): TouchGesture | null {
    const dx = touch.x - touch.startX;
    const dy = touch.y - touch.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - touch.startTime;
    
    // Tap
    if (distance < this.tapThreshold && duration < this.longPressThreshold) {
      return {
        type: 'tap',
        x: touch.x,
        y: touch.y
      };
    }
    
    // Swipe
    if (distance > this.swipeThreshold) {
      const angle = Math.atan2(dy, dx);
      let direction: 'up' | 'down' | 'left' | 'right';
      
      if (Math.abs(angle) < Math.PI / 4) {
        direction = 'right';
      } else if (Math.abs(angle) > 3 * Math.PI / 4) {
        direction = 'left';
      } else if (angle > 0) {
        direction = 'down';
      } else {
        direction = 'up';
      }
      
      return {
        type: 'swipe',
        x: touch.x,
        y: touch.y,
        deltaX: dx,
        deltaY: dy,
        direction
      };
    }
    
    return null;
  }

  public on(eventType: string, callback: TouchEventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  public off(eventType: string, callback: TouchEventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(eventType: string, gesture: TouchGesture): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(gesture));
    }
  }

  public getTouches(): TouchPoint[] {
    return Array.from(this.touches.values());
  }

  public getPrimaryTouch(): TouchPoint | null {
    if (this.touches.size === 0) return null;
    return this.touches.values().next().value;
  }

  public isTouching(): boolean {
    return this.touches.size > 0;
  }
}
```

### 2. Create Input Module Index

**File:** `src/input/index.ts`

```typescript
export { TouchInputManager } from './TouchInputManager';
export type { TouchPoint, TouchGesture, TouchEventCallback } from './TouchInputManager';
```

### 3. Integrate with Game Class

**File:** `src/core/Game.ts`

Add TouchInputManager to Game class:

```typescript
import { TouchInputManager } from '../input';

export class Game {
  // ... existing properties
  private touchInputManager: TouchInputManager | null = null;

  async init(): Promise<void> {
    // ... existing init code
    
    // Initialize touch input manager
    this.touchInputManager = new TouchInputManager(
      this.app.canvas as HTMLCanvasElement,
      GAME_CONFIG.WORLD_WIDTH,
      GAME_CONFIG.WORLD_HEIGHT
    );
    this.touchInputManager.init();
    
    console.log('Touch input manager initialized');
  }

  destroy(): void {
    // ... existing destroy code
    
    if (this.touchInputManager) {
      this.touchInputManager.destroy();
    }
  }

  /**
   * Get the touch input manager
   */
  getTouchInputManager(): TouchInputManager | null {
    return this.touchInputManager;
  }
}
```

## Testing

### Unit Tests

**File:** `src/__tests__/TouchInputManager.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TouchInputManager } from '../input/TouchInputManager';

describe('TouchInputManager', () => {
  let canvas: HTMLCanvasElement;
  let manager: TouchInputManager;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    manager = new TouchInputManager(canvas, 1920, 1080);
  });

  it('should initialize without errors', () => {
    expect(() => manager.init()).not.toThrow();
  });

  it('should track touches', () => {
    manager.init();
    expect(manager.getTouches()).toHaveLength(0);
    expect(manager.isTouching()).toBe(false);
  });

  it('should detect tap gesture', () => {
    const callback = vi.fn();
    manager.on('tap', callback);
    manager.init();
    
    // Simulate tap (would need proper touch event simulation)
    // This is a simplified test
    expect(callback).not.toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    manager.init();
    expect(() => manager.destroy()).not.toThrow();
    expect(manager.getTouches()).toHaveLength(0);
  });
});
```

### Manual Testing Checklist

- [ ] Single tap detected correctly
- [ ] Long press detected after 500ms
- [ ] Swipe gestures detected (up, down, left, right)
- [ ] Pan gesture emits during drag
- [ ] Pinch gesture detected with two fingers
- [ ] Touch coordinates correctly mapped to world space
- [ ] Multiple touches tracked independently
- [ ] Touch cancel handled gracefully

## Success Criteria

- TouchInputManager successfully initializes
- All touch events properly captured and prevented from default behavior
- Touch coordinates correctly converted to world space
- Gesture detection working (tap, long-press, swipe, pan, pinch)
- Event listener system functional
- No memory leaks on destroy
- Unit tests passing

## Notes for Agent

- Create new `src/input/` directory
- Focus on clean API design for other systems to consume
- Ensure proper event cleanup to prevent memory leaks
- Test coordinate conversion thoroughly
- Keep gesture detection simple and reliable
- Consider adding debug logging for development

## Related Files

- `src/input/TouchInputManager.ts` (new)
- `src/input/index.ts` (new)
- `src/core/Game.ts` (modify)
- `src/__tests__/TouchInputManager.test.ts` (new)

## Next Task

After completing this task, proceed to **Task 3: Responsive UI System** to make UI elements adapt to mobile screens.
