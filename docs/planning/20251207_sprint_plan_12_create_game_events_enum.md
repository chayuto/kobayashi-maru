# Task: Create Game Events Enum

**Priority:** 🟢 Low  
**Estimated Effort:** Small (1 hour)  
**Dependencies:** None  
**File Focus:** `src/types/events.ts`

---

## Objective

Consolidate all game event string constants into a single typed enum to prevent typos and enable autocomplete.

---

## Current State

Events are defined in `src/types/events.ts` as `GameEventType` enum. Verify all event usages match.

---

## Implementation

1. Audit all `EventBus.emit()` and `EventBus.subscribe()` calls
2. Ensure all use `GameEventType` enum values
3. Remove any string literals for events

```bash
# Find direct string usage
grep -rn "EventBus.emit\|EventBus.subscribe" src/ --include="*.ts"
```

---

## Success Criteria

1. ✅ All events use `GameEventType` enum
2. ✅ No string literals for event names
3. ✅ TypeScript compiles: `npx tsc --noEmit`
