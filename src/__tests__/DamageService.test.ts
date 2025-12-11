/**
 * Tests for DamageService
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createWorld, addEntity, addComponent } from 'bitecs';
import { applyDamage, applyDamageDetailed } from '../services/DamageService';
import { Health, Shield } from '../ecs/components';

describe('DamageService', () => {
    let world: ReturnType<typeof createWorld>;

    beforeEach(() => {
        world = createWorld();
    });

    afterEach(() => {
        // Clean up component arrays to prevent test pollution
    });

    describe('applyDamage', () => {
        it('should apply damage to health when no shield', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;

            const dealt = applyDamage(world, eid, 30);

            expect(dealt).toBe(30);
            expect(Health.current[eid]).toBe(70);
        });

        it('should apply damage to shields first', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;
            addComponent(world, eid, Shield);
            Shield.current[eid] = 50;
            Shield.max[eid] = 50;

            const dealt = applyDamage(world, eid, 30);

            expect(dealt).toBe(30);
            expect(Shield.current[eid]).toBe(20);
            expect(Health.current[eid]).toBe(100); // Health unchanged
        });

        it('should overflow damage from shields to health', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;
            addComponent(world, eid, Shield);
            Shield.current[eid] = 20;
            Shield.max[eid] = 50;

            const dealt = applyDamage(world, eid, 50);

            expect(dealt).toBe(50);
            expect(Shield.current[eid]).toBe(0);
            expect(Health.current[eid]).toBe(70); // 100 - (50 - 20)
        });

        it('should not apply damage to depleted shields', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;
            addComponent(world, eid, Shield);
            Shield.current[eid] = 0;
            Shield.max[eid] = 50;

            const dealt = applyDamage(world, eid, 30);

            expect(dealt).toBe(30);
            expect(Health.current[eid]).toBe(70);
        });

        it('should cap damage at available health', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 20;
            Health.max[eid] = 100;

            const dealt = applyDamage(world, eid, 50);

            expect(dealt).toBe(20); // Only 20 damage was available
            expect(Health.current[eid]).toBe(0);
        });

        it('should handle entity without Health component', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Shield);
            Shield.current[eid] = 50;
            Shield.max[eid] = 50;

            // Should not throw, just drain shields
            const dealt = applyDamage(world, eid, 30);

            expect(dealt).toBe(30);
            expect(Shield.current[eid]).toBe(20);
        });

        it('should return 0 for entity with no damage-able components', () => {
            const eid = addEntity(world);
            // No Health or Shield components

            const dealt = applyDamage(world, eid, 50);

            expect(dealt).toBe(0);
        });
    });

    describe('applyDamageDetailed', () => {
        it('should return detailed damage breakdown for shield only', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;
            addComponent(world, eid, Shield);
            Shield.current[eid] = 50;
            Shield.max[eid] = 50;

            const result = applyDamageDetailed(world, eid, 30);

            expect(result.totalDamage).toBe(30);
            expect(result.shieldDamage).toBe(30);
            expect(result.healthDamage).toBe(0);
            expect(result.killed).toBe(false);
        });

        it('should return detailed damage breakdown for overflow damage', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;
            addComponent(world, eid, Shield);
            Shield.current[eid] = 25;
            Shield.max[eid] = 50;

            const result = applyDamageDetailed(world, eid, 50);

            expect(result.totalDamage).toBe(50);
            expect(result.shieldDamage).toBe(25);
            expect(result.healthDamage).toBe(25);
            expect(result.killed).toBe(false);
        });

        it('should return killed=true when health reaches 0', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 30;
            Health.max[eid] = 100;

            const result = applyDamageDetailed(world, eid, 50);

            expect(result.totalDamage).toBe(30);
            expect(result.shieldDamage).toBe(0);
            expect(result.healthDamage).toBe(30);
            expect(result.killed).toBe(true);
            expect(Health.current[eid]).toBe(0);
        });

        it('should return killed=true when damage exceeds total shield + health', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 50;
            Health.max[eid] = 100;
            addComponent(world, eid, Shield);
            Shield.current[eid] = 30;
            Shield.max[eid] = 50;

            const result = applyDamageDetailed(world, eid, 100);

            expect(result.totalDamage).toBe(80); // 30 shield + 50 health
            expect(result.shieldDamage).toBe(30);
            expect(result.healthDamage).toBe(50);
            expect(result.killed).toBe(true);
        });

        it('should not report killed for entity without Health', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Shield);
            Shield.current[eid] = 50;
            Shield.max[eid] = 50;

            const result = applyDamageDetailed(world, eid, 100);

            expect(result.killed).toBe(false);
        });

        it('should handle health-only damage', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;

            const result = applyDamageDetailed(world, eid, 40);

            expect(result.totalDamage).toBe(40);
            expect(result.shieldDamage).toBe(0);
            expect(result.healthDamage).toBe(40);
            expect(result.killed).toBe(false);
            expect(Health.current[eid]).toBe(60);
        });

        it('should handle zero damage', () => {
            const eid = addEntity(world);
            addComponent(world, eid, Health);
            Health.current[eid] = 100;
            Health.max[eid] = 100;

            const result = applyDamageDetailed(world, eid, 0);

            expect(result.totalDamage).toBe(0);
            expect(result.shieldDamage).toBe(0);
            expect(result.healthDamage).toBe(0);
            expect(result.killed).toBe(false);
        });
    });
});
