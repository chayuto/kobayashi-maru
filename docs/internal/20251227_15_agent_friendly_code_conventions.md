# Agent-Friendly Code Conventions for AI Coding Agents

**Date:** 2025-12-27  
**Category:** Conventions  
**Priority:** HIGH  
**Effort:** Ongoing  

---

## Executive Summary

This document outlines code conventions specifically designed to make the codebase more friendly to AI coding agents. These conventions help agents understand, navigate, and modify code with higher accuracy and confidence.

---

## Core Principles

### 1. Explicit Over Implicit

AI agents work best with explicit, obvious patterns rather than clever or implicit ones.

```typescript
// GOOD: Explicit type annotation
const turretId: number = createTurret(world, x, y, TurretType.PHASER_ARRAY);

// BAD: Implicit type (agent may not know return type)
const turretId = createTurret(world, x, y, TurretType.PHASER_ARRAY);

// GOOD: Explicit conditional
if (health <= 0) {
    destroyEntity(world, entityId);
}

// BAD: Implicit truthy check (might miss 0 values)
if (!health) {
    destroyEntity(world, entityId);
}
```

### 2. Consistent Patterns

Use the same pattern for similar operations across the codebase.

```typescript
// All factory functions follow same pattern
function createEnemy(world: GameWorld, factionId: number, x: number, y: number): number;
function createTurret(world: GameWorld, x: number, y: number, turretType: number): number;
function createProjectile(world: GameWorld, x: number, y: number, ...): number;

// All systems follow same pattern
function createCombatSystem(deps: Dependencies): SystemFunction;
function createMovementSystem(deps: Dependencies): SystemFunction;
function createTargetingSystem(deps: Dependencies): SystemFunction;
```

### 3. Self-Documenting Code

Names and structure should explain purpose without needing comments.

```typescript
// GOOD: Self-documenting
function applyDamageToShieldsFirst(
    entity: number,
    damage: number,
    shieldMultiplier: number
): { shieldDamage: number; healthDamage: number } {
    // ...
}

// BAD: Requires reading to understand
function hit(e: number, d: number, m: number): { s: number; h: number } {
    // ...
}
```

---

## Naming Conventions

### 1. Files

```
// Classes and Components
PascalCase.ts           → Game.ts, WaveManager.ts, ResourcePanel.ts

// Functions and Modules  
camelCase.ts            → entityFactory.ts, combatSystem.ts

// Configurations
name.config.ts          → combat.config.ts, ui.config.ts

// Types
name.types.ts           → events.types.ts (or in types/ directory)

// Tests
OriginalName.test.ts    → WaveManager.test.ts
```

### 2. Variables and Functions

```typescript
// Boolean variables: use is/has/can/should prefixes
const isGameOver: boolean;
const hasTarget: boolean;
const canAfford: boolean;
const shouldSpawn: boolean;

// Functions: use verb phrases
function startWave(waveNumber: number): void;
function calculateDamage(base: number, multiplier: number): number;
function getActiveEnemies(): number[];
function isWithinRange(turretId: number, enemyId: number): boolean;

// Event handlers: use handle prefix
function handleEnemyKilled(payload: EnemyKilledPayload): void;
function handleWaveComplete(payload: WaveCompletedPayload): void;

// Factory functions: use create prefix
function createEnemy(world: GameWorld, ...): number;
function createTurret(world: GameWorld, ...): number;
function createCombatSystem(...): CombatSystem;
```

### 3. Constants

```typescript
// Use UPPER_SNAKE_CASE for module-level constants
const MAX_ENTITIES = 5000;
const DEFAULT_SPAWN_DELAY = 1000;
const BEAM_SEGMENT_COUNT = 5;

// Use nested objects for related constants
const GAME_CONFIG = {
    WORLD_WIDTH: 1920,
    WORLD_HEIGHT: 1080,
    TARGET_FPS: 60,
};

// Use enums for related numeric constants
const TurretType = {
    PHASER_ARRAY: 0,
    TORPEDO_LAUNCHER: 1,
    DISRUPTOR_BANK: 2,
} as const;
```

### 4. Interfaces and Types

```typescript
// Use I prefix for interfaces (optional but helps agents)
interface IWaveManager {
    startWave(waveNumber: number): void;
}

// Use descriptive suffixes
interface EnemyKilledPayload { }      // Event payload
interface TurretConfig { }            // Configuration
interface CombatStats { }             // Statistics data
type TurretTypeValue = typeof TurretType[keyof typeof TurretType];  // Union type
```

---

## Code Structure Patterns

### 1. Function Organization

```typescript
// src/systems/exampleSystem.ts

/**
 * Module description
 */

// 1. Imports (external first, then internal)
import { query, World } from 'bitecs';
import { Position, Health } from '../ecs/components';
import { COMBAT_CONFIG } from '../config';

// 2. Types and Interfaces
interface SystemOptions {
    maxTargets: number;
}

// 3. Constants
const DEFAULT_OPTIONS: SystemOptions = {
    maxTargets: 3,
};

// 4. Module-level queries (cached)
const entityQuery = defineQuery([Position, Health]);

// 5. Private helper functions
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// 6. Main exported functions
export function createExampleSystem(options: Partial<SystemOptions> = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    return function exampleSystem(world: World, delta: number): World {
        // System implementation
        return world;
    };
}
```

### 2. Class Organization

```typescript
/**
 * Class description
 */
export class ExampleManager {
    // 1. Static properties
    private static instance: ExampleManager | null = null;

    // 2. Public properties
    public readonly id: string;

    // 3. Private properties
    private items: Map<string, Item> = new Map();
    private eventBus: EventBus;

    // 4. Constructor
    constructor(config: ExampleConfig) {
        this.id = config.id;
        this.eventBus = EventBus.getInstance();
    }

    // 5. Static methods
    static getInstance(): ExampleManager {
        if (!ExampleManager.instance) {
            throw new Error('ExampleManager not initialized');
        }
        return ExampleManager.instance;
    }

    // 6. Lifecycle methods
    init(): void { }
    destroy(): void { }

    // 7. Public methods (alphabetical or logical grouping)
    addItem(item: Item): void { }
    getItem(id: string): Item | undefined { }
    removeItem(id: string): boolean { }
    update(delta: number): void { }

    // 8. Private methods
    private processItem(item: Item): void { }
    private validateItem(item: Item): boolean { }
}
```

---

## Error Handling Patterns

### 1. Early Return for Guards

```typescript
// GOOD: Early returns for preconditions
function processEnemy(world: World, entityId: number): void {
    // Guard: entity must exist
    if (!hasComponent(world, entityId, Health)) {
        return;
    }
    
    // Guard: entity must be alive
    if (Health.current[entityId] <= 0) {
        return;
    }
    
    // Guard: entity must be enemy
    if (Faction.id[entityId] === FactionId.FEDERATION) {
        return;
    }
    
    // Main logic here
    processEnemyLogic(world, entityId);
}

// BAD: Nested conditionals
function processEnemy(world: World, entityId: number): void {
    if (hasComponent(world, entityId, Health)) {
        if (Health.current[entityId] > 0) {
            if (Faction.id[entityId] !== FactionId.FEDERATION) {
                // Main logic buried deep
            }
        }
    }
}
```

### 2. Error Context

```typescript
// GOOD: Rich error context
throw new GameError(
    GameErrorCode.ENTITY_NOT_FOUND,
    `Failed to find turret entity ${turretId} for upgrade`,
    { turretId, upgradeLevel, attemptedUpgrade }
);

// BAD: Generic error
throw new Error('Entity not found');
```

---

## Documentation Patterns

### 1. JSDoc for Public APIs

```typescript
/**
 * Creates an enemy entity at the specified position.
 * 
 * @param world - The ECS world instance
 * @param factionId - Enemy faction (use FactionId enum)
 * @param x - Spawn X position in pixels
 * @param y - Spawn Y position in pixels
 * @returns Entity ID of the created enemy
 * 
 * @example
 * ```typescript
 * const enemyId = createEnemy(world, FactionId.KLINGON, 100, 200);
 * ```
 * 
 * @see FactionId for available factions
 * @see ENEMY_TEMPLATES for faction stats
 */
export function createEnemy(
    world: GameWorld,
    factionId: number,
    x: number,
    y: number
): number {
    // ...
}
```

### 2. Inline Comments for Complex Logic

```typescript
function generateBeamSegments(startX, startY, endX, endY, turretType) {
    // Calculate perpendicular vector for jitter offset
    // Using normalized direction (-dy, dx) rotated 90 degrees
    const perpX = -dy / length;
    const perpY = dx / length;
    
    for (let i = 0; i < SEGMENT_COUNT; i++) {
        // Jitter is stronger in the middle of the beam
        // midFactor: 0 at endpoints, 1 at center
        const midFactor = 1 - Math.abs(t - 0.5) * 2;
        const offset = randomOffset * jitter * midFactor;
        
        // ... rest of logic
    }
}
```

---

## Import/Export Patterns

### 1. Named Exports (Preferred)

```typescript
// GOOD: Named exports
export function createEnemy() { }
export class WaveManager { }
export const WAVE_CONFIG = { };

// Usage
import { createEnemy, WaveManager, WAVE_CONFIG } from './module';

// BAD: Default exports (harder to refactor)
export default class WaveManager { }
```

### 2. Barrel Exports

```typescript
// src/systems/index.ts
export { createCombatSystem, type CombatSystem } from './combatSystem';
export { createMovementSystem } from './movementSystem';
export { createTargetingSystem } from './targetingSystem';
// ... all systems

// Usage in other modules
import { createCombatSystem, createMovementSystem } from '../systems';
```

### 3. Import Organization

```typescript
// 1. External libraries
import { Application, Container, Sprite } from 'pixi.js';
import { addEntity, query, hasComponent } from 'bitecs';

// 2. Internal absolute imports (from src/)
import { Position, Health, Turret } from '../ecs/components';
import { COMBAT_CONFIG } from '../config';
import { EventBus, GameEventType } from '../types/events';

// 3. Relative imports (same module)
import { processTarget } from './targetingHelpers';

// 4. Type-only imports
import type { GameWorld } from '../ecs/world';
import type { CombatStats } from './types';
```

---

## Testing Patterns

### 1. Test Structure

```typescript
describe('FeatureName', () => {
    // Shared setup
    let world: GameWorld;
    
    beforeEach(() => {
        world = createGameWorld();
        PoolManager.getInstance().init(world);
    });
    
    afterEach(() => {
        PoolManager.getInstance().destroy();
    });

    describe('methodName', () => {
        it('should [expected behavior] when [condition]', () => {
            // Arrange
            const input = setupTestData();
            
            // Act
            const result = methodName(input);
            
            // Assert
            expect(result).toBe(expected);
        });
    });
});
```

### 2. Test Naming

```typescript
// Pattern: should [expected outcome] when [condition]
it('should deal damage to shields first when enemy has shields', () => {});
it('should return 0 when no enemies in range', () => {});
it('should emit ENEMY_KILLED event when health reaches 0', () => {});
it('should throw GameError when entity does not exist', () => {});
```

---

## Performance Patterns

### 1. Avoid Allocation in Loops

```typescript
// GOOD: Reuse objects
const tempPosition = { x: 0, y: 0 };

function updatePositions(entities: number[]): void {
    for (let i = 0; i < entities.length; i++) {
        const eid = entities[i];
        tempPosition.x = Position.x[eid];
        tempPosition.y = Position.y[eid];
        processPosition(tempPosition);
    }
}

// BAD: Creates object every iteration
function updatePositions(entities: number[]): void {
    for (const eid of entities) {
        const pos = { x: Position.x[eid], y: Position.y[eid] }; // BAD
        processPosition(pos);
    }
}
```

### 2. Cache Expensive Operations

```typescript
// GOOD: Cache at module scope
const turretQuery = defineQuery([Position, Turret, Target]);

function combatSystem(world: World): World {
    const turrets = turretQuery(world);
    // ...
}

// BAD: Recreate every frame
function combatSystem(world: World): World {
    const turrets = query(world, [Position, Turret, Target]); // Inefficient
    // ...
}
```

---

## Configuration Patterns

### 1. Use Config Objects

```typescript
// GOOD: All values from config
import { COMBAT_CONFIG } from '../config';

const segmentCount = COMBAT_CONFIG.BEAM.SEGMENT_COUNT;
const jitter = COMBAT_CONFIG.BEAM.JITTER.PHASER;

// BAD: Magic numbers in code
const segmentCount = 5;  // What is this?
const jitter = 6;        // Magic number
```

### 2. Config Documentation

```typescript
export const COMBAT_CONFIG = {
    BEAM: {
        /** Minimum beam length in pixels (prevents division by zero) */
        MIN_LENGTH: 0.001,
        
        /** Number of jitter segments (more = smoother, more expensive) */
        SEGMENT_COUNT: 5,
    },
} as const;
```

---

## Summary Checklist

When writing code for this project, verify:

- [ ] Names are descriptive and follow conventions
- [ ] Types are explicitly annotated
- [ ] Functions have JSDoc for public APIs
- [ ] Magic numbers are in config files
- [ ] Imports are organized by category
- [ ] Error handling includes context
- [ ] Performance-critical code avoids allocation
- [ ] Tests follow standard structure

---

## References

- `AGENTS.md` - Agent instructions
- `eslint.config.js` - Linting rules
- `tsconfig.json` - TypeScript configuration
- `src/config/` - Configuration files

---

*This document is part of the Kobayashi Maru maintainability initiative.*
