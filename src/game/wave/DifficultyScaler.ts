/**
 * Difficulty Scaler for Kobayashi Maru
 *
 * Handles difficulty scaling of enemy stats based on wave number.
 * Extracted from WaveManager for cleaner separation of concerns.
 *
 * @module game/wave/DifficultyScaler
 */

import { Health, Shield } from '../../ecs/components';

/**
 * DifficultyScaler applies wave-based stat scaling to enemies.
 */
export class DifficultyScaler {
    /**
     * Apply difficulty scaling to an enemy's stats.
     * @param eid - Entity ID
     * @param scale - Difficulty scale multiplier (from getDifficultyScale)
     */
    applyScaling(eid: number, scale: number): void {
        // Scale health
        Health.current[eid] = Math.floor(Health.current[eid] * scale);
        Health.max[eid] = Math.floor(Health.max[eid] * scale);

        // Scale shields
        Shield.current[eid] = Math.floor(Shield.current[eid] * scale);
        Shield.max[eid] = Math.floor(Shield.max[eid] * scale);
    }
}
