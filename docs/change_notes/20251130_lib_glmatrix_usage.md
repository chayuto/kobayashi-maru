# Library Usage: gl-matrix (v3.4.4)

## Overview
gl-matrix is a high-performance library for matrix and vector operations. It is optimized for speed by using `Float32Array` and avoiding garbage collection.

## Current Implementation
*Status: Installed, but under-utilized.*

Currently, most vector math (position updates, distance checks) is done via scalar operations in `movementSystem.ts` and `collisionSystem.ts`:
```typescript
// Current Scalar Approach
Position.x[eid] += Velocity.x[eid] * delta;
```

## Recommended Usage Pattern
As the game complexity grows (e.g., steering behaviors, physics, complex targeting), we should adopt `gl-matrix` to standardize math operations.

### 1. Vector Operations
Use `vec2` for 2D position/velocity manipulation:
```typescript
import { vec2 } from 'gl-matrix';

// Pre-allocate temporaries to avoid GC
const tempPos = vec2.create();
const tempVel = vec2.create();

// In System
vec2.set(tempPos, Position.x[eid], Position.y[eid]);
vec2.set(tempVel, Velocity.x[eid], Velocity.y[eid]);
vec2.scaleAndAdd(tempPos, tempPos, tempVel, delta);
```

### 2. AI & Steering
For `AISystem`, `gl-matrix` is essential for:
- **Normalization**: `vec2.normalize(out, in)`
- **Distance**: `vec2.dist(a, b)` or `vec2.sqrDist(a, b)` (faster)
- **Dot Products**: `vec2.dot(a, b)` for field of view checks.

## Best Practices for Extension
- **Pre-allocation**: Always create vectors/matrices outside the game loop.
- **Output Parameters**: Most `gl-matrix` functions take an `out` parameter as the first argument. Use this to write results directly into existing arrays or components (if mapped correctly).
- **Type Safety**: Use `Float32Array` in components to interface directly with `gl-matrix`.

## Optimization Opportunities
- **Direct Memory Access**: If bitECS arrays are backed by `Float32Array`, you can potentially create `gl-matrix` views directly onto the component memory (e.g., `new Float32Array(buffer, offset, 2)`), allowing `gl-matrix` to operate directly on ECS data without copying.
