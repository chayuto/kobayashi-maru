# Refactor Task: Event System Unification

**Date:** December 7, 2025  
**Priority:** 🔴 Critical  
**Complexity:** Medium  
**Estimated Effort:** 3-4 hours  

---

## Problem Statement

The codebase has two parallel event systems causing confusion and potential memory leaks:

### 1. Global EventBus (src/core/EventBus.ts)
- Singleton pattern
- Type-safe with GameEventMap
- Used for: ENEMY_KILLED, WAVE_STARTED, WAVE_COMPLETED, etc.

### 2. Local Callback Systems
- **WaveManager:** Has its own `on()`, `off()`, `emitEvent()` methods
- **DamageSystem:** Has `onEnemyDeath()`, `offEnemyDeath()` callbacks
- Both marked `@deprecated` but still functional and used

---

## Current State Analysis

### WaveManager (waveManager.ts)
```typescript
// Deprecated local event system
private eventListeners: Map<WaveEventType, WaveEventCallback[]> = new Map();

on(eventType: WaveEventType, callback: WaveEventCallback): void { ... }
off(eventType: WaveEventType, callback: WaveEventCallback): void { ... }
private emitEvent(event: WaveEvent): void { ... }

// Also emits to EventBus
this.eventBus.emit(GameEventType.WAVE_STARTED, { ... });
this.emitEvent({ type: 'waveStart', ... }); // Duplicate!
```

### DamageSystem (damageSystem.ts)
```typescript
// Deprecated callback system
const deathCallbacks: EnemyDeathCallback[] = [];

onEnemyDeath: (callback: EnemyDeathCallback) => { ... }
offEnemyDeath: (callback: EnemyDeathCallback) => { ... }

// Also emits to EventBus
eventBus.emit(GameEventType.ENEMY_KILLED, { ... });
for (const callback of deathCallbacks) { callback(eid, factionId); } // Duplicate!
```

---

## Impact

- **Confusion:** Which event system should new code use?
- **Memory Leaks:** Callbacks not properly cleaned up
- **Duplicate Events:** Same event fires twice through different systems
- **Maintenance:** Two systems to maintain and test

---

## Proposed Solution

1. Remove all local event systems
2. Migrate all consumers to EventBus
3. Add missing event types to EventBus if needed
4. Ensure proper cleanup on game restart

---

## Implementation

### Step 1: Audit Event Consumers

Find all usages of deprecated APIs:

```bash
# Search for deprecated usage
grep -r "waveManager.on\|waveManager.off" src/
grep -r "damageSystem.onEnemyDeath\|damageSystem.offEnemyDeath" src/
```

### Step 2: Update WaveManager

```typescript
// src/game/waveManager.ts

// REMOVE these deprecated members:
// - eventListeners: Map<WaveEventType, WaveEventCallback[]>
// - on(eventType, callback)
// - off(eventType, callback)
// - emitEvent(event)

// KEEP only EventBus emissions:
startWave(waveNumber: number): void {
  // ... setup code ...
  
  // Single event emission via EventBus
  this.eventBus.emit(GameEventType.WAVE_STARTED, {
    waveNumber: this.currentWave,
    totalEnemies: this.getTotalEnemyCount()
  });
  
  // REMOVE: this.emitEvent({ type: 'waveStart', ... });
}

private completeWave(): void {
  // ... completion code ...
  
  // Single event emission via EventBus
  this.eventBus.emit(GameEventType.WAVE_COMPLETED, {
    waveNumber: this.currentWave
  });
  
  // REMOVE: this.emitEvent({ type: 'waveComplete', ... });
}
```

### Step 3: Update DamageSystem

```typescript
// src/systems/damageSystem.ts

export function createDamageSystem(particleSystem?: ParticleSystem) {
  // REMOVE: const deathCallbacks: EnemyDeathCallback[] = [];
  const destroyedThisFrame: number[] = [];
  const eventBus = EventBus.getInstance();

  function damageSystem(world: IWorld): IWorld {
    // ... existing logic ...
    
    if (factionId !== FactionId.FEDERATION) {
      // Single event emission via EventBus
      eventBus.emit(GameEventType.ENEMY_KILLED, {
        entityId: eid,
        factionId,
        x,
        y
      });
      
      // REMOVE: for (const callback of deathCallbacks) { ... }
    }
    
    // ... rest of logic ...
  }

  return {
    update: damageSystem,
    // REMOVE: onEnemyDeath, offEnemyDeath
    getDestroyedThisFrame: () => [...destroyedThisFrame]
  };
}

// REMOVE: EnemyDeathCallback type export
```

### Step 4: Migrate Consumers to EventBus

Any code using the deprecated APIs must switch:

```typescript
// BEFORE (deprecated):
waveManager.on('waveStart', (event) => { ... });
damageSystem.onEnemyDeath((entityId, factionId) => { ... });

// AFTER (EventBus):
import { EventBus, GameEventType } from '../core/EventBus';

const eventBus = EventBus.getInstance();
eventBus.on(GameEventType.WAVE_STARTED, (payload) => { ... });
eventBus.on(GameEventType.ENEMY_KILLED, (payload) => { ... });
```

### Step 5: Add Cleanup on Game Restart

```typescript
// In Game.ts restart() method:
restart(): void {
  // Clear all event listeners to prevent memory leaks
  EventBus.getInstance().clearAll();
  
  // ... rest of restart logic ...
  
  // Re-subscribe necessary handlers
  this.subscribeToEvents();
}

private subscribeToEvents(): void {
  const eventBus = EventBus.getInstance();
  eventBus.on(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
  eventBus.on(GameEventType.WAVE_STARTED, this.boundHandleWaveStarted);
  eventBus.on(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);
}
```

### Step 6: Remove Deprecated Types

```typescript
// REMOVE from waveManager.ts:
export type WaveEventType = 'waveStart' | 'waveComplete' | 'enemySpawned';
export type WaveEventCallback = (event: WaveEvent) => void;
export interface WaveEvent { ... }

// REMOVE from damageSystem.ts:
export type EnemyDeathCallback = (entityId: number, factionId: number) => void;
```

---

## Validation Criteria

1. **No duplicate event emissions** - each event fires once
2. **All deprecated APIs removed** - no `@deprecated` markers remain
3. **EventBus is sole event system** - grep confirms no local listeners
4. **Proper cleanup on restart** - no memory leaks
5. **All tests pass** - update tests that used deprecated APIs

---

## Testing Strategy

1. Verify wave events fire correctly (start, complete)
2. Verify enemy kill events fire correctly
3. Test game restart doesn't accumulate listeners
4. Test multiple restarts don't cause duplicate handlers

---

## Files to Modify

- `src/game/waveManager.ts` - Remove local event system
- `src/systems/damageSystem.ts` - Remove callback system
- `src/core/Game.ts` - Add proper cleanup, migrate any local usage
- `src/__tests__/waveSpawner.test.ts` - Update to use EventBus
- `src/__tests__/damageSystem.test.ts` - Update to use EventBus

---

## Migration Checklist

- [ ] Remove `WaveEventType`, `WaveEventCallback`, `WaveEvent` types
- [ ] Remove `eventListeners` Map from WaveManager
- [ ] Remove `on()`, `off()`, `emitEvent()` from WaveManager
- [ ] Remove `EnemyDeathCallback` type from damageSystem
- [ ] Remove `deathCallbacks` array from damageSystem
- [ ] Remove `onEnemyDeath()`, `offEnemyDeath()` from damageSystem return
- [ ] Add `EventBus.clearAll()` to Game.restart()
- [ ] Update all tests using deprecated APIs
- [ ] Verify no grep matches for deprecated patterns
