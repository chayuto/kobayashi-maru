/**
 * Core Game Configuration
 * 
 * World dimensions, collision settings, and gameplay balance values.
 * 
 * @module types/config/game
 */

/** Core game configuration values */
export const GAME_CONFIG = {
    TARGET_FPS: 60,
    INITIAL_ENTITY_COUNT: 5000,
    WORLD_WIDTH: 1920,
    WORLD_HEIGHT: 1080,
    COLLISION_CELL_SIZE: 64,
    MIN_TURRET_DISTANCE: 64,
    INITIAL_RESOURCES: 500,
    RESOURCE_REWARD: 10,
    ENEMY_COLLISION_RADIUS: 40,
    ENEMY_COLLISION_DAMAGE: 25,
    SLOW_MODE_MULTIPLIER: 0.5,
    ORBIT_RADIUS: 300,
    ORBIT_SPEED: 50,
    ORBIT_APPROACH_SPEED: 40,
    KOBAYASHI_MARU_RADIUS: 40,
    TURRET_RADIUS: 20,
    KOBAYASHI_MARU_DEFENSE_RANGE: 250,
    KOBAYASHI_MARU_DEFENSE_FIRE_RATE: 2,
    KOBAYASHI_MARU_DEFENSE_DAMAGE: 15
} as const;
