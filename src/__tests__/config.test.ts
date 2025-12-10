import { describe, it, expect } from 'vitest';
import { AI_CONFIG, RENDERING_CONFIG, WAVE_CONFIG, PERFORMANCE_CONFIG } from '../config';

describe('Configuration', () => {
    describe('AI_CONFIG', () => {
        it('should have valid speed defaults', () => {
            expect(AI_CONFIG.SPEED.DEFAULT).toBeGreaterThan(0);
            expect(AI_CONFIG.SPEED.STRAFE).toBeGreaterThan(0);
            expect(AI_CONFIG.SPEED.SWARM).toBeGreaterThan(0);
            expect(AI_CONFIG.SPEED.FLANK).toBeGreaterThan(0);
        });

        it('should have valid behavior parameters', () => {
            expect(AI_CONFIG.BEHAVIOR.FLANK_DISTANCE_THRESHOLD).toBeGreaterThan(0);
            expect(AI_CONFIG.BEHAVIOR.STRAFE_FREQUENCY).toBeGreaterThan(0);
            expect(AI_CONFIG.BEHAVIOR.STRAFE_AMPLITUDE).toBeGreaterThan(0);
            expect(AI_CONFIG.BEHAVIOR.STRAFE_AMPLITUDE).toBeLessThanOrEqual(1);
        });

        it('should have valid teleport settings', () => {
            expect(AI_CONFIG.TELEPORT.EDGE_MARGIN).toBeGreaterThan(0);
            expect(AI_CONFIG.TELEPORT.MAX_ATTEMPTS).toBeGreaterThan(0);
        });
    });

    describe('RENDERING_CONFIG.STARFIELD', () => {
        it('should have valid starfield settings', () => {
            expect(RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_Y).toBeGreaterThan(0);
            expect(RENDERING_CONFIG.STARFIELD.LAYER_COUNT).toBeGreaterThan(0);
        });

        it('should have default scroll speeds defined', () => {
            expect(RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_X).toBe(0);
            expect(RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_Y).toBe(100);
        });
    });

    describe('WAVE_CONFIG.FORMATION', () => {
        it('should have valid formation settings', () => {
            expect(WAVE_CONFIG.FORMATION.DEFAULT_CLUSTER_RADIUS).toBeGreaterThan(0);
            expect(WAVE_CONFIG.FORMATION.V_FORMATION_SPACING).toBeGreaterThan(0);
        });
    });

    describe('PERFORMANCE_CONFIG.ERROR_LOG', () => {
        it('should have valid error log settings', () => {
            expect(PERFORMANCE_CONFIG.ERROR_LOG.MAX_SIZE).toBeGreaterThan(0);
        });
    });
});
