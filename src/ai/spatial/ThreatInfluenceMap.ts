/**
 * ThreatInfluenceMap
 *
 * Specialized influence map for enemy threat assessment.
 * Updates based on enemy positions and velocities.
 *
 * @module ai/spatial/ThreatInfluenceMap
 */

import { query } from 'bitecs';
import { Position, Velocity, Health, Faction, EnemyVariant } from '../../ecs/components';
import { FactionId } from '../../types/config/factions';
import { EnemyRank } from '../../types/config/enemies';
import { InfluenceMap } from './InfluenceMap';
import type { GameWorld } from '../../ecs/world';

export class ThreatInfluenceMap {
    private map: InfluenceMap;
    private world: GameWorld;

    constructor(world: GameWorld, cellSize: number = 48) {
        this.world = world;
        this.map = new InfluenceMap(cellSize);
    }

    /**
     * Update threat map based on current enemy positions
     */
    update(): void {
        this.map.clear();

        const enemies = query(this.world, [Position, Velocity, Faction, Health]);

        for (const eid of enemies) {
            // Skip non-enemies
            if (Faction.id[eid] === FactionId.FEDERATION) continue;

            // Skip dead enemies
            const health = Health.current[eid];
            if (health <= 0) continue;

            const x = Position.x[eid];
            const y = Position.y[eid];
            const vx = Velocity.x[eid];
            const vy = Velocity.y[eid];

            // Calculate threat strength
            const strength = this.calculateThreatStrength(eid);

            // Add current position influence
            this.map.addSource({
                x,
                y,
                strength,
                radius: 150,
                decay: 'quadratic',
            });

            // Add predicted position influence (where enemy will be)
            const speed = Math.sqrt(vx * vx + vy * vy);
            if (speed > 10) {
                const predictTime = 2.0; // seconds ahead
                const predictX = x + vx * predictTime;
                const predictY = y + vy * predictTime;

                this.map.addSource({
                    x: predictX,
                    y: predictY,
                    strength: strength * 0.6, // Reduced for prediction
                    radius: 120,
                    decay: 'linear',
                });
            }
        }
    }

    /**
     * Calculate threat strength for an enemy
     */
    private calculateThreatStrength(eid: number): number {
        let strength = 10; // Base threat

        // Health factor
        const healthPercent = Health.current[eid] / Health.max[eid];
        strength += healthPercent * 5;

        // Faction modifier
        const factionId = Faction.id[eid];
        const factionMods: Record<number, number> = {
            [FactionId.KLINGON]: 1.0,
            [FactionId.ROMULAN]: 1.2,
            [FactionId.BORG]: 1.5,
            [FactionId.THOLIAN]: 1.3,
            [FactionId.SPECIES_8472]: 1.8,
        };
        strength *= factionMods[factionId] || 1.0;

        // Elite/Boss modifier - check if entity has variant data
        const rank = EnemyVariant.rank[eid];
        if (rank !== undefined && rank > 0) {
            if (rank === EnemyRank.ELITE) {
                strength *= 2.0;
            } else if (rank === EnemyRank.BOSS) {
                strength *= 4.0;
            }
        }

        return strength;
    }

    /**
     * Get threat level at position
     */
    getThreatAt(x: number, y: number): number {
        return this.map.getValueInterpolated(x, y);
    }

    /**
     * Find highest threat concentration (for AoE targeting)
     */
    findThreatPeaks(count: number = 5): { x: number; y: number; value: number }[] {
        return this.map.findPeaks(5).slice(0, count);
    }

    /**
     * Find safest position (lowest threat)
     */
    findSafestPosition(): { x: number; y: number; value: number } {
        return this.map.findMinimum();
    }

    /**
     * Get underlying map for visualization
     */
    getMap(): InfluenceMap {
        return this.map;
    }
}
