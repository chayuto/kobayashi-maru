/**
 * Game Event Types for Kobayashi Maru
 * 
 * All events emitted through the global EventBus.
 * Events are organized by domain for discoverability.
 * 
 * @module types/events
 */

/**
 * Event type identifiers
 * 
 * Events are organized by domain:
 * - COMBAT EVENTS: Enemy kills, player damage
 * - WAVE EVENTS: Wave lifecycle
 * - ECONOMY EVENTS: Resources, upgrades
 * - UI EVENTS: Combo, achievements
 * - INPUT EVENTS: Touch and gesture handling
 */
export enum GameEventType {
  // ============================================
  // COMBAT EVENTS
  // ============================================

  /**
   * Fired when an enemy entity is destroyed.
   * 
   * @emittedBy damageSystem.ts - when Health.current reaches 0 for non-Federation entities
   * @payload EnemyKilledPayload
   * @timing Immediate, before entity removal from world
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.ENEMY_KILLED, (payload) => {
   *   spawnExplosion(payload.x, payload.y);
   *   addResources(GAME_CONFIG.RESOURCE_REWARD);
   * });
   * ```
   */
  ENEMY_KILLED = 'ENEMY_KILLED',

  /**
   * Fired when the Kobayashi Maru (player ship) takes damage.
   * 
   * @emittedBy Not yet implemented - reserved for future use
   * @payload PlayerDamagedPayload
   * @timing After health reduction is applied
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.PLAYER_DAMAGED, (payload) => {
   *   triggerScreenShake();
   *   updateHealthBar(payload.currentHealth);
   * });
   * ```
   */
  PLAYER_DAMAGED = 'PLAYER_DAMAGED',

  // ============================================
  // WAVE EVENTS
  // ============================================

  /**
   * Fired when a new wave begins spawning.
   * 
   * @emittedBy WaveManager.startWave() - at the start of wave initialization
   * @payload WaveStartedPayload
   * @timing Before first enemy spawns
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.WAVE_STARTED, (payload) => {
   *   showWaveAnnouncement(payload.waveNumber);
   *   prepareDefenses(payload.totalEnemies);
   * });
   * ```
   */
  WAVE_STARTED = 'WAVE_STARTED',

  /**
   * Fired when all enemies in a wave are defeated.
   * 
   * @emittedBy WaveManager.completeWave() - when activeEnemies.size === 0
   * @payload WaveCompletedPayload
   * @timing After last enemy killed, before next wave delay
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.WAVE_COMPLETED, (payload) => {
   *   showWaveCompleteMessage(payload.waveNumber);
   *   awardWaveBonus();
   * });
   * ```
   */
  WAVE_COMPLETED = 'WAVE_COMPLETED',

  // ============================================
  // ECONOMY EVENTS
  // ============================================

  /**
   * Fired when player resources change.
   * 
   * @emittedBy ResourceManager.emitResourceUpdate() - on add, spend, or set
   * @payload ResourceUpdatedPayload
   * @timing Immediate after resource change
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.RESOURCE_UPDATED, (payload) => {
   *   updateResourceDisplay(payload.current);
   *   if (payload.amount > 0) showGainAnimation(payload.amount);
   * });
   * ```
   */
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',

  // ============================================
  // LIFECYCLE EVENTS
  // ============================================

  /**
   * Fired when the game ends (Kobayashi Maru destroyed).
   * 
   * @emittedBy Not yet implemented - reserved for future use
   * @payload GameOverPayload
   * @timing After game state transitions to GAME_OVER
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.GAME_OVER, (payload) => {
   *   showGameOverScreen(payload.score);
   *   saveHighScore(payload.score);
   * });
   * ```
   */
  GAME_OVER = 'GAME_OVER',

  // ============================================
  // UI EVENTS
  // ============================================

  /**
   * Fired when combo count or multiplier changes.
   * 
   * @emittedBy ScoreManager.addKill() - on kill combo update
   * @emittedBy ScoreManager.resetCombo() - when combo timer expires
   * @payload ComboUpdatedPayload
   * @timing Immediate after combo state change
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.COMBO_UPDATED, (payload) => {
   *   updateComboDisplay(payload.comboCount, payload.multiplier);
   *   if (payload.isActive) showComboFlash();
   * });
   * ```
   */
  COMBO_UPDATED = 'COMBO_UPDATED',

  /**
   * Fired when a player unlocks an achievement.
   * 
   * @emittedBy AchievementManager.checkAchievements() - when conditions met
   * @payload AchievementUnlockedPayload
   * @timing After achievement is marked as unlocked
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.ACHIEVEMENT_UNLOCKED, (payload) => {
   *   showAchievementToast(payload.name, payload.description);
   *   playAchievementSound();
   * });
   * ```
   */
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',

  // ============================================
  // INPUT EVENTS
  // ============================================

  /**
   * Fired when a touch begins on the game canvas.
   * 
   * @emittedBy TouchInputManager.handleTouchStart()
   * @payload TouchEventPayload
   * @timing Immediate on touchstart event
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.TOUCH_START, (payload) => {
   *   startDragOperation(payload.x, payload.y);
   * });
   * ```
   */
  TOUCH_START = 'TOUCH_START',

  /**
   * Fired when a touch moves on the game canvas.
   * 
   * @emittedBy TouchInputManager.handleTouchMove()
   * @payload TouchEventPayload
   * @timing On touchmove event
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.TOUCH_MOVE, (payload) => {
   *   updateDragPosition(payload.x, payload.y);
   * });
   * ```
   */
  TOUCH_MOVE = 'TOUCH_MOVE',

  /**
   * Fired when a touch ends on the game canvas.
   * 
   * @emittedBy TouchInputManager.handleTouchEnd()
   * @payload TouchEventPayload
   * @timing Immediate on touchend event
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.TOUCH_END, (payload) => {
   *   completeDragOperation(payload.x, payload.y);
   * });
   * ```
   */
  TOUCH_END = 'TOUCH_END',

  /**
   * Fired when a gesture is recognized (pan, pinch, swipe, tap).
   * 
   * @emittedBy GestureManager - on gesture recognition
   * @payload GestureEvent
   * @timing After gesture is classified
   * 
   * @example
   * ```typescript
   * eventBus.on(GameEventType.GESTURE, (payload) => {
   *   if (payload.type === GestureType.PINCH) {
   *     adjustZoom(payload.scale);
   *   }
   * });
   * ```
   */
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
 * Payload for COMBO_UPDATED event
 */
export interface ComboUpdatedPayload {
  comboCount: number;
  multiplier: number;
  isActive: boolean;
}

/**
 * Payload for ACHIEVEMENT_UNLOCKED event
 */
export interface AchievementUnlockedPayload {
  achievementId: string;
  name: string;
  description: string;
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
  [GameEventType.COMBO_UPDATED]: ComboUpdatedPayload;
  [GameEventType.ACHIEVEMENT_UNLOCKED]: AchievementUnlockedPayload;
  [GameEventType.TOUCH_START]: TouchEventPayload;
  [GameEventType.TOUCH_MOVE]: TouchEventPayload;
  [GameEventType.TOUCH_END]: TouchEventPayload;
  [GameEventType.GESTURE]: GestureEvent;
}
