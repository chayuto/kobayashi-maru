/**
 * ApproachCorridorAnalyzer
 *
 * Identifies the main approach corridors enemies use to reach
 * the Kobayashi Maru. Used for strategic turret placement.
 *
 * @module ai/spatial/ApproachCorridorAnalyzer
 */

import { GAME_CONFIG } from '../../types/constants';
import { FlowFieldAnalyzer } from './FlowFieldAnalyzer';

export interface ApproachCorridor {
    id: number;
    startEdge: 'top' | 'right' | 'bottom' | 'left';
    centerLine: { x: number; y: number }[];
    width: number;
    trafficVolume: number;
}

export class ApproachCorridorAnalyzer {
    private flowAnalyzer: FlowFieldAnalyzer;

    constructor(flowAnalyzer: FlowFieldAnalyzer) {
        this.flowAnalyzer = flowAnalyzer;
    }

    /**
     * Identify main approach corridors from each edge
     */
    identifyCorridors(): ApproachCorridor[] {
        const corridors: ApproachCorridor[] = [];
        const edges: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];

        let corridorId = 0;

        for (const edge of edges) {
            const edgeCorridors = this.analyzeEdge(edge, corridorId);
            corridors.push(...edgeCorridors);
            corridorId += edgeCorridors.length;
        }

        return corridors;
    }

    /**
     * Analyze a single edge for approach corridors
     */
    private analyzeEdge(
        edge: 'top' | 'right' | 'bottom' | 'left',
        startId: number
    ): ApproachCorridor[] {
        const corridors: ApproachCorridor[] = [];
        const samplePoints = this.getEdgeSamplePoints(edge, 5);

        for (let i = 0; i < samplePoints.length; i++) {
            const start = samplePoints[i];
            const centerLine = this.tracePathToCenter(start.x, start.y);

            if (centerLine.length > 5) {
                const traffic = this.flowAnalyzer.getTrafficAt(start.x, start.y);

                corridors.push({
                    id: startId + i,
                    startEdge: edge,
                    centerLine,
                    width: 100, // Default corridor width
                    trafficVolume: traffic,
                });
            }
        }

        return corridors;
    }

    /**
     * Get sample points along an edge
     */
    private getEdgeSamplePoints(
        edge: 'top' | 'right' | 'bottom' | 'left',
        count: number
    ): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        const margin = 50;

        for (let i = 0; i < count; i++) {
            const t = (i + 1) / (count + 1);

            switch (edge) {
                case 'top':
                    points.push({ x: t * GAME_CONFIG.WORLD_WIDTH, y: margin });
                    break;
                case 'bottom':
                    points.push({ x: t * GAME_CONFIG.WORLD_WIDTH, y: GAME_CONFIG.WORLD_HEIGHT - margin });
                    break;
                case 'left':
                    points.push({ x: margin, y: t * GAME_CONFIG.WORLD_HEIGHT });
                    break;
                case 'right':
                    points.push({ x: GAME_CONFIG.WORLD_WIDTH - margin, y: t * GAME_CONFIG.WORLD_HEIGHT });
                    break;
            }
        }

        return points;
    }

    /**
     * Trace a path from start to center following flow field
     */
    private tracePathToCenter(startX: number, startY: number): { x: number; y: number }[] {
        const path: { x: number; y: number }[] = [];
        let x = startX;
        let y = startY;
        const step = 32;
        const maxSteps = 100;

        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

        for (let i = 0; i < maxSteps; i++) {
            path.push({ x, y });

            // Check if reached center
            const distToCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (distToCenter < 50) break;

            // Follow flow
            const flow = this.flowAnalyzer.getFlowAt(x, y);
            if (flow.x === 0 && flow.y === 0) break;

            x += flow.x * step;
            y += flow.y * step;
        }

        return path;
    }

    /**
     * Get optimal turret positions along a corridor
     */
    getCorridorDefensePositions(
        corridor: ApproachCorridor,
        turretRange: number,
        count: number = 3
    ): { x: number; y: number }[] {
        const positions: { x: number; y: number }[] = [];
        const pathLength = corridor.centerLine.length;

        // Place turrets at intervals along the corridor
        for (let i = 0; i < count; i++) {
            const t = (i + 1) / (count + 1);
            const pathIndex = Math.floor(t * pathLength);

            if (pathIndex < pathLength) {
                const point = corridor.centerLine[pathIndex];

                // Offset perpendicular to path for better coverage
                const prevPoint = corridor.centerLine[Math.max(0, pathIndex - 1)];
                const dx = point.x - prevPoint.x;
                const dy = point.y - prevPoint.y;
                const len = Math.sqrt(dx * dx + dy * dy);

                if (len > 0) {
                    // Perpendicular offset
                    const perpX = -dy / len;
                    const perpY = dx / len;
                    const offset = turretRange * 0.3;

                    positions.push({
                        x: point.x + perpX * offset,
                        y: point.y + perpY * offset,
                    });
                } else {
                    positions.push(point);
                }
            }
        }

        return positions;
    }
}
