/**
 * AI System for Kobayashi Maru
 * 
 * Controls enemy movement behavior based on assigned AI patterns.
 * Each enemy has an AIBehavior component that determines how it moves.
 * 
 * ## Behavior Types
 * - **DIRECT** (Klingon) - Straight line to target, fastest approach
 * - **STRAFE** (Romulan) - Sinusoidal weaving while approaching
 * - **FLANK** (unused) - Circle around to attack from side
 * - **SWARM** (Borg) - Group movement with slight noise
 * - **HUNTER** (Species 8472) - Prioritizes nearest turret over Kobayashi Maru
 * - **ORBIT** (Tholian) - Slow approach, then circles at fixed distance
 * 
 * ## Usage
 * The system is created once and called each frame:
 * ```typescript
 * const aiSystem = createAISystem();
 * systemManager.register('ai', { update: aiSystem }, 200);
 * ```
 * 
 * @module systems/aiSystem
 * @see AIBehaviorType in constants.ts for behavior type values
 * @see AIBehavior component for entity AI data
 */
import { defineQuery } from 'bitecs';
import { GameWorld } from '../ecs/world';
import { Position, Velocity, AIBehavior, Faction, Turret } from '../ecs/components';
import { AIBehaviorType, GAME_CONFIG } from '../types/constants';

/** Query for entities with AI behavior (all enemies) */
const aiQuery = defineQuery([Position, Velocity, AIBehavior, Faction]);

/** Query for turrets (used by Hunter behavior to find targets) */
const turretQuery = defineQuery([Position, Turret]);

/**
 * Creates the AI system that controls enemy movement.
 * 
 * The returned function should be called each frame to update
 * all enemy velocities based on their assigned behavior type.
 * 
 * @returns System update function `(world, deltaTime, gameTime) => void`
 * 
 * @example
 * ```typescript
 * const aiSystem = createAISystem();
 * 
 * // In game loop
 * aiSystem(world, deltaTime, gameTime);
 * 
 * // Or register with SystemManager
 * systemManager.register('ai', { 
 *   update: aiSystem 
 * }, 200, { requiresGameTime: true });
 * ```
 */
export function createAISystem() {
    /** Center of screen - default target (Kobayashi Maru position) */
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

    /**
     * AI system update function.
     * 
     * @param world - The ECS world containing entities
     * @param _deltaTime - Time since last frame (unused, velocity-based)
     * @param gameTime - Total elapsed game time (for oscillation effects)
     */
    return function aiSystem(world: GameWorld, _deltaTime: number, gameTime: number) {
        const entities = aiQuery(world);
        const turrets = turretQuery(world);

        for (let i = 0; i < entities.length; i++) {
            const eid = entities[i];
            const behaviorType = AIBehavior.behaviorType[eid];

            // Current position
            const posX = Position.x[eid];
            const posY = Position.y[eid];

            // Default target: Kobayashi Maru (center of screen)
            let targetX = centerX;
            let targetY = centerY;

            // Execute behavior-specific movement logic
            switch (behaviorType) {
                case AIBehaviorType.DIRECT:
                    // Klingon: Aggressive straight-line approach
                    updateDirectBehavior(eid, posX, posY, targetX, targetY);
                    break;

                case AIBehaviorType.STRAFE:
                    // Romulan: Evasive weaving approach
                    updateStrafeBehavior(eid, posX, posY, targetX, targetY, gameTime);
                    break;

                case AIBehaviorType.FLANK:
                    // Unused: Flanking maneuver
                    updateFlankBehavior(eid, posX, posY, targetX, targetY);
                    break;

                case AIBehaviorType.SWARM:
                    // Borg: Coordinated group movement
                    updateSwarmBehavior(eid, posX, posY, targetX, targetY, gameTime);
                    break;

                case AIBehaviorType.HUNTER: {
                    // Species 8472: Hunt nearest turret first
                    const nearestTurret = findNearestTurret(posX, posY, turrets);
                    if (nearestTurret !== -1) {
                        targetX = Position.x[nearestTurret];
                        targetY = Position.y[nearestTurret];
                    }
                    updateDirectBehavior(eid, posX, posY, targetX, targetY);
                    break;
                }

                case AIBehaviorType.ORBIT:
                    // Tholian: Slow approach then orbit at distance
                    updateOrbitBehavior(eid, posX, posY, targetX, targetY, gameTime);
                    break;
            }
        }
    };
}

/**
 * DIRECT behavior: Straight line to target.
 * 
 * Used by Klingons for aggressive, fastest approach.
 * Maintains current speed magnitude while updating direction.
 * 
 * @param eid - Entity ID
 * @param posX - Current X position
 * @param posY - Current Y position
 * @param targetX - Target X position
 * @param targetY - Target Y position
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
 * STRAFE behavior: Sinusoidal weaving while approaching.
 * 
 * Used by Romulans for evasive movement. Entity weaves side-to-side
 * while still making progress toward target. Makes them harder to hit.
 * 
 * @param eid - Entity ID
 * @param posX - Current X position
 * @param posY - Current Y position
 * @param targetX - Target X position
 * @param targetY - Target Y position
 * @param gameTime - Game time for oscillation calculation
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

/**
 * Updates velocity for Orbit behavior
 * Slow approach to orbit distance, then circle around target
 */
function updateOrbitBehavior(eid: number, posX: number, posY: number, targetX: number, targetY: number, gameTime: number) {
    const dx = targetX - posX;
    const dy = targetY - posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 0) return;

    // Determine orbit direction based on entity ID (some clockwise, some counter-clockwise)
    const orbitDirection = (eid % 2 === 0) ? 1 : -1;

    const orbitRadius = GAME_CONFIG.ORBIT_RADIUS;
    const orbitSpeed = GAME_CONFIG.ORBIT_SPEED;
    const approachSpeed = GAME_CONFIG.ORBIT_APPROACH_SPEED;

    if (dist > orbitRadius + 20) {
        // Phase 1: Approach slowly until reaching orbit distance
        // Move directly toward target at slow speed
        const dirX = dx / dist;
        const dirY = dy / dist;

        Velocity.x[eid] = dirX * approachSpeed;
        Velocity.y[eid] = dirY * approachSpeed;
    } else {
        // Phase 2: Orbit around target at fixed distance
        // Calculate tangent direction for circular motion
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Perpendicular (tangent) direction for orbit
        const tangentX = -dirY * orbitDirection;
        const tangentY = dirX * orbitDirection;

        // Also add slight inward/outward correction to maintain orbit radius
        const radiusError = dist - orbitRadius;
        const correctionStrength = 0.3;

        // Add slight oscillation for more interesting movement
        const oscillation = Math.sin(gameTime * 0.5 + eid) * 0.1;

        // Combine tangent motion with radius correction
        Velocity.x[eid] = (tangentX + dirX * radiusError * correctionStrength * 0.1 + oscillation * -dirY) * orbitSpeed;
        Velocity.y[eid] = (tangentY + dirY * radiusError * correctionStrength * 0.1 + oscillation * dirX) * orbitSpeed;
    }
}
