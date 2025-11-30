/**
 * Entity Factory for Kobayashi Maru
 * Creates pre-configured entities with appropriate components
 */
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Faction, SpriteRef, Health, Shield } from './components';
import { FactionId } from '../types/constants';
import type { GameWorld } from './world';

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
  SpriteRef.index[eid] = 0;
  
  addComponent(world, Health, eid);
  Health.current[eid] = 100;
  Health.max[eid] = 100;
  
  addComponent(world, Shield, eid);
  Shield.current[eid] = 50;
  Shield.max[eid] = 50;
  
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
  SpriteRef.index[eid] = 0;
  
  addComponent(world, Health, eid);
  Health.current[eid] = 80;
  Health.max[eid] = 80;
  
  addComponent(world, Shield, eid);
  Shield.current[eid] = 30;
  Shield.max[eid] = 30;
  
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
  SpriteRef.index[eid] = 0;
  
  addComponent(world, Health, eid);
  Health.current[eid] = 70;
  Health.max[eid] = 70;
  
  addComponent(world, Shield, eid);
  Shield.current[eid] = 60;
  Shield.max[eid] = 60;
  
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
  SpriteRef.index[eid] = 0;
  
  addComponent(world, Health, eid);
  Health.current[eid] = 150;
  Health.max[eid] = 150;
  
  addComponent(world, Shield, eid);
  Shield.current[eid] = 100;
  Shield.max[eid] = 100;
  
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
  SpriteRef.index[eid] = 0;
  
  addComponent(world, Health, eid);
  Health.current[eid] = 60;
  Health.max[eid] = 60;
  
  addComponent(world, Shield, eid);
  Shield.current[eid] = 40;
  Shield.max[eid] = 40;
  
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
  SpriteRef.index[eid] = 0;
  
  addComponent(world, Health, eid);
  Health.current[eid] = 200;
  Health.max[eid] = 200;
  
  addComponent(world, Shield, eid);
  Shield.current[eid] = 0;
  Shield.max[eid] = 0;
  
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
  SpriteRef.index[eid] = 0;
  
  addComponent(world, Health, eid);
  Health.current[eid] = 500;
  Health.max[eid] = 500;
  
  addComponent(world, Shield, eid);
  Shield.current[eid] = 200;
  Shield.max[eid] = 200;
  
  return eid;
}
