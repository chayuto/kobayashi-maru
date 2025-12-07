import { EmitterPattern } from './ParticleSystem';

export const EFFECTS = {
    // Legacy effects (backward compatible)
    EXPLOSION_SMALL: {
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
    },
    EXPLOSION_LARGE: {
        count: 40,
        speed: { min: 80, max: 200 },
        life: { min: 0.3, max: 0.8 },
        size: { min: 3, max: 10 },
        color: 0xFF4400,
        spread: Math.PI * 2
    },
    SHIELD_HIT: {
        count: 10,
        speed: { min: 30, max: 80 },
        life: { min: 0.1, max: 0.3 },
        size: { min: 2, max: 4 },
        color: 0x66AAFF,
        spread: Math.PI * 0.5 // Limited spread toward impact point
    },
    MUZZLE_FLASH: {
        count: 8,
        speed: { min: 100, max: 200 },
        life: { min: 0.05, max: 0.15 },
        size: { min: 2, max: 5 },
        color: 0xFFFF00,
        spread: Math.PI * 0.3
    },

    // New advanced effects
    FIRE_EXPLOSION: {
        count: 60,
        speed: { min: 100, max: 250 },
        life: { min: 0.4, max: 1.2 },
        size: { min: 4, max: 12 },
        sprite: 'fire' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xFFFFFF, alpha: 1.0 },    // White flash
                { time: 0.2, color: 0xFFFF00, alpha: 1.0 },  // Yellow
                { time: 0.5, color: 0xFF6600, alpha: 0.8 },  // Orange
                { time: 1.0, color: 0xFF0000, alpha: 0.0 }   // Red fade
            ]
        },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.CIRCULAR
    },

    IMPACT_SPARKS: {
        count: 20,
        speed: { min: 150, max: 400 },
        life: { min: 0.1, max: 0.4 },
        size: { min: 2, max: 4 },
        sprite: 'spark' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xFFFFFF, alpha: 1.0 },
                { time: 1.0, color: 0xFFAA00, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 0.8,
        emitterPattern: EmitterPattern.CONE,
        trail: { enabled: true, length: 5, fadeRate: 0.3, width: 1 }
    },

    PLASMA_TRAIL: {
        count: 3,
        speed: { min: 0, max: 20 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 6, max: 10 },
        sprite: 'energy' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0x00FF88, alpha: 0.8 },
                { time: 1.0, color: 0x00AA44, alpha: 0.0 }
            ]
        },
        spread: 0,
        emitterPattern: EmitterPattern.BURST
    },

    SMOKE_PLUME: {
        count: 30,
        speed: { min: 20, max: 60 },
        life: { min: 1.0, max: 2.5 },
        size: { min: 8, max: 20 },
        sprite: 'smoke' as const,
        scaleStart: 1.0,
        scaleEnd: 3.0,
        colorGradient: {
            stops: [
                { time: 0, color: 0x444444, alpha: 0.6 },
                { time: 0.5, color: 0x666666, alpha: 0.4 },
                { time: 1.0, color: 0x888888, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 0.4,
        gravity: -50,  // Rise upward
        drag: 0.95
    },

    ENERGY_BURST: {
        count: 25,
        speed: { min: 80, max: 200 },
        life: { min: 0.2, max: 0.6 },
        size: { min: 3, max: 8 },
        sprite: 'energy' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0x00CCFF, alpha: 1.0 },
                { time: 0.5, color: 0x0088FF, alpha: 0.6 },
                { time: 1.0, color: 0x0044AA, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.RING
    },

    STAR_BURST: {
        count: 30,
        speed: { min: 50, max: 150 },
        life: { min: 0.3, max: 0.8 },
        size: { min: 3, max: 7 },
        sprite: 'star' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xFFFF00, alpha: 1.0 },
                { time: 0.5, color: 0xFFAA00, alpha: 0.8 },
                { time: 1.0, color: 0xFF6600, alpha: 0.0 }
            ]
        },
        rotation: { min: 0, max: Math.PI * 2 },
        rotationSpeed: { min: -5, max: 5 },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.CIRCULAR
    },

    SPIRAL_VORTEX: {
        count: 40,
        speed: { min: 100, max: 180 },
        life: { min: 0.5, max: 1.0 },
        size: { min: 2, max: 6 },
        sprite: 'square' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xFF00FF, alpha: 1.0 },
                { time: 0.5, color: 0xAA00FF, alpha: 0.7 },
                { time: 1.0, color: 0x6600AA, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.SPIRAL
    },

    FOUNTAIN_SPRAY: {
        count: 50,
        speed: { min: 120, max: 200 },
        life: { min: 0.8, max: 1.5 },
        size: { min: 2, max: 5 },
        sprite: 'circle' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0x00FFFF, alpha: 1.0 },
                { time: 0.7, color: 0x0088FF, alpha: 0.5 },
                { time: 1.0, color: 0x004488, alpha: 0.0 }
            ]
        },
        spread: Math.PI / 4,
        emitterPattern: EmitterPattern.FOUNTAIN,
        emitterAngle: -Math.PI / 2,
        emitterWidth: Math.PI / 3,
        gravity: 200,  // Fall downward
        drag: 0.98
    },

    DEBRIS_SHOWER: {
        count: 35,
        speed: { min: 80, max: 180 },
        life: { min: 0.6, max: 1.4 },
        size: { min: 3, max: 8 },
        sprite: 'square' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0x888888, alpha: 1.0 },
                { time: 0.5, color: 0x666666, alpha: 0.7 },
                { time: 1.0, color: 0x333333, alpha: 0.0 }
            ]
        },
        rotation: { min: 0, max: Math.PI * 2 },
        rotationSpeed: { min: -10, max: 10 },
        spread: Math.PI * 2,
        gravity: 150,  // Fall
        drag: 0.96
    },

    ELECTRIC_DISCHARGE: {
        count: 45,
        speed: { min: 50, max: 120 },
        life: { min: 0.1, max: 0.3 },
        size: { min: 1, max: 3 },
        sprite: 'spark' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xCCFFFF, alpha: 1.0 },
                { time: 0.4, color: 0x66CCFF, alpha: 0.8 },
                { time: 1.0, color: 0x0088FF, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.RING,
        trail: { enabled: true, length: 3, fadeRate: 0.5, width: 1 }
    },

    WARP_FLASH: {
        count: 80,
        speed: { min: 200, max: 400 },
        life: { min: 0.15, max: 0.4 },
        size: { min: 2, max: 6 },
        sprite: 'star' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xFFFFFF, alpha: 1.0 },
                { time: 0.3, color: 0xCCFFFF, alpha: 0.8 },
                { time: 1.0, color: 0x4488FF, alpha: 0.0 }
            ]
        },
        spread: Math.PI * 2,
        emitterPattern: EmitterPattern.RING,
        scaleStart: 0.5,
        scaleEnd: 2.0
    },

    // Debris effects with physics
    METAL_DEBRIS: {
        count: 25,
        speed: { min: 100, max: 220 },
        life: { min: 1.0, max: 2.0 },
        size: { min: 3, max: 7 },
        sprite: 'square' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xAAAAAA, alpha: 1.0 },
                { time: 0.6, color: 0x888888, alpha: 0.8 },
                { time: 1.0, color: 0x444444, alpha: 0.0 }
            ]
        },
        rotation: { min: 0, max: Math.PI * 2 },
        rotationSpeed: { min: -8, max: 8 },
        spread: Math.PI * 2,
        gravity: 300,  // Fall downward
        drag: 0.97,
        bounceCount: 2,
        bounceDamping: 0.6,
        groundY: 1080  // Match GAME_CONFIG.WORLD_HEIGHT
    },

    HULL_FRAGMENTS: {
        count: 20,
        speed: { min: 120, max: 250 },
        life: { min: 0.8, max: 1.6 },
        size: { min: 4, max: 9 },
        sprite: 'square' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0x666666, alpha: 1.0 },
                { time: 0.5, color: 0x555555, alpha: 0.7 },
                { time: 1.0, color: 0x222222, alpha: 0.0 }
            ]
        },
        rotation: { min: 0, max: Math.PI * 2 },
        rotationSpeed: { min: -12, max: 12 },
        spread: Math.PI * 2,
        gravity: 250,
        drag: 0.96,
        bounceCount: 3,
        bounceDamping: 0.7,
        groundY: 1080
    },

    SPARK_DEBRIS: {
        count: 30,
        speed: { min: 150, max: 350 },
        life: { min: 0.3, max: 0.8 },
        size: { min: 2, max: 5 },
        sprite: 'spark' as const,
        colorGradient: {
            stops: [
                { time: 0, color: 0xFFFF88, alpha: 1.0 },
                { time: 0.4, color: 0xFFAA00, alpha: 0.8 },
                { time: 1.0, color: 0xFF6600, alpha: 0.0 }
            ]
        },
        rotation: { min: 0, max: Math.PI * 2 },
        rotationSpeed: { min: -15, max: 15 },
        spread: Math.PI * 2,
        gravity: 350,
        drag: 0.98,
        bounceCount: 1,
        bounceDamping: 0.5,
        groundY: 1080,
        trail: { enabled: true, length: 3, fadeRate: 0.4, width: 1 }
    }
};
