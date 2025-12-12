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
     * Create a turret icon showing the actual turret shape (base + barrel)
     * @param turretType - Type of turret
     * @returns Container with turret icon
     */
    private createTurretIcon(turretType: number): Container {
        const icon = new Container();
        const graphics = new Graphics();
        const size = 28; // Icon size
        const center = size / 2;
        const radius = size / 2 - 2;

        switch (turretType) {
            case TurretType.PHASER_ARRAY:
                // Phaser: Hexagon base with barrel
                this.drawPolygon(graphics, 6, center, center, radius, 0, 0x3366AA);
                graphics.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 });
                // Barrel
                graphics.rect(center - 2, 0, 4, center);
                graphics.fill({ color: 0xFFCC00 });
                // Cap
                graphics.circle(center, center, 4);
                graphics.fill({ color: 0xFFFFFF });
                break;

            case TurretType.TORPEDO_LAUNCHER:
                // Torpedo: Octagon base with dual barrels
                this.drawPolygon(graphics, 8, center, center, radius, 0, 0x444444);
                graphics.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 });
                // Dual barrels
                graphics.rect(center - 5, 0, 3, center);
                graphics.rect(center + 2, 0, 3, center);
                graphics.fill({ color: 0xFF6600 });
                // Cap
                graphics.circle(center, center, 3);
                graphics.fill({ color: 0xAAAAAA });
                break;

            case TurretType.DISRUPTOR_BANK:
                // Disruptor: Pentagon base with triangular barrel
                this.drawPolygon(graphics, 5, center, center, radius, -Math.PI / 2, 0x228822);
                graphics.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 });
                // Barrel (triangle)
                graphics.poly([
                    center, 2,
                    center - 4, center,
                    center + 4, center
                ]);
                graphics.fill({ color: 0x66FF66 });
                break;

            case TurretType.TETRYON_BEAM:
                // Tetryon: Diamond base with V-barrel
                graphics.poly([
                    center, 2,           // Top
                    size - 2, center,    // Right
                    center, size - 2,    // Bottom
                    2, center            // Left
                ]);
                graphics.fill({ color: 0x00AAAA });
                graphics.stroke({ color: 0x66FFFF, width: 1.5, alpha: 0.7 });
                // V-shaped emitters
                graphics.moveTo(center - 3, center);
                graphics.lineTo(center, 3);
                graphics.lineTo(center + 3, center);
                graphics.stroke({ color: 0x00FFFF, width: 2 });
                // Core
                graphics.circle(center, center, 3);
                graphics.fill({ color: 0x44DDDD });
                break;

            case TurretType.PLASMA_CANNON:
                // Plasma: 6-pointed star base with flame barrel
                this.drawStar(graphics, center, center, radius, radius / 2, 6, 0xCC4400);
                graphics.stroke({ color: 0xFF8800, width: 1, alpha: 0.8 });
                // Flame barrel
                graphics.poly([
                    center - 4, center,
                    center, 0,
                    center + 4, center
                ]);
                graphics.fill({ color: 0xFF4400 });
                // Flame tip
                graphics.circle(center, 3, 2);
                graphics.fill({ color: 0xFFAA00, alpha: 0.9 });
                // Core
                graphics.circle(center, center, 3);
                graphics.fill({ color: 0xAA3300 });
                break;

            case TurretType.POLARON_BEAM:
                // Polaron: Triangle base with beam emitter
                graphics.poly([
                    center, 2,                                    // Top
                    center + radius * 0.866, center + radius / 2, // Bottom right
                    center - radius * 0.866, center + radius / 2  // Bottom left
                ]);
                graphics.fill({ color: 0x6633AA });
                graphics.stroke({ color: 0xAA66FF, width: 1.5, alpha: 0.6 });
                // Emitter
                graphics.rect(center - 2, 0, 4, center - 2);
                graphics.fill({ color: 0x8844CC });
                // Energy rings
                graphics.circle(center, center, 4);
                graphics.stroke({ color: 0xAA66FF, width: 1.5, alpha: 0.7 });
                graphics.circle(center, center, 2);
                graphics.fill({ color: 0xCC88FF });
                break;

            default:
                // Default: Simple circle
                graphics.circle(center, center, radius);
                graphics.fill({ color: UI_STYLES.COLORS.SECONDARY });
        }

        icon.addChild(graphics);
        // Center the icon by offsetting for the container position
        graphics.position.set(-center, -center);
        return icon;
    }

    /**
     * Draw a regular polygon
     */
    private drawPolygon(
        graphics: Graphics,
        sides: number,
        cx: number,
        cy: number,
        radius: number,
        startAngle: number,
        fillColor: number
    ): void {
        const points: number[] = [];
        for (let i = 0; i < sides; i++) {
            const angle = startAngle + (i * 2 * Math.PI) / sides;
            points.push(cx + radius * Math.cos(angle));
            points.push(cy + radius * Math.sin(angle));
        }
        graphics.poly(points);
        graphics.fill({ color: fillColor });
    }

    /**
     * Draw a star shape
     */
    private drawStar(
        graphics: Graphics,
        cx: number,
        cy: number,
        outerRadius: number,
        innerRadius: number,
        points: number,
        fillColor: number
    ): void {
        const starPoints: number[] = [];
        for (let i = 0; i < points; i++) {
            const outerAngle = (i * Math.PI * 2) / points - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / points;
            starPoints.push(cx + outerRadius * Math.cos(outerAngle));
            starPoints.push(cy + outerRadius * Math.sin(outerAngle));
            starPoints.push(cx + innerRadius * Math.cos(innerAngle));
            starPoints.push(cy + innerRadius * Math.sin(innerAngle));
        }
        graphics.poly(starPoints);
        graphics.fill({ color: fillColor });
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
