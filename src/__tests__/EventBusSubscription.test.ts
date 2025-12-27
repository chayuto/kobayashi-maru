/**
 * Tests for EventBusSubscription
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { EventBusSubscription } from '../core/EventBusSubscription';
import { GameEventType } from '../types/events';

describe('EventBusSubscription', () => {
  let subscription: EventBusSubscription;

  beforeEach(() => {
    EventBus.resetInstance();
    subscription = new EventBusSubscription();
  });

  afterEach(() => {
    subscription.unsubscribeAll();
    EventBus.resetInstance();
  });

  describe('subscription management', () => {
    it('should start with no subscriptions', () => {
      expect(subscription.getSubscriptionCount()).toBe(0);
      expect(subscription.hasSubscriptions()).toBe(false);
    });

    it('should track subscriptions', () => {
      const handler = vi.fn();
      subscription.on(GameEventType.ENEMY_KILLED, handler);

      expect(subscription.getSubscriptionCount()).toBe(1);
      expect(subscription.hasSubscriptions()).toBe(true);
    });

    it('should support method chaining', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const result = subscription
        .on(GameEventType.ENEMY_KILLED, handler1)
        .on(GameEventType.WAVE_STARTED, handler2);

      expect(result).toBe(subscription);
      expect(subscription.getSubscriptionCount()).toBe(2);
    });
  });

  describe('event handling', () => {
    it('should receive events after subscribing', () => {
      const handler = vi.fn();
      subscription.on(GameEventType.ENEMY_KILLED, handler);

      const eventBus = EventBus.getInstance();
      eventBus.emit(GameEventType.ENEMY_KILLED, {
        entityId: 1,
        factionId: 2,
        x: 100,
        y: 200
      });

      expect(handler).toHaveBeenCalledWith({
        entityId: 1,
        factionId: 2,
        x: 100,
        y: 200
      });
    });

    it('should handle multiple subscriptions to same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      subscription
        .on(GameEventType.WAVE_STARTED, handler1)
        .on(GameEventType.WAVE_STARTED, handler2);

      const eventBus = EventBus.getInstance();
      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 5 });

      expect(handler1).toHaveBeenCalledWith({ waveNumber: 5 });
      expect(handler2).toHaveBeenCalledWith({ waveNumber: 5 });
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe single handler with off()', () => {
      const handler = vi.fn();
      subscription.on(GameEventType.WAVE_COMPLETED, handler);
      subscription.off(GameEventType.WAVE_COMPLETED, handler);

      expect(subscription.getSubscriptionCount()).toBe(0);

      const eventBus = EventBus.getInstance();
      eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 1 });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support method chaining on off()', () => {
      const handler = vi.fn();
      const result = subscription
        .on(GameEventType.COMBO_UPDATED, handler)
        .off(GameEventType.COMBO_UPDATED, handler);

      expect(result).toBe(subscription);
    });
  });

  describe('unsubscribeAll', () => {
    it('should unsubscribe all handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      subscription
        .on(GameEventType.ENEMY_KILLED, handler1)
        .on(GameEventType.WAVE_STARTED, handler2)
        .on(GameEventType.RESOURCE_UPDATED, handler3);

      expect(subscription.getSubscriptionCount()).toBe(3);

      subscription.unsubscribeAll();

      expect(subscription.getSubscriptionCount()).toBe(0);
      expect(subscription.hasSubscriptions()).toBe(false);
    });

    it('should stop receiving events after unsubscribeAll', () => {
      const handler = vi.fn();
      subscription.on(GameEventType.PLAYER_DAMAGED, handler);

      subscription.unsubscribeAll();

      const eventBus = EventBus.getInstance();
      eventBus.emit(GameEventType.PLAYER_DAMAGED, { currentHealth: 50 });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should be safe to call unsubscribeAll multiple times', () => {
      const handler = vi.fn();
      subscription.on(GameEventType.GAME_OVER, handler);

      subscription.unsubscribeAll();
      subscription.unsubscribeAll(); // Should not throw

      expect(subscription.getSubscriptionCount()).toBe(0);
    });

    it('should be safe to call unsubscribeAll with no subscriptions', () => {
      expect(() => {
        subscription.unsubscribeAll();
      }).not.toThrow();
    });
  });

  describe('custom EventBus instance', () => {
    it('should work with custom EventBus instance', () => {
      // Create a fresh EventBus for this test
      EventBus.resetInstance();
      const customBus = EventBus.getInstance();
      const customSubscription = new EventBusSubscription(customBus);
      const handler = vi.fn();

      customSubscription.on(GameEventType.ACHIEVEMENT_UNLOCKED, handler);

      customBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
        achievementId: 'test',
        name: 'Test Achievement',
        description: 'A test achievement'
      });

      expect(handler).toHaveBeenCalledWith({
        achievementId: 'test',
        name: 'Test Achievement',
        description: 'A test achievement'
      });

      customSubscription.unsubscribeAll();
    });
  });

  describe('real-world usage pattern', () => {
    it('should work like a manager class', () => {
      // Simulate a manager class pattern
      class TestManager {
        private subscription = new EventBusSubscription();
        public killCount = 0;
        public waveCount = 0;

        constructor() {
          this.subscription
            .on(GameEventType.ENEMY_KILLED, this.handleEnemyKilled.bind(this))
            .on(GameEventType.WAVE_COMPLETED, this.handleWaveComplete.bind(this));
        }

        private handleEnemyKilled(): void {
          this.killCount++;
        }

        private handleWaveComplete(): void {
          this.waveCount++;
        }

        destroy(): void {
          this.subscription.unsubscribeAll();
        }
      }

      const manager = new TestManager();
      const eventBus = EventBus.getInstance();

      // Simulate game events
      eventBus.emit(GameEventType.ENEMY_KILLED, { entityId: 1, factionId: 2, x: 0, y: 0 });
      eventBus.emit(GameEventType.ENEMY_KILLED, { entityId: 2, factionId: 3, x: 0, y: 0 });
      eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 1 });

      expect(manager.killCount).toBe(2);
      expect(manager.waveCount).toBe(1);

      // Clean up
      manager.destroy();

      // Events should no longer be received
      eventBus.emit(GameEventType.ENEMY_KILLED, { entityId: 3, factionId: 4, x: 0, y: 0 });
      expect(manager.killCount).toBe(2); // Should not increase
    });
  });
});
