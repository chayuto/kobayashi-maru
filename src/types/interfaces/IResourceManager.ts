/**
 * Resource Manager Interface
 * Defines the contract for resource management functionality.
 * 
 * @module types/interfaces/IResourceManager
 */

/**
 * Interface for Resource Manager
 * Manages player resources (Replication Matter) used for turret placement.
 */
export interface IResourceManager {
  /**
   * Get current resource amount
   * @returns Current resources
   */
  getResources(): number;

  /**
   * Set resources to a specific amount
   * @param amount - New resource amount
   */
  setResources(amount: number): void;

  /**
   * Add resources
   * @param amount - Amount to add
   */
  addResources(amount: number): void;

  /**
   * Spend resources if sufficient funds available
   * @param amount - Amount to spend
   * @returns True if spending was successful, false if insufficient funds
   */
  spendResources(amount: number): boolean;

  /**
   * Check if player can afford a cost
   * @param amount - Amount to check
   * @returns True if player has sufficient resources
   */
  canAfford(amount: number): boolean;

  /**
   * Reset resources to initial amount
   */
  reset(): void;
}
