/**
 * Enemy Combat System for Kobayashi Maru
 * Handles enemy projectile shooting toward the target (Kobayashi Maru)
 */
import { query, hasComponent, World } from 'bitecs';
import { Position, EnemyWeapon, Health, Faction, AIBehavior } from '../ecs/components';
import { FactionId, GAME_CONFIG } from '../types/constants';
import { createEnemyProjectile } from '../ecs/entityFactory';

/**
 * Creates the enemy combat system that handles enemy shooting
 * @param getKobayashiMaruId - Function to get the Kobayashi Maru entity ID
 * @returns A system function that processes enemy combat
 */
export function createEnemyCombatSystem(getKobayashiMaruId?: () => number) {
  const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
  const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

  function enemyCombatSystem(world: World, _deltaTime: number, currentTime: number): World {
    // Get the target (Kobayashi Maru position or center)
    const kmId = getKobayashiMaruId?.() ?? -1;
    let targetX = centerX;
    let targetY = centerY;

    if (kmId !== -1 && hasComponent(world, kmId, Position)) {
      targetX = Position.x[kmId];
      targetY = Position.y[kmId];
    }

    const enemies = query(world, [Position, EnemyWeapon, Health, Faction, AIBehavior]);

    for (const eid of enemies) {
      // Skip dead enemies
      if (Health.current[eid] <= 0) continue;

      // Skip Federation entities (shouldn't happen, but safety check)
      if (Faction.id[eid] === FactionId.FEDERATION) continue;

      const enemyX = Position.x[eid];
      const enemyY = Position.y[eid];

      // Check range
      const dx = targetX - enemyX;
      const dy = targetY - enemyY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const range = EnemyWeapon.range[eid];

      if (dist > range) continue;

      // Check fire rate cooldown
      const fireRate = EnemyWeapon.fireRate[eid];
      if (fireRate <= 0) continue;

      const cooldown = 1 / fireRate;
      const lastFired = EnemyWeapon.lastFired[eid];

      if (currentTime - lastFired < cooldown) continue;

      // Fire projectile toward target
      const damage = EnemyWeapon.damage[eid];
      const projectileType = EnemyWeapon.projectileType[eid];

      createEnemyProjectile(world, enemyX, enemyY, targetX, targetY, damage, projectileType);

      // Update last fired time
      EnemyWeapon.lastFired[eid] = currentTime;
    }

    return world;
  }

  return {
    update: enemyCombatSystem
  };
}

export type EnemyCombatSystem = ReturnType<typeof createEnemyCombatSystem>;
