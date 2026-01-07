/**
 * Tests for AIMoodEngine
 *
 * @module __tests__/AIMoodEngine.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIMoodEngine, MoodContext } from '../ai/humanization/AIMoodEngine';
import { AIMood, AIPhase, AIPersonality } from '../ai/types';

/**
 * Helper to create a MoodContext with default values
 */
function createContext(overrides: Partial<MoodContext>): MoodContext {
    return {
        threatLevel: 30,
        coveragePercent: 60,
        kmHealthPercent: 80,
        resources: 250,
        waveNumber: 5,
        isBossWave: false,
        personality: AIPersonality.BALANCED,
        ...overrides,
    };
}

describe('AIMoodEngine', () => {
    let engine: AIMoodEngine;

    beforeEach(() => {
        engine = new AIMoodEngine();
    });

    describe('calculateMood', () => {
        it('should return DESPERATE when health is critical (< 20%)', () => {
            const context = createContext({ kmHealthPercent: 15 });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);

            expect(result.mood).toBe(AIMood.DESPERATE);
            expect(result.message).toBeTruthy();
        });

        it('should return DETERMINED during boss wave', () => {
            const context = createContext({
                isBossWave: true,
                kmHealthPercent: 80,
            });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);

            expect(result.mood).toBe(AIMood.DETERMINED);
        });

        it('should return STRESSED when high threat and low coverage', () => {
            const context = createContext({
                threatLevel: 80,
                coveragePercent: 40,
                kmHealthPercent: 60,
            });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);

            expect(result.mood).toBe(AIMood.STRESSED);
        });

        it('should return STRESSED when health is low (< 40%)', () => {
            const context = createContext({
                kmHealthPercent: 35,
                threatLevel: 30,
            });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);

            expect(result.mood).toBe(AIMood.STRESSED);
        });

        it('should return FOCUSED during active combat (threat > 40)', () => {
            const context = createContext({
                threatLevel: 50,
                kmHealthPercent: 70,
                coveragePercent: 60,
            });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);

            expect(result.mood).toBe(AIMood.FOCUSED);
        });

        it('should return CONFIDENT when resources high and good coverage', () => {
            const context = createContext({
                resources: 500,
                coveragePercent: 70,
                threatLevel: 30,
                kmHealthPercent: 80,
            });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);

            expect(result.mood).toBe(AIMood.CONFIDENT);
        });

        it('should return CALM in peaceful conditions', () => {
            const context = createContext({
                threatLevel: 5,
                coveragePercent: 50,
                resources: 200,
                kmHealthPercent: 90,
            });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);
            result = engine.calculateMood(context);

            expect(result.mood).toBe(AIMood.CALM);
        });

        it('should provide personality-appropriate messages', () => {
            const aggressiveContext = createContext({
                personality: AIPersonality.AGGRESSIVE,
                threatLevel: 50,
                kmHealthPercent: 80,
            });

            // Need multiple calls to overcome stability threshold
            let result = engine.calculateMood(aggressiveContext);
            result = engine.calculateMood(aggressiveContext);
            result = engine.calculateMood(aggressiveContext);
            result = engine.calculateMood(aggressiveContext);

            expect(result.message).toBeTruthy();
            expect(typeof result.message).toBe('string');
        });
    });

    describe('calculatePhase', () => {
        it('should return SURVIVAL_MODE when health < 30%', () => {
            const phase = engine.calculatePhase(5, false, 25);
            expect(phase).toBe(AIPhase.SURVIVAL_MODE);
        });

        it('should return BOSS_PREPARATION during boss wave', () => {
            const phase = engine.calculatePhase(5, true, 80);
            expect(phase).toBe(AIPhase.BOSS_PREPARATION);
        });

        it('should return BOSS_PREPARATION one wave before boss (wave % 5 == 4)', () => {
            const phase = engine.calculatePhase(4, false, 80);
            expect(phase).toBe(AIPhase.BOSS_PREPARATION);
        });

        it('should return EARLY_EXPANSION for waves 1-3', () => {
            expect(engine.calculatePhase(1, false, 100)).toBe(AIPhase.EARLY_EXPANSION);
            expect(engine.calculatePhase(2, false, 100)).toBe(AIPhase.EARLY_EXPANSION);
            expect(engine.calculatePhase(3, false, 100)).toBe(AIPhase.EARLY_EXPANSION);
        });

        it('should return DEFENSIVE_SETUP for waves 4-8', () => {
            expect(engine.calculatePhase(5, false, 80)).toBe(AIPhase.DEFENSIVE_SETUP);
            expect(engine.calculatePhase(6, false, 80)).toBe(AIPhase.DEFENSIVE_SETUP);
            expect(engine.calculatePhase(8, false, 80)).toBe(AIPhase.DEFENSIVE_SETUP);
        });

        it('should return POWER_SCALING for waves 9+', () => {
            expect(engine.calculatePhase(10, false, 80)).toBe(AIPhase.POWER_SCALING);
            expect(engine.calculatePhase(15, false, 80)).toBe(AIPhase.POWER_SCALING);
        });
    });

    describe('getPhaseFocus', () => {
        it('should return economy for EARLY_EXPANSION', () => {
            expect(engine.getPhaseFocus(AIPhase.EARLY_EXPANSION)).toBe('economy');
        });

        it('should return defense for DEFENSIVE_SETUP', () => {
            expect(engine.getPhaseFocus(AIPhase.DEFENSIVE_SETUP)).toBe('defense');
        });

        it('should return defense for SURVIVAL_MODE', () => {
            expect(engine.getPhaseFocus(AIPhase.SURVIVAL_MODE)).toBe('defense');
        });

        it('should return dps for POWER_SCALING', () => {
            expect(engine.getPhaseFocus(AIPhase.POWER_SCALING)).toBe('dps');
        });

        it('should return dps for BOSS_PREPARATION', () => {
            expect(engine.getPhaseFocus(AIPhase.BOSS_PREPARATION)).toBe('dps');
        });
    });

    describe('reset', () => {
        it('should reset mood engine to initial state', () => {
            // First put the engine in a non-default state
            const desperateContext = createContext({ kmHealthPercent: 10 });
            engine.calculateMood(desperateContext);
            engine.calculateMood(desperateContext);
            engine.calculateMood(desperateContext);
            engine.calculateMood(desperateContext);

            // Reset
            engine.reset();

            // After reset, initial context should give CALM (not carry over DESPERATE)
            const calmContext = createContext({
                threatLevel: 5,
                coveragePercent: 50,
                kmHealthPercent: 90,
            });
            const result = engine.calculateMood(calmContext);

            // First call after reset, mood should be based on new context
            expect(result.mood).toBe(AIMood.CALM);
        });
    });
});
