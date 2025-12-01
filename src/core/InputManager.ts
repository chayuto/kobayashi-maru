/**
 * InputManager
 * Handles mouse and keyboard input for the game.
 */
export class InputManager {
    private mouse: { x: number; y: number; isDown: boolean };
    private keys: Map<string, boolean>;
    private element: HTMLElement | null = null;
    private boundHandleMouseMove: (e: MouseEvent) => void;
    private boundHandleMouseDown: (e: MouseEvent) => void;
    private boundHandleMouseUp: (e: MouseEvent) => void;
    private boundHandleKeyDown: (e: KeyboardEvent) => void;
    private boundHandleKeyUp: (e: KeyboardEvent) => void;

    constructor() {
        this.mouse = { x: 0, y: 0, isDown: false };
        this.keys = new Map<string, boolean>();

        // Bind methods to preserve 'this' context
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    }

    /**
     * Initialize input listeners on the target element
     * @param element The HTML element to listen for mouse events on (usually the canvas or container)
     */
    public init(element: HTMLElement): void {
        this.element = element;

        // Mouse events on the specific element
        this.element.addEventListener('mousemove', this.boundHandleMouseMove);
        this.element.addEventListener('mousedown', this.boundHandleMouseDown);
        window.addEventListener('mouseup', this.boundHandleMouseUp); // Listen on window to catch releases outside

        // Keyboard events on window
        window.addEventListener('keydown', this.boundHandleKeyDown);
        window.addEventListener('keyup', this.boundHandleKeyUp);
    }

    /**
     * Clean up event listeners
     */
    public destroy(): void {
        if (this.element) {
            this.element.removeEventListener('mousemove', this.boundHandleMouseMove);
            this.element.removeEventListener('mousedown', this.boundHandleMouseDown);
            this.element = null;
        }
        window.removeEventListener('mouseup', this.boundHandleMouseUp);
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        window.removeEventListener('keyup', this.boundHandleKeyUp);
    }

    /**
     * Check if a specific key is currently pressed
     * @param key The key code to check (e.g., 'ArrowUp', 'Space', 'w')
     * @returns True if the key is down
     */
    public isKeyDown(key: string): boolean {
        return this.keys.get(key) || false;
    }

    /**
     * Get the current mouse position relative to the game element
     */
    public getMousePosition(): { x: number; y: number } {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    /**
     * Check if the mouse button is currently held down
     */
    public isMouseDown(): boolean {
        return this.mouse.isDown;
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.element) return;
        const rect = this.element.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    private handleMouseDown(): void {
        this.mouse.isDown = true;
    }

    private handleMouseUp(): void {
        this.mouse.isDown = false;
    }

    private handleKeyDown(e: KeyboardEvent): void {
        this.keys.set(e.key, true);
    }

    private handleKeyUp(e: KeyboardEvent): void {
        this.keys.set(e.key, false);
    }
}
