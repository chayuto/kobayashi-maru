/**
 * Turret Upgrade Panel UI Component
 * Shows upgrade options and sell button for selected turrets
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { TURRET_CONFIG, UPGRADE_CONFIG, UpgradePath, TURRET_SPECIAL_UPGRADES } from '../types/constants';
import type { TurretUpgradeInfo } from '../game/UpgradeManager';

export class TurretUpgradePanel {
  public container: Container;
  private background: Graphics;
  private titleText: Text;
  private statsText: Text;
  private upgradeButtons: Map<number, Container> = new Map();
  private sellButton: Container | null = null;
  private onUpgradeCallback: ((upgradePath: number) => void) | null = null;
  private onSellCallback: (() => void) | null = null;

  constructor() {
    this.container = new Container();
    this.container.visible = false; // Hidden by default

    this.background = new Graphics();
    this.container.addChild(this.background);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 16,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.titleText = new Text({ text: 'TURRET UPGRADES', style: titleStyle });
    this.titleText.position.set(12, 8);
    this.container.addChild(this.titleText);

    // Stats display
    const statsStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 11,
      fill: UI_STYLES.COLORS.SECONDARY,
      wordWrap: true,
      wordWrapWidth: 280
    });
    this.statsText = new Text({ text: '', style: statsStyle });
    this.statsText.position.set(12, 32);
    this.container.addChild(this.statsText);

    this.createUpgradeButtons();
    this.createSellButton();
  }

  /**
   * Create upgrade path buttons
   */
  private createUpgradeButtons(): void {
    const buttonWidth = 280;
    const buttonHeight = 50;
    const startY = 100;
    const spacing = 8;

    const upgradePaths = [
      UpgradePath.DAMAGE,
      UpgradePath.RANGE,
      UpgradePath.FIRE_RATE,
      UpgradePath.MULTI_TARGET,
      UpgradePath.SPECIAL
    ];

    upgradePaths.forEach((path, index) => {
      const button = new Container();
      button.position.set(12, startY + index * (buttonHeight + spacing));

      // Button background
      const bg = new Graphics();
      bg.roundRect(0, 0, buttonWidth, buttonHeight, 6);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.8 });
      bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
      button.addChild(bg);

      const config = UPGRADE_CONFIG[path];

      // Upgrade name
      const nameStyle = new TextStyle({
        fontFamily: UI_STYLES.FONT_FAMILY,
        fontSize: 13,
        fill: UI_STYLES.COLORS.SECONDARY,
        fontWeight: 'bold'
      });
      const nameText = new Text({ text: config.name, style: nameStyle });
      nameText.position.set(8, 6);
      button.addChild(nameText);

      // Description
      const descStyle = new TextStyle({
        fontFamily: UI_STYLES.FONT_FAMILY,
        fontSize: 10,
        fill: 0xCCCCCC
      });
      const descText = new Text({ text: config.description, style: descStyle });
      descText.position.set(8, 22);
      button.addChild(descText);

      // Level indicator
      const levelStyle = new TextStyle({
        fontFamily: UI_STYLES.FONT_FAMILY,
        fontSize: 10,
        fill: UI_STYLES.COLORS.PRIMARY
      });
      const levelText = new Text({ text: 'Level: 0/3', style: levelStyle });
      levelText.position.set(8, 36);
      button.addChild(levelText);

      // Cost
      const costStyle = new TextStyle({
        fontFamily: UI_STYLES.FONT_FAMILY,
        fontSize: 12,
        fill: UI_STYLES.COLORS.PRIMARY,
        fontWeight: 'bold'
      });
      const costText = new Text({ text: '0 M', style: costStyle });
      costText.position.set(buttonWidth - 50, 6);
      button.addChild(costText);

      // Interactivity
      button.eventMode = 'static';
      button.cursor = 'pointer';

      button.on('pointerover', () => {
        if (button.alpha === 1) {
          bg.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 3 });
        }
      });

      button.on('pointerout', () => {
        if (button.alpha === 1) {
          bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
        }
      });

      button.on('pointerdown', () => {
        if (button.alpha === 1 && this.onUpgradeCallback) {
          this.onUpgradeCallback(path);
        }
      });

      this.container.addChild(button);
      this.upgradeButtons.set(path, button);
    });
  }

  /**
   * Create sell button
   */
  private createSellButton(): void {
    const buttonWidth = 280;
    const buttonHeight = 45;
    const yPos = 100 + 5 * (50 + 8) + 12; // Below upgrade buttons

    const button = new Container();
    button.position.set(12, yPos);

    // Button background (red-ish for sell)
    const bg = new Graphics();
    bg.roundRect(0, 0, buttonWidth, buttonHeight, 6);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
    bg.stroke({ color: UI_STYLES.COLORS.DANGER, width: 2 });
    button.addChild(bg);

    // Sell text
    const sellStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 14,
      fill: UI_STYLES.COLORS.DANGER,
      fontWeight: 'bold'
    });
    const sellText = new Text({ text: 'SELL TURRET', style: sellStyle });
    sellText.position.set(8, 8);
    button.addChild(sellText);

    // Refund amount
    const refundStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 11,
      fill: 0xCCCCCC
    });
    const refundText = new Text({ text: 'Refund: 0 M', style: refundStyle });
    refundText.position.set(8, 26);
    button.addChild(refundText);

    // Interactivity
    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      bg.stroke({ color: 0xFF6666, width: 3 });
    });

    button.on('pointerout', () => {
      bg.stroke({ color: UI_STYLES.COLORS.DANGER, width: 2 });
    });

    button.on('pointerdown', () => {
      if (this.onSellCallback) {
        this.onSellCallback();
      }
    });

    this.container.addChild(button);
    this.sellButton = button;
  }

  /**
   * Show the panel with turret information
   * @param info - Turret upgrade information
   * @param currentResources - Player's current resources
   * @param refundAmount - Amount that would be refunded if sold
   */
  show(info: TurretUpgradeInfo, currentResources: number, refundAmount: number): void {

    // Update title with turret type
    const config = TURRET_CONFIG[info.turretType];
    this.titleText.text = config.name.toUpperCase();

    // Update stats
    const stats = info.currentStats;
    this.statsText.text = 
      `DMG: ${stats.damage.toFixed(1)} | RNG: ${stats.range.toFixed(0)} | ` +
      `RATE: ${stats.fireRate.toFixed(1)}/s | TARGETS: ${stats.maxTargets}`;

    // Update upgrade buttons
    this.updateUpgradeButtons(info, currentResources);

    // Update sell button
    this.updateSellButton(refundAmount);

    // Draw background based on content
    this.updateBackground();

    this.container.visible = true;
  }

  /**
   * Hide the panel
   */
  hide(): void {
    this.container.visible = false;
  }

  /**
   * Update upgrade buttons based on current state
   */
  private updateUpgradeButtons(info: TurretUpgradeInfo, currentResources: number): void {
    const upgradePaths = [
      { path: UpgradePath.DAMAGE, level: info.upgrades.damage },
      { path: UpgradePath.RANGE, level: info.upgrades.range },
      { path: UpgradePath.FIRE_RATE, level: info.upgrades.fireRate },
      { path: UpgradePath.MULTI_TARGET, level: info.upgrades.multiTarget },
      { path: UpgradePath.SPECIAL, level: info.upgrades.special }
    ];

    upgradePaths.forEach(({ path, level }) => {
      const button = this.upgradeButtons.get(path);
      if (!button) return;

      const config = UPGRADE_CONFIG[path];
      const maxLevel = config.maxLevel;
      const isMaxLevel = level >= maxLevel;
      
      // Get cost for next level
      const cost = isMaxLevel ? 0 : config.costs[level];
      const canAfford = currentResources >= cost;

      // Update level text (child 3)
      const levelText = button.children[3] as Text;
      levelText.text = `Level: ${level}/${maxLevel}`;

      // Update cost text (child 4)
      const costText = button.children[4] as Text;
      if (isMaxLevel) {
        costText.text = 'MAX';
        costText.style.fill = 0x00FF00;
      } else {
        costText.text = `${cost} M`;
        costText.style.fill = canAfford ? UI_STYLES.COLORS.PRIMARY : 0x888888;
      }

      // Update description for special upgrades
      if (path === UpgradePath.SPECIAL && level < maxLevel) {
        const descText = button.children[2] as Text;
        const specialConfig = TURRET_SPECIAL_UPGRADES[info.turretType];
        if (specialConfig) {
          descText.text = specialConfig.levels[level] || config.description;
        }
      }

      // Update button state
      const bg = button.children[0] as Graphics;
      const nameText = button.children[1] as Text;
      const descText = button.children[2] as Text;

      if (isMaxLevel) {
        button.alpha = 0.6;
        button.cursor = 'not-allowed';
        bg.stroke({ color: 0x00FF00, width: 2 });
        nameText.style.fill = 0x00FF00;
      } else if (!canAfford) {
        button.alpha = 0.7;
        button.cursor = 'not-allowed';
        bg.stroke({ color: 0x666666, width: 2 });
        nameText.style.fill = 0x888888;
        descText.style.fill = 0x666666;
      } else {
        button.alpha = 1;
        button.cursor = 'pointer';
        bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
        nameText.style.fill = UI_STYLES.COLORS.SECONDARY;
        descText.style.fill = 0xCCCCCC;
      }
    });
  }

  /**
   * Update sell button with refund amount
   */
  private updateSellButton(refundAmount: number): void {
    if (!this.sellButton) return;

    const refundText = this.sellButton.children[2] as Text;
    refundText.text = `Refund: ${refundAmount} M (75%)`;
  }

  /**
   * Update background size
   */
  private updateBackground(): void {
    const width = 304;
    const height = 480;

    this.background.clear();
    this.background.roundRect(0, 0, width, height, 12);
    this.background.fill({ color: 0x000000, alpha: 0.85 });
    this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 3 });
  }

  /**
   * Set callback for upgrade button clicks
   */
  onUpgrade(callback: (upgradePath: number) => void): void {
    this.onUpgradeCallback = callback;
  }

  /**
   * Set callback for sell button click
   */
  onSell(callback: () => void): void {
    this.onSellCallback = callback;
  }

  /**
   * Set position of the panel
   */
  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  /**
   * Check if panel is visible
   */
  isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
