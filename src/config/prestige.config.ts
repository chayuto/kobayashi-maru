/**
 * Prestige / Meta-Progression Configuration
 *
 * Defines commendation reward formula, upgrade tree, and storage key.
 *
 * @module config/prestige
 */

export const PRESTIGE_CONFIG = {
    /** LocalStorage key for prestige data */
    STORAGE_KEY: 'kobayashi-maru-prestige',

    /** Commendation reward formula weights */
    REWARD: {
        /** Base commendations per run */
        BASE: 10,
        /** Commendations per wave survived */
        PER_WAVE: 10,
        /** Commendations per enemy killed */
        PER_KILL: 0.5,
        /** Commendations per second survived */
        PER_SECOND: 0.1,
    },

    /** Upgrade definitions */
    UPGRADES: [
        {
            id: 'resource_boost',
            name: 'Supply Requisition',
            description: 'Start with more resources',
            maxLevel: 5,
            costs: [50, 100, 200, 400, 800],
            bonusPerLevel: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
        {
            id: 'hull_integrity',
            name: 'Reinforced Hull',
            description: 'Increase starting hull strength',
            maxLevel: 5,
            costs: [75, 150, 300, 600, 1200],
            bonusPerLevel: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
        {
            id: 'turret_discount',
            name: 'Fleet Surplus',
            description: 'Reduce turret costs',
            maxLevel: 5,
            costs: [60, 120, 240, 480, 960],
            bonusPerLevel: [0.05, 0.1, 0.15, 0.2, 0.25],
        },
        {
            id: 'score_multiplier',
            name: 'Tactical Acumen',
            description: 'Increase score earned',
            maxLevel: 5,
            costs: [100, 200, 400, 800, 1600],
            bonusPerLevel: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
        {
            id: 'starting_turret',
            name: 'Advance Guard',
            description: 'Start with a free turret',
            maxLevel: 1,
            costs: [500],
            bonusPerLevel: [1],
        },
    ],
} as const;

/** Type for an upgrade definition */
export type PrestigeUpgradeConfig = (typeof PRESTIGE_CONFIG.UPGRADES)[number];

/** Type for upgrade IDs */
export type PrestigeUpgradeId = PrestigeUpgradeConfig['id'];
