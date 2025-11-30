/**
 * Audio types and enums
 */

export enum SoundType {
    // Weapons
    PHASER_FIRE = 'phaser_fire',
    TORPEDO_FIRE = 'torpedo_fire',
    DISRUPTOR_FIRE = 'disruptor_fire',

    // Combat
    EXPLOSION_SMALL = 'explosion_small',
    EXPLOSION_LARGE = 'explosion_large',
    SHIELD_HIT = 'shield_hit',
    HULL_HIT = 'hull_hit',

    // UI
    TURRET_PLACE = 'turret_place',
    TURRET_SELECT = 'turret_select',
    RESOURCE_GAIN = 'resource_gain',
    ERROR_BEEP = 'error_beep',

    // Game Events
    WAVE_START = 'wave_start',
    WAVE_COMPLETE = 'wave_complete',
    GAME_OVER = 'game_over',

    // Ambient
    SPACE_AMBIENT = 'space_ambient',
    ALERT_KLAXON = 'alert_klaxon'
}

export interface PlayOptions {
    volume?: number;   // 0-1, default 1
    pitch?: number;    // Playback rate, default 1
    pan?: number;      // -1 to 1, default 0 (center)
    loop?: boolean;    // Default false
}
