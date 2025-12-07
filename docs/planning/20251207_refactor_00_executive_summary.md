# Deep Code Analysis: Refactoring for Long-Term Maintainability

**Date:** December 7, 2025  
**Analysis Type:** Architecture & Code Quality Deep Dive  
**Scope:** Full codebase analysis for maintainability, scalability, and efficiency

---

## Executive Summary

This analysis identifies **12 critical refactoring opportunities** across the Kobayashi Maru codebase. The issues are categorized by impact and complexity, with each task designed for agentic AI implementation.

### Priority Matrix

| Priority | Category | Tasks | Estimated Impact |
|----------|----------|-------|------------------|
| 🔴 Critical | Architecture | 3 | High - Blocks future development |
| 🟠 High | Performance | 3 | High - Affects gameplay quality |
| 🟡 Medium | Code Quality | 4 | Medium - Technical debt |
| 🟢 Low | Polish | 2 | Low - Nice to have |

---

## Critical Issues (🔴)

### 1. God Class Anti-Pattern: Game.ts (1196 lines)
**File:** `src/core/Game.ts`  
**Problem:** Single file handles initialization, game loop, input, UI coordination, state management, and entity lifecycle.  
**Impact:** Impossible to test in isolation, high coupling, difficult to extend.  
**Task:** `20251207_refactor_02_game_class_decomposition.md`

### 2. Duplicated Damage Logic
**Files:** `combatSystem.ts`, `projectileSystem.ts`, `enemyProjectileSystem.ts`  
**Problem:** `applyDamage()` function duplicated across 3 files with slight variations.  
**Impact:** Bug fixes must be applied in multiple places, inconsistent behavior.  
**Task:** `20251207_refactor_03_damage_service_extraction.md`

### 3. Mixed Event Systems
**Files:** `waveManager.ts`, `damageSystem.ts`, `EventBus.ts`  
**Problem:** Dual event systems (local callbacks + EventBus) with deprecated markers but still in use.  
**Impact:** Confusing API, memory leak potential, inconsistent patterns.  
**Task:** `20251207_refactor_04_event_system_unification.md`

---

## High Priority Issues (🟠)

### 4. Entity Pool Not Utilized
**File:** `src/ecs/entityPool.ts`  
**Problem:** EntityPool class exists but is never instantiated or used. All entities created via `addEntity()` directly.  
**Impact:** GC spikes during gameplay, performance degradation with many entities.  
**Task:** `20251207_refactor_05_entity_pool_integration.md`

### 5. Inefficient Particle System
**File:** `src/rendering/ParticleSystem.ts`  
**Problem:** Creates new Graphics objects per particle, redraws on every color change, no batching.  
**Impact:** High draw calls, GC pressure, frame drops during explosions.  
**Task:** `20251207_refactor_06_particle_system_optimization.md`

### 6. Query Recreation Every Frame
**Files:** Multiple system files  
**Problem:** `defineQuery()` called at module level is correct, but some systems recreate arrays unnecessarily.  
**Impact:** Memory allocation per frame, GC pressure.  
**Task:** `20251207_refactor_07_query_optimization.md`

---

## Medium Priority Issues (🟡)

### 7. Constants File Bloat
**File:** `src/types/constants.ts`  
**Problem:** Single 350+ line file contains all game configuration, making it hard to find and modify values.  
**Impact:** Developer friction, merge conflicts, no logical grouping.  
**Task:** `20251207_refactor_08_config_modularization.md`

### 8. UI Component Inconsistency
**Files:** `src/ui/*.ts`  
**Problem:** No base class or interface for UI components. Each implements its own patterns for show/hide, positioning, cleanup.  
**Impact:** Inconsistent behavior, code duplication, harder to add new UI.  
**Task:** `20251207_refactor_09_ui_component_base.md`

### 9. System Manager Type Complexity
**File:** `src/systems/SystemManager.ts`  
**Problem:** 4 different function signatures supported with runtime type checking. Complex union types.  
**Impact:** Confusing API, potential runtime errors, hard to add new systems.  
**Task:** `20251207_refactor_10_system_interface_simplification.md`

### 10. Hardcoded Magic Numbers
**Files:** Throughout codebase  
**Problem:** Values like `32`, `0.5`, `1000` scattered without named constants.  
**Impact:** Unclear intent, difficult to tune, inconsistent values.  
**Task:** `20251207_refactor_11_magic_number_extraction.md`

---

## Low Priority Issues (🟢)

### 11. Missing TypeScript Strict Patterns
**Files:** Various  
**Problem:** Some files use `any` types, missing return types, inconsistent null handling.  
**Impact:** Reduced type safety, potential runtime errors.  
**Task:** `20251207_refactor_12_typescript_strictness.md`

### 12. Test File Organization
**File:** `src/__tests__/`  
**Problem:** All 45 test files in single flat directory. No grouping by feature or system.  
**Impact:** Hard to find related tests, no clear test structure.  
**Task:** `20251207_refactor_13_test_organization.md`

---

## Dependency Graph

```
refactor_02 (Game decomposition)
    └── refactor_03 (Damage service) - can extract during decomposition
    └── refactor_04 (Event unification) - cleaner after decomposition

refactor_05 (Entity pool) - independent
refactor_06 (Particle optimization) - independent
refactor_07 (Query optimization) - independent

refactor_08 (Config modularization) - independent
refactor_09 (UI base class) - independent
refactor_10 (System interface) - independent
refactor_11 (Magic numbers) - depends on refactor_08

refactor_12 (TypeScript) - can run anytime
refactor_13 (Test organization) - can run anytime
```

---

## Recommended Execution Order

1. **Phase 1 - Foundation** (Week 1)
   - `refactor_08` - Config modularization (enables other work)
   - `refactor_05` - Entity pool integration (performance win)

2. **Phase 2 - Architecture** (Week 2)
   - `refactor_02` - Game class decomposition
   - `refactor_03` - Damage service extraction
   - `refactor_04` - Event system unification

3. **Phase 3 - Performance** (Week 3)
   - `refactor_06` - Particle system optimization
   - `refactor_07` - Query optimization

4. **Phase 4 - Polish** (Week 4)
   - `refactor_09` - UI component base
   - `refactor_10` - System interface simplification
   - `refactor_11` - Magic number extraction

5. **Phase 5 - Cleanup** (Ongoing)
   - `refactor_12` - TypeScript strictness
   - `refactor_13` - Test organization

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Game.ts lines | 1196 | <300 |
| Duplicated damage logic | 3 files | 1 service |
| Entity pool usage | 0% | 100% |
| Draw calls (100 particles) | ~100 | <10 |
| Config file count | 1 | 6-8 |
| Test directories | 1 | 5+ |

---

## Individual Task Files

Each task below is a self-contained agentic AI task document:

### Critical Priority (🔴)
1. `20251207_refactor_02_game_class_decomposition.md` - Break up 1196-line God class
2. `20251207_refactor_03_damage_service_extraction.md` - Unify duplicated damage logic
3. `20251207_refactor_04_event_system_unification.md` - Remove dual event systems

### High Priority (🟠)
4. `20251207_refactor_05_entity_pool_integration.md` - Use existing but unused pool
5. `20251207_refactor_06_particle_system_optimization.md` - Batch rendering, reduce GC
6. `20251207_refactor_07_query_optimization.md` - Reduce per-frame allocations

### Medium Priority (🟡)
7. `20251207_refactor_08_config_modularization.md` - Split 350-line constants file
8. `20251207_refactor_09_ui_component_base.md` - Standardize UI patterns
9. `20251207_refactor_10_system_interface_simplification.md` - Single system signature
10. `20251207_refactor_11_magic_number_extraction.md` - Name hardcoded values

### Low Priority (🟢)
11. `20251207_refactor_12_typescript_strictness.md` - Improve type safety
12. `20251207_refactor_13_test_organization.md` - Organize 45 test files
