/**
 * Tests for ability system
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addComponent, addEntity, World } from 'bitecs';
import { Position, Health, Shield, SpecialAbility, Velocity, Faction } from '../ecs/components';
import { AbilityType, ABILITY_CONFIG, FactionId } from '../types/constants';
import { createAbilitySystem } from '../systems/abilitySystem';

describe('Ability System', () => {
  let world: World;
  let abilitySystem: ReturnType<typeof createAbilitySystem>;

  beforeEach(() => {
    world = createWorld();
    abilitySystem = createAbilitySystem();
  });

  describe('Teleport Ability', () => {
    it('should not teleport if cooldown has not elapsed', () => {
      const entity = addEntity(world);
      
      // Add required components
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 100;
      Position.y[entity] = 100;
      Health.current[entity] = 20; // Low health (20% of max)
      Health.max[entity] = 100;
      SpecialAbility.abilityType[entity] = AbilityType.TELEPORT;
      SpecialAbility.cooldown[entity] = ABILITY_CONFIG[AbilityType.TELEPORT].cooldown;
      SpecialAbility.lastUsed[entity] = 5; // Used 5 seconds ago (game starts at 0)
      SpecialAbility.duration[entity] = 0;
      SpecialAbility.active[entity] = 0;
      
      const initialX = Position.x[entity];
      const initialY = Position.y[entity];
      
      // Run system - should not teleport because only 5 seconds elapsed (cooldown is 8)
      abilitySystem(world, 1.0); // 1 second delta - game time is now 1
      
      // Position should not change (cooldown not met)
      expect(Position.x[entity]).toBe(initialX);
      expect(Position.y[entity]).toBe(initialY);
    });

    it('should teleport when health is low and cooldown has elapsed', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 100;
      Position.y[entity] = 100;
      Health.current[entity] = 20; // Low health (20% of max)
      Health.max[entity] = 100;
      SpecialAbility.abilityType[entity] = AbilityType.TELEPORT;
      SpecialAbility.cooldown[entity] = ABILITY_CONFIG[AbilityType.TELEPORT].cooldown;
      SpecialAbility.lastUsed[entity] = 0; // Never used or used long ago
      SpecialAbility.duration[entity] = 0;
      SpecialAbility.active[entity] = 0;
      
      // Advance game time enough to pass cooldown
      for (let i = 0; i < 10; i++) {
        abilitySystem(world, 1.0);
      }
      
      // Position should have changed (teleported)
      const movedX = Position.x[entity] !== 100;
      const movedY = Position.y[entity] !== 100;
      expect(movedX || movedY).toBe(true);
    });
  });

  describe('Cloak Ability', () => {
    it('should activate cloak when health drops below 50%', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 500;
      Position.y[entity] = 500;
      Health.current[entity] = 40; // 40% health
      Health.max[entity] = 100;
      SpecialAbility.abilityType[entity] = AbilityType.CLOAK;
      SpecialAbility.cooldown[entity] = ABILITY_CONFIG[AbilityType.CLOAK].cooldown;
      SpecialAbility.lastUsed[entity] = -100; // Set in the past so cooldown is met
      SpecialAbility.duration[entity] = ABILITY_CONFIG[AbilityType.CLOAK].duration;
      SpecialAbility.active[entity] = 0;
      
      // Run system
      abilitySystem(world, 1.0);
      
      // Should activate cloak
      expect(SpecialAbility.active[entity]).toBe(1);
    });

    it('should deactivate cloak after duration expires', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 500;
      Position.y[entity] = 500;
      Health.current[entity] = 40;
      Health.max[entity] = 100;
      SpecialAbility.abilityType[entity] = AbilityType.CLOAK;
      SpecialAbility.cooldown[entity] = ABILITY_CONFIG[AbilityType.CLOAK].cooldown;
      SpecialAbility.lastUsed[entity] = -100; // Set in the past so cooldown is met
      SpecialAbility.duration[entity] = ABILITY_CONFIG[AbilityType.CLOAK].duration;
      SpecialAbility.active[entity] = 0;
      
      // Activate cloak
      abilitySystem(world, 1.0);
      expect(SpecialAbility.active[entity]).toBe(1);
      
      // Run system for duration + 1 second
      const duration = ABILITY_CONFIG[AbilityType.CLOAK].duration;
      abilitySystem(world, duration + 1);
      
      // Should deactivate
      expect(SpecialAbility.active[entity]).toBe(0);
    });
  });

  describe('Shield Regeneration Ability', () => {
    it('should regenerate shields over time', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, Shield);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 500;
      Position.y[entity] = 500;
      Health.current[entity] = 100;
      Health.max[entity] = 100;
      Shield.current[entity] = 50; // Half shields
      Shield.max[entity] = 100;
      SpecialAbility.abilityType[entity] = AbilityType.SHIELD_REGEN;
      SpecialAbility.cooldown[entity] = 0; // Passive ability
      SpecialAbility.lastUsed[entity] = 0;
      SpecialAbility.duration[entity] = 0;
      SpecialAbility.active[entity] = 0;
      
      const initialShield = Shield.current[entity];
      
      // Run system for 2 seconds
      abilitySystem(world, 2.0);
      
      // Shields should have regenerated (5% per second = 10% over 2 seconds)
      expect(Shield.current[entity]).toBeGreaterThan(initialShield);
      expect(Shield.current[entity]).toBeLessThanOrEqual(Shield.max[entity]);
    });

    it('should not regenerate shields beyond maximum', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, Shield);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 500;
      Position.y[entity] = 500;
      Health.current[entity] = 100;
      Health.max[entity] = 100;
      Shield.current[entity] = 99;
      Shield.max[entity] = 100;
      SpecialAbility.abilityType[entity] = AbilityType.SHIELD_REGEN;
      SpecialAbility.cooldown[entity] = 0;
      SpecialAbility.lastUsed[entity] = 0;
      SpecialAbility.duration[entity] = 0;
      SpecialAbility.active[entity] = 0;
      
      // Run system
      abilitySystem(world, 5.0);
      
      // Shields should be capped at max
      expect(Shield.current[entity]).toBe(Shield.max[entity]);
    });
  });

  describe('Ramming Speed Ability', () => {
    it('should activate when close to target', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, Velocity);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 960; // Near center (960, 540)
      Position.y[entity] = 540;
      Health.current[entity] = 100;
      Health.max[entity] = 100;
      Velocity.x[entity] = 50;
      Velocity.y[entity] = 50;
      SpecialAbility.abilityType[entity] = AbilityType.RAMMING_SPEED;
      SpecialAbility.cooldown[entity] = ABILITY_CONFIG[AbilityType.RAMMING_SPEED].cooldown;
      SpecialAbility.lastUsed[entity] = 0;
      SpecialAbility.duration[entity] = ABILITY_CONFIG[AbilityType.RAMMING_SPEED].duration;
      SpecialAbility.active[entity] = 0;
      
      const initialVelX = Velocity.x[entity];
      const initialVelY = Velocity.y[entity];
      
      // Run system
      abilitySystem(world, 1.0);
      
      // Should activate ramming speed (velocity doubled)
      expect(SpecialAbility.active[entity]).toBe(1);
      expect(Velocity.x[entity]).toBe(initialVelX * 2);
      expect(Velocity.y[entity]).toBe(initialVelY * 2);
    });

    it('should deactivate after duration and restore velocity', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, Velocity);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 960;
      Position.y[entity] = 540;
      Health.current[entity] = 100;
      Health.max[entity] = 100;
      Velocity.x[entity] = 50;
      Velocity.y[entity] = 50;
      SpecialAbility.abilityType[entity] = AbilityType.RAMMING_SPEED;
      SpecialAbility.cooldown[entity] = ABILITY_CONFIG[AbilityType.RAMMING_SPEED].cooldown;
      SpecialAbility.lastUsed[entity] = 0;
      SpecialAbility.duration[entity] = ABILITY_CONFIG[AbilityType.RAMMING_SPEED].duration;
      SpecialAbility.active[entity] = 0;
      
      const initialVelX = Velocity.x[entity];
      const initialVelY = Velocity.y[entity];
      
      // Activate
      abilitySystem(world, 1.0);
      expect(SpecialAbility.active[entity]).toBe(1);
      
      // Run for duration + 1
      const duration = ABILITY_CONFIG[AbilityType.RAMMING_SPEED].duration;
      abilitySystem(world, duration + 1);
      
      // Should deactivate and restore velocity
      expect(SpecialAbility.active[entity]).toBe(0);
      expect(Velocity.x[entity]).toBe(initialVelX);
      expect(Velocity.y[entity]).toBe(initialVelY);
    });
  });

  describe('Summon Ability', () => {
    it('should respect cooldown', () => {
      const entity = addEntity(world);
      
      addComponent(world, entity, Position);
      addComponent(world, entity, Health);
      addComponent(world, entity, Faction);
      addComponent(world, entity, SpecialAbility);
      
      Position.x[entity] = 500;
      Position.y[entity] = 500;
      Health.current[entity] = 40; // Below 50%
      Health.max[entity] = 100;
      Faction.id[entity] = FactionId.BORG;
      SpecialAbility.abilityType[entity] = AbilityType.SUMMON;
      SpecialAbility.cooldown[entity] = ABILITY_CONFIG[AbilityType.SUMMON].cooldown;
      SpecialAbility.lastUsed[entity] = 15; // Used recently
      SpecialAbility.duration[entity] = 0;
      SpecialAbility.active[entity] = 0;
      
      const lastUsed = SpecialAbility.lastUsed[entity];
      
      // Run system
      abilitySystem(world, 1.0);
      
      // lastUsed should not change (cooldown not met)
      expect(SpecialAbility.lastUsed[entity]).toBe(lastUsed);
    });
  });
});
