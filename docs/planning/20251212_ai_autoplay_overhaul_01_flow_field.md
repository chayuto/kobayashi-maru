# Stage 1: Flow Field Integration

**Date:** December 12, 2025  
**Stage:** 1 of 6  
**Priority:** Critical  
**Estimated Hours:** 6-8

---

## Overview

The game already has a complete flow field pathfinding system in `src/pathfinding/` that is **not being used** by the AI. This stage integrates flow fields to understand enemy movement patterns and place turrets along high-traffic paths.

---

## Current State Analysis

### Existing Flow Field System

```
src/pathfinding/
├── grid.ts              # 32px cell grid (60x34 cells for 1920x1080)
├── costField.ts         # Traversal costs per cell
├── integrationField.ts  # Dijkstra-based distance calculation
└── flowField.ts         # Direction vectors per cell
```

### Key Observations

1. **Grid Resolution:** 32px cells = 60 columns × 34 rows = 2040 cells
2. **Flow Direction:** Each cell stores normalized (x, y) vector toward goal
3. **Integration Field:** Uses binary heap for efficient Dijkstra's algorithm
4. **Not Connected:** AI system doesn't use any of this

### Enemy Movement Reality

Enemies spawn from edges and move toward center (Kobayashi Maru):
- **DIRECT:** Straight line to center
- **STRAFE:** Sinusoidal weave toward center
- **ORBIT:** Approach then circle at 300px radius
- **SWARM:** Direct with noise
- **HUNTER:** Targets nearest turret first

---

## Implementation Plan

### Task 1.1: Create FlowFieldAnalyzer Class

**File:** `src/ai/spatial/FlowFieldAnalyzer.ts`

```typescript
/**
 * FlowFieldAnalyzer
 * 
 * Integrates the existing flow field system with AI placement decisions.
 * Generates flow fields from spawn edges to Kobayashi Maru and identifies
 * high-traffic cells for optimal turret placement.
 */

import { Grid } from '../../pathfinding/grid';
import { CostField } from '../../pathfinding/costField';
import { IntegrationField } from '../../pathfinding/integrationField';
import { FlowField } from '../../pathfinding/flowField';
import { GAME_CONFIG } from '../../types/constants';

export interface FlowAnalysis {
  /** Cells with highest traffic (flow convergence) */
  highTrafficCells: number[];
  /** Flow direction at each cell */
  flowVectors: Map<number, { x: number; y: number }>;
  /** Traffic density score per cell (0-1) */
  trafficDensity: Float32Array;
}

export class FlowFieldAnalyzer {
  private grid: Grid;
  private costField: CostField;
  private integrationField: IntegrationField;
  private flowField: FlowField;
  private trafficDensity: Float32Array;
  
  constructor() {
    this.grid = new Grid();
    this.costField = new CostField(this.grid);
    this.integrationField = new IntegrationField(this.grid);
    this.flowField = new FlowField(this.grid);
    this.trafficDensity = new Float32Array(this.grid.getSize());
  }
  
  /**
   * Generate flow field toward Kobayashi Maru (center)
   */
  generateToCenter(): void {
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
    
    this.costField.reset(); // All cells cost 1
    this.integrationField.calculate(centerX, centerY, this.costField);
    this.flowField.generate(this.integrationField);
  }
  
  /**
   * Calculate traffic density by simulating flow from all edges
   * Higher values = more enemy paths converge here
   */
  calculateTrafficDensity(): void {
    this.trafficDensity.fill(0);
    
    // Simulate flow from edge cells
    const edgeCells = this.getEdgeCells();
    
    for (const startCell of edgeCells) {
      this.traceFlowPath(startCell);
    }
    
    // Normalize to 0-1
    const max = Math.max(...this.trafficDensity);
    if (max > 0) {
      for (let i = 0; i < this.trafficDensity.length; i++) {
        this.trafficDensity[i] /= max;
      }
    }
  }
  
  /**
   * Trace a flow path from start cell, incrementing traffic along the way
   */
  private traceFlowPath(startCell: number): void {
    let currentCell = startCell;
    const visited = new Set<number>();
    const maxSteps = 200; // Prevent infinite loops
    
    for (let step = 0; step < maxSteps; step++) {
      if (visited.has(currentCell)) break;
      visited.add(currentCell);
      
      // Increment traffic at this cell
      this.trafficDensity[currentCell] += 1;
      
      // Get flow direction
      const pos = this.grid.getCellCenter(currentCell);
      const dir = this.flowField.getDirection(pos.x, pos.y);
      
      // Zero vector means we reached the goal
      if (dir.x === 0 && dir.y === 0) break;
      
      // Move to next cell
      const nextX = pos.x + dir.x * Grid.CELL_SIZE;
      const nextY = pos.y + dir.y * Grid.CELL_SIZE;
      currentCell = this.grid.getCellIndex(nextX, nextY);
    }
  }
  
  /**
   * Get all cells along screen edges (spawn zones)
   */
  private getEdgeCells(): number[] {
    const cells: number[] = [];
    
    // Top and bottom edges
    for (let col = 0; col < this.grid.cols; col++) {
      cells.push(col); // Top row
      cells.push((this.grid.rows - 1) * this.grid.cols + col); // Bottom row
    }
    
    // Left and right edges (excluding corners already added)
    for (let row = 1; row < this.grid.rows - 1; row++) {
      cells.push(row * this.grid.cols); // Left column
      cells.push(row * this.grid.cols + this.grid.cols - 1); // Right column
    }
    
    return cells;
  }
  
  /**
   * Get high-traffic cells sorted by density
   * @param count Number of cells to return
   * @param minDensity Minimum density threshold (0-1)
   */
  getHighTrafficCells(count: number = 20, minDensity: number = 0.5): number[] {
    const cells: { index: number; density: number }[] = [];
    
    for (let i = 0; i < this.trafficDensity.length; i++) {
      if (this.trafficDensity[i] >= minDensity) {
        cells.push({ index: i, density: this.trafficDensity[i] });
      }
    }
    
    cells.sort((a, b) => b.density - a.density);
    return cells.slice(0, count).map(c => c.index);
  }
  
  /**
   * Get traffic density at a world position
   */
  getTrafficAt(x: number, y: number): number {
    const cellIndex = this.grid.getCellIndex(x, y);
    if (cellIndex >= 0 && cellIndex < this.trafficDensity.length) {
      return this.trafficDensity[cellIndex];
    }
    return 0;
  }
  
  /**
   * Get flow direction at a world position
   */
  getFlowAt(x: number, y: number): { x: number; y: number } {
    return this.flowField.getDirection(x, y);
  }
  
  /**
   * Get world position of a cell center
   */
  getCellWorldPosition(cellIndex: number): { x: number; y: number } {
    return this.grid.getCellCenter(cellIndex);
  }
  
  /**
   * Full analysis - call once at game start or when map changes
   */
  analyze(): FlowAnalysis {
    this.generateToCenter();
    this.calculateTrafficDensity();
    
    const highTrafficCells = this.getHighTrafficCells(30, 0.4);
    const flowVectors = new Map<number, { x: number; y: number }>();
    
    for (const cellIndex of highTrafficCells) {
      const pos = this.grid.getCellCenter(cellIndex);
      flowVectors.set(cellIndex, this.flowField.getDirection(pos.x, pos.y));
    }
    
    return {
      highTrafficCells,
      flowVectors,
      trafficDensity: this.trafficDensity
    };
  }
}
```

**Acceptance Criteria:**
- [ ] Flow field generates correctly toward center
- [ ] Traffic density identifies convergence points
- [ ] High-traffic cells are near center but not at center
- [ ] Performance < 50ms for full analysis

---

### Task 1.2: Integrate FlowFieldAnalyzer with CoverageAnalyzer

**File:** `src/ai/CoverageAnalyzer.ts` (modify)

```typescript
// Add to CoverageAnalyzer constructor
private flowAnalyzer: FlowFieldAnalyzer;

constructor(world: GameWorld, ...) {
  // ... existing code ...
  this.flowAnalyzer = new FlowFieldAnalyzer();
  this.flowAnalyzer.analyze(); // Generate once
}

/**
 * REPLACE findBestPositionInSector with flow-aware version
 */
findBestPositionInSector(sectorIndex: number, threats?: ThreatVector[]): { x: number; y: number } {
  const sector = this.sectors[sectorIndex];
  
  // Get high-traffic cells within this sector
  const sectorBounds = {
    minX: sector.x - sector.width / 2,
    maxX: sector.x + sector.width / 2,
    minY: sector.y - sector.height / 2,
    maxY: sector.y + sector.height / 2
  };
  
  let bestX = sector.x;
  let bestY = sector.y;
  let bestScore = -Infinity;
  
  // Sample positions along high-traffic flow paths
  const samples = 9; // 3x3 grid within sector
  const stepX = sector.width / (samples + 1);
  const stepY = sector.height / (samples + 1);
  
  for (let i = 1; i <= Math.sqrt(samples); i++) {
    for (let j = 1; j <= Math.sqrt(samples); j++) {
      const testX = sectorBounds.minX + i * stepX;
      const testY = sectorBounds.minY + j * stepY;
      
      const score = this.scorePositionWithFlow(testX, testY, threats);
      
      if (score > bestScore) {
        bestScore = score;
        bestX = testX;
        bestY = testY;
      }
    }
  }
  
  return { x: bestX, y: bestY };
}

/**
 * NEW: Score position using flow field traffic data
 */
private scorePositionWithFlow(
  x: number, 
  y: number, 
  threats?: ThreatVector[]
): number {
  let score = 0;
  
  const kmX = GAME_CONFIG.WORLD_WIDTH / 2;
  const kmY = GAME_CONFIG.WORLD_HEIGHT / 2;
  
  // 1. Traffic density score (0-40 points)
  // Higher traffic = more enemies will pass through
  const traffic = this.flowAnalyzer.getTrafficAt(x, y);
  score += traffic * 40;
  
  // 2. Flow perpendicularity bonus (0-20 points)
  // Turrets perpendicular to flow can hit enemies longer
  const flow = this.flowAnalyzer.getFlowAt(x, y);
  // (perpendicularity calculation would go here)
  
  // 3. Existing coverage penalty (-20 to 0 points)
  const existingCoverage = this.getCoverageAtPosition(x, y);
  score -= existingCoverage * 20;
  
  // 4. Distance from KM (0-15 points)
  // Prefer defensive ring at ~150-250px
  const distFromKM = Math.sqrt((x - kmX) ** 2 + (y - kmY) ** 2);
  const optimalDist = 180;
  const distScore = 15 - Math.abs(distFromKM - optimalDist) / 15;
  score += Math.max(0, distScore);
  
  // 5. Threat interception (0-25 points)
  if (threats && threats.length > 0) {
    let interceptScore = 0;
    for (const threat of threats.slice(0, 10)) {
      const distToThreat = Math.sqrt(
        (x - threat.position.x) ** 2 + 
        (y - threat.position.y) ** 2
      );
      // Bonus for being in range of threats
      if (distToThreat < 250) {
        interceptScore += (250 - distToThreat) / 250;
      }
    }
    score += Math.min(25, interceptScore * 5);
  }
  
  return score;
}
```

**Acceptance Criteria:**
- [ ] Positions scored by traffic density
- [ ] High-traffic positions preferred
- [ ] Existing coverage still penalized
- [ ] Threat proximity still considered

---

### Task 1.3: Update ActionPlanner to Use Flow Data

**File:** `src/ai/ActionPlanner.ts` (modify)

```typescript
// In planPlacement method, add flow-aware turret type selection

private selectTurretTypeForPosition(
  x: number, 
  y: number, 
  availableResources: number,
  threats: ThreatVector[]
): number | null {
  const flowAnalyzer = this.coverageAnalyzer.getFlowAnalyzer();
  const traffic = flowAnalyzer.getTrafficAt(x, y);
  
  // High traffic areas need high fire rate turrets
  if (traffic > 0.7) {
    // Prefer Phaser Array or Disruptor Bank for swarms
    if (TURRET_CONFIG[TurretType.PHASER_ARRAY].cost <= availableResources) {
      return TurretType.PHASER_ARRAY;
    }
  }
  
  // Medium traffic - balanced turrets
  if (traffic > 0.4) {
    if (TURRET_CONFIG[TurretType.DISRUPTOR_BANK].cost <= availableResources) {
      return TurretType.DISRUPTOR_BANK;
    }
  }
  
  // Low traffic (flanks) - long range turrets
  if (TURRET_CONFIG[TurretType.TORPEDO_LAUNCHER].cost <= availableResources) {
    return TurretType.TORPEDO_LAUNCHER;
  }
  
  // Fallback to existing faction-based selection
  return this.selectTurretType(availableResources, threats);
}
```

**Acceptance Criteria:**
- [ ] Turret type considers traffic density
- [ ] High-traffic gets fast-firing turrets
- [ ] Low-traffic gets long-range turrets

---

### Task 1.4: Add Flow Field Visualization (Debug)

**File:** `src/ai/spatial/FlowFieldDebugRenderer.ts` (new, optional)

```typescript
/**
 * Debug visualization for flow field analysis
 * Only used in development to verify flow calculations
 */

import { Graphics } from 'pixi.js';
import { FlowFieldAnalyzer } from './FlowFieldAnalyzer';

export class FlowFieldDebugRenderer {
  private graphics: Graphics;
  private analyzer: FlowFieldAnalyzer;
  
  constructor(analyzer: FlowFieldAnalyzer) {
    this.analyzer = analyzer;
    this.graphics = new Graphics();
  }
  
  render(): Graphics {
    this.graphics.clear();
    
    // Draw traffic density as heat map
    const analysis = this.analyzer.analyze();
    
    for (let i = 0; i < analysis.trafficDensity.length; i++) {
      const density = analysis.trafficDensity[i];
      if (density > 0.3) {
        const pos = this.analyzer.getCellWorldPosition(i);
        const alpha = density * 0.5;
        const color = density > 0.7 ? 0xFF0000 : 0xFFFF00;
        
        this.graphics.beginFill(color, alpha);
        this.graphics.drawRect(pos.x - 16, pos.y - 16, 32, 32);
        this.graphics.endFill();
      }
    }
    
    // Draw flow vectors at high-traffic cells
    for (const cellIndex of analysis.highTrafficCells) {
      const pos = this.analyzer.getCellWorldPosition(cellIndex);
      const flow = analysis.flowVectors.get(cellIndex);
      
      if (flow) {
        this.graphics.lineStyle(2, 0x00FF00, 0.8);
        this.graphics.moveTo(pos.x, pos.y);
        this.graphics.lineTo(pos.x + flow.x * 20, pos.y + flow.y * 20);
      }
    }
    
    return this.graphics;
  }
}
```

**Acceptance Criteria:**
- [ ] Heat map shows traffic convergence
- [ ] Arrows show flow direction
- [ ] High-traffic areas visible near center

---

## Testing

### Unit Tests

```typescript
describe('FlowFieldAnalyzer', () => {
  let analyzer: FlowFieldAnalyzer;
  
  beforeEach(() => {
    analyzer = new FlowFieldAnalyzer();
  });
  
  it('should generate flow toward center', () => {
    analyzer.generateToCenter();
    
    // Edge cell should flow toward center
    const edgeFlow = analyzer.getFlowAt(0, 540); // Left edge, middle
    expect(edgeFlow.x).toBeGreaterThan(0); // Should point right
  });
  
  it('should identify high traffic near center', () => {
    const analysis = analyzer.analyze();
    
    // High traffic cells should be closer to center than edges
    const centerX = 960;
    const centerY = 540;
    
    for (const cellIndex of analysis.highTrafficCells.slice(0, 5)) {
      const pos = analyzer.getCellWorldPosition(cellIndex);
      const distToCenter = Math.sqrt(
        (pos.x - centerX) ** 2 + (pos.y - centerY) ** 2
      );
      expect(distToCenter).toBeLessThan(400);
    }
  });
  
  it('should have zero flow at center (goal)', () => {
    analyzer.generateToCenter();
    const centerFlow = analyzer.getFlowAt(960, 540);
    expect(centerFlow.x).toBe(0);
    expect(centerFlow.y).toBe(0);
  });
});
```

### Integration Tests

```typescript
describe('AI Placement with Flow Field', () => {
  it('should place turrets along high-traffic paths', () => {
    // Setup game with AI enabled
    // Let AI place 5 turrets
    // Verify turrets are in high-traffic cells
  });
  
  it('should improve hit rate vs random placement', () => {
    // Compare AI placement hit rate vs random
    // AI should achieve >50% hit rate
  });
});
```

---

## Expected Impact

| Metric | Before | After Stage 1 |
|--------|--------|---------------|
| Turret hit rate | ~30% | ~50% |
| Placement logic | Sector center | Flow convergence |
| Path awareness | None | Full flow field |

---

## Dependencies

- Existing `src/pathfinding/` module (no changes needed)
- `CoverageAnalyzer` (modifications)
- `ActionPlanner` (modifications)

---

## Next Stage

[Stage 2: Influence Map System](./20251212_ai_autoplay_overhaul_02_influence_map.md)

---

*Document Version: 1.0*
