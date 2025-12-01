/**
 * Game Event Types for Kobayashi Maru
 * Defines all events emitted by the global Event Bus
 */

/**
 * Event type identifiers
 */
export enum GameEventType {
  ENEMY_KILLED = 'ENEMY_KILLED',
  WAVE_STARTED = 'WAVE_STARTED',
  WAVE_COMPLETED = 'WAVE_COMPLETED',
  PLAYER_DAMAGED = 'PLAYER_DAMAGED',
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',
  GAME_OVER = 'GAME_OVER',
  TOUCH_START = 'TOUCH_START',
  TOUCH_MOVE = 'TOUCH_MOVE',
  TOUCH_END = 'TOUCH_END',
  GESTURE = 'GESTURE'
}

/**
 * Payload for ENEMY_KILLED event
 */
export interface EnemyKilledPayload {
  entityId: number;
  factionId: number;
  x: number;
  y: number;
}

/**
 * Payload for WAVE_STARTED event
 */
export interface WaveStartedPayload {
  waveNumber: number;
  totalEnemies?: number;
}

/**
 * Payload for WAVE_COMPLETED event
 */
export interface WaveCompletedPayload {
  waveNumber: number;
}

/**
 * Payload for PLAYER_DAMAGED event
 */
export interface PlayerDamagedPayload {
  currentHealth: number;
}

/**
 * Payload for RESOURCE_UPDATED event
 */
export interface ResourceUpdatedPayload {
  current: number;
  amount: number;
}

/**
 * Payload for GAME_OVER event
 */
export interface GameOverPayload {
  score: number;
}

/**
 * Payload for TOUCH events
 */
export interface TouchEventPayload {
  x: number;
  y: number;
  originalEvent: TouchEvent;
}

export enum GestureType {
  PAN = 'PAN',
  PINCH = 'PINCH',
  SWIPE = 'SWIPE',
  TAP = 'TAP'
}

export interface GestureEvent {
  type: GestureType;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  centerX?: number;
  centerY?: number;
}

/**
 * Map of event types to their payload types
 */
export interface GameEventMap {
  [GameEventType.ENEMY_KILLED]: EnemyKilledPayload;
  [GameEventType.WAVE_STARTED]: WaveStartedPayload;
  [GameEventType.WAVE_COMPLETED]: WaveCompletedPayload;
  [GameEventType.PLAYER_DAMAGED]: PlayerDamagedPayload;
  [GameEventType.RESOURCE_UPDATED]: ResourceUpdatedPayload;
  [GameEventType.GAME_OVER]: GameOverPayload;
  [GameEventType.TOUCH_START]: TouchEventPayload;
  [GameEventType.TOUCH_MOVE]: TouchEventPayload;
  [GameEventType.TOUCH_END]: TouchEventPayload;
  [GameEventType.GESTURE]: GestureEvent;
}
