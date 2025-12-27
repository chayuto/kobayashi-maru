# Event System and Communication Patterns for AI Agents

**Date:** 2025-12-27  
**Category:** Communication  
**Priority:** HIGH  
**Effort:** Low  

---

## Executive Summary

Decoupled communication via the Event Bus is essential for maintainable architecture. This document outlines event system best practices and patterns for AI coding agents to follow.

---

## Current State Assessment

### ✅ Excellent Event System

1. **Type-Safe Event Bus** - `src/core/EventBus.ts`
2. **Typed Payloads** - `GameEventMap` interface
3. **Singleton Pattern** - `EventBus.getInstance()`
4. **Full Event Catalog** - All game events defined

### ⚠️ Areas for Improvement

1. **Deprecated Callbacks** - Some managers still use local callbacks
2. **Event Documentation** - Limited docs on when events fire
3. **Event Debugging** - No event logging/tracing
4. **Memory Leaks** - No automatic listener cleanup

---

## Recommendations for AI Coding Agents

### 1. Migrate All Communication to EventBus

**Recommendation:** Remove local callback patterns, use EventBus exclusively.

**Current (Deprecated Pattern):**
```typescript
// resourceManager.ts - Local callback (deprecated)
class ResourceManager {
    private callbacks: ((amount: number) => void)[] = [];
    
    /** @deprecated Use EventBus.on(GameEventType.RESOURCE_UPDATED) */
    on(callback: (amount: number) => void): void {
        this.callbacks.push(callback);
    }
}
```

**Correct Pattern:**
```typescript
// Using EventBus
import { EventBus, GameEventType, ResourceUpdatedPayload } from '../types/events';

class ResourceManager {
    private eventBus = EventBus.getInstance();
    
    addResources(amount: number): void {
        this.current += amount;
        
        // Emit event through centralized bus
        this.eventBus.emit(GameEventType.RESOURCE_UPDATED, {
            current: this.current,
            amount: amount,
        });
    }
}

// Consumer
eventBus.on(GameEventType.RESOURCE_UPDATED, (payload: ResourceUpdatedPayload) => {
    console.log(`Resources: ${payload.current} (+${payload.amount})`);
});
```

**Why Agent-Friendly:**
- Single communication mechanism to learn
- All events discoverable in one enum
- Type-safe payloads prevent errors

**Action Items:**
- [ ] Remove deprecated callback methods
- [ ] Update all consumers to use EventBus
- [ ] Delete local event types

---

### 2. Comprehensive Event Documentation

**Recommendation:** Document when and where each event fires.

**Pattern:**
```typescript
// src/types/events.ts

/**
 * Game Event Types
 * 
 * All events emitted through the global EventBus.
 * Events are organized by domain for discoverability.
 */
export enum GameEventType {
    // ============================================
    // COMBAT EVENTS
    // ============================================
    
    /**
     * Fired when an enemy entity is destroyed.
     * 
     * @emittedBy damageSystem.ts - when Health.current reaches 0
     * @payload EnemyKilledPayload
     * @timing Immediate, before entity removal
     * 
     * @example
     * ```typescript
     * eventBus.on(GameEventType.ENEMY_KILLED, (payload) => {
     *   spawnExplosion(payload.x, payload.y);
     *   addScore(payload.factionId);
     * });
     * ```
     */
    ENEMY_KILLED = 'ENEMY_KILLED',

    // ============================================
    // WAVE EVENTS
    // ============================================
    
    /**
     * Fired when a new wave begins spawning.
     * 
     * @emittedBy WaveManager.startWave()
     * @payload WaveStartedPayload
     * @timing Before first enemy spawns
     */
    WAVE_STARTED = 'WAVE_STARTED',

    /**
     * Fired when all enemies in a wave are defeated.
     * 
     * @emittedBy WaveManager.update() - when enemiesRemaining === 0
     * @payload WaveCompletedPayload
     * @timing After last enemy killed, before next wave delay
     */
    WAVE_COMPLETED = 'WAVE_COMPLETED',
}
```

**Why Agent-Friendly:**
- Agents know exactly when events fire
- Usage examples provided
- Timing clarified for complex flows

**Action Items:**
- [ ] Add JSDoc to all event types
- [ ] Document emission location
- [ ] Add usage examples

---

### 3. Event Debugging and Tracing

**Recommendation:** Add event logging for development.

**Pattern:**
```typescript
// src/core/EventBusDebugger.ts
import { EventBus, GameEventType, GameEventMap } from '../types/events';

export class EventBusDebugger {
    private enabled: boolean = false;
    private eventLog: Array<{ event: string; payload: unknown; timestamp: number }> = [];
    private maxLogSize: number = 100;

    enable(): void {
        if (this.enabled) return;
        this.enabled = true;
        
        const bus = EventBus.getInstance();
        
        // Subscribe to all events
        for (const eventType of Object.values(GameEventType)) {
            bus.on(eventType, (payload: GameEventMap[typeof eventType]) => {
                this.logEvent(eventType, payload);
            });
        }
    }

    private logEvent(event: string, payload: unknown): void {
        const entry = {
            event,
            payload,
            timestamp: performance.now(),
        };
        
        this.eventLog.push(entry);
        
        // Trim log if too large
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxLogSize);
        }
        
        // Console output in development
        if (import.meta.env.DEV) {
            console.log(`[Event] ${event}`, payload);
        }
    }

    getLog(): typeof this.eventLog {
        return [...this.eventLog];
    }

    getEventsByType(type: GameEventType): typeof this.eventLog {
        return this.eventLog.filter(e => e.event === type);
    }
}

// Enable in development
if (import.meta.env.DEV) {
    new EventBusDebugger().enable();
}
```

**Why Agent-Friendly:**
- Debug event flow issues
- Trace unexpected behavior
- Profile event frequency

**Action Items:**
- [ ] Create EventBusDebugger class
- [ ] Add to debug overlay
- [ ] Enable in development mode

---

### 4. Listener Lifecycle Management

**Recommendation:** Implement automatic listener cleanup.

**Pattern:**
```typescript
// src/core/EventBusSubscription.ts
import { EventBus, GameEventType, GameEventMap } from '../types/events';

/**
 * Subscription handle for automatic cleanup.
 */
export class EventBusSubscription {
    private subscriptions: Array<{ event: GameEventType; handler: unknown }> = [];
    private bus = EventBus.getInstance();

    /**
     * Subscribe to an event with automatic tracking.
     */
    on<T extends GameEventType>(
        event: T,
        handler: (payload: GameEventMap[T]) => void
    ): this {
        this.bus.on(event, handler);
        this.subscriptions.push({ event, handler });
        return this;
    }

    /**
     * Unsubscribe all tracked listeners.
     * Call this in component destroy/cleanup.
     */
    unsubscribeAll(): void {
        for (const { event, handler } of this.subscriptions) {
            this.bus.off(event, handler as (payload: GameEventMap[typeof event]) => void);
        }
        this.subscriptions = [];
    }
}

// Usage in a manager
class SomeManager {
    private subscription = new EventBusSubscription();

    constructor() {
        this.subscription
            .on(GameEventType.ENEMY_KILLED, this.handleEnemyKilled.bind(this))
            .on(GameEventType.WAVE_COMPLETED, this.handleWaveComplete.bind(this));
    }

    destroy(): void {
        this.subscription.unsubscribeAll();
    }
}
```

**Why Agent-Friendly:**
- Prevents memory leaks
- Cleanup is explicit and easy
- Method chaining for readability

**Action Items:**
- [ ] Create EventBusSubscription helper
- [ ] Update managers to use subscriptions
- [ ] Add subscription cleanup to destroy methods

---

### 5. Event Categories and Organization

**Recommendation:** Organize events by domain in the enum.

**Pattern:**
```typescript
export enum GameEventType {
    // ==========================================
    // LIFECYCLE EVENTS (000-099)
    // ==========================================
    GAME_STARTED = 'GAME_STARTED',
    GAME_PAUSED = 'GAME_PAUSED',
    GAME_RESUMED = 'GAME_RESUMED',
    GAME_OVER = 'GAME_OVER',

    // ==========================================
    // COMBAT EVENTS (100-199)
    // ==========================================
    ENEMY_KILLED = 'ENEMY_KILLED',
    ENEMY_SPAWNED = 'ENEMY_SPAWNED',
    PLAYER_DAMAGED = 'PLAYER_DAMAGED',
    TURRET_FIRED = 'TURRET_FIRED',

    // ==========================================
    // WAVE EVENTS (200-299)
    // ==========================================
    WAVE_STARTED = 'WAVE_STARTED',
    WAVE_COMPLETED = 'WAVE_COMPLETED',
    WAVE_COUNTDOWN = 'WAVE_COUNTDOWN',

    // ==========================================
    // ECONOMY EVENTS (300-399)
    // ==========================================
    RESOURCE_UPDATED = 'RESOURCE_UPDATED',
    TURRET_PURCHASED = 'TURRET_PURCHASED',
    TURRET_SOLD = 'TURRET_SOLD',
    UPGRADE_APPLIED = 'UPGRADE_APPLIED',

    // ==========================================
    // UI EVENTS (400-499)
    // ==========================================
    COMBO_UPDATED = 'COMBO_UPDATED',
    ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
    TOAST_DISPLAYED = 'TOAST_DISPLAYED',

    // ==========================================
    // INPUT EVENTS (500-599)
    // ==========================================
    TOUCH_START = 'TOUCH_START',
    TOUCH_MOVE = 'TOUCH_MOVE',
    TOUCH_END = 'TOUCH_END',
    GESTURE = 'GESTURE',
}
```

**Why Agent-Friendly:**
- Related events grouped together
- Easy to find events by domain
- Room for future expansion

**Action Items:**
- [ ] Reorganize enum with comments
- [ ] Add numeric ranges for categories
- [ ] Document categories in events.ts

---

### 6. Event Payload Guidelines

**Recommendation:** Standardize payload structure.

**Pattern:**
```typescript
// All payloads should include:
// 1. Entity IDs where applicable
// 2. Position where applicable
// 3. Computed values (not raw component data)

// GOOD: Self-contained payload
interface EnemyKilledPayload {
    entityId: number;      // Which enemy
    factionId: number;     // Enemy type
    x: number;             // Where (for effects)
    y: number;
    score: number;         // Pre-computed score value
    wasCombo: boolean;     // Derived state
}

// BAD: Incomplete payload requiring lookup
interface EnemyKilledPayload {
    entityId: number;      // Need to look up position, faction, etc.
}

// GOOD: Payload has all needed info
interface WaveStartedPayload {
    waveNumber: number;
    totalEnemies: number;
    isBossWave: boolean;
    storyText: string;     // Ready to display
}

// BAD: Missing computed fields
interface WaveStartedPayload {
    waveNumber: number;    // Consumer must compute isBossWave
}
```

**Why Agent-Friendly:**
- No additional lookups needed
- Payloads are self-documenting
- Consistent structure

**Action Items:**
- [ ] Audit existing payloads
- [ ] Add missing computed fields
- [ ] Document payload guidelines

---

### 7. Event Testing Patterns

**Recommendation:** Standard pattern for testing events.

**Pattern:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus, GameEventType } from '../types/events';

describe('EventBus Integration', () => {
    beforeEach(() => {
        // Reset singleton for clean tests
        EventBus.resetInstance();
    });

    afterEach(() => {
        EventBus.resetInstance();
    });

    it('should emit and receive typed events', () => {
        const bus = EventBus.getInstance();
        const handler = vi.fn();
        
        bus.on(GameEventType.ENEMY_KILLED, handler);
        bus.emit(GameEventType.ENEMY_KILLED, {
            entityId: 1,
            factionId: 2,
            x: 100,
            y: 200,
        });
        
        expect(handler).toHaveBeenCalledWith({
            entityId: 1,
            factionId: 2,
            x: 100,
            y: 200,
        });
    });

    it('should handle errors in handlers gracefully', () => {
        const bus = EventBus.getInstance();
        const errorHandler = vi.fn(() => { throw new Error('Test error'); });
        const normalHandler = vi.fn();
        
        bus.on(GameEventType.WAVE_STARTED, errorHandler);
        bus.on(GameEventType.WAVE_STARTED, normalHandler);
        
        // Should not throw, both handlers should be called
        expect(() => {
            bus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });
        }).not.toThrow();
        
        expect(normalHandler).toHaveBeenCalled();
    });

    it('should support unsubscribing', () => {
        const bus = EventBus.getInstance();
        const handler = vi.fn();
        
        bus.on(GameEventType.COMBO_UPDATED, handler);
        bus.off(GameEventType.COMBO_UPDATED, handler);
        bus.emit(GameEventType.COMBO_UPDATED, {
            comboCount: 5,
            multiplier: 2.0,
            isActive: true,
        });
        
        expect(handler).not.toHaveBeenCalled();
    });
});
```

**Why Agent-Friendly:**
- Standard test patterns
- Covers common use cases
- Error handling tested

**Action Items:**
- [ ] Add comprehensive EventBus tests
- [ ] Test error handling
- [ ] Test listener cleanup

---

## Implementation Checklist

### Phase 1: Documentation (1-2 hours)
- [ ] Add JSDoc to all events
- [ ] Document emission locations
- [ ] Add usage examples

### Phase 2: Debugging (2 hours)
- [ ] Create EventBusDebugger
- [ ] Add to debug overlay
- [ ] Enable for development

### Phase 3: Cleanup (2-3 hours)
- [ ] Create EventBusSubscription helper
- [ ] Update managers to use it
- [ ] Remove deprecated callbacks

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Event JSDoc coverage | ~20% | 100% |
| Deprecated callbacks | 13 | 0 |
| Event debugging | None | Full |
| Listener leak potential | High | Low |

---

## References

- `src/core/EventBus.ts` - Event bus implementation
- `src/types/events.ts` - Event definitions
- `src/game/resourceManager.ts` - Deprecated pattern example

---

*This document is part of the Kobayashi Maru maintainability initiative.*
