# AI Auto-Play System Overhaul - Executive Summary

**Date:** December 12, 2025  
**Status:** Planning  
**Priority:** Critical Fix  
**Reference:** [AI Autoplay Strategies Research](../research/AI%20Autoplay%20Strategies%20for%20Game%20Design.md)

---

## Problem Statement

The current AI auto-play system places turrets in positions that **fail to intercept most enemies**. Analysis reveals several fundamental issues:

### Root Causes Identified

1. **Sector-Based Placement is Too Coarse**
   - Current: 8x6 grid (48 sectors) covering 1920x1080 = ~240x180 pixels per sector
   - Turret range: 200-350 pixels
   - Problem: Placing at sector center ignores actual enemy approach paths

2. **No Flow Field Integration**
   - The game has a complete flow field pathfinding system (`src/pathfinding/`) that is **NOT USED** by the AI
   - Enemies move toward center (Kobayashi Maru) but AI doesn't predict their paths

3. **Threat Interception is Weak**
   - `THREAT_INTERCEPT_WEIGHT: 0.6` and `APPROACH_PATH_TOLERANCE: 120` are insufficient
   - `scorePosition()` only considers distance-to-line, not actual enemy flow

4. **Coverage Analysis Ignores Enemy Movement Patterns**
   - AI behavior types (DIRECT, STRAFE, ORBIT, SWARM, HUNTER) are not factored into placement
   - Romulans strafe, Tholians orbit - static coverage doesn't account for this

5. **No Influence Map for Threat Density**
   - Research recommends Influence Maps for AoE targeting and threat assessment
   - Current system only counts enemies, doesn't weight by position/trajectory

---

## Proposed Solution: Strategy B - "The Tactical Tactician"

Based on the research document, we recommend implementing **Strategy B** which provides:

| Component | Current State | Proposed State |
|-----------|---------------|----------------|
| Architecture | Basic Utility AI | Goal-Oriented Behavior Tree (GOBT) |
| Movement Analysis | None | Flow Fields + Influence Maps |
| Placement Logic | Sector center | Path interception points |
| Threat Assessment | Distance-based | Velocity + Behavior-aware |
| Turret Selection | Faction effectiveness | + Synergy detection |

---

## Implementation Stages

### Stage 1: Flow Field Integration (Critical)
- Integrate existing `src/pathfinding/` with AI placement
- Generate flow field from screen edges to Kobayashi Maru
- Place turrets along high-traffic flow vectors

### Stage 2: Influence Map System (High Priority)
- Create threat density influence map
- Implement turret coverage influence map
- Use for optimal placement scoring

### Stage 3: Path Interception Algorithm (High Priority)
- Calculate enemy approach corridors
- Identify choke points and high-traffic lanes
- Score positions by interception potential

### Stage 4: Behavior-Aware Threat Analysis (Medium Priority)
- Factor in AI behavior types (STRAFE, ORBIT, etc.)
- Predict actual enemy positions, not just linear paths
- Adjust turret type selection based on behavior counters

### Stage 5: Utility AI Enhancement (Medium Priority)
- Implement proper scoring curves (exponential for urgency)
- Add bucketing system (Survival > Combat > Economy)
- Implement inertia to prevent action thrashing

### Stage 6: Dynamic Difficulty & Polish (Low Priority)
- Add artificial stupidity parameters
- Implement reaction delay for human-like behavior
- Visual feedback for AI decisions

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Turret hit rate | ~30% (estimated) | >70% |
| Average survival waves | TBD | +50% improvement |
| Placement efficiency | Poor | Optimal path coverage |
| Decision quality | Random-feeling | Strategic and visible |

---

## File Structure (New/Modified)

```
src/ai/
├── index.ts                    # Update exports
├── AIAutoPlayManager.ts        # Minor updates
├── ThreatAnalyzer.ts           # Major refactor
├── CoverageAnalyzer.ts         # Major refactor
├── ActionPlanner.ts            # Major refactor
├── ActionExecutor.ts           # No changes
├── types.ts                    # Add new types
├── spatial/                    # NEW: Spatial intelligence
│   ├── InfluenceMap.ts         # Threat/coverage influence
│   ├── FlowFieldAnalyzer.ts    # Flow field integration
│   └── PathInterceptor.ts      # Choke point detection
├── utility/                    # NEW: Utility AI improvements
│   ├── ScoringCurves.ts        # Mathematical scoring
│   ├── ActionBucketing.ts      # Priority bucketing
│   └── DecisionInertia.ts      # Action stability
└── behaviors/                  # NEW: Behavior-specific logic
    ├── BehaviorCounters.ts     # Counter-strategy selection
    └── SynergyDetector.ts      # Turret synergy analysis
```

---

## Estimated Effort

| Stage | Tasks | Hours | Priority |
|-------|-------|-------|----------|
| Stage 1 | 4 | 6-8 | Critical |
| Stage 2 | 3 | 4-6 | High |
| Stage 3 | 3 | 4-6 | High |
| Stage 4 | 3 | 3-4 | Medium |
| Stage 5 | 4 | 4-6 | Medium |
| Stage 6 | 3 | 2-4 | Low |
| **Total** | **20** | **23-34** | - |

---

## Quick Wins (Immediate Impact)

Before full implementation, these config changes can help:

```typescript
// src/config/autoplay.config.ts
OPTIMAL_KM_DISTANCE: 150,           // Was 200 - closer defensive ring
THREAT_INTERCEPT_WEIGHT: 0.9,       // Was 0.6 - prioritize interception
APPROACH_PATH_TOLERANCE: 80,        // Was 120 - tighter path matching
DEFENSIVE_DISTANCE_WEIGHT: 0.2,     // Was 0.4 - less distance bias
```

---

## Related Documents

- [Stage 1: Flow Field Integration](./20251212_ai_autoplay_overhaul_01_flow_field.md)
- [Stage 2: Influence Map System](./20251212_ai_autoplay_overhaul_02_influence_map.md)
- [Stage 3: Path Interception](./20251212_ai_autoplay_overhaul_03_path_interception.md)
- [Stage 4: Behavior-Aware Analysis](./20251212_ai_autoplay_overhaul_04_behavior_aware.md)
- [Stage 5: Utility AI Enhancement](./20251212_ai_autoplay_overhaul_05_utility_ai.md)
- [Stage 6: Polish & Humanization](./20251212_ai_autoplay_overhaul_06_polish.md)

---

*Document Version: 1.0*
