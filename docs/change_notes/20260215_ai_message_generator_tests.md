# AI Message Generator Tests

**Date:** 2026-02-15
**Type:** Test
**Scope:** `src/__tests__/aiMessageGenerator.test.ts`

## Summary

Added 32 tests for `AIMessageGenerator` (`src/ai/humanization/AIMessageGenerator.ts`) covering all public methods and code paths.

## Test Coverage

### Construction and Defaults (2 tests)
- Empty history on construction
- Default BALANCED personality message generation

### Placement Messages (6 tests)
- Non-empty messages for all 5 personalities
- Turret name inclusion for all 6 turret types
- Fallback "Turret" name for unknown turret type IDs
- Correct placement icon
- Aggressive personality keyword validation
- Defensive personality keyword validation

### Upgrade Messages (3 tests)
- Non-empty messages for all 5 personalities
- Correct upgrade icon
- Economic personality keyword validation

### Sell Messages (1 test)
- Fixed sell message regardless of personality

### Tactical Messages (3 tests)
- Non-empty messages for all 5 personalities
- Timestamp accuracy
- Adaptive personality keyword validation

### Special Event Messages (4 tests)
- Non-empty messages for waveCleared, bossSpawn, lowResources across all personalities
- Correct icon per event type
- Distinct message pools across different event types

### Message Structure (2 tests)
- AIMessage shape (text, icon, timestamp)
- Timestamp close to current time

### History Management (8 tests)
- Action, tactical, and special messages added to history
- Correct ordering in history
- 20-message history limit enforcement
- Oldest message eviction on overflow
- History returns a copy (not internal reference)
- clearHistory empties the history
- reset empties the history

### Personality Switching (1 test)
- Switching personality changes message pool entirely

## Validation

- `npm run lint` -- passed (0 errors)
- `npm test -- aiMessageGenerator` -- 32/32 passed
- `npm run test` -- 1207/1207 passed (78 test files, no regressions)
