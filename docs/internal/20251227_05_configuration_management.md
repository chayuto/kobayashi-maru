# Configuration Management for AI Agent Friendliness

**Date:** 2025-12-27  
**Category:** Configuration  
**Priority:** HIGH  
**Effort:** Low  

---

## Executive Summary

Centralized configuration is essential for AI coding agents to make safe game balance changes without modifying implementation code. This codebase already has excellent configuration management. This document outlines how to maintain and extend this pattern.

---

## Current State Assessment

### ✅ Excellent Configuration System

1. **Centralized Config Directory** - `src/config/`
   - `combat.config.ts` - Beam settings, DPS calculations
   - `wave.config.ts` - Spawn timing, wave delays
   - `ui.config.ts` - UI dimensions, colors
   - `rendering.config.ts` - Visual settings
   - `performance.config.ts` - Performance thresholds
   - `ai.config.ts` - AI behavior settings
   - `autoplay.config.ts` - AI autoplay settings
   - `score.config.ts` - Scoring configuration

2. **Type-Safe Configurations** - `as const` assertions
3. **Barrel Export** - `src/config/index.ts`

### ⚠️ Enhancement Opportunities

1. **Magic Numbers** - Some remain in implementation files
2. **Runtime Configuration** - No dynamic config support
3. **Environment-Based** - No dev/prod config separation
4. **Validation** - No config validation at startup

---

## Recommendations for AI Coding Agents

### 1. Complete Magic Number Extraction

**Recommendation:** Extract ALL magic numbers to config files.

**Current Issues Found:**
```typescript
// src/systems/aiSystem.ts - Magic numbers in code
const STRAFE_SPEED = 80;  // Should be in ai.config.ts
const ORBIT_DISTANCE = 300;  // Should be in ai.config.ts

// src/rendering/Starfield.ts - Magic numbers
const STAR_COUNT = 200;  // Should be in rendering.config.ts
const STAR_SPEED = 50;   // Should be in rendering.config.ts
```

**Pattern for Extraction:**
```typescript
// 1. Add to appropriate config file
// src/config/ai.config.ts
export const AI_CONFIG = {
    BEHAVIOR: {
        STRAFE: {
            SPEED: 80,
            DIRECTION_CHANGE_INTERVAL: 2.0,
        },
        ORBIT: {
            DISTANCE: 300,
            SPEED: 50,
        },
    },
} as const;

// 2. Import and use
import { AI_CONFIG } from '../config';
const speed = AI_CONFIG.BEHAVIOR.STRAFE.SPEED;
```

**Why Agent-Friendly:**
- Agents can find all configurable values in one place
- Balance changes don't require code changes
- Type system prevents typos

**Action Items:**
- [ ] Audit all source files for magic numbers
- [ ] Create extraction list with target config files
- [ ] Execute extraction with tests

---

### 2. Configuration Validation

**Recommendation:** Validate configurations at startup.

**Pattern:**
```typescript
// src/config/validation.ts
import { GAME_CONFIG } from './game.config';
import { TURRET_CONFIG } from '../types/config/turrets';
import { WAVE_CONFIG } from './wave.config';

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateConfigurations(): ValidationResult {
    const errors: string[] = [];

    // Game config validation
    if (GAME_CONFIG.WORLD_WIDTH <= 0) {
        errors.push('WORLD_WIDTH must be positive');
    }
    if (GAME_CONFIG.TARGET_FPS < 30 || GAME_CONFIG.TARGET_FPS > 144) {
        errors.push('TARGET_FPS must be between 30 and 144');
    }

    // Turret config validation
    for (const [type, config] of Object.entries(TURRET_CONFIG)) {
        if (config.damage < 0) {
            errors.push(`Turret ${type} has negative damage`);
        }
        if (config.range <= 0) {
            errors.push(`Turret ${type} has non-positive range`);
        }
        if (config.fireRate <= 0) {
            errors.push(`Turret ${type} has non-positive fire rate`);
        }
    }

    // Wave config validation
    if (WAVE_CONFIG.TIMING.WAVE_DELAY_MS < 0) {
        errors.push('Wave delay cannot be negative');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Call on game startup
const validation = validateConfigurations();
if (!validation.valid) {
    console.error('Configuration errors:', validation.errors);
    throw new Error('Invalid game configuration');
}
```

**Why Agent-Friendly:**
- Invalid configs caught immediately
- Clear error messages
- Prevents runtime surprises

**Action Items:**
- [ ] Create validation functions for each config
- [ ] Add validation to bootstrap
- [ ] Add validation tests

---

### 3. Configuration Documentation

**Recommendation:** Document all configuration values.

**Pattern with JSDoc:**
```typescript
/**
 * Combat System Configuration
 * 
 * Controls weapon behavior, damage calculation, and visual effects.
 * 
 * @example Adjusting beam width
 * ```typescript
 * // Change in combat.config.ts
 * BEAM: {
 *   MIN_LENGTH: 0.001,  // Minimum beam length before skipping render
 *   SEGMENT_COUNT: 5,   // Number of jitter segments
 * }
 * ```
 */
export const COMBAT_CONFIG = {
    /**
     * Beam weapon visual and mechanical settings.
     */
    BEAM: {
        /**
         * Minimum beam length to render.
         * Prevents division by zero in segment calculation.
         * @unit pixels
         * @range (0, 1]
         */
        MIN_LENGTH: 0.001,

        /**
         * Number of segments for electricity jitter effect.
         * Higher = smoother but more expensive.
         * @range [3, 10]
         */
        SEGMENT_COUNT: 5,

        /**
         * Jitter amount by turret type (pixels of random offset).
         * Higher = more chaotic beam appearance.
         */
        JITTER: {
            /** Clean, precise Federation phasers */
            PHASER: 6,
            /** Rough Klingon disruptors */
            DISRUPTOR: 10,
            /** Unstable Tetryon particles */
            TETRYON: 12,
            /** Smooth Dominion polarons */
            POLARON: 9,
            /** Hot plasma emissions */
            PLASMA: 8,
            /** Fallback for unknown types */
            DEFAULT: 8,
        },
    },
} as const;
```

**Why Agent-Friendly:**
- Agents understand what each value controls
- Units and ranges are explicit
- Examples show usage

**Action Items:**
- [ ] Add JSDoc to all config values
- [ ] Document units (pixels, seconds, etc.)
- [ ] Add valid ranges where applicable

---

### 4. Environment-Based Configuration

**Recommendation:** Support different configs for dev/prod.

**Pattern:**
```typescript
// src/config/environment.ts
type Environment = 'development' | 'production' | 'test';

function getEnvironment(): Environment {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        return 'test';
    }
    // Vite injects import.meta.env.MODE
    if (import.meta.env?.MODE === 'production') {
        return 'production';
    }
    return 'development';
}

export const ENV = getEnvironment();

// src/config/performance.config.ts
import { ENV } from './environment';

export const PERFORMANCE_CONFIG = {
    DEBUG: {
        SHOW_FPS: ENV !== 'production',
        SHOW_ENTITY_COUNT: ENV !== 'production',
        LOG_SLOW_FRAMES: ENV === 'development',
    },
    QUALITY: {
        // Lower defaults for development for faster iteration
        DEFAULT_LEVEL: ENV === 'production' ? 'high' : 'medium',
        MAX_PARTICLES: ENV === 'production' ? 1000 : 500,
    },
} as const;
```

**Why Agent-Friendly:**
- Dev and prod have appropriate defaults
- Test environment can be optimized
- No manual flag toggling needed

**Action Items:**
- [ ] Create environment detection utility
- [ ] Add environment-specific values where needed
- [ ] Document environment differences

---

### 5. Configuration Schema Definition

**Recommendation:** Define schemas for complex configurations.

**Pattern with Type Inference:**
```typescript
// src/config/schemas/turret.schema.ts

/** Stats that define a turret type */
interface TurretStats {
    /** Targeting range in pixels */
    range: number;
    /** Shots per second */
    fireRate: number;
    /** Damage per shot */
    damage: number;
    /** Resource cost to build */
    cost: number;
    /** Maximum health points */
    health: number;
    /** Maximum shield points */
    shield: number;
    /** Display name */
    name: string;
    /** Description for UI */
    description: string;
}

/** All turret types must have these stats */
type TurretConfigType = Record<TurretTypeValue, TurretStats>;

// Validate at compile time
export const TURRET_CONFIG = {
    [TurretType.PHASER_ARRAY]: {
        range: 200,
        fireRate: 4,
        damage: 10,
        cost: 100,
        health: 50,
        shield: 25,
        name: 'Phaser Array',
        description: 'High rate of fire, low damage',
    },
    // ... other turrets
} as const satisfies TurretConfigType;
```

**Why Agent-Friendly:**
- Missing fields cause compile errors
- Type inference works from schema
- Consistent structure across entries

**Action Items:**
- [ ] Define schemas for all complex configs
- [ ] Use `satisfies` for type checking
- [ ] Add schema validation tests

---

### 6. Configuration Change Logging

**Recommendation:** Track configuration changes for debugging.

**Pattern:**
```typescript
// src/config/configLogger.ts

interface ConfigChange {
    timestamp: number;
    configName: string;
    path: string;
    oldValue: unknown;
    newValue: unknown;
    source: string;
}

class ConfigLogger {
    private changes: ConfigChange[] = [];

    logChange(
        configName: string,
        path: string,
        oldValue: unknown,
        newValue: unknown,
        source: string = 'runtime'
    ): void {
        const change: ConfigChange = {
            timestamp: Date.now(),
            configName,
            path,
            oldValue,
            newValue,
            source,
        };
        
        this.changes.push(change);
        
        if (import.meta.env.DEV) {
            console.log(`[Config] ${configName}.${path}: ${oldValue} → ${newValue}`);
        }
    }

    getHistory(): ConfigChange[] {
        return [...this.changes];
    }
}

export const configLogger = new ConfigLogger();
```

**Why Agent-Friendly:**
- Track what changed during gameplay
- Debug unexpected behavior
- Document runtime modifications

**Action Items:**
- [ ] Create config change logger
- [ ] Integrate with any runtime config changes
- [ ] Add to debug overlay

---

### 7. Wave Configuration as Data

**Recommendation:** Store wave definitions as JSON/YAML.

**Current:** Wave definitions in `waveStories.json`

**Extend Pattern:**
```json
// src/config/waves.json
{
    "waves": [
        {
            "number": 1,
            "enemies": [
                { "faction": "KLINGON", "count": 5, "delay": 0 },
                { "faction": "KLINGON", "count": 3, "delay": 2000 }
            ],
            "storyText": "Klingon raiders detected!",
            "boss": null
        },
        {
            "number": 5,
            "enemies": [
                { "faction": "BORG", "count": 10, "delay": 0 }
            ],
            "storyText": "Resistance is futile.",
            "boss": {
                "faction": "BORG",
                "abilities": ["SHIELD_REGEN", "SUMMON"]
            }
        }
    ]
}
```

**Why Agent-Friendly:**
- Wave design separate from code
- Easy to add new waves
- Can be validated independently

**Action Items:**
- [ ] Define wave JSON schema
- [ ] Create wave config loader
- [ ] Migrate existing wave definitions

---

## Config File Checklist

### Existing Configs (Maintain)
- [x] `combat.config.ts` - Beam settings, stats
- [x] `wave.config.ts` - Spawning timing
- [x] `ui.config.ts` - UI dimensions
- [x] `rendering.config.ts` - Visual settings
- [x] `performance.config.ts` - Performance thresholds
- [x] `ai.config.ts` - AI behaviors
- [x] `autoplay.config.ts` - AI autoplay
- [x] `score.config.ts` - Scoring

### Potential New Configs
- [ ] `audio.config.ts` - Sound volumes, frequencies
- [ ] `particle.config.ts` - Particle effect presets
- [ ] `physics.config.ts` - Movement, collision
- [ ] `balance.config.ts` - Game balance tweaks

---

## Implementation Checklist

### Phase 1: Magic Number Extraction (2-3 hours)
- [ ] Audit all source files
- [ ] Extract to appropriate configs
- [ ] Update imports

### Phase 2: Documentation (2 hours)
- [ ] Add JSDoc to all configs
- [ ] Document units and ranges
- [ ] Add usage examples

### Phase 3: Validation (2 hours)
- [ ] Create validation functions
- [ ] Add to bootstrap
- [ ] Add validation tests

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Magic numbers in code | ~20 | 0 |
| Config JSDoc coverage | ~50% | 100% |
| Config validation | None | Full |
| Config tests | Partial | Complete |

---

## References

- `src/config/` - All configuration files
- `src/config/index.ts` - Barrel export
- `src/types/config/` - Type-specific configs

---

*This document is part of the Kobayashi Maru maintainability initiative.*
