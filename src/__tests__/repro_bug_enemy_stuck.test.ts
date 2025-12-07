
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createWorld, addEntity, addComponent, hasComponent } from 'bitecs';
import { createEnemyCollisionSystem } from '../systems/enemyCollisionSystem';
import { createDamageSystem } from '../systems/damageSystem';
import { Position, Health, Faction, AIBehavior, Shield, SpriteRef, Velocity } from '../ecs/components';
import { FactionId, GAME_CONFIG } from '../types/constants';
import { PoolManager } from '../ecs/PoolManager';

// Mock audio and particle system
vi.mock('../audio', () => ({
    AudioManager: {
        getInstance: () => ({
            play: vi.fn()
        })
    },
    SoundType: {
        EXPLOSION_SMALL: 'explosion_small',
        EXPLOSION_LARGE: 'explosion_large'
    }
}));

describe('Enemy Destruction Repro', () => {
    let world: any;
    let kobayashiMaruId: number;
    let enemyCollisionSystem: any;
    let damageSystem: any;
    let poolManager: PoolManager;

    beforeEach(() => {
        world = createWorld();
        poolManager = PoolManager.getInstance();
        poolManager.init(world);

        // Create Kobayashi Maru
        kobayashiMaruId = addEntity(world);
        addComponent(world, Position, kobayashiMaruId);
        Position.x[kobayashiMaruId] = 960;
        Position.y[kobayashiMaruId] = 540;
        addComponent(world, Health, kobayashiMaruId);
        Health.current[kobayashiMaruId] = 1000;
        addComponent(world, Shield, kobayashiMaruId);
        Shield.current[kobayashiMaruId] = 100;
        addComponent(world, Faction, kobayashiMaruId);
        Faction.id[kobayashiMaruId] = FactionId.FEDERATION;

        // Create systems
        enemyCollisionSystem = createEnemyCollisionSystem(undefined, () => kobayashiMaruId);
        damageSystem = createDamageSystem(undefined);
    });

    afterEach(() => {
        poolManager.destroy();
    });

    it('should destroy enemy when colliding with Kobayashi Maru', () => {
        // 1. Acquire enemy from pool (simulating WaveSpawner)
        const enemyId = poolManager.acquireEnemy(); // Use pool manager to ensure components are managed by it

        // Setup enemy components (PoolManager acquire only gives ID, we must add comps or they are added by factory)
        // Actually acquireEnemy() from PoolManager just returns an ID from the pool.
        // We need to add components manually as if genericFactory did it.

        addComponent(world, Position, enemyId);
        Position.x[enemyId] = 960; // Impact!
        Position.y[enemyId] = 540;

        addComponent(world, Health, enemyId);
        Health.current[enemyId] = 50;
        Health.max[enemyId] = 50;

        addComponent(world, Faction, enemyId);
        Faction.id[enemyId] = FactionId.KLINGON;

        addComponent(world, AIBehavior, enemyId);
        addComponent(world, SpriteRef, enemyId); // Important for rendering check

        // Verify setup
        expect(hasComponent(world, Position, enemyId)).toBe(true);
        expect(Health.current[enemyId]).toBe(50);

        // 2. Run EnemyCollisionSystem
        enemyCollisionSystem.update(world);

        // Expect health to be 0
        expect(Health.current[enemyId]).toBe(0);

        // 3. Run DamageSystem
        damageSystem.update(world);

        // Expect entity to be released and components removed
        expect(hasComponent(world, Position, enemyId)).toBe(false);
        expect(hasComponent(world, Health, enemyId)).toBe(false);
        expect(hasComponent(world, SpriteRef, enemyId)).toBe(false);

        // Expect pool statistics to show available
        const stats = poolManager.getStats();
        expect(stats.enemies.inUse).toBe(0);
    });
});
