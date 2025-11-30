/**
 * Resource Manager for Kobayashi Maru
 * Manages player resources used for turret placement
 */
import { GAME_CONFIG } from '../types/constants';

/**
 * Event types emitted by the resource manager
 */
export type ResourceEventType = 'change' | 'insufficient';

export interface ResourceEvent {
  type: ResourceEventType;
  current: number;
  previous: number;
  amount?: number;
}

type ResourceListener = (event: ResourceEvent) => void;

/**
 * Manages player resources (Replication Matter)
 */
export class ResourceManager {
  private resources: number;
  private listeners: Map<ResourceEventType, ResourceListener[]>;

  constructor(initialResources: number = GAME_CONFIG.INITIAL_RESOURCES) {
    this.resources = initialResources;
    this.listeners = new Map();
  }

  /**
   * Get current resource amount
   */
  getResources(): number {
    return this.resources;
  }

  /**
   * Set resources to a specific amount
   * @param amount - New resource amount
   */
  setResources(amount: number): void {
    const previous = this.resources;
    this.resources = Math.max(0, amount);
    this.emit('change', { type: 'change', current: this.resources, previous });
  }

  /**
   * Add resources
   * @param amount - Amount to add
   */
  addResources(amount: number): void {
    if (amount <= 0) return;
    const previous = this.resources;
    this.resources += amount;
    this.emit('change', { type: 'change', current: this.resources, previous, amount });
  }

  /**
   * Spend resources if sufficient funds available
   * @param amount - Amount to spend
   * @returns True if spending was successful, false if insufficient funds
   */
  spendResources(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.resources < amount) {
      this.emit('insufficient', { 
        type: 'insufficient', 
        current: this.resources, 
        previous: this.resources,
        amount 
      });
      return false;
    }
    const previous = this.resources;
    this.resources -= amount;
    this.emit('change', { type: 'change', current: this.resources, previous, amount: -amount });
    return true;
  }

  /**
   * Check if player can afford a cost
   * @param amount - Amount to check
   * @returns True if player has sufficient resources
   */
  canAfford(amount: number): boolean {
    return this.resources >= amount;
  }

  /**
   * Register an event listener
   * @param eventType - Type of event to listen for
   * @param listener - Callback function
   */
  on(eventType: ResourceEventType, listener: ResourceListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  /**
   * Remove an event listener
   * @param eventType - Type of event
   * @param listener - Callback to remove
   */
  off(eventType: ResourceEventType, listener: ResourceListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all listeners
   * @param eventType - Type of event
   * @param event - Event data
   */
  private emit(eventType: ResourceEventType, event: ResourceEvent): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * Reset resources to initial amount
   */
  reset(): void {
    const previous = this.resources;
    this.resources = GAME_CONFIG.INITIAL_RESOURCES;
    this.emit('change', { type: 'change', current: this.resources, previous });
  }
}
