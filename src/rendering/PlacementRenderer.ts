/**
 * Placement Renderer for Kobayashi Maru
 * Handles all visual feedback for turret placement.
 * Subscribes to PlacementManager events to render ghost sprite and range circle.
 */
import { Application, Graphics, Container } from 'pixi.js';
import { GAME_CONFIG, TURRET_CONFIG, TurretType } from '../types/constants';
import { PlacementManager, PlacementEvent } from '../game/PlacementManager';

/**
 * Renders placement preview visuals (ghost sprite and range circle)
 */
export class PlacementRenderer {
  private app: Application;
  private placementManager: PlacementManager;
  private previewContainer: Container;
  private ghostSprite: Graphics;
  private rangeCircle: Graphics;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseClick: (e: MouseEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(app: Application, placementManager: PlacementManager) {
    this.app = app;
    this.placementManager = placementManager;

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

    // Subscribe to placement manager events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to PlacementManager events
   */
  private subscribeToEvents(): void {
    this.placementManager.on('start', this.handlePlacementStart.bind(this));
    this.placementManager.on('cancel', this.handlePlacementCancel.bind(this));
    this.placementManager.on('placed', this.handlePlacementPlaced.bind(this));
    this.placementManager.on('cursorMove', this.handleCursorMove.bind(this));
  }

  /**
   * Handle placement start event
   */
  private handlePlacementStart(event: PlacementEvent): void {
    this.previewContainer.visible = true;
    this.updateGhostAppearance(event.turretType!);
    this.addInputListeners();
  }

  /**
   * Handle placement cancel event
   */
  private handlePlacementCancel(): void {
    this.previewContainer.visible = false;
    this.removeInputListeners();
  }

  /**
   * Handle placement placed event
   */
  private handlePlacementPlaced(): void {
    this.previewContainer.visible = false;
    this.removeInputListeners();
  }

  /**
   * Handle cursor move event
   */
  private handleCursorMove(event: PlacementEvent): void {
    this.updatePreview(event.x!, event.y!, event.isValid!, event.turretType!);
  }

  /**
   * Add input event listeners to the canvas
   */
  private addInputListeners(): void {
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.addEventListener('mousemove', this.boundMouseMove);
      canvas.addEventListener('click', this.boundMouseClick);
      canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      canvas.addEventListener('touchend', this.boundTouchEnd);
    }
    document.addEventListener('keydown', this.boundKeyDown);
  }

  /**
   * Remove input event listeners from the canvas
   */
  private removeInputListeners(): void {
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.boundMouseMove);
      canvas.removeEventListener('click', this.boundMouseClick);
      canvas.removeEventListener('touchmove', this.boundTouchMove);
      canvas.removeEventListener('touchend', this.boundTouchEnd);
    }
    document.removeEventListener('keydown', this.boundKeyDown);
  }

  /**
   * Update the ghost sprite appearance based on turret type
   */
  /**
   * Update the ghost sprite appearance based on turret type
   */
  private updateGhostAppearance(turretType: number): void {
    const config = TURRET_CONFIG[turretType];

    // Clear and redraw ghost
    this.ghostSprite.clear();

    // Draw shape based on turret type
    switch (turretType) {
      case TurretType.PHASER_ARRAY:
        // Hexagon
        this.drawPolygon(this.ghostSprite, 6, 16);
        break;
      case TurretType.TORPEDO_LAUNCHER:
        // Octagon
        this.drawPolygon(this.ghostSprite, 8, 16);
        break;
      case TurretType.DISRUPTOR_BANK:
        // Pentagon (rotated)
        this.drawPolygon(this.ghostSprite, 5, 16, -Math.PI / 2);
        break;
      default:
        this.ghostSprite.circle(0, 0, 16);
    }

    this.ghostSprite.fill({ color: 0x33CC99, alpha: 0.5 });
    this.ghostSprite.stroke({ color: 0x33CC99, width: 2, alpha: 0.8 });

    // Clear and redraw range circle
    this.rangeCircle.clear();
    this.rangeCircle.circle(0, 0, config.range);
    this.rangeCircle.stroke({ color: 0x33CC99, width: 1, alpha: 0.3 });
  }

  /**
   * Helper to draw regular polygons
   */
  private drawPolygon(graphics: Graphics, sides: number, radius: number, rotation: number = 0): void {
    const points: number[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = rotation + (i * 2 * Math.PI) / sides;
      points.push(radius * Math.cos(angle), radius * Math.sin(angle));
    }
    graphics.poly(points);
  }

  /**
   * Update the preview position and validity visual
   */
  private updatePreview(x: number, y: number, isValid: boolean, turretType: number): void {
    this.previewContainer.position.set(x, y);

    // Update validity visual
    const validColor = 0x33CC99;  // Green
    const invalidColor = 0xDD4444; // Red
    const color = isValid ? validColor : invalidColor;
    const config = TURRET_CONFIG[turretType];

    // Update ghost
    this.ghostSprite.clear();

    // Draw shape based on turret type
    switch (turretType) {
      case TurretType.PHASER_ARRAY:
        this.drawPolygon(this.ghostSprite, 6, 16);
        break;
      case TurretType.TORPEDO_LAUNCHER:
        this.drawPolygon(this.ghostSprite, 8, 16);
        break;
      case TurretType.DISRUPTOR_BANK:
        this.drawPolygon(this.ghostSprite, 5, 16, -Math.PI / 2);
        break;
      default:
        this.ghostSprite.circle(0, 0, 16);
    }

    this.ghostSprite.fill({ color, alpha: 0.5 });
    this.ghostSprite.stroke({ color, width: 2, alpha: 0.8 });

    // Update range circle
    this.rangeCircle.clear();
    this.rangeCircle.circle(0, 0, config.range);
    this.rangeCircle.stroke({ color, width: 1, alpha: 0.3 });
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
    // Use displayed size (rect) instead of internal canvas dimensions
    // This properly handles CSS scaling and device pixel ratio
    const displayWidth = rect.width || 1;
    const displayHeight = rect.height || 1;
    const scaleX = GAME_CONFIG.WORLD_WIDTH / displayWidth;
    const scaleY = GAME_CONFIG.WORLD_HEIGHT / displayHeight;

    return {
      x: (screenX - rect.left) * scaleX,
      y: (screenY - rect.top) * scaleY
    };
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.placementManager.isPlacing()) {
      return;
    }
    const pos = this.screenToWorld(e.clientX, e.clientY);
    this.placementManager.updateCursorPosition(pos.x, pos.y);
  }

  /**
   * Handle mouse click events
   */
  private handleMouseClick(): void {
    if (!this.placementManager.isPlacing()) {
      return;
    }
    this.placementManager.confirmPlacement();
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!this.placementManager.isPlacing()) {
      return;
    }
    e.preventDefault(); // Prevent default browser behaviors like scrolling
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const pos = this.screenToWorld(touch.clientX, touch.clientY);
      // Offset Y by -64 (one cell size) to show turret above finger
      this.placementManager.updateCursorPosition(pos.x, pos.y - 64);
    }
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(): void {
    if (!this.placementManager.isPlacing()) {
      return;
    }
    this.placementManager.confirmPlacement();
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.placementManager.isPlacing()) {
      this.placementManager.cancelPlacement();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeInputListeners();
    this.previewContainer.destroy({ children: true });
  }
}
