# Sprint Plan: December 2025 - Code Quality & Extensibility

**Date:** December 7, 2025  
**Sprint Focus:** Completing refactoring, improving test organization, cleaning deprecated code, and enhancing extensibility  
**Total Tasks:** 15 independent AI-friendly tasks

---

## Sprint Summary

Following the deep codebase analysis, this sprint focuses on:
1. **Completing prior refactoring work** - HUD panel integration, entity pool usage
2. **Removing deprecated patterns** - Clean up legacy code that was marked deprecated
3. **Test organization** - Restructure 47 flat test files into logical groups
4. **Performance optimization** - Address identified bottlenecks
5. **Extensibility improvements** - Better abstractions and interfaces

---

## Priority Matrix

| Priority | Category | Task Count | Description |
|----------|----------|------------|-------------|
| 🔴 Critical | Architecture | 3 | Complete prior refactoring, remove tech debt |
| 🟠 High | Code Quality | 4 | Clean deprecated code, improve abstractions |
| 🟡 Medium | Organization | 4 | Test restructuring, documentation |
| 🟢 Low | Polish | 4 | Nice-to-have improvements |

---

## Task List

### 🔴 Critical Priority

| # | Task File | Description | Est. Effort |
|---|-----------|-------------|-------------|
| 1 | `20251207_sprint_plan_01_complete_hud_decomposition.md` | Fully integrate WavePanel, ResourcePanel, StatusPanel into HUDManager | Medium |
| 2 | `20251207_sprint_plan_02_integrate_entity_pool.md` | Use EntityPoolService across all entity creation points | Medium |
| 3 | `20251207_sprint_plan_03_complete_game_decomposition.md` | Further decompose Game.ts into focused managers | Large |

### 🟠 High Priority

| # | Task File | Description | Est. Effort |
|---|-----------|-------------|-------------|
| 4 | `20251207_sprint_plan_04_remove_deprecated_wave_events.md` | Remove deprecated WaveEventType, WaveEventCallback patterns | Small |
| 5 | `20251207_sprint_plan_05_consolidate_enemy_factories.md` | Remove deprecated faction-specific factory functions | Small |
| 6 | `20251207_sprint_plan_06_create_ui_base_component.md` | Create BaseUIComponent abstract class for all UI elements | Medium |
| 7 | `20251207_sprint_plan_07_unify_damage_integration.md` | Ensure all systems use centralized DamageService | Small |

### 🟡 Medium Priority

| # | Task File | Description | Est. Effort |
|---|-----------|-------------|-------------|
| 8 | `20251207_sprint_plan_08_reorganize_tests_by_domain.md` | Restructure __tests__ into domain folders | Medium |
| 9 | `20251207_sprint_plan_09_extract_ability_handlers.md` | Extract each ability into separate handler files | Medium |
| 10 | `20251207_sprint_plan_10_modularize_ai_behaviors.md` | Extract AI behaviors into separate strategy files | Medium |
| 11 | `20251207_sprint_plan_11_add_jsdoc_to_ui_components.md` | Document all UI components with JSDoc | Small |

### 🟢 Low Priority

| # | Task File | Description | Est. Effort |
|---|-----------|-------------|-------------|
| 12 | `20251207_sprint_plan_12_create_game_events_enum.md` | Consolidate all game event strings into typed enum | Small |
| 13 | `20251207_sprint_plan_13_add_barrel_exports.md` | Add missing barrel exports to all directories | Small |
| 14 | `20251207_sprint_plan_14_performance_config_integration.md` | Integrate PERFORMANCE_CONFIG into all relevant systems | Small |
| 15 | `20251207_sprint_plan_15_remove_placeholder_sprite_refs.md` | Clean up PLACEHOLDER_SPRITE_INDEX usage | Small |

---

## Dependency Notes

Most tasks are **fully independent** and can be worked on in parallel. However:

- Task 3 (Game decomposition) benefits from Task 1 (HUD decomposition) being done first
- Task 7 (Damage integration) should verify after Task 2 (Entity pool)
- Task 11 (JSDoc) should follow Task 6 (UI base component)

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| HUDManager.ts lines | 953 | <500 |
| Game.ts lines | 1233 | <400 |
| Deprecated functions | 10+ | 0 |
| Test directories | 1 (flat) | 6+ (by domain) |
| UI components with BaseComponent | 0 | All |
| Entity pool usage | ~10% | 100% |

---

## How to Use These Tasks

Each task document is designed for an AI coding agent. Key features:
1. **Self-contained** - All context needed is in the document
2. **Independent** - Can be done without other tasks (with noted exceptions)
3. **Verifiable** - Clear success criteria and test commands
4. **Scopable** - Can be partially completed if needed

To run a task, read the corresponding task file and follow the implementation steps.
