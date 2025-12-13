# Refactoring: ECS Component Factories

## Overview
Add factory functions to ECS components for validation and consistency.

**Effort:** ~1 hour | **Impact:** Medium

---

## Current State

[components.ts](file:///Users/chayut/repos/kobayashi-maru/src/ecs/components.ts) has raw arrays:

```typescript
export const Health = {
  current: [] as number[],
  max: [] as number[]
};

// Usage (no validation)
Health.current[eid] = -50;  // Invalid but allowed!
Health.max[eid] = 0;        // Division by zero risk
```

---

## Proposed Enhancement

```typescript
// Factory function with validation
export function setHealth(eid: number, current: number, max: number): void {
  Health.current[eid] = Math.max(0, current);
  Health.max[eid] = Math.max(1, max);
}

export function damageHealth(eid: number, amount: number): void {
  Health.current[eid] = Math.max(0, Health.current[eid] - amount);
}

export function getHealthPercent(eid: number): number {
  return Health.current[eid] / Health.max[eid];
}
```

---

## Components to Enhance

| Component | Factories |
|-----------|-----------|
| `Health` | `setHealth`, `damageHealth`, `healHealth`, `getHealthPercent` |
| `Shield` | `setShield`, `damageShield`, `getShieldPercent` |
| `Position` | `setPosition`, `moveBy` |
| `Velocity` | `setVelocity`, `accelerate` |

---

## Steps

1. [ ] Add Health factory functions
2. [ ] Add Shield factory functions
3. [ ] Add Position/Velocity helpers
4. [ ] Update usages in entityFactory.ts
5. [ ] Update usages in systems
6. [ ] Verify: lint and tests pass
