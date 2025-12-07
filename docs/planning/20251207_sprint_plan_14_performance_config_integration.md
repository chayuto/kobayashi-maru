# Task: Integrate PERFORMANCE_CONFIG

**Priority:** 🟢 Low  
**Estimated Effort:** Small (1 hour)  
**Dependencies:** None  
**File Focus:** `src/config/performance.config.ts`

---

## Objective

Ensure `PERFORMANCE_CONFIG` is used consistently across all performance-related code.

---

## Areas to Check

1. `PerformanceMonitor.ts` - Uses config ✅
2. `QualityManager.ts` - Check for hardcoded values
3. `ParticleSystem.ts` - Max particles limit
4. `DebugManager.ts` - FPS thresholds

---

## Implementation

Replace hardcoded values with config references:

```typescript
import { PERFORMANCE_CONFIG } from '../config';

// Use PERFORMANCE_CONFIG.FPS_THRESHOLD instead of 30
```

---

## Success Criteria

1. ✅ All performance thresholds from config
2. ✅ No hardcoded FPS/memory limits
3. ✅ TypeScript compiles: `npx tsc --noEmit`
