/**
 * SynergyDetector
 *
 * Detects and scores turret synergies for optimal placement.
 * Different turret types work better together in combinations.
 *
 * @module ai/behaviors/SynergyDetector
 */

import { TurretType, TURRET_CONFIG } from '../../types/constants';

export interface SynergyPair {
    turretA: number;
    turretB: number;
    multiplier: number;
    reason: string;
}

export class SynergyDetector {
    /**
     * Synergy matrix: [TurretA][TurretB] = effectiveness multiplier
     */
    private static readonly SYNERGY_MATRIX: Record<number, Record<number, number>> = {
        // Tetryon strips shields, Torpedo does hull damage
        [TurretType.TETRYON_BEAM]: {
            [TurretType.TORPEDO_LAUNCHER]: 1.5,
            [TurretType.PLASMA_CANNON]: 1.3,
            [TurretType.DISRUPTOR_BANK]: 1.2,
        },
        // Polaron slows enemies, other turrets hit more
        [TurretType.POLARON_BEAM]: {
            [TurretType.PLASMA_CANNON]: 1.4, // DOT for longer
            [TurretType.TORPEDO_LAUNCHER]: 1.3, // Easier to hit
            [TurretType.PHASER_ARRAY]: 1.2,
        },
        // Phaser rapid fire + Disruptor sustained = constant DPS
        [TurretType.PHASER_ARRAY]: {
            [TurretType.DISRUPTOR_BANK]: 1.25,
            [TurretType.TETRYON_BEAM]: 1.15,
        },
        // Torpedo long range + Phaser short range = depth
        [TurretType.TORPEDO_LAUNCHER]: {
            [TurretType.PHASER_ARRAY]: 1.3,
            [TurretType.DISRUPTOR_BANK]: 1.2,
        },
        // Plasma DOT + Polaron slow = maximum damage over time
        [TurretType.PLASMA_CANNON]: {
            [TurretType.POLARON_BEAM]: 1.4,
            [TurretType.TETRYON_BEAM]: 1.2,
        },
        // Disruptor consistent + Torpedo burst = balanced
        [TurretType.DISRUPTOR_BANK]: {
            [TurretType.TORPEDO_LAUNCHER]: 1.2,
            [TurretType.PHASER_ARRAY]: 1.25,
        },
    };

    /**
     * Get synergy multiplier between two turret types
     */
    getSynergyMultiplier(turretA: number, turretB: number): number {
        return SynergyDetector.SYNERGY_MATRIX[turretA]?.[turretB] || 1.0;
    }

    /**
     * Calculate synergy score for placing a turret near existing turrets
     */
    calculatePlacementSynergy(
        newTurretType: number,
        nearbyTurretTypes: number[]
    ): { score: number; synergies: SynergyPair[] } {
        let totalScore = 0;
        const synergies: SynergyPair[] = [];

        for (const existingType of nearbyTurretTypes) {
            const multiplier = this.getSynergyMultiplier(newTurretType, existingType);
            const reverseMultiplier = this.getSynergyMultiplier(existingType, newTurretType);

            const effectiveMultiplier = Math.max(multiplier, reverseMultiplier);

            if (effectiveMultiplier > 1.0) {
                totalScore += (effectiveMultiplier - 1.0) * 100;
                synergies.push({
                    turretA: newTurretType,
                    turretB: existingType,
                    multiplier: effectiveMultiplier,
                    reason: this.getSynergyReason(newTurretType, existingType),
                });
            }
        }

        return { score: totalScore, synergies };
    }

    /**
     * Get all synergies for a turret type
     */
    getSynergiesFor(turretType: number): SynergyPair[] {
        const synergies: SynergyPair[] = [];
        const direct = SynergyDetector.SYNERGY_MATRIX[turretType];

        if (direct) {
            for (const [partnerStr, multiplier] of Object.entries(direct)) {
                synergies.push({
                    turretA: turretType,
                    turretB: parseInt(partnerStr),
                    multiplier,
                    reason: this.getSynergyReason(turretType, parseInt(partnerStr)),
                });
            }
        }

        return synergies;
    }

    /**
     * Get human-readable synergy reason
     */
    private getSynergyReason(turretA: number, turretB: number): string {
        const nameA = TURRET_CONFIG[turretA]?.name || 'Unknown';
        const nameB = TURRET_CONFIG[turretB]?.name || 'Unknown';

        // Specific synergy explanations
        if (turretA === TurretType.TETRYON_BEAM && turretB === TurretType.TORPEDO_LAUNCHER) {
            return `${nameA} strips shields, ${nameB} deals hull damage`;
        }
        if (turretA === TurretType.POLARON_BEAM && turretB === TurretType.PLASMA_CANNON) {
            return `${nameA} slows enemies, ${nameB} burns longer`;
        }
        if (turretA === TurretType.PHASER_ARRAY && turretB === TurretType.DISRUPTOR_BANK) {
            return `${nameA} rapid fire + ${nameB} sustained = constant DPS`;
        }

        return `${nameA} + ${nameB} combo`;
    }

    /**
     * Find best turret type to complement existing turrets
     */
    findBestComplement(
        existingTypes: number[],
        availableResources: number
    ): { turretType: number; synergyScore: number } | null {
        let bestType: number | null = null;
        let bestScore = 0;

        for (const [typeStr, config] of Object.entries(TURRET_CONFIG)) {
            const type = parseInt(typeStr);
            if (config.cost > availableResources) continue;

            const { score } = this.calculatePlacementSynergy(type, existingTypes);

            if (score > bestScore) {
                bestScore = score;
                bestType = type;
            }
        }

        return bestType !== null ? { turretType: bestType, synergyScore: bestScore } : null;
    }
}
