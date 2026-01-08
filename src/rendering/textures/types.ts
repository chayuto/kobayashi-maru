/**
 * Texture types and constants for faction ship textures
 */
import { Texture } from 'pixi.js';

// Size of each shape texture
export const SHAPE_SIZE = 32;
// Kobayashi Maru is a larger, more detailed ship
export const KOBAYASHI_MARU_SIZE = 80;

/**
 * Texture atlas for all faction shapes
 */
export interface FactionTextures {
    federation: Texture;
    kobayashiMaru: Texture;
    klingon: Texture;
    romulan: Texture;
    borg: Texture;
    tholian: Texture;
    species8472: Texture;
    projectile: Texture;
    turretPhaser: Texture; // Legacy/Fallback
    turretTorpedo: Texture;
    turretDisruptor: Texture;
    turretTetryon: Texture;
    turretPlasma: Texture;
    turretPolaron: Texture;
    // New split textures
    turretBasePhaser: Texture;
    turretBarrelPhaser: Texture;
    turretBaseTorpedo: Texture;
    turretBarrelTorpedo: Texture;
    turretBaseDisruptor: Texture;
    turretBarrelDisruptor: Texture;
    turretBaseTetryon: Texture;
    turretBarrelTetryon: Texture;
    turretBasePlasma: Texture;
    turretBarrelPlasma: Texture;
    turretBasePolaron: Texture;
    turretBarrelPolaron: Texture;
}

// Texture cache keys for each faction
export const TEXTURE_KEYS = {
    federation: 'faction_federation',
    kobayashiMaru: 'faction_kobayashi_maru',
    klingon: 'faction_klingon',
    romulan: 'faction_romulan',
    borg: 'faction_borg',
    tholian: 'faction_tholian',
    species8472: 'faction_species8472',
    projectile: 'faction_projectile',
    turretPhaser: 'turret_phaser',
    turretTorpedo: 'turret_torpedo',
    turretDisruptor: 'turret_disruptor',
    turretTetryon: 'turret_tetryon',
    turretPlasma: 'turret_plasma',
    turretPolaron: 'turret_polaron',
    turretBasePhaser: 'turret_base_phaser',
    turretBarrelPhaser: 'turret_barrel_phaser',
    turretBaseTorpedo: 'turret_base_torpedo',
    turretBarrelTorpedo: 'turret_barrel_torpedo',
    turretBaseDisruptor: 'turret_base_disruptor',
    turretBarrelDisruptor: 'turret_barrel_disruptor',
    turretBaseTetryon: 'turret_base_tetryon',
    turretBarrelTetryon: 'turret_barrel_tetryon',
    turretBasePlasma: 'turret_base_plasma',
    turretBarrelPlasma: 'turret_barrel_plasma',
    turretBasePolaron: 'turret_base_polaron',
    turretBarrelPolaron: 'turret_barrel_polaron'
} as const;
