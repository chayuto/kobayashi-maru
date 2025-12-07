# Task 09: Integration Testing

**Date:** 2025-12-07  
**Priority:** P2 (Integration)  
**Estimated Effort:** 2 hours  
**Dependencies:** Task 08 (Game Facade)

---

## Purpose

After refactoring Game.ts into multiple managers, we need comprehensive testing to ensure:
1. All functionality is preserved
2. No regressions introduced
3. Performance is maintained or improved
4. Edge cases are handled

---

## Test Categories

### 1. Smoke Tests (Manual)

Quick manual verification that the game works:

```
□ Game loads without errors
□ Starfield animates
□ Kobayashi Maru appears at center
□ Wave 1 starts automatically
□ Enemies spawn and move toward center
□ Turret menu is visible
□ Can place a turret
□ Turret fires at enemies
□ Enemies die and award resources
□ HUD updates correctly
□ Can pause with ESC
□ Can resume with ESC
□ Can restart from pause menu
□ Game over triggers when KM destroyed
□ Can restart from game over
```

### 2. Unit Tests

Create unit tests for each manager:

#### ServiceContainer Tests

```typescript
// src/core/services/__tests__/ServiceContainer.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer, getServices, resetServices } from '../ServiceContainer';

describe('ServiceContainer', () => {
  let container: ServiceContainer;
  
  beforeEach(() => {
    container = new ServiceContainer();
  });
  
  it('should register and retrieve a service', () => {
    const mockService = { name: 'test' };
    container.register('testService' as any, () => mockService);
    
    const retrieved = container.get('testService' as any);
    expect(retrieved).toBe(mockService);
  });
  
  it('should throw for unregistered service', () => {
    expect(() => container.get('unknown' as any)).toThrow();
  });
  
  it('should cache service instance', () => {
    let callCount = 0;
    container.register('testService' as any, () => {
      callCount++;
      return { id: callCount };
    });
    
    container.get('testService' as any);
    container.get('testService' as any);
    
    expect(callCount).toBe(1);
  });
  
  it('should destroy services in reverse order', () => {
    const destroyOrder: string[] = [];
    
    container.register('first' as any, () => ({
      destroy: () => destroyOrder.push('first'),
    }));
    container.register('second' as any, () => ({
      destroy: () => destroyOrder.push('second'),
    }));
    
    container.get('first' as any);
    container.get('second' as any);
    container.destroy();
    
    expect(destroyOrder).toEqual(['second', 'first']);
  });
});
```

#### GameLoopManager Tests

```typescript
// src/core/loop/__tests__/GameLoopManager.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameLoopManager } from '../GameLoopManager';

describe('GameLoopManager', () => {
  let mockApp: any;
  let mockWorld: any;
  let loopManager: GameLoopManager;
  
  beforeEach(() => {
    mockApp = {
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
        deltaMS: 16.67,
        FPS: 60,
      },
    };
    mockWorld = {};
    loopManager = new GameLoopManager(mockApp, mockWorld);
  });
  
  it('should start the loop', () => {
    loopManager.start();
    expect(mockApp.ticker.add).toHaveBeenCalled();
  });
  
  it('should stop the loop', () => {
    loopManager.start();
    loopManager.stop();
    expect(mockApp.ticker.remove).toHaveBeenCalled();
  });
  
  it('should track game time when not paused', () => {
    // Simulate update
    loopManager.start();
    // Would need to trigger the callback
    expect(loopManager.getGameTime()).toBe(0);
  });
  
  it('should not update game time when paused', () => {
    loopManager.pause();
    expect(loopManager.isPaused()).toBe(true);
  });
});
```

#### InputRouter Tests

```typescript
// src/core/managers/__tests__/InputRouter.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputRouter, InputAction } from '../InputRouter';

describe('InputRouter', () => {
  let mockApp: any;
  let mockWorld: any;
  let inputRouter: InputRouter;
  
  beforeEach(() => {
    mockApp = {
      canvas: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }),
      },
    };
    mockWorld = {};
    inputRouter = new InputRouter(mockApp, mockWorld);
  });
  
  it('should register action callbacks', () => {
    const callback = vi.fn();
    inputRouter.on(InputAction.PAUSE, callback);
    
    // Simulate key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    inputRouter.setStateCheckers({
      isPlaying: () => true,
      isPaused: () => false,
      isGameOver: () => false,
      isPlacingTurret: () => false,
    });
    
    // Would need to trigger the handler
  });
  
  it('should unsubscribe callbacks', () => {
    const callback = vi.fn();
    const unsubscribe = inputRouter.on(InputAction.PAUSE, callback);
    unsubscribe();
    
    // Callback should not be called after unsubscribe
  });
});
```

### 3. Integration Tests

Test manager interactions:

```typescript
// src/core/__tests__/GameIntegration.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Game } from '../Game';

describe('Game Integration', () => {
  let game: Game;
  
  beforeEach(async () => {
    // Create mock container
    document.body.innerHTML = '<div id="test-app"></div>';
    game = new Game('test-app');
  });
  
  afterEach(() => {
    game.destroy();
    document.body.innerHTML = '';
  });
  
  it('should initialize without errors', async () => {
    await expect(game.init()).resolves.not.toThrow();
  });
  
  it('should start game loop', async () => {
    await game.init();
    expect(() => game.start()).not.toThrow();
  });
  
  it('should pause and resume', async () => {
    await game.init();
    game.start();
    
    game.pause();
    expect(game.isPaused()).toBe(true);
    
    game.resume();
    expect(game.isPaused()).toBe(false);
  });
  
  it('should toggle god mode', async () => {
    await game.init();
    
    const initial = game.isGodModeEnabled();
    game.toggleGodMode();
    expect(game.isGodModeEnabled()).toBe(!initial);
  });
});
```

### 4. Performance Tests

Verify no performance regression:

```typescript
// src/core/__tests__/Performance.test.ts

import { describe, it, expect } from 'vitest';
import { Game } from '../Game';

describe('Performance', () => {
  it('should maintain 60 FPS with 100 entities', async () => {
    document.body.innerHTML = '<div id="perf-app"></div>';
    const game = new Game('perf-app');
    await game.init();
    game.start();
    
    // Spawn 100 enemies
    const waveManager = game.getWaveManager();
    // ... spawn logic
    
    // Measure frame time
    const perfMon = game.getPerformanceMonitor();
    
    // Run for 60 frames
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const metrics = perfMon.getMetrics();
    expect(metrics.fps).toBeGreaterThan(55);
    
    game.destroy();
  });
});
```

---

## Test Checklist

### Core Functionality

```
□ Game initializes
□ Game starts
□ Game pauses
□ Game resumes
□ Game restarts
□ Game over triggers
□ High score saves
```

### Rendering

```
□ Starfield renders
□ Kobayashi Maru renders
□ Enemies render
□ Turrets render
□ Projectiles render
□ Beams render
□ Particles render
□ Health bars render
□ Shields render
□ Screen shake works
```

### Gameplay

```
□ Waves spawn correctly
□ Enemies move toward KM
□ Turrets target enemies
□ Turrets fire at enemies
□ Enemies take damage
□ Enemies die
□ Resources awarded
□ Score updates
□ Wave progression works
```

### UI

```
□ HUD displays correctly
□ Wave number updates
□ Resource count updates
□ Health bar updates
□ Shield bar updates
□ Message log works
□ Turret menu works
□ Turret upgrade panel works
□ Pause overlay works
□ Game over screen works
```

### Input

```
□ ESC pauses game
□ ESC resumes game
□ R restarts (when paused)
□ Click selects turret
□ Click deselects turret
□ Click places turret
□ ESC cancels placement
□ Ctrl+G toggles god mode
□ Ctrl+S toggles slow mode
```

### Edge Cases

```
□ Rapid pause/resume
□ Restart during wave
□ Place turret at edge
□ Many enemies at once
□ All turrets destroyed
□ Zero resources
□ Maximum wave number
```

---

## Regression Test Script

Create a manual test script for QA:

```markdown
# Kobayashi Maru Regression Test Script

## Setup
1. Run `npm run dev`
2. Open browser to localhost:5173
3. Open browser console (F12)

## Test 1: Basic Startup
- [ ] Game loads without console errors
- [ ] Starfield is visible and moving
- [ ] Kobayashi Maru is at center
- [ ] HUD is visible on left side
- [ ] Turret menu is visible on right side

## Test 2: Wave System
- [ ] Wave 1 starts automatically
- [ ] "Wave 1 started" message appears
- [ ] Enemies spawn from edges
- [ ] Enemies move toward center
- [ ] Wave counter shows "Wave 1"

## Test 3: Turret Placement
- [ ] Click "Phaser" in turret menu
- [ ] Placement preview appears
- [ ] Move mouse - preview follows
- [ ] Click to place turret
- [ ] Turret appears at click location
- [ ] Resources decrease
- [ ] Press ESC - placement cancels

## Test 4: Combat
- [ ] Turret rotates toward enemies
- [ ] Turret fires beam at enemy
- [ ] Enemy health decreases
- [ ] Enemy dies with explosion
- [ ] "Enemy destroyed" message appears
- [ ] Resources increase

## Test 5: Turret Selection
- [ ] Click on placed turret
- [ ] Upgrade panel appears
- [ ] Shows turret stats
- [ ] Shows upgrade options
- [ ] Click elsewhere - panel closes

## Test 6: Pause/Resume
- [ ] Press ESC
- [ ] Game pauses
- [ ] Pause overlay appears
- [ ] Enemies stop moving
- [ ] Press ESC again
- [ ] Game resumes
- [ ] Enemies continue moving

## Test 7: Restart
- [ ] Pause game (ESC)
- [ ] Click "Restart" or press R
- [ ] Game resets
- [ ] Wave 1 starts
- [ ] Resources reset
- [ ] Score resets

## Test 8: Game Over
- [ ] Enable god mode (Ctrl+G)
- [ ] Disable god mode (Ctrl+G)
- [ ] Let enemies reach KM
- [ ] KM health decreases
- [ ] Screen shakes on damage
- [ ] KM destroyed
- [ ] Game over screen appears
- [ ] Shows final score
- [ ] Click "Restart"
- [ ] Game resets

## Test 9: Performance
- [ ] Open Performance tab in DevTools
- [ ] Play for 2 minutes
- [ ] FPS stays above 55
- [ ] No memory leaks (heap stable)
- [ ] No console errors

## Test 10: Mobile (if applicable)
- [ ] Touch to place turret
- [ ] Touch to select turret
- [ ] Pinch to zoom (if implemented)
- [ ] Swipe gestures work
```

---

## Automated Test Commands

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- ServiceContainer.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

---

## AI Agent Instructions

When implementing this task:

1. Create test files in appropriate `__tests__` directories
2. Run tests with `npm run test`
3. Fix any failing tests
4. Run manual smoke tests
5. Document any issues found
6. Create bug fix tasks if needed

---

## Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual smoke tests pass
- [ ] No console errors during gameplay
- [ ] FPS maintains 60 on target hardware
- [ ] No memory leaks after 5 minutes of play
