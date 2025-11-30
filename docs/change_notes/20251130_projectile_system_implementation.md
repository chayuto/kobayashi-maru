# Projectile System Implementation

**Date:** 2025-11-30
**Task:** Projectile System for Torpedo Launcher

## Summary
Implemented a projectile system where torpedo launchers fire visible projectiles instead of using instant-hit mechanics. This adds visual variety and gameplay depth, allowing for future mechanics like dodging or point-defense systems.

## Changes
- **ECS Components:** Added `Projectile` component (`damage`, `speed`, `lifetime`, `targetEntityId`, `projectileType`).
- **Constants:** Added `ProjectileType` enum and `PROJECTILE_CONFIG` for defining projectile properties. Added `FactionId.PROJECTILE` for rendering.
- **Entity Factory:** Added `createProjectile` function to spawn projectile entities.
- **Systems:**
  - Created `projectileSystem` to handle movement (lifetime), collision detection, and damage application.
  - Updated `combatSystem` to spawn projectiles for `TORPEDO_LAUNCHER` turrets.
  - Integrated `projectileSystem` into the main game loop in `Game.ts`.
- **Rendering:**
  - Added `createProjectileTexture` to generate a glowing orange circle texture.
  - Updated `SpriteManager` to handle the `PROJECTILE` faction and render projectiles.

## Verification
- **Unit Tests:** Added `src/__tests__/projectileSystem.test.ts` to verify:
  - Projectile movement (velocity).
  - Lifetime expiration and despawning.
  - Collision detection and damage application.
  - Friendly fire prevention (Federation ships ignored).
- **Manual Verification:** Verified that torpedo launchers now fire visible orange projectiles that travel to targets and deal damage on impact.
