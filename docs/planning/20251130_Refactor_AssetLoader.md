# Refactor: Generic Asset Loader

## Objective
Create a generic `AssetLoader` to handle loading textures, sounds, and data, replacing the hardcoded loading in `SpriteManager` and `Game.ts`.

## Context
Currently, assets are loaded somewhat implicitly or hardcoded in `SpriteManager` (`createFactionTextures`). There is no centralized way to know when all assets are ready or to add new assets easily.

## Requirements

### 1. Asset Manifest
- Define a JSON or object structure listing all assets:
  - Textures (paths, names)
  - Sounds (paths, names)
  - Data (config files)

### 2. AssetLoader (`src/core/AssetLoader.ts`)
- Wrapper around PixiJS `Assets` loader.
- Methods: `loadManifest(manifest)`, `getTexture(name)`, `getSound(name)`.
- Support for loading screens (progress events).

### 3. Refactor SpriteManager
- Remove texture generation/loading logic.
- Accept textures from `AssetLoader`.

## Acceptance Criteria
- [ ] `AssetLoader` implemented.
- [ ] `SpriteManager` is simplified.
- [ ] Game waits for assets to load before starting.
- [ ] Loading progress can be displayed.

## Files to Create/Modify
- `src/core/AssetLoader.ts` (NEW)
- `src/rendering/spriteManager.ts`
- `src/core/Game.ts`
