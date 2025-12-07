import { EntityPool } from './entityPool';
import type { GameWorld } from './world';
import { removeComponent } from 'bitecs';
import { decrementEntityCount } from './world';
import {
    Position, Velocity, Health, Shield, Faction, SpriteRef,
    AIBehavior, EnemyWeapon, Projectile, Collider,
    EnemyVariant, SpecialAbility, Target
} from './components';

/**
 * Singleton manager for entity pools
 * Separates pools by entity type for better memory management
 */
export class PoolManager {
    private static instance: PoolManager | null = null;

    private enemyPool: EntityPool | null = null;
    private projectilePool: EntityPool | null = null;
    private effectPool: EntityPool | null = null;



    static getInstance(): PoolManager {
        if (!PoolManager.instance) {
            PoolManager.instance = new PoolManager();
        }
        return PoolManager.instance;
    }

    /**
     * Initialize pools with the game world
     * Call once during game initialization
     */
    init(world: GameWorld): void {
        this.world = world;
        // Pre-allocate pools based on expected usage
        this.enemyPool = new EntityPool(world, 500);      // Enemies
        this.projectilePool = new EntityPool(world, 1000); // Projectiles
        this.effectPool = new EntityPool(world, 200);      // Particles/effects

        console.log('PoolManager initialized with pre-allocated entities');
    }

    private world: GameWorld | null = null;

    /**
     * Acquire an entity for enemy use
     */
    acquireEnemy(): number {
        if (!this.enemyPool) throw new Error('PoolManager not initialized');
        return this.enemyPool.acquire();
    }

    /**
     * Acquire an entity for projectile use
     */
    acquireProjectile(): number {
        if (!this.projectilePool) throw new Error('PoolManager not initialized');
        return this.projectilePool.acquire();
    }

    /**
     * Release an enemy entity back to pool
     */
    releaseEnemy(eid: number): void {
        this.enemyPool?.release(eid);
        decrementEntityCount();

        // Clean up components
        removeComponent(this.world!, Position, eid);
        removeComponent(this.world!, Velocity, eid);
        removeComponent(this.world!, Health, eid);
        removeComponent(this.world!, Shield, eid);
        removeComponent(this.world!, Faction, eid);
        removeComponent(this.world!, SpriteRef, eid);
        removeComponent(this.world!, AIBehavior, eid);
        removeComponent(this.world!, EnemyWeapon, eid);
        removeComponent(this.world!, Collider, eid);
        removeComponent(this.world!, EnemyVariant, eid);
        removeComponent(this.world!, SpecialAbility, eid);
        removeComponent(this.world!, Target, eid);
    }

    /**
     * Release a projectile entity back to pool
     */
    releaseProjectile(eid: number): void {
        this.projectilePool?.release(eid);
        decrementEntityCount();

        // Clean up components
        removeComponent(this.world!, Position, eid);
        removeComponent(this.world!, Velocity, eid);
        removeComponent(this.world!, Projectile, eid);
        removeComponent(this.world!, Collider, eid);
        removeComponent(this.world!, Faction, eid);
        removeComponent(this.world!, SpriteRef, eid);
    }

    /**
     * Get pool statistics for debugging
     */
    getStats(): {
        enemies: { available: number; inUse: number };
        projectiles: { available: number; inUse: number };
    } {
        return {
            enemies: {
                available: this.enemyPool?.getAvailableCount() ?? 0,
                inUse: this.enemyPool?.getInUseCount() ?? 0
            },
            projectiles: {
                available: this.projectilePool?.getAvailableCount() ?? 0,
                inUse: this.projectilePool?.getInUseCount() ?? 0
            }
        };
    }

    /**
     * Clear all pools (for game restart)
     */
    clear(): void {
        this.enemyPool?.clear();
        this.projectilePool?.clear();
        this.effectPool?.clear();
    }

    /**
     * Destroy pools and reset singleton
     */
    destroy(): void {
        this.enemyPool?.destroy();
        this.projectilePool?.destroy();
        this.effectPool?.destroy();
        PoolManager.instance = null;
    }
}
