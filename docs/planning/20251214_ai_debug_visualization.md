# AI Debug Visualization Mode - Implementation Plan

**Date:** December 14, 2025  
**Priority:** High (Critical for understanding AI behavior)  
**Estimated Hours:** 3-4  
**Dependencies:** Stages 1-5 Complete (FlowFieldAnalyzer, InfluenceMap, PathInterceptor, etc.)

---

## Overview

The AI auto-play system now has sophisticated spatial analysis (flow fields, influence maps, path interception) but there's no way to visualize what the AI "sees." This makes debugging and tuning extremely difficult.

This document provides a detailed implementation plan for a debug visualization overlay that renders:
1. Flow field arrows (enemy movement directions)
2. Traffic density heat map (where enemies converge)
3. Threat influence map (danger zones)
4. Coverage influence map (turret protection zones)
5. Interception points (optimal placement candidates)
6. AI decision reasoning (why it chose a specific action)

---

## Architecture

### Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                        Game.ts                               │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  DebugManager   │    │ AIAutoPlayManager│                 │
│  │  (existing)     │    │                  │                 │
│  └────────┬────────┘    └────────┬─────────┘                 │
│           │                      │                           │
│           │    ┌─────────────────┴──────────────┐            │
│           │    │      AIDebugVisualizer         │◄── NEW     │
│           │    │  ┌─────────────────────────┐   │            │
│           │    │  │ FlowFieldRenderer       │   │            │
│           │    │  │ InfluenceMapRenderer    │   │            │
│           │    │  │ InterceptionRenderer    │   │            │
│           │    │  │ DecisionReasoningPanel  │   │            │
│           │    │  └─────────────────────────┘   │            │
│           │    └────────────────────────────────┘            │
│           │                      │                           │
│           └──────────────────────┼───────────────────────────┤
│                                  ▼                           │
│                         PixiJS Stage                         │
│                    (debug layer on top)                      │
└─────────────────────────────────────────────────────────────┘
```

### New Files

| File | Purpose |
|------|---------|
| `src/ai/visualization/AIDebugVisualizer.ts` | Main coordinator |
| `src/ai/visualization/FlowFieldRenderer.ts` | Renders flow arrows |
| `src/ai/visualization/InfluenceMapRenderer.ts` | Renders heat maps |
| `src/ai/visualization/InterceptionRenderer.ts` | Renders placement candidates |
| `src/ai/visualization/DecisionReasoningPanel.ts` | Shows AI decision breakdown |
| `src/ai/visualization/index.ts` | Barrel export |

---

## Detailed Implementation

### Stage 1: AIDebugVisualizer (Main Coordinator)

**File:** `src/ai/visualization/AIDebugVisualizer.ts`

```typescript
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
import { InterceptionRenderer } from './InterceptionRenderer';
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
    private coverageAnalyzer: CoverageAnalyzer;
    
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

    constructor(
        app: Application,
        aiManager: AIAutoPlayManager,
        coverageAnalyzer: CoverageAnalyzer
    ) {
        this.app = app;
        this.aiManager = aiManager;
        this.coverageAnalyzer = coverageAnalyzer;
        
        // Create debug container (rendered on top)
        this.container = new Container();
        this.container.visible = false;
        this.container.zIndex = 1000; // Above everything
        
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
     * Update visualization (call each frame when enabled)
     */
    update(): void {
        if (!this.enabled) return;
        
        if (this.layers.flowField || this.layers.trafficDensity) {
            this.flowRenderer.update(this.layers.flowField, this.layers.trafficDensity);
        }
        
        if (this.layers.threatMap || this.layers.coverageMap) {
            this.influenceRenderer.update(this.layers.threatMap, this.layers.coverageMap);
        }
        
        if (this.layers.interceptionPoints) {
            // Get interception points from planner (would need to expose this)
            this.interceptionRenderer.update([]);
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
        this.reasoningPanel.setVisible(this.layers.decisionReasoning);
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    destroy(): void {
        this.container.destroy({ children: true });
        this.reasoningPanel.destroy();
    }
}
```

---

### Stage 2: FlowFieldRenderer

**File:** `src/ai/visualization/FlowFieldRenderer.ts`

```typescript
/**
 * FlowFieldRenderer
 * 
 * Renders flow field arrows and traffic density heat map.
 * 
 * @module ai/visualization/FlowFieldRenderer
 */

import { Container, Graphics } from 'pixi.js';
import { GAME_CONFIG } from '../../types/constants';
import type { FlowFieldAnalyzer } from '../spatial/FlowFieldAnalyzer';

// Visualization config
const ARROW_SPACING = 40;      // Pixels between arrows
const ARROW_LENGTH = 15;       // Arrow length in pixels
const ARROW_COLOR = 0x00ffff;  // Cyan
const ARROW_ALPHA = 0.6;

// Heat map colors (low to high traffic)
const HEAT_COLORS = [
    0x0000ff,  // Blue (low)
    0x00ff00,  // Green
    0xffff00,  // Yellow
    0xff8800,  // Orange
    0xff0000,  // Red (high)
];

export class FlowFieldRenderer {
    private container: Container;
    private arrowGraphics: Graphics;
    private heatMapGraphics: Graphics;
    private flowAnalyzer: FlowFieldAnalyzer;

    constructor(flowAnalyzer: FlowFieldAnalyzer) {
        this.flowAnalyzer = flowAnalyzer;
        
        this.container = new Container();
        this.heatMapGraphics = new Graphics();
        this.arrowGraphics = new Graphics();
        
        this.container.addChild(this.heatMapGraphics);
        this.container.addChild(this.arrowGraphics);
    }

    getContainer(): Container {
        return this.container;
    }

    update(showArrows: boolean, showHeatMap: boolean): void {
        this.arrowGraphics.clear();
        this.heatMapGraphics.clear();

        if (showHeatMap) {
            this.renderHeatMap();
        }

        if (showArrows) {
            this.renderArrows();
        }
    }

    private renderHeatMap(): void {
        const cellSize = ARROW_SPACING;
        const cols = Math.ceil(GAME_CONFIG.WORLD_WIDTH / cellSize);
        const rows = Math.ceil(GAME_CONFIG.WORLD_HEIGHT / cellSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                
                const traffic = this.flowAnalyzer.getTrafficAt(x, y);
                
                if (traffic > 0.1) {
                    const color = this.getHeatColor(traffic);
                    this.heatMapGraphics.rect(
                        col * cellSize,
                        row * cellSize,
                        cellSize,
                        cellSize
                    );
                    this.heatMapGraphics.fill({ color, alpha: traffic * 0.4 });
                }
            }
        }
    }

    private renderArrows(): void {
        const cols = Math.ceil(GAME_CONFIG.WORLD_WIDTH / ARROW_SPACING);
        const rows = Math.ceil(GAME_CONFIG.WORLD_HEIGHT / ARROW_SPACING);

        this.arrowGraphics.stroke({ color: ARROW_COLOR, alpha: ARROW_ALPHA, width: 1 });

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * ARROW_SPACING + ARROW_SPACING / 2;
                const y = row * ARROW_SPACING + ARROW_SPACING / 2;
                
                const flow = this.flowAnalyzer.getFlowAt(x, y);
                
                // Skip zero vectors (goal reached)
                if (flow.x === 0 && flow.y === 0) continue;
                
                this.drawArrow(x, y, flow.x, flow.y);
            }
        }
    }

    private drawArrow(x: number, y: number, dirX: number, dirY: number): void {
        const endX = x + dirX * ARROW_LENGTH;
        const endY = y + dirY * ARROW_LENGTH;
        
        // Arrow line
        this.arrowGraphics.moveTo(x, y);
        this.arrowGraphics.lineTo(endX, endY);
        
        // Arrow head
        const headLength = 5;
        const angle = Math.atan2(dirY, dirX);
        const headAngle = Math.PI / 6;
        
        this.arrowGraphics.moveTo(endX, endY);
        this.arrowGraphics.lineTo(
            endX - headLength * Math.cos(angle - headAngle),
            endY - headLength * Math.sin(angle - headAngle)
        );
        
        this.arrowGraphics.moveTo(endX, endY);
        this.arrowGraphics.lineTo(
            endX - headLength * Math.cos(angle + headAngle),
            endY - headLength * Math.sin(angle + headAngle)
        );
    }

    private getHeatColor(value: number): number {
        // Map 0-1 to color index
        const index = Math.min(
            Math.floor(value * HEAT_COLORS.length),
            HEAT_COLORS.length - 1
        );
        return HEAT_COLORS[index];
    }
}
```

---

### Stage 3: InfluenceMapRenderer

**File:** `src/ai/visualization/InfluenceMapRenderer.ts`

```typescript
/**
 * InfluenceMapRenderer
 * 
 * Renders threat and coverage influence maps as overlays.
 * 
 * @module ai/visualization/InfluenceMapRenderer
 */

import { Container, Graphics } from 'pixi.js';
import type { ThreatInfluenceMap } from '../spatial/ThreatInfluenceMap';
import type { CoverageInfluenceMap } from '../spatial/CoverageInfluenceMap';

const THREAT_COLOR = 0xff0000;    // Red for danger
const COVERAGE_COLOR = 0x00ff00;  // Green for protection

export class InfluenceMapRenderer {
    private container: Container;
    private threatGraphics: Graphics;
    private coverageGraphics: Graphics;
    private threatMap: ThreatInfluenceMap;
    private coverageMap: CoverageInfluenceMap;

    constructor(threatMap: ThreatInfluenceMap, coverageMap: CoverageInfluenceMap) {
        this.threatMap = threatMap;
        this.coverageMap = coverageMap;
        
        this.container = new Container();
        this.threatGraphics = new Graphics();
        this.coverageGraphics = new Graphics();
        
        this.container.addChild(this.coverageGraphics);
        this.container.addChild(this.threatGraphics);
    }

    getContainer(): Container {
        return this.container;
    }

    update(showThreat: boolean, showCoverage: boolean): void {
        this.threatGraphics.clear();
        this.coverageGraphics.clear();

        if (showCoverage) {
            this.renderInfluenceMap(
                this.coverageGraphics,
                this.coverageMap,
                COVERAGE_COLOR
            );
        }

        if (showThreat) {
            this.renderInfluenceMap(
                this.threatGraphics,
                this.threatMap,
                THREAT_COLOR
            );
        }
    }

    private renderInfluenceMap(
        graphics: Graphics,
        map: ThreatInfluenceMap | CoverageInfluenceMap,
        color: number
    ): void {
        const resolution = map.getResolution();
        const cellSize = map.getCellSize();

        for (let row = 0; row < resolution; row++) {
            for (let col = 0; col < resolution; col++) {
                const value = map.getValueAt(col, row);
                
                if (value > 0.1) {
                    graphics.rect(
                        col * cellSize,
                        row * cellSize,
                        cellSize,
                        cellSize
                    );
                    graphics.fill({ color, alpha: value * 0.3 });
                }
            }
        }
    }
}
```

---

### Stage 4: InterceptionRenderer

**File:** `src/ai/visualization/InterceptionRenderer.ts`

```typescript
/**
 * InterceptionRenderer
 * 
 * Renders interception points (optimal turret placement candidates).
 * 
 * @module ai/visualization/InterceptionRenderer
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const POINT_COLOR = 0xffff00;     // Yellow
const POINT_RADIUS = 8;
const LABEL_STYLE = new TextStyle({
    fontSize: 10,
    fill: 0xffffff,
    fontFamily: 'monospace',
});

export interface InterceptionPoint {
    x: number;
    y: number;
    score: number;
    dwellTime: number;
}

export class InterceptionRenderer {
    private container: Container;
    private graphics: Graphics;
    private labels: Text[] = [];

    constructor() {
        this.container = new Container();
        this.graphics = new Graphics();
        this.container.addChild(this.graphics);
    }

    getContainer(): Container {
        return this.container;
    }

    update(points: InterceptionPoint[]): void {
        this.graphics.clear();
        
        // Remove old labels
        for (const label of this.labels) {
            this.container.removeChild(label);
            label.destroy();
        }
        this.labels = [];

        // Draw interception points
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            
            // Draw circle
            this.graphics.circle(point.x, point.y, POINT_RADIUS);
            this.graphics.stroke({ color: POINT_COLOR, width: 2 });
            
            // Draw rank number
            const label = new Text({
                text: `${i + 1}`,
                style: LABEL_STYLE,
            });
            label.anchor.set(0.5);
            label.position.set(point.x, point.y);
            this.container.addChild(label);
            this.labels.push(label);
            
            // Draw score tooltip on hover (simplified: always show for top 3)
            if (i < 3) {
                const tooltip = new Text({
                    text: `Score: ${point.score.toFixed(1)}\nDwell: ${point.dwellTime.toFixed(1)}s`,
                    style: new TextStyle({ fontSize: 8, fill: 0xaaaaaa }),
                });
                tooltip.position.set(point.x + 12, point.y - 10);
                this.container.addChild(tooltip);
                this.labels.push(tooltip);
            }
        }
    }
}
```

---

### Stage 5: DecisionReasoningPanel

**File:** `src/ai/visualization/DecisionReasoningPanel.ts`

```typescript
/**
 * DecisionReasoningPanel
 * 
 * HTML overlay showing AI decision breakdown.
 * Shows why the AI chose its current action.
 * 
 * @module ai/visualization/DecisionReasoningPanel
 */

import type { AIStatus, AIAction } from '../types';
import { AIActionType, AIPersonality } from '../types';

export class DecisionReasoningPanel {
    private container: HTMLElement;
    private visible: boolean = false;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'ai-debug-panel';
        this.container.innerHTML = this.getTemplate();
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
        
        this.addStyles();
    }

    private getTemplate(): string {
        return `
            <div class="ai-debug-header">AI DECISION</div>
            <div class="ai-debug-content">
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Status:</span>
                    <span id="ai-status">-</span>
                </div>
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Personality:</span>
                    <span id="ai-personality">-</span>
                </div>
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Threat Level:</span>
                    <span id="ai-threat">-</span>
                </div>
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Coverage:</span>
                    <span id="ai-coverage">-</span>
                </div>
                <div class="ai-debug-divider"></div>
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Action:</span>
                    <span id="ai-action">-</span>
                </div>
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Priority:</span>
                    <span id="ai-priority">-</span>
                </div>
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Cost:</span>
                    <span id="ai-cost">-</span>
                </div>
                <div class="ai-debug-row">
                    <span class="ai-debug-label">Expected Value:</span>
                    <span id="ai-value">-</span>
                </div>
            </div>
        `;
    }

    private addStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .ai-debug-panel {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.85);
                border: 1px solid #00ffff;
                border-radius: 4px;
                padding: 10px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                color: #00ffff;
                z-index: 10000;
                min-width: 200px;
            }
            .ai-debug-header {
                font-weight: bold;
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 1px solid #00ffff;
            }
            .ai-debug-row {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
            }
            .ai-debug-label {
                color: #888;
            }
            .ai-debug-divider {
                height: 1px;
                background: #333;
                margin: 6px 0;
            }
            .ai-debug-action-place { color: #00ff00; }
            .ai-debug-action-upgrade { color: #ffff00; }
            .ai-debug-action-wait { color: #888888; }
            .ai-debug-threat-low { color: #00ff00; }
            .ai-debug-threat-medium { color: #ffff00; }
            .ai-debug-threat-high { color: #ff8800; }
            .ai-debug-threat-critical { color: #ff0000; }
        `;
        document.head.appendChild(style);
    }

    update(status: AIStatus): void {
        if (!this.visible) return;

        // Update status
        this.setText('ai-status', status.enabled ? 'ACTIVE' : 'DISABLED');
        this.setText('ai-personality', this.getPersonalityName(status.personality));
        
        // Update threat with color
        const threatEl = document.getElementById('ai-threat');
        if (threatEl) {
            threatEl.textContent = `${status.threatLevel.toFixed(0)}%`;
            threatEl.className = this.getThreatClass(status.threatLevel);
        }
        
        // Update coverage
        this.setText('ai-coverage', `${status.coveragePercent.toFixed(1)}%`);
        
        // Update action
        if (status.currentAction) {
            this.updateAction(status.currentAction);
        } else {
            this.setText('ai-action', 'WAITING');
            this.setText('ai-priority', '-');
            this.setText('ai-cost', '-');
            this.setText('ai-value', '-');
        }
    }

    private updateAction(action: AIAction): void {
        const actionEl = document.getElementById('ai-action');
        if (actionEl) {
            actionEl.textContent = this.getActionName(action.type);
            actionEl.className = this.getActionClass(action.type);
        }
        
        this.setText('ai-priority', action.priority.toFixed(1));
        this.setText('ai-cost', action.cost.toString());
        this.setText('ai-value', action.expectedValue.toFixed(1));
    }

    private setText(id: string, text: string): void {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    private getPersonalityName(personality: AIPersonality): string {
        const names: Record<AIPersonality, string> = {
            [AIPersonality.AGGRESSIVE]: 'Aggressive',
            [AIPersonality.DEFENSIVE]: 'Defensive',
            [AIPersonality.BALANCED]: 'Balanced',
            [AIPersonality.ECONOMIC]: 'Economic',
        };
        return names[personality] || 'Unknown';
    }

    private getActionName(type: AIActionType): string {
        const names: Record<AIActionType, string> = {
            [AIActionType.PLACE_TURRET]: 'PLACE TURRET',
            [AIActionType.UPGRADE_TURRET]: 'UPGRADE',
            [AIActionType.WAIT]: 'WAIT',
        };
        return names[type] || 'UNKNOWN';
    }

    private getActionClass(type: AIActionType): string {
        const classes: Record<AIActionType, string> = {
            [AIActionType.PLACE_TURRET]: 'ai-debug-action-place',
            [AIActionType.UPGRADE_TURRET]: 'ai-debug-action-upgrade',
            [AIActionType.WAIT]: 'ai-debug-action-wait',
        };
        return classes[type] || '';
    }

    private getThreatClass(level: number): string {
        if (level < 25) return 'ai-debug-threat-low';
        if (level < 50) return 'ai-debug-threat-medium';
        if (level < 75) return 'ai-debug-threat-high';
        return 'ai-debug-threat-critical';
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.container.style.display = visible ? 'block' : 'none';
    }

    destroy(): void {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
```

---

## Integration Steps

### 1. Update AIAutoPlayManager

Add method to expose internal analyzers:

```typescript
// In AIAutoPlayManager.ts
getCoverageAnalyzer(): CoverageAnalyzer {
    return this.coverageAnalyzer;
}

getPlanner(): ActionPlanner {
    return this.planner;
}
```

### 2. Update ActionPlanner

Expose interception points for visualization:

```typescript
// In ActionPlanner.ts
getLastInterceptionPoints(): InterceptionPoint[] {
    return this.lastInterceptionPoints;
}
```

### 3. Update Game.ts

Initialize and update the visualizer:

```typescript
// In Game.ts constructor
private aiDebugVisualizer: AIDebugVisualizer | null = null;

// In init() after AI manager is created
this.aiDebugVisualizer = new AIDebugVisualizer(
    this.app,
    this.aiManager,
    this.aiManager.getCoverageAnalyzer()
);

// In update loop
if (this.aiDebugVisualizer?.isEnabled()) {
    this.aiDebugVisualizer.update();
}

// Add keyboard toggle (e.g., 'V' key)
window.addEventListener('keydown', (e) => {
    if (e.key === 'v' || e.key === 'V') {
        this.aiDebugVisualizer?.toggle();
    }
});
```

### 4. Update InfluenceMap Interface

Add methods needed by renderer:

```typescript
// In ThreatInfluenceMap.ts and CoverageInfluenceMap.ts
getResolution(): number { return this.resolution; }
getCellSize(): number { return this.cellSize; }
getValueAt(col: number, row: number): number {
    return this.values[row * this.resolution + col] ?? 0;
}
```

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| `V` | Toggle AI debug visualization |
| `1` | Toggle flow field arrows |
| `2` | Toggle traffic density heat map |
| `3` | Toggle threat influence map |
| `4` | Toggle coverage influence map |
| `5` | Toggle interception points |
| `6` | Toggle decision reasoning panel |

---

## Performance Considerations

1. **Update Frequency**: Only update visualization every 100-200ms, not every frame
2. **Culling**: Only render visible cells (viewport culling)
3. **Graphics Caching**: Reuse Graphics objects, don't recreate each frame
4. **Conditional Rendering**: Skip rendering if layer is disabled
5. **Resolution Scaling**: Use lower resolution for heat maps on mobile

```typescript
// Example throttled update
private lastUpdateTime = 0;
private updateInterval = 100; // ms

update(currentTime: number): void {
    if (currentTime - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = currentTime;
    
    // ... actual update logic
}
```

---

## Testing Checklist

- [ ] Flow field arrows point toward center (Kobayashi Maru)
- [ ] Traffic density shows higher values on main approach paths
- [ ] Threat map updates when enemies spawn
- [ ] Coverage map shows turret protection zones
- [ ] Interception points appear in high-traffic, low-coverage areas
- [ ] Decision panel shows current AI action and reasoning
- [ ] Toggle keys work correctly
- [ ] Performance impact is minimal (< 1ms per frame)
- [ ] Visualization doesn't interfere with gameplay

---

## Future Enhancements

1. **Behavior Prediction Paths**: Draw predicted enemy paths based on BehaviorPredictor
2. **Turret Range Circles**: Show range of existing turrets
3. **Synergy Lines**: Draw lines between turrets that have synergy bonuses
4. **Historical Placement**: Show ghost markers of recent AI placements
5. **Comparison Mode**: Side-by-side view of AI vs player placement efficiency

---

*Document Version: 1.0*
