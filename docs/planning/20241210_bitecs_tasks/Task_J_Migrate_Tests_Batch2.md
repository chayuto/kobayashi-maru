# Task J: Migrate Test Files (Batch 2)

**Goal:** Fix `addComponent` parameter order in the remaining test files.

**Prerequisites:** Task B

**Files to Modify:**
- `src/__tests__/HUDManager.test.ts`
- `src/__tests__/HapticManager.test.ts`
- `src/__tests__/InputManager.test.ts`
- `src/__tests__/MessageLog.test.ts`
- `src/__tests__/movementSystem.test.ts`
- `src/__tests__/ParticleSystem.enhanced.test.ts`
- `src/__tests__/ParticleSystem.test.ts`
- `src/__tests__/pathfinding.test.ts`
- `src/__tests__/PauseOverlay.test.ts`
- `src/__tests__/PerformanceMonitor.test.ts`
- `src/__tests__/PlacementManager.test.ts`
- `src/__tests__/projectileSystem.test.ts`
- `src/__tests__/renderSystem.test.ts`
- `src/__tests__/resourceManager.test.ts`
- `src/__tests__/ResponsiveUIManager.test.ts`
- `src/__tests__/rotationSystem.test.ts`
- `src/__tests__/scoreManager.test.ts`
- `src/__tests__/ShieldRenderer.test.ts`
- `src/__tests__/ShockwaveRenderer.test.ts`
- `src/__tests__/spatialHash.test.ts`
- `src/__tests__/StorageService.test.ts`
- `src/__tests__/SystemManager.test.ts`
- `src/__tests__/targetingSystem.test.ts`
- `src/__tests__/turret.test.ts`
- `src/__tests__/turretUpgradePanel.integration.test.ts`
- `src/__tests__/turretUpgradeVisuals.test.ts`
- `src/__tests__/upgradeManager.test.ts`
- `src/__tests__/waveSpawner.test.ts`

*(Note: Adjust list based on remaining files)*

**Steps:**
1. Open each file.
2. Replace `addComponent(world, Component, eid)` with `addComponent(world, eid, Component)`.

**Verification:**
- `npm test` runs all tests successfully.
