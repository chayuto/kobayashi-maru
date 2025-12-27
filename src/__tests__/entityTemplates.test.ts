/**
 * Tests for Entity Templates
 */
import { describe, it, expect } from 'vitest';
import {
    ENEMY_TEMPLATES,
    getEnemyTemplate,
    getEnemyFactionIds,
    TURRET_TEMPLATES,
    getTurretTemplate,
    getTurretTypes,
    PROJECTILE_TEMPLATES,
    getProjectileTemplate,
    getProjectileTypes,
} from '../ecs/entityTemplates';
import { FactionId, TurretType, ProjectileType } from '../types/constants';

describe('Entity Templates', () => {
    describe('Enemy Templates', () => {
        it('should have templates for all factions', () => {
            expect(ENEMY_TEMPLATES[FactionId.KLINGON]).toBeDefined();
            expect(ENEMY_TEMPLATES[FactionId.ROMULAN]).toBeDefined();
            expect(ENEMY_TEMPLATES[FactionId.BORG]).toBeDefined();
            expect(ENEMY_TEMPLATES[FactionId.THOLIAN]).toBeDefined();
            expect(ENEMY_TEMPLATES[FactionId.SPECIES_8472]).toBeDefined();
            expect(ENEMY_TEMPLATES[FactionId.FEDERATION]).toBeDefined();
        });

        it('should have correct Klingon template values', () => {
            const template = ENEMY_TEMPLATES[FactionId.KLINGON];
            expect(template.name).toBe('Klingon Bird of Prey');
            expect(template.health).toBe(80);
            expect(template.shield).toBe(30);
            expect(template.ai.behaviorType).toBeDefined();
        });

        it('should have weapon config for Tholian', () => {
            const template = ENEMY_TEMPLATES[FactionId.THOLIAN];
            expect(template.weapon).toBeDefined();
            expect(template.weapon?.range).toBe(350);
            expect(template.weapon?.damage).toBe(15);
        });

        it('getEnemyTemplate should return correct template', () => {
            const template = getEnemyTemplate(FactionId.BORG);
            expect(template).toBeDefined();
            expect(template?.name).toBe('Borg Cube');
            expect(template?.health).toBe(160);
        });

        it('getEnemyTemplate should return undefined for invalid faction', () => {
            const template = getEnemyTemplate(999);
            expect(template).toBeUndefined();
        });

        it('getEnemyFactionIds should return all faction IDs', () => {
            const factionIds = getEnemyFactionIds();
            expect(factionIds).toContain(FactionId.KLINGON);
            expect(factionIds).toContain(FactionId.ROMULAN);
            expect(factionIds).toContain(FactionId.BORG);
            expect(factionIds.length).toBeGreaterThanOrEqual(5);
        });
    });

    describe('Turret Templates', () => {
        it('should have templates for all turret types', () => {
            expect(TURRET_TEMPLATES[TurretType.PHASER_ARRAY]).toBeDefined();
            expect(TURRET_TEMPLATES[TurretType.TORPEDO_LAUNCHER]).toBeDefined();
            expect(TURRET_TEMPLATES[TurretType.DISRUPTOR_BANK]).toBeDefined();
            expect(TURRET_TEMPLATES[TurretType.TETRYON_BEAM]).toBeDefined();
            expect(TURRET_TEMPLATES[TurretType.PLASMA_CANNON]).toBeDefined();
            expect(TURRET_TEMPLATES[TurretType.POLARON_BEAM]).toBeDefined();
        });

        it('should have correct Phaser Array template values', () => {
            const template = TURRET_TEMPLATES[TurretType.PHASER_ARRAY];
            expect(template.type).toBe(TurretType.PHASER_ARRAY);
            expect(template.name).toBe('Phaser Array');
            expect(template.range).toBe(200);
            expect(template.fireRate).toBe(3.5);
            expect(template.damage).toBe(10);
            expect(template.cost).toBe(110);
        });

        it('should have weapon properties for Tetryon Beam', () => {
            const template = TURRET_TEMPLATES[TurretType.TETRYON_BEAM];
            expect(template.weaponProperties).toBeDefined();
            expect(template.weaponProperties?.shieldDamageMultiplier).toBe(3.0);
            expect(template.weaponProperties?.hullDamageMultiplier).toBe(0.5);
        });

        it('should have weapon properties for Plasma Cannon', () => {
            const template = TURRET_TEMPLATES[TurretType.PLASMA_CANNON];
            expect(template.weaponProperties).toBeDefined();
            expect(template.weaponProperties?.statusEffectType).toBe(1); // Burn
            expect(template.weaponProperties?.statusEffectChance).toBe(1.0);
        });

        it('should have weapon properties for Polaron Beam', () => {
            const template = TURRET_TEMPLATES[TurretType.POLARON_BEAM];
            expect(template.weaponProperties).toBeDefined();
            expect(template.weaponProperties?.statusEffectType).toBe(3); // Drain
        });

        it('getTurretTemplate should return correct template', () => {
            const template = getTurretTemplate(TurretType.TORPEDO_LAUNCHER);
            expect(template).toBeDefined();
            expect(template?.name).toBe('Torpedo Launcher');
            expect(template?.range).toBe(350);
        });

        it('getTurretTemplate should return undefined for invalid type', () => {
            const template = getTurretTemplate(999);
            expect(template).toBeUndefined();
        });

        it('getTurretTypes should return all turret type IDs', () => {
            const types = getTurretTypes();
            expect(types).toContain(TurretType.PHASER_ARRAY);
            expect(types).toContain(TurretType.TORPEDO_LAUNCHER);
            expect(types).toContain(TurretType.POLARON_BEAM);
            expect(types.length).toBe(6);
        });
    });

    describe('Projectile Templates', () => {
        it('should have templates for all projectile types', () => {
            expect(PROJECTILE_TEMPLATES[ProjectileType.PHOTON_TORPEDO]).toBeDefined();
            expect(PROJECTILE_TEMPLATES[ProjectileType.QUANTUM_TORPEDO]).toBeDefined();
            expect(PROJECTILE_TEMPLATES[ProjectileType.DISRUPTOR_BOLT]).toBeDefined();
        });

        it('should have correct Photon Torpedo template values', () => {
            const template = PROJECTILE_TEMPLATES[ProjectileType.PHOTON_TORPEDO];
            expect(template.type).toBe(ProjectileType.PHOTON_TORPEDO);
            expect(template.speed).toBe(400);
            expect(template.lifetime).toBe(5);
            expect(template.size).toBe(8);
            expect(template.homing).toBe(true);
        });

        it('should have homing disabled for Disruptor Bolt', () => {
            const template = PROJECTILE_TEMPLATES[ProjectileType.DISRUPTOR_BOLT];
            expect(template.homing).toBe(false);
        });

        it('getProjectileTemplate should return correct template', () => {
            const template = getProjectileTemplate(ProjectileType.QUANTUM_TORPEDO);
            expect(template).toBeDefined();
            expect(template?.speed).toBe(500);
            expect(template?.homing).toBe(true);
        });

        it('getProjectileTemplate should return undefined for invalid type', () => {
            const template = getProjectileTemplate(999);
            expect(template).toBeUndefined();
        });

        it('getProjectileTypes should return all projectile type IDs', () => {
            const types = getProjectileTypes();
            expect(types).toContain(ProjectileType.PHOTON_TORPEDO);
            expect(types).toContain(ProjectileType.QUANTUM_TORPEDO);
            expect(types).toContain(ProjectileType.DISRUPTOR_BOLT);
            expect(types.length).toBe(3);
        });
    });
});
