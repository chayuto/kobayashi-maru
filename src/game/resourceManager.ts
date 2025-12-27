/**
 * Resource Manager for Kobayashi Maru
 * Manages player resources used for turret placement
 */
import { GAME_CONFIG } from '../types/constants';
import { GameEventType } from '../types/events';
import type { IResourceManager } from '../types/interfaces';
import { EventBus } from '../core/EventBus';

/**
 * Manages player resources (Replication Matter)
 * Implements IResourceManager interface for consistent API contract.
 */
export class ResourceManager implements IResourceManager {
  private resources: number;
  private eventBus: EventBus;

  constructor(initialResources: number = GAME_CONFIG.INITIAL_RESOURCES) {
    this.resources = initialResources;
    this.eventBus = EventBus.getInstance();
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
    const changeAmount = this.resources - previous;
    this.emitResourceUpdate(changeAmount);
  }

  /**
   * Add resources
   * @param amount - Amount to add
   */
  addResources(amount: number): void {
    if (amount <= 0) return;
    this.resources += amount;
    this.emitResourceUpdate(amount);
  }

  /**
   * Spend resources if sufficient funds available
   * @param amount - Amount to spend
   * @returns True if spending was successful, false if insufficient funds
   */
  spendResources(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.resources < amount) {
      return false;
    }
    this.resources -= amount;
    this.emitResourceUpdate(-amount);
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
   * Emit resource update via global EventBus
   * @param amount - The change amount (positive for gain, negative for spend)
   */
  private emitResourceUpdate(amount: number): void {
    this.eventBus.emit(GameEventType.RESOURCE_UPDATED, {
      current: this.resources,
      amount
    });
  }

  /**
   * Reset resources to initial amount
   */
  reset(): void {
    const previous = this.resources;
    this.resources = GAME_CONFIG.INITIAL_RESOURCES;
    this.emitResourceUpdate(this.resources - previous);
  }
}

