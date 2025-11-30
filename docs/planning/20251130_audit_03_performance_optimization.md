# Code Audit: Performance & Optimization

**Date:** 2025-11-30  
**Scope:** Performance bottlenecks, memory management, and optimization opportunities

## Executive Summary

The codebase shows good performance awareness with entity pooling and ParticleContainer usage. However, there are several optimization opportunities and potential performance pitfalls.

**Overall Grade:** B (Good performance foundation with optimization opportunities)

---

## Strengths

### 1. Entity Pooling ✅
```typescript
export class EntityPool {
  private available: number[] = [];
  private inUse: Set<number> = new Set();
  
  acquire(): number {
    return this.available.pop() ?? addEntity(this.world);
  }
}
```
- Reduces GC pressure
- Pre-allocates 10,000 entities
- Good for high-frequency spawning

### 2. ParticleContainer Usage ✅
```typescript
const container = new ParticleContainer({
  dynamicProperties: {
    position: true,
    scale: false,
    rotation: false,
    color: false
  }
});
```
- Optimized for large sprite counts
- Minimal dynamic properties for performance
- Appropriate for 5,000+ entities

### 3. Frame-Independent Movement ✅
```typescript
const deltaTime = this.app.ticker.deltaMS / 1000;
Position.x[eid] += Velocity.x[eid] * deltaTime;
```
- Consistent behavior across frame rates
- Proper time-based physics

---

## Critical Performance Issues

### 1. ❌ Inefficient Dijkstra Implementation

**Problem:**
```typescript
// integrationField.ts
while (openList.length > 0) {
  // O(n log n) sort on every iteration!
  openList.sort((a, b) => this.values[a] - this.values[b]);
  const currentIndex = openList.shift()!;
}
```

**Impact:**
- O(n² log n) complexity for pathfinding
- Will cause frame drops with large grids
- Unnecessary sorting of entire array

**Recommendation:**
```typescript
// Use a proper binary heap priority queue
class MinHeap<T> {
  private heap: T[] = [];
  
  constructor(private compareFn: (a: T, b: T) => number) {}
  
  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }
  
  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }
  
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareFn(this.heap[index], this.heap[parentIndex]) >= 0) break;
      [this.heap[index], this.heap[parentIndex]] = 
        [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }
  
  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;
      
      if (leftChild < this.heap.length && 
          this.compareFn(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < this.heap.length && 
          this.compareFn(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }
      
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = 
        [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

// Usage in IntegrationField
public calculate(goalX: number, goalY: number, costField: CostField): void {
  this.reset();
  const goalIndex = this.grid.getCellIndex(goalX, goalY);
  
  const openList = new MinHeap<number>((a, b) => this.values[a] - this.values[b]);
  openList.push(goalIndex);
  this.values[goalIndex] = 0;
  
  while (openList.size() > 0) {
    const currentIndex = openList.pop()!;
    // ... rest of algorithm
  }
}
```

**Performance Gain:** O(n log n) instead of O(n² log n) - ~100x faster for large grids

### 2. ❌ Texture Generation on Every Init

**Problem:**
```typescript
// textures.ts - Creates new textures every time
export function createFactionTextures(app: Application): FactionTextures {
  return {
    federation: createCircleTexture(app, FACTION_COLORS.FEDERATION),
    klingon: createTriangleTexture(app, FACTION_COLORS.KLINGON),
    // ... creates 6 textures
  };
}
```

**Impact:**
- Unnecessary GPU memory allocation
- Slower initialization
- Memory leak if not properly destroyed

**Recommendation:**
```typescript
// Singleton texture cache
class TextureCache {
  private static instance: TextureCache;
  private textures: Map<string, Texture> = new Map();
  
  static getInstance(): TextureCache {
    if (!this.instance) {
      this.instance = new TextureCache();
    }
    return this.instance;
  }
  
  getOrCreate(key: string, factory: () => Texture): Texture {
    if (!this.textures.has(key)) {
      this.textures.set(key, factory());
    }
    return this.textures.get(key)!;
  }
  
  clear(): void {
    for (const texture of this.textures.values()) {
      texture.destroy(true);
    }
    this.textures.clear();
  }
}

// Usage
export function createFactionTextures(app: Application): FactionTextures {
  const cache = TextureCache.getInstance();
  
  return {
    federation: cache.getOrCreate('federation', () => 
      createCircleTexture(app, FACTION_COLORS.FEDERATION)
    ),
    // ... other textures
  };
}
```

### 3. ❌ Particle Pool Not Used Effectively

**Problem:**
```typescript
// spriteManager.ts
createSprite(factionId: number, x: number = 0, y: number = 0): number {
  // Pool exists but particles are created on demand
  if (pool && pool.length > 0) {
    particle = pool.pop()!;
  } else {
    // Creates new particle - defeats pooling purpose
    particle = new Particle({ texture, anchorX: 0.5, anchorY: 0.5 });
  }
}
```

**Impact:**
- Pool is empty initially
- GC pressure during first wave of spawns
- Defeats purpose of pooling

**Recommendation:**
```typescript
class SpriteManager {
  init(): void {
    if (this.initialized) return;
    
    this.textures = createFactionTextures(this.app);
    this.createFactionContainers();
    
    // Pre-warm particle pools
    this.prewarmPools();
    
    this.initialized = true;
  }
  
  private prewarmPools(): void {
    const particlesPerFaction = Math.ceil(MAX_PARTICLES / 6);
    
    for (const [factionId, texture] of this.getFactionTextures()) {
      const pool = this.particlePool.get(factionId)!;
      
      for (let i = 0; i < particlesPerFaction; i++) {
        const particle = new Particle({
          texture,
          anchorX: 0.5,
          anchorY: 0.5
        });
        pool.push(particle);
      }
    }
    
    console.log(`Pre-warmed ${MAX_PARTICLES} particles across ${6} factions`);
  }
}
```

---

## Memory Management Issues

### 1. ⚠️ Potential Memory Leaks

**Problem:**
```typescript
// Game.ts
destroy(): void {
  window.removeEventListener('resize', this.handleResize.bind(this));
  // ⚠️ bind() creates new function - won't remove original listener!
}
```

**Recommendation:**
```typescript
class Game {
  private handleResizeBound: () => void;
  
  constructor(containerId: string) {
    // Store bound function reference
    this.handleResizeBound = this.handleResize.bind(this);
  }
  
  async init(): Promise<void> {
    window.addEventListener('resize', this.handleResizeBound);
  }
  
  destroy(): void {
    window.removeEventListener('resize', this.handleResizeBound);
    this.spriteManager.destroy();
    this.app.destroy(true);
  }
}
```

### 2. ⚠️ Starfield Texture Memory

**Problem:**
```typescript
// Starfield.ts
private generateStarTexture(baseScale: number, starCount: number): Texture {
  const graphics = new Graphics();
  // ... draw stars
  return this.app.renderer.generateTexture(graphics);
  // ⚠️ Graphics object not destroyed!
}
```

**Recommendation:**
```typescript
private generateStarTexture(baseScale: number, starCount: number): Texture {
  const graphics = new Graphics();
  const width = 1024;
  const height = 1024;
  
  for (let i = 0; i < starCount; i++) {
    // ... draw stars
  }
  
  const texture = this.app.renderer.generateTexture(graphics);
  graphics.destroy(); // Clean up immediately
  return texture;
}
```

### 3. ⚠️ Entity Pool Memory Growth

**Problem:**
```typescript
// entityPool.ts
acquire(): number {
  if (this.available.length > 0) {
    eid = this.available.pop()!;
  } else {
    // Pool grows indefinitely!
    console.warn('EntityPool: Pool exhausted, creating new entity.');
    eid = addEntity(this.world);
  }
}
```

**Recommendation:**
```typescript
acquire(): number {
  if (this.available.length > 0) {
    return this.available.pop()!;
  }
  
  // Check if we're at max capacity
  if (this.getTotalSize() >= this.maxSize) {
    throw new Error(
      `EntityPool: Maximum capacity (${this.maxSize}) reached. ` +
      `Consider increasing pool size or releasing entities.`
    );
  }
  
  // Auto-expand in chunks
  const expandSize = Math.min(1000, this.maxSize - this.getTotalSize());
  console.warn(`EntityPool: Expanding by ${expandSize} entities`);
  this.expand(expandSize);
  
  return this.available.pop()!;
}
```

---

## Optimization Opportunities

### 1. Batch Entity Creation

**Current:**
```typescript
// Game.ts - Creates entities one at a time
for (let i = 0; i < 100; i++) {
  const eid = enemyCreators[creatorIndex](this.world, x, y);
  Velocity.x[eid] = vx;
  Velocity.y[eid] = vy;
}
```

**Optimized:**
```typescript
// Batch creation reduces function call overhead
interface EntityBatch {
  faction: FactionId;
  positions: Array<{ x: number; y: number }>;
  velocities: Array<{ x: number; y: number }>;
}

function createEntityBatch(world: GameWorld, batch: EntityBatch): number[] {
  const eids: number[] = [];
  
  for (let i = 0; i < batch.positions.length; i++) {
    const eid = addEntity(world);
    
    addComponent(world, Position, eid);
    Position.x[eid] = batch.positions[i].x;
    Position.y[eid] = batch.positions[i].y;
    
    addComponent(world, Velocity, eid);
    Velocity.x[eid] = batch.velocities[i].x;
    Velocity.y[eid] = batch.velocities[i].y;
    
    // ... other components
    eids.push(eid);
  }
  
  return eids;
}
```

### 2. Spatial Partitioning for Collision Detection

**Future-proofing:**
```typescript
// Spatial hash grid for O(1) neighbor queries
class SpatialHashGrid {
  private cellSize: number;
  private grid: Map<string, Set<number>> = new Map();
  
  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }
  
  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  insert(eid: number, x: number, y: number): void {
    const key = this.getKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key)!.add(eid);
  }
  
  query(x: number, y: number, radius: number): number[] {
    const results: number[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerX = Math.floor(x / this.cellSize);
    const centerY = Math.floor(y / this.cellSize);
    
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const key = `${centerX + dx},${centerY + dy}`;
        const cell = this.grid.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }
    
    return results;
  }
  
  clear(): void {
    this.grid.clear();
  }
}
```

### 3. Object Pooling for Temporary Objects

**Problem:** Frequent temporary object creation
```typescript
// Creates new object every frame
const neighbors = this.grid.getNeighbors(cellIndex);
```

**Recommendation:**
```typescript
// Reuse array for neighbor queries
class Grid {
  private neighborsCache: number[] = [];
  
  getNeighbors(cellIndex: number): number[] {
    this.neighborsCache.length = 0; // Clear without allocation
    
    const col = cellIndex % this.cols;
    const row = Math.floor(cellIndex / this.cols);
    
    if (row > 0) this.neighborsCache.push(cellIndex - this.cols);
    if (row < this.rows - 1) this.neighborsCache.push(cellIndex + this.cols);
    if (col < this.cols - 1) this.neighborsCache.push(cellIndex + 1);
    if (col > 0) this.neighborsCache.push(cellIndex - 1);
    
    return this.neighborsCache;
  }
}
```

---

## Performance Monitoring

### Add Performance Metrics

```typescript
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure(name: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const measurements = this.metrics.get(name)!;
    measurements.push(duration);
    
    // Keep last 60 measurements (1 second at 60 FPS)
    if (measurements.length > 60) {
      measurements.shift();
    }
  }
  
  getAverage(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }
  
  report(): void {
    console.group('Performance Report');
    for (const [name, measurements] of this.metrics) {
      const avg = this.getAverage(name);
      const max = Math.max(...measurements);
      console.log(`${name}: avg=${avg.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
    }
    console.groupEnd();
  }
}

// Usage in Game.ts
private update(): void {
  const perfMon = PerformanceMonitor.getInstance();
  
  perfMon.measure('movement', () => {
    this.movementSystem?.(this.world, deltaTime);
  });
  
  perfMon.measure('render', () => {
    this.renderSystem?.(this.world);
  });
}
```

---

## Priority Action Items

1. **CRITICAL:** Implement binary heap for Dijkstra's algorithm
2. **HIGH:** Pre-warm particle pools on initialization
3. **HIGH:** Fix event listener memory leak
4. **HIGH:** Implement texture caching
5. **MEDIUM:** Add spatial hash grid for future collision detection
6. **MEDIUM:** Implement performance monitoring
7. **MEDIUM:** Add entity pool max capacity
8. **LOW:** Optimize temporary object allocations

---

## Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Frame Rate | 60 FPS | ~60 FPS | ✅ |
| Entity Count | 5,000+ | 100 (test) | ⚠️ Needs testing |
| Memory Usage | <200 MB | Unknown | ⚠️ Needs profiling |
| Init Time | <2s | ~1s | ✅ |
| Pathfinding | <5ms | Unknown | ⚠️ Needs optimization |

---

## Profiling Recommendations

1. **Chrome DevTools Performance Tab:**
   - Record 10 seconds of gameplay
   - Identify frame drops
   - Check for long tasks (>50ms)

2. **Memory Profiler:**
   - Take heap snapshots before/after spawning
   - Check for detached DOM nodes
   - Monitor retained size

3. **PixiJS Inspector:**
   - Check draw call count
   - Monitor texture memory
   - Verify batch rendering

4. **Custom Metrics:**
   - Log system execution times
   - Track entity count over time
   - Monitor pool utilization
