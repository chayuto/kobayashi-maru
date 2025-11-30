/**
 * AI System
 * Controls enemy behavior based on assigned patterns (Direct, Strafe, Flank, etc.)
 */
import { defineQuery } from 'bitecs';
import { GameWorld } from '../ecs/world';
import { Position, Velocity, AIBehavior, Faction, Turret } from '../ecs/components';
import { AIBehaviorType, GAME_CONFIG } from '../types/constants';

// Query for entities with AI behavior
const aiQuery = defineQuery([Position, Velocity, AIBehavior, Faction]);

// Query for turrets (for Hunter behavior)
const turretQuery = defineQuery([Position, Turret]);

/**
 * Creates the AI system
 * @returns The system update function
 */
export function createAISystem() {
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

    return function aiSystem(world: GameWorld, _deltaTime: number, gameTime: number) {
        const entities = aiQuery(world);
        const turrets = turretQuery(world);

        for (let i = 0; i < entities.length; i++) {
            const eid = entities[i];
            const behaviorType = AIBehavior.behaviorType[eid];
            // aggression is available for future use or fine-tuning behaviors
            // const aggression = AIBehavior.aggression[eid]; 

            // Current position
            const posX = Position.x[eid];
            const posY = Position.y[eid];

            // Default target: Kobayashi Maru (Center)
            let targetX = centerX;
            let targetY = centerY;

            // Behavior-specific logic
            switch (behaviorType) {
                case AIBehaviorType.DIRECT:
                    // Simple bee-line to target
                    updateDirectBehavior(eid, posX, posY, targetX, targetY);
                    break;

                case AIBehaviorType.STRAFE:
                    // Sinusoidal movement while approaching
                    updateStrafeBehavior(eid, posX, posY, targetX, targetY, gameTime);
                    break;

                case AIBehaviorType.FLANK:
                    // Circle around to attack from side
                    updateFlankBehavior(eid, posX, posY, targetX, targetY);
                    break;

                case AIBehaviorType.SWARM:
                    // Move as group (simplified: similar to direct but with some noise/separation)
                    // For MVP, we'll use a modified direct behavior with some noise
                    updateSwarmBehavior(eid, posX, posY, targetX, targetY, gameTime);
                    break;

                case AIBehaviorType.HUNTER: {
                    // Prioritize nearest turret
                    const nearestTurret = findNearestTurret(posX, posY, turrets);
                    if (nearestTurret !== -1) {
                        targetX = Position.x[nearestTurret];
                        targetY = Position.y[nearestTurret];
                    }
                    updateDirectBehavior(eid, posX, posY, targetX, targetY);
                    break;
                }
            }
        }
    };
}

/**
 * Updates velocity for Direct behavior
 */
function updateDirectBehavior(eid: number, posX: number, posY: number, targetX: number, targetY: number) {
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
        // Get current speed magnitude to preserve it
        const currentVx = Velocity.x[eid];
        const currentVy = Velocity.y[eid];
        const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy) || 100; // Default speed if 0

        Velocity.x[eid] = (dx / dist) * speed;
        Velocity.y[eid] = (dy / dist) * speed;
    }
}

/**
 * Updates velocity for Strafe behavior
 */
function updateStrafeBehavior(eid: number, posX: number, posY: number, targetX: number, targetY: number, gameTime: number) {
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
        const currentVx = Velocity.x[eid];
        const currentVy = Velocity.y[eid];
        const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy) || 80;

        // Normalized direction to target
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Perpendicular direction
        const perpX = -dirY;
        const perpY = dirX;

        // Strafe calculation
        const frequency = 3; // Hz
        const amplitude = 0.5; // Strength of strafe
        const strafe = Math.sin(gameTime * frequency + eid) * amplitude;

        // Combine forward and strafe
        Velocity.x[eid] = (dirX + perpX * strafe) * speed;
        Velocity.y[eid] = (dirY + perpY * strafe) * speed;

        // Re-normalize to maintain speed
        const newMag = Math.sqrt(Velocity.x[eid] * Velocity.x[eid] + Velocity.y[eid] * Velocity.y[eid]);
        if (newMag > 0) {
            Velocity.x[eid] = (Velocity.x[eid] / newMag) * speed;
            Velocity.y[eid] = (Velocity.y[eid] / newMag) * speed;
        }
    }
}

/**
 * Updates velocity for Flank behavior
 */
function updateFlankBehavior(eid: number, posX: number, posY: number, targetX: number, targetY: number) {
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
        const currentVx = Velocity.x[eid];
        const currentVy = Velocity.y[eid];
        const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy) || 120;

        // Determine flank direction based on entity ID (some left, some right)
        const flankSide = (eid % 2 === 0) ? 1 : -1;

        // Flank angle changes based on distance (spiral in)
        // Far away: approach at 45 degrees
        // Close: approach directly
        const flankFactor = Math.min(1, dist / 500);
        const angle = (Math.PI / 4) * flankFactor * flankSide;

        // Rotate vector
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const dirX = dx / dist;
        const dirY = dy / dist;

        const newDirX = dirX * cos - dirY * sin;
        const newDirY = dirX * sin + dirY * cos;

        Velocity.x[eid] = newDirX * speed;
        Velocity.y[eid] = newDirY * speed;
    }
}

/**
 * Updates velocity for Swarm behavior
 */
function updateSwarmBehavior(eid: number, posX: number, posY: number, targetX: number, targetY: number, gameTime: number) {
    // For MVP, swarm is just direct movement with some noise to simulate "organic" movement
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
        const currentVx = Velocity.x[eid];
        const currentVy = Velocity.y[eid];
        const speed = Math.sqrt(currentVx * currentVx + currentVy * currentVy) || 90;

        const dirX = dx / dist;
        const dirY = dy / dist;

        // Add noise
        const noiseFreq = 0.5;
        const noiseAmp = 0.2;
        const noiseX = Math.sin(gameTime * noiseFreq + eid * 0.1) * noiseAmp;
        const noiseY = Math.cos(gameTime * noiseFreq + eid * 0.1) * noiseAmp;

        Velocity.x[eid] = (dirX + noiseX) * speed;
        Velocity.y[eid] = (dirY + noiseY) * speed;

        // Re-normalize
        const newMag = Math.sqrt(Velocity.x[eid] * Velocity.x[eid] + Velocity.y[eid] * Velocity.y[eid]);
        if (newMag > 0) {
            Velocity.x[eid] = (Velocity.x[eid] / newMag) * speed;
            Velocity.y[eid] = (Velocity.y[eid] / newMag) * speed;
        }
    }
}

/**
 * Finds the nearest turret to the given position
 */
function findNearestTurret(x: number, y: number, turrets: number[]): number {
    let nearestDistSq = Infinity;
    let nearestEid = -1;

    for (let i = 0; i < turrets.length; i++) {
        const eid = turrets[i];
        const tx = Position.x[eid];
        const ty = Position.y[eid];
        const dx = x - tx;
        const dy = y - ty;
        const distSq = dx * dx + dy * dy;

        if (distSq < nearestDistSq) {
            nearestDistSq = distSq;
            nearestEid = eid;
        }
    }

    return nearestEid;
}
