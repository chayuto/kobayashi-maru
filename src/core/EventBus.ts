/**
 * Global Event Bus for Kobayashi Maru
 * Provides type-safe pub/sub messaging between systems
 */
import { GameEventType, GameEventMap } from '../types/events';

/**
 * Event handler type for a specific event
 */
type EventHandler<T extends GameEventType> = (payload: GameEventMap[T]) => void;

/**
 * Type-safe global Event Bus singleton
 * Decouples systems by enabling event-driven communication
 */
export class EventBus {
  private static instance: EventBus | null = null;
  private listeners: Map<GameEventType, Set<EventHandler<GameEventType>>>;

  private constructor() {
    this.listeners = new Map();
  }

  /**
   * Get the singleton EventBus instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing)
   */
  static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.listeners.clear();
    }
    EventBus.instance = null;
  }

  /**
   * Subscribe to an event
   * @param event - The event type to listen for
   * @param handler - The callback function to invoke when the event is emitted
   */
  on<T extends GameEventType>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<GameEventType>);
  }

  /**
   * Unsubscribe from an event
   * @param event - The event type to unsubscribe from
   * @param handler - The handler to remove
   */
  off<T extends GameEventType>(event: T, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler<GameEventType>);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param event - The event type to emit
   * @param payload - The event payload
   */
  emit<T extends GameEventType>(event: T, payload: GameEventMap[T]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event
   * @param event - The event type to clear
   */
  clear(event: GameEventType): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all listeners for all events
   */
  clearAll(): void {
    this.listeners.clear();
  }

  /**
   * Get the number of listeners for a specific event
   * @param event - The event type to query
   * @returns The number of listeners
   */
  listenerCount(event: GameEventType): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
