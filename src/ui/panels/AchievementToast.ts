/**
 * Achievement Toast Panel for Kobayashi Maru HUD
 * 
 * Displays a toast notification when an achievement is unlocked.
 * 
 * @module ui/panels/AchievementToast
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { EventBus } from '../../core/EventBus';
import { GameEventType, AchievementUnlockedPayload } from '../../types/events';

/**
 * AchievementToast displays achievement unlock notifications.
 */
export class AchievementToast {
    private container: Container;
    private background: Graphics;
    private titleText: Text;
    private descText: Text;
    private initialized: boolean = false;
    private eventBus: EventBus;
    private boundHandler: (payload: AchievementUnlockedPayload) => void;
    private animationTimer: number = 0;
    private isShowing: boolean = false;

    private static readonly WIDTH = 280;
    private static readonly HEIGHT = 70;
    private static readonly DISPLAY_TIME = 4.0; // seconds

    constructor() {
        this.container = new Container();
        this.background = new Graphics();
        this.eventBus = EventBus.getInstance();

        const titleStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold'
        });
        this.titleText = new Text({ text: '', style: titleStyle });

        const descStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.SECONDARY
        });
        this.descText = new Text({ text: '', style: descStyle });

        this.boundHandler = this.handleAchievementUnlocked.bind(this);
    }

    init(parent: Container): void {
        if (this.initialized) return;

        // Background
        this.drawBackground();
        this.container.addChild(this.background);

        // Trophy icon placeholder (text for now)
        const trophy = new Text({
            text: '🏆',
            style: new TextStyle({ fontSize: 32 })
        });
        trophy.position.set(15, 15);
        this.container.addChild(trophy);

        // Title
        this.titleText.position.set(60, 12);
        this.container.addChild(this.titleText);

        // Description
        this.descText.position.set(60, 38);
        this.container.addChild(this.descText);

        // Start hidden
        this.container.visible = false;
        this.container.alpha = 0;

        // Subscribe to events
        this.eventBus.on(GameEventType.ACHIEVEMENT_UNLOCKED, this.boundHandler);

        parent.addChild(this.container);
        this.initialized = true;
    }

    private drawBackground(): void {
        this.background.clear();
        this.background.roundRect(0, 0, AchievementToast.WIDTH, AchievementToast.HEIGHT, 10);
        this.background.fill({ color: 0x1a1a2e, alpha: 0.95 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 3 });
    }

    private handleAchievementUnlocked(payload: AchievementUnlockedPayload): void {
        this.show(payload.name, payload.description);
    }

    private show(name: string, description: string): void {
        this.titleText.text = `ACHIEVEMENT: ${name}`;
        this.descText.text = description;
        this.container.visible = true;
        this.container.alpha = 1;
        this.animationTimer = AchievementToast.DISPLAY_TIME;
        this.isShowing = true;
    }

    update(deltaTime: number): void {
        if (!this.isShowing) return;

        this.animationTimer -= deltaTime;

        // Fade out in last second
        if (this.animationTimer <= 1.0 && this.animationTimer > 0) {
            this.container.alpha = this.animationTimer;
        }

        if (this.animationTimer <= 0) {
            this.container.visible = false;
            this.isShowing = false;
        }
    }

    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    static getDimensions(): { width: number; height: number } {
        return { width: AchievementToast.WIDTH, height: AchievementToast.HEIGHT };
    }

    destroy(): void {
        this.eventBus.off(GameEventType.ACHIEVEMENT_UNLOCKED, this.boundHandler);
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
