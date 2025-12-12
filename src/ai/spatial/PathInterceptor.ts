/**
 * PathInterceptor
 *
 * Calculates optimal turret positions for intercepting enemy paths.
 * Uses flow field data and enemy trajectories to find positions
 * that maximize enemy dwell time within turret range.
 *
 * @module ai/spatial/PathInterceptor
 */

import { GAME_CONFIG } from '../../types/constants';
import { FlowFieldAnalyzer } from './FlowFieldAnalyzer';
import type { ThreatVector } from '../types';

export interface InterceptionPoint {
    x: number;
    y: number;
    score: number;
    dwellTime: number; // Estimated seconds enemy in range
    pathsCovered: number; // Number of enemy paths intercepted
    perpendicularity: number; // 0-1, how perpendicular to flow
}

export interface InterceptionConfig {
    turretRange: number;
    minDwellTime: number; // Minimum acceptable dwell time
    maxDistanceFromKM: number;
    minDistanceFromKM: number;
}

export class PathInterceptor {
    private flowAnalyzer: FlowFieldAnalyzer;
    private kmX: number;
    private kmY: number;

    constructor(flowAnalyzer: FlowFieldAnalyzer) {
        this.flowAnalyzer = flowAnalyzer;
        this.kmX = GAME_CONFIG.WORLD_WIDTH / 2;
        this.kmY = GAME_CONFIG.WORLD_HEIGHT / 2;
    }

    /**
     * Find optimal interception points for a given turret range
     */
    findInterceptionPoints(
        config: InterceptionConfig,
        threats: ThreatVector[],
        existingTurretPositions: { x: number; y: number }[]
    ): InterceptionPoint[] {
        const candidates: InterceptionPoint[] = [];

        // Generate candidate positions in a grid
        const gridStep = 64; // Sample every 64 pixels

        for (let x = 50; x < GAME_CONFIG.WORLD_WIDTH - 50; x += gridStep) {
            for (let y = 50; y < GAME_CONFIG.WORLD_HEIGHT - 50; y += gridStep) {
                // Skip if too close or too far from KM
                const distFromKM = Math.sqrt((x - this.kmX) ** 2 + (y - this.kmY) ** 2);
                if (distFromKM < config.minDistanceFromKM || distFromKM > config.maxDistanceFromKM) {
                    continue;
                }

                // Skip if too close to existing turret
                if (this.isTooCloseToExisting(x, y, existingTurretPositions, 64)) {
                    continue;
                }

                // Calculate interception score
                const point = this.evaluateInterceptionPoint(x, y, config.turretRange, threats);

                if (point.dwellTime >= config.minDwellTime) {
                    candidates.push(point);
                }
            }
        }

        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        return candidates;
    }

    /**
     * Evaluate a single position for interception quality
     */
    private evaluateInterceptionPoint(
        x: number,
        y: number,
        turretRange: number,
        threats: ThreatVector[]
    ): InterceptionPoint {
        // Get flow direction at this position
        const flow = this.flowAnalyzer.getFlowAt(x, y);
        const flowMagnitude = Math.sqrt(flow.x ** 2 + flow.y ** 2);

        // Calculate perpendicularity to flow
        const perpendicularity = flowMagnitude > 0.1 ? 1.0 : 0.5;

        // Calculate dwell time based on flow and range
        const avgEnemySpeed = 100; // pixels/second estimate
        const dwellTime = (2 * turretRange) / avgEnemySpeed;

        // Count how many threat paths this position intercepts
        let pathsCovered = 0;
        let threatInterceptScore = 0;

        for (const threat of threats) {
            const interceptInfo = this.calculatePathIntercept(x, y, turretRange, threat);

            if (interceptInfo.intercepts) {
                pathsCovered++;
                threatInterceptScore += interceptInfo.quality * threat.threatLevel;
            }
        }

        // Traffic density from flow field
        const trafficDensity = this.flowAnalyzer.getTrafficAt(x, y);

        // Calculate final score
        const score =
            trafficDensity * 30 + // Flow traffic weight
            perpendicularity * 15 + // Perpendicular bonus
            pathsCovered * 10 + // Paths covered
            threatInterceptScore * 0.5 + // Threat-weighted intercepts
            dwellTime * 5; // Dwell time bonus

        return {
            x,
            y,
            score,
            dwellTime,
            pathsCovered,
            perpendicularity,
        };
    }

    /**
     * Calculate if and how well a position intercepts a threat's path
     */
    private calculatePathIntercept(
        turretX: number,
        turretY: number,
        turretRange: number,
        threat: ThreatVector
    ): { intercepts: boolean; quality: number } {
        // Enemy current position
        const ex = threat.position.x;
        const ey = threat.position.y;

        // Enemy velocity (direction to KM if stationary)
        let vx = threat.velocity.x;
        let vy = threat.velocity.y;

        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 10) {
            // Use direction to KM
            const dx = this.kmX - ex;
            const dy = this.kmY - ey;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                vx = (dx / dist) * 100;
                vy = (dy / dist) * 100;
            }
        }

        // Calculate closest approach distance
        const closestDist = this.pointToLineDistance(
            turretX,
            turretY,
            ex,
            ey,
            ex + vx * 10,
            ey + vy * 10 // Project path forward
        );

        const intercepts = closestDist <= turretRange;

        // Quality based on how centered the intercept is
        const quality = intercepts ? Math.max(0, 1 - closestDist / turretRange) : 0;

        return { intercepts, quality };
    }

    /**
     * Calculate distance from point to line segment
     */
    private pointToLineDistance(
        px: number,
        py: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        }

        // Project point onto line
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }

    /**
     * Check if position is too close to existing turrets
     */
    private isTooCloseToExisting(
        x: number,
        y: number,
        existing: { x: number; y: number }[],
        minDistance: number
    ): boolean {
        for (const pos of existing) {
            const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            if (dist < minDistance) {
                return true;
            }
        }
        return false;
    }

    /**
     * Find choke points where multiple paths converge
     */
    findChokePoints(minConvergence: number = 3): InterceptionPoint[] {
        const analysis = this.flowAnalyzer.analyze();
        const chokePoints: InterceptionPoint[] = [];

        // High-traffic cells are natural choke points
        for (const cellIndex of analysis.highTrafficCells) {
            const pos = this.flowAnalyzer.getCellWorldPosition(cellIndex);
            const traffic = analysis.trafficDensity[cellIndex];

            if (traffic >= minConvergence / 10) {
                // Normalize threshold
                chokePoints.push({
                    x: pos.x,
                    y: pos.y,
                    score: traffic * 100,
                    dwellTime: 2.0, // Estimate
                    pathsCovered: Math.floor(traffic * 10),
                    perpendicularity: 0.8,
                });
            }
        }

        return chokePoints.slice(0, 10); // Top 10 choke points
    }
}
