/**
 * Game stats data interface for UI updates
 */
export interface GameStats {
    gameState: string;
    waveNumber: number;
    waveState: string;
    timeSurvived: number;
    enemiesDefeated: number;
    activeEnemies: number;
    resources: number;
}

/**
 * Performance stats data interface
 */
export interface PerformanceStats {
    fps: number;
    frameTime: number;
    renderTime: number;
    systemTimes: Map<string, number>;
    entityCount: number;
    memoryUsed: number;
}

// Frame budget threshold for highlighting (in ms)
const BUDGET_THRESHOLD = 2.0;

export class DebugManager {
    private fps: number = 0;
    private entityCount: number = 0;
    private container: HTMLElement | null = null;
    private lastTime: number = 0;
    private frameCount: number = 0;
    private fpsElement: HTMLElement | null = null;
    private entityCountElement: HTMLElement | null = null;
    private frameTimeElement: HTMLElement | null = null;
    private renderTimeElement: HTMLElement | null = null;
    private systemTimingsElement: HTMLElement | null = null;
    private gameStateElement: HTMLElement | null = null;
    private waveElement: HTMLElement | null = null;
    private timeElement: HTMLElement | null = null;
    private killsElement: HTMLElement | null = null;
    private enemiesElement: HTMLElement | null = null;
    private resourcesElement: HTMLElement | null = null;
    private isVisible: boolean = false;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        this.container = document.createElement('div');
        this.container.className = 'debug-overlay';
        // Start hidden by default
        this.container.style.display = 'none';

        // Performance section
        const perfSection = this.createSection('SYSTEM');
        this.fpsElement = document.createElement('div');
        this.fpsElement.textContent = 'FPS: 0';
        this.entityCountElement = document.createElement('div');
        this.entityCountElement.textContent = 'Entities: 0';
        this.frameTimeElement = document.createElement('div');
        this.frameTimeElement.textContent = 'Frame: 0.00ms';
        this.renderTimeElement = document.createElement('div');
        this.renderTimeElement.textContent = 'Render: 0.00ms';
        perfSection.appendChild(this.fpsElement);
        perfSection.appendChild(this.entityCountElement);
        perfSection.appendChild(this.frameTimeElement);
        perfSection.appendChild(this.renderTimeElement);

        // System timings section
        const timingsSection = this.createSection('TIMINGS');
        this.systemTimingsElement = document.createElement('div');
        this.systemTimingsElement.className = 'system-timings';
        timingsSection.appendChild(this.systemTimingsElement);

        // Game state section
        const stateSection = this.createSection('STATUS');
        this.gameStateElement = document.createElement('div');
        this.gameStateElement.textContent = 'State: MENU';
        this.gameStateElement.className = 'stat-highlight';
        stateSection.appendChild(this.gameStateElement);

        // Wave section
        const waveSection = this.createSection('TACTICAL');
        this.waveElement = document.createElement('div');
        this.waveElement.textContent = 'Wave: 0 (idle)';
        this.enemiesElement = document.createElement('div');
        this.enemiesElement.textContent = 'Active Enemies: 0';
        waveSection.appendChild(this.waveElement);
        waveSection.appendChild(this.enemiesElement);

        // Score section
        const scoreSection = this.createSection('SCORE');
        this.timeElement = document.createElement('div');
        this.timeElement.textContent = 'Time: 00:00';
        this.killsElement = document.createElement('div');
        this.killsElement.textContent = 'Kills: 0';
        scoreSection.appendChild(this.timeElement);
        scoreSection.appendChild(this.killsElement);

        // Resources section
        const resourceSection = this.createSection('RESOURCES');
        this.resourcesElement = document.createElement('div');
        this.resourcesElement.textContent = 'Matter: 0';
        this.resourcesElement.className = 'stat-resources';
        resourceSection.appendChild(this.resourcesElement);

        this.container.appendChild(perfSection);
        this.container.appendChild(timingsSection);
        this.container.appendChild(stateSection);
        this.container.appendChild(waveSection);
        this.container.appendChild(scoreSection);
        this.container.appendChild(resourceSection);

        document.body.appendChild(this.container);

        // Toggle visibility with backtick
        window.addEventListener('keydown', (e) => {
            if (e.key === '`') {
                this.toggle();
            }
        });

        // Handle window resize for responsive scaling
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize();
    }

    /**
     * Handle window resize to scale the debug overlay
     */
    private handleResize(): void {
        if (!this.container) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortrait = height > width;

        // Calculate scale factor matching ResponsiveUIManager logic
        let scaleFactor: number;
        if (width < 768 || (width < 1024 && isPortrait)) {
            scaleFactor = 0.8;
        } else if (width < 1024) {
            scaleFactor = 0.8;
        } else {
            scaleFactor = 1.0;
        }

        // Apply CSS transform for scaling
        this.container.style.transform = `scale(${scaleFactor})`;
        this.container.style.transformOrigin = 'top left';
    }

    /**
     * Creates a labeled section for grouping stats
     */
    private createSection(label: string): HTMLElement {
        const section = document.createElement('div');
        section.className = 'debug-section';
        
        const header = document.createElement('div');
        header.className = 'section-header';
        header.textContent = label;
        section.appendChild(header);
        
        return section;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(_deltaTime: number): void {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            if (this.fpsElement) {
                this.fpsElement.textContent = `FPS: ${this.fps}`;
            }
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    public updateEntityCount(count: number): void {
        this.entityCount = count;
        if (this.entityCountElement) {
            this.entityCountElement.textContent = `Entities: ${this.entityCount}`;
        }
    }

    /**
     * Updates performance stats in the UI
     */
    public updatePerformanceStats(stats: PerformanceStats): void {
        if (this.frameTimeElement) {
            const isOverBudget = stats.frameTime > 16.67;
            this.frameTimeElement.textContent = `Frame: ${stats.frameTime.toFixed(2)}ms`;
            this.frameTimeElement.style.color = isOverBudget ? '#ff6666' : '';
        }

        if (this.renderTimeElement) {
            const isOverBudget = stats.renderTime > 5.0;
            this.renderTimeElement.textContent = `Render: ${stats.renderTime.toFixed(2)}ms`;
            this.renderTimeElement.style.color = isOverBudget ? '#ff6666' : '';
        }

        if (this.systemTimingsElement) {
            // Build timing display with color coding for systems over budget
            const timingLines: string[] = [];
            for (const [name, time] of stats.systemTimes) {
                const isOverBudget = time > BUDGET_THRESHOLD;
                const color = isOverBudget ? '#ff6666' : '#99ccff';
                const indicator = isOverBudget ? '⚠' : '✓';
                timingLines.push(`<span style="color:${color}">${indicator} ${name}: ${time.toFixed(2)}ms</span>`);
            }
            this.systemTimingsElement.innerHTML = timingLines.join('<br>');
        }
    }

    /**
     * Updates all game stats in the UI
     */
    public updateGameStats(stats: GameStats): void {
        if (this.gameStateElement) {
            this.gameStateElement.textContent = `State: ${stats.gameState}`;
            // Add color coding for game state
            this.gameStateElement.className = `stat-highlight ${this.getStateClassName(stats.gameState)}`;
        }
        
        if (this.waveElement) {
            this.waveElement.textContent = `Wave: ${stats.waveNumber} (${stats.waveState})`;
        }
        
        if (this.timeElement) {
            this.timeElement.textContent = `Time: ${this.formatTime(stats.timeSurvived)}`;
        }
        
        if (this.killsElement) {
            this.killsElement.textContent = `Kills: ${stats.enemiesDefeated}`;
        }
        
        if (this.enemiesElement) {
            this.enemiesElement.textContent = `Active Enemies: ${stats.activeEnemies}`;
        }
        
        if (this.resourcesElement) {
            this.resourcesElement.textContent = `Matter: ${stats.resources}`;
        }
    }

    /**
     * Maps game state to a CSS class name
     */
    private getStateClassName(state: string): string {
        const stateMap: Record<string, string> = {
            'MENU': 'state-menu',
            'PLAYING': 'state-playing',
            'PAUSED': 'state-paused',
            'GAME_OVER': 'state-game-over'
        };
        return stateMap[state] || 'state-menu';
    }

    /**
     * Formats time in seconds to MM:SS format
     */
    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    public toggle(): void {
        this.isVisible = !this.isVisible;
        if (this.container) {
            this.container.style.display = this.isVisible ? 'block' : 'none';
        }
    }
}
