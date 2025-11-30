/**
 * ECS Components for Kobayashi Maru
 * Using bitecs for high-performance entity management
 */
import { defineComponent, Types } from 'bitecs';

// Position component - stores x, y coordinates
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

// Velocity component - stores movement direction and speed
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
});

// Faction component - identifies which faction an entity belongs to
export const Faction = defineComponent({
  id: Types.ui8
});

// SpriteRef component - reference to the sprite index in the particle container
export const SpriteRef = defineComponent({
  index: Types.ui32
});

// Health component - stores current and max health
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32
});

// Shield component - stores shield values
export const Shield = defineComponent({
  current: Types.f32,
  max: Types.f32
});

// Collider component - stores collision data for spatial hashing
export const Collider = defineComponent({
  radius: Types.f32,     // Collision radius for the entity
  layer: Types.ui8,      // Collision layer (enemies, projectiles, etc.)
  mask: Types.ui8        // Which layers this entity collides with
});

// Turret component - stores turret combat data
export const Turret = defineComponent({
  range: Types.f32,      // Targeting range in pixels
  fireRate: Types.f32,   // Shots per second
  damage: Types.f32,     // Damage per shot
  lastFired: Types.f32,  // Timestamp of last shot (in seconds)
  turretType: Types.ui8  // Type of turret (phaser, torpedo, disruptor)
});

// Target component - stores current target for turrets
export const Target = defineComponent({
  entityId: Types.ui32,  // Current target entity ID
  hasTarget: Types.ui8   // 0/1 flag indicating if target is valid
});

// AI Behavior component - stores AI state and configuration
export const AIBehavior = defineComponent({
  behaviorType: Types.ui8,    // Behavior pattern (0=direct, 1=strafe, 2=flank, etc.)
  stateTimer: Types.f32,      // Timer for state changes
  targetX: Types.f32,         // Intermediate target X
  targetY: Types.f32,         // Intermediate target Y
  aggression: Types.f32       // How aggressively to pursue (0-1)
});
