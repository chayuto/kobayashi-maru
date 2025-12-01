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
        const buttonWidth = 240; // Increased width for more content
        const buttonHeight = 95; // Increased height for description
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

            // Turret Name
            const nameStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
                fill: UI_STYLES.COLORS.SECONDARY,
                fontWeight: 'bold'
            });
            const nameText = new Text({ text: config.name, style: nameStyle });
            nameText.position.set(10, 8);
            button.addChild(nameText);

            // Description
            const descStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: 11,
                fill: 0xCCCCCC,
                wordWrap: true,
                wordWrapWidth: buttonWidth - 20
            });
            const descText = new Text({ text: config.description, style: descStyle });
            descText.position.set(10, 28);
            button.addChild(descText);

            // Stats (Damage/Range/Rate)
            const statsStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: 10,
                fill: 0x99CCFF
            });
            const statsText = new Text({
                text: `DMG:${config.damage} RNG:${config.range} RATE:${config.fireRate}/s`,
                style: statsStyle
            });
            statsText.position.set(10, 46);
            button.addChild(statsText);

            // Special ability (if exists)
            if (config.special) {
                const specialStyle = new TextStyle({
                    fontFamily: UI_STYLES.FONT_FAMILY,
                    fontSize: 10,
                    fill: UI_STYLES.COLORS.PRIMARY,
                    fontStyle: 'italic'
                });
                const specialText = new Text({ text: `• ${config.special}`, style: specialStyle });
                specialText.position.set(10, 60);
                button.addChild(specialText);
            }

            // Cost
            const costStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
                fill: UI_STYLES.COLORS.PRIMARY,
                fontWeight: 'bold'
            });
            const costText = new Text({ text: `${config.cost} M`, style: costStyle });
            costText.position.set(buttonWidth - 60, 8); // Top right
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
     * Update menu state based on available resources
     * @param resources - Current player resources
     */
    update(resources: number): void {
        this.currentResources = resources;

        this.buttons.forEach((button, type) => {
            const config = TURRET_CONFIG[type];
            const canAfford = resources >= config.cost;
            const bg = button.children[0] as Graphics;
            const nameText = button.children[1] as Text;
            const descText = button.children[2] as Text;
            const statsText = button.children[3] as Text;
            // Child 4 or 5 is special text (if exists), child 5 or 6 is cost
            const costText = button.children[button.children.length - 1] as Text;

            if (canAfford) {
                bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
                nameText.style.fill = UI_STYLES.COLORS.SECONDARY;
                descText.style.fill = 0xCCCCCC;
                statsText.style.fill = 0x99CCFF;
                costText.style.fill = UI_STYLES.COLORS.PRIMARY;
                button.cursor = 'pointer';
                button.alpha = 1;
            } else {
                bg.stroke({ color: 0x666666, width: 2 });
                nameText.style.fill = 0x888888;
                descText.style.fill = 0x666666;
                statsText.style.fill = 0x666666;
                costText.style.fill = 0x888888;
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
