# Chore Task 06: Remove Unused Code

**Date:** 2025-12-11  
**Priority:** P2 (Low Impact, Low Risk)  
**Estimated Effort:** 1 hour  
**Risk Level:** LOW - Removal of confirmed dead code only

---

## Problem Statement

The codebase contains unused code that:
- Increases cognitive load
- Confuses AI agents
- Increases bundle size
- Makes maintenance harder

---

## Identified Dead Code

### 1. Unused Handler Files

**File:** `src/core/GameInputHandler.ts`

This file exists but is not used - `InputRouter` handles all input now.

```typescript
// In Game.ts, GameInputHandler is imported but never instantiated
// private gameInputHandler: GameInputHandler | null = null;  // Never used
```

**Action:** Verify not used, then delete.

### 2. Unused TODO Functions in abilitySystem.ts

```typescript
// src/systems/abilitySystem.ts

/**
 * Process Drain ability
 */
function processDrainAbility(): void {
  // TODO: Implement turret energy drain when turret energy system is added
}

/**
 * Process EMP Burst ability
 */
function processEMPBurstAbility(): void {
  // TODO: Implement EMP burst when turret disable system is added
}
```

**Action:** Keep as stubs (they're intentional placeholders for future features).

### 3. Unused Imports

Run `npm run lint` to identify unused imports. Common patterns:

```typescript
// Example: Importing but not using
import { SomeType } from './types';  // If SomeType is never used
```

**Action:** Let ESLint identify and fix.

### 4. Commented-Out Code Blocks

```typescript
// src/systems/abilitySystem.ts
// TODO: Add teleport sound type to AudioManager
// if (audioManager) {
//   audioManager.play('teleport');
// }
```

**Action:** Keep TODOs, they document future work.

---

## Safe Removal Process

### Step 1: Verify GameInputHandler is Unused

```bash
# Search for usages
grep -r "GameInputHandler" src/ --include="*.ts"
```

Expected results:
- `src/core/GameInputHandler.ts` - The file itself
- `src/core/index.ts` - Export (can be removed)
- `src/core/Game.ts` - Import but no instantiation

If only these results, safe to remove.

### Step 2: Check for Other Unused Exports

```bash
# Files that might be unused
grep -r "GameStateController" src/ --include="*.ts"
```

**Note:** `GameStateController.ts` exists but check if it's used.

---

## Files to Potentially Remove

| File | Status | Action |
|------|--------|--------|
| `src/core/GameInputHandler.ts` | CONFIRMED UNUSED | Safe to delete |

**Note:** `GameStateController.ts` does not exist (was in planning docs only).

---

## Implementation

### Step 1: Verify Usage (DONE)

Verification completed:
- `GameInputHandler` - Only referenced in its own file, NOT used anywhere else
- `GameStateController` - Does not exist (was only in planning docs)

### Step 2: Remove Unused Files

If confirmed unused:

1. Delete the file
2. Remove from `src/core/index.ts` exports
3. Remove any imports in other files

### Step 3: Run Lint to Find Unused Imports

```bash
npm run lint -- --fix
```

This will automatically remove unused imports.

### Step 4: Verify Build

```bash
npm run build
```

---

## Test Coverage

No new tests needed - we're removing code, not adding it.

Existing tests must still pass after removal.

---

## Verification Checklist

- [ ] Search for `GameInputHandler` usages
- [ ] Search for `GameStateController` usages
- [ ] If unused, delete files
- [ ] Update `src/core/index.ts` exports
- [ ] Run `npm run lint -- --fix` for unused imports
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] Game still works (manual test)

---

## AI Agent Instructions

1. **DO NOT delete files without verification**
2. Search for each file's usage first
3. Only delete if truly unused
4. Update barrel exports after deletion
5. Run lint with --fix to clean up imports
6. Run all verification commands
7. Test game in browser

---

## What NOT to Remove

- **TODO comments** - They document future work
- **Stub functions** - `processDrainAbility`, `processEMPBurstAbility` are placeholders
- **Type definitions** - Even if not currently used, they may be needed
- **Test files** - Even for removed code (they verify the removal was safe)

---

## Benefits

1. **Cleaner Codebase** - Less code to understand
2. **Smaller Bundle** - Faster load times
3. **AI-Friendly** - Less confusion about what's used
4. **Easier Maintenance** - Less code to maintain
