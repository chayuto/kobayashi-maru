# Chore Refactoring: Executive Summary

**Date:** 2025-12-11  
**Goal:** Safe, high-impact refactoring for long-term maintainability  
**Approach:** Self-contained changes, 100% test coverage for changed lines

---

## Analysis Summary

After deep analysis of the codebase, I identified the following refactoring opportunities ranked by impact/risk ratio:

### High Impact, Low Risk (Priority 1)

| Task | File | Impact | Risk | Effort |
|------|------|--------|------|--------|
| 01 - Magic Numbers to Config | Multiple | HIGH | LOW | 2h |
| 02 - Consistent Query Pattern | Systems | MEDIUM | LOW | 1h |
| 03 - Missing Index Exports | game/, utils/ | MEDIUM | LOW | 30m |

### Medium Impact, Low Risk (Priority 2)

| Task | File | Impact | Risk | Effort |
|------|------|--------|------|--------|
| 04 - DamageService Adoption | combatSystem.ts | MEDIUM | LOW | 1h |
| 05 - StorageService Singleton | StorageService.ts | LOW | LOW | 30m |
| 06 - Unused Code Cleanup | Multiple | LOW | LOW | 1h |

---

## Current State Issues

### 1. Magic Numbers Scattered Throughout Code

```typescript
// src/systems/aiSystem.ts
const speed = Math.sqrt(...) || 100; // Default speed if 0
const flankFactor = Math.min(1, dist / 500);

// src/rendering/Starfield.ts
public update(deltaTime: number, speedX: number = 0, speedY: number = 100)

// src/game/spawnPoints.ts
export function getClusterPositions(count: number, clusterRadius: number = 100)
```

**Problem:** Hard to find, modify, and understand game balance.

### 2. Duplicate Damage Application Logic

```typescript
// src/systems/combatSystem.ts - has its own applyDamage()
function applyDamage(world: World, entityId: number, damage: number, ...): number {
  // 50+ lines of damage logic
}

// src/services/DamageService.ts - centralized version exists but not used everywhere
export function applyDamage(world: World, entityId: number, damage: number): number {
  // Same logic, cleaner
}
```

**Problem:** Code duplication, inconsistent damage handling.

### 3. Inconsistent Barrel Exports

```typescript
// src/game/index.ts - missing AchievementManager
export * from './waveConfig';
// ... but no AchievementManager export

// src/utils/index.ts - exists but minimal
export * from './BinaryHeap';
// Missing other utilities
```

**Problem:** Inconsistent import patterns confuse AI agents.

### 4. StorageService Not Singleton

```typescript
// Current: Must instantiate each time
const storage = new StorageService();
storage.save(StorageKeys.HIGH_SCORE, data);

// Better: Singleton like other services
StorageService.getInstance().save(StorageKeys.HIGH_SCORE, data);
```

**Problem:** Multiple instances possible, inconsistent with other services.

---

## Task Documents

| # | Document | Description |
|---|----------|-------------|
| 01 | `20251211_chore_01_magic_numbers.md` | Extract magic numbers to config |
| 02 | `20251211_chore_02_query_pattern.md` | Standardize bitECS query usage |
| 03 | `20251211_chore_03_barrel_exports.md` | Complete barrel export coverage |
| 04 | `20251211_chore_04_damage_service.md` | Adopt DamageService in combatSystem |
| 05 | `20251211_chore_05_storage_singleton.md` | Convert StorageService to singleton |
| 06 | `20251211_chore_06_dead_code.md` | Remove unused code |

---

## Execution Order

```
Week 1 (Safe Foundation):
├── Task 01: Magic Numbers (no behavior change)
├── Task 03: Barrel Exports (no behavior change)
└── Task 05: Storage Singleton (minimal change)

Week 2 (Code Quality):
├── Task 02: Query Pattern (standardization)
├── Task 04: DamageService Adoption (consolidation)
└── Task 06: Dead Code Cleanup (removal)
```

---

## Success Criteria

For each task:
- [ ] All changed lines have test coverage
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all tests)
- [ ] `npm run build` succeeds
- [ ] No runtime behavior changes (unless explicitly intended)

---

## Risk Mitigation

1. **Each task is self-contained** - Can be merged independently
2. **No behavior changes** - Only structural improvements
3. **Test coverage required** - All changes must be tested
4. **Incremental rollout** - One task at a time
