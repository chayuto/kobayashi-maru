# Code Audit: Error Handling & Resilience

**Date:** 2025-11-30  
**Scope:** Error handling, graceful degradation, and system resilience

## Executive Summary

Error handling is minimal throughout the codebase. Most functions assume happy path execution with no fallback strategies. This creates fragility and poor user experience when things go wrong.

**Overall Grade:** D (Insufficient error handling)

---

## Current State

### Existing Error Handling ✅

1. **Main Entry Point** (`main.ts`)
```typescript
try {
  game = new Game('app');
  await game.init();
  game.start();
} catch (error) {
  console.error('Failed to initialize Kobayashi Maru:', error);
  // Shows error message to user
}
```
- Good: Catches initialization errors
- Good: Displays user-friendly error message

2. **Storage Service** (`StorageService.ts`)
```typescript
try {
  const serializedData = JSON.stringify(data);
  this.storage.setItem(key, serializedData);
} catch (error) {
  console.error(`Failed to save data for key ${key}:`, error);
}
```
- Good: Catches storage errors
- Good: Falls back to in-memory storage

### Missing Error Handling ❌

1. **Game Initialization** - No WebGPU fallback
2. **Sprite Manager** - No texture creation error handling
3. **Entity Factory** - No validation of inputs
4. **Movement System** - No NaN/Infinity checks
5. **Pathfinding** - No timeout for long calculations
6. **Resource Loading** - No retry logic

---

## Critical Issues

### 1. ❌ No Renderer Fallback

**Problem:**
```typescript
// Game.ts
await this.app.init({
  preference: 'webgpu',
  antialias: true
});
// If WebGPU fails, game crashes!
```

**Impact:**
- Game won't work on older browsers
- No fallback to WebGL
- Poor user experience

**Recommendation:**
```typescript
async init(): Promise<void> {
  if (this.initialized) return;

  const rendererPreferences = ['webgpu', 'webgl'] as const;
  let lastError: Error | null = null;

  for (const preference of rendererPreferences) {
    try {
      console.log(`Attempting to initialize with ${preference}...`);
      
      await this.app.init({
        width: GAME_CONFIG.WORLD_WIDTH,
        height: GAME_CONFIG.WORLD_HEIGHT,
        backgroundColor: LCARS_COLORS.BACKGROUND,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference,
        antialias: true
      });

      console.log(`Successfully initialized with ${preference}`);
      this.initialized = true;
      return;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Failed to initialize with ${preference}:`, lastError.message);
    }
  }

  // All renderers failed
  throw new Error(
    `Failed to initialize any renderer. Last error: ${lastError?.message}. ` +
    `Your browser may not support WebGPU or WebGL.`
  );
}
```

### 2. ❌ No Input Validation

**Problem:**
```typescript
// entityFactory.ts
export function createKlingonShip(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);
  Position.x[eid] = x; // What if x is NaN?
  Position.y[eid] = y; // What if y is Infinity?
}
```

**Impact:**
- NaN propagates through calculations
- Entities can disappear off-screen
- Difficult to debug

**Recommendation:**
```typescript
function validatePosition(x: number, y: number, context: string): { x: number; y: number } {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.error(
      `Invalid position in ${context}: (${x}, ${y}). ` +
      `Using default position (0, 0).`
    );
    return { x: 0, y: 0 };
  }

  // Clamp to world bounds
  const clampedX = Math.max(0, Math.min(x, GAME_CONFIG.WORLD_WIDTH));
  const clampedY = Math.max(0, Math.min(y, GAME_CONFIG.WORLD_HEIGHT));

  if (clampedX !== x || clampedY !== y) {
    console.warn(
      `Position clamped in ${context}: ` +
      `(${x}, ${y}) -> (${clampedX}, ${clampedY})`
    );
  }

  return { x: clampedX, y: clampedY };
}

export function createKlingonShip(
  world: GameWorld,
  x: number,
  y: number
): number {
  const position = validatePosition(x, y, 'createKlingonShip');
  
  const eid = addEntity(world);
  
  addComponent(world, Position, eid);
  Position.x[eid] = position.x;
  Position.y[eid] = position.y;
  
  // ... rest of creation
  
  return eid;
}
```

### 3. ❌ No Texture Creation Error Handling

**Problem:**
```typescript
// textures.ts
function createCircleTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  graphics.circle(SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE / 2 - 1);
  graphics.fill({ color });
  
  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();
  
  return texture;
  // What if texture creation fails?
}
```

**Recommendation:**
```typescript
function createCircleTexture(
  app: Application,
  color: number
): RenderTexture {
  let graphics: Graphics | null = null;
  let texture: RenderTexture | null = null;

  try {
    graphics = new Graphics();
    graphics.circle(SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE / 2 - 1);
    graphics.fill({ color });
    
    texture = RenderTexture.create({ 
      width: SHAPE_SIZE, 
      height: SHAPE_SIZE 
    });
    
    if (!texture) {
      throw new Error('Failed to create RenderTexture');
    }
    
    app.renderer.render({ container: graphics, target: texture });
    
    return texture;
    
  } catch (error) {
    // Clean up on error
    texture?.destroy(true);
    
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create circle texture: ${message}`);
    
  } finally {
    // Always clean up graphics
    graphics?.destroy();
  }
}

// Wrapper with fallback
export function createFactionTextures(app: Application): FactionTextures {
  try {
    return {
      federation: createCircleTexture(app, FACTION_COLORS.FEDERATION),
      klingon: createTriangleTexture(app, FACTION_COLORS.KLINGON),
      romulan: createCrescentTexture(app, FACTION_COLORS.ROMULAN),
      borg: createSquareTexture(app, FACTION_COLORS.BORG),
      tholian: createDiamondTexture(app, FACTION_COLORS.THOLIAN),
      species8472: createYShapeTexture(app, FACTION_COLORS.SPECIES_8472)
    };
  } catch (error) {
    console.error('Failed to create faction textures:', error);
    
    // Fallback: create simple colored squares
    return createFallbackTextures(app);
  }
}

function createFallbackTextures(app: Application): FactionTextures {
  const fallback = createSimpleSquareTexture(app, 0xFFFFFF);
  
  return {
    federation: fallback,
    klingon: fallback,
    romulan: fallback,
    borg: fallback,
    tholian: fallback,
    species8472: fallback
  };
}
```

### 4. ❌ No Pathfinding Timeout

**Problem:**
```typescript
// integrationField.ts
public calculate(goalX: number, goalY: number, costField: CostField): void {
  // Could run indefinitely on large/complex grids
  while (openList.length > 0) {
    // ... Dijkstra's algorithm
  }
}
```

**Impact:**
- Can freeze game on complex pathfinding
- No way to cancel long-running calculations
- Poor user experience

**Recommendation:**
```typescript
public calculate(
  goalX: number,
  goalY: number,
  costField: CostField,
  maxIterations: number = 10000
): boolean {
  this.reset();
  
  const goalIndex = this.grid.getCellIndex(goalX, goalY);
  const openList: number[] = [goalIndex];
  this.values[goalIndex] = 0;
  
  let iterations = 0;
  
  while (openList.length > 0) {
    if (++iterations > maxIterations) {
      console.error(
        `Pathfinding exceeded maximum iterations (${maxIterations}). ` +
        `Grid may be too large or have unreachable areas.`
      );
      return false; // Indicate failure
    }
    
    openList.sort((a, b) => this.values[a] - this.values[b]);
    const currentIndex = openList.shift()!;
    const currentCost = this.values[currentIndex];
    
    const neighbors = this.grid.getNeighbors(currentIndex);
    
    for (const neighborIndex of neighbors) {
      const traversalCost = costField.getCost(neighborIndex);
      
      if (traversalCost === 255) continue;
      
      const newCost = currentCost + traversalCost;
      
      if (newCost < this.values[neighborIndex]) {
        if (this.values[neighborIndex] === IntegrationField.MAX_COST) {
          openList.push(neighborIndex);
        }
        this.values[neighborIndex] = newCost;
      }
    }
  }
  
  return true; // Success
}
```

### 5. ❌ No Movement System Safety Checks

**Problem:**
```typescript
// movementSystem.ts
Position.x[eid] += Velocity.x[eid] * delta;
Position.y[eid] += Velocity.y[eid] * delta;
// What if velocity is NaN or Infinity?
```

**Recommendation:**
```typescript
export function createMovementSystem() {
  return defineSystem((world: IWorld, delta: number) => {
    // Validate delta time
    if (!Number.isFinite(delta) || delta < 0 || delta > 1) {
      console.warn(`Invalid delta time: ${delta}. Skipping movement update.`);
      return world;
    }
    
    const entities = movementQuery(world);
    const worldWidth = GAME_CONFIG.WORLD_WIDTH;
    const worldHeight = GAME_CONFIG.WORLD_HEIGHT;
    
    for (const eid of entities) {
      // Validate velocity
      const vx = Velocity.x[eid];
      const vy = Velocity.y[eid];
      
      if (!Number.isFinite(vx) || !Number.isFinite(vy)) {
        console.error(
          `Entity ${eid} has invalid velocity: (${vx}, ${vy}). ` +
          `Resetting to zero.`
        );
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        continue;
      }
      
      // Apply velocity to position
      Position.x[eid] += vx * delta;
      Position.y[eid] += vy * delta;
      
      // Validate position after update
      let x = Position.x[eid];
      let y = Position.y[eid];
      
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.error(
          `Entity ${eid} has invalid position after movement: (${x}, ${y}). ` +
          `Resetting to center.`
        );
        Position.x[eid] = worldWidth / 2;
        Position.y[eid] = worldHeight / 2;
        continue;
      }
      
      // Boundary wrapping
      Position.x[eid] = ((x % worldWidth) + worldWidth) % worldWidth;
      Position.y[eid] = ((y % worldHeight) + worldHeight) % worldHeight;
    }
    
    return world;
  });
}
```

---

## Resilience Patterns

### 1. Circuit Breaker Pattern

**For expensive operations that might fail:**
```typescript
class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.error(
        `Circuit breaker opened after ${this.failureCount} failures`
      );
    }
  }
}

// Usage
const pathfindingBreaker = new CircuitBreaker(3, 30000);

async function calculatePath(goal: { x: number; y: number }): Promise<void> {
  try {
    await pathfindingBreaker.execute(async () => {
      integrationField.calculate(goal.x, goal.y, costField);
    });
  } catch (error) {
    console.warn('Pathfinding unavailable, using direct movement');
    // Fallback to simple movement
  }
}
```

### 2. Retry with Exponential Backoff

**For transient failures:**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Attempt ${attempt + 1} failed: ${lastError.message}. ` +
          `Retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(
    `Failed after ${maxRetries} attempts. Last error: ${lastError!.message}`
  );
}

// Usage
async function loadTextures(): Promise<FactionTextures> {
  return retryWithBackoff(
    () => createFactionTextures(app),
    3,
    500
  );
}
```

### 3. Graceful Degradation

**Fallback to simpler implementations:**
```typescript
class RenderingManager {
  private useParticleContainer: boolean = true;
  private useFallbackRenderer: boolean = false;
  
  async init(): Promise<void> {
    try {
      // Try high-performance rendering
      await this.initParticleContainer();
    } catch (error) {
      console.warn('ParticleContainer failed, using fallback renderer');
      this.useParticleContainer = false;
      this.useFallbackRenderer = true;
      await this.initFallbackRenderer();
    }
  }
  
  render(entities: number[]): void {
    if (this.useParticleContainer) {
      this.renderWithParticles(entities);
    } else if (this.useFallbackRenderer) {
      this.renderWithSprites(entities);
    } else {
      // Ultimate fallback: canvas 2D
      this.renderWithCanvas2D(entities);
    }
  }
}
```

---

## Error Reporting

### Centralized Error Handler

```typescript
class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: Array<{ timestamp: number; error: Error; context: string }> = [];
  
  static getInstance(): ErrorReporter {
    if (!this.instance) {
      this.instance = new ErrorReporter();
    }
    return this.instance;
  }
  
  report(error: Error, context: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    this.errors.push({
      timestamp: Date.now(),
      error,
      context
    });
    
    // Keep last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }
    
    // Log based on severity
    switch (severity) {
      case 'low':
        console.warn(`[${context}]`, error.message);
        break;
      case 'medium':
        console.error(`[${context}]`, error);
        break;
      case 'high':
        console.error(`[CRITICAL] [${context}]`, error);
        this.showUserNotification(error, context);
        break;
    }
    
    // Send to analytics/monitoring service
    this.sendToMonitoring(error, context, severity);
  }
  
  private showUserNotification(error: Error, context: string): void {
    // Show in-game notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = `Error in ${context}: ${error.message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
  }
  
  private sendToMonitoring(error: Error, context: string, severity: string): void {
    // Send to external monitoring service (e.g., Sentry)
    // This is a placeholder
    console.log('Would send to monitoring:', { error, context, severity });
  }
  
  getRecentErrors(count: number = 10): Array<{ timestamp: number; error: Error; context: string }> {
    return this.errors.slice(-count);
  }
}

// Usage throughout codebase
try {
  // Some operation
} catch (error) {
  ErrorReporter.getInstance().report(
    error instanceof Error ? error : new Error(String(error)),
    'Game.init',
    'high'
  );
}
```

---

## Priority Action Items

1. **CRITICAL:** Add renderer fallback (WebGPU -> WebGL)
2. **CRITICAL:** Add input validation to entity factory
3. **CRITICAL:** Add NaN/Infinity checks in movement system
4. **HIGH:** Add texture creation error handling
5. **HIGH:** Add pathfinding timeout
6. **HIGH:** Implement centralized error reporter
7. **MEDIUM:** Add circuit breaker for expensive operations
8. **MEDIUM:** Implement graceful degradation
9. **LOW:** Add retry logic for transient failures

---

## Error Handling Checklist

Before merging code, ensure:

- [ ] All async operations have try/catch
- [ ] Input parameters are validated
- [ ] NaN/Infinity is checked for numeric operations
- [ ] Fallback strategies exist for critical features
- [ ] Errors are logged with context
- [ ] User-facing errors have friendly messages
- [ ] Resources are cleaned up in finally blocks
- [ ] Timeouts exist for long-running operations
- [ ] Circuit breakers protect expensive operations
- [ ] Error boundaries prevent cascading failures
