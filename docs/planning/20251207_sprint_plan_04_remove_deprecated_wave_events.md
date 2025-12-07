# Task: Remove Deprecated Wave Event System

**Priority:** 🟠 High  
**Estimated Effort:** Small (1-2 hours)  
**Dependencies:** None  
**File Focus:** `src/game/waveManager.ts`

---

## Background

The `waveManager.ts` contains a deprecated local event system (`on()`/`off()`/`emitEvent()`) that duplicates functionality now provided by the global `EventBus`. This creates confusion and potential memory leak risks.

## Current State

```typescript
// waveManager.ts - Lines 34-55 (DEPRECATED)
export enum WaveEventType { /* deprecated */ }
export type WaveEventCallback = /* deprecated */
export interface WaveEvent { /* deprecated */ }
```

The deprecated system includes:
- `WaveEventType` enum
- `WaveEventCallback` type
- `WaveEvent` interface
- `on()` method
- `off()` method
- `emitEvent()` method
- `eventListeners` Map

---

## Objective

Remove all deprecated wave event code and ensure all consumers use `EventBus` instead.

---

## Implementation Steps

### Step 1: Verify No Active Usage

Search for any remaining usage of deprecated methods:

```bash
grep -r "waveManager.on\|waveManager.off\|WaveEventType\|WaveEventCallback" src/ --include="*.ts"
```

If usage found, migrate to EventBus first.

### Step 2: Remove Deprecated Types

Remove from `waveManager.ts`:
- `WaveEventType` enum (lines ~34)
- `WaveEventCallback` type (lines ~40)
- `WaveEvent` interface (lines ~46-55)

### Step 3: Remove Deprecated Methods

Remove from `WaveManager` class:
- `private eventListeners: Map<...>` field
- `on()` method
- `off()` method
- `emitEvent()` method

### Step 4: Clean Up Imports

Remove any unused imports that were only used by the deprecated system.

### Step 5: Update Any Test Files

Check if tests use deprecated patterns:

```bash
grep -r "WaveEventType\|\.on\(.*wave\|\.off\(" src/__tests__/ --include="*.ts"
```

Migrate test files to use EventBus patterns.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/waveManager.ts` | Remove deprecated types, methods, fields |
| `src/__tests__/waveSpawner.test.ts` | Verify using EventBus (already migrated) |

---

## Code to Remove

```typescript
// Remove these from waveManager.ts:

/** @deprecated Use GameEventType */
export enum WaveEventType { ... }

/** @deprecated Use EventBus */
export type WaveEventCallback = ...

/** @deprecated Use EventBus */
export interface WaveEvent { ... }

// In WaveManager class:
private eventListeners: Map<WaveEventType, WaveEventCallback[]> = new Map();

/** @deprecated Use EventBus.subscribe() */
on(eventType: WaveEventType, callback: WaveEventCallback): void { ... }

/** @deprecated Use EventBus.unsubscribe() */
off(eventType: WaveEventType, callback: WaveEventCallback): void { ... }

emitEvent(event: WaveEvent): void { ... }
```

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ No deprecated types exported from waveManager.ts
4. ✅ `waveManager.ts` line count reduced by ~50-80 lines

---

## Verification Commands

```bash
# Verify no deprecated usage remains
grep -r "WaveEventType\|WaveEventCallback" src/ --include="*.ts"

# Run all tests
npm test

# Type check
npx tsc --noEmit
```

---

## Risk Assessment

- **Low risk** - Removing code marked deprecated
- **Pre-check:** Ensure all consumers migrated before removal
