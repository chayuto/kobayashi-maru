# Task 10: Haptic Feedback

**Date:** December 1, 2025  
**Priority:** Low  
**Estimated Time:** 30 minutes  
**Dependencies:** Task 2 (Touch Input)

## Objective

Add haptic feedback (vibration) for key mobile interactions to enhance tactile feel.

## Implementation

### Create HapticManager

**File:** `src/input/HapticManager.ts`

```typescript
export enum HapticPattern {
  LIGHT = 'light',       // 10ms - button tap
  MEDIUM = 'medium',     // 20ms - turret placed
  HEAVY = 'heavy',       // 30ms - error, invalid action
  SUCCESS = 'success',   // [10, 50, 10] - turret placed successfully
  ERROR = 'error'        // [20, 100, 20, 100, 20] - invalid placement
}

export class HapticManager {
  private enabled: boolean = true;
  private supported: boolean = false;

  constructor() {
    this.supported = 'vibrate' in navigator;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isSupported(): boolean {
    return this.supported;
  }

  public trigger(pattern: HapticPattern): void {
    if (!this.enabled || !this.supported) return;

    switch (pattern) {
      case HapticPattern.LIGHT:
        navigator.vibrate(10);
        break;
      case HapticPattern.MEDIUM:
        navigator.vibrate(20);
        break;
      case HapticPattern.HEAVY:
        navigator.vibrate(30);
        break;
      case HapticPattern.SUCCESS:
        navigator.vibrate([10, 50, 10]);
        break;
      case HapticPattern.ERROR:
        navigator.vibrate([20, 100, 20, 100, 20]);
        break;
    }
  }

  public triggerCustom(pattern: number | number[]): void {
    if (!this.enabled || !this.supported) return;
    navigator.vibrate(pattern);
  }
}
```

### Integrate with Game Systems

**File:** `src/game/PlacementManager.ts`

```typescript
import { HapticManager, HapticPattern } from '../input/HapticManager';

export class PlacementManager {
  private hapticManager: HapticManager;

  constructor(
    app: Application,
    world: GameWorld,
    resourceManager: ResourceManager,
    touchInputManager?: TouchInputManager,
    hapticManager?: HapticManager
  ) {
    // ... existing code
    this.hapticManager = hapticManager || new HapticManager();
  }

  startPlacing(turretType: number): void {
    // ... existing code
    this.hapticManager.trigger(HapticPattern.LIGHT);
  }

  confirmPlacement(): number {
    // ... existing code
    
    if (!this.isValidPosition) {
      this.hapticManager.trigger(HapticPattern.ERROR);
      return -1;
    }

    if (!this.resourceManager.canAfford(config.cost)) {
      this.hapticManager.trigger(HapticPattern.ERROR);
      return -1;
    }

    // Success
    this.hapticManager.trigger(HapticPattern.SUCCESS);
    // ... rest of placement logic
  }

  cancelPlacement(): void {
    // ... existing code
    this.hapticManager.trigger(HapticPattern.LIGHT);
  }
}
```

### Add to UI Interactions

**File:** `src/ui/MobileHUD.ts`

```typescript
export class MobileHUD {
  private hapticManager: HapticManager;

  constructor(responsiveManager: ResponsiveUIManager, hapticManager: HapticManager) {
    // ... existing code
    this.hapticManager = hapticManager;
  }

  private createTurretButton(...): Container {
    // ... existing code
    
    button.on('pointerdown', () => {
      this.hapticManager.trigger(HapticPattern.LIGHT);
      // ... rest of handler
    });
    
    return button;
  }
}
```

### Add to Game Class

**File:** `src/core/Game.ts`

```typescript
import { HapticManager } from '../input/HapticManager';

export class Game {
  private hapticManager: HapticManager;

  constructor(containerId: string = 'app') {
    // ... existing code
    this.hapticManager = new HapticManager();
  }

  async init(): Promise<void> {
    // ... existing code
    
    // Pass haptic manager to systems
    this.placementManager = new PlacementManager(
      this.app,
      this.world,
      this.resourceManager,
      this.touchInputManager,
      this.hapticManager
    );
    
    // Add haptic feedback for game events
    this.damageSystem?.onEnemyDeath(() => {
      this.hapticManager.trigger(HapticPattern.LIGHT);
    });
  }

  private checkGameOver(): void {
    // ... existing code
    if (health <= 0) {
      this.hapticManager.trigger(HapticPattern.HEAVY);
      this.triggerGameOver();
    }
  }
}
```

## Haptic Feedback Map

| Action | Pattern | Duration |
|--------|---------|----------|
| Button tap | LIGHT | 10ms |
| Turret selected | LIGHT | 10ms |
| Turret placed | SUCCESS | 10-50-10ms |
| Invalid placement | ERROR | 20-100-20-100-20ms |
| Enemy killed | LIGHT | 10ms |
| Kobayashi Maru hit | MEDIUM | 20ms |
| Game over | HEAVY | 30ms |
| Wave complete | SUCCESS | 10-50-10ms |

## Testing

- [ ] Haptic feedback on button taps
- [ ] Success vibration on turret placement
- [ ] Error vibration on invalid placement
- [ ] Light vibration on enemy kills
- [ ] Heavy vibration on game over
- [ ] Can be disabled in settings
- [ ] Works on Android
- [ ] Works on iOS (limited support)
- [ ] No vibration on desktop

## Success Criteria

- Haptic feedback enhances mobile experience
- Patterns feel appropriate for actions
- Can be disabled by user
- No performance impact
- Works on supported devices
- Gracefully degrades on unsupported devices

## Notes

- iOS has limited Vibration API support
- Android has full support
- Desktop browsers don't support vibration
- Keep patterns short to avoid annoyance
- Provide settings to disable

## Related Files

- `src/input/HapticManager.ts` (new)
- `src/input/index.ts` (export)
- `src/game/PlacementManager.ts` (modify)
- `src/ui/MobileHUD.ts` (modify)
- `src/core/Game.ts` (modify)

## Next Task

Task 11: Orientation Management
