/**
 * Tests for InputManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../core/InputManager';

describe('InputManager', () => {
    let inputManager: InputManager;
    let element: HTMLElement;

    beforeEach(() => {
        element = document.createElement('div');
        document.body.appendChild(element);
        inputManager = new InputManager();
        inputManager.init(element);
    });

    afterEach(() => {
        inputManager.destroy();
        document.body.removeChild(element);
    });

    it('should track mouse position', () => {
        // Mock getBoundingClientRect
        element.getBoundingClientRect = () => ({
            left: 10,
            top: 20,
            width: 100,
            height: 100,
            right: 110,
            bottom: 120,
            x: 10,
            y: 20,
            toJSON: () => { }
        });

        const event = new MouseEvent('mousemove', {
            clientX: 50,
            clientY: 60
        });

        element.dispatchEvent(event);

        const pos = inputManager.getMousePosition();
        expect(pos.x).toBe(40); // 50 - 10
        expect(pos.y).toBe(40); // 60 - 20
    });

    it('should track mouse button state', () => {
        expect(inputManager.isMouseDown()).toBe(false);

        element.dispatchEvent(new MouseEvent('mousedown'));
        expect(inputManager.isMouseDown()).toBe(true);

        window.dispatchEvent(new MouseEvent('mouseup'));
        expect(inputManager.isMouseDown()).toBe(false);
    });

    it('should track key states', () => {
        expect(inputManager.isKeyDown('Space')).toBe(false);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));
        expect(inputManager.isKeyDown('Space')).toBe(true);

        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Space' }));
        expect(inputManager.isKeyDown('Space')).toBe(false);
    });

    it('should handle multiple keys', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

        expect(inputManager.isKeyDown('ArrowUp')).toBe(true);
        expect(inputManager.isKeyDown('ArrowRight')).toBe(true);
        expect(inputManager.isKeyDown('ArrowDown')).toBe(false);

        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));

        expect(inputManager.isKeyDown('ArrowUp')).toBe(false);
        expect(inputManager.isKeyDown('ArrowRight')).toBe(true);
    });
});
