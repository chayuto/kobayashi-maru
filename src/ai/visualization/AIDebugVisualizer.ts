/**
 * AIDebugVisualizer
 *
 * Main coordinator for AI debug visualization.
 * Manages all debug renderers and provides toggle controls.
 *
 * @module ai/visualization/AIDebugVisualizer
 */

import { Container, Application } from 'pixi.js';
import { FlowFieldRenderer } from './FlowFieldRenderer';
import { InfluenceMapRenderer } from './InfluenceMapRenderer';
import { InterceptionRenderer, InterceptionPoint } from './InterceptionRenderer';
import { DecisionReasoningPanel } from './DecisionReasoningPanel';
import type { AIAutoPlayManager } from '../AIAutoPlayManager';
import type { CoverageAnalyzer } from '../CoverageAnalyzer';

export interface VisualizationLayers {
    flowField: boolean;
    trafficDensity: boolean;
    threatMap: boolean;
    coverageMap: boolean;
    interceptionPoints: boolean;
    decisionReasoning: boolean;
}

export class AIDebugVisualizer {
    private container: Container;
    private app: Application;
    private aiManager: AIAutoPlayManager;

    private flowRenderer: FlowFieldRenderer;
    private influenceRenderer: InfluenceMapRenderer;
    private interceptionRenderer: InterceptionRenderer;
    private reasoningPanel: DecisionReasoningPanel;

    private enabled: boolean = false;
    private layers: VisualizationLayers = {
        flowField: true,
        trafficDensity: true,
        threatMap: false,
        coverageMap: false,
        interceptionPoints: true,
        decisionReasoning: true,
    };

    // Throttle updates for performance
    private lastUpdateTime: number = 0;
    private updateInterval: number = 100; // ms

    constructor(
        app: Application,
        aiManager: AIAutoPlayManager,
        coverageAnalyzer: CoverageAnalyzer
    ) {
        this.app = app;
        this.aiManager = aiManager;

        // Create debug container (rendered on top)
        this.container = new Container();
        this.container.visible = false;
        this.container.zIndex = 1000; // Above everything
        this.container.label = 'AIDebugVisualizer';

        // Initialize renderers
        this.flowRenderer = new FlowFieldRenderer(coverageAnalyzer.getFlowAnalyzer());
        this.influenceRenderer = new InfluenceMapRenderer(
            coverageAnalyzer.getThreatMap(),
            coverageAnalyzer.getCoverageMap()
        );
        this.interceptionRenderer = new InterceptionRenderer();
        this.reasoningPanel = new DecisionReasoningPanel();

        // Add to container
        this.container.addChild(this.flowRenderer.getContainer());
        this.container.addChild(this.influenceRenderer.getContainer());
        this.container.addChild(this.interceptionRenderer.getContainer());

        // Add container to stage
        this.app.stage.addChild(this.container);
    }

    /**
     * Toggle entire debug visualization
     */
    toggle(): boolean {
        this.enabled = !this.enabled;
        this.container.visible = this.enabled;
        this.reasoningPanel.setVisible(this.enabled && this.layers.decisionReasoning);
        return this.enabled;
    }

    /**
     * Toggle specific layer
     */
    toggleLayer(layer: keyof VisualizationLayers): void {
        this.layers[layer] = !this.layers[layer];
        this.updateLayerVisibility();
    }

    /**
     * Get layer visibility state
     */
    getLayers(): VisualizationLayers {
        return { ...this.layers };
    }

    /**
     * Update visualization (call each frame when enabled)
     */
    update(currentTime: number, interceptionPoints?: InterceptionPoint[]): void {
        if (!this.enabled) return;

        // Throttle updates
        if (currentTime - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = currentTime;

        if (this.layers.flowField || this.layers.trafficDensity) {
            this.flowRenderer.update(this.layers.flowField, this.layers.trafficDensity);
        }

        if (this.layers.threatMap || this.layers.coverageMap) {
            this.influenceRenderer.update(this.layers.threatMap, this.layers.coverageMap);
        }

        if (this.layers.interceptionPoints && interceptionPoints) {
            this.interceptionRenderer.update(interceptionPoints);
        }

        if (this.layers.decisionReasoning) {
            const status = this.aiManager.getStatus();
            this.reasoningPanel.update(status);
        }
    }

    private updateLayerVisibility(): void {
        this.flowRenderer.getContainer().visible =
            this.layers.flowField || this.layers.trafficDensity;
        this.influenceRenderer.getContainer().visible =
            this.layers.threatMap || this.layers.coverageMap;
        this.interceptionRenderer.getContainer().visible =
            this.layers.interceptionPoints;
        this.reasoningPanel.setVisible(this.enabled && this.layers.decisionReasoning);
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    destroy(): void {
        this.container.destroy({ children: true });
        this.reasoningPanel.destroy();
    }
}
