/**
 * Status Effect System for Kobayashi Maru
 * Processes burning, slowed, drained, and disabled status effects
 */
import { defineQuery, removeComponent, addComponent, hasComponent } from 'bitecs';
import type { GameWorld } from '../ecs/world';
import {
    BurningStatus,
    SlowedStatus,
    DrainedStatus,
    DisabledStatus,
    Health,
    Velocity,
    AIBehavior
} from '../ecs/components';

// Queries for entities with status effects (enemies only, identified by AIBehavior)
const burningQuery = defineQuery([BurningStatus, Health, AIBehavior]);
const slowedQuery = defineQuery([SlowedStatus, Velocity, AIBehavior]);
const drainedQuery = defineQuery([DrainedStatus, Velocity, AIBehavior]);
const disabledQuery = defineQuery([DisabledStatus, AIBehavior]);

/**
 * Process all status effects
 */
export function statusEffectSystem(world: GameWorld, deltaTime: number): void {
    processBurning(world, deltaTime);
    processSlowed(world, deltaTime);
    processDrained(world, deltaTime);
    processDisabled(world, deltaTime);
}

/**
 * Process burning status - Apply DOT damage
 */
function processBurning(world: GameWorld, deltaTime: number): void {
    const entities = burningQuery(world);

    for (let i = 0; i < entities.length; i++) {
        const eid = entities[i];

        // Update tick timer
        BurningStatus.lastTickTime[eid] += deltaTime;

        // Check if it's time for next tick
        if (BurningStatus.lastTickTime[eid] >= BurningStatus.tickInterval[eid]) {
            // Apply damage
            const damage = BurningStatus.damagePerTick[eid];
            Health.current[eid] = Math.max(0, Health.current[eid] - damage);

            // Decrement ticks
            BurningStatus.ticksRemaining[eid]--;
            BurningStatus.lastTickTime[eid] = 0;

            // Remove if expired
            if (BurningStatus.ticksRemaining[eid] <= 0) {
                removeComponent(world, BurningStatus, eid);
            }
        }
    }
}

/**
 * Process slowed status - Reduce movement speed
 */
function processSlowed(world: GameWorld, deltaTime: number): void {
    const entities = slowedQuery(world);

    for (let i = 0; i < entities.length; i++) {
        const eid = entities[i];

        // Decrement duration
        SlowedStatus.duration[eid] -= deltaTime;

        // Remove if expired
        if (SlowedStatus.duration[eid] <= 0) {
            // Restore original speed
            const originalSpeed = SlowedStatus.originalSpeed[eid];
            const currentSpeed = Math.sqrt(Velocity.x[eid] ** 2 + Velocity.y[eid] ** 2);

            if (currentSpeed > 0) {
                const multiplier = originalSpeed / currentSpeed;
                Velocity.x[eid] *= multiplier;
                Velocity.y[eid] *= multiplier;
            }

            removeComponent(world, SlowedStatus, eid);
        }
    }
}

/**
 * Process drained status - Stacking speed reduction
 */
function processDrained(world: GameWorld, deltaTime: number): void {
    const entities = drainedQuery(world);

    for (let i = 0; i < entities.length; i++) {
        const eid = entities[i];

        // Decrement duration
        DrainedStatus.duration[eid] -= deltaTime;

        // Remove if expired
        if (DrainedStatus.duration[eid] <= 0) {
            // Reduce stacks
            DrainedStatus.stacks[eid]--;

            if (DrainedStatus.stacks[eid] <= 0) {
                removeComponent(world, DrainedStatus, eid);
            } else {
                // Reset duration for remaining stacks
                DrainedStatus.duration[eid] = 3.0; // 3 second duration per stack
            }
        }
    }
}

/**
 * Process disabled status - Systems offline
 */
function processDisabled(world: GameWorld, deltaTime: number): void {
    const entities = disabledQuery(world);

    for (let i = 0; i < entities.length; i++) {
        const eid = entities[i];

        // Decrement duration
        DisabledStatus.duration[eid] -= deltaTime;

        // Remove if expired
        if (DisabledStatus.duration[eid] <= 0) {
            removeComponent(world, DisabledStatus, eid);
        }
    }
}

/**
 * Apply burning status to an entity
 */
export function applyBurning(
    world: GameWorld,
    eid: number,
    damagePerTick: number,
    duration: number
): void {
    const tickInterval = 1.0; // 1 second per tick
    const ticks = Math.floor(duration / tickInterval);

    // Add component if not already present
    if (!hasComponent(world, BurningStatus, eid)) {
        addComponent(world, BurningStatus, eid);
    }

    BurningStatus.damagePerTick[eid] = damagePerTick;
    BurningStatus.ticksRemaining[eid] = ticks;
    BurningStatus.tickInterval[eid] = tickInterval;
    BurningStatus.lastTickTime[eid] = 0;
}

/**
 * Apply slowed status to an entity
 */
export function applySlowed(
    world: GameWorld,
    eid: number,
    slowPercent: number,
    duration: number
): void {
    // Add component if not already present
    if (!hasComponent(world, SlowedStatus, eid)) {
        addComponent(world, SlowedStatus, eid);

        // Store original speed only on first application
        const currentSpeed = Math.sqrt(
            Velocity.x[eid] ** 2 + Velocity.y[eid] ** 2
        );
        SlowedStatus.originalSpeed[eid] = currentSpeed;
    }

    SlowedStatus.slowPercent[eid] = slowPercent;
    SlowedStatus.duration[eid] = duration;

    // Apply slow to velocity
    const multiplier = 1 - slowPercent;
    Velocity.x[eid] *= multiplier;
    Velocity.y[eid] *= multiplier;
}

/**
 * Apply drained status to an entity (stacking)
 */
export function applyDrained(
    world: GameWorld,
    eid: number,
    duration: number
): void {
    const maxStacks = 3;

    // Add component if not already present
    if (!hasComponent(world, DrainedStatus, eid)) {
        addComponent(world, DrainedStatus, eid);
        DrainedStatus.stacks[eid] = 0;
    }

    const currentStacks = DrainedStatus.stacks[eid];
    DrainedStatus.stacks[eid] = Math.min(currentStacks + 1, maxStacks);
    DrainedStatus.duration[eid] = duration;

    // Apply speed reduction (10% per stack)
    const slowAmount = 0.1;
    Velocity.x[eid] *= (1 - slowAmount);
    Velocity.y[eid] *= (1 - slowAmount);
}

/**
 * Apply disabled status to an entity
 */
export function applyDisabled(
    world: GameWorld,
    eid: number,
    duration: number,
    systems: number = 1 // Default: weapons only
): void {
    // Add component if not already present
    if (!hasComponent(world, DisabledStatus, eid)) {
        addComponent(world, DisabledStatus, eid);
    }

    DisabledStatus.duration[eid] = duration;
    DisabledStatus.disabledSystems[eid] = systems;
}
