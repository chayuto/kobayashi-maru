/**
 * EventBus Debugger for Kobayashi Maru
 * 
 * Provides event logging and tracing for development.
 * Tracks all events emitted through the EventBus for debugging purposes.
 * 
 * @module core/EventBusDebugger
 */
import { EventBus } from './EventBus';
import { GameEventType, GameEventMap } from '../types/events';

/**
 * Log entry for a single event emission
 */
export interface EventLogEntry {
  /** The event type that was emitted */
  event: GameEventType;
  /** The payload data */
  payload: unknown;
  /** High-resolution timestamp from performance.now() */
  timestamp: number;
}

/**
 * EventBus debugger for development-time event tracing.
 * 
 * Subscribes to all game events and logs them for debugging.
 * Use in development mode to trace event flow and diagnose issues.
 * 
 * @example
 * ```typescript
 * // Enable debugging in development
 * if (import.meta.env.DEV) {
 *   const debugger = new EventBusDebugger();
 *   debugger.enable();
 * }
 * 
 * // Later, inspect event history
 * const recentKills = debugger.getEventsByType(GameEventType.ENEMY_KILLED);
 * console.log('Recent kills:', recentKills);
 * ```
 */
export class EventBusDebugger {
  private enabled: boolean = false;
  private eventLog: EventLogEntry[] = [];
  private maxLogSize: number;
  private consoleLogging: boolean;
  private handlers: Map<GameEventType, (payload: GameEventMap[GameEventType]) => void> = new Map();

  /**
   * Create a new EventBusDebugger.
   * 
   * @param options - Configuration options
   * @param options.maxLogSize - Maximum number of events to keep in log (default: 100)
   * @param options.consoleLogging - Whether to log events to console (default: false)
   */
  constructor(options: { maxLogSize?: number; consoleLogging?: boolean } = {}) {
    this.maxLogSize = options.maxLogSize ?? 100;
    this.consoleLogging = options.consoleLogging ?? false;
  }

  /**
   * Enable event debugging.
   * Subscribes to all event types and begins logging.
   */
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    const bus = EventBus.getInstance();

    // Subscribe to all events
    for (const eventType of Object.values(GameEventType)) {
      const handler = (payload: GameEventMap[typeof eventType]) => {
        this.logEvent(eventType, payload);
      };
      this.handlers.set(eventType, handler);
      bus.on(eventType, handler);
    }

    if (this.consoleLogging) {
      console.log('[EventBusDebugger] Enabled - logging all events');
    }
  }

  /**
   * Disable event debugging.
   * Unsubscribes from all events but preserves the existing event log.
   * Use clear() if you also want to clear the log.
   */
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;

    const bus = EventBus.getInstance();

    // Unsubscribe from all events
    for (const [eventType, handler] of this.handlers) {
      bus.off(eventType, handler);
    }
    this.handlers.clear();

    if (this.consoleLogging) {
      console.log('[EventBusDebugger] Disabled');
    }
  }

  /**
   * Log an event to the internal log.
   */
  private logEvent(event: GameEventType, payload: unknown): void {
    const entry: EventLogEntry = {
      event,
      payload,
      timestamp: performance.now(),
    };

    this.eventLog.push(entry);

    // Trim log if too large
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Console output if enabled
    if (this.consoleLogging) {
      console.log(`[Event] ${event}`, payload);
    }
  }

  /**
   * Get all logged events.
   * 
   * @returns Copy of the event log array
   */
  getLog(): EventLogEntry[] {
    return [...this.eventLog];
  }

  /**
   * Get events filtered by type.
   * 
   * @param type - The event type to filter by
   * @returns Events matching the specified type
   */
  getEventsByType(type: GameEventType): EventLogEntry[] {
    return this.eventLog.filter(e => e.event === type);
  }

  /**
   * Get events within a time range.
   * 
   * @param startTime - Start timestamp (from performance.now())
   * @param endTime - End timestamp (from performance.now())
   * @returns Events within the time range
   */
  getEventsByTimeRange(startTime: number, endTime: number): EventLogEntry[] {
    return this.eventLog.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Clear the event log.
   */
  clear(): void {
    this.eventLog = [];
  }

  /**
   * Check if debugging is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get count of logged events.
   */
  getLogCount(): number {
    return this.eventLog.length;
  }

  /**
   * Get count of events by type.
   * 
   * @returns Map of event type to count
   */
  getEventCounts(): Map<GameEventType, number> {
    const counts = new Map<GameEventType, number>();
    for (const entry of this.eventLog) {
      counts.set(entry.event, (counts.get(entry.event) ?? 0) + 1);
    }
    return counts;
  }
}
