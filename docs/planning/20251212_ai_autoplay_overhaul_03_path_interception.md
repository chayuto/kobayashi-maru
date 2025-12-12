# Stage 3: Path Interception Algorithm

**Date:** December 12, 2025  
**Stage:** 3 of 6  
**Priority:** High  
**Estimated Hours:** 4-6  
**Dependencies:** Stage 1 (Flow Field), Stage 2 (Influence Maps)

---

## Overview

This stage implements intelligent path interception - placing turrets at positions that maximize the time enemies spend within turret range. Instead of placing turrets "near enemies," we place them "across enemy paths."

---

## Core Concept

### The Problem with Current Placement

Current AI places turrets based on:
- Sector with lowest coverage
- Distance from Kobayashi Maru
- Proximity to current enemy positions

This fails because:
1. Enemies move - by the time turret is placed, enemies have passed
2. Sector centers may not be on enemy paths
3. No consideration of turret range vs enemy trajectory

### The Solution: Path Interception

```
Enemy Path:  ─────────────────────────────────────▶ KM
                        │
                        │ Turret placed HERE
                        │ (perpendicular to path)
                        ▼
             ┌─────────────────────┐
             │   Turret Range      │
             │   ████████████      │
             │   ████████████      │  ← Enemy spends
             │   ████████████      │    maximum time
             └─────────────────────┘    in range
```

A turret placed perpendicular to the enemy path maximizes "dwell time" - the time an enemy spends within range.

---

## Implementation Plan

### Task 3.1: Create PathInterceptor Class

**File:** `src/ai/spatial/PathInterceptor.ts`

```typescript
/**
 * PathInterceptor
 * 
 * Calculates optimal turret positions for intercepting enemy paths.
 * Uses flow field data and enemy trajectories to find positions
 * that maximize enemy dwell time within turret range.
 */

import { GAME_CONFIG } from '../../types/constants';
import { FlowFieldAnalyzer } from './FlowFieldAnalyzer';
import type { ThreatVector } from '../types';

export interface InterceptionPoint {
  x: number;
  y: number;
  score: number;
  dwellTime: number;        // Estimated seconds enemy in range
  pathsCovered: number;     // Number of enemy paths intercepted
  perpendicularity: number; // 0-1, how perpendicular to flow
}

export interface InterceptionConfig {
  turretRange: number;
  minDwellTime: number;     // Minimum acceptable dwell time
  maxDistanceFromKM: number;
  minDistanceFromKM: number;
}

export class PathInterceptor {
  private flowAnalyzer: FlowFieldAnalyzer;
  private kmX: number;
  private kmY: number;
  
  constructor(flowAnalyzer: FlowFieldAnalyzer) {
    this.flowAnalyzer = flowAnalyzer;
    this.kmX = GAME_CONFIG.WORLD_WIDTH / 2;
    this.kmY = GAME_CONFIG.WORLD_HEIGHT / 2;
  }
  
  /**
   * Find optimal interception points for a given turret range
   */
  findInterceptionPoints(
    config: InterceptionConfig,
    threats: ThreatVector[],
    existingTurretPositions: { x: number; y: number }[]
  ): InterceptionPoint[] {
    const candidates: InterceptionPoint[] = [];
    
    // Generate candidate positions in a grid
    const gridStep = 64; // Sample every 64 pixels
    
    for (let x = config.minDistanceFromKM; x < GAME_CONFIG.WORLD_WIDTH - 50; x += gridStep) {
      for (let y = 50; y < GAME_CONFIG.WORLD_HEIGHT - 50; y += gridStep) {
        // Skip if too close or too far from KM
        const distFromKM = Math.sqrt((x - this.kmX) ** 2 + (y - this.kmY) ** 2);
        if (distFromKM < config.minDistanceFromKM || distFromKM > config.maxDistanceFromKM) {
          continue;
        }
        
        // Skip if too close to existing turret
        if (this.isTooCloseToExisting(x, y, existingTurretPositions, 64)) {
          continue;
        }
        
        // Calculate interception score
        const point = this.evaluateInterceptionPoint(
          x, y, config.turretRange, threats
        );
        
        if (point.dwellTime >= config.minDwellTime) {
          candidates.push(point);
        }
      }
    }
    
    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates;
  }
  
  /**
   * Evaluate a single position for interception quality
   */
  private evaluateInterceptionPoint(
    x: number,
    y: number,
    turretRange: number,
    threats: ThreatVector[]
  ): InterceptionPoint {
    // Get flow direction at this position
    const flow = this.flowAnalyzer.getFlowAt(x, y);
    const flowMagnitude = Math.sqrt(flow.x ** 2 + flow.y ** 2);
    
    // Calculate perpendicularity to flow
    // A turret perpendicular to flow catches enemies for longer
    const perpendicularity = flowMagnitude > 0.1 ? 1.0 : 0.5;
    
    // Calculate dwell time based on flow and range
    // Dwell time = (2 * range) / enemy_speed (simplified)
    const avgEnemySpeed = 100; // pixels/second estimate
    const dwellTime = (2 * turretRange) / avgEnemySpeed;
    
    // Count how many threat paths this position intercepts
    let pathsCovered = 0;
    let threatInterceptScore = 0;
    
    for (const threat of threats) {
      const interceptInfo = this.calculatePathIntercept(
        x, y, turretRange, threat
      );
      
      if (interceptInfo.intercepts) {
        pathsCovered++;
        threatInterceptScore += interceptInfo.quality * threat.threatLevel;
      }
    }
    
    // Traffic density from flow field
    const trafficDensity = this.flowAnalyzer.getTrafficAt(x, y);
    
    // Calculate final score
    const score = 
      trafficDensity * 30 +           // Flow traffic weight
      perpendicularity * 15 +          // Perpendicular bonus
      pathsCovered * 10 +              // Paths covered
      threatInterceptScore * 0.5 +     // Threat-weighted intercepts
      dwellTime * 5;                   // Dwell time bonus
    
    return {
      x, y, score, dwellTime, pathsCovered, perpendicularity
    };
  }
  
  /**
   * Calculate if and how well a position intercepts a threat's path
   */
  private calculatePathIntercept(
    turretX: number,
    turretY: number,
    turretRange: number,
    threat: ThreatVector
  ): { intercepts: boolean; quality: number } {
    // Enemy current position
    const ex = threat.position.x;
    const ey = threat.position.y;
    
    // Enemy velocity (direction to KM if stationary)
    let vx = threat.velocity.x;
    let vy = threat.velocity.y;
    
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 10) {
      // Use direction to KM
      const dx = this.kmX - ex;
      const dy = this.kmY - ey;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        vx = (dx / dist) * 100;
        vy = (dy / dist) * 100;
      }
    }
    
    // Calculate closest approach distance
    // Using line-point distance formula
    const closestDist = this.pointToLineDistance(
      turretX, turretY,
      ex, ey,
      ex + vx * 10, ey + vy * 10 // Project path forward
    );
    
    const intercepts = closestDist <= turretRange;
    
    // Quality based on how centered the intercept is
    // 1.0 = passes through center, 0.0 = grazes edge
    const quality = intercepts ? 
      Math.max(0, 1 - closestDist / turretRange) : 0;
    
    return { intercepts, quality };
  }
  
  /**
   * Calculate distance from point to line segment
   */
  private pointToLineDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }
    
    // Project point onto line
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }
  
  /**
   * Check if position is too close to existing turrets
   */
  private isTooCloseToExisting(
    x: number,
    y: number,
    existing: { x: number; y: number }[],
    minDistance: number
  ): boolean {
    for (const pos of existing) {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < minDistance) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Find choke points where multiple paths converge
   */
  findChokePoints(minConvergence: number = 3): InterceptionPoint[] {
    const analysis = this.flowAnalyzer.analyze();
    const chokePoints: InterceptionPoint[] = [];
    
    // High-traffic cells are natural choke points
    for (const cellIndex of analysis.highTrafficCells) {
      const pos = this.flowAnalyzer.getCellWorldPosition(cellIndex);
      const traffic = analysis.trafficDensity[cellIndex];
      
      if (traffic >= minConvergence / 10) { // Normalize threshold
        chokePoints.push({
          x: pos.x,
          y: pos.y,
          score: traffic * 100,
          dwellTime: 2.0, // Estimate
          pathsCovered: Math.floor(traffic * 10),
          perpendicularity: 0.8
        });
      }
    }
    
    return chokePoints.slice(0, 10); // Top 10 choke points
  }
}
```

**Acceptance Criteria:**
- [ ] Finds positions that intercept enemy paths
- [ ] Calculates dwell time correctly
- [ ] Identifies choke points
- [ ] Respects minimum turret spacing

---

### Task 3.2: Create Approach Corridor Analyzer

**File:** `src/ai/spatial/ApproachCorridorAnalyzer.ts`

```typescript
/**
 * ApproachCorridorAnalyzer
 * 
 * Identifies the main approach corridors enemies use to reach
 * the Kobayashi Maru. Used for strategic turret placement.
 */

import { GAME_CONFIG } from '../../types/constants';
import { FlowFieldAnalyzer } from './FlowFieldAnalyzer';

export interface ApproachCorridor {
  id: number;
  startEdge: 'top' | 'right' | 'bottom' | 'left';
  centerLine: { x: number; y: number }[];
  width: number;
  trafficVolume: number;
}

export class ApproachCorridorAnalyzer {
  private flowAnalyzer: FlowFieldAnalyzer;
  
  constructor(flowAnalyzer: FlowFieldAnalyzer) {
    this.flowAnalyzer = flowAnalyzer;
  }
  
  /**
   * Identify main approach corridors from each edge
   */
  identifyCorridors(): ApproachCorridor[] {
    const corridors: ApproachCorridor[] = [];
    const edges: ('top' | 'right' | 'bottom' | 'left')[] = 
      ['top', 'right', 'bottom', 'left'];
    
    let corridorId = 0;
    
    for (const edge of edges) {
      const edgeCorridors = this.analyzeEdge(edge, corridorId);
      corridors.push(...edgeCorridors);
      corridorId += edgeCorridors.length;
    }
    
    return corridors;
  }
  
  /**
   * Analyze a single edge for approach corridors
   */
  private analyzeEdge(
    edge: 'top' | 'right' | 'bottom' | 'left',
    startId: number
  ): ApproachCorridor[] {
    const corridors: ApproachCorridor[] = [];
    const samplePoints = this.getEdgeSamplePoints(edge, 5);
    
    for (let i = 0; i < samplePoints.length; i++) {
      const start = samplePoints[i];
      const centerLine = this.tracePathToCenter(start.x, start.y);
      
      if (centerLine.length > 5) {
        const traffic = this.flowAnalyzer.getTrafficAt(start.x, start.y);
        
        corridors.push({
          id: startId + i,
          startEdge: edge,
          centerLine,
          width: 100, // Default corridor width
          trafficVolume: traffic
        });
      }
    }
    
    return corridors;
  }
  
  /**
   * Get sample points along an edge
   */
  private getEdgeSamplePoints(
    edge: 'top' | 'right' | 'bottom' | 'left',
    count: number
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const margin = 50;
    
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      
      switch (edge) {
        case 'top':
          points.push({ x: t * GAME_CONFIG.WORLD_WIDTH, y: margin });
          break;
        case 'bottom':
          points.push({ x: t * GAME_CONFIG.WORLD_WIDTH, y: GAME_CONFIG.WORLD_HEIGHT - margin });
          break;
        case 'left':
          points.push({ x: margin, y: t * GAME_CONFIG.WORLD_HEIGHT });
          break;
        case 'right':
          points.push({ x: GAME_CONFIG.WORLD_WIDTH - margin, y: t * GAME_CONFIG.WORLD_HEIGHT });
          break;
      }
    }
    
    return points;
  }
  
  /**
   * Trace a path from start to center following flow field
   */
  private tracePathToCenter(startX: number, startY: number): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let x = startX;
    let y = startY;
    const step = 32;
    const maxSteps = 100;
    
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
    
    for (let i = 0; i < maxSteps; i++) {
      path.push({ x, y });
      
      // Check if reached center
      const distToCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distToCenter < 50) break;
      
      // Follow flow
      const flow = this.flowAnalyzer.getFlowAt(x, y);
      if (flow.x === 0 && flow.y === 0) break;
      
      x += flow.x * step;
      y += flow.y * step;
    }
    
    return path;
  }
  
  /**
   * Get optimal turret positions along a corridor
   */
  getCorridorDefensePositions(
    corridor: ApproachCorridor,
    turretRange: number,
    count: number = 3
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const pathLength = corridor.centerLine.length;
    
    // Place turrets at intervals along the corridor
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      const pathIndex = Math.floor(t * pathLength);
      
      if (pathIndex < pathLength) {
        const point = corridor.centerLine[pathIndex];
        
        // Offset perpendicular to path for better coverage
        const prevPoint = corridor.centerLine[Math.max(0, pathIndex - 1)];
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len > 0) {
          // Perpendicular offset
          const perpX = -dy / len;
          const perpY = dx / len;
          const offset = turretRange * 0.3;
          
          positions.push({
            x: point.x + perpX * offset,
            y: point.y + perpY * offset
          });
        } else {
          positions.push(point);
        }
      }
    }
    
    return positions;
  }
}
```

**Acceptance Criteria:**
- [ ] Identifies corridors from all 4 edges
- [ ] Traces paths correctly to center
- [ ] Suggests defense positions along corridors

---

### Task 3.3: Integrate PathInterceptor with ActionPlanner

**File:** `src/ai/ActionPlanner.ts` (modify)

```typescript
// Add imports
import { PathInterceptor, InterceptionConfig } from './spatial/PathInterceptor';
import { ApproachCorridorAnalyzer } from './spatial/ApproachCorridorAnalyzer';

// Add to constructor
private pathInterceptor: PathInterceptor;
private corridorAnalyzer: ApproachCorridorAnalyzer;

constructor(...) {
  // ... existing code ...
  const flowAnalyzer = this.coverageAnalyzer.getFlowAnalyzer();
  this.pathInterceptor = new PathInterceptor(flowAnalyzer);
  this.corridorAnalyzer = new ApproachCorridorAnalyzer(flowAnalyzer);
}

/**
 * REPLACE planPlacement with interception-aware version
 */
private planPlacement(
  availableResources: number,
  weakestSector: number,
  threats: ThreatVector[]
): AIAction | null {
  // Get turret type first to know range
  const turretType = this.selectTurretType(availableResources, threats);
  if (turretType === null) return null;
  
  const config = TURRET_CONFIG[turretType];
  if (config.cost > availableResources) return null;
  
  // Get existing turret positions
  const existingPositions = this.getExistingTurretPositions();
  
  // Find optimal interception points
  const interceptionConfig: InterceptionConfig = {
    turretRange: config.range,
    minDwellTime: 1.5,
    maxDistanceFromKM: 400,
    minDistanceFromKM: 100
  };
  
  const interceptionPoints = this.pathInterceptor.findInterceptionPoints(
    interceptionConfig,
    threats,
    existingPositions
  );
  
  // Use best interception point, or fall back to sector-based
  let position: { x: number; y: number };
  
  if (interceptionPoints.length > 0) {
    position = interceptionPoints[0];
  } else {
    // Fallback to sector-based placement
    position = this.coverageAnalyzer.findBestPositionInSector(weakestSector, threats);
  }
  
  // Calculate priority
  const threatLevel = this.threatAnalyzer.getOverallThreatLevel();
  const coverage = this.coverageAnalyzer.analyze();
  const coverageGap = 1 - coverage.totalCoverage;
  const priority = 50 + coverageGap * 30 + (threatLevel / 100) * 20;
  
  const params: PlacementParams = {
    x: position.x,
    y: position.y,
    turretType
  };
  
  return {
    type: AIActionType.PLACE_TURRET,
    priority,
    cost: config.cost,
    expectedValue: config.damage * config.fireRate * 10,
    params
  };
}

/**
 * Get positions of all existing turrets
 */
private getExistingTurretPositions(): { x: number; y: number }[] {
  const turrets = query(this.world, [Position, Turret, Faction]);
  const positions: { x: number; y: number }[] = [];
  
  for (const eid of turrets) {
    if (Faction.id[eid] === FactionId.FEDERATION) {
      positions.push({
        x: Position.x[eid],
        y: Position.y[eid]
      });
    }
  }
  
  return positions;
}
```

**Acceptance Criteria:**
- [ ] Uses interception points for placement
- [ ] Falls back to sector-based if no good intercepts
- [ ] Respects existing turret positions
- [ ] Turret range affects interception calculation

---

## Testing

### Unit Tests

```typescript
describe('PathInterceptor', () => {
  it('should find interception points along enemy paths', () => {
    const interceptor = new PathInterceptor(flowAnalyzer);
    const threats = [
      { position: { x: 100, y: 540 }, velocity: { x: 100, y: 0 }, ... }
    ];
    
    const points = interceptor.findInterceptionPoints(
      { turretRange: 200, minDwellTime: 1.0, maxDistanceFromKM: 400, minDistanceFromKM: 100 },
      threats,
      []
    );
    
    expect(points.length).toBeGreaterThan(0);
    expect(points[0].pathsCovered).toBeGreaterThan(0);
  });
  
  it('should calculate dwell time correctly', () => {
    // Turret range 200, enemy speed 100 = 4 seconds dwell time
    const interceptor = new PathInterceptor(flowAnalyzer);
    // ... test dwell time calculation
  });
  
  it('should identify choke points', () => {
    const interceptor = new PathInterceptor(flowAnalyzer);
    const chokePoints = interceptor.findChokePoints(3);
    
    // Choke points should be near center
    for (const point of chokePoints) {
      const distToCenter = Math.sqrt(
        (point.x - 960) ** 2 + (point.y - 540) ** 2
      );
      expect(distToCenter).toBeLessThan(400);
    }
  });
});

describe('ApproachCorridorAnalyzer', () => {
  it('should identify corridors from all edges', () => {
    const analyzer = new ApproachCorridorAnalyzer(flowAnalyzer);
    const corridors = analyzer.identifyCorridors();
    
    const edges = new Set(corridors.map(c => c.startEdge));
    expect(edges.size).toBe(4);
  });
});
```

---

## Expected Impact

| Metric | After Stage 2 | After Stage 3 |
|--------|---------------|---------------|
| Turret hit rate | ~60% | ~75% |
| Path coverage | Partial | Full corridors |
| Dwell time | Random | Maximized |
| Choke point defense | None | Strategic |

---

## Next Stage

[Stage 4: Behavior-Aware Threat Analysis](./20251212_ai_autoplay_overhaul_04_behavior_aware.md)

---

*Document Version: 1.0*
