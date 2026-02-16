/**
 * Pause Overlay UI
 * Displays when game is paused with resume/restart/quit options
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { UI_CONFIG } from '../config';
import { GAME_CONFIG } from '../types/constants';

export class PauseOverlay {
  public container: Container;
  private visible: boolean = false;
  private app: Application | null = null;

  // Callbacks
  private onResumeCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onQuitCallback: (() => void) | null = null;

  // UI Elements
  private overlay: Graphics | null = null;
  private titleText: Text | null = null;
  private resumeButton: Container | null = null;
  private restartButton: Container | null = null;
  private quitButton: Container | null = null;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = UI_CONFIG.PAUSE_OVERLAY.Z_INDEX;
  }

  public init(app: Application): void {
    this.app = app;

    const pauseCfg = UI_CONFIG.PAUSE_OVERLAY;

    // Create semi-transparent overlay
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    this.overlay.fill({ color: 0x000000, alpha: pauseCfg.BACKGROUND_ALPHA });
    this.container.addChild(this.overlay);

    // Create title
    const titleStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_CONFIG.FONTS.SIZE_TITLE,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.titleText = new Text({ text: 'PAUSED', style: titleStyle });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(GAME_CONFIG.WORLD_WIDTH / 2, pauseCfg.TITLE_Y);
    this.container.addChild(this.titleText);

    // Create buttons
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    this.resumeButton = this.createButton('RESUME (ESC)', centerX, pauseCfg.FIRST_BUTTON_Y, 'resume');
    this.restartButton = this.createButton('RESTART (R)', centerX, pauseCfg.FIRST_BUTTON_Y + pauseCfg.BUTTON_SPACING, 'restart');
    this.quitButton = this.createButton('QUIT (Q)', centerX, pauseCfg.FIRST_BUTTON_Y + pauseCfg.BUTTON_SPACING * 2, 'quit');

    this.container.addChild(this.resumeButton);
    this.container.addChild(this.restartButton);
    this.container.addChild(this.quitButton);

    // Add to stage
    this.app.stage.addChild(this.container);
  }

  private createButton(text: string, x: number, y: number, action: 'resume' | 'restart' | 'quit'): Container {
    const button = new Container();
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const { BUTTON_WIDTH: bw, BUTTON_HEIGHT: bh, BUTTON_ALPHA: bAlpha } = UI_CONFIG.PAUSE_OVERLAY;
    const halfW = bw / 2;
    const halfH = bh / 2;

    // Button background
    const bg = new Graphics();
    bg.roundRect(-halfW, -halfH, bw, bh, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: bAlpha });
    bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: UI_CONFIG.PANEL_STYLE.BORDER_WIDTH });
    button.addChild(bg);

    // Button text
    const textStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.SECONDARY,
      fontWeight: 'bold'
    });
    const buttonText = new Text({ text, style: textStyle });
    buttonText.anchor.set(0.5);
    button.addChild(buttonText);

    // Hover effects
    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-halfW, -halfH, bw, bh, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: bAlpha });
      bg.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: UI_CONFIG.PANEL_STYLE.HOVER_BORDER_WIDTH });
      buttonText.style.fill = UI_STYLES.COLORS.PRIMARY;
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-halfW, -halfH, bw, bh, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: bAlpha });
      bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: UI_CONFIG.PANEL_STYLE.BORDER_WIDTH });
      buttonText.style.fill = UI_STYLES.COLORS.SECONDARY;
    });

    // Click handlers based on action type
    button.on('pointerdown', () => {
      if (action === 'resume') {
        this.onResumeCallback?.();
      } else if (action === 'restart') {
        this.onRestartCallback?.();
      } else if (action === 'quit') {
        this.onQuitCallback?.();
      }
    });

    return button;
  }

  public show(): void {
    this.visible = true;
    this.container.visible = true;
  }

  public hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setOnResume(callback: () => void): void {
    this.onResumeCallback = callback;
  }

  public setOnRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  public setOnQuit(callback: () => void): void {
    this.onQuitCallback = callback;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
