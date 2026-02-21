/**
 * Ability System
 * Processes special abilities for elite and boss enemies
 */
import { query, hasComponent, World } from 'bitecs';
import { Position, Velocity, Health, Shield, SpecialAbility, Faction } from '../ecs/components';
import { AbilityType, ABILITY_CONFIG as ABILITY_TYPE_CONFIG, GAME_CONFIG, FactionId } from '../types/constants';
import type { AbilityTypeId } from '../types/constants';
import { assertNever } from '../types/utility';
import { AI_CONFIG, ABILITY_CONFIG } from '../config';
import { createEnemy } from '../ecs/entityFactory';
import type { GameWorld } from '../ecs/world';
import { ParticleSystem } from '../rendering';
import { SpriteManager } from '../rendering';
import { AudioManager } from '../audio';
import { SpatialHash } from '../collision';

// Game time tracker (in seconds)
let gameTime = 0;

/**
 * Creates the ability system
 * @param particleSystem - Particle system for visual effects
 * @param spriteManager - Sprite manager for sprite manipulation
 * @param audioManager - Audio manager for sound effects
 * @param spatialHash - Spatial hash for position queries
 * @returns The system update function
 */
export function createAbilitySystem(
  particleSystem?: ParticleSystem,
  _spriteManager?: SpriteManager,
  audioManager?: AudioManager,
  spatialHash?: SpatialHash
) {
  return function abilitySystem(world: World, deltaTime: number) {
    // Update game time
    gameTime += deltaTime;

    const entities = query(world, [SpecialAbility, Position, Health]);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      // Cast to AbilityTypeId for exhaustive switch checking.
      // bitECS stores all component data as numbers in TypedArrays, so we must
      // assert the type to get compile-time exhaustiveness checking. The value
      // is validated by the switch default case at runtime.
      const abilityType = SpecialAbility.abilityType[eid] as AbilityTypeId;

      switch (abilityType) {
        case AbilityType.TELEPORT:
          processTeleportAbility(world, eid, particleSystem, audioManager, spatialHash);
          break;
        case AbilityType.CLOAK:
          processCloakAbility(world, eid, particleSystem);
          break;
        case AbilityType.SHIELD_REGEN:
          processShieldRegenAbility(world, eid, deltaTime, particleSystem);
          break;
        case AbilityType.SPLIT:
          processSplitAbility(world, eid, particleSystem);
          break;
        case AbilityType.SUMMON:
          processSummonAbility(world, eid, particleSystem);
          break;
        case AbilityType.DRAIN:
          processDrainAbility();
          break;
        case AbilityType.EMP_BURST:
          processEMPBurstAbility();
          break;
        case AbilityType.RAMMING_SPEED:
          processRammingSpeedAbility(world, eid, particleSystem);
          break;
        default:
          // Ensures all AbilityTypeId values are handled - compile error if new type added
          assertNever(abilityType);
      }
    }
  };
}

/**
 * Teleport ability - relocates enemy to safe position when in danger
 */
function processTeleportAbility(
  _world: World,
  entity: number,
  particleSystem?: ParticleSystem,
  _audioManager?: AudioManager,
  spatialHash?: SpatialHash
): void {
  // Check cooldown
  if (gameTime - SpecialAbility.lastUsed[entity] < SpecialAbility.cooldown[entity]) {
    return;
  }

  // Check if in danger (low health or being targeted)
  const healthPercent = Health.current[entity] / Health.max[entity];
  const isTargeted = isBeingTargeted();

  if (healthPercent < ABILITY_CONFIG.TELEPORT.HEALTH_THRESHOLD || isTargeted) {
    // Teleport to random safe location
    const newPos = findSafePosition(spatialHash);

    // Teleport effect at old position
    if (particleSystem) {
      particleSystem.spawn({
        x: Position.x[entity],
        y: Position.y[entity],
        count: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.COUNT,
        speed: { min: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.SPEED.MAX },
        life: { min: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.LIFE.MAX },
        size: { min: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.SIZE.MAX },
        colorGradient: {
          stops: [
            { time: 0, color: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.COLOR_START, alpha: 1.0 },
            { time: 1.0, color: ABILITY_CONFIG.TELEPORT.DEPARTURE_PARTICLES.COLOR_END, alpha: 0.0 }
          ]
        },
        spread: Math.PI * 2
      });
    }

    // Update position
    Position.x[entity] = newPos.x;
    Position.y[entity] = newPos.y;

    // Teleport effect at new position
    if (particleSystem) {
      particleSystem.spawn({
        x: newPos.x,
        y: newPos.y,
        count: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.COUNT,
        speed: { min: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.SPEED.MAX },
        life: { min: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.LIFE.MAX },
        size: { min: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.SIZE.MAX },
        colorGradient: {
          stops: [
            { time: 0, color: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.COLOR_START, alpha: 0.0 },
            { time: 1.0, color: ABILITY_CONFIG.TELEPORT.ARRIVAL_PARTICLES.COLOR_END, alpha: 1.0 }
          ]
        },
        spread: Math.PI * 2
      });
    }

    // Update cooldown
    SpecialAbility.lastUsed[entity] = gameTime;

    // Audio
    // TODO: Add teleport sound type to AudioManager
    // if (audioManager) {
    //   audioManager.play('teleport');
    // }
  }
}

/**
 * Cloaking ability - reduces visibility when health is low
 */
function processCloakAbility(
  _world: World,
  entity: number,
  particleSystem?: ParticleSystem
): void {
  const healthPercent = Health.current[entity] / Health.max[entity];

  // Activate cloak when health is low
  if (healthPercent < ABILITY_CONFIG.CLOAK.HEALTH_THRESHOLD && SpecialAbility.active[entity] === 0) {
    // Check cooldown
    if (gameTime - SpecialAbility.lastUsed[entity] < SpecialAbility.cooldown[entity]) {
      return;
    }

    // Activate cloak
    SpecialAbility.active[entity] = 1;
    SpecialAbility.lastUsed[entity] = gameTime;

    // TODO: Reduce sprite alpha when SpriteManager supports it
    // const spriteIndex = SpriteRef.index[entity];
    // if (spriteManager) {
    //   spriteManager.setAlpha(spriteIndex, ABILITY_TYPE_CONFIG[AbilityType.CLOAK].alphaWhileCloaked ?? 0.2);
    // }

    // Cloak particles
    if (particleSystem) {
      particleSystem.spawn({
        x: Position.x[entity],
        y: Position.y[entity],
        count: ABILITY_CONFIG.CLOAK.PARTICLES.COUNT,
        speed: { min: ABILITY_CONFIG.CLOAK.PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.CLOAK.PARTICLES.SPEED.MAX },
        life: { min: ABILITY_CONFIG.CLOAK.PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.CLOAK.PARTICLES.LIFE.MAX },
        size: { min: ABILITY_CONFIG.CLOAK.PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.CLOAK.PARTICLES.SIZE.MAX },
        colorGradient: {
          stops: [
            { time: 0, color: ABILITY_CONFIG.CLOAK.PARTICLES.COLOR, alpha: 0.8 },
            { time: 1.0, color: ABILITY_CONFIG.CLOAK.PARTICLES.COLOR, alpha: 0.0 }
          ]
        },
        spread: Math.PI * 2
      });
    }

    // Audio
    // TODO: Add cloak sound type to AudioManager
    // if (audioManager) {
    //   audioManager.play('cloak');
    // }
  }

  // Deactivate after duration
  if (SpecialAbility.active[entity] === 1) {
    if (gameTime - SpecialAbility.lastUsed[entity] >= SpecialAbility.duration[entity]) {
      SpecialAbility.active[entity] = 0;

      // TODO: Restore sprite alpha when SpriteManager supports it
      // const spriteIndex = SpriteRef.index[entity];
      // if (spriteManager) {
      //   spriteManager.setAlpha(spriteIndex, 1.0);
      // }

      // Decloak particles
      if (particleSystem) {
        particleSystem.spawn({
          x: Position.x[entity],
          y: Position.y[entity],
          count: ABILITY_CONFIG.CLOAK.PARTICLES.COUNT,
          speed: { min: ABILITY_CONFIG.CLOAK.PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.CLOAK.PARTICLES.SPEED.MAX },
          life: { min: ABILITY_CONFIG.CLOAK.PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.CLOAK.PARTICLES.LIFE.MAX },
          size: { min: ABILITY_CONFIG.CLOAK.PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.CLOAK.PARTICLES.SIZE.MAX },
          colorGradient: {
            stops: [
              { time: 0, color: ABILITY_CONFIG.CLOAK.PARTICLES.COLOR, alpha: 0.0 },
              { time: 1.0, color: ABILITY_CONFIG.CLOAK.PARTICLES.COLOR, alpha: 0.8 }
            ]
          },
          spread: Math.PI * 2
        });
      }
    }
  }
}

/**
 * Shield regeneration ability - passive regen of shields
 */
function processShieldRegenAbility(
  world: World,
  entity: number,
  deltaTime: number,
  particleSystem?: ParticleSystem
): void {
  if (hasComponent(world, entity, Shield)) {
    const currentShield = Shield.current[entity];
    const maxShield = Shield.max[entity];

    if (currentShield < maxShield) {
      // Regen rate: 5% of max per second
      const regenRate = maxShield * (ABILITY_TYPE_CONFIG[AbilityType.SHIELD_REGEN].regenRate ?? 0.05);
      Shield.current[entity] = Math.min(
        maxShield,
        currentShield + regenRate * deltaTime
      );

      // Visual feedback every 0.5s
      if (Math.floor(gameTime * ABILITY_CONFIG.SHIELD_REGEN.VISUAL_FREQUENCY) !== Math.floor((gameTime - deltaTime) * ABILITY_CONFIG.SHIELD_REGEN.VISUAL_FREQUENCY)) {
        if (particleSystem) {
          particleSystem.spawn({
            x: Position.x[entity],
            y: Position.y[entity],
            count: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.COUNT,
            speed: { min: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.SPEED.MAX },
            life: { min: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.LIFE.MAX },
            size: { min: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.SIZE.MAX },
            color: ABILITY_CONFIG.SHIELD_REGEN.PARTICLES.COLOR,
            spread: Math.PI * 2
          });
        }
      }
    }
  }
}

/**
 * Split ability - splits into smaller enemies on death
 */
function processSplitAbility(
  world: World,
  entity: number,
  particleSystem?: ParticleSystem
): void {
  // Only trigger on death
  if (Health.current[entity] > 0) {
    return;
  }

  const x = Position.x[entity];
  const y = Position.y[entity];
  const faction = Faction.id[entity];

  const config = ABILITY_TYPE_CONFIG[AbilityType.SPLIT];
  const splitCount = config.splitCount ?
    config.splitCount.min + Math.floor(Math.random() * (config.splitCount.max - config.splitCount.min + 1)) :
    2;

  for (let i = 0; i < splitCount; i++) {
    const angle = (Math.PI * 2 * i) / splitCount;
    const offsetX = Math.cos(angle) * ABILITY_CONFIG.SPLIT.SPAWN_OFFSET;
    const offsetY = Math.sin(angle) * ABILITY_CONFIG.SPLIT.SPAWN_OFFSET;

    // Spawn smaller enemy based on faction
    const newEnemy = createEnemyByFaction(world, faction, x + offsetX, y + offsetY);

    if (newEnemy !== -1) {
      // Reduce stats (half of original)
      Health.max[newEnemy] *= ABILITY_CONFIG.SPLIT.STAT_MULTIPLIER;
      Health.current[newEnemy] *= ABILITY_CONFIG.SPLIT.STAT_MULTIPLIER;

      // TODO: Scale down sprite when SpriteManager supports it
      // const spriteIndex = SpriteRef.index[newEnemy];
      // if (spriteManager) {
      //   spriteManager.setScale(spriteIndex, 0.7);
      // }
    }
  }

  // Split particles
  if (particleSystem) {
    particleSystem.spawn({
      x,
      y,
      count: ABILITY_CONFIG.SPLIT.PARTICLES.COUNT,
      speed: { min: ABILITY_CONFIG.SPLIT.PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.SPLIT.PARTICLES.SPEED.MAX },
      life: { min: ABILITY_CONFIG.SPLIT.PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.SPLIT.PARTICLES.LIFE.MAX },
      size: { min: ABILITY_CONFIG.SPLIT.PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.SPLIT.PARTICLES.SIZE.MAX },
      color: getFactionColor(faction),
      spread: Math.PI * 2
    });
  }
}

/**
 * Summon ability - spawns reinforcements
 */
function processSummonAbility(
  world: World,
  entity: number,
  particleSystem?: ParticleSystem
): void {
  // Check cooldown
  if (gameTime - SpecialAbility.lastUsed[entity] < SpecialAbility.cooldown[entity]) {
    return;
  }

  // Check if health is below threshold
  const healthPercent = Health.current[entity] / Health.max[entity];
  if (healthPercent < ABILITY_CONFIG.SUMMON.HEALTH_THRESHOLD) {
    const x = Position.x[entity];
    const y = Position.y[entity];
    const faction = Faction.id[entity];

    // Spawn reinforcements
    const summonCount = ABILITY_CONFIG.SUMMON.COUNT.MIN + Math.floor(Math.random() * (ABILITY_CONFIG.SUMMON.COUNT.MAX - ABILITY_CONFIG.SUMMON.COUNT.MIN));

    for (let i = 0; i < summonCount; i++) {
      const angle = (Math.PI * 2 * i) / summonCount;
      const spawnRadius = ABILITY_TYPE_CONFIG[AbilityType.SUMMON].range ?? 100;
      const offsetX = Math.cos(angle) * spawnRadius;
      const offsetY = Math.sin(angle) * spawnRadius;

      createEnemyByFaction(world, faction, x + offsetX, y + offsetY);
    }

    // Update cooldown
    SpecialAbility.lastUsed[entity] = gameTime;

    // Summon particles
    if (particleSystem) {
      particleSystem.spawn({
        x,
        y,
        count: ABILITY_CONFIG.SUMMON.PARTICLES.COUNT,
        speed: { min: ABILITY_CONFIG.SUMMON.PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.SUMMON.PARTICLES.SPEED.MAX },
        life: { min: ABILITY_CONFIG.SUMMON.PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.SUMMON.PARTICLES.LIFE.MAX },
        size: { min: ABILITY_CONFIG.SUMMON.PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.SUMMON.PARTICLES.SIZE.MAX },
        color: getFactionColor(faction),
        spread: Math.PI * 2
      });
    }
  }
}

/**
 * Drain ability - placeholder for turret energy drain
 */
function processDrainAbility(): void {
  // TODO: Implement turret energy drain when turret energy system is added
}

/**
 * EMP Burst ability - placeholder for disabling nearby turrets
 */
function processEMPBurstAbility(): void {
  // TODO: Implement EMP burst when turret disable system is added
}

/**
 * Ramming Speed ability - increases movement speed temporarily
 */
function processRammingSpeedAbility(
  world: World,
  entity: number,
  particleSystem?: ParticleSystem
): void {
  // Activate when close to target
  if (SpecialAbility.active[entity] === 0) {
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
    const dx = centerX - Position.x[entity];
    const dy = centerY - Position.y[entity];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ABILITY_CONFIG.RAMMING.ACTIVATION_DISTANCE && gameTime - SpecialAbility.lastUsed[entity] >= SpecialAbility.cooldown[entity]) {
      // Activate ramming speed
      SpecialAbility.active[entity] = 1;
      SpecialAbility.lastUsed[entity] = gameTime;

      // Double velocity
      if (hasComponent(world, entity, Velocity)) {
        Velocity.x[entity] *= ABILITY_CONFIG.RAMMING.SPEED_MULTIPLIER;
        Velocity.y[entity] *= ABILITY_CONFIG.RAMMING.SPEED_MULTIPLIER;
      }

      // Trail particles
      if (particleSystem) {
        particleSystem.spawn({
          x: Position.x[entity],
          y: Position.y[entity],
          count: ABILITY_CONFIG.RAMMING.PARTICLES.COUNT,
          speed: { min: ABILITY_CONFIG.RAMMING.PARTICLES.SPEED.MIN, max: ABILITY_CONFIG.RAMMING.PARTICLES.SPEED.MAX },
          life: { min: ABILITY_CONFIG.RAMMING.PARTICLES.LIFE.MIN, max: ABILITY_CONFIG.RAMMING.PARTICLES.LIFE.MAX },
          size: { min: ABILITY_CONFIG.RAMMING.PARTICLES.SIZE.MIN, max: ABILITY_CONFIG.RAMMING.PARTICLES.SIZE.MAX },
          color: ABILITY_CONFIG.RAMMING.PARTICLES.COLOR,
          spread: Math.PI * 2
        });
      }
    }
  }

  // Deactivate after duration
  if (SpecialAbility.active[entity] === 1) {
    if (gameTime - SpecialAbility.lastUsed[entity] >= SpecialAbility.duration[entity]) {
      SpecialAbility.active[entity] = 0;

      // Restore normal velocity
      if (hasComponent(world, entity, Velocity)) {
        Velocity.x[entity] *= ABILITY_CONFIG.RAMMING.RESTORE_MULTIPLIER;
        Velocity.y[entity] *= ABILITY_CONFIG.RAMMING.RESTORE_MULTIPLIER;
      }
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Finds a safe position away from turrets and center
 */
function findSafePosition(spatialHash?: SpatialHash): { x: number; y: number } {
  const margin = AI_CONFIG.TELEPORT.EDGE_MARGIN;
  const safeDistance = ABILITY_TYPE_CONFIG[AbilityType.TELEPORT].range ?? 300;
  let attempts = 0;

  while (attempts < ABILITY_CONFIG.TELEPORT.MAX_ATTEMPTS) {
    const x = margin + Math.random() * (GAME_CONFIG.WORLD_WIDTH - margin * 2);
    const y = margin + Math.random() * (GAME_CONFIG.WORLD_HEIGHT - margin * 2);

    // Check if far enough from threats
    if (isSafePosition(x, y, safeDistance, spatialHash)) {
      return { x, y };
    }

    attempts++;
  }

  // Fallback: edge of screen
  return {
    x: Math.random() < 0.5 ? margin : GAME_CONFIG.WORLD_WIDTH - margin,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT
  };
}

/**
 * Checks if a position is safe (far from turrets and center)
 */
function isSafePosition(x: number, y: number, minDistance: number, spatialHash?: SpatialHash): boolean {
  // Check distance from center (Kobayashi Maru)
  const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
  const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
  const centerDist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

  if (centerDist < minDistance) {
    return false;
  }

  // Check distance from all turrets
  if (spatialHash) {
    const nearbyEntities = spatialHash.query(x, y, minDistance);
    for (const eid of nearbyEntities) {
      const dx = x - Position.x[eid];
      const dy = y - Position.y[eid];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if entity is being targeted by any turret
 */
function isBeingTargeted(): boolean {
  // Simplified: assume entity is being targeted if taking damage
  // Could be enhanced to check Target components of turrets
  return false;
}

/**
 * Creates an enemy by faction type
 */
function createEnemyByFaction(world: World, faction: number, x: number, y: number): number {
  // Federation faction doesn't have enemy ships to spawn
  if (faction === FactionId.FEDERATION) {
    return -1;
  }
  return createEnemy(world as GameWorld, faction, x, y);
}

/**
 * Gets faction color - simplified version
 */
function getFactionColor(faction: number): number {
  switch (faction) {
    case FactionId.KLINGON:
      return ABILITY_CONFIG.FACTION_COLORS.KLINGON;
    case FactionId.ROMULAN:
      return ABILITY_CONFIG.FACTION_COLORS.ROMULAN;
    case FactionId.BORG:
      return ABILITY_CONFIG.FACTION_COLORS.BORG;
    case FactionId.THOLIAN:
      return ABILITY_CONFIG.FACTION_COLORS.THOLIAN;
    case FactionId.SPECIES_8472:
      return ABILITY_CONFIG.FACTION_COLORS.SPECIES_8472;
    default:
      return ABILITY_CONFIG.FACTION_COLORS.DEFAULT;
  }
}
