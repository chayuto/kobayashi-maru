/**
 * Entity Factory for Kobayashi Maru
 * Creates pre-configured entities with appropriate components
 */
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Faction, SpriteRef, Health, Shield, Turret, Target, AIBehavior } from './components';
import { FactionId, TurretType, TURRET_CONFIG, AIBehaviorType } from '../types/constants';
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

  // Tholian AI: Flank attack, tactical
  addComponent(world, AIBehavior, eid);
  AIBehavior.behaviorType[eid] = AIBehaviorType.FLANK;
  AIBehavior.aggression[eid] = 0.5;
  AIBehavior.stateTimer[eid] = 0;

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

  incrementEntityCount();
  return eid;
}
