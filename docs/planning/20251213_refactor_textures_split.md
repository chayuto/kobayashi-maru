# Refactoring: Split textures.ts

## Overview
Split 30KB `textures.ts` file (~800 lines) into logical modules by entity type.

**Effort:** ~1 hour | **Impact:** Medium

---

## Current State

Single file contains all texture generation:
- [textures.ts](file:///Users/chayut/repos/kobayashi-maru/src/rendering/textures.ts) - 30KB

## Proposed Structure

```
src/rendering/textures/
├── index.ts              # Barrel exports
├── turretTextures.ts     # Turret visuals
├── enemyTextures.ts      # Enemy faction sprites
├── projectileTextures.ts # Torpedoes, bolts, etc.
├── effectTextures.ts     # Particles, explosions
└── uiTextures.ts         # UI elements
```

---

## Steps

1. [ ] Create `src/rendering/textures/` directory
2. [ ] Extract turret-related functions to `turretTextures.ts`
3. [ ] Extract enemy-related functions to `enemyTextures.ts`
4. [ ] Extract projectile functions to `projectileTextures.ts`
5. [ ] Extract effect functions to `effectTextures.ts`
6. [ ] Create `index.ts` with barrel exports
7. [ ] Update imports in consuming files
8. [ ] Verify: lint and tests pass

---

## Verification

```bash
npm run lint
npm test -- --run
```
