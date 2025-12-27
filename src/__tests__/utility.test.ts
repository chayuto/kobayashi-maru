/**
 * Tests for utility types and functions
 */
import { describe, it, expect } from 'vitest';
import { assertNever } from '../types/utility';
import type { EntityId, EnemyId, TurretId, ProjectileId, WithRequired, DeepReadonly } from '../types/utility';

describe('Utility Types', () => {
  describe('assertNever', () => {
    it('should throw an error when called at runtime', () => {
      expect(() => {
        // Force a call to assertNever with a value
        // In practice, this should never be reachable if types are correct
        assertNever('unexpected' as never);
      }).toThrow('Unexpected value: unexpected');
    });

    it('should include the unexpected value in the error message', () => {
      expect(() => {
        assertNever(42 as never);
      }).toThrow('Unexpected value: 42');
    });

    it('should work with exhaustive switch pattern', () => {
      type Status = 'active' | 'inactive';
      
      function getStatusCode(status: Status): number {
        switch (status) {
          case 'active':
            return 1;
          case 'inactive':
            return 0;
          default:
            // This ensures all cases are handled
            assertNever(status);
        }
      }
      
      expect(getStatusCode('active')).toBe(1);
      expect(getStatusCode('inactive')).toBe(0);
    });
  });

  describe('Branded Types', () => {
    // These tests verify the type system works at compile time
    // Runtime behavior is the same as regular numbers
    
    it('should create branded entity IDs', () => {
      // Create a branded ID (runtime is just a number)
      const entityId = 123 as EntityId;
      expect(entityId).toBe(123);
      expect(typeof entityId).toBe('number');
    });

    it('should create enemy IDs as branded types', () => {
      const enemyId = 456 as EnemyId;
      expect(enemyId).toBe(456);
      expect(typeof enemyId).toBe('number');
    });

    it('should create turret IDs as branded types', () => {
      const turretId = 789 as TurretId;
      expect(turretId).toBe(789);
      expect(typeof turretId).toBe('number');
    });

    it('should create projectile IDs as branded types', () => {
      const projectileId = 101 as ProjectileId;
      expect(projectileId).toBe(101);
      expect(typeof projectileId).toBe('number');
    });

    // The real value of branded types is in compile-time checking
    // For example, this would cause a compile error if types were enforced:
    // function damageTurret(id: TurretId): void {}
    // const enemyId = 1 as EnemyId;
    // damageTurret(enemyId); // Error: EnemyId not assignable to TurretId
  });

  describe('WithRequired utility type', () => {
    it('should make optional properties required', () => {
      interface TestConfig {
        name?: string;
        value?: number;
      }
      
      // Type test - if this compiles, the type works correctly
      const config: WithRequired<TestConfig, 'name'> = {
        name: 'test' // name is required now
        // value is still optional
      };
      
      expect(config.name).toBe('test');
    });
  });

  describe('DeepReadonly utility type', () => {
    it('should create deeply readonly objects', () => {
      interface NestedConfig {
        outer: {
          inner: {
            value: number;
          };
        };
      }
      
      // Type test - this verifies the type constraint works
      const config: DeepReadonly<NestedConfig> = {
        outer: {
          inner: {
            value: 42
          }
        }
      };
      
      // Read access should work
      expect(config.outer.inner.value).toBe(42);
      
      // At compile time, these would error:
      // config.outer = { inner: { value: 1 } }; // Error: readonly
      // config.outer.inner.value = 100; // Error: readonly
    });

    it('should properly handle arrays as readonly', () => {
      interface ConfigWithArray {
        items: number[];
        nested: {
          values: string[];
        };
      }
      
      // Type test - verifies arrays become readonly
      const config: DeepReadonly<ConfigWithArray> = {
        items: [1, 2, 3],
        nested: {
          values: ['a', 'b', 'c']
        }
      };
      
      // Read access should work
      expect(config.items[0]).toBe(1);
      expect(config.nested.values[1]).toBe('b');
      
      // At compile time, these would error:
      // config.items.push(4); // Error: readonly array
      // config.items[0] = 10; // Error: readonly array
      // config.nested.values.pop(); // Error: readonly array
    });
  });
});
