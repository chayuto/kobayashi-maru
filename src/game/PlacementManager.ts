/**
 * Placement Manager for Kobayashi Maru
 * Pure logic class for turret placement - no rendering dependencies.
 * Handles placement state, validation, and turret creation.
 */
import { GAME_CONFIG, TURRET_CONFIG, TurretType } from '../types/constants';
import { Position, Turret } from '../ecs/components';
import { createTurret } from '../ecs/entityFactory';
import { AudioManager, SoundType } from '../audio';
import { ResourceManager } from './resourceManager';
import type { GameWorld } from '../ecs/world';
import { defineQuery } from 'bitecs';

// Query for all turrets
const turretQuery = defineQuery([Position, Turret]);

/**
 * Placement state
 */
export enum PlacementState {
  IDLE = 'IDLE',
  PLACING = 'PLACING'
}

/**
 * Event types emitted by the placement manager
 */
export type PlacementEventType = 'start' | 'cancel' | 'placed' | 'invalid' | 'cursorMove';

export interface PlacementEvent {
  type: PlacementEventType;
  turretType?: number;
  x?: number;
  y?: number;
  isValid?: boolean;
  reason?: string;
}

type PlacementListener = (event: PlacementEvent) => void;

/**
 * Result of a placement attempt
 */
export interface PlacementResult {
  success: boolean;
  entityId: number;
  reason?: string;
}

/**
 * Manages turret placement logic (pure logic, no rendering)
 */
export class PlacementManager {
  private world: GameWorld;
  private resourceManager: ResourceManager;
  private state: PlacementState = PlacementState.IDLE;
  private currentTurretType: number = TurretType.PHASER_ARRAY;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private isValidPosition: boolean = false;
  private listeners: Map<PlacementEventType, PlacementListener[]>;

  constructor(world: GameWorld, resourceManager: ResourceManager) {
    this.world = world;
    this.resourceManager = resourceManager;
    this.listeners = new Map();
  }

  /**
   * Start placement mode for a turret type
   * @param turretType - Type of turret to place
   */
  startPlacing(turretType: number): void {
    if (this.state === PlacementState.PLACING) {
      this.cancelPlacement();
    }

    this.currentTurretType = turretType;
    this.state = PlacementState.PLACING;

    this.emit('start', { type: 'start', turretType });

    // Play select sound
    AudioManager.getInstance().play(SoundType.TURRET_SELECT, { volume: 0.5 });
  }

  /**
   * Update the cursor position during placement
   * @param x - World X coordinate
   * @param y - World Y coordinate
   */
  updateCursorPosition(x: number, y: number): void {
    if (this.state !== PlacementState.PLACING) {
      return;
    }

    this.cursorX = x;
    this.cursorY = y;
    this.isValidPosition = this.validatePosition(x, y);

    this.emit('cursorMove', {
      type: 'cursorMove',
      turretType: this.currentTurretType,
      x: this.cursorX,
      y: this.cursorY,
      isValid: this.isValidPosition
    });
  }

  /**
   * Validate if position is valid for turret placement
   * @param x - World X coordinate
   * @param y - World Y coordinate
   * @returns True if position is valid
   */
  validatePosition(x: number, y: number): boolean {
    // Check bounds (with margin)
    const margin = 32;
    if (x < margin || x > GAME_CONFIG.WORLD_WIDTH - margin ||
      y < margin || y > GAME_CONFIG.WORLD_HEIGHT - margin) {
      return false;
    }

    // Check minimum distance from other turrets
    const minDist = GAME_CONFIG.MIN_TURRET_DISTANCE;
    const turretEntities = turretQuery(this.world);

    for (const eid of turretEntities) {
      const dx = Position.x[eid] - x;
      const dy = Position.y[eid] - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDist * minDist) {
        return false;
      }
    }

    // Check if player can afford
    const config = TURRET_CONFIG[this.currentTurretType];
    if (!this.resourceManager.canAfford(config.cost)) {
      return false;
    }

    return true;
  }

  /**
   * Attempt to place a turret at specified position
   * @param x - World X coordinate
   * @param y - World Y coordinate
   * @returns PlacementResult indicating success/failure
   */
  placeTurret(x: number, y: number): PlacementResult {
    if (this.state !== PlacementState.PLACING) {
      return { success: false, entityId: -1, reason: 'Not in placement mode' };
    }

    if (!this.validatePosition(x, y)) {
      this.emit('invalid', {
        type: 'invalid',
        turretType: this.currentTurretType,
        x,
        y,
        reason: 'Invalid placement position'
      });
      // Play error sound
      AudioManager.getInstance().play(SoundType.ERROR_BEEP, { volume: 0.5 });
      return { success: false, entityId: -1, reason: 'Invalid placement position' };
    }

    const config = TURRET_CONFIG[this.currentTurretType];
    if (!this.resourceManager.canAfford(config.cost)) {
      this.emit('invalid', {
        type: 'invalid',
        turretType: this.currentTurretType,
        x,
        y,
        reason: 'Insufficient resources'
      });
      // Play error sound
      AudioManager.getInstance().play(SoundType.ERROR_BEEP, { volume: 0.5 });
      return { success: false, entityId: -1, reason: 'Insufficient resources' };
    }

    // Deduct resources
    this.resourceManager.spendResources(config.cost);

    // Play placement sound
    AudioManager.getInstance().play(SoundType.TURRET_PLACE, { volume: 0.6 });

    // Create turret
    const eid = createTurret(this.world, x, y, this.currentTurretType);

    this.emit('placed', {
      type: 'placed',
      turretType: this.currentTurretType,
      x,
      y
    });

    // Exit placement mode
    this.cancelPlacement();

    return { success: true, entityId: eid };
  }

  /**
   * Confirm placement at current cursor position
   * @returns Entity ID if placement was successful, -1 otherwise
   */
  confirmPlacement(): number {
    const result = this.placeTurret(this.cursorX, this.cursorY);
    return result.entityId;
  }

  /**
   * Cancel placement mode
   */
  cancelPlacement(): void {
    if (this.state === PlacementState.IDLE) {
      return;
    }

    const turretType = this.currentTurretType;
    this.state = PlacementState.IDLE;

    this.emit('cancel', { type: 'cancel', turretType });
  }

  /**
   * Check if currently in placement mode
   */
  isPlacing(): boolean {
    return this.state === PlacementState.PLACING;
  }

  /**
   * Get current placement state
   */
  getState(): PlacementState {
    return this.state;
  }

  /**
   * Get the currently selected turret type
   */
  getCurrentTurretType(): number {
    return this.currentTurretType;
  }

  /**
   * Get current cursor position
   */
  getCursorPosition(): { x: number; y: number } {
    return { x: this.cursorX, y: this.cursorY };
  }

  /**
   * Check if current position is valid
   */
  isCurrentPositionValid(): boolean {
    return this.isValidPosition;
  }

  /**
   * Get the turret configuration for the current type
   */
  getCurrentTurretConfig(): (typeof TURRET_CONFIG)[number] {
    return TURRET_CONFIG[this.currentTurretType];
  }

  /**
   * Register an event listener
   */
  on(eventType: PlacementEventType, listener: PlacementListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  /**
   * Remove an event listener
   */
  off(eventType: PlacementEventType, listener: PlacementListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit(eventType: PlacementEventType, event: PlacementEvent): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cancelPlacement();
    this.listeners.clear();
  }
}
