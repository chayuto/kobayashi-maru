/**
 * TypeScript types for the E2E test bridge API exposed on window.__GAME__.
 * This file provides type safety when interacting with the bridge in tests.
 */

export interface GameSnapshot {
  state: string;
  wave: number;
  waveState: string;
  activeEnemies: number;
  resources: number;
  score: {
    timeSurvived: number;
    waveReached: number;
    enemiesDefeated: number;
    civiliansSaved: number;
    comboCount?: number;
    comboMultiplier?: number;
    maxCombo?: number;
  };
  kmHealth: number;
  kmMaxHealth: number;
}

export interface CapturedEvent {
  type: string;
  payload: unknown;
  time: number;
}

export interface EntityCounts {
  turrets: number;
  enemies: number;
}

export interface GameBridge {
  getSnapshot(): GameSnapshot;

  getEvents(): CapturedEvent[];
  getEventsByType(type: string): CapturedEvent[];
  clearEvents(): void;

  startGame(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  toggleGodMode(): boolean;
  toggleAI(): boolean;
  isAIEnabled(): boolean;

  setResources(amount: number): void;
  setKMHealth(health: number): void;
  placeTurret(turretType: number, x: number, y: number): boolean;

  getEntityCounts(): EntityCounts;

  freezeStarfield(): void;

  isReady(): boolean;
}

declare global {
  interface Window {
    __GAME__: GameBridge;
    __E2E_MODE__: boolean;
  }
}
