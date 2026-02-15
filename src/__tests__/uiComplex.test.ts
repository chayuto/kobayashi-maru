/**
 * Tests for UI Complex Components: TurretMenu, HealthBar, MobileControlsOverlay
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
    const { setupPixiMock } = await import('./helpers/mockPixi');
    return setupPixiMock();
});

import { TurretMenu } from '../ui/TurretMenu';
import { HealthBar } from '../ui/HealthBar';
import { MobileControlsOverlay } from '../ui/MobileControlsOverlay';
import { TurretType, TURRET_CONFIG } from '../types/constants';
import { UI_STYLES } from '../ui/styles';

// ---------------------------------------------------------------------------
// TurretMenu
// ---------------------------------------------------------------------------
describe('TurretMenu', () => {
    let menu: TurretMenu;

    beforeEach(() => {
        menu = new TurretMenu();
    });

    afterEach(() => {
        menu.destroy();
    });

    describe('creation', () => {
        it('should create a container when instantiated', () => {
            expect(menu.container).toBeDefined();
        });

        it('should create a button for each turret type', () => {
            const turretTypeCount = Object.values(TurretType).filter(
                (v) => typeof v === 'number'
            ).length;
            // Each turret type adds a child container (button) to the main container
            expect(menu.container.children.length).toBe(turretTypeCount);
        });

        it('should set interactive mode on buttons', () => {
            const firstButton = menu.container.children[0] as unknown as {
                eventMode: string;
                cursor: string;
            };
            expect(firstButton.eventMode).toBe('static');
            expect(firstButton.cursor).toBe('pointer');
        });
    });

    describe('turret type selection', () => {
        it('should invoke callback when a turret button is pressed and resources are sufficient', () => {
            const callback = vi.fn();
            menu.onSelect(callback);

            // Set resources high enough to afford any turret
            menu.update(10000);

            // Simulate pointerdown on the first button (Phaser Array = type 0)
            const firstButton = menu.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            // Find the 'pointerdown' handler registered via `on`
            const pointerdownCall = firstButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            expect(pointerdownCall).toBeDefined();
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(callback).toHaveBeenCalledWith(TurretType.PHASER_ARRAY);
        });

        it('should not invoke callback when resources are insufficient', () => {
            const callback = vi.fn();
            menu.onSelect(callback);

            // Set resources to 0 so nothing can be afforded
            menu.update(0);

            const firstButton = menu.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerdownCall = firstButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(callback).not.toHaveBeenCalled();
        });

        it('should not invoke callback when no callback is registered', () => {
            menu.update(10000);

            const firstButton = menu.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerdownCall = firstButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;

            // Should not throw even without a callback
            expect(() => handler()).not.toThrow();
        });
    });

    describe('resource display / update', () => {
        it('should mark buttons as affordable when resources are high', () => {
            menu.update(10000);

            const firstButton = menu.container.children[0] as unknown as {
                cursor: string;
                alpha: number;
            };
            expect(firstButton.cursor).toBe('pointer');
            expect(firstButton.alpha).toBe(1);
        });

        it('should mark buttons as unaffordable when resources are zero', () => {
            menu.update(0);

            const firstButton = menu.container.children[0] as unknown as {
                cursor: string;
                alpha: number;
            };
            expect(firstButton.cursor).toBe('not-allowed');
            expect(firstButton.alpha).toBe(0.7);
        });

        it('should correctly handle partial affordability', () => {
            // Phaser Array costs 110, Torpedo Launcher costs 160
            const phaserCost = TURRET_CONFIG[TurretType.PHASER_ARRAY].cost;
            menu.update(phaserCost); // Can afford phaser but not torpedo

            // Phaser button should be affordable
            const phaserButton = menu.container.children[0] as unknown as {
                cursor: string;
                alpha: number;
            };
            expect(phaserButton.cursor).toBe('pointer');
            expect(phaserButton.alpha).toBe(1);
        });
    });

    describe('pointer events', () => {
        it('should register pointerover handler on buttons', () => {
            const firstButton = menu.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointeroverCall = firstButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerover'
            );
            expect(pointeroverCall).toBeDefined();
        });

        it('should register pointerout handler on buttons', () => {
            const firstButton = menu.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointeroutCall = firstButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerout'
            );
            expect(pointeroutCall).toBeDefined();
        });

        it('should handle pointerover when resources are sufficient', () => {
            menu.update(10000);

            const firstButton = menu.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointeroverCall = firstButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerover'
            );
            const handler = pointeroverCall![1] as () => void;
            expect(() => handler()).not.toThrow();
        });

        it('should handle pointerout when resources are sufficient', () => {
            menu.update(10000);

            const firstButton = menu.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointeroutCall = firstButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerout'
            );
            const handler = pointeroutCall![1] as () => void;
            expect(() => handler()).not.toThrow();
        });
    });

    describe('setPosition', () => {
        it('should set position of the menu container', () => {
            menu.setPosition(100, 200);
            expect(menu.container.position.set).toHaveBeenCalledWith(100, 200);
        });
    });

    describe('destroy', () => {
        it('should destroy container with children', () => {
            menu.destroy();
            expect(menu.container.destroy).toHaveBeenCalledWith({
                children: true,
            });
        });
    });
});

// ---------------------------------------------------------------------------
// HealthBar
// ---------------------------------------------------------------------------
describe('HealthBar', () => {
    let healthBar: HealthBar;

    beforeEach(() => {
        healthBar = new HealthBar();
    });

    afterEach(() => {
        healthBar.destroy();
    });

    describe('creation', () => {
        it('should create a container when instantiated', () => {
            expect(healthBar.container).toBeDefined();
        });

        it('should use default width and height from UI_STYLES', () => {
            // The bar creates background, fill, and label as children
            expect(healthBar.container.children.length).toBe(3);
        });

        it('should accept custom dimensions and color', () => {
            const custom = new HealthBar(200, 30, 0xff0000, 'HP');
            expect(custom.container).toBeDefined();
            expect(custom.container.children.length).toBe(3);
            custom.destroy();
        });
    });

    describe('update', () => {
        it('should update the label with current/max values', () => {
            healthBar.update(75, 100);

            // Find the Text child (label) -- it's the third child added
            const label = healthBar.container.children[2] as unknown as {
                text: string;
            };
            expect(label.text).toBe('75/100');
        });

        it('should floor the displayed values', () => {
            healthBar.update(33.7, 99.9);

            const label = healthBar.container.children[2] as unknown as {
                text: string;
            };
            expect(label.text).toBe('33/99');
        });

        it('should handle zero max value without error', () => {
            expect(() => healthBar.update(0, 0)).not.toThrow();

            const label = healthBar.container.children[2] as unknown as {
                text: string;
            };
            expect(label.text).toBe('0/0');
        });

        it('should call drawFill internally (fillBar clear is invoked)', () => {
            const fillBar = healthBar.container.children[1] as unknown as {
                clear: ReturnType<typeof vi.fn>;
            };
            fillBar.clear.mockClear();

            healthBar.update(50, 100);
            expect(fillBar.clear).toHaveBeenCalled();
        });
    });

    describe('setColor', () => {
        it('should redraw background and fill when color changes', () => {
            const bg = healthBar.container.children[0] as unknown as {
                clear: ReturnType<typeof vi.fn>;
            };
            const fill = healthBar.container.children[1] as unknown as {
                clear: ReturnType<typeof vi.fn>;
            };
            bg.clear.mockClear();
            fill.clear.mockClear();

            healthBar.setColor(0xff0000);

            expect(bg.clear).toHaveBeenCalled();
            expect(fill.clear).toHaveBeenCalled();
        });
    });

    describe('setPosition', () => {
        it('should set position of the health bar container', () => {
            healthBar.setPosition(50, 75);
            expect(healthBar.container.position.set).toHaveBeenCalledWith(
                50,
                75
            );
        });
    });

    describe('show / hide', () => {
        it('should hide the health bar', () => {
            healthBar.hide();
            expect(healthBar.container.visible).toBe(false);
        });

        it('should show the health bar after hiding', () => {
            healthBar.hide();
            healthBar.show();
            expect(healthBar.container.visible).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should destroy container with children', () => {
            healthBar.destroy();
            expect(healthBar.container.destroy).toHaveBeenCalledWith({
                children: true,
            });
        });
    });
});

// ---------------------------------------------------------------------------
// MobileControlsOverlay
// ---------------------------------------------------------------------------
describe('MobileControlsOverlay', () => {
    let overlay: MobileControlsOverlay;

    beforeEach(() => {
        overlay = new MobileControlsOverlay();
    });

    afterEach(() => {
        overlay.destroy();
    });

    describe('creation', () => {
        it('should create a container when instantiated', () => {
            expect(overlay.container).toBeDefined();
        });

        it('should create three control buttons (PAUSE, RESTART, DEBUG)', () => {
            // Three buttons added as children of the container
            expect(overlay.container.children.length).toBe(3);
        });

        it('should set interactive mode on each button', () => {
            for (const child of overlay.container.children) {
                const button = child as unknown as {
                    eventMode: string;
                    cursor: string;
                };
                expect(button.eventMode).toBe('static');
                expect(button.cursor).toBe('pointer');
            }
        });
    });

    describe('touch handlers / button actions', () => {
        it('should dispatch Escape keydown event when PAUSE button is pressed', () => {
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

            const pauseButton = overlay.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerdownCall = pauseButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            expect(pointerdownCall).toBeDefined();
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'keydown',
                    key: 'Escape',
                })
            );
            dispatchSpy.mockRestore();
        });

        it('should dispatch "r" keydown event when RESTART button is pressed', () => {
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

            const restartButton = overlay.container.children[1] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerdownCall = restartButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'keydown',
                    key: 'r',
                })
            );
            dispatchSpy.mockRestore();
        });

        it('should dispatch backtick keydown event when DEBUG button is pressed', () => {
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

            const debugButton = overlay.container.children[2] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerdownCall = debugButton.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerdown'
            );
            const handler = pointerdownCall![1] as () => void;
            handler();

            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'keydown',
                    key: '`',
                })
            );
            dispatchSpy.mockRestore();
        });

        it('should register pointerup handler on buttons', () => {
            const button = overlay.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerupCall = button.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerup'
            );
            expect(pointerupCall).toBeDefined();
        });

        it('should register pointerupoutside handler on buttons', () => {
            const button = overlay.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerupoutsideCall = button.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerupoutside'
            );
            expect(pointerupoutsideCall).toBeDefined();
        });

        it('should not throw when pointerup handler is invoked', () => {
            const button = overlay.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerupCall = button.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerup'
            );
            const handler = pointerupCall![1] as () => void;
            expect(() => handler()).not.toThrow();
        });

        it('should not throw when pointerupoutside handler is invoked', () => {
            const button = overlay.container.children[0] as unknown as {
                on: ReturnType<typeof vi.fn>;
            };
            const pointerupoutsideCall = button.on.mock.calls.find(
                (call: unknown[]) => call[0] === 'pointerupoutside'
            );
            const handler = pointerupoutsideCall![1] as () => void;
            expect(() => handler()).not.toThrow();
        });
    });

    describe('updateLayout', () => {
        it('should set scale and position for each button at scale 1', () => {
            overlay.updateLayout(1);

            for (let i = 0; i < overlay.container.children.length; i++) {
                const button = overlay.container.children[i] as unknown as {
                    scale: { set: ReturnType<typeof vi.fn> };
                    position: { set: ReturnType<typeof vi.fn> };
                };
                expect(button.scale.set).toHaveBeenCalledWith(1);
                expect(button.position.set).toHaveBeenCalled();
            }
        });

        it('should apply scale factor to button positions', () => {
            const scale = 2;
            overlay.updateLayout(scale);

            const padding = UI_STYLES.PADDING * scale;
            const buttonWidth = 100 * scale;
            const spacing = 10 * scale;

            for (let i = 0; i < overlay.container.children.length; i++) {
                const button = overlay.container.children[i] as unknown as {
                    position: { set: ReturnType<typeof vi.fn> };
                };
                const expectedX =
                    padding + 200 * scale + padding + i * (buttonWidth + spacing);
                const expectedY = padding;
                expect(button.position.set).toHaveBeenCalledWith(
                    expectedX,
                    expectedY
                );
            }
        });

        it('should set scale on each button', () => {
            overlay.updateLayout(0.5);

            for (const child of overlay.container.children) {
                const button = child as unknown as {
                    scale: { set: ReturnType<typeof vi.fn> };
                };
                expect(button.scale.set).toHaveBeenCalledWith(0.5);
            }
        });
    });

    describe('destroy', () => {
        it('should destroy container with children', () => {
            overlay.destroy();
            expect(overlay.container.destroy).toHaveBeenCalledWith({
                children: true,
            });
        });
    });
});
