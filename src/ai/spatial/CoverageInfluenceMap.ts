/**
 * CoverageInfluenceMap
 *
 * Represents turret coverage across the map.
 * Used to identify gaps and avoid over-coverage.
 *
 * @module ai/spatial/CoverageInfluenceMap
 */

import { query } from 'bitecs';
import { Position, Turret, Faction } from '../../ecs/components';
import { FactionId } from '../../types/config/factions';
import { InfluenceMap } from './InfluenceMap';
import type { GameWorld } from '../../ecs/world';

export class CoverageInfluenceMap {
    private map: InfluenceMap;
    private world: GameWorld;

    constructor(world: GameWorld, cellSize: number = 48) {
        this.world = world;
        this.map = new InfluenceMap(cellSize);
    }

    /**
     * Update coverage map based on turret positions
     */
    update(): void {
        this.map.clear();

        const turrets = query(this.world, [Position, Turret, Faction]);

        for (const eid of turrets) {
            // Only count federation turrets
            if (Faction.id[eid] !== FactionId.FEDERATION) continue;

            const x = Position.x[eid];
            const y = Position.y[eid];
            const range = Turret.range[eid];
            const damage = Turret.damage[eid];
            const fireRate = Turret.fireRate[eid];

            // DPS as influence strength
            const dps = damage * fireRate;

            this.map.addSource({
                x,
                y,
                strength: dps,
                radius: range,
                decay: 'linear', // Linear decay for range coverage
            });
        }
    }

    /**
     * Get coverage at position
     */
    getCoverageAt(x: number, y: number): number {
        return this.map.getValueInterpolated(x, y);
    }

    /**
     * Find coverage gaps (low coverage areas)
     */
    findCoverageGaps(threshold: number = 10): { x: number; y: number; value: number }[] {
        const gaps: { x: number; y: number; value: number }[] = [];
        const dims = this.map.getDimensions();
        const values = this.map.getValues();

        for (let row = 0; row < dims.rows; row++) {
            for (let col = 0; col < dims.cols; col++) {
                const index = row * dims.cols + col;
                const value = values[index];

                if (value < threshold) {
                    gaps.push({
                        x: (col + 0.5) * dims.cellSize,
                        y: (row + 0.5) * dims.cellSize,
                        value,
                    });
                }
            }
        }

        // Sort by value ascending (lowest coverage first)
        gaps.sort((a, b) => a.value - b.value);
        return gaps;
    }

    /**
     * Check if position would create over-coverage
     */
    wouldOverlap(x: number, y: number): boolean {
        const currentCoverage = this.getCoverageAt(x, y);
        return currentCoverage > 30; // Threshold for "already covered"
    }

    /**
     * Get underlying map for visualization
     */
    getMap(): InfluenceMap {
        return this.map;
    }
}
