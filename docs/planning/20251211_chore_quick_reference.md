# Chore Refactoring: Quick Reference

**Date:** 2025-12-11  
**Total Tasks:** 6  
**Estimated Total Effort:** 6 hours

---

## Task Overview

| # | Task | Priority | Effort | Risk | Status |
|---|------|----------|--------|------|--------|
| 01 | Magic Numbers to Config | P1 | 2h | LOW | ⬜ |
| 02 | Query Pattern Standardization | P1 | 1h | LOW | ⬜ |
| 03 | Barrel Export Completion | P1 | 30m | LOW | ⬜ |
| 04 | DamageService Adoption | P2 | 1h | LOW | ⬜ |
| 05 | StorageService Singleton | P2 | 30m | LOW | ⬜ |
| 06 | Dead Code Removal | P2 | 1h | LOW | ⬜ |

---

## Execution Order

```
Phase 1 (No Behavior Change):
├── Task 03: Barrel Exports (30m) - Just add exports
├── Task 01: Magic Numbers (2h) - Extract to config
└── Task 05: Storage Singleton (30m) - Pattern change

Phase 2 (Code Quality):
├── Task 02: Query Pattern (1h) - Standardize bitECS
├── Task 06: Dead Code (1h) - Remove unused files
└── Task 04: DamageService (1h) - Consolidate logic
```

---

## Files Changed Per Task

### Task 01: Magic Numbers
- NEW: `src/config/ai.config.ts`
- UPDATE: `src/config/rendering.config.ts`
- UPDATE: `src/config/wave.config.ts`
- UPDATE: `src/config/performance.config.ts`
- UPDATE: `src/config/index.ts`
- UPDATE: `src/systems/aiSystem.ts`
- UPDATE: `src/rendering/Starfield.ts`
- UPDATE: `src/game/spawnPoints.ts`
- UPDATE: `src/services/ErrorService.ts`
- UPDATE: `src/systems/abilitySystem.ts`
- NEW: `src/__tests__/config.test.ts`

### Task 02: Query Pattern
- UPDATE: `src/core/GameInputHandler.ts` (if not deleted in Task 06)
- UPDATE: `src/core/managers/InputRouter.ts`

### Task 03: Barrel Exports
- UPDATE: `src/game/index.ts`

### Task 04: DamageService
- UPDATE: `src/services/DamageService.ts`
- UPDATE: `src/systems/combatSystem.ts`
- NEW/UPDATE: `src/__tests__/DamageService.test.ts`

### Task 05: StorageService Singleton
- UPDATE: `src/services/StorageService.ts`
- UPDATE: `src/game/highScoreManager.ts`
- UPDATE: `src/__tests__/StorageService.test.ts`

### Task 06: Dead Code
- DELETE: `src/core/GameInputHandler.ts`
- UPDATE: `src/core/index.ts` (remove export)

---

## Verification Commands

```bash
# After each task:
npm run lint
npm run test
npm run build

# Manual testing:
npm run dev
# Then test affected functionality in browser
```

---

## Key Principles

1. **No Behavior Changes** - Only structural improvements
2. **Test Coverage** - All changed lines must be tested
3. **Incremental** - One task at a time
4. **Reversible** - Each change can be reverted independently

---

## Risk Mitigation

- Each task is self-contained
- All tasks are LOW risk
- Existing tests catch regressions
- Manual testing verifies functionality

---

## Success Criteria

For ALL tasks:
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all 48+ tests)
- [ ] `npm run build` succeeds
- [ ] Game runs correctly in browser
