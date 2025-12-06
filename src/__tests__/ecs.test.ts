/**
 * Tests for ECS components and entity factory
 */
import { describe, it, expect } from 'vitest';
import { hasComponent } from 'bitecs';
import { 
  createGameWorld,
  getEntityCount,
  createFederationShip,
  createKlingonShip,
  createRomulanShip,
  createBorgShip,
  createTholianShip,
  createSpecies8472Ship,
  createKobayashiMaru
} from '../ecs';
import { Position, Velocity, Faction, Health, Shield, Turret, Target } from '../ecs/components';
import { FactionId, GAME_CONFIG } from '../types/constants';

describe('ECS World', () => {
  it('should create a new world', () => {
    const world = createGameWorld();
    expect(world).toBeDefined();
    expect(getEntityCount()).toBe(0);
  });

  it('should track entity count correctly', () => {
    const world = createGameWorld();
    expect(getEntityCount()).toBe(0);
    
    createFederationShip(world, 100, 100);
    expect(getEntityCount()).toBe(1);
    
    createKlingonShip(world, 200, 200);
    expect(getEntityCount()).toBe(2);
  });
});

describe('Entity Factory - Federation Ships', () => {
  it('should create a Federation ship with correct components', () => {
    const world = createGameWorld();
    const eid = createFederationShip(world, 100, 200);
    
    expect(eid).toBeDefined();
    expect(Position.x[eid]).toBe(100);
    expect(Position.y[eid]).toBe(200);
    expect(Velocity.x[eid]).toBe(0);
    expect(Velocity.y[eid]).toBe(0);
    expect(Faction.id[eid]).toBe(FactionId.FEDERATION);
    expect(Health.current[eid]).toBe(100);
    expect(Health.max[eid]).toBe(100);
    expect(Shield.current[eid]).toBe(50);
    expect(Shield.max[eid]).toBe(50);
  });
});

describe('Entity Factory - Enemy Ships', () => {
  it('should create a Klingon ship with correct faction', () => {
    const world = createGameWorld();
    const eid = createKlingonShip(world, 50, 75);
    
    expect(Faction.id[eid]).toBe(FactionId.KLINGON);
    expect(Position.x[eid]).toBe(50);
    expect(Position.y[eid]).toBe(75);
    expect(Health.current[eid]).toBe(80);
    expect(Shield.current[eid]).toBe(30);
  });

  it('should create a Romulan ship with correct faction', () => {
    const world = createGameWorld();
    const eid = createRomulanShip(world, 300, 400);
    
    expect(Faction.id[eid]).toBe(FactionId.ROMULAN);
    expect(Health.current[eid]).toBe(70);
    expect(Shield.current[eid]).toBe(60);
  });

  it('should create a Borg ship with high health and shields', () => {
    const world = createGameWorld();
    const eid = createBorgShip(world, 500, 500);
    
    expect(Faction.id[eid]).toBe(FactionId.BORG);
    expect(Health.current[eid]).toBe(150);
    expect(Shield.current[eid]).toBe(100);
  });

  it('should create a Tholian ship with correct faction', () => {
    const world = createGameWorld();
    const eid = createTholianShip(world, 600, 700);
    
    expect(Faction.id[eid]).toBe(FactionId.THOLIAN);
    expect(Health.current[eid]).toBe(60);
    expect(Shield.current[eid]).toBe(40);
  });

  it('should create a Species 8472 ship with high health and no shields', () => {
    const world = createGameWorld();
    const eid = createSpecies8472Ship(world, 800, 900);
    
    expect(Faction.id[eid]).toBe(FactionId.SPECIES_8472);
    expect(Health.current[eid]).toBe(200);
    expect(Shield.current[eid]).toBe(0);
  });
});

describe('Entity Factory - Kobayashi Maru', () => {
  it('should create Kobayashi Maru with highest health and shields', () => {
    const world = createGameWorld();
    const eid = createKobayashiMaru(world, 960, 540);
    
    expect(Faction.id[eid]).toBe(FactionId.FEDERATION);
    expect(Position.x[eid]).toBe(960);
    expect(Position.y[eid]).toBe(540);
    expect(Health.current[eid]).toBe(500);
    expect(Health.max[eid]).toBe(500);
    expect(Shield.current[eid]).toBe(200);
    expect(Shield.max[eid]).toBe(200);
  });

  it('should create Kobayashi Maru with basic defense weapon', () => {
    const world = createGameWorld();
    const eid = createKobayashiMaru(world, 960, 540);
    
    // Verify Turret component exists
    expect(hasComponent(world, Turret, eid)).toBe(true);
    expect(Turret.range[eid]).toBe(GAME_CONFIG.KOBAYASHI_MARU_DEFENSE_RANGE);
    expect(Turret.fireRate[eid]).toBe(GAME_CONFIG.KOBAYASHI_MARU_DEFENSE_FIRE_RATE);
    expect(Turret.damage[eid]).toBe(GAME_CONFIG.KOBAYASHI_MARU_DEFENSE_DAMAGE);
    
    // Verify Target component exists
    expect(hasComponent(world, Target, eid)).toBe(true);
    expect(Target.hasTarget[eid]).toBe(0);
  });
});
