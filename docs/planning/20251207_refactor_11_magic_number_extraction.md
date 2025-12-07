# Refactor Task: Magic Number Extraction

**Date:** December 7, 2025  
**Priority:** 🟡 Medium  
**Complexity:** Low  
**Estimated Effort:** 2-3 hours  

---

## Problem Statement

Hardcoded "magic numbers" are scattered throughout the codebase without named constants, making the code harder to understand and tune.

### Examples Found

```typescript
// Game.ts
const TURRET_CLICK_RADIUS = 32;  // Good - named!
// But elsewhere...
this.screenShake.shake(5, 0.3);  // What do 5 and 0.3 mean?

// combatSystem.ts
const MIN_BEAM_LENGTH = 0.001;
const BEAM_SEGMENT_COUNT = 5;
const DPS_WINDOW = 5;  // Good - named!
// But...
jitter = 8;  // Default jitter - what unit?
jitter = 6;  // Less jitter for phasers
jitter = 10; // More jitter for disruptors

// ParticleSystem.ts
const size = 32;  // Base size - why 32?

// waveManager.ts
const MAX_SPAWNS_PER_FRAME = 10;
const WAVE_COMPLETE_DELAY = 3000;  // Good!
// But...
const baseSpeed = 50 + Math.random() * 150;  // Why these values?
const speedScale = 1 + (this.currentWave - 1) * 0.02;  // 2% - document!

// aiSystem.ts
const frequency = 3;  // Hz
const amplitude = 0.5;  // Strength of strafe
```

---

## Impact

- **Unclear Intent:** What does `0.3` mean in `shake(5, 0.3)`?
- **Difficult Tuning:** Finding all instances of a value is hard
- **Inconsistency:** Same concept might use different values
- **Documentation:** Numbers don't explain themselves

---

## Proposed Solution

Extract magic numbers into named constants in appropriate config files.

---

## Implementation

### Step 1: Create Visual Effects Config

```typescript
// src/config/effects.config.ts

export const SCREEN_SHAKE = {
  /** Shake intensity when Kobayashi Maru takes damage */
  DAMAGE_INTENSITY: 5,
  /** Duration of damage shake in seconds */
  DAMAGE_DURATION: 0.3,
  /** Shake intensity for explosions */
  EXPLOSION_INTENSITY: 8,
  /** Duration of explosion shake */
  EXPLOSION_DURATION: 0.5
} as const;

export const BEAM_EFFECTS = {
  /** Minimum beam length to render (prevents zero-length issues) */
  MIN_LENGTH: 0.001,
  /** Number of segments for electricity jitter effect */
  SEGMENT_COUNT: 5,
  /** Base jitter amount in pixels */
  DEFAULT_JITTER: 8,
  /** Jitter for phaser beams (smoother) */
  PHASER_JITTER: 6,
  /** Jitter for disruptor beams (rougher) */
  DISRUPTOR_JITTER: 10,
  /** Jitter for tetryon beams (most chaotic) */
  TETRYON_JITTER: 12,
  /** Jitter for polaron beams */
  POLARON_JITTER: 9
} as const;

export const PARTICLE_EFFECTS = {
  /** Base texture size for particles */
  BASE_TEXTURE_SIZE: 32,
  /** Default particle pool size */
  DEFAULT_POOL_SIZE: 2000
} as const;
```

### Step 2: Create Combat Config

```typescript
// src/config/combat.config.ts

export const COMBAT_STATS = {
  /** Window for DPS calculation in seconds */
  DPS_CALCULATION_WINDOW: 5
} as const;

export const TURRET_INTERACTION = {
  /** Click radius for selecting turrets in pixels */
  CLICK_RADIUS: 32,
  /** Minimum distance between turrets */
  MIN_SPACING: 64
} as const;
```

### Step 3: Create Wave Spawning Config

```typescript
// src/config/waves.config.ts

export const WAVE_SPAWNING = {
  /** Maximum enemies to spawn per frame (prevents lag spikes) */
  MAX_SPAWNS_PER_FRAME: 10,
  /** Delay before next wave starts in milliseconds */
  WAVE_COMPLETE_DELAY_MS: 3000,
  /** Minimum enemy speed in pixels per second */
  ENEMY_MIN_SPEED: 50,
  /** Maximum additional random speed */
  ENEMY_SPEED_VARIANCE: 150,
  /** Speed increase per wave (2% = 0.02) */
  SPEED_SCALE_PER_WAVE: 0.02
} as const;
```

### Step 4: Create AI Behavior Config

```typescript
// src/config/ai.config.ts

export const AI_STRAFE = {
  /** Oscillation frequency in Hz */
  FREQUENCY: 3,
  /** Strafe amplitude (0-1, affects perpendicular movement) */
  AMPLITUDE: 0.5
} as const;

export const AI_SWARM = {
  /** Noise frequency for organic movement */
  NOISE_FREQUENCY: 0.5,
  /** Noise amplitude (0-1) */
  NOISE_AMPLITUDE: 0.2
} as const;

export const AI_FLANK = {
  /** Distance at which flanking angle is maximum */
  MAX_FLANK_DISTANCE: 500,
  /** Maximum flank angle in radians (PI/4 = 45 degrees) */
  MAX_FLANK_ANGLE: Math.PI / 4
} as const;
```

### Step 5: Update Code to Use Constants

```typescript
// Game.ts - BEFORE
this.screenShake.shake(5, 0.3);

// Game.ts - AFTER
import { SCREEN_SHAKE } from '../config/effects.config';
this.screenShake.shake(SCREEN_SHAKE.DAMAGE_INTENSITY, SCREEN_SHAKE.DAMAGE_DURATION);
```

```typescript
// combatSystem.ts - BEFORE
let jitter = 8;
if (turretType === TurretType.PHASER_ARRAY) {
  jitter = 6;
}

// combatSystem.ts - AFTER
import { BEAM_EFFECTS } from '../config/effects.config';
let jitter = BEAM_EFFECTS.DEFAULT_JITTER;
if (turretType === TurretType.PHASER_ARRAY) {
  jitter = BEAM_EFFECTS.PHASER_JITTER;
}
```

```typescript
// waveManager.ts - BEFORE
const baseSpeed = 50 + Math.random() * 150;
const speedScale = 1 + (this.currentWave - 1) * 0.02;

// waveManager.ts - AFTER
import { WAVE_SPAWNING } from '../config/waves.config';
const baseSpeed = WAVE_SPAWNING.ENEMY_MIN_SPEED + 
  Math.random() * WAVE_SPAWNING.ENEMY_SPEED_VARIANCE;
const speedScale = 1 + (this.currentWave - 1) * WAVE_SPAWNING.SPEED_SCALE_PER_WAVE;
```

---

## Search Patterns

Use these grep patterns to find magic numbers:

```bash
# Numbers in function calls
grep -rn '\.[a-zA-Z]*([0-9]' src/

# Hardcoded multipliers
grep -rn '\* [0-9]\.' src/
grep -rn '/ [0-9]\.' src/

# Comparison with numbers
grep -rn '< [0-9]' src/
grep -rn '> [0-9]' src/

# Assignment of numbers
grep -rn '= [0-9]' src/
```

---

## Validation Criteria

1. **No unexplained numbers** in hot paths
2. **All timing values** have named constants
3. **All distances/sizes** have named constants
4. **All multipliers** have named constants with comments
5. **Tests pass** - values unchanged, just named

---

## Files to Create

- `src/config/effects.config.ts`
- `src/config/combat.config.ts`
- `src/config/waves.config.ts`
- `src/config/ai.config.ts`

## Files to Modify

- `src/core/Game.ts` - Use SCREEN_SHAKE constants
- `src/systems/combatSystem.ts` - Use BEAM_EFFECTS constants
- `src/systems/aiSystem.ts` - Use AI behavior constants
- `src/game/waveManager.ts` - Use WAVE_SPAWNING constants
- `src/rendering/ParticleSystem.ts` - Use PARTICLE_EFFECTS constants
- `src/config/index.ts` - Export new config files
