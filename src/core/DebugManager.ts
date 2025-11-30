export class DebugManager {
    private fps: number = 0;
    private entityCount: number = 0;
    private container: HTMLElement | null = null;
    private lastTime: number = 0;
    private frameCount: number = 0;
    private fpsElement: HTMLElement | null = null;
    private entityCountElement: HTMLElement | null = null;
    private isVisible: boolean = true;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        this.container = document.createElement('div');
        this.container.className = 'debug-overlay';

        this.fpsElement = document.createElement('div');
        this.fpsElement.textContent = 'FPS: 0';

        this.entityCountElement = document.createElement('div');
        this.entityCountElement.textContent = 'Entities: 0';

        this.container.appendChild(this.fpsElement);
        this.container.appendChild(this.entityCountElement);

        document.body.appendChild(this.container);

        // Toggle visibility with backtick
        window.addEventListener('keydown', (e) => {
            if (e.key === '`') {
                this.toggle();
            }
        });
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

    public toggle(): void {
        this.isVisible = !this.isVisible;
        if (this.container) {
            this.container.style.display = this.isVisible ? 'block' : 'none';
        }
    }
}
