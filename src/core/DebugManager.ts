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

export class DebugManager {
    private fps: number = 0;
    private entityCount: number = 0;
    private container: HTMLElement | null = null;
    private lastTime: number = 0;
    private frameCount: number = 0;
    private fpsElement: HTMLElement | null = null;
    private entityCountElement: HTMLElement | null = null;
    private gameStateElement: HTMLElement | null = null;
    private waveElement: HTMLElement | null = null;
    private timeElement: HTMLElement | null = null;
    private killsElement: HTMLElement | null = null;
    private enemiesElement: HTMLElement | null = null;
    private resourcesElement: HTMLElement | null = null;
    private isVisible: boolean = true;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        this.container = document.createElement('div');
        this.container.className = 'debug-overlay';

        // Performance section
        const perfSection = this.createSection('SYSTEM');
        this.fpsElement = document.createElement('div');
        this.fpsElement.textContent = 'FPS: 0';
        this.entityCountElement = document.createElement('div');
        this.entityCountElement.textContent = 'Entities: 0';
        perfSection.appendChild(this.fpsElement);
        perfSection.appendChild(this.entityCountElement);

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
     * Updates all game stats in the UI
     */
    public updateGameStats(stats: GameStats): void {
        if (this.gameStateElement) {
            this.gameStateElement.textContent = `State: ${stats.gameState}`;
            // Add color coding for game state
            this.gameStateElement.className = `stat-highlight state-${stats.gameState.toLowerCase().replace('_', '-')}`;
        }
        
        if (this.waveElement) {
            this.waveElement.textContent = `Wave: ${stats.waveNumber} (${stats.waveState})`;
        }
        
        if (this.timeElement) {
            const minutes = Math.floor(stats.timeSurvived / 60);
            const seconds = Math.floor(stats.timeSurvived % 60);
            this.timeElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

    public toggle(): void {
        this.isVisible = !this.isVisible;
        if (this.container) {
            this.container.style.display = this.isVisible ? 'block' : 'none';
        }
    }
}
