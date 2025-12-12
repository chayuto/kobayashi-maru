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
import { FlowFieldAnalyzer } from './spatial/FlowFieldAnalyzer';
import type { GameWorld } from '../ecs/world';
import type { CoverageMap, SectorData, ThreatVector } from './types';

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
    private flowAnalyzer: FlowFieldAnalyzer;

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
        this.flowAnalyzer = new FlowFieldAnalyzer();
        this.flowAnalyzer.analyze();
    }

    /**
     * Get the flow field analyzer for external access
     */
    getFlowAnalyzer(): FlowFieldAnalyzer {
        return this.flowAnalyzer;
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
     * Uses threat data to prefer positions that intercept enemy approach paths
     */
    findBestPositionInSector(sectorIndex: number, threats?: ThreatVector[]): { x: number; y: number } {
        if (sectorIndex < 0 || sectorIndex >= this.sectors.length) {
            // Default to center
            return {
                x: GAME_CONFIG.WORLD_WIDTH / 2,
                y: GAME_CONFIG.WORLD_HEIGHT / 2,
            };
        }

        const sector = this.sectors[sectorIndex];
        const kmX = GAME_CONFIG.WORLD_WIDTH / 2;
        const kmY = GAME_CONFIG.WORLD_HEIGHT / 2;

        // Sample grid within sector
        const samples = 5;
        const stepX = sector.width / samples;
        const stepY = sector.height / samples;
        const startX = sector.x - sector.width / 2 + stepX / 2;
        const startY = sector.y - sector.height / 2 + stepY / 2;

        let bestX = sector.x;
        let bestY = sector.y;
        let bestScore = -Infinity;

        for (let i = 0; i < samples; i++) {
            for (let j = 0; j < samples; j++) {
                const testX = startX + i * stepX;
                const testY = startY + j * stepY;

                const score = this.scorePosition(testX, testY, kmX, kmY, threats);

                if (score > bestScore) {
                    bestScore = score;
                    bestX = testX;
                    bestY = testY;
                }
            }
        }

        return { x: bestX, y: bestY };
    }

    /**
     * Score a position based on threat interception, coverage, and flow field traffic
     */
    private scorePosition(
        x: number,
        y: number,
        kmX: number,
        kmY: number,
        threats?: ThreatVector[]
    ): number {
        let score = 0;
        const interceptWeight = AUTOPLAY_CONFIG.THREAT_INTERCEPT_WEIGHT;
        const defenseWeight = AUTOPLAY_CONFIG.DEFENSIVE_DISTANCE_WEIGHT;
        const pathTolerance = AUTOPLAY_CONFIG.APPROACH_PATH_TOLERANCE;

        // 1. Traffic density score (0-40 points)
        // Higher traffic = more enemies will pass through this position
        const traffic = this.flowAnalyzer.getTrafficAt(x, y);
        score += traffic * 40;

        // 2. Penalize existing coverage (prefer less covered areas)
        const existingCoverage = this.getCoverageAtPosition(x, y);
        score -= existingCoverage * 20;

        // 3. Score based on distance from KM (prefer defensive ring)
        const distFromKM = Math.sqrt((x - kmX) ** 2 + (y - kmY) ** 2);
        const optimalDist = AUTOPLAY_CONFIG.OPTIMAL_KM_DISTANCE;
        const distPenalty = Math.abs(distFromKM - optimalDist) / 100;
        score += (1 - distPenalty) * 15 * defenseWeight;

        // 4. Score based on threat interception
        if (threats && threats.length > 0) {
            let interceptScore = 0;
            const maxThreatsToConsider = Math.min(10, threats.length);

            for (let i = 0; i < maxThreatsToConsider; i++) {
                const threat = threats[i];

                // Calculate distance from position to the line between enemy and KM
                const distToPath = this.distanceToLine(
                    x, y,
                    threat.position.x, threat.position.y,
                    kmX, kmY
                );

                // Score based on how close position is to approach path
                if (distToPath < pathTolerance) {
                    const pathScore = 1 - (distToPath / pathTolerance);
                    // Weight by threat level
                    interceptScore += pathScore * (threat.threatLevel / 100);
                }
            }

            // Normalize by number of threats considered
            score += (interceptScore / maxThreatsToConsider) * 25 * interceptWeight;
        }

        return score;
    }

    /**
     * Calculate distance from point to line segment
     */
    private distanceToLine(
        px: number, py: number,
        x1: number, y1: number,
        x2: number, y2: number
    ): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            // Line segment is a point
            return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        }

        // Project point onto line, clamping to segment
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }
}
