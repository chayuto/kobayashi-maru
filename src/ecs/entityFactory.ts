/**
 * Entity Factory for Kobayashi Maru
 * Creates pre-configured entities with appropriate components
 * 
 * NOTE: Enemy ship creation now uses configuration-driven templates.
 * See entityTemplates.ts for enemy definitions and genericFactory.ts for the
 * createEnemy() function. The individual createXXXShip functions below are
 * thin wrappers maintained for backwards compatibility.
 */
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Faction, SpriteRef, Health, Shield, Turret, Target, Projectile, Collider, WeaponProperties, TurretUpgrade } from './components';
import { FactionId, TurretType, TURRET_CONFIG, ProjectileType, PROJECTILE_CONFIG, GAME_CONFIG } from '../types/constants';
import type { GameWorld } from './world';
import { incrementEntityCount } from './world';
import { createEnemy, createEnemyFromTemplate, createEnemies } from './genericFactory';
import { ENEMY_TEMPLATES, getEnemyTemplate, getEnemyFactionIds } from './entityTemplates';

// Re-export generic factory and templates for convenient access
export { createEnemy, createEnemyFromTemplate, createEnemies };
export { ENEMY_TEMPLATES, getEnemyTemplate, getEnemyFactionIds };

// Placeholder sprite index - will be replaced when sprite system is implemented
const PLACEHOLDER_SPRITE_INDEX = 0;

/**
 * Creates a Federation ship entity
 * @deprecated Use createEnemy(world, FactionId.FEDERATION, x, y) instead
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createFederationShip(world: GameWorld, x: number, y: number): number {
  return createEnemy(world, FactionId.FEDERATION, x, y);
}

/**
 * Creates a Klingon ship entity
 * @deprecated Use createEnemy(world, FactionId.KLINGON, x, y) instead
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createKlingonShip(world: GameWorld, x: number, y: number): number {
  return createEnemy(world, FactionId.KLINGON, x, y);
}

/**
 * Creates a Romulan ship entity
 * @deprecated Use createEnemy(world, FactionId.ROMULAN, x, y) instead
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createRomulanShip(world: GameWorld, x: number, y: number): number {
  return createEnemy(world, FactionId.ROMULAN, x, y);
}

/**
 * Creates a Borg ship entity
 * @deprecated Use createEnemy(world, FactionId.BORG, x, y) instead
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createBorgShip(world: GameWorld, x: number, y: number): number {
  return createEnemy(world, FactionId.BORG, x, y);
}

/**
 * Creates a Tholian ship entity
 * @deprecated Use createEnemy(world, FactionId.THOLIAN, x, y) instead
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createTholianShip(world: GameWorld, x: number, y: number): number {
  return createEnemy(world, FactionId.THOLIAN, x, y);
}

/**
 * Creates a Species 8472 ship entity
 * @deprecated Use createEnemy(world, FactionId.SPECIES_8472, x, y) instead
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createSpecies8472Ship(world: GameWorld, x: number, y: number): number {
  return createEnemy(world, FactionId.SPECIES_8472, x, y);
}



/**
 * Creates the Kobayashi Maru entity (center objective)
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createKobayashiMaru(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.FEDERATION;

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  addComponent(world, Health, eid);
  Health.current[eid] = 500;
  Health.max[eid] = 500;

  addComponent(world, Shield, eid);
  Shield.current[eid] = 200;
  Shield.max[eid] = 200;

  // Add basic defense weapon to Kobayashi Maru
  addComponent(world, Turret, eid);
  Turret.range[eid] = GAME_CONFIG.KOBAYASHI_MARU_DEFENSE_RANGE;
  Turret.fireRate[eid] = GAME_CONFIG.KOBAYASHI_MARU_DEFENSE_FIRE_RATE;
  Turret.damage[eid] = GAME_CONFIG.KOBAYASHI_MARU_DEFENSE_DAMAGE;
  Turret.lastFired[eid] = 0;
  Turret.turretType[eid] = TurretType.DISRUPTOR_BANK; // Use disruptor type for main ship

  addComponent(world, Target, eid);
  Target.entityId[eid] = 0;
  Target.hasTarget[eid] = 0;
  Target.entityId2[eid] = 0;
  Target.hasTarget2[eid] = 0;
  Target.entityId3[eid] = 0;
  Target.hasTarget3[eid] = 0;

  incrementEntityCount();
  return eid;
}

/**
 * Creates a turret entity
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @param turretType - Type of turret to create
 * @returns Entity ID
 */
export function createTurret(world: GameWorld, x: number, y: number, turretType: number): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.FEDERATION;

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  // Get turret stats based on type
  const config = TURRET_CONFIG[turretType] || TURRET_CONFIG[TurretType.PHASER_ARRAY];

  addComponent(world, Health, eid);
  Health.current[eid] = config.health;
  Health.max[eid] = config.health;

  addComponent(world, Shield, eid);
  Shield.current[eid] = config.shield;
  Shield.max[eid] = config.shield;

  addComponent(world, Turret, eid);
  Turret.range[eid] = config.range;
  Turret.fireRate[eid] = config.fireRate;
  Turret.damage[eid] = config.damage;
  Turret.lastFired[eid] = 0;
  Turret.turretType[eid] = turretType;

  addComponent(world, Target, eid);
  Target.entityId[eid] = 0;
  Target.hasTarget[eid] = 0;
  Target.entityId2[eid] = 0;
  Target.hasTarget2[eid] = 0;
  Target.entityId3[eid] = 0;
  Target.hasTarget3[eid] = 0;

  // Add upgrade component to all turrets (starts at level 0)
  addComponent(world, TurretUpgrade, eid);
  TurretUpgrade.damageLevel[eid] = 0;
  TurretUpgrade.rangeLevel[eid] = 0;
  TurretUpgrade.fireRateLevel[eid] = 0;
  TurretUpgrade.multiTargetLevel[eid] = 0;
  TurretUpgrade.specialLevel[eid] = 0;

  // Add weapon properties for special turrets
  if (turretType === TurretType.TETRYON_BEAM) {
    // Tetryon: 3x shield damage, 0.5x hull damage
    addComponent(world, WeaponProperties, eid);
    WeaponProperties.shieldDamageMultiplier[eid] = 3.0;
    WeaponProperties.hullDamageMultiplier[eid] = 0.5;
    WeaponProperties.critChance[eid] = 0;
    WeaponProperties.critMultiplier[eid] = 1.0;
    WeaponProperties.aoeRadius[eid] = 0;
    WeaponProperties.statusEffectType[eid] = 0; // No status effect
    WeaponProperties.statusEffectChance[eid] = 0;
  } else if (turretType === TurretType.PLASMA_CANNON) {
    // Plasma: Applies burning (4 dmg/sec for 5 seconds)
    addComponent(world, WeaponProperties, eid);
    WeaponProperties.shieldDamageMultiplier[eid] = 1.0;
    WeaponProperties.hullDamageMultiplier[eid] = 1.0;
    WeaponProperties.critChance[eid] = 0;
    WeaponProperties.critMultiplier[eid] = 1.0;
    WeaponProperties.aoeRadius[eid] = 0;
    WeaponProperties.statusEffectType[eid] = 1; // Burn
    WeaponProperties.statusEffectChance[eid] = 1.0; // 100% chance
  } else if (turretType === TurretType.POLARON_BEAM) {
    // Polaron: Stacking drain effect
    addComponent(world, WeaponProperties, eid);
    WeaponProperties.shieldDamageMultiplier[eid] = 1.0;
    WeaponProperties.hullDamageMultiplier[eid] = 1.0;
    WeaponProperties.critChance[eid] = 0;
    WeaponProperties.critMultiplier[eid] = 1.0;
    WeaponProperties.aoeRadius[eid] = 0;
    WeaponProperties.statusEffectType[eid] = 3; // Drain
    WeaponProperties.statusEffectChance[eid] = 1.0; // 100% chance
  }

  incrementEntityCount();
  return eid;
}

/**
 * Creates a projectile entity
 * @param world - The ECS world
 * @param x - Starting X position
 * @param y - Starting Y position
 * @param targetX - Target X position
 * @param targetY - Target Y position
 * @param damage - Damage to deal on impact
 * @param projectileType - Type of projectile
 * @param targetEntityId - Optional target entity ID for homing
 * @returns Entity ID
 */
export function createProjectile(
  world: GameWorld,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  damage: number,
  projectileType: number,
  targetEntityId: number = 0
): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  // Velocity will be set by the projectile system or caller
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Projectile, eid);
  Projectile.damage[eid] = damage;
  Projectile.projectileType[eid] = projectileType;
  Projectile.targetEntityId[eid] = targetEntityId;

  // Set config based on type
  const config = PROJECTILE_CONFIG[projectileType] || PROJECTILE_CONFIG[ProjectileType.PHOTON_TORPEDO];
  Projectile.speed[eid] = config.speed;
  Projectile.lifetime[eid] = config.lifetime;

  // Calculate initial velocity
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 0) {
    Velocity.x[eid] = (dx / dist) * config.speed;
    Velocity.y[eid] = (dy / dist) * config.speed;
  }

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.PROJECTILE; // Projectiles belong to Federation for now

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX; // Will be handled by sprite manager

  addComponent(world, Collider, eid);
  Collider.radius[eid] = config.size;
  Collider.layer[eid] = 2; // Projectile layer (need to define layers properly later)
  Collider.mask[eid] = 1;  // Collides with enemies (layer 1)

  incrementEntityCount();
  return eid;
}

/**
 * Creates an enemy projectile entity (fired by enemies toward Kobayashi Maru/turrets)
 * @param world - The ECS world
 * @param x - Starting X position
 * @param y - Starting Y position
 * @param targetX - Target X position
 * @param targetY - Target Y position
 * @param damage - Damage to deal on impact
 * @param projectileType - Type of projectile
 * @returns Entity ID
 */
export function createEnemyProjectile(
  world: GameWorld,
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  damage: number,
  projectileType: number
): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);

  addComponent(world, Projectile, eid);
  Projectile.damage[eid] = damage;
  Projectile.projectileType[eid] = projectileType;
  Projectile.targetEntityId[eid] = 0; // No homing for enemy projectiles

  // Set config based on type
  const config = PROJECTILE_CONFIG[projectileType] || PROJECTILE_CONFIG[ProjectileType.DISRUPTOR_BOLT];
  Projectile.speed[eid] = config.speed;
  Projectile.lifetime[eid] = config.lifetime;

  // Calculate initial velocity toward target
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 0) {
    Velocity.x[eid] = (dx / dist) * config.speed;
    Velocity.y[eid] = (dy / dist) * config.speed;
  }

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.ENEMY_PROJECTILE; // Enemy projectile faction

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  addComponent(world, Collider, eid);
  Collider.radius[eid] = config.size;
  Collider.layer[eid] = 3; // Enemy projectile layer
  Collider.mask[eid] = 0;  // Federation entities (layer 0)

  incrementEntityCount();
  return eid;
}
