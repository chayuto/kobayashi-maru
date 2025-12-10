# Chore Task 03: Complete Barrel Export Coverage

**Date:** 2025-12-11  
**Priority:** P1 (Medium Impact, Low Risk)  
**Estimated Effort:** 30 minutes  
**Risk Level:** LOW - Export additions only

---

## Problem Statement

Some modules have incomplete barrel exports, forcing direct file imports:

```typescript
// Current: Must import directly
import { AchievementManager } from '../game/AchievementManager';
import { BinaryHeap } from '../utils/BinaryHeap';

// Preferred: Import from module
import { AchievementManager } from '../game';
import { BinaryHeap } from '../utils';
```

This inconsistency confuses AI agents and makes refactoring harder.

---

## Current State

### `src/game/index.ts` - Missing Exports

```typescript
// Current exports
export * from './waveConfig';
export * from './spawnPoints';
export * from './waveManager';
export * from './gameState';
export * from './scoreManager';
export * from './highScoreManager';
export * from './resourceManager';
export * from './PlacementManager';
export * from './UpgradeManager';

// Missing:
// - AchievementManager
```

### `src/utils/index.ts` - Minimal

```typescript
// Current exports
export * from './BinaryHeap';

// This is actually complete - BinaryHeap is the only utility
```

### `src/audio/index.ts` - Check Completeness

```typescript
// Current exports
export * from './AudioManager';
export * from './types';

// Missing:
// - SoundGenerator (internal, may be intentional)
```

---

## Solution

Add missing exports to barrel files.

---

## Implementation

### Step 1: Update `src/game/index.ts`

```typescript
/**
 * Game module barrel export for Kobayashi Maru
 * Contains game state management, scoring, and wave systems
 */
export * from './waveConfig';
export * from './spawnPoints';
export * from './waveManager';
export * from './gameState';
export * from './scoreManager';
export * from './highScoreManager';
export * from './resourceManager';
export * from './PlacementManager';
export * from './UpgradeManager';
export * from './AchievementManager';  // ADD THIS
```

### Step 2: Verify `src/utils/index.ts`

```typescript
/**
 * Utilities module barrel export for Kobayashi Maru
 * Contains helper classes and functions
 */
export * from './BinaryHeap';

// Note: This is complete - BinaryHeap is the only utility file
```

### Step 3: Verify `src/audio/index.ts`

```typescript
/**
 * Audio module barrel export for Kobayashi Maru
 * Contains audio management and sound generation
 */
export * from './AudioManager';
export * from './types';

// Note: SoundGenerator is internal to AudioManager, not exported intentionally
```

---

## Files to Update

| File | Change | Reason |
|------|--------|--------|
| `src/game/index.ts` | Add `AchievementManager` export | Missing from barrel |

---

## Verification

### Test Import Works

After update, this should work:

```typescript
// In any file
import { AchievementManager, AchievementId, ACHIEVEMENTS } from '../game';
```

---

## Test Coverage

No new tests needed - this is an export-only change. Existing tests will verify the exports work.

---

## Verification Checklist

- [ ] Update `src/game/index.ts` to export `AchievementManager`
- [ ] Verify no TypeScript errors with new exports
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds

---

## AI Agent Instructions

1. Add `export * from './AchievementManager';` to `src/game/index.ts`
2. Run `npm run typecheck` to verify exports work
3. Run `npm run build` to verify no circular dependencies
4. No other changes needed

---

## Benefits

1. **Consistency** - All game modules exported from barrel
2. **Discoverability** - IDE auto-import finds AchievementManager
3. **AI-Friendly** - Predictable import patterns
