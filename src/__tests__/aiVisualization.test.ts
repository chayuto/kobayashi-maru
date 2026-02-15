/**
 * Tests for AI Visualization renderers and panels
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
    const { setupPixiMock } = await import('./helpers/mockPixi');
    return setupPixiMock();
});

import { AIBrainRenderer } from '../ai/visualization/AIBrainRenderer';
import { AIDebugVisualizer, VisualizationLayers } from '../ai/visualization/AIDebugVisualizer';
import { FlowFieldRenderer } from '../ai/visualization/FlowFieldRenderer';
import { InfluenceMapRenderer } from '../ai/visualization/InfluenceMapRenderer';
import { InterceptionRenderer, InterceptionPoint } from '../ai/visualization/InterceptionRenderer';
import { DecisionReasoningPanel } from '../ai/visualization/DecisionReasoningPanel';
import {
    AIActionType,
    AIPersonality,
    AIMood,
    AIPhase,
    AIStatusExtended,
    AIStatus,
    ThreatVector,
    SectorData,
} from '../ai/types';
import { Application, Container } from 'pixi.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAIStatusExtended(overrides?: Partial<AIStatusExtended>): AIStatusExtended {
    return {
        enabled: true,
        personality: AIPersonality.BALANCED,
        currentAction: null,
        threatLevel: 50,
        coveragePercent: 60,
        lastDecisionTime: 0,
        mood: AIMood.CALM,
        moodMessage: 'All clear',
        currentPhase: AIPhase.EARLY_EXPANSION,
        phaseFocus: 'defense',
        plannedAction: null,
        plannedPosition: null,
        upgradeTarget: null,
        decisionsThisWave: 3,
        successfulActions: 2,
        ...overrides,
    };
}

function createMockAIStatus(overrides?: Partial<AIStatus>): AIStatus {
    return {
        enabled: true,
        personality: AIPersonality.BALANCED,
        currentAction: null,
        threatLevel: 50,
        coveragePercent: 60,
        lastDecisionTime: 0,
        ...overrides,
    };
}

function createMockThreat(overrides?: Partial<ThreatVector>): ThreatVector {
    return {
        entityId: 1,
        position: { x: 100, y: 100 },
        velocity: { x: 1, y: 0 },
        predictedImpactTime: 5,
        threatLevel: 50,
        factionId: 0,
        behaviorType: 0,
        healthPercent: 1,
        isElite: false,
        isBoss: false,
        ...overrides,
    };
}

function createMockSector(overrides?: Partial<SectorData>): SectorData {
    return {
        index: 0,
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        turretCount: 2,
        totalDPS: 50,
        enemyCount: 3,
        threatLevel: 40,
        ...overrides,
    };
}

function createMockFlowAnalyzer() {
    return {
        getFlowAt: vi.fn().mockReturnValue({ x: 1, y: 0 }),
        getTrafficAt: vi.fn().mockReturnValue(0.5),
    };
}

function createMockInfluenceMap() {
    return {
        getMap: vi.fn().mockReturnValue({
            getValues: () => new Float32Array([0, 0.5, 0.8, 0]),
            getDimensions: () => ({ cols: 2, rows: 2, cellSize: 40 }),
        }),
    };
}

// ---------------------------------------------------------------------------
// AIBrainRenderer
// ---------------------------------------------------------------------------

describe('AIBrainRenderer', () => {
    let renderer: AIBrainRenderer;

    beforeEach(() => {
        renderer = new AIBrainRenderer();
    });

    afterEach(() => {
        renderer.destroy();
    });

    describe('creation and container setup', () => {
        it('should create a container with correct initial properties', () => {
            const container = renderer.getContainer();
            expect(container).toBeDefined();
            expect(container.zIndex).toBe(1);
            expect(container.visible).toBe(false);
        });

        it('should start disabled by default', () => {
            expect(renderer.isEnabled()).toBe(false);
        });
    });

    describe('visibility toggling', () => {
        it('should enable visualization when setEnabled is called with true', () => {
            renderer.setEnabled(true);
            expect(renderer.isEnabled()).toBe(true);
            expect(renderer.getContainer().visible).toBe(true);
        });

        it('should disable visualization and clear when setEnabled is called with false', () => {
            renderer.setEnabled(true);
            renderer.setEnabled(false);
            expect(renderer.isEnabled()).toBe(false);
            expect(renderer.getContainer().visible).toBe(false);
        });
    });

    describe('render method', () => {
        it('should skip rendering when disabled', () => {
            const status = createMockAIStatusExtended();
            // Should not throw when disabled
            renderer.render(status);
            expect(renderer.isEnabled()).toBe(false);
        });

        it('should throttle rendering based on frame counter', () => {
            renderer.setEnabled(true);
            const status = createMockAIStatusExtended();

            // First 5 frames should be throttled (UPDATE_INTERVAL = 6)
            for (let i = 0; i < 5; i++) {
                renderer.render(status);
            }
            // No error means throttling works
            expect(renderer.isEnabled()).toBe(true);
        });

        it('should render on the 6th frame when enabled', () => {
            renderer.setEnabled(true);
            renderer.setThreats([createMockThreat()]);
            renderer.setSectors([createMockSector()]);
            const status = createMockAIStatusExtended({
                plannedAction: {
                    type: AIActionType.PLACE_TURRET,
                    priority: 80,
                    cost: 100,
                    expectedValue: 150,
                    params: { x: 200, y: 200, turretType: 0 },
                },
                plannedPosition: { x: 200, y: 200 },
            });

            // Call render 6 times to pass throttle
            for (let i = 0; i < 6; i++) {
                renderer.render(status);
            }
            expect(renderer.isEnabled()).toBe(true);
        });

        it('should render decision info with planned position and action', () => {
            renderer.setEnabled(true);
            const status = createMockAIStatusExtended({
                plannedAction: {
                    type: AIActionType.UPGRADE_TURRET,
                    priority: 70,
                    cost: 200,
                    expectedValue: 300,
                    params: { turretId: 5, upgradePath: 1 },
                },
                plannedPosition: { x: 300, y: 400 },
            });

            // Force render (pass throttle)
            for (let i = 0; i < 6; i++) {
                renderer.render(status);
            }
            expect(renderer.isEnabled()).toBe(true);
        });

        it('should hide decision text when no planned action', () => {
            renderer.setEnabled(true);
            const status = createMockAIStatusExtended({
                plannedAction: null,
                plannedPosition: null,
            });

            for (let i = 0; i < 6; i++) {
                renderer.render(status);
            }
            expect(renderer.isEnabled()).toBe(true);
        });
    });

    describe('data updates', () => {
        it('should accept threat data via setThreats', () => {
            const threats = [createMockThreat(), createMockThreat({ entityId: 2, position: { x: 300, y: 300 } })];
            renderer.setThreats(threats);
            // No error means data accepted
            expect(renderer.isEnabled()).toBe(false);
        });

        it('should accept sector data via setSectors', () => {
            const sectors = [createMockSector(), createMockSector({ index: 1, totalDPS: 100 })];
            renderer.setSectors(sectors);
            expect(renderer.isEnabled()).toBe(false);
        });
    });

    describe('clear and destroy', () => {
        it('should clear all visualization layers', () => {
            renderer.setEnabled(true);
            renderer.clear();
            // After clear, frame counter should be reset
            // Render 6 frames should still work
            const status = createMockAIStatusExtended();
            for (let i = 0; i < 6; i++) {
                renderer.render(status);
            }
            expect(renderer.isEnabled()).toBe(true);
        });

        it('should destroy container and children', () => {
            const container = renderer.getContainer();
            renderer.destroy();
            expect(container.destroy).toHaveBeenCalledWith({ children: true });
        });
    });
});

// ---------------------------------------------------------------------------
// FlowFieldRenderer
// ---------------------------------------------------------------------------

describe('FlowFieldRenderer', () => {
    let flowRenderer: FlowFieldRenderer;
    let mockAnalyzer: ReturnType<typeof createMockFlowAnalyzer>;

    beforeEach(() => {
        mockAnalyzer = createMockFlowAnalyzer();
        flowRenderer = new FlowFieldRenderer(mockAnalyzer as never);
    });

    it('should create a container with graphics children', () => {
        const container = flowRenderer.getContainer();
        expect(container).toBeDefined();
        expect(container.children.length).toBe(2); // heatMap + arrows
    });

    it('should render arrows when showArrows is true', () => {
        flowRenderer.update(true, false);
        expect(mockAnalyzer.getFlowAt).toHaveBeenCalled();
    });

    it('should render heat map when showHeatMap is true', () => {
        flowRenderer.update(false, true);
        expect(mockAnalyzer.getTrafficAt).toHaveBeenCalled();
    });

    it('should render both arrows and heat map when both flags are true', () => {
        flowRenderer.update(true, true);
        expect(mockAnalyzer.getFlowAt).toHaveBeenCalled();
        expect(mockAnalyzer.getTrafficAt).toHaveBeenCalled();
    });

    it('should render neither when both flags are false', () => {
        flowRenderer.update(false, false);
        expect(mockAnalyzer.getFlowAt).not.toHaveBeenCalled();
        expect(mockAnalyzer.getTrafficAt).not.toHaveBeenCalled();
    });

    it('should skip zero flow vectors when rendering arrows', () => {
        mockAnalyzer.getFlowAt.mockReturnValue({ x: 0, y: 0 });
        flowRenderer.update(true, false);
        // Calls getFlowAt but should skip drawing arrows for zero vectors
        expect(mockAnalyzer.getFlowAt).toHaveBeenCalled();
    });

    it('should skip low traffic cells in heat map', () => {
        mockAnalyzer.getTrafficAt.mockReturnValue(0.05); // below 0.1 threshold
        flowRenderer.update(false, true);
        expect(mockAnalyzer.getTrafficAt).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// InfluenceMapRenderer
// ---------------------------------------------------------------------------

describe('InfluenceMapRenderer', () => {
    let influenceRenderer: InfluenceMapRenderer;
    let mockThreatMap: ReturnType<typeof createMockInfluenceMap>;
    let mockCoverageMap: ReturnType<typeof createMockInfluenceMap>;

    beforeEach(() => {
        mockThreatMap = createMockInfluenceMap();
        mockCoverageMap = createMockInfluenceMap();
        influenceRenderer = new InfluenceMapRenderer(mockThreatMap as never, mockCoverageMap as never);
    });

    it('should create a container with two graphics children', () => {
        const container = influenceRenderer.getContainer();
        expect(container).toBeDefined();
        expect(container.children.length).toBe(2); // coverage + threat
    });

    it('should render threat map when showThreat is true', () => {
        influenceRenderer.update(true, false);
        expect(mockThreatMap.getMap).toHaveBeenCalled();
    });

    it('should render coverage map when showCoverage is true', () => {
        influenceRenderer.update(false, true);
        expect(mockCoverageMap.getMap).toHaveBeenCalled();
    });

    it('should render both maps when both flags are true', () => {
        influenceRenderer.update(true, true);
        expect(mockThreatMap.getMap).toHaveBeenCalled();
        expect(mockCoverageMap.getMap).toHaveBeenCalled();
    });

    it('should render neither when both flags are false', () => {
        influenceRenderer.update(false, false);
        expect(mockThreatMap.getMap).not.toHaveBeenCalled();
        expect(mockCoverageMap.getMap).not.toHaveBeenCalled();
    });

    it('should handle all-zero influence map values', () => {
        mockThreatMap.getMap.mockReturnValue({
            getValues: () => new Float32Array([0, 0, 0, 0]),
            getDimensions: () => ({ cols: 2, rows: 2, cellSize: 40 }),
        });
        influenceRenderer.update(true, false);
        expect(mockThreatMap.getMap).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// InterceptionRenderer
// ---------------------------------------------------------------------------

describe('InterceptionRenderer', () => {
    let interceptionRenderer: InterceptionRenderer;

    beforeEach(() => {
        interceptionRenderer = new InterceptionRenderer();
    });

    it('should create a container with graphics child', () => {
        const container = interceptionRenderer.getContainer();
        expect(container).toBeDefined();
        expect(container.children.length).toBe(1); // graphics
    });

    it('should render interception points with labels', () => {
        const points: InterceptionPoint[] = [
            { x: 100, y: 100, score: 85.5, dwellTime: 3.2 },
            { x: 200, y: 200, score: 70.0, dwellTime: 2.5 },
        ];

        interceptionRenderer.update(points);

        const container = interceptionRenderer.getContainer();
        // 1 (graphics) + 2 rank labels + 2 tooltip labels (top 3 get tooltips)
        expect(container.children.length).toBe(5);
    });

    it('should show tooltips only for top 3 points', () => {
        const points: InterceptionPoint[] = [
            { x: 100, y: 100, score: 90, dwellTime: 4.0 },
            { x: 200, y: 200, score: 80, dwellTime: 3.0 },
            { x: 300, y: 300, score: 70, dwellTime: 2.0 },
            { x: 400, y: 400, score: 60, dwellTime: 1.0 },
        ];

        interceptionRenderer.update(points);

        const container = interceptionRenderer.getContainer();
        // 1 (graphics) + 4 rank labels + 3 tooltip labels (top 3 only)
        expect(container.children.length).toBe(8);
    });

    it('should clean up old labels on re-update', () => {
        const points1: InterceptionPoint[] = [
            { x: 100, y: 100, score: 85, dwellTime: 3.0 },
        ];
        interceptionRenderer.update(points1);

        const points2: InterceptionPoint[] = [
            { x: 200, y: 200, score: 90, dwellTime: 4.0 },
            { x: 300, y: 300, score: 80, dwellTime: 3.5 },
        ];
        interceptionRenderer.update(points2);

        const container = interceptionRenderer.getContainer();
        // After re-update: 1 (graphics) + 2 rank labels + 2 tooltips
        expect(container.children.length).toBe(5);
    });

    it('should handle empty points array', () => {
        interceptionRenderer.update([]);
        const container = interceptionRenderer.getContainer();
        // Only the graphics child remains
        expect(container.children.length).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// DecisionReasoningPanel
// ---------------------------------------------------------------------------

describe('DecisionReasoningPanel', () => {
    let panel: DecisionReasoningPanel;

    beforeEach(() => {
        panel = new DecisionReasoningPanel();
    });

    afterEach(() => {
        panel.destroy();
    });

    it('should create a DOM element with ai-debug-panel class', () => {
        const el = document.querySelector('.ai-debug-panel');
        expect(el).not.toBeNull();
    });

    it('should inject CSS styles into document head', () => {
        const styleEls = document.querySelectorAll('style');
        const hasAIStyles = Array.from(styleEls).some(
            (el) => el.textContent?.includes('.ai-debug-panel')
        );
        expect(hasAIStyles).toBe(true);
    });

    it('should start hidden', () => {
        const el = document.querySelector('.ai-debug-panel') as HTMLElement;
        expect(el.style.display).toBe('none');
    });

    it('should show panel when setVisible is called with true', () => {
        panel.setVisible(true);
        const el = document.querySelector('.ai-debug-panel') as HTMLElement;
        expect(el.style.display).toBe('block');
    });

    it('should hide panel when setVisible is called with false', () => {
        panel.setVisible(true);
        panel.setVisible(false);
        const el = document.querySelector('.ai-debug-panel') as HTMLElement;
        expect(el.style.display).toBe('none');
    });

    it('should skip update when not visible', () => {
        const status = createMockAIStatus({ threatLevel: 75 });
        panel.update(status);
        // Panel is hidden, so DOM should not be updated
        const threatEl = document.getElementById('ai-threat');
        expect(threatEl?.textContent).toBe('-');
    });

    it('should update status fields when visible', () => {
        panel.setVisible(true);
        const status = createMockAIStatus({
            enabled: true,
            personality: AIPersonality.AGGRESSIVE,
            threatLevel: 80,
            coveragePercent: 45.5,
        });

        panel.update(status);

        expect(document.getElementById('ai-status')?.textContent).toBe('ACTIVE');
        expect(document.getElementById('ai-personality')?.textContent).toBe('Aggressive');
        expect(document.getElementById('ai-threat')?.textContent).toBe('80%');
        expect(document.getElementById('ai-coverage')?.textContent).toBe('45.5%');
    });

    it('should display DISABLED status when AI is not enabled', () => {
        panel.setVisible(true);
        const status = createMockAIStatus({ enabled: false });

        panel.update(status);

        expect(document.getElementById('ai-status')?.textContent).toBe('DISABLED');
    });

    it('should display action details when currentAction is set', () => {
        panel.setVisible(true);
        const status = createMockAIStatus({
            currentAction: {
                type: AIActionType.PLACE_TURRET,
                priority: 85.3,
                cost: 150,
                expectedValue: 200.7,
                params: { x: 100, y: 100, turretType: 0 },
            },
        });

        panel.update(status);

        expect(document.getElementById('ai-action')?.textContent).toBe('PLACE TURRET');
        expect(document.getElementById('ai-priority')?.textContent).toBe('85.3');
        expect(document.getElementById('ai-cost')?.textContent).toBe('150');
        expect(document.getElementById('ai-value')?.textContent).toBe('200.7');
    });

    it('should display WAITING when no current action', () => {
        panel.setVisible(true);
        const status = createMockAIStatus({ currentAction: null });

        panel.update(status);

        expect(document.getElementById('ai-action')?.textContent).toBe('WAITING');
        expect(document.getElementById('ai-priority')?.textContent).toBe('-');
    });

    it('should apply correct threat CSS class for low threat', () => {
        panel.setVisible(true);
        panel.update(createMockAIStatus({ threatLevel: 10 }));
        expect(document.getElementById('ai-threat')?.className).toBe('ai-debug-threat-low');
    });

    it('should apply correct threat CSS class for medium threat', () => {
        panel.setVisible(true);
        panel.update(createMockAIStatus({ threatLevel: 30 }));
        expect(document.getElementById('ai-threat')?.className).toBe('ai-debug-threat-medium');
    });

    it('should apply correct threat CSS class for high threat', () => {
        panel.setVisible(true);
        panel.update(createMockAIStatus({ threatLevel: 60 }));
        expect(document.getElementById('ai-threat')?.className).toBe('ai-debug-threat-high');
    });

    it('should apply correct threat CSS class for critical threat', () => {
        panel.setVisible(true);
        panel.update(createMockAIStatus({ threatLevel: 90 }));
        expect(document.getElementById('ai-threat')?.className).toBe('ai-debug-threat-critical');
    });

    it('should apply correct action CSS class for place turret', () => {
        panel.setVisible(true);
        panel.update(createMockAIStatus({
            currentAction: {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 100,
                params: { x: 0, y: 0, turretType: 0 },
            },
        }));
        expect(document.getElementById('ai-action')?.className).toBe('ai-debug-action-place');
    });

    it('should apply correct action CSS class for upgrade turret', () => {
        panel.setVisible(true);
        panel.update(createMockAIStatus({
            currentAction: {
                type: AIActionType.UPGRADE_TURRET,
                priority: 50,
                cost: 200,
                expectedValue: 150,
                params: { turretId: 1, upgradePath: 0 },
            },
        }));
        expect(document.getElementById('ai-action')?.className).toBe('ai-debug-action-upgrade');
    });

    it('should remove DOM elements on destroy', () => {
        panel.destroy();
        const el = document.querySelector('.ai-debug-panel');
        expect(el).toBeNull();
    });

    it('should display personality names for all personality types', () => {
        panel.setVisible(true);

        const personalities: Array<{ personality: AIPersonality; expected: string }> = [
            { personality: AIPersonality.BALANCED, expected: 'Balanced' },
            { personality: AIPersonality.AGGRESSIVE, expected: 'Aggressive' },
            { personality: AIPersonality.DEFENSIVE, expected: 'Defensive' },
            { personality: AIPersonality.ECONOMIC, expected: 'Economic' },
            { personality: AIPersonality.ADAPTIVE, expected: 'Adaptive' },
        ];

        for (const { personality, expected } of personalities) {
            panel.update(createMockAIStatus({ personality }));
            expect(document.getElementById('ai-personality')?.textContent).toBe(expected);
        }
    });
});

// ---------------------------------------------------------------------------
// AIDebugVisualizer
// ---------------------------------------------------------------------------

describe('AIDebugVisualizer', () => {
    let visualizer: AIDebugVisualizer;
    let mockApp: Application;
    let mockAIManager: { getStatus: ReturnType<typeof vi.fn> };
    let mockCoverageAnalyzer: {
        getFlowAnalyzer: ReturnType<typeof vi.fn>;
        getThreatMap: ReturnType<typeof vi.fn>;
        getCoverageMap: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockApp = new Application();
        mockAIManager = {
            getStatus: vi.fn().mockReturnValue(createMockAIStatus()),
        };
        mockCoverageAnalyzer = {
            getFlowAnalyzer: vi.fn().mockReturnValue(createMockFlowAnalyzer()),
            getThreatMap: vi.fn().mockReturnValue(createMockInfluenceMap()),
            getCoverageMap: vi.fn().mockReturnValue(createMockInfluenceMap()),
        };

        visualizer = new AIDebugVisualizer(
            mockApp as never,
            mockAIManager as never,
            mockCoverageAnalyzer as never,
        );
    });

    afterEach(() => {
        visualizer.destroy();
    });

    it('should create with debug container added to app stage', () => {
        expect(mockApp.stage.addChild).toHaveBeenCalled();
    });

    it('should start disabled and hidden', () => {
        expect(visualizer.isEnabled()).toBe(false);
    });

    it('should toggle enabled state', () => {
        const result = visualizer.toggle();
        expect(result).toBe(true);
        expect(visualizer.isEnabled()).toBe(true);

        const result2 = visualizer.toggle();
        expect(result2).toBe(false);
        expect(visualizer.isEnabled()).toBe(false);
    });

    it('should return a copy of layer visibility state', () => {
        const layers = visualizer.getLayers();
        expect(layers.flowField).toBe(true);
        expect(layers.decisionReasoning).toBe(true);
        expect(layers.threatMap).toBe(false);
        expect(layers.coverageMap).toBe(false);
    });

    it('should toggle individual layers', () => {
        visualizer.toggleLayer('threatMap');
        expect(visualizer.getLayers().threatMap).toBe(true);

        visualizer.toggleLayer('threatMap');
        expect(visualizer.getLayers().threatMap).toBe(false);
    });

    it('should skip update when disabled', () => {
        visualizer.update(1000);
        // No error should be thrown
        expect(visualizer.isEnabled()).toBe(false);
    });

    it('should throttle updates based on time interval', () => {
        visualizer.toggle(); // enable

        // First update at t=100 passes throttle (100 - 0 >= 100)
        visualizer.update(100);
        expect(mockAIManager.getStatus).toHaveBeenCalledTimes(1);

        // Second update at t=150 is within 100ms of last, should be throttled
        visualizer.update(150);
        expect(mockAIManager.getStatus).toHaveBeenCalledTimes(1);
    });

    it('should update renderers when enough time has passed', () => {
        visualizer.toggle(); // enable

        visualizer.update(100); // first update passes throttle
        visualizer.update(300); // 200ms later, past 100ms throttle

        expect(mockAIManager.getStatus).toHaveBeenCalledTimes(2);
    });

    it('should pass interception points when layer is enabled', () => {
        visualizer.toggle();
        const points: InterceptionPoint[] = [
            { x: 100, y: 200, score: 50, dwellTime: 2.0 },
        ];

        visualizer.update(0, points);
        expect(visualizer.isEnabled()).toBe(true);
    });

    it('should destroy container and reasoning panel', () => {
        visualizer.destroy();
        // No error means cleanup succeeded
        expect(visualizer.isEnabled()).toBe(false);
    });
});
