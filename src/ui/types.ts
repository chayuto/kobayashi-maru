/**
 * UI Type Definitions for Kobayashi Maru HUD System
 */

import type { WaveState } from '../game/waveManager';

/**
 * HUD Data interface containing all information to display
 */
export interface HUDData {
  waveNumber: number;
  waveState: WaveState;
  activeEnemies: number;
  resources: number;
  timeSurvived: number;
  enemiesDefeated: number;
  kobayashiMaruHealth: number;
  kobayashiMaruMaxHealth: number;
  kobayashiMaruShield: number;
  kobayashiMaruMaxShield: number;
  turretCount: number;
}
