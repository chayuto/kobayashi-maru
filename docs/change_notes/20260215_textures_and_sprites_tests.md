# Textures & Sprites Tests (Batch 15)

**Date:** 2026-02-15
**File:** `src/__tests__/texturesAndSprites.test.ts`
**Tests:** 59

## Summary

Added comprehensive test coverage for the texture generation and sprite management subsystem, covering:

- **TextureCache** (singleton): get/set/has/clear/size/resetInstance operations
- **renderToTexture utility**: verifies RenderTexture creation, renderer.render call, and graphics cleanup
- **Faction texture creators**: all 8 faction/ship texture functions (Federation, KobayashiMaru, Klingon, Romulan, Borg, Tholian, Species8472, Projectile)
- **Turret texture creators**: all 12 turret base and barrel texture functions (Phaser, Torpedo, Disruptor, Tetryon, Plasma, Polaron)
- **createFactionTextures factory**: full texture atlas creation, TextureCache integration, and cached-return path
- **SpriteManager**: initialization, createSprite, updateSprite, updateSpriteRotation, setScale, removeSprite, particle pooling/reuse, destroy cleanup, edge cases (uninitialized access, unknown sprite types, non-existent indices)
- **TEXTURE_KEYS constants**: uniqueness validation

## Source Files Tested

| Source File | Coverage Area |
|---|---|
| `src/rendering/TextureCache.ts` | Singleton cache operations |
| `src/rendering/textures/factionTextures.ts` | 8 faction texture creators |
| `src/rendering/textures/turretTextures.ts` | 12 turret texture creators |
| `src/rendering/textures/createFactionTextures.ts` | Factory + caching logic |
| `src/rendering/textures/utils.ts` | renderToTexture helper |
| `src/rendering/textures/types.ts` | TEXTURE_KEYS constants |
| `src/rendering/spriteManager.ts` | Full SpriteManager lifecycle |

## Mock Strategy

Extended the shared `setupPixiMock()` with:
- `RenderTexture.create` static method (not in base mock)
- `renderer.render` method on MockApplication (not in base mock)
- `ellipse` and `bezierCurveTo` methods on MockGraphics (needed by KobayashiMaru and Species8472 textures)

## Validation

- `npm test -- texturesAndSprites`: 59/59 passing
- `npm run lint`: clean
- `npm run test`: no regressions introduced (3 pre-existing failures in unrelated files)
