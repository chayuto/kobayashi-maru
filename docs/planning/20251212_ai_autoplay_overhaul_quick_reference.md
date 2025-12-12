# AI Auto-Play Overhaul - Quick Reference

**Date:** December 12, 2025  
**Status:** Planning Complete  
**Total Estimated Hours:** 23-34

---

## Problem Summary

Current AI places turrets that **miss most enemies** because:
1. Sector-based placement ignores actual enemy paths
2. Existing flow field system is not used
3. No behavior-specific threat prediction
4. Weak path interception logic

---

## Solution: Strategy B - "The Tactical Tactician"

Based on research document recommendations, implementing:
- Flow Field integration for path awareness
- Influence Maps for spatial reasoning
- Path Interception for optimal placement
- Behavior-aware threat analysis
- Proper Utility AI patterns
- Humanization for natural feel

---

## Stage Overview

| Stage | Priority | Hours | Key Deliverable |
|-------|----------|-------|-----------------|
| [Stage 1](./20251212_ai_autoplay_overhaul_01_flow_field.md) | Critical | 6-8 | Flow field integration |
| [Stage 2](./20251212_ai_autoplay_overhaul_02_influence_map.md) | High | 4-6 | Influence map system |
| [Stage 3](./20251212_ai_autoplay_overhaul_03_path_interception.md) | High | 4-6 | Path interception algorithm |
| [Stage 4](./20251212_ai_autoplay_overhaul_04_behavior_aware.md) | Medium | 3-4 | Behavior-aware analysis |
| [Stage 5](./20251212_ai_autoplay_overhaul_05_utility_ai.md) | Medium | 4-6 | Utility AI enhancement |
| [Stage 6](./20251212_ai_autoplay_overhaul_06_polish.md) | Low | 2-4 | Humanization & polish |

---

## Expected Impact

| Metric | Current | After All Stages |
|--------|---------|------------------|
| Turret hit rate | ~30% | >80% |
| Path coverage | None | Full corridors |
| Threat response | Basic | Behavior-specific |
| Decision quality | Random-feeling | Strategic |
| AI feel | Robotic | Human-like |

---

## New File Structure

```
src/ai/
├── index.ts                        # Barrel exports
├── AIAutoPlayManager.ts            # Main controller (modify)
├── ThreatAnalyzer.ts               # Threat analysis (modify)
├── CoverageAnalyzer.ts             # Coverage analysis (modify)
├── ActionPlanner.ts                # Decision making (modify)
├── ActionExecutor.ts               # Action execution (no change)
├── types.ts                        # Type definitions (modify)
│
├── spatial/                        # NEW: Spatial intelligence
│   ├── index.ts
│   ├── InfluenceMap.ts             # Base influence map class
│   ├── ThreatInfluenceMap.ts       # Enemy threat density
│   ├── CoverageInfluenceMap.ts     # Turret coverage density
│   ├── FlowFieldAnalyzer.ts        # Flow field integration
│   ├── PathInterceptor.ts          # Path interception logic
│   └── ApproachCorridorAnalyzer.ts # Corridor identification
│
├── utility/                        # NEW: Utility AI
│   ├── index.ts
│   ├── ScoringCurves.ts            # Mathematical scoring
│   ├── ActionBucketing.ts          # Priority bucketing
│   └── DecisionInertia.ts          # Action stability
│
├── behaviors/                      # NEW: Behavior logic
│   ├── index.ts
│   ├── BehaviorPredictor.ts        # Movement prediction
│   └── BehaviorCounterSelector.ts  # Counter-turret selection
│
├── humanization/                   # NEW: Human-like behavior
│   ├── index.ts
│   ├── HumanizationConfig.ts       # Settings presets
│   ├── AIHumanizer.ts              # Artificial stupidity
│   └── DynamicDifficultyAdjuster.ts # Adaptive difficulty
│
└── visualization/                  # NEW: Visual feedback
    ├── index.ts
    └── AIVisualFeedback.ts         # UI indicators
```

---

## Quick Wins (Immediate Config Changes)

Before implementing stages, these config changes can help:

```typescript
// src/config/autoplay.config.ts

// Change these values:
OPTIMAL_KM_DISTANCE: 150,           // Was 200 - tighter defensive ring
THREAT_INTERCEPT_WEIGHT: 0.9,       // Was 0.6 - prioritize interception
APPROACH_PATH_TOLERANCE: 80,        // Was 120 - tighter path matching
DEFENSIVE_DISTANCE_WEIGHT: 0.2,     // Was 0.4 - less distance bias
SECTOR_GRID_COLS: 12,               // Was 8 - finer grid
SECTOR_GRID_ROWS: 8,                // Was 6 - finer grid
```

---

## Implementation Order (Recommended)

### Phase A: Core Fix (Stages 1-3)
**Goal:** Fix the fundamental placement problem

1. **Stage 1: Flow Field** - Integrate existing pathfinding
2. **Stage 2: Influence Maps** - Add spatial reasoning
3. **Stage 3: Path Interception** - Maximize hit rate

### Phase B: Intelligence (Stages 4-5)
**Goal:** Make smarter decisions

4. **Stage 4: Behavior Awareness** - Counter enemy types
5. **Stage 5: Utility AI** - Better decision framework

### Phase C: Polish (Stage 6)
**Goal:** Make it feel natural

6. **Stage 6: Humanization** - Add artificial stupidity

---

## Key Algorithms

### Flow Field Traffic Density
```
1. Generate flow field from edges to center
2. Trace paths from all edge cells
3. Increment traffic counter along each path
4. Normalize to 0-1 density map
5. High-traffic cells = optimal turret positions
```

### Path Interception Score
```
Score = Traffic × 30 + Perpendicularity × 15 + 
        PathsCovered × 10 + ThreatIntercept × 0.5 + 
        DwellTime × 5
```

### Behavior Counter Matrix
```
           Phaser  Torpedo  Disruptor  Tetryon  Plasma  Polaron
DIRECT      1.0     1.2      1.0        1.0      1.1     0.9
STRAFE      1.3     0.6      1.1        1.0      0.8     1.4
ORBIT       0.8     1.5      1.0        1.1      1.2     1.0
SWARM       1.5     0.7      1.2        1.0      1.3     0.9
HUNTER      1.1     1.3      1.2        1.0      1.0     1.2
```

### Utility Scoring Curves
```
Health Urgency:  exponential (low health = extreme urgency)
Distance Value:  quadratic falloff
Threat Response: logistic (smooth transition)
Coverage Gap:    exponential (large gaps urgent)
```

---

## Testing Checklist

### Stage 1 Tests
- [ ] Flow field generates toward center
- [ ] Traffic density identifies convergence
- [ ] High-traffic cells near center

### Stage 2 Tests
- [ ] Influence propagates correctly
- [ ] Peak finding works
- [ ] Threat/coverage maps update

### Stage 3 Tests
- [ ] Interception points on enemy paths
- [ ] Dwell time calculated correctly
- [ ] Choke points identified

### Stage 4 Tests
- [ ] STRAFE prediction weaves
- [ ] ORBIT prediction circles
- [ ] Counter selection matches behavior

### Stage 5 Tests
- [ ] Scoring curves output 0-1
- [ ] Bucketing prioritizes correctly
- [ ] Inertia prevents thrashing

### Stage 6 Tests
- [ ] Reaction delay works
- [ ] Placement error applied
- [ ] Difficulty adjusts

---

## Dependencies

### Existing Code Used
- `src/pathfinding/` - Flow field system (no changes needed)
- `src/ai/` - Current AI system (modifications)
- `src/config/autoplay.config.ts` - Configuration

### New Dependencies
- None (uses existing PixiJS for visualization)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance regression | Profile each stage, optimize hot paths |
| Breaking existing AI | Keep old code paths, feature flag new logic |
| Over-engineering | Implement stages incrementally, test each |
| Scope creep | Strict stage boundaries, defer enhancements |

---

## Success Criteria

1. **Turret hit rate > 70%** (measured over 10 waves)
2. **No performance regression** (< 5ms per AI decision)
3. **All existing tests pass**
4. **New code has test coverage**
5. **AI survives longer than before** (A/B comparison)

---

## Related Documents

- [Executive Summary](./20251212_ai_autoplay_overhaul_00_executive_summary.md)
- [Research: AI Autoplay Strategies](../research/AI%20Autoplay%20Strategies%20for%20Game%20Design.md)
- [Original AI Design](./20251211_ai_autoplay_system.md)
- [Original Implementation Tasks](./20251211_ai_autoplay_implementation_tasks.md)

---

*Quick Reference v1.0*
