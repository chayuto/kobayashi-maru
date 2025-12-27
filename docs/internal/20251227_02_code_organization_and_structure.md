# Code Organization and Structure for AI Agent Friendliness

**Date:** 2025-12-27  
**Category:** Organization  
**Priority:** HIGH  
**Effort:** Medium  

---

## Executive Summary

Proper code organization is critical for AI coding agents to navigate and modify codebases efficiently. This document outlines recommendations for directory structure, file naming, barrel exports, and module boundaries.

---

## Current State Assessment

### ✅ Strengths

1. **Clear Directory Hierarchy**
   ```
   src/
   ├── core/           # Game facade, managers, services
   ├── ecs/            # Components, entities, world
   ├── systems/        # 17 ECS systems
   ├── game/           # Game managers (Wave, Score, etc.)
   ├── rendering/      # Visual components
   ├── ui/             # HUD, panels, overlays
   ├── config/         # Centralized configuration
   ├── types/          # Type definitions
   └── __tests__/      # All test files
   ```

2. **Barrel Exports** - Many directories have `index.ts` files
3. **Consistent Naming** - Files named after their main export

### ⚠️ Areas for Improvement

1. **Flat Test Directory** - All 50+ tests in one folder
2. **Missing Barrel Exports** - Some directories lack `index.ts`
3. **Large Files** - Some files exceed 500 LOC
4. **Inconsistent Exports** - Mix of default and named exports

---

## Recommendations for AI Coding Agents

### 1. Hierarchical Test Organization

**Recommendation:** Mirror source structure in test directory.

**Current:**
```
src/__tests__/
├── abilitySystem.test.ts
├── aiSystem.test.ts
├── combatSystem.test.ts
├── ecs.test.ts
├── entityPool.test.ts
├── gameState.test.ts
├── ... (50+ flat files)
```

**Proposed:**
```
src/__tests__/
├── core/
│   ├── DebugManager.test.ts
│   ├── EventBus.test.ts
│   └── managers/
│       ├── GameplayManager.test.ts
│       └── InputRouter.test.ts
├── ecs/
│   ├── components.test.ts
│   ├── entityFactory.test.ts
│   └── entityPool.test.ts
├── systems/
│   ├── aiSystem.test.ts
│   ├── combatSystem.test.ts
│   └── abilitySystem.test.ts
├── game/
│   ├── waveManager.test.ts
│   └── scoreManager.test.ts
└── ui/
    ├── HUDManager.test.ts
    └── GameOverScreen.test.ts
```

**Why Agent-Friendly:**
- Agents can find related tests by mirroring source paths
- Test discovery matches mental model of codebase
- Reduced cognitive load when adding new tests

**Action Items:**
- [ ] Create subdirectories matching src/ structure
- [ ] Move tests to corresponding directories
- [ ] Update any test imports as needed
- [ ] Configure Vitest to discover nested tests

---

### 2. Complete Barrel Export Coverage

**Recommendation:** Every directory with 2+ files needs an `index.ts`.

**Missing Barrel Exports:**
```typescript
// src/ui/panels/index.ts - NEEDED
export { AIPanel } from './AIPanel';
export { AIThoughtFeed } from './AIThoughtFeed';
export { AchievementToast } from './AchievementToast';
export { CombatStatsPanel } from './CombatStatsPanel';
export { ComboPanel } from './ComboPanel';
export { ResourcePanel } from './ResourcePanel';
export { ScorePanel } from './ScorePanel';
export { StatusPanel } from './StatusPanel';
export { TurretCountPanel } from './TurretCountPanel';
export { WavePanel } from './WavePanel';

// src/ai/spatial/index.ts - NEEDED
// src/ai/prediction/index.ts - NEEDED
// src/ai/visualization/index.ts - NEEDED
```

**Why Agent-Friendly:**
- Agents use barrel imports to discover available exports
- Reduces import path complexity
- Single point of truth for module API

**Action Items:**
- [ ] Audit all directories for missing index.ts
- [ ] Create barrel exports with consistent style
- [ ] Document barrel export requirement in CONTRIBUTING.md

---

### 3. File Size Limits and Decomposition

**Recommendation:** Enforce 400 LOC soft limit, 600 LOC hard limit.

**Current Large Files:**
| File | Lines | Recommendation |
|------|-------|----------------|
| HUDManager.ts | 838 | Split into HUDLayout + HUDUpdater |
| Game.ts | 469 | Acceptable (reduced from 1164) |
| combatSystem.ts | 423 | Consider splitting weapon types |
| abilitySystem.ts | 400+ | Extract ability handlers |

**Decomposition Pattern:**
```typescript
// Instead of one large file:
// src/systems/combatSystem.ts (423 lines)

// Split into:
// src/systems/combat/index.ts - exports
// src/systems/combat/combatSystem.ts - main system
// src/systems/combat/beamWeapons.ts - beam logic
// src/systems/combat/projectileWeapons.ts - projectile logic
// src/systems/combat/combatStats.ts - stats tracking
```

**Why Agent-Friendly:**
- Smaller files fit in agent context windows
- Focused files are easier to understand
- Changes are more isolated

**Action Items:**
- [ ] Identify files exceeding 400 LOC
- [ ] Create decomposition plans for each
- [ ] Execute decomposition with test coverage

---

### 4. Consistent Export Patterns

**Recommendation:** Use named exports exclusively, no default exports.

**Current Issues:**
```typescript
// Mixed patterns create confusion
export default class Game { }  // Default export
export { Game };               // Also named export
```

**Standard Pattern:**
```typescript
// src/core/Game.ts
export class Game { }

// src/core/index.ts
export { Game } from './Game';
export { EventBus } from './EventBus';
export type { GameConfig } from './types';
```

**Why Agent-Friendly:**
- Named exports are always discoverable
- Auto-import works reliably
- Refactoring is consistent

**Action Items:**
- [ ] Add ESLint rule: `import/no-default-export`
- [ ] Convert existing default exports
- [ ] Document in style guide

---

### 5. Consistent File Naming Conventions

**Recommendation:** Standardize file naming across codebase.

**Current Patterns (Inconsistent):**
```
GameState.ts       # PascalCase (class file)
gameState.ts       # camelCase (also a class file)
combat.config.ts   # dot notation (config file)
index.ts           # lowercase (barrel export)
```

**Proposed Standard:**
```
Components/Classes:  PascalCase.ts      (Game.ts, WaveManager.ts)
Functions/Modules:   camelCase.ts       (entityFactory.ts)
Configurations:      name.config.ts     (combat.config.ts)
Types/Interfaces:    types.ts           (in types/ directory)
Barrel Exports:      index.ts
Tests:               Name.test.ts       (Game.test.ts)
```

**Why Agent-Friendly:**
- Predictable file locations from names
- Consistent mental model
- Auto-complete works better

**Action Items:**
- [ ] Audit existing file names
- [ ] Standardize naming conventions
- [ ] Add ESLint unicorn/filename-case rule

---

### 6. Module Boundary Documentation

**Recommendation:** Each directory should have a README explaining its purpose.

**Example: src/systems/README.md**
```markdown
# ECS Systems

This directory contains all Entity-Component-System processing logic.

## System List
- `aiSystem.ts` - Enemy AI behavior processing
- `combatSystem.ts` - Turret firing and damage calculation
- `damageSystem.ts` - Health/shield damage application

## Adding New Systems
1. Create `newSystem.ts` following the pattern
2. Register in `Game.ts` via SystemManager
3. Add tests in `__tests__/systems/`

## System Execution Order
See SystemManager.ts for priority values.
```

**Why Agent-Friendly:**
- Agents read README first to understand context
- Purpose is immediately clear
- Adding new code follows documented patterns

**Action Items:**
- [ ] Create README.md for each src/ subdirectory
- [ ] Document purpose, patterns, and conventions
- [ ] Link to related documentation

---

### 7. Import Organization

**Recommendation:** Standardize import grouping and ordering.

**Proposed Import Order:**
```typescript
// 1. External libraries (node_modules)
import { Application, Container } from 'pixi.js';
import { addEntity, query } from 'bitecs';

// 2. Internal absolute paths (from src/)
import { Game } from '../core';
import { Position, Health } from '../ecs/components';

// 3. Relative paths (same module)
import { localHelper } from './helpers';
import type { LocalType } from './types';

// 4. Type-only imports (always last)
import type { GameWorld } from '../ecs/world';
```

**Why Agent-Friendly:**
- Predictable import structure
- Easy to scan for dependencies
- Clear internal vs external separation

**Action Items:**
- [ ] Add ESLint import/order configuration
- [ ] Configure auto-fix in IDE settings
- [ ] Document in style guide

---

## Implementation Checklist

### Phase 1: Barrel Exports (2 hours)
- [ ] Create missing index.ts files
- [ ] Standardize export patterns
- [ ] Update existing imports

### Phase 2: Test Organization (2-3 hours)
- [ ] Create test subdirectory structure
- [ ] Move tests to appropriate directories
- [ ] Verify all tests still pass

### Phase 3: File Decomposition (4-6 hours)
- [ ] Decompose HUDManager.ts
- [ ] Split abilitySystem.ts handlers
- [ ] Refactor large files

### Phase 4: Documentation (2 hours)
- [ ] Create directory README files
- [ ] Document naming conventions
- [ ] Update AGENTS.md

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Directories with index.ts | ~70% | 100% |
| Test organization | Flat | Hierarchical |
| Max file size | 838 LOC | 400 LOC |
| Directory README coverage | 0% | 100% |

---

## References

- `src/config/index.ts` - Good barrel export example
- `src/systems/index.ts` - Complete system exports
- `src/ui/panels/` - Needs barrel export

---

*This document is part of the Kobayashi Maru maintainability initiative.*
