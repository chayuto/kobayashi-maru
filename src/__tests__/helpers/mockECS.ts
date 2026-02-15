/**
 * Shared ECS mock infrastructure for tests
 * Extracted from renderSystem.test.ts — provides world setup/teardown and entity helpers
 */
import { createGameWorld, type GameWorld } from '../../ecs/world';
import { PoolManager } from '../../ecs/PoolManager';
import { createEnemy, createTurret, createKobayashiMaru, createProjectile } from '../../ecs/entityFactory';
import { FactionId, TurretType, ProjectileType } from '../../types/constants';

/**
 * Create a test world with PoolManager initialized.
 * Call `cleanupTestWorld()` in afterEach.
 */
export function createTestWorld(): GameWorld {
  const world = createGameWorld();
  PoolManager.getInstance().init(world);
  return world;
}

/**
 * Clean up PoolManager singleton after tests.
 */
export function cleanupTestWorld(): void {
  PoolManager.getInstance().destroy();
}

/**
 * Create a test enemy entity with default values.
 */
export function createTestEnemy(
  world: GameWorld,
  options: {
    faction?: number;
    x?: number;
    y?: number;
  } = {}
): number {
  const { faction = FactionId.KLINGON, x = 100, y = 100 } = options;
  return createEnemy(world, faction, x, y);
}

/**
 * Create a test turret entity with default values.
 */
export function createTestTurret(
  world: GameWorld,
  options: {
    x?: number;
    y?: number;
    turretType?: number;
  } = {}
): number {
  const { x = 400, y = 400, turretType = TurretType.PHASER_ARRAY } = options;
  return createTurret(world, x, y, turretType);
}

/**
 * Create the Kobayashi Maru entity with default center position.
 */
export function createTestKobayashiMaru(
  world: GameWorld,
  options: {
    x?: number;
    y?: number;
  } = {}
): number {
  const { x = 600, y = 400 } = options;
  return createKobayashiMaru(world, x, y);
}

/**
 * Create a test projectile entity with default values.
 */
export function createTestProjectile(
  world: GameWorld,
  options: {
    x?: number;
    y?: number;
    targetX?: number;
    targetY?: number;
    damage?: number;
    projectileType?: number;
  } = {}
): number {
  const {
    x = 100,
    y = 100,
    targetX = 600,
    targetY = 400,
    damage = 10,
    projectileType = ProjectileType.PHOTON_TORPEDO,
  } = options;
  return createProjectile(world, x, y, targetX, targetY, damage, projectileType);
}
