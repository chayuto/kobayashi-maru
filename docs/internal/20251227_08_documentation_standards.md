# Documentation Standards for AI Agent Friendliness

**Date:** 2025-12-27  
**Category:** Documentation  
**Priority:** HIGH  
**Effort:** Medium  

---

## Executive Summary

Comprehensive documentation is critical for AI coding agents to understand and modify code correctly. This document establishes documentation standards for JSDoc, README files, and agent instructions.

---

## Current State Assessment

### ✅ Good Documentation

1. **AGENTS.md** - AI agent instructions exist
2. **.github/copilot-instructions.md** - Comprehensive
3. **README.md** - Good overview
4. **Module-Level JSDoc** - Present in many files
5. **Planning Docs** - Extensive in `/docs/planning/`

### ⚠️ Areas for Improvement

1. **Function-Level JSDoc** - Inconsistent coverage
2. **Parameter Documentation** - Many missing @param
3. **Return Value Docs** - Many missing @returns
4. **Directory READMEs** - No subdirectory docs
5. **Architecture Diagrams** - Text-only descriptions

---

## Recommendations for AI Coding Agents

### 1. JSDoc Standards for Functions

**Recommendation:** All public functions must have complete JSDoc.

**Standard Template:**
```typescript
/**
 * Brief description of what the function does.
 * 
 * Longer description if needed, explaining:
 * - Algorithm or approach used
 * - Important side effects
 * - Performance characteristics
 * 
 * @param paramName - Description of parameter (include units)
 * @param optionalParam - Description [default: value]
 * @returns Description of return value
 * @throws {ErrorType} When error condition occurs
 * 
 * @example
 * ```typescript
 * const result = functionName(param1, param2);
 * console.log(result); // expected output
 * ```
 * 
 * @see RelatedFunction for related functionality
 * @since 1.0.0
 */
export function functionName(
    paramName: ParamType,
    optionalParam?: OptionalType
): ReturnType {
    // Implementation
}
```

**Example:**
```typescript
/**
 * Applies damage to an entity, prioritizing shields over health.
 * 
 * Damage is first absorbed by shields. Any remaining damage after
 * shields are depleted is applied to health. Status effects may be
 * applied based on the weapon type.
 * 
 * @param world - The ECS world instance
 * @param entityId - Target entity to damage
 * @param damage - Amount of damage to apply (in hit points)
 * @param weaponType - Type of weapon dealing damage (affects status effects)
 * @returns The actual damage dealt after shields/resistances
 * @throws {GameError} If entityId doesn't have Health component
 * 
 * @example
 * ```typescript
 * const actualDamage = applyDamage(world, enemyId, 50, TurretType.PHASER_ARRAY);
 * console.log(`Dealt ${actualDamage} damage`);
 * ```
 * 
 * @see applyBurning for fire damage over time
 * @see applyDrained for energy drain effects
 */
export function applyDamage(
    world: World,
    entityId: number,
    damage: number,
    weaponType: TurretType
): number {
    // Implementation
}
```

**Why Agent-Friendly:**
- Agents understand function purpose without reading code
- Parameters and returns are explicit
- Examples show correct usage

**Action Items:**
- [ ] Create JSDoc template snippets
- [ ] Add ESLint jsdoc plugin rules
- [ ] Document JSDoc requirements in AGENTS.md

---

### 2. Interface and Type Documentation

**Recommendation:** All interfaces must document each property.

**Pattern:**
```typescript
/**
 * Beam visual data for rendering energy weapons.
 * 
 * Represents a single beam from turret to target with
 * animation properties for visual effects.
 */
export interface BeamVisual {
    /** Starting X coordinate of beam (turret position) */
    startX: number;
    
    /** Starting Y coordinate of beam (turret position) */
    startY: number;
    
    /** Ending X coordinate of beam (target position) */
    endX: number;
    
    /** Ending Y coordinate of beam (target position) */
    endY: number;
    
    /** Turret type for determining beam color and effects */
    turretType: TurretType;
    
    /** 
     * Beam intensity for pulsing effect.
     * @range 0.0 to 1.0 (0 = invisible, 1 = full brightness)
     */
    intensity: number;
    
    /** 
     * Beam segments for electricity jitter effect.
     * @see generateBeamSegments for creation
     */
    segments: BeamSegment[];
    
    /** 
     * Time since beam was created, in seconds.
     * Used for fade-out animations.
     */
    age: number;
}
```

**Why Agent-Friendly:**
- Property purposes are clear
- Ranges and constraints documented
- Related code referenced

**Action Items:**
- [ ] Document all interface properties
- [ ] Add @range annotations for numeric limits
- [ ] Cross-reference related types

---

### 3. Module-Level Documentation

**Recommendation:** Every file should have a module-level JSDoc header.

**Pattern:**
```typescript
/**
 * Combat System for Kobayashi Maru
 * 
 * Handles turret firing, damage calculation, and combat statistics.
 * This system processes all entities with Turret and Target components,
 * applying damage based on weapon type and generating visual effects.
 * 
 * @module systems/combatSystem
 * 
 * ## Dependencies
 * - Position, Turret, Target, Faction components
 * - ParticleSystem for visual effects
 * - AudioManager for weapon sounds
 * 
 * ## System Priority
 * Runs at priority 50, after targeting (40) and before damage (70).
 * 
 * ## Configuration
 * Uses COMBAT_CONFIG from src/config/combat.config.ts
 * 
 * @example
 * ```typescript
 * import { createCombatSystem } from '../systems';
 * 
 * const combatSystem = createCombatSystem(particleSystem);
 * systemManager.register('combat', combatSystem, 50);
 * ```
 * 
 * @see createTargetingSystem - Runs before this system
 * @see createDamageSystem - Runs after this system
 */

// Imports and implementation...
```

**Why Agent-Friendly:**
- File purpose immediately clear
- Dependencies listed
- Integration points documented

**Action Items:**
- [ ] Add module docs to all source files
- [ ] Include dependencies and relationships
- [ ] Document configuration sources

---

### 4. Directory README Files

**Recommendation:** Each src/ subdirectory should have a README.md.

**Template: src/systems/README.md**
```markdown
# ECS Systems

This directory contains all Entity-Component-System processing logic.

## Overview

Systems are pure functions that process entities with specific components.
They run each frame in priority order defined by SystemManager.

## System List

| System | Priority | Description |
|--------|----------|-------------|
| collision | 10 | Updates spatial hash for collision detection |
| ai | 20 | Processes enemy AI behavior |
| movement | 30 | Applies velocity to position |
| targeting | 40 | Finds valid targets for turrets |
| combat | 50 | Turret firing and beam damage |
| projectile | 60 | Projectile movement and collision |
| damage | 70 | Applies accumulated damage |
| statusEffect | 80 | Processes burning, slowed, etc. |
| ability | 90 | Enemy special abilities |
| render | 200 | Updates sprite positions |

## Adding a New System

1. Create `newSystem.ts` following the pattern:
   ```typescript
   export function createNewSystem(dependencies: Dependencies) {
       return function newSystem(world: World, delta: number): World {
           // Process entities
           return world;
       };
   }
   ```

2. Register in `Game.ts`:
   ```typescript
   systemManager.register('newSystem', createNewSystem(deps), priority);
   ```

3. Add tests in `__tests__/systems/newSystem.test.ts`

## Common Patterns

### Querying Entities
```typescript
const entities = query(world, [Position, Health, Faction]);
```

### Accessing Components
```typescript
const x = Position.x[entityId];
Health.current[entityId] -= damage;
```

## Related Documentation

- [Architecture](../../AGENTS.md) - Overall architecture
- [Components](../ecs/README.md) - Component definitions
- [Testing](../__tests__/README.md) - Test patterns
```

**Why Agent-Friendly:**
- Quick navigation to relevant files
- Adding new code follows documented patterns
- Related docs are linked

**Action Items:**
- [ ] Create README for each src/ subdirectory
- [ ] Include file lists and descriptions
- [ ] Document common patterns

---

### 5. Architecture Documentation

**Recommendation:** Create visual architecture documentation.

**Content: ARCHITECTURE.md**
```markdown
# Kobayashi Maru Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          PRESENTATION                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ UI/HUD      │  │ Rendering    │  │ Audio                   │ │
│  │ - Panels    │  │ - Sprites    │  │ - SoundGenerator        │ │
│  │ - Overlays  │  │ - Particles  │  │ - AudioManager          │ │
│  │ - Menus     │  │ - Effects    │  │                         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          APPLICATION                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Game.ts     │  │ Managers     │  │ Services                │ │
│  │ (Facade)    │  │ - Gameplay   │  │ - DamageService         │ │
│  │             │  │ - Render     │  │ - ErrorService          │ │
│  │             │  │ - UI         │  │ - StorageService        │ │
│  │             │  │ - Input      │  │                         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                            DOMAIN                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ ECS World   │  │ Systems      │  │ Game Logic              │ │
│  │ - Entities  │  │ - AI         │  │ - WaveManager           │ │
│  │ - Components│  │ - Combat     │  │ - ScoreManager          │ │
│  │ - Queries   │  │ - Movement   │  │ - ResourceManager       │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ PixiJS 8    │  │ bitECS       │  │ Web APIs                │ │
│  │ - WebGPU    │  │ - Components │  │ - Web Audio             │ │
│  │ - WebGL     │  │ - Queries    │  │ - LocalStorage          │ │
│  │             │  │ - World      │  │ - Canvas                │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Input → InputRouter → Actions → Managers → Systems → World → Render
                           │
                           └→ EventBus → UI Updates
```

## System Execution Order

```
collision (10) → ai (20) → movement (30) → targeting (40) →
combat (50) → projectile (60) → damage (70) → statusEffect (80) →
ability (90) → enemyCombat (100) → render (200)
```
```

**Why Agent-Friendly:**
- Visual understanding of structure
- Data flow is explicit
- Execution order documented

**Action Items:**
- [ ] Create ARCHITECTURE.md
- [ ] Include ASCII diagrams
- [ ] Document key data flows

---

### 6. Change Log Documentation

**Recommendation:** Maintain structured change documentation.

**Pattern: docs/change_notes/YYYYMMDD_change_title.md**
```markdown
# [Change Title]

**Date:** YYYY-MM-DD  
**Author:** [Author or AI Agent]  
**Type:** Feature | Bugfix | Refactor | Chore  
**Related Issue:** #XXX (if applicable)

## Summary

Brief description of what changed and why.

## Changes Made

### Files Modified
- `path/to/file1.ts` - Description of changes
- `path/to/file2.ts` - Description of changes

### Files Added
- `path/to/new/file.ts` - Purpose of new file

### Files Deleted
- `path/to/old/file.ts` - Reason for removal

## Testing

### Automated Tests
- [ ] All existing tests pass
- [ ] New tests added for: [feature]

### Manual Testing
- [ ] Verified [specific behavior]
- [ ] Tested on [platforms/browsers]

## Migration Notes

If applicable, describe any migration steps needed.

## Known Issues

List any known issues or follow-up work needed.
```

**Why Agent-Friendly:**
- Consistent change documentation
- Easy to understand modifications
- Testing requirements clear

**Action Items:**
- [ ] Create change log template
- [ ] Document template in AGENTS.md
- [ ] Apply to all future changes

---

### 7. Code Comment Standards

**Recommendation:** Use comments purposefully, not excessively.

**Good Comments:**
```typescript
// Explaining WHY, not WHAT
// Skip rendering if beam is too short to prevent division by zero
if (length < MIN_BEAM_LENGTH) return;

// Complex algorithm explanation
// Using perpendicular vector for electricity jitter:
// dx/dy normalized gives direction, -dy/dx gives perpendicular
const perpX = -dy / length;
const perpY = dx / length;

// Business logic context
// Boss waves occur every 5 waves, with special mechanics
const isBossWave = waveNumber % 5 === 0;

// Warning about non-obvious behavior
// WARNING: This modifies the input array in place for performance
entities.sort((a, b) => Priority[a] - Priority[b]);
```

**Bad Comments:**
```typescript
// BAD: Stating the obvious
const x = 5; // Set x to 5

// BAD: Outdated comment
// Returns the enemy count
function getTurretCount() { } // Comment doesn't match

// BAD: Commented-out code
// const oldImplementation = () => { ... };
```

**Why Agent-Friendly:**
- Comments explain intent, not syntax
- Agents don't waste context on noise
- Business logic is explicit

**Action Items:**
- [ ] Audit comments for quality
- [ ] Remove commented-out code
- [ ] Add WHY comments where needed

---

## Implementation Checklist

### Phase 1: JSDoc Coverage (4-6 hours)
- [ ] Add module docs to all files
- [ ] Document all public functions
- [ ] Document all interfaces

### Phase 2: Directory READMEs (2-3 hours)
- [ ] Create template
- [ ] Add README to each src/ subdirectory
- [ ] Link between related docs

### Phase 3: Architecture Docs (2 hours)
- [ ] Create ARCHITECTURE.md
- [ ] Add ASCII diagrams
- [ ] Document data flows

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| JSDoc on public functions | ~50% | 100% |
| Directories with README | 0% | 100% |
| Architecture diagrams | 0 | 3+ |
| Change log entries | Inconsistent | 100% |

---

## References

- `AGENTS.md` - Agent instructions
- `.github/copilot-instructions.md` - Copilot guidance
- `README.md` - Project overview
- `docs/` - All documentation

---

*This document is part of the Kobayashi Maru maintainability initiative.*
