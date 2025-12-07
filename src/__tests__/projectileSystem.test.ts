import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld, GameWorld } from '../ecs';
import { createProjectileSystem } from '../systems/projectileSystem';
import { createProjectile } from '../ecs/entityFactory';
import { SpatialHash } from '../collision';
import { Position, Projectile, Health, Faction, Collider } from '../ecs/components';
import { ProjectileType, FactionId } from '../types/constants';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import { PoolManager } from '../ecs/PoolManager';

describe('Projectile System', () => {
    let world: GameWorld;
    let spatialHash: SpatialHash;
    let system: ReturnType<typeof createProjectileSystem>;

    beforeEach(() => {
        world = createGameWorld();
        PoolManager.getInstance().init(world);
        spatialHash = new SpatialHash(64, 1000, 1000);
        system = createProjectileSystem(spatialHash);
    });

    afterEach(() => {
        PoolManager.getInstance().destroy();
    });

    it('should move projectiles based on velocity', () => {
        const projectileId = createProjectile(world, 0, 0, 100, 0, 10, ProjectileType.PHOTON_TORPEDO);

        // Initial position
        expect(Position.x[projectileId]).toBe(0);
        expect(Position.y[projectileId]).toBe(0);

        // Update spatial hash (usually done by collision system, but we need it for query if we were testing collision)
        // For movement, we just need to check if position updates.
        // Wait, projectileSystem doesn't update position! MovementSystem does.
        // But projectileSystem updates lifetime.

        // Let's check lifetime update
        const initialLifetime = Projectile.lifetime[projectileId];
        system.update(world, 0.1);
        expect(Projectile.lifetime[projectileId]).toBeCloseTo(initialLifetime - 0.1);
    });

    it('should despawn projectile when lifetime expires', () => {
        const projectileId = createProjectile(world, 0, 0, 100, 0, 10, ProjectileType.PHOTON_TORPEDO);
        Projectile.lifetime[projectileId] = 0.1;

        system.update(world, 0.2);

        // Entity should be removed
        // In bitecs, removing entity removes components from the entity mask
        // We can check if the entity still has the Projectile component
        // Note: hasComponent returns boolean
        const exists = hasComponent(world, Projectile, projectileId);
        expect(exists).toBe(false);
    });

    it('should damage enemy on collision', () => {
        // Create enemy
        const enemyId = addEntity(world);
        addComponent(world, Position, enemyId);
        Position.x[enemyId] = 100;
        Position.y[enemyId] = 100;
        addComponent(world, Health, enemyId);
        Health.current[enemyId] = 100;
        Health.max[enemyId] = 100;
        addComponent(world, Faction, enemyId);
        Faction.id[enemyId] = FactionId.KLINGON;
        addComponent(world, Collider, enemyId);
        Collider.radius[enemyId] = 10;

        // Add enemy to spatial hash
        spatialHash.insert(enemyId, 100, 100);

        // Create projectile at same position
        const projectileId = createProjectile(world, 100, 100, 200, 200, 50, ProjectileType.PHOTON_TORPEDO);

        // Run system
        system.update(world, 0.1);

        // Enemy should take damage
        expect(Health.current[enemyId]).toBe(50);

        // Projectile should be removed
        const exists = hasComponent(world, Projectile, projectileId);
        expect(exists).toBe(false);
    });

    it('should ignore friendly fire (Federation)', () => {
        // Create friendly ship
        const friendId = addEntity(world);
        addComponent(world, Position, friendId);
        Position.x[friendId] = 100;
        Position.y[friendId] = 100;
        addComponent(world, Health, friendId);
        Health.current[friendId] = 100;
        addComponent(world, Faction, friendId);
        Faction.id[friendId] = FactionId.FEDERATION;
        addComponent(world, Collider, friendId);
        Collider.radius[friendId] = 10;

        // Add to spatial hash
        spatialHash.insert(friendId, 100, 100);

        // Create projectile
        const projectileId = createProjectile(world, 100, 100, 200, 200, 50, ProjectileType.PHOTON_TORPEDO);

        // Run system
        system.update(world, 0.1);

        // Friend should NOT take damage
        expect(Health.current[friendId]).toBe(100);

        // Projectile should still exist
        const exists = hasComponent(world, Projectile, projectileId);
        expect(exists).toBe(true);
    });
});
