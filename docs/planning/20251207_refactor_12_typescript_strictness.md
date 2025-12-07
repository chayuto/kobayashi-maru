# Refactor Task: TypeScript Strictness Improvements

**Date:** December 7, 2025  
**Priority:** 🟢 Low  
**Complexity:** Low  
**Estimated Effort:** 2-3 hours  

---

## Problem Statement

While `tsconfig.json` has strict mode enabled, some patterns in the codebase reduce type safety:

### Issue 1: Implicit Any in Callbacks
```typescript
// Some event handlers don't type their parameters
button.on('pointerdown', (e) => { ... });  // e is implicitly any
```

### Issue 2: Missing Return Types
```typescript
// Some functions don't declare return types
function calculateSomething(x, y) {  // Returns what?
  return x + y;
}
```

### Issue 3: Loose Null Handling
```typescript
// Optional chaining used where null check would be clearer
this.particleSystem?.spawn(...);  // Is null expected or a bug?
```

### Issue 4: Type Assertions
```typescript
// Some places use type assertions that could be avoided
const bg = button.children[0] as Graphics;  // Could fail at runtime
```

---

## Impact

- **Runtime Errors:** Type assertions can fail
- **Maintenance:** Unclear what types are expected
- **IDE Support:** Less accurate autocomplete
- **Refactoring Risk:** Changes might break untyped code

---

## Proposed Solution

1. Add explicit types to all function parameters and returns
2. Replace type assertions with type guards where possible
3. Use strict null checks consistently
4. Add JSDoc comments for complex types

---

## Implementation

### Step 1: Audit and Fix Event Handlers

```typescript
// BEFORE
button.on('pointerdown', (e) => { ... });

// AFTER
import { FederatedPointerEvent } from 'pixi.js';
button.on('pointerdown', (e: FederatedPointerEvent) => { ... });
```

### Step 2: Add Return Types to All Functions

```typescript
// BEFORE
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// AFTER
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### Step 3: Replace Type Assertions with Type Guards

```typescript
// BEFORE
const bg = button.children[0] as Graphics;
bg.clear();

// AFTER
function isGraphics(obj: unknown): obj is Graphics {
  return obj instanceof Graphics;
}

const firstChild = button.children[0];
if (isGraphics(firstChild)) {
  firstChild.clear();
}

// OR use a helper that throws if wrong type
function assertGraphics(obj: unknown): Graphics {
  if (!(obj instanceof Graphics)) {
    throw new Error('Expected Graphics instance');
  }
  return obj;
}
```

### Step 4: Explicit Null Checks

```typescript
// BEFORE - unclear if null is expected
this.particleSystem?.spawn(config);

// AFTER - explicit about expectations
if (this.particleSystem) {
  this.particleSystem.spawn(config);
} else {
  console.warn('ParticleSystem not initialized');
}

// OR if null is truly expected and OK to skip
if (this.particleSystem !== null) {
  this.particleSystem.spawn(config);
}
```

### Step 5: Add JSDoc for Complex Types

```typescript
/**
 * Applies damage to an entity, prioritizing shields over health
 * @param world - The ECS world
 * @param targetId - Entity ID receiving damage
 * @param damage - Base damage amount before modifiers
 * @param options - Optional damage configuration
 * @returns Breakdown of damage applied
 */
function applyDamage(
  world: IWorld,
  targetId: number,
  damage: number,
  options?: DamageOptions
): DamageResult {
  // ...
}
```

### Step 6: Enable Additional TSConfig Options

```jsonc
// tsconfig.json - consider enabling
{
  "compilerOptions": {
    // Already enabled
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    
    // Consider adding
    "noImplicitReturns": true,        // All code paths must return
    "exactOptionalPropertyTypes": true, // Stricter optional handling
    "noPropertyAccessFromIndexSignature": true  // Require bracket notation for index
  }
}
```

---

## Files to Audit

Priority files (most likely to have issues):

1. `src/ui/*.ts` - Event handlers, DOM interaction
2. `src/core/Game.ts` - Large file, many callbacks
3. `src/systems/*.ts` - System functions
4. `src/rendering/*.ts` - PixiJS interactions

---

## Validation Criteria

1. **No implicit any** - `tsc --noImplicitAny` passes
2. **All functions have return types** - explicit or inferred
3. **Type assertions minimized** - use type guards instead
4. **No new TypeScript errors** - existing code still compiles

---

## Testing Strategy

1. Run `npm run build` - should have no errors
2. Run `npm run lint` - should have no warnings
3. IDE should show no red squiggles
4. All existing tests pass

---

## Files to Modify

- `src/ui/HUDManager.ts` - Event handler types
- `src/ui/TurretMenu.ts` - Event handler types
- `src/ui/TurretUpgradePanel.ts` - Event handler types
- `src/core/Game.ts` - Callback types, null checks
- `src/core/InputManager.ts` - Event types
- `src/rendering/*.ts` - PixiJS event types
- `tsconfig.json` - Optional stricter settings
