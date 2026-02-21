/**
 * Damage System for Kobayashi Maru
 * Handles entity destruction when health reaches 0 and returns entities to pool
 */
import { query, removeEntity, World } from 'bitecs';
import { Health, Faction, Position, SpriteRef, CompositeSpriteRef, EnemyVariant } from '../ecs/components';
import { FactionId } from '../types/constants';
import { FACTION_COLORS } from '../types/config/factions';
import { RENDERING_CONFIG, AUDIO_CONFIG } from '../config';
import { GameEventType } from '../types/events';
import { AudioManager, SoundType } from '../audio';
import { decrementEntityCount } from '../ecs/world';
import { ParticleSystem, EFFECTS } from '../rendering';
import { EventBus } from '../core/EventBus';
import { PoolManager } from '../ecs/PoolManager';
import { getServices } from '../core/services';
import type { SpriteManager } from '../rendering/spriteManager';

// Use centralized config for unset sprite index
const SPRITE_INDEX_UNSET = RENDERING_CONFIG.SPRITES.INDEX_UNSET;

/** Map faction ID to explosion color from FACTION_COLORS */
const FACTION_COLOR_MAP: Record<number, number> = {
  [FactionId.KLINGON]: FACTION_COLORS.KLINGON,
  [FactionId.ROMULAN]: FACTION_COLORS.ROMULAN,
  [FactionId.BORG]: FACTION_COLORS.BORG,
  [FactionId.THOLIAN]: FACTION_COLORS.THOLIAN,
  [FactionId.SPECIES_8472]: FACTION_COLORS.SPECIES_8472,
};

function getFactionExplosionColor(factionId: number): number {
  return FACTION_COLOR_MAP[factionId] ?? 0xFF6600;
}

/**
 * Deferred particle spawn entry.
 * Used to replace setTimeout with a frame-driven queue.
 */
interface DeferredSpawn {
  config: Parameters<ParticleSystem['spawn']>[0];
  delay: number;
}

/**
 * Creates the damage system that handles entity destruction
 * @param particleSystem - Optional particle system for explosion effects
 * @param spriteManager - Optional sprite manager for immediate sprite removal
 * @returns A system function that processes entity deaths
 */
export function createDamageSystem(particleSystem?: ParticleSystem, spriteManager?: SpriteManager) {
  // Track entities destroyed this frame
  const destroyedThisFrame: number[] = [];
  // Get the EventBus instance
  const eventBus = EventBus.getInstance();
  // Get the PoolManager instance
  const poolManager = PoolManager.getInstance();
  // Deferred spawn queue (replaces setTimeout)
  const deferredSpawns: DeferredSpawn[] = [];

  function damageSystem(world: World, deltaTime: number): World {
    // Process deferred spawns
    for (let i = deferredSpawns.length - 1; i >= 0; i--) {
      deferredSpawns[i].delay -= deltaTime;
      if (deferredSpawns[i].delay <= 0) {
        if (particleSystem) {
          particleSystem.spawn(deferredSpawns[i].config);
        }
        deferredSpawns.splice(i, 1);
      }
    }

    // Clear destroyed list from last frame
    destroyedThisFrame.length = 0;

    const entities = query(world, [Health, Faction, Position]);

    for (const eid of entities) {
      const currentHealth = Health.current[eid];

      // Skip entities that are still alive
      if (currentHealth > 0) continue;

      // Entity destroyed
      const factionId = Faction.id[eid];
      const x = Position.x[eid];
      const y = Position.y[eid];

      // Play explosion sound and visual effect
      const audioManager = AudioManager.getInstance();
      if (factionId === FactionId.FEDERATION) {
        // Turret/Player explosion
        audioManager.play(SoundType.EXPLOSION_LARGE, { volume: AUDIO_CONFIG.SFX.EXPLOSION_LARGE });

        if (particleSystem) {
          particleSystem.spawn({
            ...EFFECTS.EXPLOSION_LARGE,
            x,
            y
          });
        }
      } else {
        // Enemy explosion - rank-based effects
        const rank = EnemyVariant.rank[eid] ?? 0;
        const explosionConfig = RENDERING_CONFIG.EXPLOSIONS;

        if (rank === 2) {
          // Boss: multi-stage explosion + screen shake
          audioManager.play(SoundType.EXPLOSION_LARGE, { volume: AUDIO_CONFIG.SFX.EXPLOSION_LARGE });

          if (particleSystem) {
            // Stage 1: fire explosion
            particleSystem.spawn({
              ...EFFECTS.FIRE_EXPLOSION,
              count: explosionConfig.BOSS_PARTICLE_COUNT,
              x,
              y
            });

            // Stage 2: metal debris (deferred)
            deferredSpawns.push({
              config: { ...EFFECTS.METAL_DEBRIS, x, y },
              delay: 0.15
            });

            // Stage 3: smoke plume (deferred)
            deferredSpawns.push({
              config: { ...EFFECTS.SMOKE_PLUME, x, y },
              delay: 0.3
            });
          }

          // Shockwave
          const shockwaveRenderer = getServices().tryGet('shockwaveRenderer');
          if (shockwaveRenderer) {
            shockwaveRenderer.create(x, y, 120, getFactionExplosionColor(factionId), 0.6);
          }

          // Screen shake
          const screenShake = getServices().tryGet('screenShake');
          if (screenShake) {
            screenShake.shake(explosionConfig.BOSS_SHAKE_INTENSITY, explosionConfig.BOSS_SHAKE_DURATION);
          }
        } else if (rank === 1) {
          // Elite: fire explosion + small shockwave
          audioManager.play(SoundType.EXPLOSION_SMALL, { volume: AUDIO_CONFIG.SFX.EXPLOSION_SMALL });

          if (particleSystem) {
            particleSystem.spawn({
              ...EFFECTS.ELITE_FIRE_EXPLOSION,
              count: explosionConfig.ELITE_PARTICLE_COUNT,
              x,
              y
            });
          }

          // Small shockwave
          const shockwaveRenderer = getServices().tryGet('shockwaveRenderer');
          if (shockwaveRenderer) {
            shockwaveRenderer.create(
              x, y,
              explosionConfig.ELITE_SHOCKWAVE_RADIUS,
              getFactionExplosionColor(factionId),
              explosionConfig.ELITE_SHOCKWAVE_DURATION
            );
          }
        } else {
          // Normal enemy explosion
          audioManager.play(SoundType.EXPLOSION_SMALL, { volume: AUDIO_CONFIG.SFX.EXPLOSION_SMALL });

          if (particleSystem) {
            particleSystem.spawn({
              ...EFFECTS.EXPLOSION_SMALL,
              x,
              y
            });
          }
        }
      }

      // Only process non-Federation entities as enemies
      if (factionId !== FactionId.FEDERATION) {
        // Emit event via EventBus
        eventBus.emit(GameEventType.ENEMY_KILLED, {
          entityId: eid,
          factionId,
          x,
          y
        });
      }

      // Track as destroyed
      destroyedThisFrame.push(eid);

      // Immediately remove sprite before releasing to pool (fixes visual delay)
      const spriteIndex = SpriteRef.index[eid];
      if (spriteIndex !== SPRITE_INDEX_UNSET && spriteManager) {
        spriteManager.removeSprite(spriteIndex);
        SpriteRef.index[eid] = SPRITE_INDEX_UNSET;
      }

      // Immediately remove composite sprites
      const baseIndex = CompositeSpriteRef.baseIndex[eid];
      if (baseIndex !== SPRITE_INDEX_UNSET && spriteManager) {
        spriteManager.removeSprite(baseIndex);
        spriteManager.removeSprite(CompositeSpriteRef.barrelIndex[eid]);
        CompositeSpriteRef.baseIndex[eid] = SPRITE_INDEX_UNSET;
        CompositeSpriteRef.barrelIndex[eid] = SPRITE_INDEX_UNSET;
      }

      // Remove entity from world or Return to appropriate pool
      if (factionId === FactionId.PROJECTILE || factionId === FactionId.ENEMY_PROJECTILE) {
        // Projectile entity
        poolManager.releaseProjectile(eid);
      } else if (factionId !== FactionId.FEDERATION) {
        // Enemy entity
        poolManager.releaseEnemy(eid);
      } else {
        // Federation entities (turrets, Kobayashi Maru) - actually remove
        removeEntity(world, eid);
        decrementEntityCount();
      }
    }

    return world;
  }

  return {
    update: damageSystem,
    /**
     * Get entities destroyed in the current frame
     */
    getDestroyedThisFrame: () => [...destroyedThisFrame]
  };
}

export type DamageSystem = ReturnType<typeof createDamageSystem>;

