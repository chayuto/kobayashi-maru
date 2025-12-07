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
    },

    /**
     * Screen shake effect settings.
     */
    SCREEN_SHAKE: {
        /** Maximum pixel offset */
        MAX_OFFSET: 10,
        /** Decay rate per frame (0.0 - 1.0) */
        DECAY_RATE: 0.9,
    },
} as const;

export type RenderingConfig = typeof RENDERING_CONFIG;
