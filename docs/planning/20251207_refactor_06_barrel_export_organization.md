# Refactoring Task: Barrel Export Organization

**Date:** 2025-12-07  
**Priority:** MEDIUM  
**Estimated Effort:** 1 day  
**AI Friendliness Impact:** MEDIUM

---

## Problem Statement

AI coding assistants perform better when imports are consistent and predictable. Currently, the codebase has:

- Some modules with `index.ts` barrel exports
- Some modules requiring direct file imports
- Inconsistent export naming conventions
- Missing re-exports forcing longer import paths

### Current Import Inconsistencies

```typescript
// Some modules use barrel exports
import { createKlingonShip, Position } from '../ecs';
import { SpatialHash } from '../collision';

// Others require direct imports
import { GAME_CONFIG } from '../types/constants';  // Not from '../types'
import { DebugManager } from '../core/DebugManager';  // Not from '../core'

// Mixed patterns
import { AudioManager } from '../audio';  // Works
import { SoundGenerator } from '../audio/SoundGenerator';  // Also needed
```

---

## Current Barrel Export Status

| Module Path | Has index.ts | Exports All | Notes |
|-------------|--------------|-------------|-------|
| `src/ecs/` | ✅ | ✅ | Good |
| `src/systems/` | ✅ | ⚠️ Partial | Missing some systems |
| `src/collision/` | ✅ | ✅ | Good |
| `src/audio/` | ✅ | ⚠️ Partial | Missing SoundType |
| `src/core/` | ✅ | ⚠️ Partial | Missing several managers |
| `src/game/` | ✅ | ⚠️ Partial | Missing configs |
| `src/rendering/` | ✅ | ⚠️ Partial | Missing filter modules |
| `src/ui/` | ✅ | ⚠️ Partial | Missing several components |
| `src/types/` | ⚠️ Only constants | ❌ | No index.ts |
| `src/services/` | ✅ | ✅ | Good |
| `src/pathfinding/` | ✅ | ✅ | Good |
| `src/utils/` | ❌ | ❌ | No index.ts |
| `src/config/` | ❌ | N/A | Doesn't exist yet |

---

## Recommended Actions

### 1. Update All Index Files for Complete Re-exports

**`src/core/index.ts`** (update):
```typescript
// Core game classes and managers
export { Game } from './Game';
export { DebugManager } from './DebugManager';
export { EventBus } from './EventBus';
export { InputManager } from './InputManager';
export { TouchInputManager } from './TouchInputManager';
export { GestureManager } from './GestureManager';
export { HapticManager } from './HapticManager';
export { PerformanceMonitor } from './PerformanceMonitor';
export { QualityManager } from './QualityManager';
```

**`src/systems/index.ts`** (update):
```typescript
// System types
export type { 
  System, 
  SystemContext,
  SystemFunction,
  ExtendedSystemFunction,
} from './types';

// System manager
export { SystemManager } from './SystemManager';

// All game systems
export { createMovementSystem } from './movementSystem';
export { createAISystem } from './aiSystem';
export { createCombatSystem, type CombatSystem, type BeamVisual } from './combatSystem';
export { createDamageSystem, type DamageSystem } from './damageSystem';
export { createTargetingSystem } from './targetingSystem';
export { createCollisionSystem, type CollisionSystem } from './collisionSystem';
export { createRenderSystem } from './renderSystem';
export { createProjectileSystem, type ProjectileSystem } from './projectileSystem';
export { createEnemyProjectileSystem } from './enemyProjectileSystem';
export { createEnemyCombatSystem } from './enemyCombatSystem';
export { createEnemyCollisionSystem } from './enemyCollisionSystem';
export { createStatusEffectSystem, applyBurning, applySlowed, applyDrained } from './statusEffectSystem';
```

**`src/ui/index.ts`** (update):
```typescript
// UI Components
export { HUDManager } from './HUDManager';
export { GameOverScreen } from './GameOverScreen';
export { TurretMenu } from './TurretMenu';
export { TurretUpgradePanel } from './TurretUpgradePanel';
export { HealthBar } from './HealthBar';
export { MessageLog } from './MessageLog';
export { PauseOverlay } from './PauseOverlay';
export { MobileControlsOverlay } from './MobileControlsOverlay';
export { OrientationOverlay } from './OrientationOverlay';
export { ResponsiveUIManager } from './ResponsiveUIManager';

// UI Types and Styles
export { UI_STYLES } from './styles';
export type { HUDData, TurretButtonConfig } from './types';
```

**`src/game/index.ts`** (update):
```typescript
// Game state management  
export { GameState, GameStateType } from './gameState';
export { ScoreManager } from './scoreManager';
export { HighScoreManager } from './highScoreManager';
export { ResourceManager, TURRET_COSTS } from './resourceManager';

// Wave system
export { WaveManager } from './waveManager';
export { getWaveConfig, generateProceduralWave, getDifficultyScale } from './waveConfig';
export type { WaveConfig, EnemySpawnConfig, FormationType } from './waveConfig';

// Spawning
export { SpawnPointManager, SPAWN_EDGES } from './spawnPoints';

// Placement
export { PlacementManager } from './PlacementManager';

// Upgrades
export { UpgradeManager } from './UpgradeManager';
```

**`src/types/index.ts`** (create):
```typescript
// Game constants
export {
  GAME_CONFIG,
  FactionId,
  type FactionIdType,
  AIBehaviorType,
  TurretType,
  ProjectileType,
  COLLISION_LAYERS,
  COLLISION_MASKS,
} from './constants';

// Add other type exports as they're created
```

**`src/rendering/index.ts`** (update):
```typescript
// Core rendering
export { SpriteManager } from './spriteManager';
export { RenderingSystem } from './RenderingSystem';
export { Starfield } from './Starfield';

// Effects
export { ParticleSystem, EFFECTS, type ParticleConfig } from './ParticleSystem';
export { ExplosionManager, type ExplosionConfig } from './ExplosionManager';
export { ScreenShake } from './ScreenShake';

// Specialized renderers
export { BeamRenderer } from './BeamRenderer';
export { HealthBarRenderer } from './HealthBarRenderer';
export { ShieldRenderer } from './ShieldRenderer';
export { ShockwaveRenderer } from './ShockwaveRenderer';
export { PlacementRenderer } from './PlacementRenderer';
export { TurretUpgradeVisuals } from './TurretUpgradeVisuals';

// Textures
export { TextureCache } from './TextureCache';
export { createFactionTexture, createTurretTexture } from './textures';

// Effect presets
export { effectPresets, type EffectPreset } from './effectPresets';

// Filters
export { GlowManager } from './filters/GlowManager';
```

**`src/utils/index.ts`** (create):
```typescript
// Utility functions
export { BinaryHeap } from './BinaryHeap';
// Add other utils as they're identified
```

### 2. Create Root-Level Barrel for Common Imports

**`src/index.ts`** (create):
```typescript
/**
 * Main entry point for Kobayashi Maru game engine.
 * Re-exports commonly used modules for convenient importing.
 */

// Core
export { Game } from './core';

// ECS
export {
  Position,
  Velocity,
  Health,
  Shield,
  Faction,
  Turret,
  Target,
  createEnemy,
  createTurret,
} from './ecs';

// Game state
export { GameState, ResourceManager, WaveManager } from './game';

// Types
export { GAME_CONFIG, FactionId, TurretType } from './types';
```

### 3. Establish Import Conventions

Add to project README or CONTRIBUTING.md:

```markdown
## Import Conventions

### Prefer module imports over direct file imports

```typescript
// ✅ Good - import from module
import { Position, createEnemy } from '../ecs';
import { CombatSystem } from '../systems';

// ❌ Avoid - import from specific file
import { Position } from '../ecs/components';
import { createCombatSystem } from '../systems/combatSystem';
```

### Import order

1. External packages (pixi.js, bitecs)
2. Absolute imports from src/ modules
3. Relative imports from same module

```typescript
// External
import { Application } from 'pixi.js';
import { defineQuery } from 'bitecs';

// Module imports
import { Position, Health } from '../ecs';
import { ParticleSystem } from '../rendering';

// Local
import { HelperFunction } from './helpers';
```
```

---

## Verification

- [ ] All modules have complete index.ts barrel exports
- [ ] No TypeScript import errors after change
- [ ] ESLint import rules pass
- [ ] IDE auto-import suggestions use barrel exports
- [ ] Circular dependency check passes

---

## Dependencies

- None - can be done in parallel
- Should coordinate with file decomposition task
