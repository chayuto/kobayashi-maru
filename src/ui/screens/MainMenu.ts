/**
 * Main Menu Screen for Kobayashi Maru
 * Displays title screen with start and sound toggle buttons
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { UI_CONFIG } from '../../config';
import { GAME_CONFIG } from '../../types/constants';
import { AudioManager } from '../../audio/AudioManager';

export class MainMenu {
  public container: Container;
  private visible: boolean = false;
  private app: Application | null = null;

  // Callbacks
  private onStartCallback: (() => void) | null = null;

  // UI Elements
  private overlay: Graphics | null = null;
  private titleText: Text | null = null;
  private subtitleText: Text | null = null;
  private startButton: Container | null = null;
  private soundButton: Container | null = null;
  private soundButtonText: Text | null = null;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = 999; // Below pause overlay (1000)
  }

  public init(app: Application): void {
    this.app = app;

    // Create semi-transparent overlay
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    this.overlay.fill({ color: 0x000000, alpha: 0.85 });
    this.container.addChild(this.overlay);

    // Create title
    const titleStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 72,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.titleText = new Text({ text: 'KOBAYASHI MARU', style: titleStyle });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(GAME_CONFIG.WORLD_WIDTH / 2, 300);
    this.container.addChild(this.titleText);

    // Create subtitle
    const subtitleStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 32,
      fill: UI_STYLES.COLORS.SECONDARY,
      fontWeight: 'bold'
    });
    this.subtitleText = new Text({ text: 'TACTICAL SIMULATION', style: subtitleStyle });
    this.subtitleText.anchor.set(0.5);
    this.subtitleText.position.set(GAME_CONFIG.WORLD_WIDTH / 2, 380);
    this.container.addChild(this.subtitleText);

    // Create start button
    this.startButton = this.createButton(
      'START SIMULATION',
      GAME_CONFIG.WORLD_WIDTH / 2,
      550,
      () => this.onStartCallback?.()
    );
    this.container.addChild(this.startButton);

    // Create sound toggle button
    const soundLabel = this.getSoundLabel();
    this.soundButton = this.createButton(
      soundLabel,
      GAME_CONFIG.WORLD_WIDTH / 2,
      650,
      () => this.handleSoundToggle()
    );
    this.container.addChild(this.soundButton);

    // Add to stage
    this.app.stage.addChild(this.container);
  }

  private getSoundLabel(): string {
    const isMuted = AudioManager.getInstance().isMuted();
    return `SOUND: ${isMuted ? 'OFF' : 'ON'}`;
  }

  private handleSoundToggle(): void {
    AudioManager.getInstance().toggleMute();
    this.updateSoundButtonText();
  }

  private updateSoundButtonText(): void {
    if (this.soundButtonText) {
      this.soundButtonText.text = this.getSoundLabel();
    }
  }

  private createButton(text: string, x: number, y: number, onClick: () => void): Container {
    const button = new Container();
    button.position.set(x, y);
    button.eventMode = 'static';
    button.cursor = 'pointer';

    // Button background
    const bg = new Graphics();
    bg.roundRect(-150, -30, 300, 60, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
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

    // Store reference to sound button text for updates
    if (text.startsWith('SOUND:')) {
      this.soundButtonText = buttonText;
    }

    // Hover effects
    button.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-150, -30, 300, 60, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
      bg.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: UI_CONFIG.PANEL_STYLE.HOVER_BORDER_WIDTH });
      buttonText.style.fill = UI_STYLES.COLORS.PRIMARY;
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-150, -30, 300, 60, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
      bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: UI_CONFIG.PANEL_STYLE.BORDER_WIDTH });
      buttonText.style.fill = UI_STYLES.COLORS.SECONDARY;
    });

    // Click handler
    button.on('pointerdown', () => {
      onClick();
    });

    return button;
  }

  public show(): void {
    this.visible = true;
    this.container.visible = true;
    // Update sound button text when showing (in case mute state changed)
    this.updateSoundButtonText();
  }

  public hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public setOnStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
