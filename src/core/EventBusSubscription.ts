/**
 * EventBus Subscription Manager for Kobayashi Maru
 * 
 * Provides automatic listener cleanup to prevent memory leaks.
 * Use this helper class to manage event subscriptions with automatic cleanup.
 * 
 * @module core/EventBusSubscription
 */
import { EventBus } from './EventBus';
import { GameEventType, GameEventMap } from '../types/events';

/**
 * Tracked subscription entry
 */
interface SubscriptionEntry<T extends GameEventType> {
  event: T;
  handler: (payload: GameEventMap[T]) => void;
}

/**
 * Subscription handle for automatic event listener cleanup.
 * 
 * Tracks all subscriptions made through this instance and provides
 * a single unsubscribeAll() method to clean them all up at once.
 * 
 * @example
 * ```typescript
 * class SomeManager {
 *   private subscription = new EventBusSubscription();
 * 
 *   constructor() {
 *     this.subscription
 *       .on(GameEventType.ENEMY_KILLED, this.handleEnemyKilled.bind(this))
 *       .on(GameEventType.WAVE_COMPLETED, this.handleWaveComplete.bind(this));
 *   }
 * 
 *   destroy(): void {
 *     this.subscription.unsubscribeAll();
 *   }
 * 
 *   private handleEnemyKilled(payload: EnemyKilledPayload): void {
 *     // Handle event
 *   }
 * 
 *   private handleWaveComplete(payload: WaveCompletedPayload): void {
 *     // Handle event
 *   }
 * }
 * ```
 */
export class EventBusSubscription {
  private subscriptions: SubscriptionEntry<GameEventType>[] = [];
  private bus: EventBus;

  /**
   * Create a new EventBusSubscription.
   * 
   * @param eventBus - Optional EventBus instance (defaults to singleton)
   */
  constructor(eventBus?: EventBus) {
    this.bus = eventBus ?? EventBus.getInstance();
  }

  /**
   * Subscribe to an event with automatic tracking.
   * 
   * Supports method chaining for multiple subscriptions.
   * 
   * @param event - The event type to subscribe to
   * @param handler - The callback function to invoke when the event is emitted
   * @returns this - For method chaining
   * 
   * @example
   * ```typescript
   * subscription
   *   .on(GameEventType.ENEMY_KILLED, handleKill)
   *   .on(GameEventType.WAVE_STARTED, handleWave);
   * ```
   */
  on<T extends GameEventType>(
    event: T,
    handler: (payload: GameEventMap[T]) => void
  ): this {
    this.bus.on(event, handler);
    this.subscriptions.push({ event, handler } as SubscriptionEntry<GameEventType>);
    return this;
  }

  /**
   * Unsubscribe from a specific event handler.
   * 
   * @param event - The event type to unsubscribe from
   * @param handler - The handler to remove
   * @returns this - For method chaining
   */
  off<T extends GameEventType>(
    event: T,
    handler: (payload: GameEventMap[T]) => void
  ): this {
    this.bus.off(event, handler);
    this.subscriptions = this.subscriptions.filter(
      s => !(s.event === event && s.handler === handler)
    );
    return this;
  }

  /**
   * Unsubscribe all tracked listeners.
   * 
   * Call this in component destroy/cleanup methods to prevent memory leaks.
   */
  unsubscribeAll(): void {
    for (const { event, handler } of this.subscriptions) {
      this.bus.off(event, handler);
    }
    this.subscriptions = [];
  }

  /**
   * Get the number of active subscriptions.
   */
  getSubscriptionCount(): number {
    return this.subscriptions.length;
  }

  /**
   * Check if there are any active subscriptions.
   */
  hasSubscriptions(): boolean {
    return this.subscriptions.length > 0;
  }
}
