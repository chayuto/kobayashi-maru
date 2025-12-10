# Consolidate Duplicate SPRITE_INDEX_UNSET Constant

**Date:** 2025-12-10  
**Author:** Chore AI Agent

## Summary
Consolidated duplicate `SPRITE_INDEX_UNSET = 0` constant definitions from 3 files to use the existing centralized `RENDERING_CONFIG.SPRITES.INDEX_UNSET` from the config module.

## Changes

| File | Change |
|------|--------|
| [renderSystem.ts](file:///Users/chayut/repos/kobayashi-maru/src/systems/renderSystem.ts) | Import config, use centralized constant |
| [damageSystem.ts](file:///Users/chayut/repos/kobayashi-maru/src/systems/damageSystem.ts) | Import config, use centralized constant |
| [UpgradeManager.ts](file:///Users/chayut/repos/kobayashi-maru/src/game/UpgradeManager.ts) | Import config, use centralized constant |

## Before/After

Before (duplicated in each file):
```typescript
const SPRITE_INDEX_UNSET = 0;
```

After (uses centralized config):
```typescript
import { RENDERING_CONFIG } from '../config';
const SPRITE_INDEX_UNSET = RENDERING_CONFIG.SPRITES.INDEX_UNSET;
```

## Verification

| Check | Result |
|-------|--------|
| `npm test` | ✅ 646 tests passed |
| `npm run lint` | ✅ Clean |

## Impact

- **Risk**: Low — Pure constant consolidation, value unchanged (0)
- **Maintainability**: Improved — Single source of truth for sprite index constant
