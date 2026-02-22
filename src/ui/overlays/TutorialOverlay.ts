/**
 * Tutorial Overlay for Kobayashi Maru
 *
 * Displays tutorial messages as an LCARS-styled panel overlay.
 * Subscribes to TUTORIAL_STEP and TUTORIAL_COMPLETE events via EventBus.
 * Uses FADE_IN -> HOLD -> FADE_OUT animation state machine
 * consistent with WaveAnnouncement and AlertStatusOverlay.
 *
 * @module ui/overlays/TutorialOverlay
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EventBus } from '../../core/EventBus';
import {
  GameEventType,
  TutorialStepPayload,
  TutorialStep,
  TutorialStepPosition,
} from '../../types/events';
import { GAME_CONFIG } from '../../types/constants';
import { UI_CONFIG } from '../../config/ui.config';
import { UI_STYLES } from '../styles';

enum AnimationPhase {
  IDLE = 'IDLE',
  FADE_IN = 'FADE_IN',
  HOLD = 'HOLD',
  FADE_OUT = 'FADE_OUT',
}

/**
 * TutorialOverlay displays tutorial messages as styled panels.
 */
export class TutorialOverlay {
  public container: Container;
  private panelContainer: Container;
  private background: Graphics;
  private border: Graphics;
  private messageText: Text;
  private skipText: Text;
  private phase: AnimationPhase = AnimationPhase.IDLE;
  private elapsedTime: number = 0;
  private holdDuration: number = 0;
  private eventBus: EventBus;
  private boundStepHandler: (payload: TutorialStepPayload) => void;
  private boundCompleteHandler: () => void;
  private onSkipCallback: (() => void) | null = null;
  private config = UI_CONFIG.TUTORIAL;

  constructor() {
    this.container = new Container();
    this.container.zIndex = this.config.Z_INDEX;
    this.eventBus = EventBus.getInstance();

    // Panel container holds background, border, text
    this.panelContainer = new Container();

    // Background
    this.background = new Graphics();

    // Border
    this.border = new Graphics();

    // Message text
    const messageStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.TEXT,
      wordWrap: true,
      wordWrapWidth: this.config.PANEL_WIDTH - this.config.PANEL_PADDING * 2,
      lineHeight: 26,
    });
    this.messageText = new Text({ text: '', style: messageStyle });

    // Skip tutorial text
    const skipStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.SECONDARY,
    });
    this.skipText = new Text({ text: 'SKIP TUTORIAL', style: skipStyle });

    this.boundStepHandler = this.handleTutorialStep.bind(this);
    this.boundCompleteHandler = this.handleTutorialComplete.bind(this);
  }

  /**
   * Initialize the overlay and add it to the parent container.
   */
  init(parent: Container): void {
    // Assemble panel
    this.panelContainer.addChild(this.background);
    this.panelContainer.addChild(this.border);

    // Position message text with padding
    this.messageText.position.set(
      this.config.PANEL_PADDING,
      this.config.PANEL_PADDING
    );
    this.panelContainer.addChild(this.messageText);

    // Skip text - interactive
    this.skipText.eventMode = 'static';
    this.skipText.cursor = 'pointer';
    this.skipText.on('pointerdown', () => {
      this.onSkipCallback?.();
    });
    this.panelContainer.addChild(this.skipText);

    this.container.addChild(this.panelContainer);

    // Start hidden
    this.container.visible = false;
    this.container.alpha = 0;

    // Subscribe to events
    this.eventBus.on(GameEventType.TUTORIAL_STEP, this.boundStepHandler);
    this.eventBus.on(
      GameEventType.TUTORIAL_COMPLETE,
      this.boundCompleteHandler
    );

    parent.addChild(this.container);
  }

  /**
   * Set callback for skip tutorial action.
   */
  setOnSkip(callback: () => void): void {
    this.onSkipCallback = callback;
  }

  /**
   * Handle tutorial step event.
   */
  private handleTutorialStep(payload: TutorialStepPayload): void {
    this.showStep(payload.step);
  }

  /**
   * Handle tutorial complete event.
   */
  private handleTutorialComplete(): void {
    this.hide();
  }

  /**
   * Show a tutorial step.
   */
  showStep(step: TutorialStep): void {
    // Update message text
    this.messageText.text = step.message;

    // Calculate panel height based on text
    const textHeight = this.messageText.height;
    const skipHeight = 20;
    const panelHeight =
      this.config.PANEL_PADDING * 2 +
      textHeight +
      this.config.PANEL_PADDING +
      skipHeight;

    // Redraw background
    this.background.clear();
    this.background.roundRect(
      0,
      0,
      this.config.PANEL_WIDTH,
      panelHeight,
      this.config.PANEL_CORNER_RADIUS
    );
    this.background.fill({
      color: UI_STYLES.COLORS.BACKGROUND,
      alpha: this.config.PANEL_BACKGROUND_ALPHA,
    });

    // Redraw border
    this.border.clear();
    this.border.roundRect(
      0,
      0,
      this.config.PANEL_WIDTH,
      panelHeight,
      this.config.PANEL_CORNER_RADIUS
    );
    this.border.stroke({
      color: UI_STYLES.COLORS.PRIMARY,
      width: this.config.PANEL_BORDER_WIDTH,
    });

    // Position skip text at bottom-right of panel
    this.skipText.position.set(
      this.config.PANEL_WIDTH -
        this.config.PANEL_PADDING -
        this.skipText.width,
      panelHeight - this.config.PANEL_PADDING - skipHeight + 4
    );

    // Position panel based on step position
    const panelX =
      (GAME_CONFIG.WORLD_WIDTH - this.config.PANEL_WIDTH) / 2;
    const panelY = this.getYPosition(step.position, panelHeight);
    this.panelContainer.position.set(panelX, panelY);

    // Set hold duration from step
    this.holdDuration = step.duration;

    // Start fade in
    this.container.visible = true;
    this.container.alpha = 0;
    this.phase = AnimationPhase.FADE_IN;
    this.elapsedTime = 0;
  }

  /**
   * Calculate Y position based on position type.
   */
  private getYPosition(
    position: TutorialStepPosition,
    panelHeight: number
  ): number {
    switch (position) {
      case 'top':
        return this.config.POSITION_TOP_Y;
      case 'center':
        return this.config.POSITION_CENTER_Y - panelHeight / 2;
      case 'bottom':
        return this.config.POSITION_BOTTOM_Y - panelHeight;
      default:
        return this.config.POSITION_CENTER_Y - panelHeight / 2;
    }
  }

  /**
   * Hide current message with fade.
   */
  hide(): void {
    if (this.phase === AnimationPhase.IDLE) {
      this.container.visible = false;
      return;
    }

    this.phase = AnimationPhase.FADE_OUT;
    this.elapsedTime = 0;
  }

  /**
   * Update animation (fade in/out).
   * @param deltaTime - Time since last frame in seconds
   */
  update(deltaTime: number = 0): void {
    if (this.phase === AnimationPhase.IDLE) return;

    this.elapsedTime += deltaTime;

    switch (this.phase) {
      case AnimationPhase.FADE_IN: {
        const t = Math.min(this.elapsedTime / this.config.FADE_IN_DURATION, 1);
        this.container.alpha = t;
        if (t >= 1) {
          this.phase = AnimationPhase.HOLD;
          this.elapsedTime = 0;
        }
        break;
      }
      case AnimationPhase.HOLD: {
        if (this.elapsedTime >= this.holdDuration) {
          this.phase = AnimationPhase.FADE_OUT;
          this.elapsedTime = 0;
        }
        break;
      }
      case AnimationPhase.FADE_OUT: {
        const t = Math.min(this.elapsedTime / this.config.FADE_OUT_DURATION, 1);
        this.container.alpha = 1 - t;
        if (t >= 1) {
          this.container.visible = false;
          this.phase = AnimationPhase.IDLE;
        }
        break;
      }
    }
  }

  /**
   * Check if currently showing a message.
   */
  isShowing(): boolean {
    return this.phase !== AnimationPhase.IDLE;
  }

  /**
   * Get current animation phase (for testing).
   */
  getPhase(): string {
    return this.phase;
  }

  /**
   * Reset to idle state.
   */
  reset(): void {
    this.phase = AnimationPhase.IDLE;
    this.container.visible = false;
    this.container.alpha = 0;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.eventBus.off(GameEventType.TUTORIAL_STEP, this.boundStepHandler);
    this.eventBus.off(
      GameEventType.TUTORIAL_COMPLETE,
      this.boundCompleteHandler
    );
    this.container.destroy({ children: true });
  }
}
