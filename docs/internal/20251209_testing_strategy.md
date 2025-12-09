# Testing Strategy
**Date:** 2024-05-22
**Status:** Active

## Overview

We use **Vitest** for testing. The goal is to ensure stability without slowing down development. Given the ECS nature, unit testing systems is straightforward.

## Test Stack

- **Runner**: Vitest
- **Environment**: jsdom (for Canvas/PixiJS mocking)

## Testing Layers

### 1. Unit Tests (High Priority)
Focus on ECS Systems and Managers.

- **Systems**: Create a world, add entities with components, run the system, verify component data changes.
- **Managers**: Test state transitions and logic (e.g., ScoreManager adding points).
- **Utils**: Test helper functions and data structures (e.g., BinaryHeap, SpatialHash).

**Example System Test:**
```typescript
it('should move entity based on velocity', () => {
  const world = createWorld();
  const eid = addEntity(world);
  Position.x[eid] = 0;
  Velocity.x[eid] = 10;

  movementSystem(world, 1.0); // dt = 1.0

  expect(Position.x[eid]).toBe(10);
});
```

### 2. Integration Tests (Medium Priority)
Focus on critical flows.

- **Entity Factory**: Ensure entities are created with correct initial components.
- **Game Loop**: Verify systems run in the correct order (mocking the loop).

### 3. Visual/Snapshot Tests (Low Priority)
Since we use PixiJS/Canvas, visual regression testing is complex. Rely on logic verification instead.

## Running Tests

- `npm test`: Run all tests once.
- `npm run test:watch`: Run tests in watch mode.

## Best Practices

1. **Mock External Dependencies**: Mock `PixiJS` objects or AudioContext where possible to keep tests fast.
2. **Deterministic Tests**: Avoid `Math.random()` in tests. Mock it or use seeded values.
3. **Test Coverage**: Aim for high coverage on `systems/` and `game/` (Managers).
4. **Performance**: Tests should run in milliseconds.

## AI Agent Instructions
- Always write a test for a new bug fix.
- If adding a new system, add a corresponding `.test.ts` file in `src/__tests__/`.
- Run `npm test` before submitting any changes.
