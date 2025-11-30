export const EFFECTS = {
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
    }
};
