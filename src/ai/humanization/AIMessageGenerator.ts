/**
 * AIMessageGenerator
 *
 * Generates personality-flavored messages for AI actions.
 * Makes the AI feel like a character with unique voice.
 *
 * @module ai/humanization/AIMessageGenerator
 */

import { AIPersonality, AIActionType, AIAction, PlacementParams, UpgradeParams } from '../types';
import { TurretType } from '../../types/config/turrets';

/**
 * Message icon by action type
 */
const ACTION_ICONS: Record<AIActionType, string> = {
    [AIActionType.PLACE_TURRET]: '🔧',
    [AIActionType.UPGRADE_TURRET]: '⬆️',
    [AIActionType.SELL_TURRET]: '💰',
};

/**
 * Turret names for messages
 */
const TURRET_NAMES: Record<number, string> = {
    [TurretType.PHASER_ARRAY]: 'Phaser Array',
    [TurretType.TORPEDO_LAUNCHER]: 'Torpedo Launcher',
    [TurretType.DISRUPTOR_BANK]: 'Disruptor Bank',
    [TurretType.POLARON_BEAM]: 'Polaron Beam',
    [TurretType.TETRYON_BEAM]: 'Tetryon Beam',
    [TurretType.PLASMA_CANNON]: 'Plasma Cannon',
};

/**
 * Placement messages by personality
 */
const PLACEMENT_TEMPLATES: Record<AIPersonality, string[]> = {
    [AIPersonality.AGGRESSIVE]: [
        "Deploying {turret} for maximum carnage!",
        "{turret} online! Let them burn!",
        "Adding {turret} to rain destruction!",
        "Time for firepower! {turret} active!",
    ],
    [AIPersonality.DEFENSIVE]: [
        "Fortifying with {turret}.",
        "{turret} securing the perimeter.",
        "Reinforcing position with {turret}.",
        "Strategic {turret} emplacement.",
    ],
    [AIPersonality.ECONOMIC]: [
        "Cost-efficient {turret} placement.",
        "{turret}: optimal value position.",
        "Resource-conscious {turret} deploy.",
        "Maximizing {turret} ROI.",
    ],
    [AIPersonality.BALANCED]: [
        "Deploying {turret}.",
        "{turret} placed for coverage.",
        "Adding {turret} to defense grid.",
        "{turret} ready.",
    ],
    [AIPersonality.ADAPTIVE]: [
        "{turret} counters current threat.",
        "Adapting with {turret}.",
        "Tactical {turret} response.",
        "{turret} for situational advantage.",
    ],
};

/**
 * Upgrade messages by personality
 */
const UPGRADE_TEMPLATES: Record<AIPersonality, string[]> = {
    [AIPersonality.AGGRESSIVE]: [
        "Powering up! More damage!",
        "Upgrading for maximum destruction!",
        "Enhancement complete! FIRE!",
        "Turret upgraded! Annihilate them!",
    ],
    [AIPersonality.DEFENSIVE]: [
        "Strengthening defenses.",
        "Turret enhanced for durability.",
        "Upgrade reinforces perimeter.",
        "Improved defensive capability.",
    ],
    [AIPersonality.ECONOMIC]: [
        "Essential upgrade applied.",
        "Value-add enhancement.",
        "Smart investment in firepower.",
        "Upgrade maximizes efficiency.",
    ],
    [AIPersonality.BALANCED]: [
        "Turret upgraded.",
        "Enhancement complete.",
        "Improving firepower.",
        "Upgrade applied.",
    ],
    [AIPersonality.ADAPTIVE]: [
        "Upgrade matches threat profile.",
        "Adaptive enhancement.",
        "Evolving turret capability.",
        "Strategic upgrade applied.",
    ],
};

/**
 * Tactical observation messages (can be used randomly)
 */
const TACTICAL_TEMPLATES: Record<AIPersonality, string[]> = {
    [AIPersonality.AGGRESSIVE]: [
        "Targeting weak sector!",
        "Flankers detected. Crush them!",
        "Enemy concentration spotted!",
        "Moving to intercept!",
    ],
    [AIPersonality.DEFENSIVE]: [
        "Coverage gap detected.",
        "Shoring up weak sectors.",
        "Reinforcement needed here.",
        "Defense grid needs expansion.",
    ],
    [AIPersonality.ECONOMIC]: [
        "High-value zone identified.",
        "Resource efficiency: optimal.",
        "Cost analysis complete.",
        "Budget allocation updated.",
    ],
    [AIPersonality.BALANCED]: [
        "Analyzing threat vectors.",
        "Coordinating response.",
        "Tactical assessment complete.",
        "Adjusting coverage.",
    ],
    [AIPersonality.ADAPTIVE]: [
        "Pattern recognized.",
        "Adapting to enemy behavior.",
        "Counter-strategy engaged.",
        "Learning from engagement.",
    ],
};

/**
 * Special event messages
 */
const SPECIAL_MESSAGES: Record<string, Record<AIPersonality, string[]>> = {
    waveCleared: {
        [AIPersonality.AGGRESSIVE]: ["Wave destroyed! Next!", "Bring more!"],
        [AIPersonality.DEFENSIVE]: ["Perimeter held.", "Wave repelled."],
        [AIPersonality.ECONOMIC]: ["Efficient clearance.", "On budget."],
        [AIPersonality.BALANCED]: ["Wave cleared.", "Good work."],
        [AIPersonality.ADAPTIVE]: ["Pattern learned.", "Improving."],
    },
    bossSpawn: {
        [AIPersonality.AGGRESSIVE]: ["BOSS! Attack with everything!", "Big target!"],
        [AIPersonality.DEFENSIVE]: ["Boss approaching. Brace!", "Hold the line!"],
        [AIPersonality.ECONOMIC]: ["High-value target.", "Worth the investment."],
        [AIPersonality.BALANCED]: ["Boss detected. Focus fire!", "All hands!"],
        [AIPersonality.ADAPTIVE]: ["Boss analysis loading...", "Adapting tactics."],
    },
    lowResources: {
        [AIPersonality.AGGRESSIVE]: ["Need more resources to fight!", "Can't attack without funds!"],
        [AIPersonality.DEFENSIVE]: ["Resources limited.", "Conserving."],
        [AIPersonality.ECONOMIC]: ["Budget critical!", "Must economize!"],
        [AIPersonality.BALANCED]: ["Resources low.", "Waiting."],
        [AIPersonality.ADAPTIVE]: ["Adjusting for scarcity.", "Resource mode."],
    },
};

export interface AIMessage {
    text: string;
    icon: string;
    timestamp: number;
}

/**
 * Generator for personality-flavored AI messages
 */
export class AIMessageGenerator {
    private personality: AIPersonality = AIPersonality.BALANCED;
    private messageHistory: AIMessage[] = [];
    private readonly MAX_HISTORY = 20;

    /**
     * Set current personality (affects message flavor)
     */
    setPersonality(personality: AIPersonality): void {
        this.personality = personality;
    }

    /**
     * Generate message for an AI action
     */
    generateActionMessage(action: AIAction): AIMessage {
        let text: string;
        const icon = ACTION_ICONS[action.type] ?? '🤖';

        switch (action.type) {
            case AIActionType.PLACE_TURRET:
                text = this.generatePlacementMessage(action.params as PlacementParams);
                break;
            case AIActionType.UPGRADE_TURRET:
                text = this.generateUpgradeMessage(action.params as UpgradeParams);
                break;
            case AIActionType.SELL_TURRET:
                text = `Selling turret. Resources reclaimed.`;
                break;
            default:
                text = `Action: ${action.type}`;
        }

        const message: AIMessage = {
            text,
            icon,
            timestamp: Date.now(),
        };

        this.addToHistory(message);
        return message;
    }

    /**
     * Generate placement message with turret name
     */
    private generatePlacementMessage(params: PlacementParams): string {
        const turretName = TURRET_NAMES[params.turretType] ?? 'Turret';
        const templates = PLACEMENT_TEMPLATES[this.personality] ?? PLACEMENT_TEMPLATES[AIPersonality.BALANCED];
        const template = templates[Math.floor(Math.random() * templates.length)];
        return template.replace('{turret}', turretName);
    }

    /**
     * Generate upgrade message
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private generateUpgradeMessage(_params: UpgradeParams): string {
        const templates = UPGRADE_TEMPLATES[this.personality] ?? UPGRADE_TEMPLATES[AIPersonality.BALANCED];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Generate tactical observation message
     */
    generateTacticalMessage(): AIMessage {
        const templates = TACTICAL_TEMPLATES[this.personality] ?? TACTICAL_TEMPLATES[AIPersonality.BALANCED];
        const text = templates[Math.floor(Math.random() * templates.length)];

        const message: AIMessage = {
            text,
            icon: '🎯',
            timestamp: Date.now(),
        };

        this.addToHistory(message);
        return message;
    }

    /**
     * Generate special event message
     */
    generateSpecialMessage(event: 'waveCleared' | 'bossSpawn' | 'lowResources'): AIMessage {
        const eventMessages = SPECIAL_MESSAGES[event];
        const templates = eventMessages?.[this.personality] ?? eventMessages?.[AIPersonality.BALANCED] ?? ['Event'];
        const text = templates[Math.floor(Math.random() * templates.length)];

        const icons: Record<string, string> = {
            waveCleared: '🏆',
            bossSpawn: '⚠️',
            lowResources: '💸',
        };

        const message: AIMessage = {
            text,
            icon: icons[event] ?? '❗',
            timestamp: Date.now(),
        };

        this.addToHistory(message);
        return message;
    }

    /**
     * Get recent message history
     */
    getHistory(): AIMessage[] {
        return [...this.messageHistory];
    }

    /**
     * Add message to history (with size limit)
     */
    private addToHistory(message: AIMessage): void {
        this.messageHistory.push(message);
        if (this.messageHistory.length > this.MAX_HISTORY) {
            this.messageHistory.shift();
        }
    }

    /**
     * Clear message history
     */
    clearHistory(): void {
        this.messageHistory = [];
    }

    /**
     * Reset generator
     */
    reset(): void {
        this.clearHistory();
    }
}
