/**
 * Tests for UIComponent base class and related UI utilities
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container } from 'pixi.js';
import { UIComponent } from '../ui/base';
import { Button } from '../ui/components';
import { layoutChildren, gridLayout } from '../ui/layout';
import { UIAnimator } from '../ui/animation';

// Mock PixiJS
vi.mock('pixi.js', async () => {
    const actual = await vi.importActual('pixi.js') as object;

    class MockText {
        text: string = '';
        style: { fill?: number } = {};
        anchor = { set: vi.fn() };
        position = { set: vi.fn() };
        constructor(options?: { text?: string; style?: object }) {
            this.text = options?.text ?? '';
            this.style = {};
        }
        destroy = vi.fn();
    }

    class MockGraphics {
        position = { set: vi.fn() };
        scale = { set: vi.fn() };
        clear = vi.fn().mockReturnThis();
        roundRect = vi.fn().mockReturnThis();
        fill = vi.fn().mockReturnThis();
        stroke = vi.fn().mockReturnThis();
        destroy = vi.fn();
    }

    class MockContainer {
        visible = true;
        alpha = 1;
        x = 0;
        y = 0;
        position = { set: vi.fn((x, y) => { this.x = x; this.y = y; }) };
        scale = { x: 1, y: 1, set: vi.fn() };
        children: MockContainer[] = [];
        addChild = vi.fn((child) => {
            this.children.push(child);
            return child;
        });
        getBounds = vi.fn(() => ({ width: 100, height: 50 }));
        destroy = vi.fn();
        on = vi.fn();
        off = vi.fn();
        emit = vi.fn();
        eventMode = 'auto';
        cursor = 'default';
        width = 100;
        height = 50;
    }

    return {
        ...actual,
        Container: MockContainer,
        Graphics: MockGraphics,
        Text: MockText,
        TextStyle: class MockTextStyle {
            constructor() {}
        },
    };
});

// Concrete implementation of abstract UIComponent for testing
class TestUIComponent extends UIComponent {
    public buildCalled = false;
    public lastUpdateData: unknown = null;

    protected build(): void {
        this.buildCalled = true;
    }

    public update(data: unknown): void {
        this.lastUpdateData = data;
    }

    // Expose protected methods for testing
    public testCreateText(text: string) {
        return this.createText(text);
    }

    public testCreateBackground(width: number, height: number) {
        return this.createBackground(width, height);
    }

    public testSubscribe(event: string, handler: () => void) {
        return this.subscribe(event as never, handler);
    }
}

describe('UIComponent', () => {
    let component: TestUIComponent;
    let parent: Container;

    beforeEach(() => {
        component = new TestUIComponent();
        parent = new Container();
    });

    afterEach(() => {
        component.destroy();
    });

    describe('initialization', () => {
        it('should create a container', () => {
            expect(component.container).toBeDefined();
            expect(component.container).toBeInstanceOf(Container);
        });

        it('should not be initialized before init() is called', () => {
            expect(component.initialized).toBe(false);
        });

        it('should be initialized after init() is called', () => {
            component.init(parent);
            expect(component.initialized).toBe(true);
        });

        it('should call build() during initialization', () => {
            component.init(parent);
            expect(component.buildCalled).toBe(true);
        });

        it('should add container to parent', () => {
            component.init(parent);
            expect(parent.addChild).toHaveBeenCalledWith(component.container);
        });

        it('should not initialize twice', () => {
            component.init(parent);
            component.buildCalled = false;
            component.init(parent);
            expect(component.buildCalled).toBe(false);
        });
    });

    describe('visibility', () => {
        it('should be visible by default', () => {
            expect(component.visible).toBe(true);
        });

        it('should hide the component', () => {
            component.hide();
            expect(component.visible).toBe(false);
            expect(component.container.visible).toBe(false);
        });

        it('should show the component', () => {
            component.hide();
            component.show();
            expect(component.visible).toBe(true);
            expect(component.container.visible).toBe(true);
        });
    });

    describe('positioning', () => {
        it('should set position', () => {
            component.setPosition(100, 200);
            expect(component.container.position.set).toHaveBeenCalledWith(100, 200);
        });

        it('should set scale', () => {
            component.setScale(2);
            expect(component.container.scale.set).toHaveBeenCalledWith(2);
        });
    });

    describe('update', () => {
        it('should receive update data', () => {
            const testData = { value: 42 };
            component.update(testData);
            expect(component.lastUpdateData).toEqual(testData);
        });
    });

    describe('destroy', () => {
        it('should destroy container', () => {
            component.init(parent);
            component.destroy();
            expect(component.container.destroy).toHaveBeenCalledWith({ children: true });
        });

        it('should mark as not initialized', () => {
            component.init(parent);
            component.destroy();
            expect(component.initialized).toBe(false);
        });
    });

    describe('helper methods', () => {
        it('should create text element', () => {
            const text = component.testCreateText('Hello');
            expect(text).toBeDefined();
        });

        it('should create background element', () => {
            const bg = component.testCreateBackground(100, 50);
            expect(bg).toBeDefined();
        });
    });
});

describe('Button', () => {
    let button: Button;
    const mockOnClick = vi.fn();

    beforeEach(() => {
        mockOnClick.mockClear();
        button = new Button({
            text: 'Test Button',
            width: 100,
            height: 40,
            onClick: mockOnClick,
        });
    });

    afterEach(() => {
        button.destroy();
    });

    describe('initialization', () => {
        it('should create a container', () => {
            expect(button.container).toBeDefined();
            expect(button.container).toBeInstanceOf(Container);
        });

        it('should have correct dimensions', () => {
            const dims = button.getDimensions();
            expect(dims.width).toBe(100);
            expect(dims.height).toBe(40);
        });
    });

    describe('disabled state', () => {
        it('should not be disabled by default', () => {
            expect(button.disabled).toBe(false);
        });

        it('should set disabled state', () => {
            button.disabled = true;
            expect(button.disabled).toBe(true);
        });

        it('should update cursor when disabled', () => {
            button.disabled = true;
            expect(button.container.cursor).toBe('not-allowed');
        });

        it('should update cursor when enabled', () => {
            button.disabled = true;
            button.disabled = false;
            expect(button.container.cursor).toBe('pointer');
        });
    });

    describe('text', () => {
        it('should allow setting text', () => {
            expect(() => button.setText('New Text')).not.toThrow();
        });
    });

    describe('positioning', () => {
        it('should set position', () => {
            button.setPosition(50, 100);
            expect(button.container.position.set).toHaveBeenCalledWith(50, 100);
        });

        it('should set scale', () => {
            button.setScale(1.5);
            expect(button.container.scale.set).toHaveBeenCalledWith(1.5);
        });
    });

    describe('destroy', () => {
        it('should clean up resources', () => {
            button.destroy();
            expect(button.container.destroy).toHaveBeenCalledWith({ children: true });
        });
    });
});

describe('Layout Utilities', () => {
    let parent: Container;
    let child1: Container;
    let child2: Container;

    beforeEach(() => {
        parent = new Container();
        child1 = new Container();
        child2 = new Container();
        // Set default dimensions for children
        (child1 as { width: number }).width = 50;
        (child1 as { height: number }).height = 30;
        (child2 as { width: number }).width = 60;
        (child2 as { height: number }).height = 40;
        parent.children = [child1, child2];
    });

    describe('layoutChildren', () => {
        it('should layout children vertically by default', () => {
            layoutChildren(parent);
            expect(child1.y).toBe(0);
            expect(child2.y).toBe(38); // 30 (height) + 8 (default gap)
        });

        it('should layout children horizontally', () => {
            layoutChildren(parent, { direction: 'horizontal' });
            expect(child1.x).toBe(0);
            expect(child2.x).toBe(58); // 50 (width) + 8 (default gap)
        });

        it('should respect custom gap', () => {
            layoutChildren(parent, { gap: 16 });
            expect(child2.y).toBe(46); // 30 + 16
        });

        it('should respect padding', () => {
            layoutChildren(parent, { padding: 10 });
            expect(child1.y).toBe(10);
        });
    });

    describe('gridLayout', () => {
        it('should layout children in grid', () => {
            gridLayout(parent, {
                columns: 2,
                cellWidth: 50,
                cellHeight: 30,
            });
            expect(child1.x).toBe(0);
            expect(child1.y).toBe(0);
            expect(child2.x).toBe(58); // 50 + 8 (default gap)
            expect(child2.y).toBe(0);
        });

        it('should wrap to next row', () => {
            const child3 = new Container();
            (child3 as { width: number }).width = 50;
            (child3 as { height: number }).height = 30;
            parent.children.push(child3);

            gridLayout(parent, {
                columns: 2,
                cellWidth: 50,
                cellHeight: 30,
            });
            expect(child3.x).toBe(0);
            expect(child3.y).toBe(38); // 30 + 8 (default gap)
        });
    });
});

describe('UIAnimator', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('fadeIn', () => {
        it('should start with alpha 0', () => {
            UIAnimator.fadeIn(container);
            expect(container.alpha).toBe(0);
        });

        it('should set visible to true', () => {
            container.visible = false;
            UIAnimator.fadeIn(container);
            expect(container.visible).toBe(true);
        });
    });

    describe('fadeOut', () => {
        it('should start animation', () => {
            container.alpha = 1;
            expect(() => UIAnimator.fadeOut(container)).not.toThrow();
        });
    });

    describe('slideIn', () => {
        it('should set visible to true', () => {
            container.visible = false;
            UIAnimator.slideIn(container, 'left', 100);
            expect(container.visible).toBe(true);
        });
    });

    describe('pulse', () => {
        it('should start animation', () => {
            expect(() => UIAnimator.pulse(container)).not.toThrow();
        });
    });
});
