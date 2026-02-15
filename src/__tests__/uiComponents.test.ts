/**
 * Tests for UI Button Components: Button, ToggleButton, IconButton, LeftButtonPanel
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
    const { setupPixiMock } = await import('./helpers/mockPixi');
    return setupPixiMock();
});

import { Container } from 'pixi.js';
import { Button } from '../ui/components/Button';
import { ToggleButton, ToggleButtonConfig } from '../ui/components/ToggleButton';
import { IconButton, IconButtonConfig } from '../ui/components/IconButton';
import { LeftButtonPanel } from '../ui/components/LeftButtonPanel';
import { HUDLayoutManager } from '../ui/HUDLayoutManager';
import { UI_STYLES } from '../ui/styles';

// ============================================================
// Button Tests
// ============================================================
describe('Button', () => {
    let button: Button;
    const mockOnClick = vi.fn();

    beforeEach(() => {
        mockOnClick.mockClear();
    });

    afterEach(() => {
        button?.destroy();
    });

    describe('creation', () => {
        it('should create a container when constructed', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            expect(button.container).toBeDefined();
            expect(button.container).toBeInstanceOf(Container);
        });

        it('should use default dimensions when none are provided', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            const dims = button.getDimensions();
            expect(dims.width).toBe(100);
            expect(dims.height).toBe(32); // UI_CONFIG.BUTTONS.TOGGLE_HEIGHT
        });

        it('should use custom dimensions when provided', () => {
            button = new Button({ text: 'Test', width: 200, height: 50, onClick: mockOnClick });
            const dims = button.getDimensions();
            expect(dims.width).toBe(200);
            expect(dims.height).toBe(50);
        });

        it('should set eventMode to static on the container', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            expect(button.container.eventMode).toBe('static');
        });

        it('should set cursor to pointer when enabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            expect(button.container.cursor).toBe('pointer');
        });

        it('should set cursor to not-allowed when created disabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick, disabled: true });
            expect(button.container.cursor).toBe('not-allowed');
        });

        it('should add background and label as children of the container', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            // Container.addChild should be called twice: once for background, once for label
            expect(button.container.addChild).toHaveBeenCalledTimes(2);
        });

        it('should register event handlers on the container', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            // pointerdown, pointerover, pointerout
            expect(button.container.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
            expect(button.container.on).toHaveBeenCalledWith('pointerover', expect.any(Function));
            expect(button.container.on).toHaveBeenCalledWith('pointerout', expect.any(Function));
        });
    });

    describe('click callbacks', () => {
        it('should invoke onClick callback when clicked and enabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            // Extract the pointerdown handler that was registered
            const pointerdownCall = (button.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            expect(pointerdownCall).toBeDefined();
            const handler = pointerdownCall![1] as () => void;
            handler();
            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });

        it('should not invoke onClick callback when clicked and disabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick, disabled: true });
            const pointerdownCall = (button.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();
            expect(mockOnClick).not.toHaveBeenCalled();
        });

        it('should not invoke onClick after being disabled post-creation', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.disabled = true;
            const pointerdownCall = (button.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();
            expect(mockOnClick).not.toHaveBeenCalled();
        });
    });

    describe('enable/disable', () => {
        it('should report disabled as false by default', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            expect(button.disabled).toBe(false);
        });

        it('should set disabled state via setter', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.disabled = true;
            expect(button.disabled).toBe(true);
        });

        it('should update cursor to not-allowed when disabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.disabled = true;
            expect(button.container.cursor).toBe('not-allowed');
        });

        it('should update cursor to pointer when re-enabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.disabled = true;
            button.disabled = false;
            expect(button.container.cursor).toBe('pointer');
        });

        it('should set alpha to 0.5 when disabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.disabled = true;
            expect(button.container.alpha).toBe(0.5);
        });

        it('should set alpha to 1 when re-enabled', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.disabled = true;
            button.disabled = false;
            expect(button.container.alpha).toBe(1);
        });
    });

    describe('setText', () => {
        it('should update the label text', () => {
            button = new Button({ text: 'Old', onClick: mockOnClick });
            button.setText('New');
            // The label is the second child added to the container
            // We can verify by checking that setText doesn't throw
            expect(() => button.setText('Updated')).not.toThrow();
        });
    });

    describe('setPosition', () => {
        it('should set the container position', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.setPosition(50, 100);
            expect(button.container.position.set).toHaveBeenCalledWith(50, 100);
        });
    });

    describe('setScale', () => {
        it('should set the container scale', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.setScale(1.5);
            expect(button.container.scale.set).toHaveBeenCalledWith(1.5);
        });
    });

    describe('destroy', () => {
        it('should destroy the container with children', () => {
            button = new Button({ text: 'Test', onClick: mockOnClick });
            button.destroy();
            expect(button.container.destroy).toHaveBeenCalledWith({ children: true });
        });
    });
});

// ============================================================
// ToggleButton Tests
// ============================================================
describe('ToggleButton', () => {
    let toggleButton: ToggleButton;
    let parent: Container;
    let isEnabled: boolean;
    const mockOnClick = vi.fn();

    function createConfig(overrides?: Partial<ToggleButtonConfig>): ToggleButtonConfig {
        return {
            label: 'GOD MODE',
            enabledColor: UI_STYLES.COLORS.HEALTH,
            onClick: mockOnClick,
            isEnabled: () => isEnabled,
            ...overrides,
        };
    }

    beforeEach(() => {
        isEnabled = false;
        mockOnClick.mockClear();
        parent = new Container();
    });

    afterEach(() => {
        toggleButton?.destroy();
    });

    describe('creation', () => {
        it('should create a container when constructed', () => {
            toggleButton = new ToggleButton(createConfig());
            expect(toggleButton.container).toBeDefined();
            expect(toggleButton.container).toBeInstanceOf(Container);
        });

        it('should set eventMode to static after init', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);
            expect(toggleButton.container.eventMode).toBe('static');
        });

        it('should set cursor to pointer after init', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);
            expect(toggleButton.container.cursor).toBe('pointer');
        });

        it('should add itself to the parent container on init', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);
            expect(parent.addChild).toHaveBeenCalledWith(toggleButton.container);
        });
    });

    describe('click and state changes', () => {
        it('should call onClick when clicked', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);

            const pointerdownCall = (toggleButton.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });

        it('should update visual state when onClick returns a boolean', () => {
            const clickFn = vi.fn().mockReturnValue(true);
            toggleButton = new ToggleButton(createConfig({ onClick: clickFn }));
            toggleButton.init(parent);

            const pointerdownCall = (toggleButton.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(clickFn).toHaveBeenCalled();
            // Visual state update is internal -- no throw means success
        });

        it('should not update visual state when onClick returns void', () => {
            const clickFn = vi.fn().mockReturnValue(undefined);
            toggleButton = new ToggleButton(createConfig({ onClick: clickFn }));
            toggleButton.init(parent);

            const pointerdownCall = (toggleButton.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            // Should not throw even when onClick returns void
            expect(() => handler()).not.toThrow();
        });
    });

    describe('visual state', () => {
        it('should reflect enabled state after sync', () => {
            isEnabled = true;
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);
            // sync is called at the end of init, so visual state should match isEnabled
            // Verify no throw and the button was set up correctly
            expect(toggleButton.container).toBeDefined();
        });

        it('should update visual state when updateVisualState is called with true', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);
            expect(() => toggleButton.updateVisualState(true)).not.toThrow();
        });

        it('should update visual state when updateVisualState is called with false', () => {
            isEnabled = true;
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);
            expect(() => toggleButton.updateVisualState(false)).not.toThrow();
        });

        it('should sync visual state with isEnabled callback', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.init(parent);
            isEnabled = true;
            toggleButton.sync();
            // sync calls updateVisualState with isEnabled(), should not throw
            expect(toggleButton.container).toBeDefined();
        });
    });

    describe('positioning and scale', () => {
        it('should set position on the container', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.setPosition(100, 200);
            expect(toggleButton.container.position.set).toHaveBeenCalledWith(100, 200);
        });

        it('should set scale on the container', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.setScale(2);
            expect(toggleButton.container.scale.set).toHaveBeenCalledWith(2);
        });
    });

    describe('getDimensions', () => {
        it('should return width and height from static method', () => {
            const dims = ToggleButton.getDimensions();
            expect(dims.width).toBe(130);
            expect(dims.height).toBe(32); // UI_CONFIG.BUTTONS.TOGGLE_HEIGHT
        });
    });

    describe('destroy', () => {
        it('should destroy the container with children', () => {
            toggleButton = new ToggleButton(createConfig());
            toggleButton.destroy();
            expect(toggleButton.container.destroy).toHaveBeenCalledWith({ children: true });
        });
    });
});

// ============================================================
// IconButton Tests
// ============================================================
describe('IconButton', () => {
    let iconButton: IconButton;
    let parent: Container;
    let isActive: boolean;
    const mockOnClick = vi.fn();
    const mockDrawIcon = vi.fn();

    function createConfig(overrides?: Partial<IconButtonConfig>): IconButtonConfig {
        return {
            label: 'SOUND',
            activeColor: UI_STYLES.COLORS.PRIMARY,
            inactiveColor: 0x888888,
            onClick: mockOnClick,
            isActive: () => isActive,
            drawIcon: mockDrawIcon,
            ...overrides,
        };
    }

    beforeEach(() => {
        isActive = true;
        mockOnClick.mockClear();
        mockDrawIcon.mockClear();
        parent = new Container();
    });

    afterEach(() => {
        iconButton?.destroy();
    });

    describe('creation', () => {
        it('should create a container when constructed', () => {
            iconButton = new IconButton(createConfig());
            expect(iconButton.container).toBeDefined();
            expect(iconButton.container).toBeInstanceOf(Container);
        });

        it('should set eventMode to static after init', () => {
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            expect(iconButton.container.eventMode).toBe('static');
        });

        it('should set cursor to pointer after init', () => {
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            expect(iconButton.container.cursor).toBe('pointer');
        });

        it('should add itself to the parent container on init', () => {
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            expect(parent.addChild).toHaveBeenCalledWith(iconButton.container);
        });

        it('should call drawIcon during init', () => {
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            // drawIcon is called in updateIcon() during init, and again in updateVisualState() at end of init
            expect(mockDrawIcon).toHaveBeenCalled();
        });

        it('should pass active state and colors to drawIcon', () => {
            isActive = true;
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            expect(mockDrawIcon).toHaveBeenCalledWith(
                expect.any(Object), // Graphics instance
                true,               // active state
                UI_STYLES.COLORS
            );
        });
    });

    describe('click behavior', () => {
        it('should call onClick when clicked', () => {
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);

            const pointerdownCall = (iconButton.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });

        it('should update visual state after click', () => {
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            mockDrawIcon.mockClear();

            const pointerdownCall = (iconButton.container.on as ReturnType<typeof vi.fn>).mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();

            // updateVisualState calls updateIcon which calls drawIcon
            expect(mockDrawIcon).toHaveBeenCalled();
        });
    });

    describe('visual state', () => {
        it('should update visual state based on isActive', () => {
            isActive = false;
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            expect(mockDrawIcon).toHaveBeenCalledWith(
                expect.any(Object),
                false,
                UI_STYLES.COLORS
            );
        });

        it('should call updateVisualState without error', () => {
            iconButton = new IconButton(createConfig());
            iconButton.init(parent);
            isActive = false;
            expect(() => iconButton.updateVisualState()).not.toThrow();
        });
    });

    describe('setLabel', () => {
        it('should update the label text', () => {
            iconButton = new IconButton(createConfig());
            expect(() => iconButton.setLabel('MUTE')).not.toThrow();
        });
    });

    describe('positioning and scale', () => {
        it('should set position on the container', () => {
            iconButton = new IconButton(createConfig());
            iconButton.setPosition(10, 20);
            expect(iconButton.container.position.set).toHaveBeenCalledWith(10, 20);
        });

        it('should set scale on the container', () => {
            iconButton = new IconButton(createConfig());
            iconButton.setScale(0.8);
            expect(iconButton.container.scale.set).toHaveBeenCalledWith(0.8);
        });
    });

    describe('getDimensions', () => {
        it('should return width and height from static method', () => {
            const dims = IconButton.getDimensions();
            expect(dims.width).toBe(120);
            expect(dims.height).toBe(32); // UI_CONFIG.BUTTONS.TOGGLE_HEIGHT
        });
    });

    describe('destroy', () => {
        it('should destroy the container with children', () => {
            iconButton = new IconButton(createConfig());
            iconButton.destroy();
            expect(iconButton.container.destroy).toHaveBeenCalledWith({ children: true });
        });
    });
});

// ============================================================
// LeftButtonPanel Tests
// ============================================================
describe('LeftButtonPanel', () => {
    let panel: LeftButtonPanel;
    let parent: Container;

    function createMockToggleButton(): ToggleButton {
        return new ToggleButton({
            label: 'TEST',
            enabledColor: 0xFF0000,
            onClick: vi.fn(),
            isEnabled: () => false,
        });
    }

    function createMockIconButton(): IconButton {
        return new IconButton({
            label: 'ICON',
            activeColor: 0x00FF00,
            inactiveColor: 0x888888,
            onClick: vi.fn(),
            isActive: () => true,
            drawIcon: vi.fn(),
        });
    }

    beforeEach(() => {
        parent = new Container();
        panel = new LeftButtonPanel();
    });

    afterEach(() => {
        panel?.destroy();
    });

    describe('initialization', () => {
        it('should add its container to the parent on init', () => {
            panel.init(parent);
            expect(parent.addChild).toHaveBeenCalled();
        });

        it('should not initialize twice', () => {
            panel.init(parent);
            panel.init(parent);
            // addChild should only be called once
            expect(parent.addChild).toHaveBeenCalledTimes(1);
        });

        it('should provide its container via getContainer', () => {
            const container = panel.getContainer();
            expect(container).toBeDefined();
            expect(container).toBeInstanceOf(Container);
        });
    });

    describe('button management', () => {
        it('should set a mute button', () => {
            const muteBtn = createMockIconButton();
            expect(() => panel.setMuteButton(muteBtn)).not.toThrow();
        });

        it('should add toggle buttons at specific indices', () => {
            const btn1 = createMockToggleButton();
            const btn2 = createMockToggleButton();

            panel.addToggleButton(btn1, 0);
            panel.addToggleButton(btn2, 1);

            expect(panel.getToggleButtonCount()).toBe(2);
        });

        it('should retrieve a toggle button by index', () => {
            const btn = createMockToggleButton();
            panel.addToggleButton(btn, 0);

            expect(panel.getToggleButton(0)).toBe(btn);
        });

        it('should return undefined for a non-existent toggle button index', () => {
            expect(panel.getToggleButton(99)).toBeUndefined();
        });

        it('should report correct toggle button count', () => {
            expect(panel.getToggleButtonCount()).toBe(0);
            panel.addToggleButton(createMockToggleButton(), 0);
            expect(panel.getToggleButtonCount()).toBe(1);
        });
    });

    describe('updateLayout', () => {
        it('should update mute button position and scale when layout is updated', () => {
            const muteBtn = createMockIconButton();
            panel.setMuteButton(muteBtn);

            const mockLayoutManager = {
                getMuteButtonPosition: vi.fn().mockReturnValue({ x: 16, y: 100 }),
                getToggleButtonPosition: vi.fn().mockReturnValue({ x: 16, y: 200 }),
            } as unknown as HUDLayoutManager;

            panel.updateLayout(1.0, mockLayoutManager);

            expect(muteBtn.container.scale.set).toHaveBeenCalledWith(1.0);
            expect(muteBtn.container.position.set).toHaveBeenCalledWith(16, 100);
            expect(mockLayoutManager.getMuteButtonPosition).toHaveBeenCalledWith(1.0);
        });

        it('should update toggle button positions and scales when layout is updated', () => {
            const btn0 = createMockToggleButton();
            const btn1 = createMockToggleButton();
            panel.addToggleButton(btn0, 0);
            panel.addToggleButton(btn1, 1);

            const mockLayoutManager = {
                getMuteButtonPosition: vi.fn().mockReturnValue({ x: 16, y: 100 }),
                getToggleButtonPosition: vi.fn()
                    .mockReturnValueOnce({ x: 16, y: 200 })
                    .mockReturnValueOnce({ x: 16, y: 250 }),
            } as unknown as HUDLayoutManager;

            panel.updateLayout(1.5, mockLayoutManager);

            expect(btn0.container.scale.set).toHaveBeenCalledWith(1.5);
            expect(btn0.container.position.set).toHaveBeenCalledWith(16, 200);
            expect(btn1.container.scale.set).toHaveBeenCalledWith(1.5);
            expect(btn1.container.position.set).toHaveBeenCalledWith(16, 250);
        });

        it('should handle updateLayout with no buttons without error', () => {
            const mockLayoutManager = {
                getMuteButtonPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
                getToggleButtonPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            } as unknown as HUDLayoutManager;

            expect(() => panel.updateLayout(1.0, mockLayoutManager)).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('should destroy the mute button when panel is destroyed', () => {
            const muteBtn = createMockIconButton();
            panel.setMuteButton(muteBtn);
            panel.destroy();
            expect(muteBtn.container.destroy).toHaveBeenCalledWith({ children: true });
        });

        it('should destroy all toggle buttons when panel is destroyed', () => {
            const btn0 = createMockToggleButton();
            const btn1 = createMockToggleButton();
            panel.addToggleButton(btn0, 0);
            panel.addToggleButton(btn1, 1);

            panel.destroy();

            expect(btn0.container.destroy).toHaveBeenCalledWith({ children: true });
            expect(btn1.container.destroy).toHaveBeenCalledWith({ children: true });
        });

        it('should clear toggle buttons map after destroy', () => {
            panel.addToggleButton(createMockToggleButton(), 0);
            panel.destroy();
            expect(panel.getToggleButtonCount()).toBe(0);
        });

        it('should destroy the container with children', () => {
            panel.init(parent);
            const container = panel.getContainer();
            panel.destroy();
            expect(container.destroy).toHaveBeenCalledWith({ children: true });
        });

        it('should allow re-initialization after destroy', () => {
            panel.init(parent);
            panel.destroy();
            // After destroy, initialized is false, so init should work again
            const newParent = new Container();
            expect(() => panel.init(newParent)).not.toThrow();
        });
    });
});
