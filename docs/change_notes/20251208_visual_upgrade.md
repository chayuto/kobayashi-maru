# Change Note: Ship and Enemy UI Upgrade

**Date:** 2025-12-08
**Author:** Antigravity (AI Agent)
**Focus:** Visuals, Rendering Engine, ECS Systems

## Summary
A significant graphical and behavioral upgrade for all ship and turret entities. The rendering system was enhanced to support rotation, enabling dynamic aiming for turrets and movement-based facing for enemies. Visuals were completely overhauled from simple 16px primitives to detailed 32px programmatic vector designs.

## Key Changes

### 1. Visual Overhaul (Textures)
- **Resolution**: Increased base texture size from 16x16 to 32x32 (ships) and 28x28 (turrets).
- **Design**: Replaced simple shapes (circles, squares) with complex, faction-specific vector geometry.
  - **Klingon**: Swept-wing Bird of Prey design.
  - **Romulan**: Crescent Warbird with cloaking emitter details.
  - **Borg**: Detailed Cube with grid lines and energy nodes.
  - **Tholian**: Faceted crystal shard geometry.
  - **Species 8472**: Organic, bio-luminescent Y-shape.
  - **Turrets**: Distinct visual designs for Phaser, Torpedo, and Disruptor turrets, featuring base and barrel distinction.

### 2. Engine & ECS Updates
- **New Component**: Added `Rotation` component (`angle: f32`) to `src/ecs/components.ts`.
- **Sprite Manager**: Updated `src/rendering/spriteManager.ts` to enable `rotation: true` in PixiJS `ParticleContainer` configs and added `updateSpriteRotation` method.
- **Render System**: Modified `src/systems/renderSystem.ts` to sync the ECS `Rotation` component with the visual sprite's rotation every frame.

### 3. New Gameplay Systems
- **Turret Rotation**: Implemented `src/systems/turretRotationSystem.ts`. Turrets now actively rotate to track their locked targets, adding visual feedback to the targeting system.
- **Enemy Facing**: Implemented `src/systems/enemyRotationSystem.ts`. Enemy ships now orient themselves to face their direction of movement (velocity vector).

### 4. Integration
- **Entity Factories**: Updated `createTurret`, `createEnemy`, `createProjectile`, and `createKobayashiMaru` to initialize the `Rotation` component.
- **System Registration**: Registered the new rotation systems in `src/core/Game.ts` to run before the rendering phase.

## Verification
- **New Test Suite**: Created `src/__tests__/rotationSystem.test.ts` to verify:
  - Turrets calculate correct firing angles.
  - Enemies calculate correct movement facing angles.
  - Visual offsets (-90 degrees) are applied correctly for sprite orientation.
- **Updated Tests**: Updated `src/__tests__/renderSystem.test.ts` to mock and verify the new rotation syncing logic.
