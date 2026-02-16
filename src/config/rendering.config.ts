/**
 * Rendering Configuration
 * 
 * Settings for visual effects, particles, sprites, and textures.
 * 
 * @module config/rendering
 */

/**
 * Rendering configuration values.
 * 
 * @example
 * ```typescript
 * import { RENDERING_CONFIG } from '../config';
 * 
 * const maxParticles = RENDERING_CONFIG.PARTICLES.MAX_COUNT;
 * const shapeSize = RENDERING_CONFIG.TEXTURES.SHAPE_SIZE;
 * ```
 */
export const RENDERING_CONFIG = {
    /**
     * Particle system limits and settings.
     */
    PARTICLES: {
        /** Maximum number of particles in the system */
        MAX_COUNT: 15000,
        /** Object pool size for particle recycling */
        POOL_SIZE: 1000,
        /** Batch size for particle updates */
        BATCH_SIZE: 500,
    },

    /**
     * Sprite settings for the ParticleContainer.
     */
    SPRITES: {
        /** Value indicating sprite index is unset */
        INDEX_UNSET: 0,
        /** Placeholder sprite index for new entities */
        PLACEHOLDER_INDEX: 0,
    },

    /**
     * Texture generation settings.
     */
    TEXTURES: {
        /** Default shape size in pixels for procedural textures */
        SHAPE_SIZE: 16,
        /** Default texture size in pixels */
        DEFAULT_SIZE: 32,
        /** Maximum cached textures */
        CACHE_LIMIT: 100,
    },

    /**
     * Glow effect settings.
     */
    GLOW: {
        /** Maximum glow strength value */
        MAX_STRENGTH: 10,
    },

    /**
     * Starfield background settings.
     */
    STARFIELD: {
        /** Number of parallax layers */
        LAYER_COUNT: 3,
        /** Stars per layer [back, mid, front] */
        STARS_PER_LAYER: [100, 50, 25],
        /** Parallax scroll speeds [back, mid, front] */
        PARALLAX_SPEEDS: [0.3, 0.5, 0.8],
        /** Default horizontal scroll speed (pixels per second) */
        DEFAULT_SCROLL_SPEED_X: 0,
        /** Default vertical scroll speed (pixels per second) */
        DEFAULT_SCROLL_SPEED_Y: 100,
    },

    /**
     * Screen shake effect settings.
     */
    SCREEN_SHAKE: {
        /** Maximum pixel offset */
        MAX_OFFSET: 10,
        /** Decay rate per frame (0.0 - 1.0) */
        DECAY_RATE: 0.9,
        /** Simplex noise frequency for smooth shake */
        NOISE_FREQUENCY: 8,
    },
    /**
     * Floating damage number settings.
     */
    DAMAGE_NUMBERS: {
        /** Object pool size for Text recycling */
        POOL_SIZE: 30,
        /** Duration of float animation in seconds */
        DURATION: 0.8,
        /** Upward float speed in pixels per second */
        FLOAT_SPEED: 80,
        /** Starting scale */
        START_SCALE: 1.0,
        /** Ending scale */
        END_SCALE: 0.3,
        /** Font size for damage text */
        FONT_SIZE: 20,
        /** Color for shield damage */
        SHIELD_COLOR: 0x44BBFF,
        /** Color for health damage */
        HEALTH_COLOR: 0xFF4455,
        /** Color for critical hits (high damage) */
        CRITICAL_COLOR: 0xFF9900,
        /** Damage threshold for critical display */
        CRITICAL_THRESHOLD: 50,
    },

    /**
     * Explosion effect settings by enemy rank.
     */
    EXPLOSIONS: {
        /** Boss death screen shake intensity */
        BOSS_SHAKE_INTENSITY: 8,
        /** Boss death screen shake duration */
        BOSS_SHAKE_DURATION: 0.5,
        /** Elite death shockwave radius */
        ELITE_SHOCKWAVE_RADIUS: 80,
        /** Elite death shockwave duration */
        ELITE_SHOCKWAVE_DURATION: 0.4,
        /** Elite particle count */
        ELITE_PARTICLE_COUNT: 30,
        /** Boss particle count */
        BOSS_PARTICLE_COUNT: 40,
    },

    /**
     * Screen flash overlay settings.
     */
    SCREEN_FLASH: {
        /** Maximum flash alpha intensity */
        MAX_INTENSITY: 0.6,
        /** Flash color when Kobayashi Maru takes damage */
        KM_DAMAGE_COLOR: 0xFF2200,
        /** Flash color on boss kill */
        BOSS_KILL_COLOR: 0xFFFFFF,
        /** Boss kill flash intensity */
        BOSS_KILL_INTENSITY: 0.4,
        /** Boss kill flash duration */
        BOSS_KILL_DURATION: 0.5,
        /** KM damage flash duration */
        KM_DAMAGE_DURATION: 0.3,
    },

    /**
     * Hit stop (freeze frame) settings.
     */
    HIT_STOP: {
        /** Freeze frames on boss kill (~67ms at 60fps) */
        BOSS_KILL_FRAMES: 4,
        /** Freeze frames on elite kill (~33ms at 60fps) */
        ELITE_KILL_FRAMES: 2,
    },

    /**
     * Hit flash on enemy sprites.
     */
    HIT_FLASH: {
        /** Flash duration in seconds */
        DURATION: 0.08,
        /** Flash tint color (white) */
        COLOR: 0xFFFFFF,
    },
} as const;

export type RenderingConfig = typeof RENDERING_CONFIG;
