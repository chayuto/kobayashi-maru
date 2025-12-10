/**
 * Tests for Enemy Collision System
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity, addComponent } from 'bitecs';
import { createEnemyCollisionSystem } from '../systems/enemyCollisionSystem';
import { Position, Health, Faction, AIBehavior, Shield } from '../ecs/components';
import { FactionId, GAME_CONFIG } from '../types/constants';

describe('EnemyCollisionSystem', () => {
  let world: ReturnType<typeof createWorld>;
  let kobayashiMaruId: number;
  let enemyCollisionSystem: ReturnType<typeof createEnemyCollisionSystem>;

  // Use config values for tests
  const COLLISION_RADIUS = GAME_CONFIG.ENEMY_COLLISION_RADIUS;
  const COLLISION_DAMAGE = GAME_CONFIG.ENEMY_COLLISION_DAMAGE;

  beforeEach(() => {
    world = createWorld();

    // Create Kobayashi Maru (Federation ship at center)
    kobayashiMaruId = addEntity(world);
    addComponent(world, kobayashiMaruId, Position);
    Position.x[kobayashiMaruId] = 960;  // Center X
    Position.y[kobayashiMaruId] = 540;  // Center Y
    addComponent(world, kobayashiMaruId, Health);
    Health.current[kobayashiMaruId] = 500;
    Health.max[kobayashiMaruId] = 500;
    addComponent(world, kobayashiMaruId, Shield);
    Shield.current[kobayashiMaruId] = 200;
    Shield.max[kobayashiMaruId] = 200;
    addComponent(world, kobayashiMaruId, Faction);
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
    addComponent(world, enemyId, Position);
    Position.x[enemyId] = 100;  // Far from center
    Position.y[enemyId] = 100;
    addComponent(world, enemyId, Health);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, enemyId, Faction);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, enemyId, AIBehavior);
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
    addComponent(world, enemyId, Position);
    Position.x[enemyId] = 960;  // Same position as Kobayashi Maru
    Position.y[enemyId] = 540;
    addComponent(world, enemyId, Health);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, enemyId, Faction);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, enemyId, AIBehavior);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // Kobayashi Maru shield should be damaged by collision damage
    expect(Shield.current[kobayashiMaruId]).toBe(200 - COLLISION_DAMAGE);
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
    addComponent(world, enemyId, Position);
    Position.x[enemyId] = 960;
    Position.y[enemyId] = 540;
    addComponent(world, enemyId, Health);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, enemyId, Faction);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, enemyId, AIBehavior);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // Shields should be depleted (10 - COLLISION_DAMAGE = 0, clamped)
    expect(Shield.current[kobayashiMaruId]).toBe(0);
    // Hull should take remaining damage (COLLISION_DAMAGE - 10 = 15)
    expect(Health.current[kobayashiMaruId]).toBe(500 - (COLLISION_DAMAGE - 10));
  });

  it('should detect collision within collision radius', () => {
    // Create enemy just within collision radius
    const enemyId = addEntity(world);
    addComponent(world, enemyId, Position);
    Position.x[enemyId] = 960 + (COLLISION_RADIUS - 10);  // Within collision radius
    Position.y[enemyId] = 540;
    addComponent(world, enemyId, Health);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, enemyId, Faction);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, enemyId, AIBehavior);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // Collision should occur
    expect(Health.current[enemyId]).toBe(0);
  });

  it('should not collide when just outside collision radius', () => {
    // Create enemy just outside collision radius
    const enemyId = addEntity(world);
    addComponent(world, enemyId, Position);
    Position.x[enemyId] = 960 + (COLLISION_RADIUS + 10);  // Outside collision radius
    Position.y[enemyId] = 540;
    addComponent(world, enemyId, Health);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, enemyId, Faction);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, enemyId, AIBehavior);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    // No collision should occur
    expect(Health.current[enemyId]).toBe(50);
  });

  it('should track destroyed entities this frame', () => {
    // Create enemy at collision point
    const enemyId = addEntity(world);
    addComponent(world, enemyId, Position);
    Position.x[enemyId] = 960;
    Position.y[enemyId] = 540;
    addComponent(world, enemyId, Health);
    Health.current[enemyId] = 50;
    Health.max[enemyId] = 50;
    addComponent(world, enemyId, Faction);
    Faction.id[enemyId] = FactionId.KLINGON;
    addComponent(world, enemyId, AIBehavior);
    AIBehavior.behaviorType[enemyId] = 0;

    enemyCollisionSystem.update(world);

    const destroyed = enemyCollisionSystem.getDestroyedThisFrame();
    expect(destroyed).toContain(enemyId);
  });

  it('should clear destroyed list between frames', () => {
    // Create first enemy
    const enemy1 = addEntity(world);
    addComponent(world, enemy1, Position);
    Position.x[enemy1] = 960;
    Position.y[enemy1] = 540;
    addComponent(world, enemy1, Health);
    Health.current[enemy1] = 50;
    Health.max[enemy1] = 50;
    addComponent(world, enemy1, Faction);
    Faction.id[enemy1] = FactionId.KLINGON;
    addComponent(world, enemy1, AIBehavior);
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
    addComponent(world, turretId, Position);
    Position.x[turretId] = 960;
    Position.y[turretId] = 540;
    addComponent(world, turretId, Health);
    Health.current[turretId] = 50;
    Health.max[turretId] = 50;
    addComponent(world, turretId, Faction);
    Faction.id[turretId] = FactionId.FEDERATION;
    addComponent(world, turretId, AIBehavior);  // Even with AIBehavior
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
      addComponent(world, enemyId, Position);
      Position.x[enemyId] = 960;
      Position.y[enemyId] = 540;
      addComponent(world, enemyId, Health);
      Health.current[enemyId] = 50;
      Health.max[enemyId] = 50;
      addComponent(world, enemyId, Faction);
      Faction.id[enemyId] = FactionId.KLINGON;
      addComponent(world, enemyId, AIBehavior);
      AIBehavior.behaviorType[enemyId] = 0;
      enemies.push(enemyId);
    }

    enemyCollisionSystem.update(world);

    // All enemies should be destroyed
    for (const enemyId of enemies) {
      expect(Health.current[enemyId]).toBe(0);
    }

    // Kobayashi Maru should take damage from all collisions (COLLISION_DAMAGE * 3)
    expect(Shield.current[kobayashiMaruId]).toBe(200 - (COLLISION_DAMAGE * 3));
  });
});
