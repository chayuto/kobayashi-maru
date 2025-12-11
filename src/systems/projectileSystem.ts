/**
 * Projectile System for Kobayashi Maru
 * Handles projectile movement, lifetime, and collision detection
 */
import { query, hasComponent, World } from 'bitecs';
import { Position, Velocity, Projectile, Collider, Health, Faction } from '../ecs/components';
import { SpatialHash } from '../collision';
import { FactionId } from '../types/constants';
import { applyDamage } from '../services';
import { PoolManager } from '../ecs/PoolManager';

// Callback type for recording projectile hits
type ProjectileHitCallback = (damage: number, currentTime: number) => void;

/**
 * Creates the projectile system
 * @param spatialHash - Spatial hash for collision detection
 * @returns A system function that updates projectiles
 */
export function createProjectileSystem(spatialHash: SpatialHash) {
    let onHitCallback: ProjectileHitCallback | null = null;
    let gameTime = 0;

    function projectileSystem(world: World, deltaTime: number, currentTime?: number): World {
        gameTime = currentTime ?? gameTime + deltaTime;
        const projectiles = query(world, [Position, Velocity, Projectile, Collider]);

        for (const eid of projectiles) {
            // 1. Update lifetime
            Projectile.lifetime[eid] -= deltaTime;
            if (Projectile.lifetime[eid] <= 0) {
                // Return to pool instead of destroying
                PoolManager.getInstance().releaseProjectile(eid);
                continue;
            }

            // 2. Movement is handled by movementSystem, but we might want homing logic here later
            // For now, linear movement is sufficient as set by initial velocity

            // 3. Collision Detection
            const x = Position.x[eid];
            const y = Position.y[eid];
            const radius = Collider.radius[eid];
            const damage = Projectile.damage[eid];

            // Query nearby entities using spatial hash
            // We want to find enemies (Faction != FEDERATION)
            const nearby = spatialHash.query(x, y, radius);

            let hit = false;

            for (const targetEid of nearby) {
                // Skip self
                if (targetEid === eid) continue;

                // Check if target is valid and has health
                if (!hasComponent(world, targetEid, Health)) continue;
                if (Health.current[targetEid] <= 0) continue;

                // Check faction (don't hit friendly)
                if (hasComponent(world, targetEid, Faction)) {
                    // Ignore Federation ships (friendly fire)
                    if (Faction.id[targetEid] === FactionId.FEDERATION) continue;
                    // Ignore other projectiles
                    if (Faction.id[targetEid] === FactionId.PROJECTILE) continue;
                }

                // Simple circle collision check
                const targetX = Position.x[targetEid];
                const targetY = Position.y[targetEid];
                // Assuming enemies have a default radius if not specified (e.g., 16)
                // Ideally enemies should have Collider component too
                const targetRadius = hasComponent(world, targetEid, Collider) ? Collider.radius[targetEid] : 16;

                const dx = x - targetX;
                const dy = y - targetY;
                const distSq = dx * dx + dy * dy;
                const radiusSum = radius + targetRadius;

                if (distSq <= radiusSum * radiusSum) {
                    // Collision!
                    const actualDamage = applyDamage(world, targetEid, damage);
                    // Record hit for stats
                    if (onHitCallback && actualDamage > 0) {
                        onHitCallback(actualDamage, gameTime);
                    }
                    hit = true;
                    break; // Only hit one target
                }
            }

            if (hit) {
                // Return to pool instead of destroying
                PoolManager.getInstance().releaseProjectile(eid);
            }
        }

        return world;
    }

    /**
     * Set callback for when projectiles hit targets
     */
    function onHit(callback: ProjectileHitCallback): void {
        onHitCallback = callback;
    }

    return {
        update: projectileSystem,
        onHit
    };
}
