# TypeScript Standards
**Date:** 2024-05-22
**Status:** Active

## Overview

Strict type safety is crucial for maintaining this codebase. We use modern TypeScript features to ensure robustness.

## Configuration
- `strict: true` is enabled in `tsconfig.json`.
- `noImplicitAny` is enforced.

## Guidelines

### 1. No `any`
Avoid `any` at all costs. Use `unknown` if the type is truly not known yet, and narrow it down.
- **Bad**: `function process(data: any) { ... }`
- **Good**: `function process(data: GameData) { ... }`

### 2. Interfaces vs Types
- Use `interface` for public APIs and object shapes (extensibility).
- Use `type` for unions, intersections, and primitives.

### 3. ECS Types
- **Components**: Components in bitECS are objects containing TypedArrays. Define them in `src/ecs/components.ts`.
- **Entities**: Always use `number` (id) for entities.

### 4. Non-Null Assertion (!)
Use sparingly. Only use `!` when you are 100% sure the value exists (e.g., initialized in `init()` but accessed later).
- **Preferred**: Optional chaining (`?.`) or Nullish Coalescing (`??`).

### 5. Enums vs Const Objects
Prefer `const` objects or union types over TypeScript `enum` for better tree-shaking and simplicity.

```typescript
// Preferred
export const EnemyType = {
  KLINGON: 'klingon',
  ROMULAN: 'romulan',
} as const;
export type EnemyType = typeof EnemyType[keyof typeof EnemyType];
```

### 6. JSDoc / TSDoc
Annotate exported functions and classes.
```typescript
/**
 * Calculates the distance between two entities.
 * @param eid1 - The first entity ID.
 * @param eid2 - The second entity ID.
 * @returns The distance in pixels.
 */
```

## Linting
- Run `npm run lint` to check for style violations.
- We use `eslint` with `typescript-eslint`.
