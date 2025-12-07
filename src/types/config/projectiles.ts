/**
 * Projectile Configuration
 * 
 * Projectile types and their stats.
 * 
 * @module types/config/projectiles
 */

/** Projectile type identifiers */
export const ProjectileType = {
    PHOTON_TORPEDO: 0,
    QUANTUM_TORPEDO: 1,
    DISRUPTOR_BOLT: 2
} as const;

export type ProjectileTypeId = typeof ProjectileType[keyof typeof ProjectileType];

/** Projectile configuration */
export const PROJECTILE_CONFIG: Record<number, {
    speed: number;
    lifetime: number;
    size: number;
    color: number;
}> = {
    [ProjectileType.PHOTON_TORPEDO]: {
        speed: 400, lifetime: 5, size: 8, color: 0xFF6600
    },
    [ProjectileType.QUANTUM_TORPEDO]: {
        speed: 500, lifetime: 6, size: 9, color: 0x00CCFF
    },
    [ProjectileType.DISRUPTOR_BOLT]: {
        speed: 350, lifetime: 4, size: 6, color: 0x00FF00
    }
};
