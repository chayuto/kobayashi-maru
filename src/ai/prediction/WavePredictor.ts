/**
 * WavePredictor
 *
 * Predicts upcoming wave composition for proactive turret placement.
 * Parses wave configuration to recommend counter-turrets.
 *
 * @module ai/prediction/WavePredictor
 */

import { TurretType, AIBehaviorType } from '../../types/constants';
import { FactionId } from '../../types/config/factions';

export interface WavePrediction {
    waveNumber: number;
    expectedFactions: number[];
    expectedBehaviors: number[];
    recommendedTurrets: number[];
    threatLevel: 'low' | 'medium' | 'high' | 'boss';
    isBossWave: boolean;
}

export class WavePredictor {

    /**
     * Behavior-to-counter turret mapping
     */
    private static readonly BEHAVIOR_COUNTERS: Record<number, number[]> = {
        [AIBehaviorType.DIRECT]: [TurretType.TORPEDO_LAUNCHER, TurretType.PLASMA_CANNON],
        [AIBehaviorType.STRAFE]: [TurretType.POLARON_BEAM, TurretType.PHASER_ARRAY],
        [AIBehaviorType.ORBIT]: [TurretType.TORPEDO_LAUNCHER, TurretType.TETRYON_BEAM],
        [AIBehaviorType.SWARM]: [TurretType.PHASER_ARRAY, TurretType.PLASMA_CANNON],
        [AIBehaviorType.HUNTER]: [TurretType.TORPEDO_LAUNCHER, TurretType.POLARON_BEAM],
    };

    /**
     * Predict wave composition based on wave number
     * Uses heuristics since we don't have direct wave config access
     */
    predictWave(waveNumber: number): WavePrediction {
        // Early waves: Klingon (DIRECT)
        // Mid waves: Mix of factions
        // Late waves: Borg and Species 8472
        // Boss waves: Every 5th wave

        const isBossWave = waveNumber % 5 === 0 && waveNumber > 0;
        const expectedFactions: number[] = [];
        const expectedBehaviors: number[] = [];

        if (waveNumber <= 3) {
            // Early game - Klingons
            expectedFactions.push(FactionId.KLINGON);
            expectedBehaviors.push(AIBehaviorType.DIRECT);
        } else if (waveNumber <= 7) {
            // Early-mid - Klingons + Romulans
            expectedFactions.push(FactionId.KLINGON, FactionId.ROMULAN);
            expectedBehaviors.push(AIBehaviorType.DIRECT, AIBehaviorType.STRAFE);
        } else if (waveNumber <= 12) {
            // Mid game - Mixed with Tholians
            expectedFactions.push(FactionId.ROMULAN, FactionId.THOLIAN);
            expectedBehaviors.push(AIBehaviorType.STRAFE, AIBehaviorType.ORBIT);
        } else if (waveNumber <= 18) {
            // Late-mid - Borg appear
            expectedFactions.push(FactionId.THOLIAN, FactionId.BORG);
            expectedBehaviors.push(AIBehaviorType.ORBIT, AIBehaviorType.SWARM);
        } else {
            // Late game - All factions including 8472
            expectedFactions.push(FactionId.BORG, FactionId.SPECIES_8472);
            expectedBehaviors.push(AIBehaviorType.SWARM, AIBehaviorType.HUNTER);
        }

        // Boss waves add elite variants
        if (isBossWave) {
            // Boss waves typically feature the hardest faction for that tier
            if (waveNumber <= 10) {
                expectedFactions.push(FactionId.ROMULAN);
            } else if (waveNumber <= 20) {
                expectedFactions.push(FactionId.BORG);
            } else {
                expectedFactions.push(FactionId.SPECIES_8472);
            }
        }

        // Get recommended turrets based on expected behaviors
        const recommendedTurrets = this.getRecommendedTurrets(expectedBehaviors);

        // Determine threat level
        let threatLevel: 'low' | 'medium' | 'high' | 'boss' = 'low';
        if (isBossWave) {
            threatLevel = 'boss';
        } else if (waveNumber > 15) {
            threatLevel = 'high';
        } else if (waveNumber > 7) {
            threatLevel = 'medium';
        }

        return {
            waveNumber,
            expectedFactions: [...new Set(expectedFactions)],
            expectedBehaviors: [...new Set(expectedBehaviors)],
            recommendedTurrets,
            threatLevel,
            isBossWave,
        };
    }

    /**
     * Get recommended turrets for expected behaviors
     */
    private getRecommendedTurrets(behaviors: number[]): number[] {
        const turretScores: Record<number, number> = {};

        for (const behavior of behaviors) {
            const counters = WavePredictor.BEHAVIOR_COUNTERS[behavior] || [];
            for (let i = 0; i < counters.length; i++) {
                const turret = counters[i];
                // First counter gets higher score
                turretScores[turret] = (turretScores[turret] || 0) + (2 - i * 0.5);
            }
        }

        // Sort by score
        return Object.entries(turretScores)
            .sort((a, b) => b[1] - a[1])
            .map(([type]) => parseInt(type));
    }

    /**
     * Check if resources should be saved for upcoming boss wave
     */
    shouldSaveForBoss(currentWave: number, currentResources: number): boolean {
        const nextBossWave = Math.ceil((currentWave + 1) / 5) * 5;
        const wavesUntilBoss = nextBossWave - currentWave;

        if (wavesUntilBoss <= 2) {
            // Save at least 200 for boss wave
            return currentResources < 400;
        }

        return false;
    }

    /**
     * Get summary string for prediction
     */
    getPredictionSummary(prediction: WavePrediction): string {
        const threats = prediction.expectedFactions.map((f) => this.getFactionName(f)).join(', ');
        return `Wave ${prediction.waveNumber}: ${prediction.threatLevel.toUpperCase()} - Expect ${threats}`;
    }

    private getFactionName(factionId: number): string {
        switch (factionId) {
            case FactionId.KLINGON:
                return 'Klingon';
            case FactionId.ROMULAN:
                return 'Romulan';
            case FactionId.THOLIAN:
                return 'Tholian';
            case FactionId.BORG:
                return 'Borg';
            case FactionId.SPECIES_8472:
                return 'Species 8472';
            default:
                return 'Unknown';
        }
    }
}
