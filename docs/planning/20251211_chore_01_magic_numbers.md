# Chore Task 01: Extract Magic Numbers to Config

**Date:** 2025-12-11  
**Priority:** P1 (High Impact, Low Risk)  
**Estimated Effort:** 2 hours  
**Risk Level:** LOW - No behavior change, only extraction

---

## Problem Statement

Magic numbers are scattered throughout the codebase, making it difficult to:
- Understand game balance at a glance
- Modify values consistently
- AI agents to suggest appropriate values

### Examples Found

```typescript
// src/systems/aiSystem.ts:145
const speed = Math.sqrt(...) || 100; // What is 100?

// src/systems/aiSystem.ts:220
const flankFactor = Math.min(1, dist / 500); // Why 500?

// src/rendering/Starfield.ts:64
public update(deltaTime: number, speedX: number = 0, speedY: number = 100)

// src/game/spawnPoints.ts:73
export function getClusterPositions(count: number, clusterRadius: number = 100)

// src/services/ErrorService.ts:82
private static maxLogSize = 100;

// src/abilitySystem.ts:463
const margin = 200;
const safeDistance = ABILITY_CONFIG[AbilityType.TELEPORT].range ?? 300;
```

---

## Solution

Add new config sections to existing config files and update references.

---

## Implementation

### Step 1: Add AI Config Section

**File:** `src/config/ai.config.ts` (NEW)

```typescript
/**
 * AI System Configuration
 * 
 * Settings for enemy AI behavior patterns.
 * 
 * @module config/ai
 */

export const AI_CONFIG = {
    /**
     * Default movement speeds (pixels per second)
     */
    SPEED: {
        /** Default speed when velocity is zero */
        DEFAULT: 100,
        /** Romulan strafe behavior base speed */
        STRAFE: 80,
        /** Borg swarm behavior base speed */
        SWARM: 90,
        /** Klingon flank behavior base speed */
        FLANK: 120,
    },

    /**
     * Behavior-specific parameters
     */
    BEHAVIOR: {
        /** Distance threshold for flank angle calculation */
        FLANK_DISTANCE_THRESHOLD: 500,
        /** Strafe oscillation frequency (Hz) */
        STRAFE_FREQUENCY: 3,
        /** Strafe oscillation amplitude (0-1) */
        STRAFE_AMPLITUDE: 0.5,
        /** Swarm noise frequency */
        SWARM_NOISE_FREQUENCY: 0.5,
        /** Swarm noise amplitude */
        SWARM_NOISE_AMPLITUDE: 0.2,
    },

    /**
     * Teleport ability safe positioning
     */
    TELEPORT: {
        /** Margin from screen edges */
        EDGE_MARGIN: 200,
        /** Maximum teleport attempts before fallback */
        MAX_ATTEMPTS: 10,
    },
} as const;

export type AIConfig = typeof AI_CONFIG;
```

### Step 2: Add Rendering Config Section

**File:** `src/config/rendering.config.ts` (UPDATE)

Add to existing file:

```typescript
// Add to RENDERING_CONFIG
export const RENDERING_CONFIG = {
    // ... existing config ...

    /**
     * Starfield settings
     */
    STARFIELD: {
        /** Default vertical scroll speed (pixels per second) */
        DEFAULT_SCROLL_SPEED_Y: 100,
        /** Default horizontal scroll speed */
        DEFAULT_SCROLL_SPEED_X: 0,
        /** Background layer star count multiplier */
        LAYER_BACKGROUND_COUNT: 50,
        /** Midground layer star count multiplier */
        LAYER_MIDGROUND_COUNT: 100,
        /** Foreground layer star count multiplier */
        LAYER_FOREGROUND_COUNT: 150,
    },
} as const;
```

### Step 3: Add Spawn Config Section

**File:** `src/config/wave.config.ts` (UPDATE)

Add to existing WAVE_CONFIG:

```typescript
export const WAVE_CONFIG = {
    // ... existing config ...

    /**
     * Spawn formation settings
     */
    FORMATION: {
        /** Default cluster radius for grouped spawns */
        DEFAULT_CLUSTER_RADIUS: 100,
        /** V-formation spacing */
        V_FORMATION_SPACING: 50,
    },
} as const;
```

### Step 4: Add Error Service Config

**File:** `src/config/performance.config.ts` (UPDATE)

Add to existing file:

```typescript
export const PERFORMANCE_CONFIG = {
    // ... existing config ...

    /**
     * Error logging settings
     */
    ERROR_LOG: {
        /** Maximum error log entries to keep */
        MAX_SIZE: 100,
    },
} as const;
```

### Step 5: Update Config Index

**File:** `src/config/index.ts` (UPDATE)

```typescript
export * from './combat.config';
export * from './rendering.config';
export * from './ui.config';
export * from './wave.config';
export * from './performance.config';
export * from './score.config';
export * from './ai.config';  // NEW
```

---

## Files to Update

### `src/systems/aiSystem.ts`

```typescript
// Before
const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy) || 100;

// After
import { AI_CONFIG } from '../config';
const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy) || AI_CONFIG.SPEED.DEFAULT;
```

```typescript
// Before
const flankFactor = Math.min(1, dist / 500);

// After
const flankFactor = Math.min(1, dist / AI_CONFIG.BEHAVIOR.FLANK_DISTANCE_THRESHOLD);
```

### `src/rendering/Starfield.ts`

```typescript
// Before
public update(deltaTime: number, speedX: number = 0, speedY: number = 100): void {

// After
import { RENDERING_CONFIG } from '../config';
public update(
    deltaTime: number, 
    speedX: number = RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_X, 
    speedY: number = RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_Y
): void {
```

### `src/game/spawnPoints.ts`

```typescript
// Before
export function getClusterPositions(count: number, clusterRadius: number = 100): SpawnPosition[] {

// After
import { WAVE_CONFIG } from '../config';
export function getClusterPositions(
    count: number, 
    clusterRadius: number = WAVE_CONFIG.FORMATION.DEFAULT_CLUSTER_RADIUS
): SpawnPosition[] {
```

### `src/services/ErrorService.ts`

```typescript
// Before
private static maxLogSize = 100;

// After
import { PERFORMANCE_CONFIG } from '../config';
private static maxLogSize = PERFORMANCE_CONFIG.ERROR_LOG.MAX_SIZE;
```

### `src/systems/abilitySystem.ts`

```typescript
// Before
const margin = 200;

// After
import { AI_CONFIG } from '../config';
const margin = AI_CONFIG.TELEPORT.EDGE_MARGIN;
```

---

## Test Coverage Required

### New Test File: `src/__tests__/config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { AI_CONFIG, RENDERING_CONFIG, WAVE_CONFIG, PERFORMANCE_CONFIG } from '../config';

describe('Configuration', () => {
    describe('AI_CONFIG', () => {
        it('should have valid speed defaults', () => {
            expect(AI_CONFIG.SPEED.DEFAULT).toBeGreaterThan(0);
            expect(AI_CONFIG.SPEED.STRAFE).toBeGreaterThan(0);
            expect(AI_CONFIG.SPEED.SWARM).toBeGreaterThan(0);
            expect(AI_CONFIG.SPEED.FLANK).toBeGreaterThan(0);
        });

        it('should have valid behavior parameters', () => {
            expect(AI_CONFIG.BEHAVIOR.FLANK_DISTANCE_THRESHOLD).toBeGreaterThan(0);
            expect(AI_CONFIG.BEHAVIOR.STRAFE_FREQUENCY).toBeGreaterThan(0);
            expect(AI_CONFIG.BEHAVIOR.STRAFE_AMPLITUDE).toBeGreaterThan(0);
            expect(AI_CONFIG.BEHAVIOR.STRAFE_AMPLITUDE).toBeLessThanOrEqual(1);
        });

        it('should have valid teleport settings', () => {
            expect(AI_CONFIG.TELEPORT.EDGE_MARGIN).toBeGreaterThan(0);
            expect(AI_CONFIG.TELEPORT.MAX_ATTEMPTS).toBeGreaterThan(0);
        });
    });

    describe('RENDERING_CONFIG.STARFIELD', () => {
        it('should have valid starfield settings', () => {
            expect(RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_Y).toBeGreaterThan(0);
            expect(RENDERING_CONFIG.STARFIELD.LAYER_BACKGROUND_COUNT).toBeGreaterThan(0);
        });
    });

    describe('WAVE_CONFIG.FORMATION', () => {
        it('should have valid formation settings', () => {
            expect(WAVE_CONFIG.FORMATION.DEFAULT_CLUSTER_RADIUS).toBeGreaterThan(0);
        });
    });

    describe('PERFORMANCE_CONFIG.ERROR_LOG', () => {
        it('should have valid error log settings', () => {
            expect(PERFORMANCE_CONFIG.ERROR_LOG.MAX_SIZE).toBeGreaterThan(0);
        });
    });
});
```

---

## Verification Checklist

- [ ] Create `src/config/ai.config.ts`
- [ ] Update `src/config/rendering.config.ts`
- [ ] Update `src/config/wave.config.ts`
- [ ] Update `src/config/performance.config.ts`
- [ ] Update `src/config/index.ts`
- [ ] Update `src/systems/aiSystem.ts`
- [ ] Update `src/rendering/Starfield.ts`
- [ ] Update `src/game/spawnPoints.ts`
- [ ] Update `src/services/ErrorService.ts`
- [ ] Update `src/systems/abilitySystem.ts`
- [ ] Create `src/__tests__/config.test.ts`
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] Game behavior unchanged (manual verification)

---

## AI Agent Instructions

1. Create the new `ai.config.ts` file
2. Update existing config files with new sections
3. Update each source file to import from config
4. Create the test file
5. Run verification commands
6. Do NOT change any actual values - only extract them
