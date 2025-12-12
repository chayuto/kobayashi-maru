/**
 * AIMoodEngine
 *
 * Calculates AI mood states based on game situation.
 * Used to make the AI feel like a character with personality.
 *
 * @module ai/humanization/AIMoodEngine
 */

import { AIMood, AIPhase, AIPersonality } from '../types';

export interface MoodContext {
    threatLevel: number;          // 0-100
    coveragePercent: number;      // 0-100
    kmHealthPercent: number;      // 0-100
    resources: number;
    waveNumber: number;
    isBossWave: boolean;
    personality: AIPersonality;
}

export interface MoodResult {
    mood: AIMood;
    message: string;
}

/**
 * Mood message templates per personality
 */
const MOOD_MESSAGES: Record<AIMood, Record<AIPersonality, string[]>> = {
    [AIMood.CONFIDENT]: {
        [AIPersonality.AGGRESSIVE]: [
            "Bring it on!",
            "We're on fire!",
            "Nothing can stop us!",
        ],
        [AIPersonality.DEFENSIVE]: [
            "Defenses holding strong.",
            "All sectors secured.",
            "Perimeter is solid.",
        ],
        [AIPersonality.ECONOMIC]: [
            "Resources flowing well.",
            "Investments paying off.",
            "Ahead of schedule.",
        ],
        [AIPersonality.BALANCED]: [
            "Situation under control.",
            "Looking good, Commander.",
            "Keep up the pace.",
        ],
        [AIPersonality.ADAPTIVE]: [
            "Adapting successfully.",
            "Strategy working well.",
            "Optimal response achieved.",
        ],
    },
    [AIMood.CALM]: {
        [AIPersonality.AGGRESSIVE]: [
            "Waiting for targets...",
            "Turrets are hungry.",
            "Ready to strike.",
        ],
        [AIPersonality.DEFENSIVE]: [
            "Monitoring sectors.",
            "All quiet on sensors.",
            "Standing watch.",
        ],
        [AIPersonality.ECONOMIC]: [
            "Building reserves.",
            "Resource management optimal.",
            "Preparing for growth.",
        ],
        [AIPersonality.BALANCED]: [
            "Scanning for hostiles.",
            "Awaiting contact.",
            "Standing by.",
        ],
        [AIPersonality.ADAPTIVE]: [
            "Analyzing patterns.",
            "Learning situation.",
            "Gathering data.",
        ],
    },
    [AIMood.FOCUSED]: {
        [AIPersonality.AGGRESSIVE]: [
            "Engaging threats!",
            "Maximum firepower!",
            "Destroy them all!",
        ],
        [AIPersonality.DEFENSIVE]: [
            "Holding the line.",
            "Reinforcing weak points.",
            "Shield formation active.",
        ],
        [AIPersonality.ECONOMIC]: [
            "Cost-efficient response.",
            "Prioritizing high-value targets.",
            "Managing the budget.",
        ],
        [AIPersonality.BALANCED]: [
            "Engaging hostiles.",
            "Coordinating response.",
            "Executing tactics.",
        ],
        [AIPersonality.ADAPTIVE]: [
            "Adapting to threat.",
            "Adjusting strategy.",
            "Counter-measures active.",
        ],
    },
    [AIMood.STRESSED]: {
        [AIPersonality.AGGRESSIVE]: [
            "Need more guns!",
            "They keep coming!",
            "Not enough dakka!",
        ],
        [AIPersonality.DEFENSIVE]: [
            "Coverage gaps critical!",
            "Defenses stretched thin!",
            "Need reinforcements!",
        ],
        [AIPersonality.ECONOMIC]: [
            "Budget overrun!",
            "Resources depleting fast!",
            "Unsustainable losses!",
        ],
        [AIPersonality.BALANCED]: [
            "Situation deteriorating.",
            "Multiple threats detected.",
            "Overwhelmed!",
        ],
        [AIPersonality.ADAPTIVE]: [
            "Can't adapt fast enough!",
            "Too many variables!",
            "Recalculating...",
        ],
    },
    [AIMood.DETERMINED]: {
        [AIPersonality.AGGRESSIVE]: [
            "Boss incoming. ATTACK!",
            "Time to show them!",
            "Glory awaits!",
        ],
        [AIPersonality.DEFENSIVE]: [
            "Preparing for boss wave.",
            "All turrets, maximum defense!",
            "Shields up, weapons ready!",
        ],
        [AIPersonality.ECONOMIC]: [
            "Value target approaching.",
            "Deploying premium assets.",
            "High-priority engagement.",
        ],
        [AIPersonality.BALANCED]: [
            "Boss detected. Battle stations!",
            "Here they come!",
            "All hands to stations!",
        ],
        [AIPersonality.ADAPTIVE]: [
            "Boss analysis complete.",
            "Optimal counter engaged.",
            "Adapting to boss threat.",
        ],
    },
    [AIMood.DESPERATE]: {
        [AIPersonality.AGGRESSIVE]: [
            "HULL CRITICAL!",
            "Fight to the end!",
            "Take them with us!",
        ],
        [AIPersonality.DEFENSIVE]: [
            "Defense failing!",
            "Emergency protocols!",
            "Hull breach imminent!",
        ],
        [AIPersonality.ECONOMIC]: [
            "All investments lost!",
            "Abandon cost analysis!",
            "Survival priority!",
        ],
        [AIPersonality.BALANCED]: [
            "Critical damage!",
            "Need emergency repairs!",
            "We're not going to make it!",
        ],
        [AIPersonality.ADAPTIVE]: [
            "No viable strategy!",
            "All options exhausted!",
            "Survival mode!",
        ],
    },
};

/**
 * Engine that calculates AI mood based on game context
 */
export class AIMoodEngine {
    private lastMood: AIMood = AIMood.CALM;
    private moodStability: number = 0; // Prevents rapid mood swings

    /**
     * Calculate current AI mood based on game situation
     */
    calculateMood(context: MoodContext): MoodResult {
        const newMood = this.determineMood(context);

        // Apply mood stability (prevent rapid changes)
        if (newMood !== this.lastMood) {
            this.moodStability++;
            if (this.moodStability < 3) {
                // Keep old mood for stability
                return this.createMoodResult(this.lastMood, context.personality);
            }
        }

        this.moodStability = 0;
        this.lastMood = newMood;
        return this.createMoodResult(newMood, context.personality);
    }

    /**
     * Determine mood based on priority rules
     */
    private determineMood(context: MoodContext): AIMood {
        // Desperate: Ship is dying (highest priority)
        if (context.kmHealthPercent < 20) {
            return AIMood.DESPERATE;
        }

        // Determined: Boss wave incoming
        if (context.isBossWave) {
            return AIMood.DETERMINED;
        }

        // Stressed: High threat, low coverage
        if (context.threatLevel > 70 && context.coveragePercent < 50) {
            return AIMood.STRESSED;
        }

        // Stressed: Low health but not critical
        if (context.kmHealthPercent < 40) {
            return AIMood.STRESSED;
        }

        // Focused: Active combat, handling it
        if (context.threatLevel > 40) {
            return AIMood.FOCUSED;
        }

        // Confident: Low threat, good resources
        if (context.resources > 300 && context.coveragePercent > 60) {
            return AIMood.CONFIDENT;
        }

        // Confident: Wave cleared, strong position
        if (context.threatLevel < 10 && context.coveragePercent > 80) {
            return AIMood.CONFIDENT;
        }

        // Calm: Default peaceful state
        return AIMood.CALM;
    }

    /**
     * Create mood result with personality-flavored message
     */
    private createMoodResult(mood: AIMood, personality: AIPersonality): MoodResult {
        const messages = MOOD_MESSAGES[mood]?.[personality] ?? MOOD_MESSAGES[mood]?.[AIPersonality.BALANCED] ?? ['...'];
        const message = messages[Math.floor(Math.random() * messages.length)];
        return { mood, message };
    }

    /**
     * Calculate current AI phase based on game state
     */
    calculatePhase(waveNumber: number, isBossWave: boolean, kmHealthPercent: number): AIPhase {
        // Emergency survival
        if (kmHealthPercent < 30) {
            return AIPhase.SURVIVAL_MODE;
        }

        // Boss wave preparation
        if (isBossWave || (waveNumber > 0 && waveNumber % 5 === 4)) {
            return AIPhase.BOSS_PREPARATION;
        }

        // Early game: waves 1-3
        if (waveNumber <= 3) {
            return AIPhase.EARLY_EXPANSION;
        }

        // Mid game: waves 4-8
        if (waveNumber <= 8) {
            return AIPhase.DEFENSIVE_SETUP;
        }

        // Late game: waves 9+
        return AIPhase.POWER_SCALING;
    }

    /**
     * Get phase focus for UI display
     */
    getPhaseFocus(phase: AIPhase): 'economy' | 'defense' | 'dps' {
        switch (phase) {
            case AIPhase.EARLY_EXPANSION:
                return 'economy';
            case AIPhase.DEFENSIVE_SETUP:
            case AIPhase.SURVIVAL_MODE:
                return 'defense';
            case AIPhase.POWER_SCALING:
            case AIPhase.BOSS_PREPARATION:
                return 'dps';
            default:
                return 'defense';
        }
    }

    /**
     * Reset mood engine state
     */
    reset(): void {
        this.lastMood = AIMood.CALM;
        this.moodStability = 0;
    }
}
