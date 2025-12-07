/**
 * Tests for enemy variant system
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addComponent, addEntity, IWorld } from 'bitecs';
import { Position, Health, Shield, EnemyVariant, EnemyWeapon } from '../ecs/components';
import { EnemyRank, RANK_MULTIPLIERS } from '../types/constants';

describe('Enemy Variants', () => {
  let world: IWorld;

  beforeEach(() => {
    world = createWorld();
  });

  describe('Elite Enemies', () => {
    it('should apply elite stat multipliers', () => {
      const entity = addEntity(world);
      
      // Base stats
      addComponent(world, Position, entity);
      addComponent(world, Health, entity);
      addComponent(world, Shield, entity);
      addComponent(world, EnemyVariant, entity);
      
      Health.current[entity] = 100;
      Health.max[entity] = 100;
      Shield.current[entity] = 50;
      Shield.max[entity] = 50;
      
      // Apply elite variant
      EnemyVariant.rank[entity] = EnemyRank.ELITE;
      EnemyVariant.sizeScale[entity] = RANK_MULTIPLIERS[EnemyRank.ELITE].size;
      EnemyVariant.statMultiplier[entity] = RANK_MULTIPLIERS[EnemyRank.ELITE].health;
      
      // Manually apply multipliers (as waveManager does)
      Health.max[entity] = Math.floor(Health.max[entity] * RANK_MULTIPLIERS[EnemyRank.ELITE].health);
      Health.current[entity] = Math.floor(Health.current[entity] * RANK_MULTIPLIERS[EnemyRank.ELITE].health);
      Shield.max[entity] = Math.floor(Shield.max[entity] * RANK_MULTIPLIERS[EnemyRank.ELITE].health);
      Shield.current[entity] = Math.floor(Shield.current[entity] * RANK_MULTIPLIERS[EnemyRank.ELITE].health);
      
      // Verify stats are multiplied
      expect(Health.max[entity]).toBe(300); // 100 * 3.0
      expect(Health.current[entity]).toBe(300);
      expect(Shield.max[entity]).toBe(150); // 50 * 3.0
      expect(Shield.current[entity]).toBe(150);
      expect(EnemyVariant.sizeScale[entity]).toBeCloseTo(1.3);
    });

    it('should apply damage multiplier to elite weapons', () => {
      const entity = addEntity(world);
      
      addComponent(world, EnemyWeapon, entity);
      addComponent(world, EnemyVariant, entity);
      
      EnemyWeapon.damage[entity] = 10;
      EnemyVariant.rank[entity] = EnemyRank.ELITE;
      
      // Apply damage multiplier
      EnemyWeapon.damage[entity] *= RANK_MULTIPLIERS[EnemyRank.ELITE].damage;
      
      expect(EnemyWeapon.damage[entity]).toBe(15); // 10 * 1.5
    });
  });

  describe('Boss Enemies', () => {
    it('should apply boss stat multipliers', () => {
      const entity = addEntity(world);
      
      addComponent(world, Position, entity);
      addComponent(world, Health, entity);
      addComponent(world, Shield, entity);
      addComponent(world, EnemyVariant, entity);
      
      Health.current[entity] = 100;
      Health.max[entity] = 100;
      Shield.current[entity] = 50;
      Shield.max[entity] = 50;
      
      // Apply boss variant
      EnemyVariant.rank[entity] = EnemyRank.BOSS;
      EnemyVariant.sizeScale[entity] = RANK_MULTIPLIERS[EnemyRank.BOSS].size;
      EnemyVariant.statMultiplier[entity] = RANK_MULTIPLIERS[EnemyRank.BOSS].health;
      
      // Apply multipliers
      Health.max[entity] = Math.floor(Health.max[entity] * RANK_MULTIPLIERS[EnemyRank.BOSS].health);
      Health.current[entity] = Math.floor(Health.current[entity] * RANK_MULTIPLIERS[EnemyRank.BOSS].health);
      Shield.max[entity] = Math.floor(Shield.max[entity] * RANK_MULTIPLIERS[EnemyRank.BOSS].health);
      Shield.current[entity] = Math.floor(Shield.current[entity] * RANK_MULTIPLIERS[EnemyRank.BOSS].health);
      
      // Verify boss stats
      expect(Health.max[entity]).toBe(1000); // 100 * 10.0
      expect(Health.current[entity]).toBe(1000);
      expect(Shield.max[entity]).toBe(500); // 50 * 10.0
      expect(Shield.current[entity]).toBe(500);
      expect(EnemyVariant.sizeScale[entity]).toBe(2.0);
    });

    it('should apply boss damage multiplier', () => {
      const entity = addEntity(world);
      
      addComponent(world, EnemyWeapon, entity);
      addComponent(world, EnemyVariant, entity);
      
      EnemyWeapon.damage[entity] = 20;
      EnemyVariant.rank[entity] = EnemyRank.BOSS;
      
      // Apply damage multiplier
      EnemyWeapon.damage[entity] *= RANK_MULTIPLIERS[EnemyRank.BOSS].damage;
      
      expect(EnemyWeapon.damage[entity]).toBe(40); // 20 * 2.0
    });
  });

  describe('Normal Enemies', () => {
    it('should have 1.0 multipliers for normal rank', () => {
      const normalMultipliers = RANK_MULTIPLIERS[EnemyRank.NORMAL];
      
      expect(normalMultipliers.health).toBe(1.0);
      expect(normalMultipliers.damage).toBe(1.0);
      expect(normalMultipliers.size).toBe(1.0);
      expect(normalMultipliers.score).toBe(1.0);
      expect(normalMultipliers.resources).toBe(1.0);
    });
  });

  describe('Rank Multiplier Rewards', () => {
    it('should provide higher score multiplier for elite enemies', () => {
      const eliteMultipliers = RANK_MULTIPLIERS[EnemyRank.ELITE];
      
      expect(eliteMultipliers.score).toBe(3.0);
      expect(eliteMultipliers.resources).toBe(3.0);
    });

    it('should provide highest score multiplier for boss enemies', () => {
      const bossMultipliers = RANK_MULTIPLIERS[EnemyRank.BOSS];
      
      expect(bossMultipliers.score).toBe(10.0);
      expect(bossMultipliers.resources).toBe(10.0);
    });
  });
});
