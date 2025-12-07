# Refactoring Task: Configuration Externalization

**Date:** 2025-12-07  
**Priority:** HIGH  
**Estimated Effort:** 2 days  
**AI Friendliness Impact:** HIGH

---

## Problem Statement

Hardcoded "magic numbers" and inline configuration scattered throughout the codebase cause problems for AI coding assistants:

- Difficult to understand what values represent
- Changes require searching multiple files
- No clear relationship between related values
- Easy to introduce inconsistencies

### Examples of Current Issues

```typescript
// src/core/Game.ts
const TURRET_CLICK_RADIUS = 32;  // Local constant, not reusable

// src/systems/combatSystem.ts
const MIN_BEAM_LENGTH = 0.001;
const BEAM_SEGMENT_COUNT = 5;
const DPS_WINDOW = 5;  // Meaning unclear without context

// src/rendering/ParticleSystem.ts
const MAX_PARTICLES = 15000;  // Duplicated in multiple places

// src/ui/HUDManager.ts
const TOGGLE_BUTTON_WIDTH = 100;
const TOGGLE_BUTTON_HEIGHT = 32;  // UI constants mixed with logic
```

---

## Recommended Actions

### 1. Create Centralized Configuration Module

```typescript
// src/config/index.ts

/**
 * Game-wide configuration settings.
 * All magic numbers should be defined here with clear grouping and documentation.
 */

export { GAME_CONFIG } from './game.config';
export { COMBAT_CONFIG } from './combat.config';
export { RENDERING_CONFIG } from './rendering.config';
export { UI_CONFIG } from './ui.config';
export { AUDIO_CONFIG } from './audio.config';
```

### 2. Create Domain-Specific Config Files

**`src/config/game.config.ts`:**
```typescript
/**
 * Core game configuration.
 */
export const GAME_CONFIG = {
  /** World and viewport settings */
  WORLD: {
    WIDTH: 1920,
    HEIGHT: 1080,
    MAX_ENTITIES: 10000,
  },
  
  /** Entity interaction settings */
  INTERACTION: {
    /** Radius in pixels for turret click/tap detection */
    TURRET_CLICK_RADIUS: 32,
    /** Radius for enemy selection */
    ENEMY_SELECT_RADIUS: 24,
  },
  
  /** Timing settings */
  TIMING: {
    /** Delay between waves in milliseconds */
    WAVE_DELAY_MS: 3000,
    /** Grace period after game start */
    INITIAL_GRACE_PERIOD_MS: 5000,
  },
  
  /** Resource settings */
  RESOURCES: {
    /** Starting matter amount */
    INITIAL_MATTER: 500,
    /** Matter awarded per enemy kill */
    MATTER_PER_KILL: 10,
  },
} as const;

export type GameConfig = typeof GAME_CONFIG;
```

**`src/config/combat.config.ts`:**
```typescript
/**
 * Combat system configuration.
 */
export const COMBAT_CONFIG = {
  /** Beam weapon settings */
  BEAM: {
    /** Minimum beam length to render (prevents division by zero) */
    MIN_LENGTH: 0.001,
    /** Number of segments for electricity jitter effect */
    SEGMENT_COUNT: 5,
    /** Jitter amount by turret type */
    JITTER: {
      PHASER: 6,
      DISRUPTOR: 10,
      TETRYON: 12,
      POLARON: 9,
      DEFAULT: 8,
    },
  },
  
  /** Statistics tracking */
  STATS: {
    /** Rolling window in seconds for DPS calculation */
    DPS_WINDOW_SECONDS: 5,
  },
  
  /** Projectile settings */
  PROJECTILE: {
    /** Default torpedo speed in pixels per second */
    TORPEDO_SPEED: 300,
    /** Torpedo lifetime in seconds */
    TORPEDO_LIFETIME: 5,
  },
} as const;

export type CombatConfig = typeof COMBAT_CONFIG;
```

**`src/config/ui.config.ts`:**
```typescript
/**
 * UI configuration settings.
 */
export const UI_CONFIG = {
  /** Common padding and spacing */
  SPACING: {
    PADDING: 16,
    PANEL_GAP: 8,
    ELEMENT_GAP: 4,
  },
  
  /** Button dimensions */
  BUTTONS: {
    TOGGLE_WIDTH: 100,
    TOGGLE_HEIGHT: 32,
    TURRET_BUTTON_SIZE: 64,
  },
  
  /** Health/shield bar dimensions */
  BARS: {
    WIDTH: 200,
    HEIGHT: 20,
    BORDER_WIDTH: 2,
  },
  
  /** Font settings */
  FONTS: {
    FAMILY: 'Courier New, monospace',
    SIZE_SMALL: 12,
    SIZE_MEDIUM: 16,
    SIZE_LARGE: 24,
    SIZE_XLARGE: 32,
  },
  
  /** Color palette */
  COLORS: {
    PRIMARY: 0x00FFFF,      // Cyan - LCARS style
    SECONDARY: 0xFFCC00,    // Yellow
    BACKGROUND: 0x1a1a2e,   // Dark blue
    TEXT: 0xE0E0E0,         // Light gray
    HEALTH: 0x00FF00,       // Green
    SHIELD: 0x3399FF,       // Blue
    DANGER: 0xFF3333,       // Red
    DISABLED: 0x888888,     // Gray
  },
} as const;

export type UIConfig = typeof UI_CONFIG;
```

**`src/config/rendering.config.ts`:**
```typescript
/**
 * Rendering configuration.
 */
export const RENDERING_CONFIG = {
  /** Particle system limits */
  PARTICLES: {
    MAX_COUNT: 15000,
    POOL_SIZE: 1000,
    BATCH_SIZE: 500,
  },
  
  /** Texture settings */
  TEXTURES: {
    /** Default texture size in pixels */
    DEFAULT_SIZE: 32,
    /** Maximum cached textures */
    CACHE_LIMIT: 100,
  },
  
  /** Starfield background */
  STARFIELD: {
    LAYER_COUNT: 3,
    STARS_PER_LAYER: [100, 50, 25],
    PARALLAX_SPEEDS: [0.3, 0.5, 0.8],
  },
  
  /** Screen shake */
  SCREEN_SHAKE: {
    MAX_OFFSET: 10,
    DECAY_RATE: 0.9,
  },
} as const;

export type RenderingConfig = typeof RENDERING_CONFIG;
```

### 3. Update Imports Throughout Codebase

```typescript
// Before
const DPS_WINDOW = 5;

// After
import { COMBAT_CONFIG } from '../config';
// ...
damageHistory.filter(e => currentTime - e.time < COMBAT_CONFIG.STATS.DPS_WINDOW_SECONDS);
```

### 4. Runtime Configuration Support

For values that may change at runtime (user settings):

```typescript
// src/config/RuntimeConfig.ts

import { StorageService, StorageKeys } from '../services';

export class RuntimeConfig {
  private static instance: RuntimeConfig;
  
  private settings = {
    masterVolume: 1.0,
    sfxVolume: 1.0,
    musicVolume: 0.5,
    showFPS: false,
    particleQuality: 'high' as 'low' | 'medium' | 'high',
  };
  
  static getInstance(): RuntimeConfig {
    if (!this.instance) {
      this.instance = new RuntimeConfig();
    }
    return this.instance;
  }
  
  private constructor() {
    this.load();
  }
  
  get<K extends keyof typeof this.settings>(key: K): typeof this.settings[K] {
    return this.settings[key];
  }
  
  set<K extends keyof typeof this.settings>(
    key: K, 
    value: typeof this.settings[K]
  ): void {
    this.settings[key] = value;
    this.save();
  }
  
  private load(): void {
    const saved = StorageService.load(StorageKeys.SETTINGS, null);
    if (saved) {
      Object.assign(this.settings, saved);
    }
  }
  
  private save(): void {
    StorageService.save(StorageKeys.SETTINGS, this.settings);
  }
}
```

---

## Verification

- [ ] No magic numbers remain in source files (except config modules)
- [ ] All config values have descriptive comments
- [ ] Config modules export `as const` for type safety
- [ ] Runtime config persists to localStorage correctly
- [ ] All tests updated to use config imports

---

## Dependencies

- None - can be started immediately
- Consider doing alongside JSDoc documentation task
