/**
 * Coverage Analyzer for AI Auto-Play
 *
 * Analyzes turret coverage by dividing the play area into sectors.
 * READ-ONLY access to game state.
 *
 * @module ai/CoverageAnalyzer
 */

import { query } from 'bitecs';
import { Position, Turret, Faction } from '../ecs/components';
import { FactionId } from '../types/config/factions';
import { AUTOPLAY_CONFIG } from '../config/autoplay.config';
import { GAME_CONFIG } from '../types/constants';
import type { GameWorld } from '../ecs/world';
import type { CoverageMap, SectorData } from './types';

/**
 * Analyzes turret coverage for AI decision-making.
 */
export class CoverageAnalyzer {
    private world: GameWorld;
    private cols: number;
    private rows: number;
    private sectorWidth: number;
    private sectorHeight: number;
    private sectors: SectorData[];

    constructor(
        world: GameWorld,
        cols: number = AUTOPLAY_CONFIG.SECTOR_GRID_COLS,
        rows: number = AUTOPLAY_CONFIG.SECTOR_GRID_ROWS
    ) {
        this.world = world;
        this.cols = cols;
        this.rows = rows;
        this.sectorWidth = GAME_CONFIG.WORLD_WIDTH / cols;
        this.sectorHeight = GAME_CONFIG.WORLD_HEIGHT / rows;
        this.sectors = this.initializeSectors();
    }

    /**
     * Initialize sector grid
     */
    private initializeSectors(): SectorData[] {
        const sectors: SectorData[] = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                sectors.push({
                    index: row * this.cols + col,
                    x: col * this.sectorWidth + this.sectorWidth / 2,
                    y: row * this.sectorHeight + this.sectorHeight / 2,
                    width: this.sectorWidth,
                    height: this.sectorHeight,
                    turretCount: 0,
                    totalDPS: 0,
                    enemyCount: 0,
                    threatLevel: 0,
                });
            }
        }
        return sectors;
    }

    /**
     * Analyze current turret coverage
     */
    analyze(): CoverageMap {
        // Reset sector data
        for (const sector of this.sectors) {
            sector.turretCount = 0;
            sector.totalDPS = 0;
            sector.enemyCount = 0;
            sector.threatLevel = 0;
        }

        // Query all turrets
        const turrets = query(this.world, [Position, Turret, Faction]);

        for (const eid of turrets) {
            // Only count federation turrets
            if (Faction.id[eid] !== FactionId.FEDERATION) continue;

            const x = Position.x[eid];
            const y = Position.y[eid];
            const damage = Turret.damage[eid] ?? 0;
            const fireRate = Turret.fireRate[eid] ?? 0;
            const range = Turret.range[eid] ?? 0;

            const dps = damage * fireRate;

            // Add turret to its sector
            const sectorIndex = this.getSectorIndex(x, y);
            if (sectorIndex >= 0 && sectorIndex < this.sectors.length) {
                this.sectors[sectorIndex].turretCount++;
                this.sectors[sectorIndex].totalDPS += dps;
            }

            // Also add coverage to nearby sectors within range
            this.addCoverageToNearbySectors(x, y, range, dps);
        }

        // Calculate total coverage
        const coveredSectors = this.sectors.filter((s) => s.totalDPS > 0).length;
        const totalCoverage = coveredSectors / this.sectors.length;

        // Find weakest sector
        const weakestSector = this.findWeakestSector();

        return {
            sectors: [...this.sectors],
            totalCoverage,
            weakestSector,
        };
    }

    /**
     * Add DPS coverage to sectors within turret range
     */
    private addCoverageToNearbySectors(
        turretX: number,
        turretY: number,
        range: number,
        dps: number
    ): void {
        for (const sector of this.sectors) {
            const dx = sector.x - turretX;
            const dy = sector.y - turretY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= range) {
                // Partial coverage based on distance
                const coverageFactor = 1 - distance / range;
                sector.totalDPS += dps * coverageFactor * 0.5; // 50% for overlap
            }
        }
    }

    /**
     * Get sector index for a position
     */
    private getSectorIndex(x: number, y: number): number {
        const col = Math.floor(x / this.sectorWidth);
        const row = Math.floor(y / this.sectorHeight);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return -1;
        }

        return row * this.cols + col;
    }

    /**
     * Find the sector with least coverage relative to threat
     */
    private findWeakestSector(): number {
        let weakestIndex = 0;
        let lowestScore = Infinity;

        for (let i = 0; i < this.sectors.length; i++) {
            const sector = this.sectors[i];
            // Score = DPS (higher is better)
            const score = sector.totalDPS;

            if (score < lowestScore) {
                lowestScore = score;
                weakestIndex = i;
            }
        }

        return weakestIndex;
    }

    /**
     * Get the weakest sector data
     */
    getWeakestSector(): SectorData {
        const coverage = this.analyze();
        return this.sectors[coverage.weakestSector];
    }

    /**
     * Get sector containing a position
     */
    getSectorAt(x: number, y: number): SectorData | null {
        const index = this.getSectorIndex(x, y);
        if (index < 0 || index >= this.sectors.length) {
            return null;
        }
        return this.sectors[index];
    }

    /**
     * Calculate coverage amount at a specific position
     */
    getCoverageAtPosition(x: number, y: number): number {
        const turrets = query(this.world, [Position, Turret, Faction]);
        let totalCoverage = 0;

        for (const eid of turrets) {
            if (Faction.id[eid] !== FactionId.FEDERATION) continue;

            const turretX = Position.x[eid];
            const turretY = Position.y[eid];
            const range = Turret.range[eid] ?? 0;

            const dx = x - turretX;
            const dy = y - turretY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= range) {
                // Coverage factor (higher at center of turret range)
                totalCoverage += 1 - distance / range;
            }
        }

        return totalCoverage;
    }

    /**
     * Find the best position for a new turret in a sector
     */
    findBestPositionInSector(sectorIndex: number): { x: number; y: number } {
        if (sectorIndex < 0 || sectorIndex >= this.sectors.length) {
            // Default to center
            return {
                x: GAME_CONFIG.WORLD_WIDTH / 2,
                y: GAME_CONFIG.WORLD_HEIGHT / 2,
            };
        }

        const sector = this.sectors[sectorIndex];

        // Start at sector center
        let bestX = sector.x;
        let bestY = sector.y;
        let lowestCoverage = this.getCoverageAtPosition(bestX, bestY);

        // Sample grid within sector to find lowest coverage point
        const samples = 4;
        const stepX = sector.width / samples;
        const stepY = sector.height / samples;
        const startX = sector.x - sector.width / 2 + stepX / 2;
        const startY = sector.y - sector.height / 2 + stepY / 2;

        for (let i = 0; i < samples; i++) {
            for (let j = 0; j < samples; j++) {
                const testX = startX + i * stepX;
                const testY = startY + j * stepY;
                const coverage = this.getCoverageAtPosition(testX, testY);

                if (coverage < lowestCoverage) {
                    lowestCoverage = coverage;
                    bestX = testX;
                    bestY = testY;
                }
            }
        }

        return { x: bestX, y: bestY };
    }
}
