/**
 * Projectile System for Kobayashi Maru
 * Handles projectile movement, lifetime, and collision detection
 */
import { defineQuery, hasComponent, IWorld, removeEntity } from 'bitecs';
import { Position, Velocity, Projectile, Collider, Health, Shield, Faction } from '../ecs/components';
import { SpatialHash } from '../collision';
import { decrementEntityCount } from '../ecs/world';
import { FactionId } from '../types/constants';

// Query for active projectiles
const projectileQuery = defineQuery([Position, Velocity, Projectile, Collider]);

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

    function projectileSystem(world: IWorld, deltaTime: number, currentTime?: number): IWorld {
        gameTime = currentTime ?? gameTime + deltaTime;
        const projectiles = projectileQuery(world);

        for (const eid of projectiles) {
            // 1. Update lifetime
            Projectile.lifetime[eid] -= deltaTime;
            if (Projectile.lifetime[eid] <= 0) {
                removeEntity(world, eid);
                decrementEntityCount();
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
                if (!hasComponent(world, Health, targetEid)) continue;
                if (Health.current[targetEid] <= 0) continue;

                // Check faction (don't hit friendly)
                if (hasComponent(world, Faction, targetEid)) {
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
                const targetRadius = hasComponent(world, Collider, targetEid) ? Collider.radius[targetEid] : 16;

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
                removeEntity(world, eid);
                decrementEntityCount();
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

/**
 * Applies damage to an entity, prioritizing shields over health
 * (Duplicated from combatSystem - should ideally be a shared utility)
 */
function applyDamage(world: IWorld, entityId: number, damage: number): void {
    // Apply damage to shields first if entity has Shield component
    if (hasComponent(world, Shield, entityId)) {
        const currentShield = Shield.current[entityId];
        if (currentShield > 0) {
            const shieldDamage = Math.min(currentShield, damage);
            Shield.current[entityId] = currentShield - shieldDamage;
            damage -= shieldDamage;
        }
    }

    // Apply remaining damage to health
    if (damage > 0) {
        const currentHealth = Health.current[entityId];
        Health.current[entityId] = Math.max(0, currentHealth - damage);
    }
}
