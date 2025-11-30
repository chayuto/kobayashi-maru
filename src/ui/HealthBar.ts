/**
 * HealthBar Component for Kobayashi Maru HUD
 * Reusable component for displaying health/shield bars
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';

/**
 * HealthBar component for displaying health or shield values
 */
export class HealthBar {
  public container: Container;
  private background: Graphics;
  private fillBar: Graphics;
  private label: Text;
  private barWidth: number;
  private barHeight: number;
  private fillColor: number;
  private currentValue: number = 0;
  private maxValue: number = 100;

  constructor(
    width: number = UI_STYLES.BAR_WIDTH,
    height: number = UI_STYLES.BAR_HEIGHT,
    color: number = UI_STYLES.COLORS.HEALTH,
    labelText: string = ''
  ) {
    this.barWidth = width;
    this.barHeight = height;
    this.fillColor = color;

    // Create container
    this.container = new Container();

    // Create background bar
    this.background = new Graphics();
    this.drawBackground();
    this.container.addChild(this.background);

    // Create fill bar
    this.fillBar = new Graphics();
    this.container.addChild(this.fillBar);

    // Create label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.TEXT
    });
    this.label = new Text({ text: labelText, style: labelStyle });
    this.label.anchor.set(0, 0.5);
    this.label.position.set(4, this.barHeight / 2);
    this.container.addChild(this.label);

    // Initial draw
    this.drawFill();
  }

  /**
   * Draw the background bar
   */
  private drawBackground(): void {
    this.background.clear();
    this.background.roundRect(0, 0, this.barWidth, this.barHeight, 4);
    this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    this.background.stroke({ color: this.fillColor, width: 1, alpha: 0.5 });
  }

  /**
   * Draw the fill bar based on current/max values
   */
  private drawFill(): void {
    this.fillBar.clear();
    
    const percentage = this.maxValue > 0 ? this.currentValue / this.maxValue : 0;
    const fillWidth = Math.max(0, (this.barWidth - 4) * percentage);
    
    if (fillWidth > 0) {
      this.fillBar.roundRect(2, 2, fillWidth, this.barHeight - 4, 2);
      this.fillBar.fill({ color: this.fillColor, alpha: 0.8 });
    }
  }

  /**
   * Update the bar with new values
   * @param current - Current value
   * @param max - Maximum value
   */
  update(current: number, max: number): void {
    this.currentValue = current;
    this.maxValue = max;
    this.drawFill();
    this.updateLabel();
  }

  /**
   * Update the label text with current/max values
   */
  private updateLabel(): void {
    const current = Math.floor(this.currentValue);
    const max = Math.floor(this.maxValue);
    this.label.text = `${current}/${max}`;
  }

  /**
   * Set the bar position
   * @param x - X position
   * @param y - Y position
   */
  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  /**
   * Set the fill color (e.g., change to danger color when low)
   * @param color - New fill color
   */
  setColor(color: number): void {
    this.fillColor = color;
    this.drawBackground();
    this.drawFill();
  }

  /**
   * Show the health bar
   */
  show(): void {
    this.container.visible = true;
  }

  /**
   * Hide the health bar
   */
  hide(): void {
    this.container.visible = false;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
