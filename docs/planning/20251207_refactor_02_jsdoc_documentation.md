# Refactoring Task: JSDoc Documentation Standards

**Date:** 2025-12-07  
**Priority:** HIGH  
**Estimated Effort:** 2-3 days  
**AI Friendliness Impact:** CRITICAL

---

## Problem Statement

AI coding assistants rely heavily on JSDoc comments to understand:
- Function purpose and behavior
- Parameter types and constraints
- Return value semantics
- Side effects and state changes
- Usage examples

Currently, many functions have minimal or no JSDoc, forcing AI to infer behavior from implementation - which is error-prone and slow.

### Current Documentation Coverage

| Module | Files | With JSDoc | Coverage |
|--------|-------|------------|----------|
| `src/core/` | 10 | 3 | 30% |
| `src/ecs/` | 5 | 2 | 40% |
| `src/systems/` | 14 | 8 | 57% |
| `src/ui/` | 13 | 4 | 31% |
| `src/game/` | 10 | 5 | 50% |
| `src/rendering/` | 18 | 6 | 33% |

---

## Recommended Actions

### 1. Establish JSDoc Standard Template

All public functions, classes, and interfaces must have:

```typescript
/**
 * Brief one-line description.
 * 
 * Longer description if needed, explaining behavior, 
 * side effects, or important constraints.
 * 
 * @param paramName - Description with constraints (e.g., "must be positive")
 * @param optionalParam - Description. Defaults to X.
 * @returns Description of return value, including edge cases
 * @throws {ErrorType} When this error occurs
 * @example
 * ```typescript
 * const result = functionName(42, 'option');
 * // result is now...
 * ```
 * 
 * @see {@link RelatedFunction} for related functionality
 * @since 1.0.0
 */
```

### 2. Priority Documentation Targets

**Tier 1 - Document Immediately (Public APIs):**

```typescript
// src/ecs/entityFactory.ts - ALL create functions
/**
 * Creates a Klingon ship entity with aggressive AI behavior.
 * 
 * The ship is positioned at the specified coordinates and immediately
 * begins seeking the Kobayashi Maru or nearest turret.
 * 
 * @param world - The ECS world to add the entity to
 * @param x - Initial X position in world coordinates (0 to WORLD_WIDTH)
 * @param y - Initial Y position in world coordinates (0 to WORLD_HEIGHT)
 * @returns Entity ID (eid) of the created ship. Use with component accessors.
 * 
 * @example
 * ```typescript
 * const klingonId = createKlingonShip(world, 100, 200);
 * Health.current[klingonId] // Access health component
 * ```
 * 
 * @see createEnemy for generic enemy creation
 */
export function createKlingonShip(
  world: GameWorld, 
  x: number, 
  y: number
): number
```

**Tier 2 - Document This Week (Core Systems):**

```typescript
// src/systems/combatSystem.ts
/**
 * Creates a combat system that manages turret firing, damage, and beam visuals.
 * 
 * The system runs each frame and:
 * 1. Checks turret fire rate cooldowns
 * 2. Fires at all valid targets (up to 3 with multi-target upgrade)
 * 3. Applies damage (shields first, then health)
 * 4. Generates beam visual data for the renderer
 * 5. Tracks combat statistics (DPS, accuracy)
 * 
 * @param particleSystem - Optional particle system for hit effects.
 *                         If not provided, no particles are spawned.
 * @returns Combat system object with update(), getActiveBeams(), getStats()
 * 
 * @example
 * ```typescript
 * const combat = createCombatSystem(particleSystem);
 * systemManager.register('combat', combat, 300, { requiresGameTime: true });
 * 
 * // During render
 * const beams = combat.getActiveBeams();
 * beamRenderer.render(beams);
 * ```
 */
export function createCombatSystem(particleSystem?: ParticleSystem)
```

**Tier 3 - Document This Sprint (UI Components):**

```typescript
// src/ui/HUDManager.ts
/**
 * Manages all in-game HUD elements.
 * 
 * Responsible for:
 * - Wave information display (top-left)
 * - Resource counter (top-right)
 * - Kobayashi Maru status bars (bottom-center)
 * - Combat statistics panel
 * - Turret menu and upgrade panel coordination
 * 
 * Must be initialized with a PixiJS Application before use.
 * Call update() each frame with current game state.
 * 
 * @example
 * ```typescript
 * const hud = new HUDManager();
 * hud.init(app, game);
 * 
 * // In game loop
 * hud.update({
 *   waveNumber: 5,
 *   waveState: 'active',
 *   resources: 500,
 *   // ...
 * });
 * ```
 */
export class HUDManager
```

### 3. Document Component Fields

```typescript
// src/ecs/components.ts

/**
 * Position component for entity world coordinates.
 * 
 * All entities with visual representation must have Position.
 * Coordinates are in pixels, with (0,0) at top-left.
 * 
 * @property x - Horizontal position (0 to GAME_CONFIG.WORLD_WIDTH)
 * @property y - Vertical position (0 to GAME_CONFIG.WORLD_HEIGHT)
 */
export const Position = defineComponent({
  /** Horizontal position in pixels */
  x: Types.f32,
  /** Vertical position in pixels */
  y: Types.f32
});
```

### 4. Add Type Exports Documentation

```typescript
// src/types/constants.ts

/**
 * Game configuration constants.
 * 
 * These values are used throughout the game and should not be
 * modified at runtime. For dynamic configuration, see ConfigManager.
 * 
 * @constant
 */
export const GAME_CONFIG = {
  /** World width in pixels. Canvas will scale to fit. */
  WORLD_WIDTH: 1920,
  
  /** World height in pixels. Canvas will scale to fit. */
  WORLD_HEIGHT: 1080,
  
  /** Maximum number of entities in the ECS world. Exceeding causes error. */
  MAX_ENTITIES: 10000,
  
  // ... more documented fields
} as const;
```

---

## Automation Option

Consider using an AI tool to generate initial JSDoc:

```bash
# Using TypeDoc to check coverage
npx typedoc --entryPoints src --out docs/api

# Using ESLint rule to enforce
# Add to eslint.config.js:
{
  rules: {
    'jsdoc/require-jsdoc': ['warn', {
      publicOnly: true,
      require: {
        FunctionDeclaration: true,
        ClassDeclaration: true,
        MethodDefinition: true
      }
    }]
  }
}
```

---

## Verification

- [ ] ESLint JSDoc plugin configured and passing
- [ ] All public exports have JSDoc with @param and @returns
- [ ] At least 3 @example annotations per module
- [ ] TypeDoc generates without warnings
- [ ] README updated with API documentation link

---

## Dependencies

- None - can run in parallel with other refactoring tasks
