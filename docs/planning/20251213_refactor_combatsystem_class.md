# Refactoring: CombatSystem to Class

## Overview
Convert function-based `combatSystem` to class for better testability.

**Effort:** ~1.5 hours | **Impact:** Medium

---

## Current Pattern

[combatSystem.ts](file:///Users/chayut/repos/kobayashi-maru/src/systems/combatSystem.ts) uses closure pattern:

```typescript
export function createCombatSystem(particleSystem?) {
  let totalDamage = 0;  // Closure state
  
  function applyDamage(...) { ... }
  function combatSystem(world, dt, time) { ... }
  
  return { run: combatSystem, getStats, resetStats };
}
```

**Problems:**
- State hidden in closures
- Harder to mock for testing
- No clear interface

---

## Proposed Pattern

```typescript
export class CombatSystem implements System {
  private totalDamage = 0;
  private particleSystem: ParticleSystem | null;
  
  constructor(particleSystem?: ParticleSystem) { ... }
  
  run(world: World, dt: number, time: number): World { ... }
  getStats(): CombatStats { ... }
  resetStats(): void { ... }
}
```

---

## Steps

1. [ ] Create `CombatSystem` class in same file
2. [ ] Move closure state to class fields
3. [ ] Convert functions to methods
4. [ ] Update `SystemManager` registration
5. [ ] Update all usages
6. [ ] Remove old factory function
7. [ ] Verify: lint and tests pass
