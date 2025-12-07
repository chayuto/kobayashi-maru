# Refactor Task: Query Optimization

**Date:** December 7, 2025  
**Priority:** 🟠 High  
**Complexity:** Low  
**Estimated Effort:** 1-2 hours  

---

## Problem Statement

While bitECS queries are defined at module level (correct), some systems create unnecessary arrays or objects each frame.

### Issue 1: Array Spread in Loops
```typescript
// damageSystem.ts
getDestroyedThisFrame: () => [...destroyedThisFrame]  // Creates new array
```

### Issue 2: Object Creation in Hot Paths
```typescript
// combatSystem.ts - in update loop
activeBeams.push({
  startX, startY, endX, endY,  // New object every beam
  turretType, intensity: 1.0,
  segments, age: 0
});
```

### Issue 3: Repeated Query Results Not Cached
```typescript
// Some systems query same data multiple times per frame
const turrets = turretQuery(world);  // First query
// ... later in same function ...
const turrets2 = turretQuery(world); // Redundant query
```


---

## Impact

- **GC Pressure:** Small allocations add up over thousands of frames
- **Memory Churn:** Objects created and immediately discarded
- **Cache Misses:** Repeated queries don't benefit from caching

---

## Proposed Solution

1. Pre-allocate reusable arrays and objects
2. Use object pools for frequently created structures
3. Cache query results within frame when used multiple times

---

## Implementation

### Step 1: Pre-allocate Beam Visual Objects

```typescript
// src/systems/combatSystem.ts

// Pre-allocate beam visual pool
const BEAM_POOL_SIZE = 50;
const beamPool: BeamVisual[] = [];
for (let i = 0; i < BEAM_POOL_SIZE; i++) {
  beamPool.push({
    startX: 0, startY: 0, endX: 0, endY: 0,
    turretType: 0, intensity: 1.0,
    segments: [], age: 0
  });
}
let activeBeamCount = 0;

export function createCombatSystem(particleSystem?: ParticleSystem) {
  function combatSystem(world: IWorld, _deltaTime: number, currentTime: number): IWorld {
    // Reset active beam count at start of frame
    activeBeamCount = 0;

    // ... combat logic ...

    // Instead of push, reuse from pool
    if (activeBeamCount < BEAM_POOL_SIZE) {
      const beam = beamPool[activeBeamCount];
      beam.startX = turretX;
      beam.startY = turretY;
      beam.endX = targetX;
      beam.endY = targetY;
      beam.turretType = turretType;
      beam.intensity = 1.0;
      beam.segments = generateBeamSegments(turretX, turretY, targetX, targetY, turretType);
      beam.age = 0;
      activeBeamCount++;
    }

    return world;
  }

  return {
    update: combatSystem,
    getActiveBeams: () => beamPool.slice(0, activeBeamCount),
    // ...
  };
}
```

### Step 2: Avoid Array Spread for Read-Only Access

```typescript
// src/systems/damageSystem.ts

// BEFORE: Creates new array every call
getDestroyedThisFrame: () => [...destroyedThisFrame]

// AFTER: Return read-only view (caller should not modify)
getDestroyedThisFrame: (): readonly number[] => destroyedThisFrame
```

### Step 3: Cache Query Results Within Frame

```typescript
// src/systems/targetingSystem.ts

export function createTargetingSystem(spatialHash: SpatialHash) {
  // Cache for spatial hash query results
  let cachedCandidates: number[] = [];
  let lastQueryX = -1;
  let lastQueryY = -1;
  let lastQueryRadius = -1;

  return function targetingSystem(world: IWorld): IWorld {
    const turrets = turretQuery(world);

    for (const turretEid of turrets) {
      const turretX = Position.x[turretEid];
      const turretY = Position.y[turretEid];
      const range = Turret.range[turretEid];

      // Only re-query if position/range changed significantly
      const needsNewQuery = 
        Math.abs(turretX - lastQueryX) > 10 ||
        Math.abs(turretY - lastQueryY) > 10 ||
        range !== lastQueryRadius;

      if (needsNewQuery) {
        cachedCandidates = spatialHash.query(turretX, turretY, range);
        lastQueryX = turretX;
        lastQueryY = turretY;
        lastQueryRadius = range;
      }

      // Use cachedCandidates...
    }

    return world;
  };
}
```

### Step 4: Pre-allocate Segment Arrays

```typescript
// src/systems/combatSystem.ts

// Pre-allocate segment arrays
const SEGMENT_POOL_SIZE = 50;
const segmentPools: BeamSegment[][] = [];
for (let i = 0; i < SEGMENT_POOL_SIZE; i++) {
  segmentPools.push(new Array(5).fill(null).map(() => ({
    startX: 0, startY: 0, endX: 0, endY: 0, offset: 0
  })));
}
let segmentPoolIndex = 0;

function generateBeamSegments(...): BeamSegment[] {
  // Reuse from pool instead of creating new array
  const segments = segmentPools[segmentPoolIndex % SEGMENT_POOL_SIZE];
  segmentPoolIndex++;

  // Fill existing objects instead of creating new ones
  for (let i = 0; i < BEAM_SEGMENT_COUNT; i++) {
    segments[i].startX = /* ... */;
    segments[i].startY = /* ... */;
    // ...
  }

  return segments;
}
```

---

## Validation Criteria

1. **No new arrays in hot paths** - verify with profiler
2. **Object reuse working** - pool indices cycling
3. **Functionality unchanged** - all tests pass
4. **Memory stable** - no growth during gameplay

---

## Testing Strategy

1. Profile with Chrome DevTools Memory tab
2. Look for "Allocation Timeline" spikes
3. Compare before/after GC frequency
4. Verify beam rendering still works correctly

---

## Files to Modify

- `src/systems/combatSystem.ts` - Beam object pooling
- `src/systems/damageSystem.ts` - Avoid array spread
- `src/systems/targetingSystem.ts` - Query caching
- `src/systems/projectileSystem.ts` - Review for similar issues
