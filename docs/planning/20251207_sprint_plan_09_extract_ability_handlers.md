# Task: Extract Ability Handlers

**Priority:** 🟡 Medium  
**Estimated Effort:** Medium (2-3 hours)  
**Dependencies:** None  
**File Focus:** `src/systems/abilitySystem.ts`

---

## Background

The `abilitySystem.ts` file is 564 lines and contains all ability logic in one file. Each ability type should be extracted into its own handler file for better maintainability.

## Current State

Abilities in `abilitySystem.ts`:
- `processTeleportAbility()` - Lines 74-148
- `processCloakAbility()` - Lines 150-234
- `processShieldRegenAbility()` - Lines 236-274
- `processSplitAbility()` - Lines 276-332
- `processSummonAbility()` - Lines 334-383
- `processDrainAbility()` - Lines 385-390 (placeholder)
- `processEMPBurstAbility()` - Lines 392-397 (placeholder)
- `processRammingSpeedAbility()` - Lines 399-454

---

## Objective

Extract each ability into a separate handler file with a common interface.

---

## Target Structure

```
src/systems/abilities/
├── index.ts                    # Re-exports all handlers
├── types.ts                    # Common types/interfaces
├── teleportAbility.ts          # Teleport logic
├── cloakAbility.ts             # Cloak logic
├── shieldRegenAbility.ts       # Shield regen logic
├── splitAbility.ts             # Split into smaller enemies
├── summonAbility.ts            # Summon reinforcements
├── rammingSpeedAbility.ts      # Speed boost
├── drainAbility.ts             # Energy drain (placeholder)
└── empBurstAbility.ts          # EMP burst (placeholder)
```

---

## Implementation Steps

### Step 1: Create Abilities Directory

```bash
mkdir -p src/systems/abilities
```

### Step 2: Create Types File

```typescript
// src/systems/abilities/types.ts
import { IWorld } from 'bitecs';
import { ParticleSystem } from '../../rendering';
import { AudioManager } from '../../audio';
import { SpatialHash } from '../../collision';

export interface AbilityContext {
  world: IWorld;
  entity: number;
  deltaTime: number;
  particleSystem?: ParticleSystem;
  audioManager?: AudioManager;
  spatialHash?: SpatialHash;
}

export interface AbilityHandler {
  process(context: AbilityContext): void;
}
```

### Step 3: Extract Teleport Ability

```typescript
// src/systems/abilities/teleportAbility.ts
import { AbilityContext } from './types';
import { Position, SpecialAbility, Health } from '../../ecs/components';
import { AbilityType } from '../../types/constants';

export function processTeleportAbility(context: AbilityContext): void {
  const { entity, particleSystem, spatialHash } = context;
  
  // Move existing logic from abilitySystem.ts lines 74-148
}
```

### Step 4: Extract Remaining Abilities

Apply same pattern to:
- `cloakAbility.ts`
- `shieldRegenAbility.ts`
- `splitAbility.ts`
- `summonAbility.ts`
- `rammingSpeedAbility.ts`
- `drainAbility.ts` (keep as placeholder)
- `empBurstAbility.ts` (keep as placeholder)

### Step 5: Create Barrel Export

```typescript
// src/systems/abilities/index.ts
export * from './types';
export { processTeleportAbility } from './teleportAbility';
export { processCloakAbility } from './cloakAbility';
export { processShieldRegenAbility } from './shieldRegenAbility';
export { processSplitAbility } from './splitAbility';
export { processSummonAbility } from './summonAbility';
export { processRammingSpeedAbility } from './rammingSpeedAbility';
export { processDrainAbility } from './drainAbility';
export { processEMPBurstAbility } from './empBurstAbility';
```

### Step 6: Update abilitySystem.ts

```typescript
// src/systems/abilitySystem.ts
import {
  processTeleportAbility,
  processCloakAbility,
  processShieldRegenAbility,
  processSplitAbility,
  processSummonAbility,
  processRammingSpeedAbility,
} from './abilities';

// Remove local implementations, use imported functions
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/systems/abilities/types.ts` | Shared types |
| `src/systems/abilities/teleportAbility.ts` | Teleport logic |
| `src/systems/abilities/cloakAbility.ts` | Cloak logic |
| `src/systems/abilities/shieldRegenAbility.ts` | Shield regen |
| `src/systems/abilities/splitAbility.ts` | Split logic |
| `src/systems/abilities/summonAbility.ts` | Summon logic |
| `src/systems/abilities/rammingSpeedAbility.ts` | Speed boost |
| `src/systems/abilities/drainAbility.ts` | Placeholder |
| `src/systems/abilities/empBurstAbility.ts` | Placeholder |
| `src/systems/abilities/index.ts` | Barrel export |

## Files to Modify

| File | Changes |
|------|---------|
| `src/systems/abilitySystem.ts` | Import handlers, remove local code |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ `abilitySystem.ts` reduced to <150 lines
4. ✅ Each ability in separate file

---

## Verification Commands

```bash
# Run ability tests
npm test -- abilitySystem

# Type check
npx tsc --noEmit

# Count lines
wc -l src/systems/abilitySystem.ts
```

---

## Risk Assessment

- **Medium risk** - Refactoring core gameplay system
- **Mitigation:** Run ability tests after each extraction
