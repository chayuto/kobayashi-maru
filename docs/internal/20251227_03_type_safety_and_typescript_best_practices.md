# Type Safety and TypeScript Best Practices for AI Agents

**Date:** 2025-12-27  
**Category:** Type Safety  
**Priority:** HIGH  
**Effort:** Low-Medium  

---

## Executive Summary

Strong type safety is essential for AI coding agents to understand code behavior and make safe modifications. This codebase already achieves excellent type safety (zero `any` types). This document outlines how to maintain and improve this standard.

---

## Current State Assessment

### ✅ Excellent Type Safety

1. **Zero `any` Types** - Strict mode enforced
2. **TypeScript Strict Mode** - All strict checks enabled
3. **Comprehensive Interfaces** - GameEventMap, ServiceRegistry, etc.
4. **Type-Safe Event Bus** - Payload types mapped to event types

### ⚠️ Enhancement Opportunities

1. **Branded Types** - Not using for entity IDs
2. **Const Assertions** - Not consistently applied
3. **Template Literal Types** - Underutilized
4. **Exhaustive Pattern Matching** - Not enforced

---

## Recommendations for AI Coding Agents

### 1. Branded Types for Entity IDs

**Recommendation:** Use branded types to prevent mixing entity types.

**Current:**
```typescript
// All entities are just numbers - no compile-time distinction
function damageEnemy(entityId: number, damage: number): void { }
function upgradeTurret(turretId: number, level: number): void { }

// DANGER: No error when mixing entity types!
const enemyId = createEnemy(world, FactionId.KLINGON, 100, 100);
upgradeTurret(enemyId, 2); // Compiles but wrong!
```

**Proposed:**
```typescript
// Define branded types for different entity categories
type EntityId = number & { readonly __brand: 'EntityId' };
type EnemyId = EntityId & { readonly __enemyBrand: 'EnemyId' };
type TurretId = EntityId & { readonly __turretBrand: 'TurretId' };
type ProjectileId = EntityId & { readonly __projectileBrand: 'ProjectileId' };

// Factory returns correct branded type
function createEnemy(world: GameWorld, factionId: number, x: number, y: number): EnemyId;
function createTurret(world: GameWorld, x: number, y: number, type: TurretType): TurretId;

// Functions accept specific types
function damageEnemy(enemyId: EnemyId, damage: number): void;
function upgradeTurret(turretId: TurretId, level: number): void;

// ERROR: Argument of type 'EnemyId' is not assignable to 'TurretId'
upgradeTurret(enemyId, 2);
```

**Why Agent-Friendly:**
- Type system prevents logical errors
- Agents get compile-time feedback on mistakes
- Self-documenting function signatures

**Action Items:**
- [ ] Define branded entity types in `src/types/entities.ts`
- [ ] Update factory functions to return branded types
- [ ] Update system functions to use specific types

---

### 2. Const Assertions for Configuration

**Recommendation:** Use `as const` for all configuration objects.

**Current:**
```typescript
export const GAME_CONFIG = {
    TARGET_FPS: 60,
    WORLD_WIDTH: 1920,
    WORLD_HEIGHT: 1080,
} as const; // ✅ Good - already using as const
```

**Extend to All Configs:**
```typescript
// Ensure all config objects use as const
export const TURRET_CONFIG = {
    [TurretType.PHASER_ARRAY]: {
        range: 200,
        fireRate: 4,
        damage: 10,
        cost: 100,
    },
} as const satisfies Record<TurretTypeValue, TurretStats>;

// Type can be derived from const object
type TurretConfigType = typeof TURRET_CONFIG;
type PhaserConfig = TurretConfigType[typeof TurretType.PHASER_ARRAY];
```

**Why Agent-Friendly:**
- Literal types provide precise type information
- IDE shows actual values in tooltips
- Prevents accidental mutation

**Action Items:**
- [ ] Audit all config files for `as const` usage
- [ ] Add `satisfies` for additional type checking
- [ ] Derive types from config objects where possible

---

### 3. Exhaustive Pattern Matching

**Recommendation:** Enforce exhaustive checks for union types.

**Pattern:**
```typescript
// Define never-returning function for exhaustive checks
function assertNever(x: never): never {
    throw new Error(`Unexpected value: ${x}`);
}

// Use in switch statements
function processTurretType(type: TurretType): void {
    switch (type) {
        case TurretType.PHASER_ARRAY:
            // handle phaser
            break;
        case TurretType.TORPEDO_LAUNCHER:
            // handle torpedo
            break;
        case TurretType.DISRUPTOR_BANK:
            // handle disruptor
            break;
        case TurretType.TETRYON_BEAM:
            // handle tetryon
            break;
        case TurretType.PLASMA_CANNON:
            // handle plasma
            break;
        case TurretType.POLARON_BEAM:
            // handle polaron
            break;
        default:
            // If a new TurretType is added, this will cause a compile error
            assertNever(type);
    }
}
```

**Why Agent-Friendly:**
- New enum values cause immediate compile errors
- Agents are forced to handle all cases
- Prevents silent failures

**Action Items:**
- [ ] Create `assertNever` utility function
- [ ] Apply to all switch statements on union types
- [ ] Add ESLint rule for switch exhaustiveness

---

### 4. Discriminated Unions for State

**Recommendation:** Use discriminated unions for complex state.

**Example:**
```typescript
// Instead of optional properties
interface GameState {
    isPaused: boolean;
    isGameOver: boolean;
    waveNumber?: number;
    score?: number;
}

// Use discriminated union
type GameState = 
    | { status: 'menu' }
    | { status: 'playing'; waveNumber: number; score: number }
    | { status: 'paused'; waveNumber: number; score: number }
    | { status: 'gameOver'; finalScore: number; isHighScore: boolean };

// Type narrowing works automatically
function handleGameState(state: GameState) {
    switch (state.status) {
        case 'menu':
            // state.waveNumber would be an error here
            break;
        case 'playing':
            console.log(state.waveNumber); // TypeScript knows this exists
            break;
        case 'gameOver':
            console.log(state.finalScore); // Only available in gameOver
            break;
    }
}
```

**Why Agent-Friendly:**
- State transitions are explicit
- Invalid states are unrepresentable
- Type narrowing is automatic

**Action Items:**
- [ ] Identify state objects with multiple boolean flags
- [ ] Convert to discriminated unions
- [ ] Update consumers to use type narrowing

---

### 5. Type-Safe Event System Enhancement

**Current (Good):**
```typescript
// Already type-safe with GameEventMap
eventBus.on(GameEventType.ENEMY_KILLED, (payload: EnemyKilledPayload) => { });
```

**Enhancement:**
```typescript
// Add type inference for emit
class EventBus {
    emit<K extends keyof GameEventMap>(
        event: K,
        payload: GameEventMap[K]
    ): void;
    
    // Overload for events without payloads
    emit<K extends keyof GameEventMapVoid>(event: K): void;
}

// Define events that don't need payloads
interface GameEventMapVoid {
    GAME_PAUSED: void;
    GAME_RESUMED: void;
}
```

**Why Agent-Friendly:**
- No runtime errors from wrong payload types
- IDE auto-completes event names and payloads
- Refactoring events is safe

**Action Items:**
- [ ] Review all event payloads for completeness
- [ ] Add void event support if needed
- [ ] Document event system in types

---

### 6. Generic Constraints for Components

**Recommendation:** Use generics with constraints for component operations.

**Pattern:**
```typescript
// Define component interface constraint
interface ComponentData {
    [index: number]: number;
}

// Generic function for component operations
function getComponentValue<C extends ComponentData>(
    component: C,
    entityId: number,
    key: keyof C
): number {
    return component[key][entityId];
}

// Usage with type safety
const x = getComponentValue(Position, entityId, 'x'); // number
const z = getComponentValue(Position, entityId, 'z'); // Error: 'z' not in Position
```

**Why Agent-Friendly:**
- Invalid component access caught at compile time
- Generic functions work across all components
- Type inference reduces boilerplate

**Action Items:**
- [ ] Define base ComponentData interface
- [ ] Create generic component utility functions
- [ ] Apply to common patterns

---

### 7. Utility Types for Common Patterns

**Recommendation:** Create domain-specific utility types.

**Examples:**
```typescript
// src/types/utility.ts

/** Make specific properties required */
type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Entity with guaranteed components */
type EntityWith<Components extends keyof typeof AllComponents> = {
    id: number;
    components: Components[];
};

/** Deep readonly for config */
type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** Percentage value (0-100) */
type Percentage = number & { __brand: 'Percentage' };

/** Pixels value for positions */
type Pixels = number & { __brand: 'Pixels' };
```

**Why Agent-Friendly:**
- Domain concepts are explicit in types
- Prevents unit confusion (pixels vs percentages)
- Self-documenting code

**Action Items:**
- [ ] Create `src/types/utility.ts`
- [ ] Define domain-specific utility types
- [ ] Apply to function signatures

---

## TypeScript Configuration Recommendations

### Current tsconfig.json Analysis

```json
{
  "compilerOptions": {
    "strict": true,                    // ✅ All strict checks
    "noUnusedLocals": true,            // ✅ Catches dead code
    "noUnusedParameters": true,        // ✅ Catches dead params
    "noFallthroughCasesInSwitch": true // ✅ Safe switch
  }
}
```

### Recommended Additions

```json
{
  "compilerOptions": {
    // Already have these - keep them
    "strict": true,
    
    // Consider adding
    "noUncheckedIndexedAccess": true,  // Arrays may be undefined
    "exactOptionalPropertyTypes": true, // undefined !== missing
    "noPropertyAccessFromIndexSignature": true, // Force bracket notation
  }
}
```

**Action Items:**
- [ ] Evaluate `noUncheckedIndexedAccess` impact
- [ ] Consider `exactOptionalPropertyTypes`
- [ ] Document any new compiler options

---

## Implementation Checklist

### Phase 1: Utility Types (1-2 hours)
- [ ] Create utility types file
- [ ] Define branded entity types
- [ ] Add assertNever function

### Phase 2: Branded Types (3-4 hours)
- [ ] Apply to entity factory functions
- [ ] Update system type signatures
- [ ] Fix any type errors

### Phase 3: Exhaustive Checks (2-3 hours)
- [ ] Add assertNever to switch statements
- [ ] Enable ESLint exhaustive rules
- [ ] Fix incomplete switches

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| `any` type usage | 0 | 0 |
| Branded types for entities | 0% | 100% |
| Exhaustive switch statements | ~50% | 100% |
| Type utility coverage | Low | High |

---

## References

- `src/types/events.ts` - Type-safe event examples
- `tsconfig.json` - Current compiler options
- `src/types/config/` - Configuration type patterns

---

*This document is part of the Kobayashi Maru maintainability initiative.*
