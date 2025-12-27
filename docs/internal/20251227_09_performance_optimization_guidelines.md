# Performance Optimization Guidelines for AI Agents

**Date:** 2025-12-27  
**Category:** Performance  
**Priority:** MEDIUM  
**Effort:** Medium-High  

---

## Executive Summary

Performance is critical for a game targeting 60 FPS with 5,000+ entities. This document outlines optimization patterns and guidelines for AI coding agents to maintain performance when modifying code.

---

## Current State Assessment

### ✅ Good Performance Practices

1. **Spatial Hashing** - 64px cells for O(1) collision lookup
2. **Entity Pooling** - PoolManager reduces GC pressure
3. **bitECS** - High-performance ECS with typed arrays
4. **Particle Container** - Batch rendering for particles
5. **WebGPU Preferred** - Modern GPU acceleration

### ⚠️ Areas for Improvement

1. **Query Caching** - Some queries recreated per frame
2. **Object Allocation** - Some hot paths allocate objects
3. **Rendering** - No culling or LOD systems
4. **Profiling** - Limited performance monitoring

---

## Recommendations for AI Coding Agents

### 1. Avoid Object Allocation in Hot Paths

**Recommendation:** Never create objects in frame-by-frame code.

**BAD:**
```typescript
function update(delta: number): void {
    // Creates new object every frame - BAD
    const position = { x: entity.x, y: entity.y };
    
    // Creates new array every frame - BAD
    const neighbors = [];
    
    // Creates new function every frame - BAD
    entities.forEach((e) => { });
}
```

**GOOD:**
```typescript
// Reusable objects at module scope
const tempPosition = { x: 0, y: 0 };
const tempNeighbors: number[] = [];

function update(delta: number): void {
    // Reuse existing object
    tempPosition.x = entity.x;
    tempPosition.y = entity.y;
    
    // Clear and reuse array
    tempNeighbors.length = 0;
    
    // Use for loop instead of forEach
    for (let i = 0; i < entities.length; i++) {
        // Process entity
    }
}
```

**Why Agent-Friendly:**
- Clear pattern to follow
- Avoids GC spikes
- Consistent across codebase

**Action Items:**
- [ ] Audit hot paths for allocations
- [ ] Create reusable temp objects
- [ ] Replace forEach with for loops

---

### 2. Cache ECS Queries

**Recommendation:** Define queries once at module scope.

**BAD:**
```typescript
function combatSystem(world: World): World {
    // Query recreated every frame - BAD
    const turrets = query(world, [Position, Turret, Target]);
    
    for (const eid of turrets) {
        // Process turret
    }
    
    return world;
}
```

**GOOD:**
```typescript
// Define query once at module scope
import { defineQuery } from 'bitecs';

const turretQuery = defineQuery([Position, Turret, Target]);

function combatSystem(world: World): World {
    // Query is cached, only entity list updates
    const turrets = turretQuery(world);
    
    for (let i = 0; i < turrets.length; i++) {
        const eid = turrets[i];
        // Process turret
    }
    
    return world;
}
```

**Why Agent-Friendly:**
- Pattern is consistent
- Performance is predictable
- bitECS optimizes cached queries

**Action Items:**
- [ ] Migrate all queries to defineQuery
- [ ] Place queries at module scope
- [ ] Document query pattern in AGENTS.md

---

### 3. Use Typed Arrays for Performance-Critical Data

**Recommendation:** Prefer typed arrays over regular arrays for numeric data.

**Pattern:**
```typescript
// For large numeric arrays
const damageBuffer = new Float32Array(5000);  // One per entity
const velocityX = new Float32Array(5000);
const velocityY = new Float32Array(5000);

// Access is very fast
velocityX[entityId] += acceleration * delta;
velocityY[entityId] += gravity * delta;

// Note: bitECS components already use typed arrays internally
// This is for custom data structures
```

**Why Agent-Friendly:**
- Consistent with ECS component pattern
- Faster iteration than object arrays
- Better memory layout

**Action Items:**
- [ ] Use typed arrays for custom data
- [ ] Document when to use typed vs regular arrays
- [ ] Profile memory allocation

---

### 4. Batch Rendering Operations

**Recommendation:** Minimize draw calls by batching.

**Pattern:**
```typescript
// BAD: Individual sprite updates
for (const entity of entities) {
    const sprite = new Sprite(texture);  // Creates sprite each time
    container.addChild(sprite);          // Add call each time
    sprite.x = Position.x[entity];
}

// GOOD: Use sprite pools and ParticleContainer
class SpritePool {
    private sprites: Sprite[] = [];
    private container: ParticleContainer;
    
    constructor(maxSize: number, texture: Texture) {
        // Pre-create all sprites
        this.container = new ParticleContainer(maxSize);
        for (let i = 0; i < maxSize; i++) {
            const sprite = new Sprite(texture);
            sprite.visible = false;
            this.sprites.push(sprite);
            this.container.addChild(sprite);
        }
    }
    
    acquire(): Sprite {
        // Find inactive sprite
        const sprite = this.sprites.find(s => !s.visible);
        if (sprite) sprite.visible = true;
        return sprite!;
    }
    
    release(sprite: Sprite): void {
        sprite.visible = false;
    }
}
```

**Why Agent-Friendly:**
- Clear pattern for sprite management
- ParticleContainer batches automatically
- Pool prevents allocation

**Action Items:**
- [ ] Use ParticleContainer for particles
- [ ] Implement sprite pooling
- [ ] Minimize addChild/removeChild calls

---

### 5. Spatial Partitioning for Collision

**Recommendation:** Always use spatial hashing for broad-phase collision.

**Current Implementation:**
```typescript
// src/collision/spatialHash.ts
const CELL_SIZE = 64; // Good default

class SpatialHash {
    private cells: Map<string, Set<number>> = new Map();
    
    // O(1) insert
    insert(entity: number, x: number, y: number, radius: number): void {
        const cells = this.getCellsForCircle(x, y, radius);
        for (const key of cells) {
            this.getOrCreateCell(key).add(entity);
        }
    }
    
    // O(1) query for nearby entities
    getNearby(x: number, y: number, radius: number): number[] {
        const cells = this.getCellsForCircle(x, y, radius);
        const entities = new Set<number>();
        for (const key of cells) {
            const cell = this.cells.get(key);
            if (cell) {
                for (const entity of cell) {
                    entities.add(entity);
                }
            }
        }
        return Array.from(entities);
    }
}
```

**Why Agent-Friendly:**
- Well-documented pattern
- O(1) average case
- Already implemented

**Action Items:**
- [ ] Use spatial hash for all proximity queries
- [ ] Tune CELL_SIZE for entity density
- [ ] Document when to use spatial hash

---

### 6. Frame Budget Management

**Recommendation:** Monitor and respect frame budget.

**Pattern:**
```typescript
// src/core/PerformanceMonitor.ts
const FRAME_BUDGET_MS = 16.67; // 60 FPS target
const WARNING_THRESHOLD_MS = 14.0; // 85% of budget

class PerformanceMonitor {
    private frameStart: number = 0;
    private frameTimes: number[] = [];
    private systemTimes: Map<string, number> = new Map();
    
    startFrame(): void {
        this.frameStart = performance.now();
        this.systemTimes.clear();
    }
    
    measureSystem(name: string, fn: () => void): void {
        const start = performance.now();
        fn();
        const elapsed = performance.now() - start;
        this.systemTimes.set(name, elapsed);
    }
    
    endFrame(): void {
        const totalTime = performance.now() - this.frameStart;
        this.frameTimes.push(totalTime);
        
        if (totalTime > WARNING_THRESHOLD_MS) {
            console.warn(`Frame exceeded budget: ${totalTime.toFixed(2)}ms`);
            this.logSlowSystems();
        }
    }
    
    private logSlowSystems(): void {
        const sorted = Array.from(this.systemTimes.entries())
            .sort((a, b) => b[1] - a[1]);
        
        console.log('System timings:');
        for (const [name, time] of sorted.slice(0, 5)) {
            console.log(`  ${name}: ${time.toFixed(2)}ms`);
        }
    }
}
```

**Why Agent-Friendly:**
- Clear budget target
- System-level profiling
- Identifies slow systems

**Action Items:**
- [ ] Add per-system timing
- [ ] Log slow frames in development
- [ ] Create performance dashboard

---

### 7. Lazy Initialization

**Recommendation:** Defer expensive initialization until needed.

**Pattern:**
```typescript
// ServiceContainer already uses lazy initialization
class ServiceContainer {
    private services = new Map<string, { factory: () => unknown; instance: unknown }>();
    
    get<T>(name: string): T {
        const entry = this.services.get(name);
        if (!entry.instance) {
            // Only create when first accessed
            entry.instance = entry.factory();
        }
        return entry.instance as T;
    }
}

// Apply to other expensive resources
class TextureManager {
    private textureCache = new Map<string, Texture>();
    
    getTexture(key: string): Texture {
        if (!this.textureCache.has(key)) {
            // Generate only when needed
            this.textureCache.set(key, this.generateTexture(key));
        }
        return this.textureCache.get(key)!;
    }
}
```

**Why Agent-Friendly:**
- Startup is fast
- Memory used only when needed
- Pattern is consistent

**Action Items:**
- [ ] Apply lazy init to textures
- [ ] Apply to audio buffers
- [ ] Document lazy init pattern

---

### 8. Quality Scaling

**Recommendation:** Implement quality levels for variable hardware.

**Current Implementation:**
```typescript
// src/core/QualityManager.ts
enum QualityLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

const QUALITY_PRESETS = {
    [QualityLevel.LOW]: {
        maxParticles: 200,
        maxEntities: 1000,
        shadowQuality: false,
        bloomEnabled: false,
    },
    [QualityLevel.MEDIUM]: {
        maxParticles: 500,
        maxEntities: 3000,
        shadowQuality: true,
        bloomEnabled: false,
    },
    [QualityLevel.HIGH]: {
        maxParticles: 1000,
        maxEntities: 5000,
        shadowQuality: true,
        bloomEnabled: true,
    },
};
```

**Why Agent-Friendly:**
- Clear quality tiers
- Easy to add new settings
- Automatic based on hardware

**Action Items:**
- [ ] Add more quality settings
- [ ] Auto-detect quality level
- [ ] Document quality impact

---

### 9. Memory Management

**Recommendation:** Monitor and limit memory usage.

**Pattern:**
```typescript
// Entity pool with size limits
class EntityPool {
    private maxSize: number = 5000;
    private available: number[] = [];
    
    acquire(): number | null {
        if (this.available.length > 0) {
            return this.available.pop()!;
        }
        if (this.getTotalCount() >= this.maxSize) {
            console.warn('Entity pool exhausted');
            return null;
        }
        return this.createEntity();
    }
    
    release(entity: number): void {
        // Reset entity state
        this.resetEntity(entity);
        this.available.push(entity);
    }
}

// Periodic cleanup
class MemoryManager {
    cleanupInterval = 30000; // 30 seconds
    
    startCleanupTimer(): void {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }
    
    cleanup(): void {
        // Clear unused caches
        this.textureCache.trimToSize(100);
        this.audioCache.trimToSize(50);
        
        // Reset damage history
        this.damageHistory.length = 0;
    }
}
```

**Why Agent-Friendly:**
- Explicit memory limits
- Automatic cleanup
- Pool prevents exhaustion

**Action Items:**
- [ ] Add memory limits to pools
- [ ] Implement cache trimming
- [ ] Add memory monitoring

---

## Performance Checklist for New Code

When adding or modifying code, verify:

- [ ] No object allocation in hot paths (loops, updates)
- [ ] ECS queries defined at module scope
- [ ] For loops used instead of forEach
- [ ] Spatial hash used for proximity queries
- [ ] Sprites pooled, not created/destroyed
- [ ] Performance tested with 1000+ entities

---

## Implementation Checklist

### Phase 1: Query Optimization (2 hours)
- [ ] Migrate queries to defineQuery
- [ ] Place at module scope
- [ ] Document pattern

### Phase 2: Allocation Reduction (3-4 hours)
- [ ] Audit hot paths
- [ ] Create temp objects
- [ ] Replace forEach

### Phase 3: Profiling (2-3 hours)
- [ ] Add per-system timing
- [ ] Create performance dashboard
- [ ] Add slow frame logging

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| FPS with 5000 entities | 60 | 60 stable |
| Frame time variance | Unknown | <2ms |
| GC pauses | Unknown | <5ms |
| Memory growth | Unknown | Stable |

---

## References

- `src/collision/spatialHash.ts` - Spatial partitioning
- `src/ecs/PoolManager.ts` - Entity pooling
- `src/core/PerformanceMonitor.ts` - Performance tracking
- `src/core/QualityManager.ts` - Quality levels

---

*This document is part of the Kobayashi Maru maintainability initiative.*
