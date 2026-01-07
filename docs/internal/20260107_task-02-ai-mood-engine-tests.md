# Task 02: AIMoodEngine Test Coverage

> **Priority**: P1 - High Impact, Easy Implementation
> **Estimated Time**: 25-35 minutes
> **Lines to Cover**: ~347 lines

## Objective

Add unit tests for `AIMoodEngine` class in `src/ai/humanization/AIMoodEngine.ts`.

## Why This Is a Quick Win

- Deterministic mood calculation based on game context
- No external system dependencies
- Clear priority-based mood determination logic
- Message generation is simple lookup with random selection

## Target File

`src/ai/humanization/AIMoodEngine.ts`

## Methods to Test

### 1. `calculateMood(context: MoodContext)`
- Returns `MoodResult` with mood and message
- Priority rules to test:
  - DESPERATE when KM health < 20%
  - STRESSED when threat > 70 OR coverage < 30%
  - DETERMINED when boss wave
  - FOCUSED when wave active and threat > 40
  - CONFIDENT when high coverage and low threat
  - CALM otherwise

### 2. `calculatePhase(waveNumber, isBossWave, kmHealthPercent)`
- Returns `AIPhase` based on game state
- Test cases:
  - DEFENSE phase when boss wave
  - DEFENSE phase when health critical
  - EARLY phase in first few waves
  - Progression through phases

### 3. `getPhaseFocus(phase)`
- Returns 'economy' | 'defense' | 'dps'
- Maps each phase to focus type

### 4. `reset()`
- Clears internal state

## Implementation Instructions

1. Create new test file: `src/__tests__/AIMoodEngine.test.ts`

2. Follow this structure:

```typescript
/**
 * Tests for AIMoodEngine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AIMoodEngine, MoodContext } from '../ai/humanization/AIMoodEngine';
import { AIMood, AIPhase, AIPersonality } from '../ai/types';

describe('AIMoodEngine', () => {
    let engine: AIMoodEngine;

    beforeEach(() => {
        engine = new AIMoodEngine();
    });

    describe('calculateMood', () => {
        it('should return DESPERATE when health is critical', () => {
            const context: MoodContext = {
                threatLevel: 50,
                coveragePercent: 50,
                kmHealthPercent: 15,  // Critical!
                resources: 500,
                waveNumber: 5,
                isBossWave: false,
                personality: AIPersonality.ADAPTIVE
            };

            const result = engine.calculateMood(context);
            expect(result.mood).toBe(AIMood.DESPERATE);
            expect(result.message).toBeTruthy();
        });

        it('should return STRESSED when threat is very high', () => {
            const context: MoodContext = {
                threatLevel: 80,  // High threat!
                coveragePercent: 60,
                kmHealthPercent: 70,
                resources: 500,
                waveNumber: 5,
                isBossWave: false,
                personality: AIPersonality.DEFENSIVE
            };

            const result = engine.calculateMood(context);
            expect(result.mood).toBe(AIMood.STRESSED);
        });

        it('should return DETERMINED during boss wave', () => {
            const context: MoodContext = {
                threatLevel: 50,
                coveragePercent: 60,
                kmHealthPercent: 70,
                resources: 500,
                waveNumber: 5,
                isBossWave: true,  // Boss wave!
                personality: AIPersonality.AGGRESSIVE
            };

            const result = engine.calculateMood(context);
            expect(result.mood).toBe(AIMood.DETERMINED);
        });

        it('should return CONFIDENT when stable and well-covered', () => {
            const context: MoodContext = {
                threatLevel: 20,  // Low threat
                coveragePercent: 85,  // High coverage
                kmHealthPercent: 90,  // Healthy
                resources: 800,
                waveNumber: 3,
                isBossWave: false,
                personality: AIPersonality.BALANCED
            };

            const result = engine.calculateMood(context);
            expect(result.mood).toBe(AIMood.CONFIDENT);
        });

        it('should return CALM when no active threats', () => {
            const context: MoodContext = {
                threatLevel: 0,  // No threats
                coveragePercent: 50,
                kmHealthPercent: 100,
                resources: 200,
                waveNumber: 1,
                isBossWave: false,
                personality: AIPersonality.ADAPTIVE
            };

            const result = engine.calculateMood(context);
            expect(result.mood).toBe(AIMood.CALM);
        });

        it('should return messages appropriate to personality', () => {
            const context: MoodContext = {
                threatLevel: 80,
                coveragePercent: 40,
                kmHealthPercent: 50,
                resources: 300,
                waveNumber: 6,
                isBossWave: false,
                personality: AIPersonality.AGGRESSIVE
            };

            const result = engine.calculateMood(context);
            expect(result.message).toBeTruthy();
            expect(typeof result.message).toBe('string');
        });
    });

    describe('calculatePhase', () => {
        it('should return DEFENSE phase during boss wave', () => {
            const phase = engine.calculatePhase(5, true, 80);
            expect(phase).toBe(AIPhase.DEFENSE);
        });

        it('should return DEFENSE phase when health critical', () => {
            const phase = engine.calculatePhase(5, false, 15);
            expect(phase).toBe(AIPhase.DEFENSE);
        });

        it('should return EARLY phase in first waves', () => {
            const phase = engine.calculatePhase(1, false, 100);
            expect(phase).toBe(AIPhase.EARLY);
        });
    });

    describe('getPhaseFocus', () => {
        it('should return economy for EARLY phase', () => {
            expect(engine.getPhaseFocus(AIPhase.EARLY)).toBe('economy');
        });

        it('should return defense for DEFENSE phase', () => {
            expect(engine.getPhaseFocus(AIPhase.DEFENSE)).toBe('defense');
        });

        it('should return dps for DPS phase', () => {
            expect(engine.getPhaseFocus(AIPhase.DPS)).toBe('dps');
        });
    });

    describe('reset', () => {
        it('should reset internal state', () => {
            // Trigger some internal state change
            engine.calculateMood({
                threatLevel: 80,
                coveragePercent: 30,
                kmHealthPercent: 15,
                resources: 100,
                waveNumber: 10,
                isBossWave: true,
                personality: AIPersonality.AGGRESSIVE
            });

            engine.reset();

            // After reset, should be back to initial state
            // Calculate mood again - it should work normally
            const result = engine.calculateMood({
                threatLevel: 0,
                coveragePercent: 50,
                kmHealthPercent: 100,
                resources: 200,
                waveNumber: 1,
                isBossWave: false,
                personality: AIPersonality.ADAPTIVE
            });

            expect(result.mood).toBe(AIMood.CALM);
        });
    });
});
```

## Verification

Run the test:

```bash
npx vitest run src/__tests__/AIMoodEngine.test.ts
```

Expected: All tests pass, covering mood determination and phase calculation.

## Dependencies

- Vitest (already installed)
- `AIMood`, `AIPhase`, `AIPersonality` from `src/ai/types`

## Notes

- Message selection is random, so we only verify messages are non-empty strings
- Mood stability feature might affect consecutive calls - reset between tests
