# Task 09: Performance Monitoring and Optimization

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** HIGH  
**Estimated Effort:** 1-2 days

## Objective
Implement comprehensive performance monitoring and apply optimizations to achieve the target of 5,000+ entities at 60 FPS.

## Context
Current state:
- Debug overlay shows FPS and entity count
- Target: 5,000+ entities at 60 FPS
- Code audit identified bottlenecks:
  - Pathfinding algorithm (uses array.sort instead of binary heap)
  - Texture generation (not cached)
  - Entity creation overhead
- Entity pooling exists but may not be utilized everywhere
- Spatial hash grid for collision is O(N) as intended

## Requirements

### 1. Create Performance Monitor (`src/core/PerformanceMonitor.ts`)
Detailed performance tracking:
```typescript
interface PerformanceMetrics {
  fps: number;
  frameTime: number;       // Total frame time in ms
  renderTime: number;      // Time spent rendering
  systemTimes: Map<string, number>; // Time per system
  entityCount: number;
  drawCalls: number;
  memoryUsed: number;      // If available via performance API
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private systemTimings: Map<string, number[]>;
  
  startMeasure(systemName: string): void;
  endMeasure(systemName: string): void;
  getMetrics(): PerformanceMetrics;
  getAverages(): PerformanceMetrics; // Rolling average
  logReport(): void;  // Console log detailed report
}
```

### 2. System Timing Integration
Wrap each system call in `Game.ts`:
```typescript
this.performanceMonitor.startMeasure('movement');
this.movementSystem(this.world, deltaTime);
this.performanceMonitor.endMeasure('movement');

this.performanceMonitor.startMeasure('collision');
this.collisionSystem.update(this.world);
this.performanceMonitor.endMeasure('collision');
// ... etc
```

### 3. Optimize Pathfinding (`src/pathfinding/integrationField.ts`)
Replace array sort with binary heap for A* operations:
```typescript
// Current (slow): 
openList.sort((a, b) => a.f - b.f);
const current = openList.shift();

// Optimized (fast):
const heap = new BinaryHeap<Node>((a, b) => a.f - b.f);
heap.push(node);
const current = heap.pop();
```

Create `src/utils/BinaryHeap.ts`:
```typescript
export class BinaryHeap<T> {
  private data: T[];
  private compare: (a: T, b: T) => number;
  
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size(): number;
  clear(): void;
}
```

### 4. Texture Caching (`src/rendering/TextureCache.ts`)
Singleton cache for faction textures:
```typescript
class TextureCache {
  private static instance: TextureCache;
  private textures: Map<string, Texture>;
  
  static getInstance(): TextureCache;
  get(key: string): Texture | undefined;
  set(key: string, texture: Texture): void;
  has(key: string): boolean;
  clear(): void;
}
```

Update `textures.ts` to use cache:
```typescript
export function createFactionTextures(app: Application): FactionTextures {
  const cache = TextureCache.getInstance();
  
  if (cache.has('faction_federation')) {
    return {
      federation: cache.get('faction_federation')!,
      // ... etc
    };
  }
  
  // Create and cache textures
  const federation = createFederationTexture(app);
  cache.set('faction_federation', federation);
  // ... etc
}
```

### 5. Entity Pool Utilization
Ensure entity pool is used everywhere:
- Wave spawner should use pool
- Projectile system should use pool
- Verify pool sizes are adequate

Update `entityPool.ts` if needed:
```typescript
export class EntityPool {
  private static pools: Map<string, number[]> = new Map();
  
  static acquire(type: string): number;
  static release(type: string, eid: number): void;
  static prewarm(type: string, count: number): void;
  static getPoolSize(type: string): number;
}
```

### 6. Batch Entity Operations
When spawning many entities:
```typescript
function batchSpawnEnemies(world: GameWorld, configs: SpawnConfig[]): number[] {
  const eids: number[] = [];
  
  // Pre-allocate
  for (const config of configs) {
    eids.push(EntityPool.acquire('enemy'));
  }
  
  // Batch component assignment
  for (let i = 0; i < configs.length; i++) {
    const eid = eids[i];
    const config = configs[i];
    Position.x[eid] = config.x;
    Position.y[eid] = config.y;
    // ... etc
  }
  
  return eids;
}
```

### 7. Debug Performance View
Enhance debug overlay with performance data:
- Show per-system timing breakdown
- Show memory usage trend
- Show entity count by type
- Highlight systems over budget (>2ms)

### 8. Performance Budgets
Define frame budget:
```typescript
const FRAME_BUDGET = {
  TOTAL: 16.67,           // 60 FPS
  MOVEMENT: 2.0,
  COLLISION: 2.0,
  AI: 2.0,
  COMBAT: 2.0,
  RENDERING: 5.0,
  OTHER: 3.67
};
```

Log warnings when budgets exceeded.

## Acceptance Criteria
- [ ] Performance monitor tracks all system timings
- [ ] Debug overlay shows performance breakdown
- [ ] Pathfinding uses binary heap (100x faster)
- [ ] Textures are cached (no duplicate generation)
- [ ] Entity pool is utilized for all spawning
- [ ] Game runs at 60 FPS with 1,000 entities
- [ ] Game runs at 30+ FPS with 5,000 entities
- [ ] Performance budgets are defined and monitored
- [ ] Console logs when budget exceeded
- [ ] Unit tests cover BinaryHeap
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/core/PerformanceMonitor.ts`
- `src/utils/BinaryHeap.ts`
- `src/rendering/TextureCache.ts`
- `src/__tests__/BinaryHeap.test.ts`
- `src/__tests__/PerformanceMonitor.test.ts`

## Files to Modify
- `src/pathfinding/integrationField.ts` - Use binary heap
- `src/rendering/textures.ts` - Use texture cache
- `src/ecs/entityPool.ts` - Enhance if needed
- `src/game/waveManager.ts` - Use entity pool
- `src/core/Game.ts` - Integrate performance monitoring
- `src/core/DebugManager.ts` - Show performance data

## Testing Requirements
- Unit tests for BinaryHeap operations (push, pop, peek)
- Unit tests for BinaryHeap ordering
- Unit tests for PerformanceMonitor timing
- Performance benchmark: spawn 5,000 entities
- Performance benchmark: update 5,000 entities
- Compare before/after pathfinding optimization

## Technical Notes
- Use `performance.now()` for high-resolution timing
- Consider using Web Workers for heavy calculations (future)
- Memory API may not be available in all browsers
- Keep monitoring overhead minimal (<0.5ms)
- Use requestAnimationFrame timestamp for frame timing

## Binary Heap Implementation
```typescript
export class BinaryHeap<T> {
  private data: T[] = [];
  
  constructor(private compare: (a: T, b: T) => number) {}

  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const result = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.data[index], this.data[parent]) >= 0) break;
      [this.data[index], this.data[parent]] = [this.data[parent], this.data[index]];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      
      if (left < this.data.length && 
          this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < this.data.length && 
          this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      
      if (smallest === index) break;
      [this.data[index], this.data[smallest]] = [this.data[smallest], this.data[index]];
      index = smallest;
    }
  }

  size(): number { return this.data.length; }
  peek(): T | undefined { return this.data[0]; }
  clear(): void { this.data.length = 0; }
}
```
