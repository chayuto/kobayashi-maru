import { describe, it, expect } from 'vitest';
import { SCORE_CONFIG } from '../config/score.config';
import { AUTOPLAY_CONFIG } from '../config/autoplay.config';
import { UI_CONFIG } from '../config/ui.config';
import { RENDERING_CONFIG } from '../config/rendering.config';
import { PERFORMANCE_CONFIG } from '../config/performance.config';
import { COMBAT_CONFIG } from '../config/combat.config';
import { WAVE_CONFIG } from '../config/wave.config';

// =============================================================================
// Score Config
// =============================================================================

describe('Config: Score', () => {
    it('should export SCORE_CONFIG as a defined object', () => {
        expect(SCORE_CONFIG).toBeDefined();
        expect(typeof SCORE_CONFIG).toBe('object');
    });

    it('should have a COMBO section with TIMEOUT and TIERS', () => {
        expect(SCORE_CONFIG.COMBO).toBeDefined();
        expect(SCORE_CONFIG.COMBO.TIMEOUT).toBeDefined();
        expect(SCORE_CONFIG.COMBO.TIERS).toBeDefined();
    });

    it('should have a positive combo timeout value', () => {
        expect(SCORE_CONFIG.COMBO.TIMEOUT).toBeGreaterThan(0);
    });

    it('should have combo tiers as a non-empty array', () => {
        expect(Array.isArray(SCORE_CONFIG.COMBO.TIERS)).toBe(true);
        expect(SCORE_CONFIG.COMBO.TIERS.length).toBeGreaterThan(0);
    });

    it('should have combo tiers sorted by threshold ascending', () => {
        const tiers = SCORE_CONFIG.COMBO.TIERS;
        for (let i = 1; i < tiers.length; i++) {
            expect(tiers[i].threshold).toBeGreaterThan(tiers[i - 1].threshold);
        }
    });

    it('should have all combo tier multipliers as positive numbers', () => {
        for (const tier of SCORE_CONFIG.COMBO.TIERS) {
            expect(tier.multiplier).toBeGreaterThan(0);
        }
    });

    it('should start combo tiers at threshold 0 with multiplier 1', () => {
        expect(SCORE_CONFIG.COMBO.TIERS[0].threshold).toBe(0);
        expect(SCORE_CONFIG.COMBO.TIERS[0].multiplier).toBe(1);
    });

    it('should have combo tier multipliers that increase with threshold', () => {
        const tiers = SCORE_CONFIG.COMBO.TIERS;
        for (let i = 1; i < tiers.length; i++) {
            expect(tiers[i].multiplier).toBeGreaterThanOrEqual(tiers[i - 1].multiplier);
        }
    });
});

// =============================================================================
// Autoplay Config
// =============================================================================

describe('Config: Autoplay', () => {
    it('should export AUTOPLAY_CONFIG as a defined object', () => {
        expect(AUTOPLAY_CONFIG).toBeDefined();
        expect(typeof AUTOPLAY_CONFIG).toBe('object');
    });

    it('should have ENABLED_BY_DEFAULT as a boolean', () => {
        expect(typeof AUTOPLAY_CONFIG.ENABLED_BY_DEFAULT).toBe('boolean');
    });

    it('should have positive timing intervals', () => {
        expect(AUTOPLAY_CONFIG.DECISION_INTERVAL_MS).toBeGreaterThan(0);
        expect(AUTOPLAY_CONFIG.PLACEMENT_COOLDOWN_MS).toBeGreaterThan(0);
        expect(AUTOPLAY_CONFIG.UPGRADE_COOLDOWN_MS).toBeGreaterThan(0);
    });

    it('should have positive sector grid dimensions', () => {
        expect(AUTOPLAY_CONFIG.SECTOR_GRID_COLS).toBeGreaterThan(0);
        expect(AUTOPLAY_CONFIG.SECTOR_GRID_ROWS).toBeGreaterThan(0);
    });

    it('should have positive threat prediction seconds', () => {
        expect(AUTOPLAY_CONFIG.THREAT_PREDICTION_SECONDS).toBeGreaterThan(0);
    });

    it('should have positive optimal KM distance', () => {
        expect(AUTOPLAY_CONFIG.OPTIMAL_KM_DISTANCE).toBeGreaterThan(0);
    });

    it('should have coverage overlap penalty between 0 and 1', () => {
        expect(AUTOPLAY_CONFIG.COVERAGE_OVERLAP_PENALTY).toBeGreaterThanOrEqual(0);
        expect(AUTOPLAY_CONFIG.COVERAGE_OVERLAP_PENALTY).toBeLessThanOrEqual(1);
    });

    it('should have threat intercept weight between 0 and 1', () => {
        expect(AUTOPLAY_CONFIG.THREAT_INTERCEPT_WEIGHT).toBeGreaterThanOrEqual(0);
        expect(AUTOPLAY_CONFIG.THREAT_INTERCEPT_WEIGHT).toBeLessThanOrEqual(1);
    });

    it('should have defensive distance weight between 0 and 1', () => {
        expect(AUTOPLAY_CONFIG.DEFENSIVE_DISTANCE_WEIGHT).toBeGreaterThanOrEqual(0);
        expect(AUTOPLAY_CONFIG.DEFENSIVE_DISTANCE_WEIGHT).toBeLessThanOrEqual(1);
    });

    it('should have a non-negative emergency reserve', () => {
        expect(AUTOPLAY_CONFIG.EMERGENCY_RESERVE).toBeGreaterThanOrEqual(0);
    });

    it('should have upgrade threshold between 0 and 1', () => {
        expect(AUTOPLAY_CONFIG.UPGRADE_THRESHOLD).toBeGreaterThanOrEqual(0);
        expect(AUTOPLAY_CONFIG.UPGRADE_THRESHOLD).toBeLessThanOrEqual(1);
    });

    it('should have threat levels in ascending order', () => {
        const tl = AUTOPLAY_CONFIG.THREAT_LEVEL;
        expect(tl.LOW).toBeLessThan(tl.MEDIUM);
        expect(tl.MEDIUM).toBeLessThan(tl.HIGH);
        expect(tl.HIGH).toBeLessThan(tl.CRITICAL);
    });

    it('should have all threat level values as positive numbers', () => {
        const tl = AUTOPLAY_CONFIG.THREAT_LEVEL;
        expect(tl.LOW).toBeGreaterThan(0);
        expect(tl.MEDIUM).toBeGreaterThan(0);
        expect(tl.HIGH).toBeGreaterThan(0);
        expect(tl.CRITICAL).toBeGreaterThan(0);
    });

    it('should have positive faction threat modifiers for all factions', () => {
        const modifiers = AUTOPLAY_CONFIG.FACTION_THREAT_MODIFIERS;
        for (const key of Object.keys(modifiers)) {
            expect(modifiers[Number(key)]).toBeGreaterThan(0);
        }
    });

    it('should have turret-faction effectiveness values that are positive', () => {
        const effectiveness = AUTOPLAY_CONFIG.TURRET_FACTION_EFFECTIVENESS;
        for (const turretKey of Object.keys(effectiveness)) {
            const factionMap = effectiveness[Number(turretKey)];
            for (const factionKey of Object.keys(factionMap)) {
                expect(factionMap[Number(factionKey)]).toBeGreaterThan(0);
            }
        }
    });

    it('should have personality risk tolerances between 0 and 1', () => {
        const personalities = AUTOPLAY_CONFIG.PERSONALITIES;
        for (const name of Object.keys(personalities) as Array<keyof typeof personalities>) {
            expect(personalities[name].riskTolerance).toBeGreaterThanOrEqual(0);
            expect(personalities[name].riskTolerance).toBeLessThanOrEqual(1);
        }
    });

    it('should have all expected personality types defined', () => {
        expect(AUTOPLAY_CONFIG.PERSONALITIES.BALANCED).toBeDefined();
        expect(AUTOPLAY_CONFIG.PERSONALITIES.AGGRESSIVE).toBeDefined();
        expect(AUTOPLAY_CONFIG.PERSONALITIES.DEFENSIVE).toBeDefined();
        expect(AUTOPLAY_CONFIG.PERSONALITIES.ECONOMIC).toBeDefined();
        expect(AUTOPLAY_CONFIG.PERSONALITIES.ADAPTIVE).toBeDefined();
    });
});

// =============================================================================
// UI Config
// =============================================================================

describe('Config: UI', () => {
    it('should export UI_CONFIG as a defined object', () => {
        expect(UI_CONFIG).toBeDefined();
        expect(typeof UI_CONFIG).toBe('object');
    });

    it('should have positive spacing values', () => {
        expect(UI_CONFIG.SPACING.PADDING).toBeGreaterThan(0);
        expect(UI_CONFIG.SPACING.PANEL_GAP).toBeGreaterThan(0);
        expect(UI_CONFIG.SPACING.ELEMENT_GAP).toBeGreaterThan(0);
    });

    it('should have positive padding values in ascending order', () => {
        expect(UI_CONFIG.PADDING.SMALL).toBeGreaterThan(0);
        expect(UI_CONFIG.PADDING.NORMAL).toBeGreaterThan(UI_CONFIG.PADDING.SMALL);
        expect(UI_CONFIG.PADDING.LARGE).toBeGreaterThan(UI_CONFIG.PADDING.NORMAL);
    });

    it('should have positive margin values in ascending order', () => {
        expect(UI_CONFIG.MARGIN.SMALL).toBeGreaterThan(0);
        expect(UI_CONFIG.MARGIN.NORMAL).toBeGreaterThan(UI_CONFIG.MARGIN.SMALL);
        expect(UI_CONFIG.MARGIN.LARGE).toBeGreaterThan(UI_CONFIG.MARGIN.NORMAL);
    });

    it('should have positive button dimensions', () => {
        expect(UI_CONFIG.BUTTONS.TOGGLE_WIDTH).toBeGreaterThan(0);
        expect(UI_CONFIG.BUTTONS.TOGGLE_HEIGHT).toBeGreaterThan(0);
        expect(UI_CONFIG.BUTTONS.TURRET_BUTTON_SIZE).toBeGreaterThan(0);
        expect(UI_CONFIG.BUTTONS.CORNER_RADIUS).toBeGreaterThan(0);
    });

    it('should have positive bar dimensions', () => {
        expect(UI_CONFIG.BARS.WIDTH).toBeGreaterThan(0);
        expect(UI_CONFIG.BARS.HEIGHT).toBeGreaterThan(0);
        expect(UI_CONFIG.BARS.BORDER_WIDTH).toBeGreaterThan(0);
    });

    it('should have font sizes in ascending order', () => {
        expect(UI_CONFIG.FONTS.SIZE_SMALL).toBeGreaterThan(0);
        expect(UI_CONFIG.FONTS.SIZE_MEDIUM).toBeGreaterThan(UI_CONFIG.FONTS.SIZE_SMALL);
        expect(UI_CONFIG.FONTS.SIZE_LARGE).toBeGreaterThan(UI_CONFIG.FONTS.SIZE_MEDIUM);
        expect(UI_CONFIG.FONTS.SIZE_XLARGE).toBeGreaterThan(UI_CONFIG.FONTS.SIZE_LARGE);
    });

    it('should have a non-empty font family string', () => {
        expect(typeof UI_CONFIG.FONTS.FAMILY).toBe('string');
        expect(UI_CONFIG.FONTS.FAMILY.length).toBeGreaterThan(0);
    });

    it('should have all expected color keys defined as numbers', () => {
        const colors = UI_CONFIG.COLORS;
        const expectedKeys: Array<keyof typeof colors> = [
            'PRIMARY', 'SECONDARY', 'BACKGROUND', 'BORDER', 'TEXT',
            'LABEL', 'VALUE', 'HEALTH', 'SHIELD', 'DANGER',
            'WARNING', 'SUCCESS', 'DISABLED',
            'FEDERATION', 'KLINGON', 'ROMULAN', 'BORG',
        ];
        for (const key of expectedKeys) {
            expect(colors[key]).toBeDefined();
            expect(typeof colors[key]).toBe('number');
        }
    });

    it('should have all panels with positive width and height', () => {
        const panels = UI_CONFIG.PANELS;
        const panelKeys: Array<keyof typeof panels> = [
            'RESOURCE', 'WAVE', 'SCORE', 'COMBO', 'STATUS',
            'TURRET_MENU', 'UPGRADE', 'COMBAT_STATS', 'TURRET_COUNT',
        ];
        for (const key of panelKeys) {
            expect(panels[key].WIDTH).toBeGreaterThan(0);
            expect(panels[key].HEIGHT).toBeGreaterThan(0);
        }
    });

    it('should have positive animation durations', () => {
        expect(UI_CONFIG.ANIMATION.FADE_DURATION).toBeGreaterThan(0);
        expect(UI_CONFIG.ANIMATION.SLIDE_DURATION).toBeGreaterThan(0);
        expect(UI_CONFIG.ANIMATION.PULSE_SPEED).toBeGreaterThan(0);
    });

    it('should have z-index values in ascending layer order', () => {
        const z = UI_CONFIG.Z_INDEX;
        expect(z.BACKGROUND).toBeLessThan(z.GAME);
        expect(z.GAME).toBeLessThan(z.HUD);
        expect(z.HUD).toBeLessThan(z.OVERLAY);
        expect(z.OVERLAY).toBeLessThan(z.MODAL);
        expect(z.MODAL).toBeLessThan(z.TOAST);
    });

    it('should have positive interaction radii', () => {
        expect(UI_CONFIG.INTERACTION.TURRET_CLICK_RADIUS).toBeGreaterThan(0);
        expect(UI_CONFIG.INTERACTION.ENEMY_SELECT_RADIUS).toBeGreaterThan(0);
    });
});

// =============================================================================
// Rendering Config
// =============================================================================

describe('Config: Rendering', () => {
    it('should export RENDERING_CONFIG as a defined object', () => {
        expect(RENDERING_CONFIG).toBeDefined();
        expect(typeof RENDERING_CONFIG).toBe('object');
    });

    it('should have positive particle system limits', () => {
        expect(RENDERING_CONFIG.PARTICLES.MAX_COUNT).toBeGreaterThan(0);
        expect(RENDERING_CONFIG.PARTICLES.POOL_SIZE).toBeGreaterThan(0);
        expect(RENDERING_CONFIG.PARTICLES.BATCH_SIZE).toBeGreaterThan(0);
    });

    it('should have pool size less than or equal to max count', () => {
        expect(RENDERING_CONFIG.PARTICLES.POOL_SIZE).toBeLessThanOrEqual(
            RENDERING_CONFIG.PARTICLES.MAX_COUNT
        );
    });

    it('should have batch size less than or equal to pool size', () => {
        expect(RENDERING_CONFIG.PARTICLES.BATCH_SIZE).toBeLessThanOrEqual(
            RENDERING_CONFIG.PARTICLES.POOL_SIZE
        );
    });

    it('should have sprite index values defined as numbers', () => {
        expect(typeof RENDERING_CONFIG.SPRITES.INDEX_UNSET).toBe('number');
        expect(typeof RENDERING_CONFIG.SPRITES.PLACEHOLDER_INDEX).toBe('number');
    });

    it('should have positive texture sizes', () => {
        expect(RENDERING_CONFIG.TEXTURES.SHAPE_SIZE).toBeGreaterThan(0);
        expect(RENDERING_CONFIG.TEXTURES.DEFAULT_SIZE).toBeGreaterThan(0);
        expect(RENDERING_CONFIG.TEXTURES.CACHE_LIMIT).toBeGreaterThan(0);
    });

    it('should have positive max glow strength', () => {
        expect(RENDERING_CONFIG.GLOW.MAX_STRENGTH).toBeGreaterThan(0);
    });

    it('should have starfield layer count matching array lengths', () => {
        const sf = RENDERING_CONFIG.STARFIELD;
        expect(sf.LAYER_COUNT).toBeGreaterThan(0);
        expect(sf.STARS_PER_LAYER.length).toBe(sf.LAYER_COUNT);
        expect(sf.PARALLAX_SPEEDS.length).toBe(sf.LAYER_COUNT);
    });

    it('should have positive stars per layer values', () => {
        for (const count of RENDERING_CONFIG.STARFIELD.STARS_PER_LAYER) {
            expect(count).toBeGreaterThan(0);
        }
    });

    it('should have parallax speeds between 0 and 1', () => {
        for (const speed of RENDERING_CONFIG.STARFIELD.PARALLAX_SPEEDS) {
            expect(speed).toBeGreaterThan(0);
            expect(speed).toBeLessThanOrEqual(1);
        }
    });

    it('should have screen shake decay rate between 0 and 1', () => {
        expect(RENDERING_CONFIG.SCREEN_SHAKE.DECAY_RATE).toBeGreaterThan(0);
        expect(RENDERING_CONFIG.SCREEN_SHAKE.DECAY_RATE).toBeLessThanOrEqual(1);
    });

    it('should have positive screen shake max offset', () => {
        expect(RENDERING_CONFIG.SCREEN_SHAKE.MAX_OFFSET).toBeGreaterThan(0);
    });
});

// =============================================================================
// Performance Config
// =============================================================================

describe('Config: Performance', () => {
    it('should export PERFORMANCE_CONFIG as a defined object', () => {
        expect(PERFORMANCE_CONFIG).toBeDefined();
        expect(typeof PERFORMANCE_CONFIG).toBe('object');
    });

    it('should have positive monitoring window size', () => {
        expect(PERFORMANCE_CONFIG.MONITORING.AVERAGE_WINDOW_SIZE).toBeGreaterThan(0);
    });

    it('should have positive memory update interval', () => {
        expect(PERFORMANCE_CONFIG.MONITORING.MEMORY_UPDATE_INTERVAL_MS).toBeGreaterThan(0);
    });

    it('should have positive debug budget threshold', () => {
        expect(PERFORMANCE_CONFIG.DEBUG.BUDGET_THRESHOLD_MS).toBeGreaterThan(0);
    });

    it('should have quality multipliers between 0 and 1 inclusive', () => {
        expect(PERFORMANCE_CONFIG.QUALITY.LOW_PARTICLE_MULTIPLIER).toBeGreaterThan(0);
        expect(PERFORMANCE_CONFIG.QUALITY.LOW_PARTICLE_MULTIPLIER).toBeLessThanOrEqual(1);
        expect(PERFORMANCE_CONFIG.QUALITY.MEDIUM_PARTICLE_MULTIPLIER).toBeGreaterThan(0);
        expect(PERFORMANCE_CONFIG.QUALITY.MEDIUM_PARTICLE_MULTIPLIER).toBeLessThanOrEqual(1);
        expect(PERFORMANCE_CONFIG.QUALITY.HIGH_PARTICLE_MULTIPLIER).toBeGreaterThan(0);
        expect(PERFORMANCE_CONFIG.QUALITY.HIGH_PARTICLE_MULTIPLIER).toBeLessThanOrEqual(1);
    });

    it('should have quality multipliers in ascending order', () => {
        expect(PERFORMANCE_CONFIG.QUALITY.LOW_PARTICLE_MULTIPLIER).toBeLessThan(
            PERFORMANCE_CONFIG.QUALITY.MEDIUM_PARTICLE_MULTIPLIER
        );
        expect(PERFORMANCE_CONFIG.QUALITY.MEDIUM_PARTICLE_MULTIPLIER).toBeLessThan(
            PERFORMANCE_CONFIG.QUALITY.HIGH_PARTICLE_MULTIPLIER
        );
    });

    it('should have positive error log max size', () => {
        expect(PERFORMANCE_CONFIG.ERROR_LOG.MAX_SIZE).toBeGreaterThan(0);
    });
});

// =============================================================================
// Combat Config
// =============================================================================

describe('Config: Combat', () => {
    it('should export COMBAT_CONFIG as a defined object', () => {
        expect(COMBAT_CONFIG).toBeDefined();
        expect(typeof COMBAT_CONFIG).toBe('object');
    });

    it('should have positive beam min length', () => {
        expect(COMBAT_CONFIG.BEAM.MIN_LENGTH).toBeGreaterThan(0);
    });

    it('should have positive beam segment count', () => {
        expect(COMBAT_CONFIG.BEAM.SEGMENT_COUNT).toBeGreaterThan(0);
    });

    it('should have positive max charge radius', () => {
        expect(COMBAT_CONFIG.BEAM.MAX_CHARGE_RADIUS).toBeGreaterThan(0);
    });

    it('should have base core alpha between 0 and 1', () => {
        expect(COMBAT_CONFIG.BEAM.BASE_CORE_ALPHA).toBeGreaterThan(0);
        expect(COMBAT_CONFIG.BEAM.BASE_CORE_ALPHA).toBeLessThanOrEqual(1);
    });

    it('should have pulse amplitude between 0 and 1', () => {
        expect(COMBAT_CONFIG.BEAM.PULSE_AMPLITUDE).toBeGreaterThan(0);
        expect(COMBAT_CONFIG.BEAM.PULSE_AMPLITUDE).toBeLessThanOrEqual(1);
    });

    it('should have positive pulse frequency', () => {
        expect(COMBAT_CONFIG.BEAM.PULSE_FREQUENCY).toBeGreaterThan(0);
    });

    it('should have all jitter values as positive numbers', () => {
        const jitter = COMBAT_CONFIG.BEAM.JITTER;
        expect(jitter.PHASER).toBeGreaterThan(0);
        expect(jitter.DISRUPTOR).toBeGreaterThan(0);
        expect(jitter.TETRYON).toBeGreaterThan(0);
        expect(jitter.POLARON).toBeGreaterThan(0);
        expect(jitter.PLASMA).toBeGreaterThan(0);
        expect(jitter.DEFAULT).toBeGreaterThan(0);
    });

    it('should have positive DPS window seconds', () => {
        expect(COMBAT_CONFIG.STATS.DPS_WINDOW_SECONDS).toBeGreaterThan(0);
    });

    it('should have positive projectile default speed', () => {
        expect(COMBAT_CONFIG.PROJECTILE.DEFAULT_SPEED).toBeGreaterThan(0);
    });

    it('should have positive projectile default lifetime', () => {
        expect(COMBAT_CONFIG.PROJECTILE.DEFAULT_LIFETIME).toBeGreaterThan(0);
    });
});

// =============================================================================
// Wave Config
// =============================================================================

describe('Config: Wave', () => {
    it('should export WAVE_CONFIG as a defined object', () => {
        expect(WAVE_CONFIG).toBeDefined();
        expect(typeof WAVE_CONFIG).toBe('object');
    });

    it('should have positive complete delay', () => {
        expect(WAVE_CONFIG.TIMING.COMPLETE_DELAY_MS).toBeGreaterThan(0);
    });

    it('should have positive initial grace period', () => {
        expect(WAVE_CONFIG.TIMING.INITIAL_GRACE_PERIOD_MS).toBeGreaterThan(0);
    });

    it('should have grace period greater than or equal to complete delay', () => {
        expect(WAVE_CONFIG.TIMING.INITIAL_GRACE_PERIOD_MS).toBeGreaterThanOrEqual(
            WAVE_CONFIG.TIMING.COMPLETE_DELAY_MS
        );
    });

    it('should have positive max spawns per frame', () => {
        expect(WAVE_CONFIG.SPAWN.MAX_SPAWNS_PER_FRAME).toBeGreaterThan(0);
    });

    it('should have positive edge margin', () => {
        expect(WAVE_CONFIG.SPAWN.EDGE_MARGIN).toBeGreaterThan(0);
    });

    it('should have positive max high scores count', () => {
        expect(WAVE_CONFIG.SCORING.MAX_HIGH_SCORES).toBeGreaterThan(0);
    });

    it('should have positive formation settings', () => {
        expect(WAVE_CONFIG.FORMATION.DEFAULT_CLUSTER_RADIUS).toBeGreaterThan(0);
        expect(WAVE_CONFIG.FORMATION.V_FORMATION_SPACING).toBeGreaterThan(0);
    });
});
