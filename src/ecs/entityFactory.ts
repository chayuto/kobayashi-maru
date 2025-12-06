/**
 * Entity Factory for Kobayashi Maru
 * Creates pre-configured entities with appropriate components
 */
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Faction, SpriteRef, Health, Shield, Turret, Target, AIBehavior, Projectile, Collider, WeaponProperties, EnemyWeapon, TurretUpgrade } from './components';
import { FactionId, TurretType, TURRET_CONFIG, AIBehaviorType, ProjectileType, PROJECTILE_CONFIG, GAME_CONFIG } from '../types/constants';
import type { GameWorld } from './world';
import { incrementEntityCount } from './world';

// Placeholder sprite index - will be replaced when sprite system is implemented
const PLACEHOLDER_SPRITE_INDEX = 0;

/**
 * Creates a Federation ship entity
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createFederationShip(world: GameWorld, x: number, y: number): number {
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
  Health.current[eid] = 100;
  Health.max[eid] = 100;

  addComponent(world, Shield, eid);
  Shield.current[eid] = 50;
  Shield.max[eid] = 50;

  incrementEntityCount();
  return eid;
}

/**
 * Creates a Klingon ship entity
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createKlingonShip(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.KLINGON;

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  addComponent(world, Health, eid);
  Health.current[eid] = 80;
  Health.max[eid] = 80;

  addComponent(world, Shield, eid);
  Shield.current[eid] = 30;
  Shield.max[eid] = 30;

  // Klingon AI: Direct attack, very aggressive
  addComponent(world, AIBehavior, eid);
  AIBehavior.behaviorType[eid] = AIBehaviorType.DIRECT;
  AIBehavior.aggression[eid] = 1.0;
  AIBehavior.stateTimer[eid] = 0;

  incrementEntityCount();
  return eid;
}

/**
 * Creates a Romulan ship entity
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createRomulanShip(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.ROMULAN;

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  addComponent(world, Health, eid);
  Health.current[eid] = 70;
  Health.max[eid] = 70;

  addComponent(world, Shield, eid);
  Shield.current[eid] = 60;
  Shield.max[eid] = 60;

  // Romulan AI: Strafe attack, cautious
  addComponent(world, AIBehavior, eid);
  AIBehavior.behaviorType[eid] = AIBehaviorType.STRAFE;
  AIBehavior.aggression[eid] = 0.6;
  AIBehavior.stateTimer[eid] = 0;

  incrementEntityCount();
  return eid;
}

/**
 * Creates a Borg ship entity
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createBorgShip(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.BORG;

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  addComponent(world, Health, eid);
  Health.current[eid] = 150;
  Health.max[eid] = 150;

  addComponent(world, Shield, eid);
  Shield.current[eid] = 100;
  Shield.max[eid] = 100;

  // Borg AI: Swarm attack, relentless
  addComponent(world, AIBehavior, eid);
  AIBehavior.behaviorType[eid] = AIBehaviorType.SWARM;
  AIBehavior.aggression[eid] = 0.8;
  AIBehavior.stateTimer[eid] = 0;

  incrementEntityCount();
  return eid;
}

/**
 * Creates a Tholian ship entity
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createTholianShip(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.THOLIAN;

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  addComponent(world, Health, eid);
  Health.current[eid] = 60;
  Health.max[eid] = 60;

  addComponent(world, Shield, eid);
  Shield.current[eid] = 40;
  Shield.max[eid] = 40;

  // Tholian AI: Orbit behavior - slow approach, then circle around and shoot
  addComponent(world, AIBehavior, eid);
  AIBehavior.behaviorType[eid] = AIBehaviorType.ORBIT;
  AIBehavior.aggression[eid] = 0.5;
  AIBehavior.stateTimer[eid] = 0;

  // Tholian weapon: Slow firing disruptor bolt
  addComponent(world, EnemyWeapon, eid);
  EnemyWeapon.range[eid] = 350;        // Can shoot while orbiting
  EnemyWeapon.fireRate[eid] = 0.5;     // 1 shot every 2 seconds
  EnemyWeapon.damage[eid] = 15;        // Moderate damage
  EnemyWeapon.lastFired[eid] = 0;
  EnemyWeapon.projectileType[eid] = ProjectileType.DISRUPTOR_BOLT;

  incrementEntityCount();
  return eid;
}

/**
 * Creates a Species 8472 ship entity
 * @param world - The ECS world
 * @param x - X position
 * @param y - Y position
 * @returns Entity ID
 */
export function createSpecies8472Ship(world: GameWorld, x: number, y: number): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = FactionId.SPECIES_8472;

  addComponent(world, SpriteRef, eid);
  SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

  addComponent(world, Health, eid);
  Health.current[eid] = 200;
  Health.max[eid] = 200;

  addComponent(world, Shield, eid);
  Shield.current[eid] = 0;
  Shield.max[eid] = 0;

  // Species 8472 AI: Hunter attack, deadly
  addComponent(world, AIBehavior, eid);
  AIBehavior.behaviorType[eid] = AIBehaviorType.HUNTER;
  AIBehavior.aggression[eid] = 1.0;
  AIBehavior.stateTimer[eid] = 0;

  incrementEntityCount();
  return eid;
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
