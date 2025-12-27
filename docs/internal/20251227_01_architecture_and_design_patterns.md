# Architecture and Design Patterns for Maintainable, Agent-Friendly Code

**Date:** 2025-12-27  
**Category:** Architecture  
**Priority:** HIGH  
**Effort:** Ongoing  

---

## Executive Summary

This document outlines architecture and design pattern recommendations to make the codebase more maintainable and AI coding agent friendly. The current ECS-based architecture is solid; these recommendations build upon it.

---

## Current State Assessment

### ✅ What's Working Well

1. **ECS Pattern (bitECS)** - Clean Entity-Component-System architecture
2. **Manager Pattern** - Separation of concerns via GameplayManager, RenderManager, UIController, InputRouter
3. **Service Container** - Typed dependency injection with lazy initialization
4. **System Manager** - Priority-based system execution with clear ordering
5. **Event Bus** - Type-safe pub/sub messaging between systems

### ⚠️ Areas for Improvement

1. **God Class Prevention** - Some files still exceed 500 LOC
2. **Interface Definitions** - Not all services have explicit interfaces
3. **Facade Pattern** - Game.ts could be thinner
4. **Plugin Architecture** - No formal extension system

---

## Recommendations for AI Coding Agents

### 1. Strict Single Responsibility Principle (SRP)

**Recommendation:** Every class/module should have exactly ONE reason to change.

**Agent-Friendly Pattern:**
```typescript
// GOOD: Each manager handles one domain
class GameplayManager { /* game logic only */ }
class RenderManager { /* rendering only */ }
class UIController { /* UI state only */ }

// BAD: Mixed responsibilities
class GameManager {
  updateLogic() { }
  renderSprites() { }
  handleInput() { }
}
```

**Why Agent-Friendly:**
- Agents can modify one file without understanding entire codebase
- Clear file purposes reduce context needed
- Tests are scoped to single concerns

**Action Items:**
- [ ] Document SRP violations in code reviews
- [ ] Establish 300-400 LOC soft limit per file
- [ ] Create file decomposition guidelines

---

### 2. Interface-First Design

**Recommendation:** Define interfaces before implementations for all services.

**Agent-Friendly Pattern:**
```typescript
// Step 1: Define interface
export interface IWaveManager {
  startWave(waveNumber: number): void;
  getCurrentWave(): number;
  getEnemyCount(): number;
  isWaveComplete(): boolean;
}

// Step 2: Implement
export class WaveManager implements IWaveManager {
  // Implementation
}

// Step 3: Register with container
services.register('waveManager', () => new WaveManager() as IWaveManager);
```

**Why Agent-Friendly:**
- Agents can understand contracts without reading implementation
- Mock generation is trivial
- Type system enforces correct usage

**Action Items:**
- [ ] Extract interfaces for all services in ServiceRegistry
- [ ] Create `src/types/interfaces/` directory
- [ ] Document interface requirements in AGENTS.md

---

### 3. Composition Over Inheritance

**Recommendation:** Use composition patterns instead of class inheritance.

**Agent-Friendly Pattern:**
```typescript
// GOOD: Composition via factory
function createEnemy(config: EnemyConfig): Enemy {
  return {
    ...createPosition(config.x, config.y),
    ...createHealth(config.health),
    ...createFaction(config.faction),
  };
}

// BAD: Deep inheritance
class KlingonShip extends EnemyShip extends Ship extends Entity { }
```

**Why Agent-Friendly:**
- No hidden behavior in parent classes
- Each capability is explicit and testable
- Changes don't cascade through hierarchy

**Action Items:**
- [ ] Audit existing inheritance usage
- [ ] Convert to composition where practical
- [ ] Document composition patterns in style guide

---

### 4. Explicit Dependencies

**Recommendation:** All dependencies should be injected, never imported singletons.

**Agent-Friendly Pattern:**
```typescript
// GOOD: Explicit dependency injection
export function createCombatSystem(
  particleSystem: ParticleSystem,
  audioManager: AudioManager
) {
  return function combatSystem(world: World, delta: number) {
    // Uses injected dependencies
  };
}

// BAD: Hidden singleton access
export function combatSystem(world: World, delta: number) {
  AudioManager.getInstance().play(SoundType.EXPLOSION); // Hidden dependency
}
```

**Why Agent-Friendly:**
- Agents can trace all dependencies from function signature
- Test mocking is straightforward
- No hidden global state

**Action Items:**
- [ ] Audit singleton usage patterns
- [ ] Migrate hidden dependencies to injection
- [ ] Update ServiceContainer with all dependencies

---

### 5. Factory Pattern Standardization

**Recommendation:** Use consistent factory patterns for entity creation.

**Current Pattern (Good):**
```typescript
// Standardized factory in genericFactory.ts
export function createEnemy(world: GameWorld, factionId: number, x: number, y: number): number {
  const template = getEnemyTemplate(factionId);
  return createEnemyFromTemplate(world, template, x, y);
}
```

**Extend to All Entities:**
```typescript
// Proposed: Unified entity factory interface
export interface EntityFactory<T extends EntityConfig> {
  create(world: GameWorld, config: T): number;
  recycle(world: GameWorld, entity: number): void;
  reset(entity: number): void;
}
```

**Why Agent-Friendly:**
- Consistent creation patterns across all entity types
- Agents learn one pattern, apply everywhere
- Pool management is uniform

**Action Items:**
- [ ] Define EntityFactory interface
- [ ] Implement for all entity types
- [ ] Document in entity creation guide

---

### 6. System Interface Standardization

**Recommendation:** All ECS systems should follow identical signatures.

**Current Signatures (Inconsistent):**
```typescript
// Some systems return void
function aiSystem(world: World, delta: number, gameTime: number): void
// Some return World
function movementSystem(world: World, delta: number): World
// Some are objects with update method
{ update: (world: World, delta: number) => void }
```

**Proposed Standard:**
```typescript
// All systems should return World (even if unchanged)
export type ECSSystem = (world: World, context: SystemContext) => World;

export interface SystemContext {
  delta: number;
  gameTime: number;
  services: ServiceContainer;
}
```

**Why Agent-Friendly:**
- One pattern to learn
- SystemManager can be simplified
- Test harness is consistent

**Action Items:**
- [ ] Define unified SystemContext type
- [ ] Migrate all systems to consistent signature
- [ ] Update SystemManager to use new pattern

---

### 7. Layer Architecture Enforcement

**Recommendation:** Enforce strict layer dependencies.

**Current Layer Structure:**
```
Presentation (ui/, rendering/)
     ↓
Application (core/managers/, game/)
     ↓
Domain (ecs/, systems/)
     ↓
Infrastructure (services/, audio/, collision/)
```

**Rules:**
- Upper layers can import lower layers
- Lower layers NEVER import upper layers
- Same-layer imports require explicit interfaces

**Why Agent-Friendly:**
- Agents understand where code belongs
- Circular dependency prevention
- Clear modification boundaries

**Action Items:**
- [ ] Add ESLint import/order rules
- [ ] Create barrel exports enforcing boundaries
- [ ] Document layer rules in AGENTS.md

---

## Implementation Checklist

### Phase 1: Documentation (1-2 hours)
- [ ] Document current architecture in ARCHITECTURE.md
- [ ] Define layer boundaries
- [ ] Create interface extraction plan

### Phase 2: Interface Extraction (4-6 hours)
- [ ] Extract interfaces for all services
- [ ] Update ServiceContainer typings
- [ ] Create mock generators for testing

### Phase 3: System Unification (4-6 hours)
- [ ] Define SystemContext interface
- [ ] Migrate all 17 systems to new pattern
- [ ] Update SystemManager

### Phase 4: Factory Standardization (2-4 hours)
- [ ] Define EntityFactory interface
- [ ] Implement for all entity types
- [ ] Integrate with PoolManager

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Interface coverage | ~30% | 100% | Services with interfaces |
| System signature consistency | ~60% | 100% | Systems matching standard |
| Max file LOC | 838 | 400 | HUDManager.ts |
| Layer violations | Unknown | 0 | ESLint import rules |

---

## References

- `src/core/services/ServiceContainer.ts` - Current DI implementation
- `src/systems/SystemManager.ts` - Current system management
- `src/ecs/genericFactory.ts` - Entity creation pattern
- `.github/copilot-instructions.md` - Agent guidance

---

*This document is part of the Kobayashi Maru maintainability initiative.*
