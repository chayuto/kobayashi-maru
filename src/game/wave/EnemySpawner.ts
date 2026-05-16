/**
 * Enemy Spawner for Kobayashi Maru
 *
 * Handles enemy creation and initial velocity toward Kobayashi Maru.
 * Extracted from WaveManager for cleaner separation of concerns.
 *
 * @module game/wave/EnemySpawner
 */

import { createEnemy } from '../../ecs/entityFactory';
import { Velocity } from '../../ecs/components';
import { GAME_CONFIG } from '../../types/constants';
import { WAVE_CONFIG } from '../../config';
import { randomFloat } from '../../utils';
import type { GameWorld } from '../../ecs/world';
import type { SpawnPosition } from '../spawnPoints';

/**
 * EnemySpawner handles enemy entity creation and initial movement.
 */
export class EnemySpawner {
    private world: GameWorld | null = null;

    /**
     * Set the ECS world.
     */
    setWorld(world: GameWorld): void {
        this.world = world;
    }

    /**
     * Create an enemy entity by faction at specified position.
     * @returns Entity ID or -1 if failed
     */
    createEnemy(faction: number, x: number, y: number): number {
        if (!this.world) return -1;
        return createEnemy(this.world, faction, x, y);
    }

    /**
     * Set enemy velocity to move toward the center (Kobayashi Maru).
     */
    setVelocityTowardCenter(eid: number, position: SpawnPosition, currentWave: number): void {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

        const dx = centerX - position.x;
        const dy = centerY - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Speed range: 50-200 pixels per second, scaled by difficulty
            const baseSpeed = WAVE_CONFIG.ENEMY_SPEED.BASE_MIN + randomFloat() * WAVE_CONFIG.ENEMY_SPEED.BASE_RANGE;
            const speedScale = 1 + (currentWave - 1) * WAVE_CONFIG.ENEMY_SPEED.SCALE_PER_WAVE; // 2% faster per wave
            const speed = baseSpeed * speedScale;

            Velocity.x[eid] = (dx / distance) * speed;
            Velocity.y[eid] = (dy / distance) * speed;
        }
    }
}
