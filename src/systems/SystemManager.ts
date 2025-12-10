/**
 * System Manager for Kobayashi Maru
 * Manages ECS system registration, ordering, and execution.
 * Ensures all systems follow the functional pattern and run in explicit order.
 */
import { World } from 'bitecs';

/**
 * Standard system function signature for bitECS systems.
 * All systems should conform to this signature.
 */
export type SystemFunction = (world: World, delta: number) => World;

/**
 * Extended system function that includes game time.
 * Used for systems that need absolute time (e.g., AI, combat).
 */
export type ExtendedSystemFunction = (world: World, delta: number, gameTime: number) => World | void;

/**
 * System function that only takes world (no delta or gameTime needed)
 */
export type WorldOnlySystemFunction = (world: World) => World | void;

/**
 * System with update method pattern (for systems that return objects).
 * Used by collision, combat, and damage systems.
 * The update method is a generic callable that accepts world and optionally delta/gameTime.
 */
export interface SystemWithUpdate {
  update: (world: World, ...args: number[]) => World | void;
}

/**
 * Union type for all supported system function signatures
 */
export type AnySystemFunction = SystemFunction | ExtendedSystemFunction | WorldOnlySystemFunction;

/**
 * Union type for all supported system types
 */
export type SystemType = AnySystemFunction | SystemWithUpdate;

/**
 * Registered system entry with metadata
 */
interface RegisteredSystem {
  name: string;
  system: SystemType;
  priority: number;
  enabled: boolean;
  requiresDelta: boolean;
  requiresGameTime: boolean;
}

/**
 * Manages ECS systems with explicit ordering and execution.
 * Systems are run in order of priority (lower numbers first).
 */
export class SystemManager {
  private systems: Map<string, RegisteredSystem> = new Map();
  private sortedSystems: RegisteredSystem[] = [];
  private needsSort: boolean = false;

  /**
   * Register a system with a given priority.
   * Lower priority numbers run first.
   * @param name - Unique name for the system
   * @param system - The system function or object with update method
   * @param priority - Execution priority (lower = earlier)
   * @param options - Additional options for the system
   */
  register(
    name: string,
    system: SystemType,
    priority: number,
    options: {
      requiresDelta?: boolean;
      requiresGameTime?: boolean;
    } = {}
  ): void {
    if (this.systems.has(name)) {
      console.warn(`System "${name}" is already registered. Overwriting.`);
    }

    const entry: RegisteredSystem = {
      name,
      system,
      priority,
      enabled: true,
      requiresDelta: options.requiresDelta ?? true,
      requiresGameTime: options.requiresGameTime ?? false,
    };

    this.systems.set(name, entry);
    this.needsSort = true;
  }

  /**
   * Unregister a system by name
   * @param name - Name of the system to remove
   */
  unregister(name: string): boolean {
    const result = this.systems.delete(name);
    if (result) {
      this.needsSort = true;
    }
    return result;
  }

  /**
   * Enable or disable a system
   * @param name - Name of the system
   * @param enabled - Whether the system should be enabled
   */
  setEnabled(name: string, enabled: boolean): void {
    const entry = this.systems.get(name);
    if (entry) {
      entry.enabled = enabled;
    }
  }

  /**
   * Check if a system is enabled
   * @param name - Name of the system
   */
  isEnabled(name: string): boolean {
    const entry = this.systems.get(name);
    return entry?.enabled ?? false;
  }

  /**
   * Update system priority
   * @param name - Name of the system
   * @param priority - New priority value
   */
  setPriority(name: string, priority: number): void {
    const entry = this.systems.get(name);
    if (entry) {
      entry.priority = priority;
      this.needsSort = true;
    }
  }

  /**
   * Get the list of registered system names in execution order
   */
  getSystemNames(): string[] {
    this.ensureSorted();
    return this.sortedSystems.map(s => s.name);
  }

  /**
   * Run all enabled systems in priority order
   * @param world - The ECS world
   * @param delta - Time delta in seconds
   * @param gameTime - Total game time in seconds (optional)
   */
  run(world: World, delta: number, gameTime: number = 0): World {
    this.ensureSorted();

    let currentWorld = world;

    for (const entry of this.sortedSystems) {
      if (!entry.enabled) continue;

      const system = entry.system;

      try {
        let result: World | void;

        if (this.isSystemWithUpdate(system)) {
          // System with update method
          if (entry.requiresGameTime) {
            result = system.update(currentWorld, delta, gameTime);
          } else if (entry.requiresDelta) {
            result = system.update(currentWorld, delta);
          } else {
            result = system.update(currentWorld);
          }
        } else {
          // Direct function system - cast based on requirements
          if (entry.requiresGameTime) {
            result = (system as ExtendedSystemFunction)(currentWorld, delta, gameTime);
          } else if (entry.requiresDelta) {
            result = (system as SystemFunction)(currentWorld, delta);
          } else {
            result = (system as WorldOnlySystemFunction)(currentWorld);
          }
        }

        if (result) {
          currentWorld = result;
        }
      } catch (error) {
        console.error(`Error running system "${entry.name}":`, error);
      }
    }

    return currentWorld;
  }

  /**
   * Ensure systems are sorted by priority
   */
  private ensureSorted(): void {
    if (this.needsSort) {
      this.sortedSystems = Array.from(this.systems.values()).sort(
        (a, b) => a.priority - b.priority
      );
      this.needsSort = false;
    }
  }

  /**
   * Type guard to check if system has update method
   */
  private isSystemWithUpdate(system: SystemType): system is SystemWithUpdate {
    return typeof system === 'object' && 'update' in system && typeof system.update === 'function';
  }

  /**
   * Clear all registered systems
   */
  clear(): void {
    this.systems.clear();
    this.sortedSystems = [];
    this.needsSort = false;
  }
}
