/**
 * BehaviorPredictor
 *
 * Predicts enemy positions based on their AI behavior type.
 * More accurate than simple velocity extrapolation.
 *
 * @module ai/behaviors/BehaviorPredictor
 */

import { AIBehaviorType, GAME_CONFIG } from '../../types/constants';

export interface PredictedPosition {
    x: number;
    y: number;
    time: number; // Seconds from now
    confidence: number; // 0-1, decreases over time
}

export interface BehaviorPrediction {
    positions: PredictedPosition[];
    effectiveRange: number; // How far from path enemy might deviate
    approachAngle: number; // Angle of approach to KM
}

export class BehaviorPredictor {
    private kmX: number;
    private kmY: number;

    constructor() {
        this.kmX = GAME_CONFIG.WORLD_WIDTH / 2;
        this.kmY = GAME_CONFIG.WORLD_HEIGHT / 2;
    }

    /**
     * Predict future positions for an enemy based on behavior type
     */
    predict(
        currentX: number,
        currentY: number,
        velocityX: number,
        velocityY: number,
        behaviorType: number,
        entityId: number,
        timeHorizon: number = 5.0
    ): BehaviorPrediction {
        switch (behaviorType) {
            case AIBehaviorType.DIRECT:
                return this.predictDirect(currentX, currentY, velocityX, velocityY, timeHorizon);

            case AIBehaviorType.STRAFE:
                return this.predictStrafe(currentX, currentY, velocityX, velocityY, entityId, timeHorizon);

            case AIBehaviorType.ORBIT:
                return this.predictOrbit(currentX, currentY, timeHorizon);

            case AIBehaviorType.SWARM:
                return this.predictSwarm(currentX, currentY, velocityX, velocityY, timeHorizon);

            case AIBehaviorType.HUNTER:
                return this.predictHunter(currentX, currentY, velocityX, velocityY, timeHorizon);

            default:
                return this.predictDirect(currentX, currentY, velocityX, velocityY, timeHorizon);
        }
    }

    /**
     * DIRECT: Simple linear extrapolation
     */
    private predictDirect(
        x: number,
        y: number,
        vx: number,
        vy: number,
        timeHorizon: number
    ): BehaviorPrediction {
        const positions: PredictedPosition[] = [];
        const steps = 10;
        const dt = timeHorizon / steps;

        for (let i = 1; i <= steps; i++) {
            const t = i * dt;
            positions.push({
                x: x + vx * t,
                y: y + vy * t,
                time: t,
                confidence: 1.0 - (t / timeHorizon) * 0.3, // High confidence
            });
        }

        return {
            positions,
            effectiveRange: 20, // Very predictable
            approachAngle: Math.atan2(this.kmY - y, this.kmX - x),
        };
    }

    /**
     * STRAFE: Sinusoidal weaving pattern
     */
    private predictStrafe(
        x: number,
        y: number,
        vx: number,
        vy: number,
        entityId: number,
        timeHorizon: number
    ): BehaviorPrediction {
        const positions: PredictedPosition[] = [];
        const steps = 10;
        const dt = timeHorizon / steps;

        // Strafe parameters (from aiSystem.ts)
        const frequency = 3; // Hz
        const amplitude = 0.5;

        // Direction to KM
        const dx = this.kmX - x;
        const dy = this.kmY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 0;

        // Perpendicular direction
        const perpX = -dirY;
        const perpY = dirX;

        const speed = Math.sqrt(vx * vx + vy * vy) || 80;

        for (let i = 1; i <= steps; i++) {
            const t = i * dt;
            const gameTime = t; // Approximate

            // Strafe offset
            const strafe = Math.sin(gameTime * frequency + entityId) * amplitude;

            // Combined movement
            const moveX = (dirX + perpX * strafe) * speed * t;
            const moveY = (dirY + perpY * strafe) * speed * t;

            positions.push({
                x: x + moveX,
                y: y + moveY,
                time: t,
                confidence: 0.7 - (t / timeHorizon) * 0.4, // Lower confidence due to weaving
            });
        }

        return {
            positions,
            effectiveRange: 80, // Wide deviation possible
            approachAngle: Math.atan2(dy, dx),
        };
    }

    /**
     * ORBIT: Approach then circle at fixed distance
     */
    private predictOrbit(x: number, y: number, timeHorizon: number): BehaviorPrediction {
        const positions: PredictedPosition[] = [];
        const steps = 10;
        const dt = timeHorizon / steps;

        const orbitRadius = GAME_CONFIG.ORBIT_RADIUS; // 300
        const orbitSpeed = GAME_CONFIG.ORBIT_SPEED; // 50
        const approachSpeed = GAME_CONFIG.ORBIT_APPROACH_SPEED; // 40

        let currentX = x;
        let currentY = y;

        for (let i = 1; i <= steps; i++) {
            const currentDist = Math.sqrt((this.kmX - currentX) ** 2 + (this.kmY - currentY) ** 2);

            if (currentDist > orbitRadius + 20) {
                // Still approaching
                const dx = this.kmX - currentX;
                const dy = this.kmY - currentY;
                const d = Math.sqrt(dx * dx + dy * dy);

                currentX += (dx / d) * approachSpeed * dt;
                currentY += (dy / d) * approachSpeed * dt;
            } else {
                // Orbiting
                const angle = Math.atan2(currentY - this.kmY, currentX - this.kmX);
                const angularSpeed = orbitSpeed / orbitRadius;
                const newAngle = angle + angularSpeed * dt;

                currentX = this.kmX + Math.cos(newAngle) * orbitRadius;
                currentY = this.kmY + Math.sin(newAngle) * orbitRadius;
            }

            const t = i * dt;
            positions.push({
                x: currentX,
                y: currentY,
                time: t,
                confidence: 0.8 - (t / timeHorizon) * 0.3,
            });
        }

        return {
            positions,
            effectiveRange: 50,
            approachAngle: Math.atan2(this.kmY - y, this.kmX - x),
        };
    }

    /**
     * SWARM: Direct with noise
     */
    private predictSwarm(
        x: number,
        y: number,
        vx: number,
        vy: number,
        timeHorizon: number
    ): BehaviorPrediction {
        const positions: PredictedPosition[] = [];
        const steps = 10;
        const dt = timeHorizon / steps;

        const noiseAmp = 0.2;
        const speed = Math.sqrt(vx * vx + vy * vy) || 90;

        const dx = this.kmX - x;
        const dy = this.kmY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 0;

        for (let i = 1; i <= steps; i++) {
            const t = i * dt;

            // Use deterministic noise based on step (reproducible)
            const noiseX = Math.sin(i * 0.7) * noiseAmp;
            const noiseY = Math.cos(i * 1.3) * noiseAmp;

            positions.push({
                x: x + (dirX + noiseX) * speed * t,
                y: y + (dirY + noiseY) * speed * t,
                time: t,
                confidence: 0.75 - (t / timeHorizon) * 0.35,
            });
        }

        return {
            positions,
            effectiveRange: 40,
            approachAngle: Math.atan2(dy, dx),
        };
    }

    /**
     * HUNTER: Targets nearest turret, then KM
     * Note: Without turret positions, falls back to direct
     */
    private predictHunter(
        x: number,
        y: number,
        vx: number,
        vy: number,
        timeHorizon: number
    ): BehaviorPrediction {
        // Hunter behavior depends on turret positions
        // For prediction, assume direct path (worst case)
        const prediction = this.predictDirect(x, y, vx, vy, timeHorizon);
        prediction.effectiveRange = 60; // Less predictable
        return prediction;
    }
}
