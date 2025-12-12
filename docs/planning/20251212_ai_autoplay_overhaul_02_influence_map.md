# Stage 2: Influence Map System

**Date:** December 12, 2025  
**Stage:** 2 of 6  
**Priority:** High  
**Estimated Hours:** 4-6  
**Dependencies:** Stage 1 (Flow Field Integration)

---

## Overview

Influence Maps provide spatial reasoning for tactical decisions. They represent "fields of influence" across the game world - threat zones, coverage areas, and strategic value. This enables the AI to answer questions like:

- "Where is the safest spot?"
- "Where can I hit the most enemies?"
- "Where are the coverage gaps?"

---

## Research Foundation

From the research document:

> "An Influence Map is a spatial representation of power, threat, or control across the game world... By summing the influence of all entities, the AI creates a topography of the battlefield."

Key applications:
1. **Kiting/Evasion:** Find local minima (lowest threat)
2. **AoE Maximization:** Find highest enemy density peaks
3. **Pathfinding Weights:** Overlay threat on navigation costs

---

## Implementation Plan

### Task 2.1: Create InfluenceMap Base Class

**File:** `src/ai/spatial/InfluenceMap.ts`

```typescript
/**
 * InfluenceMap
 * 
 * A 2D grid representing influence values across the game world.
 * Values propagate from sources with configurable decay.
 * 
 * Used for:
 * - Threat density mapping
 * - Turret coverage mapping
 * - Strategic value assessment
 */

import { GAME_CONFIG } from '../../types/constants';

export interface InfluenceSource {
  x: number;
  y: number;
  strength: number;  // Base influence value
  radius: number;    // Maximum influence radius
  decay: 'linear' | 'quadratic' | 'exponential';
}

export class InfluenceMap {
  private values: Float32Array;
  private readonly cellSize: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly width: number;
  private readonly height: number;
  
  constructor(cellSize: number = 32) {
    this.cellSize = cellSize;
    this.width = GAME_CONFIG.WORLD_WIDTH;
    this.height = GAME_CONFIG.WORLD_HEIGHT;
    this.cols = Math.ceil(this.width / cellSize);
    this.rows = Math.ceil(this.height / cellSize);
    this.values = new Float32Array(this.cols * this.rows);
  }
  
  /**
   * Clear all influence values
   */
  clear(): void {
    this.values.fill(0);
  }
  
  /**
   * Add influence from a single source
   */
  addSource(source: InfluenceSource): void {
    const centerCol = Math.floor(source.x / this.cellSize);
    const centerRow = Math.floor(source.y / this.cellSize);
    const radiusCells = Math.ceil(source.radius / this.cellSize);
    
    // Iterate over cells within radius
    for (let dr = -radiusCells; dr <= radiusCells; dr++) {
      for (let dc = -radiusCells; dc <= radiusCells; dc++) {
        const col = centerCol + dc;
        const row = centerRow + dr;
        
        // Bounds check
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
          continue;
        }
        
        // Calculate distance
        const cellX = (col + 0.5) * this.cellSize;
        const cellY = (row + 0.5) * this.cellSize;
        const distance = Math.sqrt(
          (cellX - source.x) ** 2 + (cellY - source.y) ** 2
        );
        
        if (distance > source.radius) continue;
        
        // Calculate influence with decay
        const influence = this.calculateInfluence(
          source.strength,
          distance,
          source.radius,
          source.decay
        );
        
        // Add to cell
        const index = row * this.cols + col;
        this.values[index] += influence;
      }
    }
  }
  
  /**
   * Calculate influence value based on decay type
   */
  private calculateInfluence(
    strength: number,
    distance: number,
    radius: number,
    decay: 'linear' | 'quadratic' | 'exponential'
  ): number {
    const normalizedDist = distance / radius;
    
    switch (decay) {
      case 'linear':
        return strength * (1 - normalizedDist);
      case 'quadratic':
        return strength * (1 - normalizedDist * normalizedDist);
      case 'exponential':
        return strength * Math.exp(-3 * normalizedDist);
      default:
        return strength * (1 - normalizedDist);
    }
  }
  
  /**
   * Get influence value at world position
   */
  getValue(x: number, y: number): number {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return 0;
    }
    
    return this.values[row * this.cols + col];
  }
  
  /**
   * Get interpolated value (smoother)
   */
  getValueInterpolated(x: number, y: number): number {
    const col = x / this.cellSize - 0.5;
    const row = y / this.cellSize - 0.5;
    
    const col0 = Math.floor(col);
    const row0 = Math.floor(row);
    const col1 = col0 + 1;
    const row1 = row0 + 1;
    
    const tx = col - col0;
    const ty = row - row0;
    
    const v00 = this.getValueAt(col0, row0);
    const v10 = this.getValueAt(col1, row0);
    const v01 = this.getValueAt(col0, row1);
    const v11 = this.getValueAt(col1, row1);
    
    // Bilinear interpolation
    const v0 = v00 * (1 - tx) + v10 * tx;
    const v1 = v01 * (1 - tx) + v11 * tx;
    
    return v0 * (1 - ty) + v1 * ty;
  }
  
  private getValueAt(col: number, row: number): number {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return 0;
    }
    return this.values[row * this.cols + col];
  }
  
  /**
   * Find cell with maximum influence
   */
  findMaximum(): { x: number; y: number; value: number } {
    let maxIndex = 0;
    let maxValue = this.values[0];
    
    for (let i = 1; i < this.values.length; i++) {
      if (this.values[i] > maxValue) {
        maxValue = this.values[i];
        maxIndex = i;
      }
    }
    
    const col = maxIndex % this.cols;
    const row = Math.floor(maxIndex / this.cols);
    
    return {
      x: (col + 0.5) * this.cellSize,
      y: (row + 0.5) * this.cellSize,
      value: maxValue
    };
  }
  
  /**
   * Find cell with minimum influence
   */
  findMinimum(): { x: number; y: number; value: number } {
    let minIndex = 0;
    let minValue = this.values[0];
    
    for (let i = 1; i < this.values.length; i++) {
      if (this.values[i] < minValue) {
        minValue = this.values[i];
        minIndex = i;
      }
    }
    
    const col = minIndex % this.cols;
    const row = Math.floor(minIndex / this.cols);
    
    return {
      x: (col + 0.5) * this.cellSize,
      y: (row + 0.5) * this.cellSize,
      value: minValue
    };
  }
  
  /**
   * Find local maxima (peaks)
   */
  findPeaks(threshold: number = 0): { x: number; y: number; value: number }[] {
    const peaks: { x: number; y: number; value: number }[] = [];
    
    for (let row = 1; row < this.rows - 1; row++) {
      for (let col = 1; col < this.cols - 1; col++) {
        const index = row * this.cols + col;
        const value = this.values[index];
        
        if (value <= threshold) continue;
        
        // Check if local maximum (higher than all 8 neighbors)
        let isMax = true;
        for (let dr = -1; dr <= 1 && isMax; dr++) {
          for (let dc = -1; dc <= 1 && isMax; dc++) {
            if (dr === 0 && dc === 0) continue;
            const neighborIndex = (row + dr) * this.cols + (col + dc);
            if (this.values[neighborIndex] >= value) {
              isMax = false;
            }
          }
        }
        
        if (isMax) {
          peaks.push({
            x: (col + 0.5) * this.cellSize,
            y: (row + 0.5) * this.cellSize,
            value
          });
        }
      }
    }
    
    // Sort by value descending
    peaks.sort((a, b) => b.value - a.value);
    return peaks;
  }
  
  /**
   * Get raw values array (for visualization)
   */
  getValues(): Float32Array {
    return this.values;
  }
  
  /**
   * Get grid dimensions
   */
  getDimensions(): { cols: number; rows: number; cellSize: number } {
    return { cols: this.cols, rows: this.rows, cellSize: this.cellSize };
  }
}
```

**Acceptance Criteria:**
- [ ] Influence propagates correctly from sources
- [ ] All three decay types work
- [ ] Peak finding identifies local maxima
- [ ] Performance < 5ms for 100 sources

---

### Task 2.2: Create ThreatInfluenceMap

**File:** `src/ai/spatial/ThreatInfluenceMap.ts`

```typescript
/**
 * ThreatInfluenceMap
 * 
 * Specialized influence map for enemy threat assessment.
 * Updates each frame based on enemy positions and velocities.
 */

import { query, hasComponent } from 'bitecs';
import { Position, Velocity, Health, Faction, AIBehavior, EnemyVariant } from '../../ecs/components';
import { FactionId } from '../../types/config/factions';
import { EnemyRank } from '../../types/config/enemies';
import { InfluenceMap, InfluenceSource } from './InfluenceMap';
import type { GameWorld } from '../../ecs/world';

export class ThreatInfluenceMap {
  private map: InfluenceMap;
  private world: GameWorld;
  
  constructor(world: GameWorld, cellSize: number = 48) {
    this.world = world;
    this.map = new InfluenceMap(cellSize);
  }
  
  /**
   * Update threat map based on current enemy positions
   */
  update(): void {
    this.map.clear();
    
    const enemies = query(this.world, [Position, Velocity, Faction, Health]);
    
    for (const eid of enemies) {
      // Skip non-enemies
      if (Faction.id[eid] === FactionId.FEDERATION) continue;
      
      // Skip dead enemies
      const health = Health.current[eid];
      if (health <= 0) continue;
      
      const x = Position.x[eid];
      const y = Position.y[eid];
      const vx = Velocity.x[eid];
      const vy = Velocity.y[eid];
      
      // Calculate threat strength
      let strength = this.calculateThreatStrength(eid);
      
      // Add current position influence
      this.map.addSource({
        x, y,
        strength,
        radius: 150,
        decay: 'quadratic'
      });
      
      // Add predicted position influence (where enemy will be)
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 10) {
        const predictTime = 2.0; // seconds ahead
        const predictX = x + vx * predictTime;
        const predictY = y + vy * predictTime;
        
        this.map.addSource({
          x: predictX,
          y: predictY,
          strength: strength * 0.6, // Reduced for prediction
          radius: 120,
          decay: 'linear'
        });
      }
    }
  }
  
  /**
   * Calculate threat strength for an enemy
   */
  private calculateThreatStrength(eid: number): number {
    let strength = 10; // Base threat
    
    // Health factor
    const healthPercent = Health.current[eid] / Health.max[eid];
    strength += healthPercent * 5;
    
    // Faction modifier
    const factionId = Faction.id[eid];
    const factionMods: Record<number, number> = {
      [FactionId.KLINGON]: 1.0,
      [FactionId.ROMULAN]: 1.2,
      [FactionId.BORG]: 1.5,
      [FactionId.THOLIAN]: 1.3,
      [FactionId.SPECIES_8472]: 1.8
    };
    strength *= factionMods[factionId] || 1.0;
    
    // Elite/Boss modifier
    if (hasComponent(this.world, eid, EnemyVariant)) {
      const rank = EnemyVariant.rank[eid];
      if (rank === EnemyRank.ELITE) {
        strength *= 2.0;
      } else if (rank === EnemyRank.BOSS) {
        strength *= 4.0;
      }
    }
    
    return strength;
  }
  
  /**
   * Get threat level at position
   */
  getThreatAt(x: number, y: number): number {
    return this.map.getValueInterpolated(x, y);
  }
  
  /**
   * Find highest threat concentration (for AoE targeting)
   */
  findThreatPeaks(count: number = 5): { x: number; y: number; value: number }[] {
    return this.map.findPeaks(5).slice(0, count);
  }
  
  /**
   * Find safest position (lowest threat)
   */
  findSafestPosition(): { x: number; y: number; value: number } {
    return this.map.findMinimum();
  }
  
  /**
   * Get underlying map for visualization
   */
  getMap(): InfluenceMap {
    return this.map;
  }
}
```

**Acceptance Criteria:**
- [ ] Updates from enemy positions
- [ ] Includes velocity prediction
- [ ] Elite/Boss have higher influence
- [ ] Peaks identify enemy clusters

---

### Task 2.3: Create CoverageInfluenceMap

**File:** `src/ai/spatial/CoverageInfluenceMap.ts`

```typescript
/**
 * CoverageInfluenceMap
 * 
 * Represents turret coverage across the map.
 * Used to identify gaps and avoid over-coverage.
 */

import { query } from 'bitecs';
import { Position, Turret, Faction } from '../../ecs/components';
import { FactionId } from '../../types/config/factions';
import { InfluenceMap } from './InfluenceMap';
import type { GameWorld } from '../../ecs/world';

export class CoverageInfluenceMap {
  private map: InfluenceMap;
  private world: GameWorld;
  
  constructor(world: GameWorld, cellSize: number = 48) {
    this.world = world;
    this.map = new InfluenceMap(cellSize);
  }
  
  /**
   * Update coverage map based on turret positions
   */
  update(): void {
    this.map.clear();
    
    const turrets = query(this.world, [Position, Turret, Faction]);
    
    for (const eid of turrets) {
      // Only count federation turrets
      if (Faction.id[eid] !== FactionId.FEDERATION) continue;
      
      const x = Position.x[eid];
      const y = Position.y[eid];
      const range = Turret.range[eid];
      const damage = Turret.damage[eid];
      const fireRate = Turret.fireRate[eid];
      
      // DPS as influence strength
      const dps = damage * fireRate;
      
      this.map.addSource({
        x, y,
        strength: dps,
        radius: range,
        decay: 'linear' // Linear decay for range coverage
      });
    }
  }
  
  /**
   * Get coverage at position
   */
  getCoverageAt(x: number, y: number): number {
    return this.map.getValueInterpolated(x, y);
  }
  
  /**
   * Find coverage gaps (low coverage areas)
   */
  findCoverageGaps(threshold: number = 10): { x: number; y: number; value: number }[] {
    const gaps: { x: number; y: number; value: number }[] = [];
    const dims = this.map.getDimensions();
    const values = this.map.getValues();
    
    for (let row = 0; row < dims.rows; row++) {
      for (let col = 0; col < dims.cols; col++) {
        const index = row * dims.cols + col;
        const value = values[index];
        
        if (value < threshold) {
          gaps.push({
            x: (col + 0.5) * dims.cellSize,
            y: (row + 0.5) * dims.cellSize,
            value
          });
        }
      }
    }
    
    // Sort by value ascending (lowest coverage first)
    gaps.sort((a, b) => a.value - b.value);
    return gaps;
  }
  
  /**
   * Check if position would create over-coverage
   */
  wouldOverlap(x: number, y: number, range: number): boolean {
    const currentCoverage = this.getCoverageAt(x, y);
    return currentCoverage > 30; // Threshold for "already covered"
  }
  
  /**
   * Get underlying map for visualization
   */
  getMap(): InfluenceMap {
    return this.map;
  }
}
```

**Acceptance Criteria:**
- [ ] Updates from turret positions
- [ ] DPS-weighted coverage
- [ ] Gap detection works
- [ ] Overlap detection prevents stacking

---

### Task 2.4: Integrate Influence Maps with CoverageAnalyzer

**File:** `src/ai/CoverageAnalyzer.ts` (modify)

```typescript
// Add imports
import { ThreatInfluenceMap } from './spatial/ThreatInfluenceMap';
import { CoverageInfluenceMap } from './spatial/CoverageInfluenceMap';

// Add to constructor
private threatMap: ThreatInfluenceMap;
private coverageMap: CoverageInfluenceMap;

constructor(world: GameWorld, ...) {
  // ... existing code ...
  this.threatMap = new ThreatInfluenceMap(world);
  this.coverageMap = new CoverageInfluenceMap(world);
}

// Add update method
updateInfluenceMaps(): void {
  this.threatMap.update();
  this.coverageMap.update();
}

// Modify scorePositionWithFlow to use influence maps
private scorePositionWithFlow(
  x: number, 
  y: number, 
  threats?: ThreatVector[]
): number {
  let score = 0;
  
  // 1. Traffic density (from flow field)
  const traffic = this.flowAnalyzer.getTrafficAt(x, y);
  score += traffic * 30;
  
  // 2. Threat density from influence map (0-30 points)
  const threatDensity = this.threatMap.getThreatAt(x, y);
  score += Math.min(30, threatDensity);
  
  // 3. Coverage gap bonus (0-25 points)
  // Lower existing coverage = higher score
  const existingCoverage = this.coverageMap.getCoverageAt(x, y);
  const coverageGapBonus = Math.max(0, 25 - existingCoverage);
  score += coverageGapBonus;
  
  // 4. Distance from KM (0-15 points)
  const kmX = GAME_CONFIG.WORLD_WIDTH / 2;
  const kmY = GAME_CONFIG.WORLD_HEIGHT / 2;
  const distFromKM = Math.sqrt((x - kmX) ** 2 + (y - kmY) ** 2);
  const optimalDist = 180;
  const distScore = 15 - Math.abs(distFromKM - optimalDist) / 15;
  score += Math.max(0, distScore);
  
  return score;
}

// Expose maps for external use
getThreatMap(): ThreatInfluenceMap {
  return this.threatMap;
}

getCoverageMap(): CoverageInfluenceMap {
  return this.coverageMap;
}
```

**Acceptance Criteria:**
- [ ] Influence maps update each decision cycle
- [ ] Position scoring uses both maps
- [ ] Threat density affects placement priority
- [ ] Coverage gaps are filled first

---

## Testing

### Unit Tests

```typescript
describe('InfluenceMap', () => {
  it('should propagate influence with linear decay', () => {
    const map = new InfluenceMap(32);
    map.addSource({ x: 100, y: 100, strength: 10, radius: 100, decay: 'linear' });
    
    expect(map.getValue(100, 100)).toBeCloseTo(10, 1);
    expect(map.getValue(150, 100)).toBeCloseTo(5, 1); // 50% distance
    expect(map.getValue(200, 100)).toBeCloseTo(0, 1); // At radius
  });
  
  it('should find peaks correctly', () => {
    const map = new InfluenceMap(32);
    map.addSource({ x: 200, y: 200, strength: 20, radius: 100, decay: 'quadratic' });
    map.addSource({ x: 500, y: 500, strength: 15, radius: 100, decay: 'quadratic' });
    
    const peaks = map.findPeaks();
    expect(peaks.length).toBeGreaterThanOrEqual(2);
    expect(peaks[0].value).toBeGreaterThan(peaks[1].value);
  });
});

describe('ThreatInfluenceMap', () => {
  it('should weight elite enemies higher', () => {
    // Create world with normal and elite enemy
    // Verify elite has higher influence
  });
  
  it('should include velocity prediction', () => {
    // Create enemy moving toward center
    // Verify influence extends in movement direction
  });
});
```

---

## Expected Impact

| Metric | After Stage 1 | After Stage 2 |
|--------|---------------|---------------|
| Turret hit rate | ~50% | ~60% |
| Coverage gaps | Some | Minimal |
| Threat response | Basic | Density-aware |
| Placement quality | Good | Strategic |

---

## Next Stage

[Stage 3: Path Interception Algorithm](./20251212_ai_autoplay_overhaul_03_path_interception.md)

---

*Document Version: 1.0*
