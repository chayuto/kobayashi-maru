/**
 * Turret Menu UI Component
 * Displays available turrets and allows selection
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { TURRET_CONFIG, TurretType } from '../types/constants';

export class TurretMenu {
    public container: Container;
    private buttons: Map<number, Container> = new Map();
    private onSelectCallback: ((turretType: number) => void) | null = null;
    private currentResources: number = 0;

    constructor() {
        this.container = new Container();
        this.createMenu();
    }

    /**
     * Create the menu UI elements
     */
    private createMenu(): void {
        const padding = UI_STYLES.PADDING;
        const buttonWidth = 240; // Increased to fit icon
        const buttonHeight = 75; // Reduced from 95 to fit all 6 weapons
        const startY = 0; // Buttons start at top of menu container

        // Create a button for each turret type
        Object.values(TurretType).forEach((type, index) => {
            // Skip if it's not a number (enum reverse mapping)
            if (typeof type !== 'number') return;

            const config = TURRET_CONFIG[type];
            const button = new Container();
            button.position.set(0, startY + (index * (buttonHeight + padding)));

            // Button background
            const bg = new Graphics();
            bg.roundRect(0, 0, buttonWidth, buttonHeight, 8);
            bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
            bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
            button.addChild(bg);

            // Turret icon/visual (simple geometric representation)
            const icon = this.createTurretIcon(type);
            icon.position.set(10, buttonHeight / 2);
            button.addChild(icon);

            // Turret Name
            const nameStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: 13, // Slightly smaller
                fill: UI_STYLES.COLORS.SECONDARY,
                fontWeight: 'bold'
            });
            const nameText = new Text({ text: config.name, style: nameStyle });
            nameText.position.set(48, 6);
            button.addChild(nameText);

            // Description
            const descStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: 10, // Smaller
                fill: 0xCCCCCC,
                wordWrap: true,
                wordWrapWidth: buttonWidth - 56
            });
            const descText = new Text({ text: config.description, style: descStyle });
            descText.position.set(48, 22);
            button.addChild(descText);

            // Stats (Damage/Range/Rate)
            const statsStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: 9,
                fill: 0x99CCFF
            });
            const statsText = new Text({
                text: `DMG:${config.damage} RNG:${config.range} RATE:${config.fireRate}/s`,
                style: statsStyle
            });
            statsText.position.set(48, 38);
            button.addChild(statsText);

            // Special ability (if exists)
            if (config.special) {
                const specialStyle = new TextStyle({
                    fontFamily: UI_STYLES.FONT_FAMILY,
                    fontSize: 9,
                    fill: UI_STYLES.COLORS.PRIMARY,
                    fontStyle: 'italic'
                });
                const specialText = new Text({ text: `• ${config.special}`, style: specialStyle });
                specialText.position.set(48, 50);
                button.addChild(specialText);
            }

            // Cost
            const costStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: 13,
                fill: UI_STYLES.COLORS.PRIMARY,
                fontWeight: 'bold'
            });
            const costText = new Text({ text: `${config.cost} M`, style: costStyle });
            costText.position.set(buttonWidth - 60, 6); // Top right
            button.addChild(costText);

            // Interactivity
            button.eventMode = 'static';
            button.cursor = 'pointer';

            button.on('pointerover', () => {
                if (this.currentResources >= config.cost) {
                    bg.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 3 });
                }
            });

            button.on('pointerout', () => {
                if (this.currentResources >= config.cost) {
                    bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
                }
            });

            button.on('pointerdown', () => {
                if (this.currentResources >= config.cost && this.onSelectCallback) {
                    this.onSelectCallback(type);
                }
            });

            this.container.addChild(button);
            this.buttons.set(type, button);
        });
    }

    /**
     * Create a simple icon representation for each turret type
     * @param turretType - Type of turret
     * @returns Container with turret icon
     */
    private createTurretIcon(turretType: number): Container {
        const icon = new Container();
        const graphics = new Graphics();

        // Use simple circles/rectangles for maximum compatibility
        // Different colors distinguish turret types
        switch (turretType) {
            case TurretType.PHASER_ARRAY:
                // Phaser: Yellow double circle (fast firing)
                graphics.circle(0, 0, 12);
                graphics.fill({ color: 0xFFCC00 });
                graphics.circle(0, 0, 6);
                graphics.fill({ color: 0xFFFFAA });
                break;
            case TurretType.TORPEDO_LAUNCHER:
                // Torpedo: Orange circle with center (long range)
                graphics.circle(0, 0, 12);
                graphics.fill({ color: 0xFF6600 });
                graphics.circle(0, 0, 4);
                graphics.fill({ color: 0xFFAA44 });
                break;
            case TurretType.DISRUPTOR_BANK:
                // Disruptor: Green circle (balanced)
                graphics.circle(0, 0, 12);
                graphics.fill({ color: 0x00FF00 });
                graphics.circle(0, 0, 8);
                graphics.fill({ color: 0x88FF88 });
                break;
            case TurretType.TETRYON_BEAM:
                // Tetryon: Cyan circle (shield damage)
                graphics.circle(0, 0, 12);
                graphics.fill({ color: 0x00CCFF });
                graphics.circle(0, 0, 6);
                graphics.fill({ color: 0x66EEFF });
                break;
            case TurretType.PLASMA_CANNON:
                // Plasma: Red/orange layered circles (burning)
                graphics.circle(0, 0, 12);
                graphics.fill({ color: 0xFF4400 });
                graphics.circle(-3, -3, 7);
                graphics.fill({ color: 0xFF8800 });
                graphics.circle(3, 2, 5);
                graphics.fill({ color: 0xFFCC00 });
                break;
            case TurretType.POLARON_BEAM:
                // Polaron: Purple circle (draining)
                graphics.circle(0, 0, 12);
                graphics.fill({ color: 0x9933FF });
                graphics.circle(0, 0, 7);
                graphics.fill({ color: 0xCC99FF });
                break;
            default:
                // Default: Simple circle
                graphics.circle(0, 0, 10);
                graphics.fill({ color: UI_STYLES.COLORS.SECONDARY });
        }

        icon.addChild(graphics);
        return icon;
    }

    /**
     * Update menu state based on available resources
     * @param resources - Current player resources
     */
    update(resources: number): void {
        this.currentResources = resources;

        this.buttons.forEach((button, type) => {
            const config = TURRET_CONFIG[type];
            const canAfford = resources >= config.cost;
            const bg = button.children[0] as Graphics;
            const icon = button.children[1] as Container; // Icon is now child 1
            const nameText = button.children[2] as Text;
            const descText = button.children[3] as Text;
            const statsText = button.children[4] as Text;
            // Child 5 or 6 is special text (if exists), last child is cost
            const costText = button.children[button.children.length - 1] as Text;

            if (canAfford) {
                bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
                nameText.style.fill = UI_STYLES.COLORS.SECONDARY;
                descText.style.fill = 0xCCCCCC;
                statsText.style.fill = 0x99CCFF;
                costText.style.fill = UI_STYLES.COLORS.PRIMARY;
                icon.alpha = 1;
                button.cursor = 'pointer';
                button.alpha = 1;
            } else {
                bg.stroke({ color: 0x666666, width: 2 });
                nameText.style.fill = 0x888888;
                descText.style.fill = 0x666666;
                statsText.style.fill = 0x666666;
                costText.style.fill = 0x888888;
                icon.alpha = 0.5;
                button.cursor = 'not-allowed';
                button.alpha = 0.7;
            }
        });
    }

    /**
     * Set callback for turret selection
     */
    onSelect(callback: (turretType: number) => void): void {
        this.onSelectCallback = callback;
    }

    /**
     * Set position of the menu
     */
    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.container.destroy({ children: true });
    }
}
