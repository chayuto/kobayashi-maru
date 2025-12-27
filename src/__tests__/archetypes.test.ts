/**
 * Tests for Entity Archetypes
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld } from '../ecs/world';
import { PoolManager } from '../ecs/PoolManager';
import { createEnemy, createTurret, createKobayashiMaru, createProjectile } from '../ecs/entityFactory';
import { ARCHETYPES, validateArchetype } from '../ecs/archetypes';
import { FactionId, TurretType, ProjectileType } from '../types/constants';

describe('Entity Archetypes', () => {
    let world: ReturnType<typeof createGameWorld>;

    beforeEach(() => {
        world = createGameWorld();
        PoolManager.getInstance().init(world);
    });

    afterEach(() => {
        PoolManager.getInstance().destroy();
    });

    describe('ARCHETYPES definitions', () => {
        it('should have ENEMY archetype defined', () => {
            expect(ARCHETYPES.ENEMY).toBeDefined();
            expect(ARCHETYPES.ENEMY.name).toBe('Enemy');
            expect(ARCHETYPES.ENEMY.required.length).toBeGreaterThan(0);
        });

        it('should have TURRET archetype defined', () => {
            expect(ARCHETYPES.TURRET).toBeDefined();
            expect(ARCHETYPES.TURRET.name).toBe('Turret');
            expect(ARCHETYPES.TURRET.required.length).toBeGreaterThan(0);
        });

        it('should have PROJECTILE archetype defined', () => {
            expect(ARCHETYPES.PROJECTILE).toBeDefined();
            expect(ARCHETYPES.PROJECTILE.name).toBe('Projectile');
            expect(ARCHETYPES.PROJECTILE.required.length).toBeGreaterThan(0);
        });

        it('should have KOBAYASHI_MARU archetype defined', () => {
            expect(ARCHETYPES.KOBAYASHI_MARU).toBeDefined();
            expect(ARCHETYPES.KOBAYASHI_MARU.name).toBe('Kobayashi Maru');
            expect(ARCHETYPES.KOBAYASHI_MARU.required.length).toBeGreaterThan(0);
        });
    });

    describe('validateArchetype', () => {
        it('should validate enemy entity against ENEMY archetype', () => {
            const eid = createEnemy(world, FactionId.KLINGON, 100, 100);
            const result = validateArchetype(world, eid, ARCHETYPES.ENEMY);
            
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
            expect(result.missingComponents.length).toBe(0);
        });

        it('should validate turret entity against TURRET archetype', () => {
            const eid = createTurret(world, 200, 200, TurretType.PHASER_ARRAY);
            const result = validateArchetype(world, eid, ARCHETYPES.TURRET);
            
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should validate projectile entity against PROJECTILE archetype', () => {
            const eid = createProjectile(world, 100, 100, 200, 200, 10, ProjectileType.PHOTON_TORPEDO);
            const result = validateArchetype(world, eid, ARCHETYPES.PROJECTILE);
            
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should validate Kobayashi Maru against KOBAYASHI_MARU archetype', () => {
            const eid = createKobayashiMaru(world, 960, 540);
            const result = validateArchetype(world, eid, ARCHETYPES.KOBAYASHI_MARU);
            
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should detect missing components', () => {
            // Create an incomplete enemy (manually, without all components)
            const eid = createEnemy(world, FactionId.ROMULAN, 100, 100);
            
            // Try to validate against TURRET archetype (should fail because enemy doesn't have Turret component)
            const result = validateArchetype(world, eid, ARCHETYPES.TURRET);
            
            expect(result.valid).toBe(false);
            expect(result.missingComponents.length).toBeGreaterThan(0);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('Archetype descriptions', () => {
        it('ENEMY archetype should have description', () => {
            expect(ARCHETYPES.ENEMY.description).toContain('Hostile');
        });

        it('TURRET archetype should have description', () => {
            expect(ARCHETYPES.TURRET.description).toContain('defensive');
        });

        it('PROJECTILE archetype should have description', () => {
            expect(ARCHETYPES.PROJECTILE.description).toContain('ammunition');
        });
    });
});
