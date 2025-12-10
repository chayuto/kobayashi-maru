# bitecs 0.3.x → 0.4.0 Migration Plan

> [!CAUTION]
> **Legacy module is incomplete!** It only wraps component/query APIs, not core ECS functions.

## Migration Options

| Option | Effort | Description |
|--------|--------|-------------|
| ~~1. Use Legacy Module~~ | ❌ | Only partial - missing `createWorld`, `addEntity`, etc. |
| **2. Full Migration** | ~5+ hours | Rewrite to new 0.4.0 API patterns |
| **3. Stay on 0.3.x** ✅ | 0 | Continue using pinned `~0.3.40` (recommended) |

---

## Legacy Module Limitations

The `bitecs/legacy` module only exports:
```
defineComponent, defineQuery, Types, enterQuery, exitQuery,
addComponent, removeComponent, hasComponent, Changed, Not, Or
```

**Missing from legacy** (must use new 0.4.0 API):
```
createWorld, addEntity, removeEntity, IWorld, entityExists, 
getAllEntities, deleteWorld, resetWorld
```

This means you **cannot simply change imports** - you need to migrate the entire codebase.

---

## Option 2: Full Migration to 0.4.0 API

### Component Definitions

**Before (0.3.x):**
```typescript
import { Types, defineComponent } from 'bitecs'

const Position = defineComponent({ 
  x: Types.f32, 
  y: Types.f32 
})
const Tag = defineComponent()
```

**After (0.4.0):**
```typescript
// SoA with TypedArrays (best for performance)
const Position = {
  x: new Float32Array(10000),
  y: new Float32Array(10000)
}

// Tags are empty objects
const Tag = {}
```

### Adding Components

**Before:** `addComponent(world, Position, eid)`
**After:** `addComponent(world, eid, Position)` ← Parameter order changed!

### Queries

**Before (0.3.x):**
```typescript
const movementQuery = defineQuery([Position, Velocity])
const entities = movementQuery(world)
```

**After (0.4.0):**
```typescript
import { query } from 'bitecs'
const entities = query(world, [Position, Velocity])
```

### Enter/Exit Queries → Observers

**Before:**
```typescript
const enteredQuery = enterQuery(movementQuery)
const entities = enteredQuery(world)
```

**After:**
```typescript
import { observe, onAdd, onRemove } from 'bitecs'

world.enteredMovers = []
observe(world, onAdd(Position, Velocity), (eid) => world.enteredMovers.push(eid))

// In system:
const entered = world.enteredMovers.splice(0)
```

### Entity References → Relations

**Before:** `Reference.entity[eid] = targetEid`
**After:**
```typescript
import { createRelation, getRelationTargets } from 'bitecs'
const References = createRelation()
addComponent(world, eid, References(targetEid))
```

---

## Files Requiring Changes

### High Impact (23 component definitions)
- `src/ecs/components.ts` - All component definitions

### Medium Impact (24 files using queries)  
- `src/systems/*.ts` - 16 system files
- `src/rendering/*.ts` - 5 renderer files
- `src/game/*.ts` - 2 files
- `src/core/*.ts` - 1 file

### Low Impact (entity operations)
- `src/ecs/entityFactory.ts`
- `src/ecs/genericFactory.ts`
- `src/ecs/entityPool.ts`
- `src/ecs/PoolManager.ts`

---

## Verification

```bash
npm test                  # All 646 tests should pass
npm run build             # TypeScript compilation
npm run dev               # Visual verification
```

---

## Recommendation

1. **Start with legacy module** - Get on 0.4.0 quickly with minimal risk
2. **Migrate incrementally** - Convert systems one-by-one when time permits
3. **Mix APIs** - Legacy and new APIs can coexist

The legacy module lets you use new 0.4.0 features (like relations) alongside existing code.

