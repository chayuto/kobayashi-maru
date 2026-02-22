/**
 * Prestige / Meta-Progression Manager for Kobayashi Maru
 *
 * Manages commendations (meta-currency), upgrades, and persistent progress.
 * Follows the HighScoreManager localStorage pattern.
 *
 * @module game/PrestigeManager
 */
import { PRESTIGE_CONFIG, PrestigeUpgradeId } from '../config/prestige.config';

/**
 * Persistent prestige data stored in localStorage.
 */
export interface PrestigeData {
    /** Total commendations available to spend */
    commendations: number;
    /** Total commendations earned across all runs */
    totalEarned: number;
    /** Number of completed runs */
    totalRuns: number;
    /** Upgrade levels keyed by upgrade ID */
    upgradeLevels: Record<string, number>;
}

/**
 * Score data used to calculate commendation rewards.
 */
export interface PrestigeScoreData {
    waveNumber: number;
    enemiesDefeated: number;
    timeSurvived: number;
}

const DEFAULT_PRESTIGE_DATA: PrestigeData = {
    commendations: 0,
    totalEarned: 0,
    totalRuns: 0,
    upgradeLevels: {},
};

/**
 * Manages prestige progression and persistent upgrades.
 */
export class PrestigeManager {
    private data: PrestigeData;

    constructor() {
        this.data = this.load();
    }

    /**
     * Load prestige data from localStorage.
     */
    private load(): PrestigeData {
        try {
            const raw = localStorage.getItem(PRESTIGE_CONFIG.STORAGE_KEY);
            if (!raw) return { ...DEFAULT_PRESTIGE_DATA, upgradeLevels: {} };

            const parsed = JSON.parse(raw);
            if (this.isValidPrestigeData(parsed)) {
                return parsed;
            }
            return { ...DEFAULT_PRESTIGE_DATA, upgradeLevels: {} };
        } catch {
            return { ...DEFAULT_PRESTIGE_DATA, upgradeLevels: {} };
        }
    }

    /**
     * Save prestige data to localStorage.
     */
    private save(): void {
        try {
            localStorage.setItem(
                PRESTIGE_CONFIG.STORAGE_KEY,
                JSON.stringify(this.data)
            );
        } catch {
            // Silently fail (localStorage may be full or unavailable)
        }
    }

    /**
     * Validate prestige data structure.
     */
    private isValidPrestigeData(data: unknown): data is PrestigeData {
        if (typeof data !== 'object' || data === null) return false;
        const d = data as Record<string, unknown>;
        return (
            typeof d.commendations === 'number' &&
            typeof d.totalEarned === 'number' &&
            typeof d.totalRuns === 'number' &&
            typeof d.upgradeLevels === 'object' &&
            d.upgradeLevels !== null
        );
    }

    /**
     * Calculate commendations earned from a run.
     */
    calculateReward(scoreData: PrestigeScoreData): number {
        const r = PRESTIGE_CONFIG.REWARD;
        const raw = r.BASE
            + scoreData.waveNumber * r.PER_WAVE
            + scoreData.enemiesDefeated * r.PER_KILL
            + scoreData.timeSurvived * r.PER_SECOND;
        return Math.floor(raw);
    }

    /**
     * Award commendations from a completed run.
     * Returns the number of commendations earned.
     */
    awardCommendations(scoreData: PrestigeScoreData): number {
        const earned = this.calculateReward(scoreData);
        this.data.commendations += earned;
        this.data.totalEarned += earned;
        this.data.totalRuns += 1;
        this.save();
        return earned;
    }

    /**
     * Purchase an upgrade. Returns true if successful.
     */
    purchaseUpgrade(upgradeId: PrestigeUpgradeId): boolean {
        const upgrade = PRESTIGE_CONFIG.UPGRADES.find(u => u.id === upgradeId);
        if (!upgrade) return false;

        const currentLevel = this.data.upgradeLevels[upgradeId] ?? 0;
        if (currentLevel >= upgrade.maxLevel) return false;

        const cost = upgrade.costs[currentLevel];
        if (this.data.commendations < cost) return false;

        this.data.commendations -= cost;
        this.data.upgradeLevels[upgradeId] = currentLevel + 1;
        this.save();
        return true;
    }

    /**
     * Get the current bonus value for an upgrade.
     * Returns 0 if the upgrade has not been purchased.
     */
    getBonus(upgradeId: PrestigeUpgradeId): number {
        const upgrade = PRESTIGE_CONFIG.UPGRADES.find(u => u.id === upgradeId);
        if (!upgrade) return 0;

        const level = this.data.upgradeLevels[upgradeId] ?? 0;
        if (level === 0) return 0;
        return upgrade.bonusPerLevel[level - 1];
    }

    /**
     * Get the current level of an upgrade.
     */
    getUpgradeLevel(upgradeId: PrestigeUpgradeId): number {
        return this.data.upgradeLevels[upgradeId] ?? 0;
    }

    /**
     * Get a copy of the current prestige data.
     */
    getPrestigeData(): PrestigeData {
        return { ...this.data, upgradeLevels: { ...this.data.upgradeLevels } };
    }

    /**
     * Get available commendations.
     */
    getCommendations(): number {
        return this.data.commendations;
    }

    /**
     * Reset all prestige data. Use with caution.
     */
    reset(): void {
        this.data = { ...DEFAULT_PRESTIGE_DATA, upgradeLevels: {} };
        this.save();
    }
}
