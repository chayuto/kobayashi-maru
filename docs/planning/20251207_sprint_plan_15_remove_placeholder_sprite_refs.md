# Task: Remove Placeholder Sprite References

**Priority:** 🟢 Low  
**Estimated Effort:** Small (30 mins)  
**Dependencies:** None  
**File Focus:** `src/ecs/entityFactory.ts`

---

## Objective

Clean up `PLACEHOLDER_SPRITE_INDEX` usage and ensure proper sprite type mapping.

---

## Current State

```typescript
// entityFactory.ts line 24
const PLACEHOLDER_SPRITE_INDEX = 0;
```

This is used when creating entities but should use proper `SpriteType` values.

---

## Implementation

1. Replace `PLACEHOLDER_SPRITE_INDEX` with `SpriteType` values
2. Remove the constant if no longer needed
3. Verify sprite rendering still works

---

## Success Criteria

1. ✅ No `PLACEHOLDER_SPRITE_INDEX` usage
2. ✅ All entities use `SpriteType` enum
3. ✅ Game renders correctly: `npm run dev`
