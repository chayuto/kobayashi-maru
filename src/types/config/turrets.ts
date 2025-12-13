/**
 * Turret Configuration
 * 
 * Turret types, stats, costs, and upgrade configurations.
 * 
 * @module types/config/turrets
 */

// =============================================================================
// TURRET TYPES
// =============================================================================

/** Turret type identifiers */
export const TurretType = {
    PHASER_ARRAY: 0,
    TORPEDO_LAUNCHER: 1,
    DISRUPTOR_BANK: 2,
    TETRYON_BEAM: 3,
    PLASMA_CANNON: 4,
    POLARON_BEAM: 5
} as const;

export type TurretTypeId = typeof TurretType[keyof typeof TurretType];

// =============================================================================
// TURRET STATS
// =============================================================================

/** Turret configuration for each type */
export const TURRET_CONFIG: Record<number, {
    range: number;
    fireRate: number;
    damage: number;
    cost: number;
    health: number;
    shield: number;
    name: string;
    description: string;
    special?: string;
}> = {
    [TurretType.PHASER_ARRAY]: {
        range: 200, fireRate: 3.5, damage: 10, cost: 110, health: 50, shield: 25,
        name: 'Phaser Array', description: 'Fast-firing energy weapon',
        special: 'High fire rate, good for swarms'
    },
    [TurretType.TORPEDO_LAUNCHER]: {
        range: 350, fireRate: 0.6, damage: 60, cost: 160, health: 75, shield: 40,
        name: 'Torpedo Launcher', description: 'Long-range heavy damage',
        special: 'Highest damage, longest range'
    },
    [TurretType.DISRUPTOR_BANK]: {
        range: 250, fireRate: 2, damage: 15, cost: 140, health: 60, shield: 30,
        name: 'Disruptor Bank', description: 'Balanced beam weapon',
        special: 'Good all-rounder'
    },
    [TurretType.TETRYON_BEAM]: {
        range: 220, fireRate: 3, damage: 12, cost: 150, health: 55, shield: 28,
        name: 'Tetryon Beam', description: 'Shield-stripping weapon',
        special: '3x damage to shields, 0.5x to hull'
    },
    [TurretType.PLASMA_CANNON]: {
        range: 220, fireRate: 1.2, damage: 10, cost: 160, health: 65, shield: 35,
        name: 'Plasma Cannon', description: 'Burning projectile weapon',
        special: 'Applies burning (4 dmg/sec × 5s)'
    },
    [TurretType.POLARON_BEAM]: {
        range: 230, fireRate: 2.5, damage: 11, cost: 160, health: 58, shield: 32,
        name: 'Polaron Beam', description: 'Power-draining weapon',
        special: 'Stacking slow (max 3, 10% each)'
    }
};

// =============================================================================
// UPGRADES
// =============================================================================

/** Upgrade path types */
export const UpgradePath = {
    DAMAGE: 0,
    RANGE: 1,
    FIRE_RATE: 2,
    MULTI_TARGET: 3,
    SPECIAL: 4
} as const;

export type UpgradePathId = typeof UpgradePath[keyof typeof UpgradePath];

/** Upgrade configuration for each path and level */
export const UPGRADE_CONFIG = {
    [UpgradePath.DAMAGE]: {
        name: 'Weapon Power', description: 'Increase damage output',
        maxLevel: 3, costs: [50, 100, 200], bonusPercent: [25, 50, 100]
    },
    [UpgradePath.RANGE]: {
        name: 'Targeting Range', description: 'Extend weapon range',
        maxLevel: 3, costs: [40, 80, 160], bonusPercent: [20, 40, 80]
    },
    [UpgradePath.FIRE_RATE]: {
        name: 'Fire Rate', description: 'Increase shots per second',
        maxLevel: 3, costs: [60, 120, 240], bonusPercent: [30, 60, 120]
    },
    [UpgradePath.MULTI_TARGET]: {
        name: 'Multi-Target', description: 'Target multiple enemies',
        maxLevel: 2, costs: [150, 300], targets: [2, 3]
    },
    [UpgradePath.SPECIAL]: {
        name: 'Special Ability', description: 'Turret-specific enhancement',
        maxLevel: 3, costs: [75, 150, 300]
    }
} as const;

/** Special upgrade effects per turret type */
export const TURRET_SPECIAL_UPGRADES: Record<number, { name: string; levels: string[] }> = {
    [TurretType.PHASER_ARRAY]: {
        name: 'Overload',
        levels: ['Chance to disable enemy weapons', 'Increased disable duration', 'Chain lightning to nearby enemies']
    },
    [TurretType.TORPEDO_LAUNCHER]: {
        name: 'Payload',
        levels: ['Small AOE explosion', 'Larger explosion radius', 'Armor penetration']
    },
    [TurretType.DISRUPTOR_BANK]: {
        name: 'Resonance',
        levels: ['Shield drain on hit', 'Increased shield damage', 'Shield bypass']
    },
    [TurretType.TETRYON_BEAM]: {
        name: 'Polarize',
        levels: ['Weaken enemy shields', 'Increased hull damage', 'Shield collapse']
    },
    [TurretType.PLASMA_CANNON]: {
        name: 'Inferno',
        levels: ['Increased burn damage', 'Longer burn duration', 'Burn spreads to nearby enemies']
    },
    [TurretType.POLARON_BEAM]: {
        name: 'Energy Drain',
        levels: ['Stronger slow effect', 'Permanent speed reduction', 'Disable enemy abilities']
    }
};

/** Sell refund percentage */
export const TURRET_SELL_REFUND_PERCENT = 0.75;
