# Extract Combo Configuration - Chore Refactoring

**Date:** 2025-12-10  
**Type:** Quick Win Refactoring - Self-contained, Safe Change  
**Risk Level:** Low  
**Test Coverage:** Full (all 631 tests pass)

---

## Summary

Extracted `COMBO_TIERS` and `COMBO_TIMEOUT` constants from `scoreManager.ts` to a new centralized configuration file `score.config.ts`. This follows the project's established pattern for configuration (similar to `combat.config.ts`, `wave.config.ts`, etc.).

## Rationale

- **Maintainability**: Combo multiplier settings are now discoverable in the centralized config module
- **Consistency**: Follows the project's established configuration patterns
- **Documentation**: Added JSDoc documentation explaining the combo system
- **No Breaking Changes**: The `scoreManager.ts` public API is unchanged

## Changes Made

### New Files

| File | Description |
|------|-------------|
| `src/config/score.config.ts` | New config file with `SCORE_CONFIG.COMBO.TIMEOUT` and `SCORE_CONFIG.COMBO.TIERS` |

### Modified Files

| File | Change |
|------|--------|
| `src/config/index.ts` | Added export for `score.config.ts` and updated module documentation |
| `src/game/scoreManager.ts` | Replaced inline constants with imports from `SCORE_CONFIG` |

## Verification

- ✅ **Lint**: `npm run lint` passes with zero errors
- ✅ **Tests**: All 631 tests pass (48 test files)
- ✅ **Combo Tests**: `scoreManager.test.ts` verifies combo behavior at thresholds 3, 6, 10, 20

## Configuration Reference

The extracted configuration can now be imported from any module:

```typescript
import { SCORE_CONFIG } from '../config';

// Access combo timeout (3 seconds)
const timeout = SCORE_CONFIG.COMBO.TIMEOUT;

// Access combo tiers
for (const tier of SCORE_CONFIG.COMBO.TIERS) {
  console.log(`${tier.threshold} kills = ${tier.multiplier}x multiplier`);
}
```

## Future Considerations

Other potential candidates for similar config extraction identified during research:

1. **Rendering Colors**: 188+ inline hex colors in rendering files could be centralized
2. **Health Bar Colors**: `HealthBarRenderer.ts` has inline color constants (green/yellow/red)
3. **Shield Colors**: `ShieldRenderer.ts` has inline color thresholds

These would require adding test coverage first as the rendering files currently lack tests.
