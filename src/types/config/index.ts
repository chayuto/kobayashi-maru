/**
 * Configuration Barrel Export
 * 
 * Re-exports all modular config files.
 * 
 * @module types/config
 */

// Factions, colors, and AI
export {
    FACTION_COLORS,
    LCARS_COLORS,
    FactionId,
    SpriteType,
    AIBehaviorType
} from './factions';
export type { FactionIdType, SpriteTypeId, AIBehaviorTypeId } from './factions';

// Core game config
export { GAME_CONFIG } from './game';

// Turrets and upgrades
export {
    TurretType,
    TURRET_CONFIG,
    UpgradePath,
    UPGRADE_CONFIG,
    TURRET_SPECIAL_UPGRADES,
    TURRET_SELL_REFUND_PERCENT
} from './turrets';
export type { TurretTypeId, UpgradePathId } from './turrets';

// Projectiles
export { ProjectileType, PROJECTILE_CONFIG } from './projectiles';
export type { ProjectileTypeId } from './projectiles';

// Enemies and abilities
export {
    EnemyRank,
    RANK_MULTIPLIERS,
    AbilityType,
    ABILITY_CONFIG
} from './enemies';
export type { EnemyRankType, AbilityTypeId } from './enemies';
