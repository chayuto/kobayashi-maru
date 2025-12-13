/**
 * AI Panel Component for Kobayashi Maru HUD
 *
 * Displays AI commander status, mood, and current thinking.
 * Makes the AI feel like a character with personality.
 *
 * @module ui/panels/AIPanel
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { AIMood, AIPhase, AIPersonality, AIStatusExtended } from '../../ai/types';

/**
 * Mood emojis for display
 */
const MOOD_EMOJIS: Record<AIMood, string> = {
    [AIMood.CONFIDENT]: '😊',
    [AIMood.CALM]: '😌',
    [AIMood.FOCUSED]: '😤',
    [AIMood.STRESSED]: '😰',
    [AIMood.DETERMINED]: '🔥',
    [AIMood.DESPERATE]: '😱',
};

/**
 * Mood colors for visual feedback
 */
const MOOD_COLORS: Record<AIMood, number> = {
    [AIMood.CONFIDENT]: 0x00FF88,  // Green
    [AIMood.CALM]: 0x66DDFF,       // Blue
    [AIMood.FOCUSED]: 0xFFAA00,    // Orange
    [AIMood.STRESSED]: 0xFF6644,   // Red-orange
    [AIMood.DETERMINED]: 0xFF4488, // Pink
    [AIMood.DESPERATE]: 0xFF0044,  // Red
};

/**
 * Personality short names
 */
const PERSONALITY_SHORT: Record<AIPersonality, string> = {
    [AIPersonality.AGGRESSIVE]: 'AGG',
    [AIPersonality.DEFENSIVE]: 'DEF',
    [AIPersonality.ECONOMIC]: 'ECO',
    [AIPersonality.BALANCED]: 'BAL',
    [AIPersonality.ADAPTIVE]: 'ADP',
};

/**
 * Phase display names
 */
const PHASE_NAMES: Record<AIPhase, string> = {
    [AIPhase.EARLY_EXPANSION]: 'EXPANSION',
    [AIPhase.DEFENSIVE_SETUP]: 'DEFENSE',
    [AIPhase.POWER_SCALING]: 'SCALING',
    [AIPhase.BOSS_PREPARATION]: 'BOSS PREP',
    [AIPhase.SURVIVAL_MODE]: 'SURVIVAL',
};

export class AIPanel {
    private container: Container;
    private background: Graphics;
    private titleText: Text;
    private moodText: Text;
    private thoughtText: Text;
    private phaseText: Text;
    private threatBar: Graphics;
    private coverageBar: Graphics;
    private statsText: Text;
    private initialized: boolean = false;
    private expandedMode: boolean = false;

    // Expanded mode elements
    private actionText: Text | null = null;
    private entityText: Text | null = null;

    private static readonly WIDTH = 260;
    private static readonly HEIGHT = 160;
    private static readonly EXPANDED_HEIGHT = 220;
    private static readonly BAR_WIDTH = 180;
    private static readonly BAR_HEIGHT = 8;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();

        const titleStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold',
        });

        const textStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.TEXT,
        });

        const thoughtStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.SECONDARY,
            fontStyle: 'italic',
            wordWrap: true,
            wordWrapWidth: AIPanel.WIDTH - 20,
        });

        this.titleText = new Text({ text: '⚡ COMMANDER AI', style: titleStyle });
        this.moodText = new Text({ text: '😌 CALM [BAL]', style: textStyle });
        this.thoughtText = new Text({ text: '"Monitoring sectors."', style: thoughtStyle });
        this.phaseText = new Text({ text: 'Phase: EXPANSION', style: textStyle });
        this.statsText = new Text({ text: 'THR: 0% | COV: 0%', style: textStyle });
        this.threatBar = new Graphics();
        this.coverageBar = new Graphics();
    }

    init(parent: Container): void {
        if (this.initialized) return;

        // Background with border
        this.background.roundRect(0, 0, AIPanel.WIDTH, AIPanel.HEIGHT, 8);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.85 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
        this.container.addChild(this.background);

        // Title
        this.titleText.position.set(10, 8);
        this.container.addChild(this.titleText);

        // Mood and personality
        this.moodText.position.set(10, 32);
        this.container.addChild(this.moodText);

        // Thought bubble
        this.thoughtText.position.set(10, 52);
        this.container.addChild(this.thoughtText);

        // Phase
        this.phaseText.position.set(10, 90);
        this.container.addChild(this.phaseText);

        // Stats text
        this.statsText.position.set(10, 108);
        this.container.addChild(this.statsText);

        // Threat bar
        this.threatBar.position.set(10, 128);
        this.container.addChild(this.threatBar);

        // Coverage bar
        this.coverageBar.position.set(10, 142);
        this.container.addChild(this.coverageBar);

        // Expanded mode text elements (hidden by default)
        const expandedStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL - 1,
            fill: 0x88CCFF,
        });

        this.actionText = new Text({ text: '', style: expandedStyle });
        this.actionText.position.set(10, 158);
        this.actionText.visible = false;
        this.container.addChild(this.actionText);

        this.entityText = new Text({ text: '', style: expandedStyle });
        this.entityText.position.set(10, 178);
        this.entityText.visible = false;
        this.container.addChild(this.entityText);

        // Add to parent container
        parent.addChild(this.container);
        this.initialized = true;
    }

    update(status: AIStatusExtended): void {
        if (!this.initialized) return;

        // Update mood with emoji and personality
        const emoji = MOOD_EMOJIS[status.mood] ?? '🤖';
        const personalityShort = PERSONALITY_SHORT[status.personality] ?? 'BAL';
        this.moodText.text = `${emoji} ${status.mood} [${personalityShort}]`;
        this.moodText.style.fill = MOOD_COLORS[status.mood] ?? UI_STYLES.COLORS.TEXT;

        // Update thought bubble
        this.thoughtText.text = `"${status.moodMessage}"`;

        // Update phase
        const phaseName = PHASE_NAMES[status.currentPhase] ?? 'UNKNOWN';
        const focus = status.phaseFocus?.toUpperCase() ?? 'N/A';
        this.phaseText.text = `Phase: ${phaseName} [${focus}]`;

        // Update stats
        const threat = Math.round(status.threatLevel);
        const coverage = Math.round(status.coveragePercent);
        this.statsText.text = `THR: ${threat}% | COV: ${coverage}%`;

        // Update threat bar
        this.updateBar(this.threatBar, status.threatLevel / 100, UI_STYLES.COLORS.DANGER);

        // Update coverage bar
        this.updateBar(this.coverageBar, status.coveragePercent / 100, UI_STYLES.COLORS.HEALTH);

        // Update expanded mode info
        if (this.expandedMode && this.actionText && this.entityText) {
            // Action info
            if (status.plannedAction && status.plannedPosition) {
                const actionType = status.plannedAction.type.replace('_', ' ');
                const pos = status.plannedPosition;
                const score = Math.round(status.plannedAction.expectedValue);
                this.actionText.text = `⚡ ${actionType} @ (${Math.round(pos.x)}, ${Math.round(pos.y)}) [${score}]`;
            } else {
                this.actionText.text = '⚡ Analyzing...';
            }

            // Entity counts
            this.entityText.text = `📊 Decisions: ${status.decisionsThisWave} | Success: ${status.successfulActions}`;
        }
    }

    private updateBar(bar: Graphics, percent: number, color: number): void {
        bar.clear();

        // Background
        bar.roundRect(0, 0, AIPanel.BAR_WIDTH, AIPanel.BAR_HEIGHT, 2);
        bar.fill({ color: 0x222233, alpha: 0.8 });

        // Fill
        const fillWidth = Math.max(0, Math.min(1, percent)) * AIPanel.BAR_WIDTH;
        if (fillWidth > 0) {
            bar.roundRect(0, 0, fillWidth, AIPanel.BAR_HEIGHT, 2);
            bar.fill({ color, alpha: 0.9 });
        }
    }

    getContainer(): Container {
        return this.container;
    }

    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    static getDimensions(): { width: number; height: number } {
        return { width: AIPanel.WIDTH, height: AIPanel.HEIGHT };
    }

    /**
     * Set expanded mode for showing detailed AI brain info
     */
    setExpandedMode(expanded: boolean): void {
        this.expandedMode = expanded;

        // Show/hide expanded elements
        if (this.actionText) this.actionText.visible = expanded;
        if (this.entityText) this.entityText.visible = expanded;

        // Redraw background with new height
        this.background.clear();
        const height = expanded ? AIPanel.EXPANDED_HEIGHT : AIPanel.HEIGHT;
        this.background.roundRect(0, 0, AIPanel.WIDTH, height, 8);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.85 });
        this.background.stroke({
            color: expanded ? 0x00FFFF : UI_STYLES.COLORS.PRIMARY,
            width: expanded ? 3 : 2,
        });
    }

    /**
     * Check if expanded mode is enabled
     */
    isExpandedMode(): boolean {
        return this.expandedMode;
    }

    show(): void {
        this.container.visible = true;
    }

    hide(): void {
        this.container.visible = false;
    }

    destroy(): void {
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
