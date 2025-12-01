import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';

export class MobileControlsOverlay {
    public container: Container;
    private buttons: Container[] = [];

    constructor() {
        this.container = new Container();
        this.createControls();
    }

    private createControls(): void {
        // Pause Button (Top Right, below resources)
        this.createButton('PAUSE', () => {
            // Simulate ESC key
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        // Restart Button (Top Right, below Pause)
        this.createButton('RESTART', () => {
            // Simulate R key
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
        });

        // Debug Button (Top Right, below Restart)
        this.createButton('DEBUG', () => {
            // Simulate Backtick key
            window.dispatchEvent(new KeyboardEvent('keydown', { key: '`' }));
        });
    }

    private createButton(label: string, onClick: () => void): void {
        const button = new Container();
        const width = 100;
        const height = 40;

        // Background
        const bg = new Graphics();
        bg.roundRect(0, 0, width, height, 8);
        bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
        bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
        button.addChild(bg);

        // Label
        const style = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.SECONDARY,
            fontWeight: 'bold',
            align: 'center'
        });
        const text = new Text({ text: label, style });
        text.anchor.set(0.5);
        text.position.set(width / 2, height / 2);
        button.addChild(text);

        // Interactivity
        button.eventMode = 'static';
        button.cursor = 'pointer';

        button.on('pointerdown', () => {
            bg.fill({ color: UI_STYLES.COLORS.SECONDARY, alpha: 0.5 });
            onClick();
        });

        button.on('pointerup', () => {
            bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
        });

        button.on('pointerupoutside', () => {
            bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
        });

        this.container.addChild(button);
        this.buttons.push(button);
    }

    /**
     * Update layout based on screen size
     */
    updateLayout(scale: number): void {
        const padding = UI_STYLES.PADDING * scale;
        const buttonWidth = 100 * scale;
        const spacing = 10 * scale;

        this.buttons.forEach((button, index) => {
            button.scale.set(scale);

            // Align them to the right of the wave panel (top-left panel).
            // Wave panel width is 200.
            const x = padding + (200 * scale) + padding + (index * (buttonWidth + spacing));
            const y = padding;

            button.position.set(x, y);
        });
    }

    destroy(): void {
        this.container.destroy({ children: true });
    }
}
