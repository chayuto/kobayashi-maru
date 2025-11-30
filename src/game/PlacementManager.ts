/**
 * Placement Manager for Kobayashi Maru
 * Handles turret placement logic with mouse/touch input.
 * Note: This is a "Manager" not an ECS "System" because it handles
 * UI/input events and doesn't process entities in bulk.
 */
import { Application, Graphics, Container } from 'pixi.js';
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
 * Event types emitted by the placement system
 */
export type PlacementEventType = 'start' | 'cancel' | 'placed' | 'invalid';

export interface PlacementEvent {
  type: PlacementEventType;
  turretType?: number;
  x?: number;
  y?: number;
  reason?: string;
}

type PlacementListener = (event: PlacementEvent) => void;

/**
 * Manages turret placement with visual preview
 */
export class PlacementManager {
  private app: Application;
  private world: GameWorld;
  private resourceManager: ResourceManager;
  private state: PlacementState = PlacementState.IDLE;
  private currentTurretType: number = TurretType.PHASER_ARRAY;
  private previewContainer: Container;
  private ghostSprite: Graphics;
  private rangeCircle: Graphics;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private isValidPosition: boolean = false;
  private listeners: Map<PlacementEventType, PlacementListener[]>;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseClick: (e: MouseEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(app: Application, world: GameWorld, resourceManager: ResourceManager) {
    this.app = app;
    this.world = world;
    this.resourceManager = resourceManager;
    this.listeners = new Map();

    // Create preview container
    this.previewContainer = new Container();
    this.previewContainer.visible = false;
    this.app.stage.addChild(this.previewContainer);

    // Create ghost sprite (simple circle for now)
    this.ghostSprite = new Graphics();
    this.previewContainer.addChild(this.ghostSprite);

    // Create range circle
    this.rangeCircle = new Graphics();
    this.previewContainer.addChild(this.rangeCircle);

    // Bind event handlers
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseClick = this.handleMouseClick.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
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
    this.previewContainer.visible = true;

    // Update ghost appearance
    this.updateGhostAppearance();

    // Add event listeners
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.addEventListener('mousemove', this.boundMouseMove);
      canvas.addEventListener('click', this.boundMouseClick);
      canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      canvas.addEventListener('touchend', this.boundTouchEnd);
    }
    document.addEventListener('keydown', this.boundKeyDown);

    this.emit('start', { type: 'start', turretType });

    // Play select sound
    AudioManager.getInstance().play(SoundType.TURRET_SELECT, { volume: 0.5 });
  }

  /**
   * Confirm placement at current position
   * @returns Entity ID if placement was successful, -1 otherwise
   */
  confirmPlacement(): number {
    if (this.state !== PlacementState.PLACING) {
      return -1;
    }

    if (!this.isValidPosition) {
      this.emit('invalid', {
        type: 'invalid',
        turretType: this.currentTurretType,
        x: this.cursorX,
        y: this.cursorY,
        reason: 'Invalid placement position'
      });
      // Play error sound
      AudioManager.getInstance().play(SoundType.ERROR_BEEP, { volume: 0.5 });
      return -1;
    }

    const config = TURRET_CONFIG[this.currentTurretType];
    if (!this.resourceManager.canAfford(config.cost)) {
      this.emit('invalid', {
        type: 'invalid',
        turretType: this.currentTurretType,
        x: this.cursorX,
        y: this.cursorY,
        reason: 'Insufficient resources'
      });
      // Play error sound
      AudioManager.getInstance().play(SoundType.ERROR_BEEP, { volume: 0.5 });
      return -1;
    }

    // Deduct resources
    this.resourceManager.spendResources(config.cost);

    // Play placement sound
    AudioManager.getInstance().play(SoundType.TURRET_PLACE, { volume: 0.6 });

    // Create turret
    const eid = createTurret(this.world, this.cursorX, this.cursorY, this.currentTurretType);

    this.emit('placed', {
      type: 'placed',
      turretType: this.currentTurretType,
      x: this.cursorX,
      y: this.cursorY
    });

    // Exit placement mode
    this.cancelPlacement();

    return eid;
  }

  /**
   * Cancel placement mode
   */
  cancelPlacement(): void {
    if (this.state === PlacementState.IDLE) {
      return;
    }

    this.state = PlacementState.IDLE;
    this.previewContainer.visible = false;

    // Remove event listeners
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.boundMouseMove);
      canvas.removeEventListener('click', this.boundMouseClick);
      canvas.removeEventListener('touchmove', this.boundTouchMove);
      canvas.removeEventListener('touchend', this.boundTouchEnd);
    }
    document.removeEventListener('keydown', this.boundKeyDown);

    this.emit('cancel', { type: 'cancel', turretType: this.currentTurretType });
  }

  /**
   * Check if currently in placement mode
   */
  isPlacing(): boolean {
    return this.state === PlacementState.PLACING;
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
   * Update the ghost sprite appearance based on turret type
   */
  private updateGhostAppearance(): void {
    const config = TURRET_CONFIG[this.currentTurretType];

    // Clear and redraw ghost
    this.ghostSprite.clear();
    this.ghostSprite.circle(0, 0, 16);
    this.ghostSprite.fill({ color: 0x33CC99, alpha: 0.5 });
    this.ghostSprite.stroke({ color: 0x33CC99, width: 2, alpha: 0.8 });

    // Clear and redraw range circle
    this.rangeCircle.clear();
    this.rangeCircle.circle(0, 0, config.range);
    this.rangeCircle.stroke({ color: 0x33CC99, width: 1, alpha: 0.3 });
  }

  /**
   * Update the preview position and validity visual
   */
  private updatePreview(): void {
    this.previewContainer.position.set(this.cursorX, this.cursorY);

    // Update validity visual
    const validColor = 0x33CC99;  // Green
    const invalidColor = 0xDD4444; // Red
    const color = this.isValidPosition ? validColor : invalidColor;
    const config = TURRET_CONFIG[this.currentTurretType];

    // Update ghost
    this.ghostSprite.clear();
    this.ghostSprite.circle(0, 0, 16);
    this.ghostSprite.fill({ color, alpha: 0.5 });
    this.ghostSprite.stroke({ color, width: 2, alpha: 0.8 });

    // Update range circle
    this.rangeCircle.clear();
    this.rangeCircle.circle(0, 0, config.range);
    this.rangeCircle.stroke({ color, width: 1, alpha: 0.3 });
  }

  /**
   * Validate if position is valid for turret placement
   */
  private validatePosition(x: number, y: number): boolean {
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
   * Convert screen coordinates to world coordinates
   */
  private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const canvas = this.app.canvas;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    // Guard against division by zero
    const canvasWidth = canvas.width || 1;
    const canvasHeight = canvas.height || 1;
    const scaleX = GAME_CONFIG.WORLD_WIDTH / canvasWidth;
    const scaleY = GAME_CONFIG.WORLD_HEIGHT / canvasHeight;

    return {
      x: (screenX - rect.left) * scaleX,
      y: (screenY - rect.top) * scaleY
    };
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(e: MouseEvent): void {
    const pos = this.screenToWorld(e.clientX, e.clientY);
    this.cursorX = pos.x;
    this.cursorY = pos.y;
    this.isValidPosition = this.validatePosition(this.cursorX, this.cursorY);
    this.updatePreview();
  }

  /**
   * Handle mouse click events
   */
  private handleMouseClick(): void {
    this.confirmPlacement();
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault(); // Prevent default browser behaviors like scrolling
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const pos = this.screenToWorld(touch.clientX, touch.clientY);
      this.cursorX = pos.x;
      this.cursorY = pos.y;
      this.isValidPosition = this.validatePosition(this.cursorX, this.cursorY);
      this.updatePreview();
    }
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(): void {
    this.confirmPlacement();
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.cancelPlacement();
    }
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
    this.previewContainer.destroy({ children: true });
  }
}
