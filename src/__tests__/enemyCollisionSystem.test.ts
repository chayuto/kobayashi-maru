/**
 * Tests for Enemy Collision System
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity, addComponent } from 'bitecs';
import { createEnemyCollisionSystem } from '../systems/enemyCollisionSystem';
import { Position, Health, Faction, AIBehavior, Shield } from '../ecs/components';
import { FactionId } from '../types/constants';

describe('EnemyCollisionSystem', () => {
  let world: ReturnType<typeof createWorld>;
  let kobayashiMaruId: number;
  let enemyCollisionSystem: ReturnType<typeof createEnemyCollisionSystem>;

  beforeEach(() => {
    world = createWorld();

    // Create Kobayashi Maru (Federation ship at center)
    kobayashiMaruId = addEntity(world);
    addComponent(world, Position, kobayashiMaruId);
    Position.x[kobayashiMaruId] = 960;  // Center X
    Position.y[kobayashiMaruId] = 540;  // Center Y
    addComponent(world, Health, kobayashiMaruId);
    Health.current[kobayashiMaruId] = 500;
    Health.max[kobayashiMaruId] = 500;
    addComponent(world, Shield, kobayashiMaruId);
    Shield.current[kobayashiMaruId] = 200;
    Shield.max[kobayashiMaruId] = 200;
    addComponent(world, Faction, kobayashiMaruId);
    Faction.id[kobayashiMaruId] = FactionId.FEDERATION;

    // Create collision system
    enemyCollisionSystem = createEnemyCollisionSystem(
      undefined,  // No particle system in tests
      () => kobayashiMaruId
    );
  });

  it('should not damage Kobayashi Maru when enemy is far away', () => {
    // Create enemy far from Kobayashi Maru
    const enemyId = addEntity(world);
    addComponent(world, Position, enemyId);
    Position.x[enemyId] = 100;  // Far from center
    Position.y[enemyId] = 100;
    addComponent(world, Health, enemyId);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, Faction, enemyId);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, AIBehavior, enemyId);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // Kobayashi Maru should not be damaged
    expect(Shield.current[kobayashiMaruId]).toBe(200);
    expect(Health.current[kobayashiMaruId]).toBe(500);
    // Enemy should still be alive
    expect(Health.current[enemyId]).toBe(50);
  });

  it('should damage Kobayashi Maru shield when enemy collides', () => {
    // Create enemy at Kobayashi Maru position (collision)
    const enemyId = addEntity(world);
    addComponent(world, Position, enemyId);
    Position.x[enemyId] = 960;  // Same position as Kobayashi Maru
    Position.y[enemyId] = 540;
    addComponent(world, Health, enemyId);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, Faction, enemyId);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, AIBehavior, enemyId);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // Kobayashi Maru shield should be damaged by collision damage (25)
    expect(Shield.current[kobayashiMaruId]).toBe(200 - 25);
    // Hull should not be damaged when shields absorb all damage
    expect(Health.current[kobayashiMaruId]).toBe(500);
    // Enemy should be killed (health set to 0)
    expect(Health.current[enemyId]).toBe(0);
  });

  it('should damage hull when shields are depleted', () => {
    // Deplete shields first
    Shield.current[kobayashiMaruId] = 10;

    // Create enemy at Kobayashi Maru position
    const enemyId = addEntity(world);
    addComponent(world, Position, enemyId);
    Position.x[enemyId] = 960;
    Position.y[enemyId] = 540;
    addComponent(world, Health, enemyId);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, Faction, enemyId);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, AIBehavior, enemyId);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // Shields should be depleted (10 - 25 = 0, clamped)
    expect(Shield.current[kobayashiMaruId]).toBe(0);
    // Hull should take remaining damage (25 - 10 = 15)
    expect(Health.current[kobayashiMaruId]).toBe(500 - 15);
  });

  it('should detect collision within collision radius', () => {
    // Create enemy just within collision radius (40 pixels)
    const enemyId = addEntity(world);
    addComponent(world, Position, enemyId);
    Position.x[enemyId] = 960 + 30;  // Within 40px radius
    Position.y[enemyId] = 540;
    addComponent(world, Health, enemyId);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, Faction, enemyId);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, AIBehavior, enemyId);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // Collision should occur
    expect(Health.current[enemyId]).toBe(0);
  });

  it('should not collide when just outside collision radius', () => {
    // Create enemy just outside collision radius (40 pixels)
    const enemyId = addEntity(world);
    addComponent(world, Position, enemyId);
    Position.x[enemyId] = 960 + 50;  // Outside 40px radius
    Position.y[enemyId] = 540;
    addComponent(world, Health, enemyId);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, Faction, enemyId);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, AIBehavior, enemyId);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // No collision should occur
    expect(Health.current[enemyId]).toBe(50);
  });

  it('should track destroyed entities this frame', () => {
    // Create enemy at collision point
    const enemyId = addEntity(world);
    addComponent(world, Position, enemyId);
    Position.x[enemyId] = 960;
    Position.y[enemyId] = 540;
    addComponent(world, Health, enemyId);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, Faction, enemyId);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, AIBehavior, enemyId);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    const destroyed = enemyCollisionSystem.getDestroyedThisFrame();
    expect(destroyed).toContain(enemyId);
  });

  it('should clear destroyed list between frames', () => {
    // Create first enemy
    const enemy1 = addEntity(world);
    addComponent(world, Position, enemy1);
    Position.x[enemy1] = 960;
    Position.y[enemy1] = 540;
    addComponent(world, Health, enemy1);
    Health.current[enemy1] = 50;
    Health.max[enemy1] = 50;
    addComponent(world, Faction, enemy1);
    Faction.id[enemy1] = FactionId.KLINGON;
    addComponent(world, AIBehavior, enemy1);
    AIBehavior.behaviorType[enemy1] = 0;

    // First frame
    enemyCollisionSystem.update(world);
    expect(enemyCollisionSystem.getDestroyedThisFrame()).toContain(enemy1);

    // Second frame (enemy1 is now dead with 0 health, should be skipped)
    enemyCollisionSystem.update(world);
    expect(enemyCollisionSystem.getDestroyedThisFrame()).toHaveLength(0);
  });

  it('should not damage Federation entities', () => {
    // Create a Federation turret near Kobayashi Maru (should not trigger collision)
    const turretId = addEntity(world);
    addComponent(world, Position, turretId);
    Position.x[turretId] = 960;
    Position.y[turretId] = 540;
    addComponent(world, Health, turretId);
    Health.current[turretId] = 50;
    Health.max[turretId] = 50;
    addComponent(world, Faction, turretId);
    Faction.id[turretId] = FactionId.FEDERATION;
    addComponent(world, AIBehavior, turretId);  // Even with AIBehavior
    AIBehavior.behaviorType[turretId] = 0;

    enemyCollisionSystem.update(world);

    // Federation entity should not be destroyed
    expect(Health.current[turretId]).toBe(50);
    // Kobayashi Maru should not be damaged
    expect(Shield.current[kobayashiMaruId]).toBe(200);
  });

  it('should handle multiple enemies colliding in same frame', () => {
    // Create multiple enemies at collision point
    const enemies = [];
    for (let i = 0; i < 3; i++) {
      const enemyId = addEntity(world);
      addComponent(world, Position, enemyId);
      Position.x[enemyId] = 960;
      Position.y[enemyId] = 540;
      addComponent(world, Health, enemyId);
      Health.current[enemyId] = 50;
      Health.max[enemyId] = 50;
      addComponent(world, Faction, enemyId);
      Faction.id[enemyId] = FactionId.KLINGON;
      addComponent(world, AIBehavior, enemyId);
      AIBehavior.behaviorType[enemyId] = 0;
      enemies.push(enemyId);
    }

    enemyCollisionSystem.update(world);

    // All enemies should be destroyed
    for (const enemyId of enemies) {
      expect(Health.current[enemyId]).toBe(0);
    }

    // Kobayashi Maru should take damage from all collisions (25 * 3 = 75)
    expect(Shield.current[kobayashiMaruId]).toBe(200 - 75);
  });
});
