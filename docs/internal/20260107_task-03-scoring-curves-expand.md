# Task 03: Expand ScoringCurves Test Coverage

> **Priority**: P1 - High Impact, Easy Implementation
> **Estimated Time**: 15-20 minutes
> **Lines to Cover**: ~50 additional lines

## Objective

Expand existing `ScoringCurves` tests in `UtilityAI.test.ts` to cover more PRESETS and edge cases.

## Why This Is a Quick Win

- Tests already exist - just need expansion
- Pure mathematical functions
- Deterministic outputs
- No mocking required

## Current Coverage

File: `src/__tests__/UtilityAI.test.ts`

Currently tested:
- ✅ `score()` returns 0-1 for all curve types
- ✅ `score()` inverts correctly
- ✅ `PRESETS.healthUrgency()`
- ✅ `PRESETS.threatResponse()`

## Missing Coverage

Need to add tests for:
- `PRESETS.distanceValue()`
- `PRESETS.resourceValue()`
- `PRESETS.coverageGap()`
- `PRESETS.waveTiming()`
- Edge cases for `score()` (negative values, values > max)

## Implementation Instructions

Add these tests to the existing `ScoringCurves` describe block in `src/__tests__/UtilityAI.test.ts`:

```typescript
// Add to existing describe('PRESETS', () => { ... })

it('should score distance with quadratic falloff', () => {
    const close = ScoringCurves.PRESETS.distanceValue(50, 500);
    const mid = ScoringCurves.PRESETS.distanceValue(250, 500);
    const far = ScoringCurves.PRESETS.distanceValue(450, 500);

    expect(close).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
    expect(close).toBeGreaterThan(0.8); // Close = high value
    expect(far).toBeLessThan(0.2); // Far = low value
});

it('should score resources linearly', () => {
    const low = ScoringCurves.PRESETS.resourceValue(100, 1000);
    const mid = ScoringCurves.PRESETS.resourceValue(500, 1000);
    const high = ScoringCurves.PRESETS.resourceValue(900, 1000);

    expect(low).toBeCloseTo(0.1);
    expect(mid).toBeCloseTo(0.5);
    expect(high).toBeCloseTo(0.9);
});

it('should score coverage gaps with exponential urgency', () => {
    const smallGap = ScoringCurves.PRESETS.coverageGap(10);
    const medGap = ScoringCurves.PRESETS.coverageGap(50);
    const largeGap = ScoringCurves.PRESETS.coverageGap(90);

    expect(smallGap).toBeLessThan(medGap);
    expect(medGap).toBeLessThan(largeGap);
    expect(largeGap).toBeGreaterThan(0.8); // Large gaps are urgent
});

it('should score wave timing with logistic curve', () => {
    const farAway = ScoringCurves.PRESETS.waveTiming(9000, 10000);
    const halfway = ScoringCurves.PRESETS.waveTiming(5000, 10000);
    const imminent = ScoringCurves.PRESETS.waveTiming(1000, 10000);

    expect(farAway).toBeLessThan(halfway);
    expect(halfway).toBeLessThan(imminent);
    expect(imminent).toBeGreaterThan(0.7); // Imminent = urgent
});

// Add to existing describe('score', () => { ... })

it('should clamp values below min to 0', () => {
    const score = ScoringCurves.score(-10, { type: 'linear', min: 0, max: 100 });
    expect(score).toBe(0);
});

it('should clamp values above max to 1', () => {
    const score = ScoringCurves.score(150, { type: 'linear', min: 0, max: 100 });
    expect(score).toBe(1);
});

it('should handle step curve threshold', () => {
    const below = ScoringCurves.score(0.4, { type: 'step', threshold: 0.5 });
    const at = ScoringCurves.score(0.5, { type: 'step', threshold: 0.5 });
    const above = ScoringCurves.score(0.6, { type: 'step', threshold: 0.5 });

    expect(below).toBe(0);
    expect(at).toBe(1);
    expect(above).toBe(1);
});

it('should handle custom steepness for logistic curve', () => {
    const gentle = ScoringCurves.score(0.5, { type: 'logistic', steepness: 2 });
    const steep = ScoringCurves.score(0.5, { type: 'logistic', steepness: 10 });

    // At midpoint (0.5), logistic should be around 0.5
    expect(gentle).toBeCloseTo(0.5, 1);
    expect(steep).toBeCloseTo(0.5, 1);
});
```

## Verification

Run the test file:

```bash
npx vitest run src/__tests__/UtilityAI.test.ts
```

Expected: All existing tests pass, plus new tests for PRESETS and edge cases.

## Dependencies

- Vitest (already installed)
- Existing test file structure

## Notes

- This is an expansion of existing tests, not a new file
- Maintains consistent testing patterns already established
