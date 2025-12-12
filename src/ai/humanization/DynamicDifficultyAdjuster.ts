/**
 * DynamicDifficultyAdjuster
 *
 * Adjusts AI behavior based on player performance.
 * Makes game harder when winning, easier when losing.
 *
 * @module ai/humanization/DynamicDifficultyAdjuster
 */

export interface DifficultyMetrics {
    healthPercent: number;
    wavesCompleted: number;
    totalWaves: number;
    turretCount: number;
    killCount: number;
}

export interface DifficultyAdjustment {
    reactionMultiplier: number; // < 1 = faster reactions
    accuracyMultiplier: number; // > 1 = better placement
    economyMultiplier: number; // > 1 = smarter spending
}

export class DynamicDifficultyAdjuster {
    private performanceHistory: number[] = [];
    private readonly historySize = 5;

    /**
     * Calculate performance score from metrics
     */
    calculatePerformance(metrics: DifficultyMetrics): number {
        // Health factor (0-40 points)
        const healthScore = metrics.healthPercent * 0.4;

        // Progress factor (0-30 points)
        const progressScore =
            metrics.totalWaves > 0 ? (metrics.wavesCompleted / metrics.totalWaves) * 30 : 15;

        // Efficiency factor (0-30 points)
        const efficiency = metrics.turretCount > 0 ? metrics.killCount / metrics.turretCount : 0;
        const efficiencyScore = Math.min(30, efficiency * 3);

        return healthScore + progressScore + efficiencyScore;
    }

    /**
     * Update performance history
     */
    recordPerformance(metrics: DifficultyMetrics): void {
        const score = this.calculatePerformance(metrics);
        this.performanceHistory.push(score);

        if (this.performanceHistory.length > this.historySize) {
            this.performanceHistory.shift();
        }
    }

    /**
     * Get difficulty adjustment based on performance
     */
    getAdjustment(): DifficultyAdjustment {
        if (this.performanceHistory.length === 0) {
            return {
                reactionMultiplier: 1.0,
                accuracyMultiplier: 1.0,
                economyMultiplier: 1.0,
            };
        }

        const avgPerformance =
            this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

        // Performance 0-100, centered around 50
        // Below 50 = player struggling, make AI better
        // Above 50 = player doing well, make AI slightly worse

        if (avgPerformance < 30) {
            // Struggling badly - AI helps more
            return {
                reactionMultiplier: 0.7, // Faster
                accuracyMultiplier: 1.3, // More accurate
                economyMultiplier: 1.2, // Smarter spending
            };
        } else if (avgPerformance < 50) {
            // Struggling - slight boost
            return {
                reactionMultiplier: 0.85,
                accuracyMultiplier: 1.15,
                economyMultiplier: 1.1,
            };
        } else if (avgPerformance > 70) {
            // Doing great - AI backs off slightly
            return {
                reactionMultiplier: 1.2,
                accuracyMultiplier: 0.9,
                economyMultiplier: 0.95,
            };
        } else {
            // Balanced
            return {
                reactionMultiplier: 1.0,
                accuracyMultiplier: 1.0,
                economyMultiplier: 1.0,
            };
        }
    }

    /**
     * Get current difficulty level description
     */
    getDifficultyLevel(): 'easy' | 'normal' | 'hard' {
        const adjustment = this.getAdjustment();
        if (adjustment.reactionMultiplier < 0.9) return 'hard';
        if (adjustment.reactionMultiplier > 1.1) return 'easy';
        return 'normal';
    }

    /**
     * Reset adjustment state
     */
    reset(): void {
        this.performanceHistory = [];
    }
}
