/**
 * Tests for AIMessageGenerator
 *
 * Tests personality-flavored message generation for AI actions,
 * covering all personalities, action types, special events, and history management.
 *
 * @module __tests__/aiMessageGenerator.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIMessageGenerator } from '../ai/humanization/AIMessageGenerator';
import { AIPersonality, AIActionType, AIAction, PlacementParams, UpgradeParams, SellParams } from '../ai/types';
import { TurretType } from '../types/config/turrets';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create an AIAction for placing a turret
 */
function createPlaceTurretAction(turretType: number): AIAction {
    return {
        type: AIActionType.PLACE_TURRET,
        priority: 1,
        cost: 100,
        expectedValue: 50,
        params: { x: 100, y: 200, turretType } as PlacementParams,
    };
}

/**
 * Create an AIAction for upgrading a turret
 */
function createUpgradeTurretAction(turretId: number = 1): AIAction {
    return {
        type: AIActionType.UPGRADE_TURRET,
        priority: 1,
        cost: 75,
        expectedValue: 40,
        params: { turretId, upgradePath: 0 } as UpgradeParams,
    };
}

/**
 * Create an AIAction for selling a turret
 */
function createSellTurretAction(turretId: number = 1): AIAction {
    return {
        type: AIActionType.SELL_TURRET,
        priority: 1,
        cost: 0,
        expectedValue: 30,
        params: { turretId } as SellParams,
    };
}

/**
 * All personality values for iteration
 */
const ALL_PERSONALITIES: AIPersonality[] = [
    AIPersonality.AGGRESSIVE,
    AIPersonality.DEFENSIVE,
    AIPersonality.ECONOMIC,
    AIPersonality.BALANCED,
    AIPersonality.ADAPTIVE,
];

/**
 * All known turret types mapped to their expected display names
 */
const TURRET_NAME_MAP: Record<number, string> = {
    [TurretType.PHASER_ARRAY]: 'Phaser Array',
    [TurretType.TORPEDO_LAUNCHER]: 'Torpedo Launcher',
    [TurretType.DISRUPTOR_BANK]: 'Disruptor Bank',
    [TurretType.POLARON_BEAM]: 'Polaron Beam',
    [TurretType.TETRYON_BEAM]: 'Tetryon Beam',
    [TurretType.PLASMA_CANNON]: 'Plasma Cannon',
};

// ============================================================================
// TESTS
// ============================================================================

describe('AIMessageGenerator', () => {
    let generator: AIMessageGenerator;

    beforeEach(() => {
        generator = new AIMessageGenerator();
    });

    // ========================================================================
    // Construction & Defaults
    // ========================================================================

    describe('construction and defaults', () => {
        it('should start with empty history', () => {
            const history = generator.getHistory();
            expect(history).toEqual([]);
        });

        it('should default to BALANCED personality when generating messages', () => {
            // Arrange - no setPersonality call, uses default BALANCED
            const action = createPlaceTurretAction(TurretType.PHASER_ARRAY);

            // Act
            const message = generator.generateActionMessage(action);

            // Assert - BALANCED placement templates include known phrases
            const balancedPatterns = [
                'Deploying Phaser Array.',
                'Phaser Array placed for coverage.',
                'Adding Phaser Array to defense grid.',
                'Phaser Array ready.',
            ];
            expect(balancedPatterns).toContain(message.text);
        });
    });

    // ========================================================================
    // Placement Messages
    // ========================================================================

    describe('placement messages', () => {
        it('should generate non-empty placement messages for each personality', () => {
            for (const personality of ALL_PERSONALITIES) {
                // Arrange
                generator.setPersonality(personality);
                const action = createPlaceTurretAction(TurretType.PHASER_ARRAY);

                // Act
                const message = generator.generateActionMessage(action);

                // Assert
                expect(message.text.length).toBeGreaterThan(0);
                expect(message.icon).toBe('🔧');
            }
        });

        it('should include turret name in placement messages for all turret types', () => {
            generator.setPersonality(AIPersonality.BALANCED);

            for (const [turretTypeId, expectedName] of Object.entries(TURRET_NAME_MAP)) {
                // Arrange
                const action = createPlaceTurretAction(Number(turretTypeId));

                // Act
                const message = generator.generateActionMessage(action);

                // Assert
                expect(message.text).toContain(expectedName);
            }
        });

        it('should use fallback turret name when turret type is unknown', () => {
            // Arrange
            generator.setPersonality(AIPersonality.BALANCED);
            const action = createPlaceTurretAction(999);

            // Act
            const message = generator.generateActionMessage(action);

            // Assert
            expect(message.text).toContain('Turret');
            expect(message.text.length).toBeGreaterThan(0);
        });

        it('should include the placement icon for placement actions', () => {
            // Arrange
            const action = createPlaceTurretAction(TurretType.TORPEDO_LAUNCHER);

            // Act
            const message = generator.generateActionMessage(action);

            // Assert
            expect(message.icon).toBe('🔧');
        });

        it('should produce aggressive-themed messages when personality is AGGRESSIVE', () => {
            // Arrange
            generator.setPersonality(AIPersonality.AGGRESSIVE);
            const action = createPlaceTurretAction(TurretType.DISRUPTOR_BANK);

            // Act - generate multiple to sample from template pool
            const messages = new Set<string>();
            for (let i = 0; i < 50; i++) {
                messages.add(generator.generateActionMessage(action).text);
            }

            // Assert - all messages should be from the aggressive template pool
            const aggressiveKeywords = ['carnage', 'burn', 'destruction', 'firepower'];
            for (const text of messages) {
                const hasAggressiveWord = aggressiveKeywords.some(kw => text.toLowerCase().includes(kw));
                expect(hasAggressiveWord).toBe(true);
            }
        });

        it('should produce defensive-themed messages when personality is DEFENSIVE', () => {
            // Arrange
            generator.setPersonality(AIPersonality.DEFENSIVE);
            const action = createPlaceTurretAction(TurretType.POLARON_BEAM);

            // Act
            const messages = new Set<string>();
            for (let i = 0; i < 50; i++) {
                messages.add(generator.generateActionMessage(action).text);
            }

            // Assert
            const defensiveKeywords = ['fortifying', 'securing', 'reinforcing', 'strategic', 'perimeter', 'emplacement', 'position'];
            for (const text of messages) {
                const hasDefensiveWord = defensiveKeywords.some(kw => text.toLowerCase().includes(kw));
                expect(hasDefensiveWord).toBe(true);
            }
        });
    });

    // ========================================================================
    // Upgrade Messages
    // ========================================================================

    describe('upgrade messages', () => {
        it('should generate non-empty upgrade messages for each personality', () => {
            for (const personality of ALL_PERSONALITIES) {
                // Arrange
                generator.setPersonality(personality);
                const action = createUpgradeTurretAction();

                // Act
                const message = generator.generateActionMessage(action);

                // Assert
                expect(message.text.length).toBeGreaterThan(0);
                expect(message.icon).toBe('⬆️');
            }
        });

        it('should include the upgrade icon for upgrade actions', () => {
            // Arrange
            const action = createUpgradeTurretAction();

            // Act
            const message = generator.generateActionMessage(action);

            // Assert
            expect(message.icon).toBe('⬆️');
        });

        it('should produce economic-themed upgrade messages when personality is ECONOMIC', () => {
            // Arrange
            generator.setPersonality(AIPersonality.ECONOMIC);
            const action = createUpgradeTurretAction();

            // Act
            const messages = new Set<string>();
            for (let i = 0; i < 50; i++) {
                messages.add(generator.generateActionMessage(action).text);
            }

            // Assert
            const economicKeywords = ['essential', 'value', 'investment', 'efficiency', 'smart'];
            for (const text of messages) {
                const hasEconomicWord = economicKeywords.some(kw => text.toLowerCase().includes(kw));
                expect(hasEconomicWord).toBe(true);
            }
        });
    });

    // ========================================================================
    // Sell Messages
    // ========================================================================

    describe('sell messages', () => {
        it('should generate a fixed sell message regardless of personality', () => {
            for (const personality of ALL_PERSONALITIES) {
                // Arrange
                generator.setPersonality(personality);
                const action = createSellTurretAction();

                // Act
                const message = generator.generateActionMessage(action);

                // Assert
                expect(message.text).toBe('Selling turret. Resources reclaimed.');
                expect(message.icon).toBe('💰');
            }
        });
    });

    // ========================================================================
    // Tactical Messages
    // ========================================================================

    describe('tactical messages', () => {
        it('should generate non-empty tactical messages for each personality', () => {
            for (const personality of ALL_PERSONALITIES) {
                // Arrange
                generator.setPersonality(personality);

                // Act
                const message = generator.generateTacticalMessage();

                // Assert
                expect(message.text.length).toBeGreaterThan(0);
                expect(message.icon).toBe('🎯');
            }
        });

        it('should include a timestamp in tactical messages', () => {
            // Arrange
            const beforeTime = Date.now();

            // Act
            const message = generator.generateTacticalMessage();

            // Assert
            const afterTime = Date.now();
            expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(message.timestamp).toBeLessThanOrEqual(afterTime);
        });

        it('should produce adaptive-themed tactical messages when personality is ADAPTIVE', () => {
            // Arrange
            generator.setPersonality(AIPersonality.ADAPTIVE);

            // Act
            const messages = new Set<string>();
            for (let i = 0; i < 50; i++) {
                messages.add(generator.generateTacticalMessage().text);
            }

            // Assert
            const adaptiveKeywords = ['pattern', 'adapting', 'counter', 'learning'];
            for (const text of messages) {
                const hasAdaptiveWord = adaptiveKeywords.some(kw => text.toLowerCase().includes(kw));
                expect(hasAdaptiveWord).toBe(true);
            }
        });
    });

    // ========================================================================
    // Special Event Messages
    // ========================================================================

    describe('special event messages', () => {
        it('should generate non-empty wave cleared messages for each personality', () => {
            for (const personality of ALL_PERSONALITIES) {
                // Arrange
                generator.setPersonality(personality);

                // Act
                const message = generator.generateSpecialMessage('waveCleared');

                // Assert
                expect(message.text.length).toBeGreaterThan(0);
                expect(message.icon).toBe('🏆');
            }
        });

        it('should generate non-empty boss spawn messages for each personality', () => {
            for (const personality of ALL_PERSONALITIES) {
                // Arrange
                generator.setPersonality(personality);

                // Act
                const message = generator.generateSpecialMessage('bossSpawn');

                // Assert
                expect(message.text.length).toBeGreaterThan(0);
                expect(message.icon).toBe('⚠️');
            }
        });

        it('should generate non-empty low resources messages for each personality', () => {
            for (const personality of ALL_PERSONALITIES) {
                // Arrange
                generator.setPersonality(personality);

                // Act
                const message = generator.generateSpecialMessage('lowResources');

                // Assert
                expect(message.text.length).toBeGreaterThan(0);
                expect(message.icon).toBe('💸');
            }
        });

        it('should use correct icons for each special event type', () => {
            // Act & Assert
            expect(generator.generateSpecialMessage('waveCleared').icon).toBe('🏆');
            expect(generator.generateSpecialMessage('bossSpawn').icon).toBe('⚠️');
            expect(generator.generateSpecialMessage('lowResources').icon).toBe('💸');
        });

        it('should produce different messages for different event types', () => {
            // Arrange
            generator.setPersonality(AIPersonality.AGGRESSIVE);

            // Act
            const waveMsgs = new Set<string>();
            const bossMsgs = new Set<string>();
            const lowResMsgs = new Set<string>();
            for (let i = 0; i < 50; i++) {
                waveMsgs.add(generator.generateSpecialMessage('waveCleared').text);
                bossMsgs.add(generator.generateSpecialMessage('bossSpawn').text);
                lowResMsgs.add(generator.generateSpecialMessage('lowResources').text);
            }

            // Assert - the sets should have no overlap across categories
            for (const waveMsg of waveMsgs) {
                expect(bossMsgs.has(waveMsg)).toBe(false);
                expect(lowResMsgs.has(waveMsg)).toBe(false);
            }
        });
    });

    // ========================================================================
    // Message Structure
    // ========================================================================

    describe('message structure', () => {
        it('should include text, icon, and timestamp in every generated message', () => {
            // Arrange
            const action = createPlaceTurretAction(TurretType.PHASER_ARRAY);

            // Act
            const message = generator.generateActionMessage(action);

            // Assert
            expect(message).toHaveProperty('text');
            expect(message).toHaveProperty('icon');
            expect(message).toHaveProperty('timestamp');
            expect(typeof message.text).toBe('string');
            expect(typeof message.icon).toBe('string');
            expect(typeof message.timestamp).toBe('number');
        });

        it('should set timestamp to approximately current time', () => {
            // Arrange
            const before = Date.now();

            // Act
            const message = generator.generateActionMessage(createPlaceTurretAction(TurretType.PHASER_ARRAY));

            // Assert
            const after = Date.now();
            expect(message.timestamp).toBeGreaterThanOrEqual(before);
            expect(message.timestamp).toBeLessThanOrEqual(after);
        });
    });

    // ========================================================================
    // History Management
    // ========================================================================

    describe('history management', () => {
        it('should add action messages to history', () => {
            // Arrange
            const action = createPlaceTurretAction(TurretType.PHASER_ARRAY);

            // Act
            generator.generateActionMessage(action);

            // Assert
            expect(generator.getHistory()).toHaveLength(1);
        });

        it('should add tactical messages to history', () => {
            // Act
            generator.generateTacticalMessage();

            // Assert
            expect(generator.getHistory()).toHaveLength(1);
        });

        it('should add special messages to history', () => {
            // Act
            generator.generateSpecialMessage('bossSpawn');

            // Assert
            expect(generator.getHistory()).toHaveLength(1);
        });

        it('should accumulate messages in history in order', () => {
            // Arrange & Act
            const m1 = generator.generateActionMessage(createPlaceTurretAction(TurretType.PHASER_ARRAY));
            const m2 = generator.generateTacticalMessage();
            const m3 = generator.generateSpecialMessage('waveCleared');

            // Assert
            const history = generator.getHistory();
            expect(history).toHaveLength(3);
            expect(history[0].text).toBe(m1.text);
            expect(history[1].text).toBe(m2.text);
            expect(history[2].text).toBe(m3.text);
        });

        it('should limit history to 20 messages', () => {
            // Arrange & Act - generate 25 messages
            for (let i = 0; i < 25; i++) {
                generator.generateTacticalMessage();
            }

            // Assert
            expect(generator.getHistory()).toHaveLength(20);
        });

        it('should remove oldest messages when history exceeds limit', () => {
            // Arrange - fill with one special message then 19 sell actions
            const firstMessage = generator.generateSpecialMessage('waveCleared');
            for (let i = 0; i < 19; i++) {
                generator.generateActionMessage(createSellTurretAction(i));
            }
            expect(generator.getHistory()).toHaveLength(20);
            expect(generator.getHistory()[0].icon).toBe(firstMessage.icon);

            // Act - add one more to trigger eviction of the first (waveCleared) message
            generator.generateSpecialMessage('bossSpawn');

            // Assert
            const history = generator.getHistory();
            expect(history).toHaveLength(20);
            // The oldest message (waveCleared) should have been removed; first is now a sell
            expect(history[0].icon).toBe('💰');
            // The newest message should be the boss spawn message
            expect(history[history.length - 1].icon).toBe('⚠️');
        });

        it('should return a copy of history (not the internal array)', () => {
            // Arrange
            generator.generateTacticalMessage();

            // Act
            const history1 = generator.getHistory();
            const history2 = generator.getHistory();

            // Assert
            expect(history1).not.toBe(history2);
            expect(history1).toEqual(history2);
        });

        it('should clear history when clearHistory is called', () => {
            // Arrange
            generator.generateTacticalMessage();
            generator.generateTacticalMessage();
            expect(generator.getHistory()).toHaveLength(2);

            // Act
            generator.clearHistory();

            // Assert
            expect(generator.getHistory()).toHaveLength(0);
        });

        it('should clear history when reset is called', () => {
            // Arrange
            generator.generateTacticalMessage();
            generator.generateSpecialMessage('lowResources');
            expect(generator.getHistory()).toHaveLength(2);

            // Act
            generator.reset();

            // Assert
            expect(generator.getHistory()).toHaveLength(0);
        });
    });

    // ========================================================================
    // Personality Switching
    // ========================================================================

    describe('personality switching', () => {
        it('should change message style when personality is switched', () => {
            // Arrange - collect aggressive messages
            generator.setPersonality(AIPersonality.AGGRESSIVE);
            const aggressiveMessages = new Set<string>();
            for (let i = 0; i < 50; i++) {
                aggressiveMessages.add(generator.generateTacticalMessage().text);
            }

            // Act - switch to defensive and collect messages
            generator.setPersonality(AIPersonality.DEFENSIVE);
            const defensiveMessages = new Set<string>();
            for (let i = 0; i < 50; i++) {
                defensiveMessages.add(generator.generateTacticalMessage().text);
            }

            // Assert - the message pools should be completely distinct
            for (const msg of aggressiveMessages) {
                expect(defensiveMessages.has(msg)).toBe(false);
            }
        });
    });
});
