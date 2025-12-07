# Task: Modularize AI Behaviors

**Priority:** 🟡 Medium  
**Estimated Effort:** Medium (2-3 hours)  
**Dependencies:** None  
**File Focus:** `src/systems/aiSystem.ts`

---

## Background

The `aiSystem.ts` file contains all AI behavior patterns in one file (350 lines). Each behavior type should be extracted into its own strategy file for better extensibility.

## Current State

Behaviors in `aiSystem.ts`:
- `updateDirectBehavior()` - Lines 141-155 (Klingon)
- `updateStrafeBehavior()` - Lines 157-204 (Romulan)
- `updateFlankBehavior()` - Lines 206-241
- `updateSwarmBehavior()` - Lines 243-276 (Borg)
- `updateOrbitBehavior()` - Lines 302-349 (Tholian)
- `findNearestTurret()` - Lines 278-300 (used by Hunter)

---

## Objective

Extract each AI behavior into a separate strategy file using a common interface.

---

## Target Structure

```
src/systems/ai/
├── index.ts                 # Re-exports all strategies
├── types.ts                 # Common types/interfaces
├── directBehavior.ts        # Straight-line pursuit
├── strafeBehavior.ts        # Sinusoidal weaving
├── flankBehavior.ts         # Flanking movement
├── swarmBehavior.ts         # Coordinated group movement
├── orbitBehavior.ts         # Orbit and shoot
├── hunterBehavior.ts        # Turret hunting
└── helpers.ts               # Shared functions
```

---

## Implementation Steps

### Step 1: Create AI Directory

```bash
mkdir -p src/systems/ai
```

### Step 2: Create Types File

```typescript
// src/systems/ai/types.ts
export interface BehaviorContext {
  eid: number;
  posX: number;
  posY: number;
  targetX: number;
  targetY: number;
  gameTime: number;
  speed: number;
}

export interface AIBehavior {
  update(context: BehaviorContext): { vx: number; vy: number };
}
```

### Step 3: Extract Direct Behavior

```typescript
// src/systems/ai/directBehavior.ts
import { Velocity } from '../../ecs/components';
import { BehaviorContext } from './types';

export function updateDirectBehavior(context: BehaviorContext): void {
  const { eid, posX, posY, targetX, targetY, speed } = context;
  
  const dx = targetX - posX;
  const dy = targetY - posY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 0) {
    Velocity.x[eid] = (dx / dist) * speed;
    Velocity.y[eid] = (dy / dist) * speed;
  }
}
```

### Step 4: Extract Strafe Behavior

```typescript
// src/systems/ai/strafeBehavior.ts
import { Velocity } from '../../ecs/components';
import { BehaviorContext } from './types';

const STRAFE_AMPLITUDE = 0.6;
const STRAFE_FREQUENCY = 2;

export function updateStrafeBehavior(context: BehaviorContext): void {
  const { eid, posX, posY, targetX, targetY, gameTime, speed } = context;
  
  // Move existing logic from aiSystem.ts lines 157-204
}
```

### Step 5: Extract Remaining Behaviors

Apply same pattern to:
- `flankBehavior.ts`
- `swarmBehavior.ts`
- `orbitBehavior.ts`
- `hunterBehavior.ts`

### Step 6: Create Helpers File

```typescript
// src/systems/ai/helpers.ts
import { Position, Turret } from '../../ecs/components';
import { defineQuery } from 'bitecs';

const turretQuery = defineQuery([Position, Turret]);

export function findNearestTurret(x: number, y: number, turrets: number[]): number | null {
  // Move from aiSystem.ts lines 278-300
}
```

### Step 7: Create Barrel Export

```typescript
// src/systems/ai/index.ts
export * from './types';
export { updateDirectBehavior } from './directBehavior';
export { updateStrafeBehavior } from './strafeBehavior';
export { updateFlankBehavior } from './flankBehavior';
export { updateSwarmBehavior } from './swarmBehavior';
export { updateOrbitBehavior } from './orbitBehavior';
export { findNearestTurret } from './helpers';
```

### Step 8: Update aiSystem.ts

```typescript
// src/systems/aiSystem.ts
import {
  updateDirectBehavior,
  updateStrafeBehavior,
  updateFlankBehavior,
  updateSwarmBehavior,
  updateOrbitBehavior,
} from './ai';

// Main system just routes to appropriate behavior
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/systems/ai/types.ts` | Shared types |
| `src/systems/ai/directBehavior.ts` | Direct pursuit |
| `src/systems/ai/strafeBehavior.ts` | Weaving movement |
| `src/systems/ai/flankBehavior.ts` | Flanking |
| `src/systems/ai/swarmBehavior.ts` | Group movement |
| `src/systems/ai/orbitBehavior.ts` | Orbital |
| `src/systems/ai/helpers.ts` | Utility functions |
| `src/systems/ai/index.ts` | Barrel export |

## Files to Modify

| File | Changes |
|------|---------|
| `src/systems/aiSystem.ts` | Import strategies, remove local code |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ `aiSystem.ts` reduced to <100 lines
4. ✅ Each behavior in separate file

---

## Verification Commands

```bash
# Run AI tests
npm test -- aiSystem

# Type check
npx tsc --noEmit

# Count lines
wc -l src/systems/aiSystem.ts
```

---

## Risk Assessment

- **Medium risk** - Core enemy behavior
- **Mitigation:** Test each behavior extraction individually
