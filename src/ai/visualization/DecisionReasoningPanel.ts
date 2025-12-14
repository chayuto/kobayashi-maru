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
    private styleElement: HTMLStyleElement | null = null;

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
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
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
        document.head.appendChild(this.styleElement);
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
            [AIPersonality.ADAPTIVE]: 'Adaptive',
        };
        return names[personality] || 'Unknown';
    }

    private getActionName(type: AIActionType): string {
        const names: Record<AIActionType, string> = {
            [AIActionType.PLACE_TURRET]: 'PLACE TURRET',
            [AIActionType.UPGRADE_TURRET]: 'UPGRADE',
            [AIActionType.SELL_TURRET]: 'SELL',
        };
        return names[type] || 'UNKNOWN';
    }

    private getActionClass(type: AIActionType): string {
        const classes: Record<AIActionType, string> = {
            [AIActionType.PLACE_TURRET]: 'ai-debug-action-place',
            [AIActionType.UPGRADE_TURRET]: 'ai-debug-action-upgrade',
            [AIActionType.SELL_TURRET]: 'ai-debug-action-wait',
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
        if (this.styleElement?.parentNode) {
            this.styleElement.parentNode.removeChild(this.styleElement);
        }
    }
}
