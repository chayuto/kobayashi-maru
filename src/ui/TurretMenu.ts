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
        const buttonWidth = 180;
        const buttonHeight = 60;
        const startY = 100; // Below resource display

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
                fontSize: UI_STYLES.FONT_SIZE_SMALL,
                fill: UI_STYLES.COLORS.SECONDARY,
                fontWeight: 'bold'
            });
            const nameText = new Text({ text: config.name, style: nameStyle });
            nameText.position.set(10, 10);
            button.addChild(nameText);

            // Cost
            const costStyle = new TextStyle({
                fontFamily: UI_STYLES.FONT_FAMILY,
                fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
                fill: UI_STYLES.COLORS.PRIMARY
            });
            const costText = new Text({ text: `${config.cost} M`, style: costStyle });
            costText.position.set(10, 30);
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
            const costText = button.children[2] as Text;

            if (canAfford) {
                bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
                nameText.style.fill = UI_STYLES.COLORS.SECONDARY;
                costText.style.fill = UI_STYLES.COLORS.PRIMARY;
                button.cursor = 'pointer';
                button.alpha = 1;
            } else {
                bg.stroke({ color: 0x666666, width: 2 });
                nameText.style.fill = 0x888888;
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
