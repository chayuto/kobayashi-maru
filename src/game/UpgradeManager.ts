/**
 * Upgrade Manager for Kobayashi Maru
 * Handles turret upgrades, sell functionality, and upgrade calculations
 */
import { hasComponent } from 'bitecs';
import { Turret, TurretUpgrade } from '../ecs/components';
import { TURRET_CONFIG, UPGRADE_CONFIG, UpgradePath, TURRET_SELL_REFUND_PERCENT } from '../types/constants';
import { ResourceManager } from './resourceManager';
import type { GameWorld } from '../ecs/world';
import { AudioManager, SoundType } from '../audio';

/**
 * Result of an upgrade attempt
 */
export interface UpgradeResult {
  success: boolean;
  reason?: string;
}

/**
 * Information about a turret's upgrade state
 */
export interface TurretUpgradeInfo {
  entityId: number;
  turretType: number;
  baseCost: number;
  totalInvestment: number;
  upgrades: {
    damage: number;
    range: number;
    fireRate: number;
    multiTarget: number;
    special: number;
  };
  currentStats: {
    damage: number;
    range: number;
    fireRate: number;
    maxTargets: number;
  };
}

/**
 * Manages turret upgrades and sell functionality
 */
export class UpgradeManager {
  private world: GameWorld;
  private resourceManager: ResourceManager;

  constructor(world: GameWorld, resourceManager: ResourceManager) {
    this.world = world;
    this.resourceManager = resourceManager;
  }

  /**
   * Get upgrade information for a turret
   * @param entityId - Turret entity ID
   * @returns Upgrade info or null if not a turret
   */
  getTurretInfo(entityId: number): TurretUpgradeInfo | null {
    if (!hasComponent(this.world, Turret, entityId) || 
        !hasComponent(this.world, TurretUpgrade, entityId)) {
      return null;
    }

    const turretType = Turret.turretType[entityId];
    const config = TURRET_CONFIG[turretType];
    
    const damageLevel = TurretUpgrade.damageLevel[entityId];
    const rangeLevel = TurretUpgrade.rangeLevel[entityId];
    const fireRateLevel = TurretUpgrade.fireRateLevel[entityId];
    const multiTargetLevel = TurretUpgrade.multiTargetLevel[entityId];
    const specialLevel = TurretUpgrade.specialLevel[entityId];

    // Calculate total investment
    let totalInvestment = config.cost;
    
    // Add upgrade costs
    for (let i = 0; i < damageLevel; i++) {
      totalInvestment += UPGRADE_CONFIG[UpgradePath.DAMAGE].costs[i];
    }
    for (let i = 0; i < rangeLevel; i++) {
      totalInvestment += UPGRADE_CONFIG[UpgradePath.RANGE].costs[i];
    }
    for (let i = 0; i < fireRateLevel; i++) {
      totalInvestment += UPGRADE_CONFIG[UpgradePath.FIRE_RATE].costs[i];
    }
    for (let i = 0; i < multiTargetLevel; i++) {
      totalInvestment += UPGRADE_CONFIG[UpgradePath.MULTI_TARGET].costs[i];
    }
    for (let i = 0; i < specialLevel; i++) {
      totalInvestment += UPGRADE_CONFIG[UpgradePath.SPECIAL].costs[i];
    }

    // Calculate current stats with upgrades
    const baseDamage = config.damage;
    const baseRange = config.range;
    const baseFireRate = config.fireRate;
    
    const damageBonus = damageLevel > 0 ? UPGRADE_CONFIG[UpgradePath.DAMAGE].bonusPercent[damageLevel - 1] : 0;
    const rangeBonus = rangeLevel > 0 ? UPGRADE_CONFIG[UpgradePath.RANGE].bonusPercent[rangeLevel - 1] : 0;
    const fireRateBonus = fireRateLevel > 0 ? UPGRADE_CONFIG[UpgradePath.FIRE_RATE].bonusPercent[fireRateLevel - 1] : 0;
    
    const currentDamage = baseDamage * (1 + damageBonus / 100);
    const currentRange = baseRange * (1 + rangeBonus / 100);
    const currentFireRate = baseFireRate * (1 + fireRateBonus / 100);
    const maxTargets = multiTargetLevel > 0 ? UPGRADE_CONFIG[UpgradePath.MULTI_TARGET].targets[multiTargetLevel - 1] : 1;

    return {
      entityId,
      turretType,
      baseCost: config.cost,
      totalInvestment,
      upgrades: {
        damage: damageLevel,
        range: rangeLevel,
        fireRate: fireRateLevel,
        multiTarget: multiTargetLevel,
        special: specialLevel
      },
      currentStats: {
        damage: currentDamage,
        range: currentRange,
        fireRate: currentFireRate,
        maxTargets
      }
    };
  }

  /**
   * Check if an upgrade path is available for a turret
   * @param entityId - Turret entity ID
   * @param upgradePath - Which upgrade path to check
   * @returns True if upgrade is available
   */
  canUpgrade(entityId: number, upgradePath: number): boolean {
    if (!hasComponent(this.world, TurretUpgrade, entityId)) {
      return false;
    }

    let currentLevel = 0;
    let maxLevel = 0;

    switch (upgradePath) {
      case UpgradePath.DAMAGE:
        currentLevel = TurretUpgrade.damageLevel[entityId];
        maxLevel = UPGRADE_CONFIG[UpgradePath.DAMAGE].maxLevel;
        break;
      case UpgradePath.RANGE:
        currentLevel = TurretUpgrade.rangeLevel[entityId];
        maxLevel = UPGRADE_CONFIG[UpgradePath.RANGE].maxLevel;
        break;
      case UpgradePath.FIRE_RATE:
        currentLevel = TurretUpgrade.fireRateLevel[entityId];
        maxLevel = UPGRADE_CONFIG[UpgradePath.FIRE_RATE].maxLevel;
        break;
      case UpgradePath.MULTI_TARGET:
        currentLevel = TurretUpgrade.multiTargetLevel[entityId];
        maxLevel = UPGRADE_CONFIG[UpgradePath.MULTI_TARGET].maxLevel;
        break;
      case UpgradePath.SPECIAL:
        currentLevel = TurretUpgrade.specialLevel[entityId];
        maxLevel = UPGRADE_CONFIG[UpgradePath.SPECIAL].maxLevel;
        break;
      default:
        return false;
    }

    // Check if already at max level
    if (currentLevel >= maxLevel) {
      return false;
    }

    // Check if player can afford the upgrade
    const cost = this.getUpgradeCost(upgradePath, currentLevel);
    return this.resourceManager.canAfford(cost);
  }

  /**
   * Get the cost of an upgrade for a specific level
   * @param upgradePath - Which upgrade path
   * @param currentLevel - Current level (0-indexed)
   * @returns Cost of next upgrade level
   */
  getUpgradeCost(upgradePath: number, currentLevel: number): number {
    const config = UPGRADE_CONFIG[upgradePath as keyof typeof UPGRADE_CONFIG];
    if (!config || currentLevel >= config.costs.length) {
      return Infinity; // Max level reached or invalid path
    }
    return config.costs[currentLevel];
  }

  /**
   * Apply an upgrade to a turret
   * @param entityId - Turret entity ID
   * @param upgradePath - Which upgrade path to apply
   * @returns Result of upgrade attempt
   */
  applyUpgrade(entityId: number, upgradePath: number): UpgradeResult {
    if (!hasComponent(this.world, Turret, entityId) || 
        !hasComponent(this.world, TurretUpgrade, entityId)) {
      return { success: false, reason: 'Invalid turret' };
    }

    if (!this.canUpgrade(entityId, upgradePath)) {
      return { success: false, reason: 'Cannot upgrade (max level or insufficient resources)' };
    }

    let currentLevel = 0;
    switch (upgradePath) {
      case UpgradePath.DAMAGE:
        currentLevel = TurretUpgrade.damageLevel[entityId];
        break;
      case UpgradePath.RANGE:
        currentLevel = TurretUpgrade.rangeLevel[entityId];
        break;
      case UpgradePath.FIRE_RATE:
        currentLevel = TurretUpgrade.fireRateLevel[entityId];
        break;
      case UpgradePath.MULTI_TARGET:
        currentLevel = TurretUpgrade.multiTargetLevel[entityId];
        break;
      case UpgradePath.SPECIAL:
        currentLevel = TurretUpgrade.specialLevel[entityId];
        break;
      default:
        return { success: false, reason: 'Invalid upgrade path' };
    }

    const cost = this.getUpgradeCost(upgradePath, currentLevel);
    
    // Deduct resources
    if (!this.resourceManager.spendResources(cost)) {
      return { success: false, reason: 'Insufficient resources' };
    }

    // Apply the upgrade
    const newLevel = currentLevel + 1;
    switch (upgradePath) {
      case UpgradePath.DAMAGE:
        TurretUpgrade.damageLevel[entityId] = newLevel;
        this.applyDamageUpgrade(entityId, newLevel);
        break;
      case UpgradePath.RANGE:
        TurretUpgrade.rangeLevel[entityId] = newLevel;
        this.applyRangeUpgrade(entityId, newLevel);
        break;
      case UpgradePath.FIRE_RATE:
        TurretUpgrade.fireRateLevel[entityId] = newLevel;
        this.applyFireRateUpgrade(entityId, newLevel);
        break;
      case UpgradePath.MULTI_TARGET:
        TurretUpgrade.multiTargetLevel[entityId] = newLevel;
        // Multi-target is handled in targeting system
        break;
      case UpgradePath.SPECIAL:
        TurretUpgrade.specialLevel[entityId] = newLevel;
        // Special upgrades are handled in combat/damage systems
        break;
    }

    // Play upgrade sound
    AudioManager.getInstance().play(SoundType.TURRET_PLACE, { volume: 0.7 });

    return { success: true };
  }

  /**
   * Apply damage upgrade to turret stats
   */
  private applyDamageUpgrade(entityId: number, level: number): void {
    const turretType = Turret.turretType[entityId];
    const baseDamage = TURRET_CONFIG[turretType].damage;
    const bonusPercent = UPGRADE_CONFIG[UpgradePath.DAMAGE].bonusPercent[level - 1];
    Turret.damage[entityId] = baseDamage * (1 + bonusPercent / 100);
  }

  /**
   * Apply range upgrade to turret stats
   */
  private applyRangeUpgrade(entityId: number, level: number): void {
    const turretType = Turret.turretType[entityId];
    const baseRange = TURRET_CONFIG[turretType].range;
    const bonusPercent = UPGRADE_CONFIG[UpgradePath.RANGE].bonusPercent[level - 1];
    Turret.range[entityId] = baseRange * (1 + bonusPercent / 100);
  }

  /**
   * Apply fire rate upgrade to turret stats
   */
  private applyFireRateUpgrade(entityId: number, level: number): void {
    const turretType = Turret.turretType[entityId];
    const baseFireRate = TURRET_CONFIG[turretType].fireRate;
    const bonusPercent = UPGRADE_CONFIG[UpgradePath.FIRE_RATE].bonusPercent[level - 1];
    Turret.fireRate[entityId] = baseFireRate * (1 + bonusPercent / 100);
  }

  /**
   * Sell a turret and refund resources
   * @param entityId - Turret entity ID
   * @returns Refund amount or -1 if failed
   */
  sellTurret(entityId: number): number {
    const info = this.getTurretInfo(entityId);
    if (!info) {
      return -1;
    }

    const refund = Math.floor(info.totalInvestment * TURRET_SELL_REFUND_PERCENT);
    this.resourceManager.addResources(refund);

    // Play sell sound
    AudioManager.getInstance().play(SoundType.ERROR_BEEP, { volume: 0.5 });

    return refund;
  }

  /**
   * Get the refund amount for selling a turret (without actually selling)
   * @param entityId - Turret entity ID
   * @returns Refund amount or 0 if invalid
   */
  getSellRefund(entityId: number): number {
    const info = this.getTurretInfo(entityId);
    if (!info) {
      return 0;
    }
    return Math.floor(info.totalInvestment * TURRET_SELL_REFUND_PERCENT);
  }
}
