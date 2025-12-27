/**
 * Interface Definitions for Kobayashi Maru
 * 
 * This module exports all service interfaces following the Interface-First Design pattern.
 * Interfaces define contracts before implementations, enabling:
 * - Type-safe dependency injection
 * - Easy mocking for tests
 * - Clear API documentation
 * - Agent-friendly code understanding
 * 
 * @module types/interfaces
 */

// Game Logic Interfaces
export type { IWaveManager, WaveState } from './IWaveManager';
export type { IGameState, StateChangeEvent, StateChangeCallback } from './IGameState';
export { GameStateType } from './IGameState';
export type { IResourceManager } from './IResourceManager';
export type { IScoreManager, ScoreData } from './IScoreManager';

// Entity Factory Interfaces
export type {
  IEntityFactory,
  IBatchEntityFactory,
  EntityConfig,
  EnemyConfig,
  TurretConfig,
  ProjectileConfig
} from './IEntityFactory';

// System Interfaces
export type {
  SystemContext,
  ECSSystem,
  SystemRegistrationOptions
} from './ISystemContext';
