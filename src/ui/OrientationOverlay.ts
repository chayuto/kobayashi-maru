import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';

export class OrientationOverlay {
    public container: Container;
    private background: Graphics;
    private message: Text;
    private icon: Graphics;

    constructor() {
        this.container = new Container();
        this.container.visible = false; // Hidden by default
        this.container.zIndex = 9999; // Ensure it's on top

        // Full screen background
        this.background = new Graphics();
        this.container.addChild(this.background);

        // Icon (Phone rotation)
        this.icon = new Graphics();
        this.container.addChild(this.icon);

        // Message
        const style = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: 24,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 300
        });
        this.message = new Text({ text: 'PLEASE ROTATE DEVICE', style });
        this.message.anchor.set(0.5);
        this.container.addChild(this.message);
    }

    updateLayout(width: number, height: number): void {
        // Update background
        this.background.clear();
        this.background.rect(0, 0, width, height);
        this.background.fill({ color: 0x000000, alpha: 0.9 });

        // Update message position
        this.message.position.set(width / 2, height / 2 + 60);

        // Draw icon
        this.icon.clear();
        this.icon.position.set(width / 2, height / 2 - 40);

        // Draw phone outline
        this.icon.roundRect(-30, -50, 60, 100, 8);
        this.icon.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 4 });

        // Draw arrow indicating rotation
        this.icon.arc(0, 0, 70, 0, Math.PI / 2);
        this.icon.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 4 });

        // Arrow head
        this.icon.moveTo(0, 70);
        this.icon.lineTo(-10, 60);
        this.icon.lineTo(10, 60);
        this.icon.fill({ color: UI_STYLES.COLORS.PRIMARY });
    }

    show(): void {
        this.container.visible = true;
    }

    hide(): void {
        this.container.visible = false;
    }

    destroy(): void {
        this.container.destroy({ children: true });
    }
}
