/**
 * Tests for Damage System
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameWorld, createEnemy, getEntityCount } from '../ecs';
import { PoolManager } from '../ecs/PoolManager';
import { Health } from '../ecs/components';
import { FactionId } from '../types/constants';
import { createDamageSystem } from '../systems/damageSystem';
import type { GameWorld } from '../ecs/world';
import { EventBus } from '../core/EventBus';

describe('Damage System', () => {
  let world: GameWorld;
  let damageSystem: ReturnType<typeof createDamageSystem>;

  beforeEach(() => {
    // Reset EventBus to ensure clean state between tests
    EventBus.resetInstance();
    world = createGameWorld();
    PoolManager.getInstance().init(world);
    damageSystem = createDamageSystem();
  });

  afterEach(() => {
    PoolManager.getInstance().destroy();
  });

  describe('Entity destruction', () => {
    it('should remove entity when health reaches 0', () => {
      // Create enemy
      const enemyId = createEnemy(world, FactionId.KLINGON, 500, 500);
      const initialCount = getEntityCount();

      // Set health to 0
      Health.current[enemyId] = 0;

      // Run damage system
      damageSystem.update(world);

      // Entity should be removed
      expect(getEntityCount()).toBe(initialCount - 1);
    });

    it('should not remove entity when health is above 0', () => {
      // Create enemy
      createEnemy(world, FactionId.KLINGON, 500, 500);
      const initialCount = getEntityCount();

      // Run damage system (health is still positive)
      damageSystem.update(world);

      // Entity should still exist
      expect(getEntityCount()).toBe(initialCount);
    });

    it('should track destroyed entities', () => {
      // Create enemy
      const enemyId = createEnemy(world, FactionId.KLINGON, 500, 500);

      // Set health to 0
      Health.current[enemyId] = 0;

      // Run damage system
      damageSystem.update(world);

      // Check destroyed list
      const destroyed = damageSystem.getDestroyedThisFrame();
      expect(destroyed).toContain(enemyId);
    });

    it('should clear destroyed list each frame', () => {
      // Create enemy
      const enemyId = createEnemy(world, FactionId.KLINGON, 500, 500);

      // Set health to 0
      Health.current[enemyId] = 0;

      // Run damage system
      damageSystem.update(world);
      expect(damageSystem.getDestroyedThisFrame().length).toBe(1);

      // Run again
      damageSystem.update(world);
      expect(damageSystem.getDestroyedThisFrame().length).toBe(0);
    });
  });

  describe('Multiple entities', () => {
    it('should handle multiple deaths in one frame', async () => {
      const { GameEventType } = await import('../types/events');
      const eventBus = EventBus.getInstance();
      const eventHandler = vi.fn();
      eventBus.on(GameEventType.ENEMY_KILLED, eventHandler);

      // Create multiple enemies
      const enemy1 = createEnemy(world, FactionId.KLINGON, 500, 500);
      const enemy2 = createEnemy(world, FactionId.KLINGON, 600, 600);
      const initialCount = getEntityCount();

      // Set both to 0 health
      Health.current[enemy1] = 0;
      Health.current[enemy2] = 0;

      // Run damage system
      damageSystem.update(world);

      // Both should be removed
      expect(getEntityCount()).toBe(initialCount - 2);
      expect(eventHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('EventBus integration', () => {
    it('should emit ENEMY_KILLED event when enemy is destroyed', async () => {
      const { GameEventType } = await import('../types/events');
      const eventBus = EventBus.getInstance();
      const eventHandler = vi.fn();

      eventBus.on(GameEventType.ENEMY_KILLED, eventHandler);

      // Create enemy
      const enemyId = createEnemy(world, FactionId.KLINGON, 500, 500);

      // Set health to 0
      Health.current[enemyId] = 0;

      // Run damage system
      damageSystem.update(world);

      // EventBus handler should be called with correct payload
      expect(eventHandler).toHaveBeenCalledTimes(1);
      expect(eventHandler).toHaveBeenCalledWith(expect.objectContaining({
        entityId: enemyId,
        factionId: FactionId.KLINGON
      }));
    });

    it('should not emit ENEMY_KILLED event for Federation death', async () => {
      const { GameEventType } = await import('../types/events');
      const eventBus = EventBus.getInstance();
      const eventHandler = vi.fn();

      eventBus.on(GameEventType.ENEMY_KILLED, eventHandler);

      // Create federation ship
      const shipId = createEnemy(world, FactionId.FEDERATION, 500, 500);

      // Set health to 0
      Health.current[shipId] = 0;

      // Run damage system
      damageSystem.update(world);

      // EventBus handler should not be called for Federation
      expect(eventHandler).not.toHaveBeenCalled();
    });
  });
});
