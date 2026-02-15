# AI Spatial Maps Tests

**Date:** 2026-02-15
**Type:** Test Coverage
**Files Created:** `src/__tests__/aiSpatialMaps.test.ts`

## Summary

Added 24 tests covering the AI spatial influence map classes used for strategic decision-making:

- `CoverageInfluenceMap` (12 tests) - turret coverage mapping
- `ThreatInfluenceMap` (12 tests) - enemy threat assessment

## Source Files Tested

- `src/ai/spatial/CoverageInfluenceMap.ts`
- `src/ai/spatial/ThreatInfluenceMap.ts`

## Test Coverage Details

### CoverageInfluenceMap Tests

| Test | Code Path |
|------|-----------|
| Zero coverage on initialization | Constructor / no update |
| High coverage near federation turret | update() + getCoverageAt() |
| Lower coverage far from turrets | Distance-based decay |
| Only federation turrets counted | Faction filter (FactionId.FEDERATION check) |
| DPS as influence strength | damage * fireRate calculation |
| Clear on each update | update() calls map.clear() |
| Find coverage gaps below threshold | findCoverageGaps() with sorting |
| No gaps at zero threshold with empty map | findCoverageGaps(0) edge case |
| Detect overlap above threshold | wouldOverlap() > 30 threshold |
| No overlap far from turrets | wouldOverlap() returns false |
| Expose underlying map | getMap() accessor |

### ThreatInfluenceMap Tests

| Test | Code Path |
|------|-----------|
| Zero threat on initialization | Constructor / no update |
| Threat near enemy positions | update() + getThreatAt() |
| Lower threat far from enemies | Distance-based decay |
| Skip federation entities | Faction filter |
| Skip dead enemies | Health <= 0 check |
| Predicted position with high speed | Velocity projection (speed > 10) |
| No prediction with low speed | Speed <= 10 threshold |
| Higher threat for Borg faction | Faction modifier (1.5x vs 1.0x) |
| Elite rank multiplier | EnemyRank.ELITE 2.0x multiplier |
| Find threat peaks | findThreatPeaks() for AoE targeting |
| Find safest position | findSafestPosition() minimum search |
| Clear previous data on update | update() clears + dead enemy removal |
| Expose underlying map | getMap() accessor |

## Validation

- All 24 tests pass
- Full test suite (1207 tests) passes with zero regressions
- No new lint errors introduced
