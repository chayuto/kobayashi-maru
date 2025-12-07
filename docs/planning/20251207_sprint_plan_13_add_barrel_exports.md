# Task: Add Missing Barrel Exports

**Priority:** 🟢 Low  
**Estimated Effort:** Small (30 mins)  
**Dependencies:** None  
**File Focus:** All `index.ts` files

---

## Objective

Ensure all directories have proper `index.ts` barrel exports for clean imports.

---

## Directories to Check

| Directory | Has index.ts? |
|-----------|---------------|
| `src/audio/` | ✅ Yes |
| `src/collision/` | ❓ Check |
| `src/config/` | ✅ Yes |
| `src/core/` | ✅ Yes |
| `src/ecs/` | ✅ Yes |
| `src/game/` | ✅ Yes |
| `src/pathfinding/` | ❓ Check |
| `src/rendering/` | ✅ Yes |
| `src/services/` | ✅ Yes |
| `src/systems/` | ✅ Yes |
| `src/types/` | ❓ Check |
| `src/ui/` | ✅ Yes |
| `src/utils/` | ❓ Check |

---

## Implementation

For missing directories, create `index.ts`:

```typescript
// src/collision/index.ts
export { SpatialHash } from './SpatialHash';
```

---

## Success Criteria

1. ✅ All directories have `index.ts`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
