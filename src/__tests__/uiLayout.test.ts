/**
 * Tests for UI Infrastructure: Layout, UIAnimator, HUDLayoutManager, HUDPanelManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
    const { setupPixiMock } = await import('./helpers/mockPixi');
    return setupPixiMock();
});

// Mock the panels used by HUDPanelManager
vi.mock('../ui/panels', () => {
    function createMockPanelClass() {
        return class MockPanel {
            init = vi.fn();
            setPosition = vi.fn();
            setScale = vi.fn();
            update = vi.fn();
            destroy = vi.fn();
            container = { visible: true };
        };
    }
    return {
        WavePanel: createMockPanelClass(),
        ResourcePanel: createMockPanelClass(),
        StatusPanel: createMockPanelClass(),
        ScorePanel: createMockPanelClass(),
        TurretCountPanel: createMockPanelClass(),
        CombatStatsPanel: createMockPanelClass(),
        ComboPanel: createMockPanelClass(),
        AchievementToast: createMockPanelClass(),
        AIPanel: createMockPanelClass(),
        AIThoughtFeed: createMockPanelClass(),
    };
});

// Mock ToggleButton.getDimensions for HUDLayoutManager
vi.mock('../ui/components', () => ({
    ToggleButton: {
        getDimensions: () => ({ width: 130, height: 32 }),
    },
}));

import { Container } from 'pixi.js';
import {
    layoutChildren,
    gridLayout,
    centerChild,
    alignChild,
} from '../ui/layout';
import { UIAnimator } from '../ui/animation';
import { HUDLayoutManager } from '../ui/HUDLayoutManager';
import { HUDPanelManager } from '../ui/managers/HUDPanelManager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a mock container with children that have width/height/x/y/visible */
function createParentWithChildren(
    childConfigs: Array<{ width: number; height: number; visible?: boolean }>
): Container {
    const parent = new Container();
    const children: Container[] = [];
    for (const cfg of childConfigs) {
        const child = new Container();
        (child as { width: number }).width = cfg.width;
        (child as { height: number }).height = cfg.height;
        child.visible = cfg.visible ?? true;
        children.push(child);
    }
    parent.children = children as never;
    return parent;
}

// ---------------------------------------------------------------------------
// Layout Utilities (src/ui/layout/Layout.ts)
// ---------------------------------------------------------------------------
describe('Layout Utilities', () => {
    describe('layoutChildren', () => {
        it('should layout children vertically with default options when no options provided', () => {
            const parent = createParentWithChildren([
                { width: 100, height: 20 },
                { width: 100, height: 30 },
                { width: 100, height: 40 },
            ]);
            const [c1, c2, c3] = parent.children as Container[];

            layoutChildren(parent);

            // Default: vertical, gap=8, padding=0
            expect(c1.y).toBe(0);
            expect(c2.y).toBe(28); // 20 + 8
            expect(c3.y).toBe(66); // 28 + 30 + 8
        });

        it('should layout children horizontally when direction is horizontal', () => {
            const parent = createParentWithChildren([
                { width: 50, height: 20 },
                { width: 60, height: 20 },
            ]);
            const [c1, c2] = parent.children as Container[];

            layoutChildren(parent, { direction: 'horizontal' });

            expect(c1.x).toBe(0);
            expect(c2.x).toBe(58); // 50 + 8
        });

        it('should apply custom gap between children', () => {
            const parent = createParentWithChildren([
                { width: 40, height: 25 },
                { width: 40, height: 25 },
            ]);
            const [c1, c2] = parent.children as Container[];

            layoutChildren(parent, { gap: 20 });

            expect(c1.y).toBe(0);
            expect(c2.y).toBe(45); // 25 + 20
        });

        it('should apply padding from container edges', () => {
            const parent = createParentWithChildren([
                { width: 40, height: 25 },
                { width: 40, height: 25 },
            ]);
            const [c1, c2] = parent.children as Container[];

            layoutChildren(parent, { padding: 12 });

            expect(c1.y).toBe(12);
            expect(c2.y).toBe(45); // 12 + 25 + 8
        });

        it('should apply padding with horizontal direction', () => {
            const parent = createParentWithChildren([
                { width: 30, height: 20 },
                { width: 40, height: 20 },
            ]);
            const [c1, c2] = parent.children as Container[];

            layoutChildren(parent, { direction: 'horizontal', padding: 5 });

            expect(c1.x).toBe(5);
            expect(c2.x).toBe(43); // 5 + 30 + 8
        });

        it('should skip invisible children', () => {
            const parent = createParentWithChildren([
                { width: 100, height: 20 },
                { width: 100, height: 30, visible: false },
                { width: 100, height: 40 },
            ]);
            const [c1, , c3] = parent.children as Container[];

            layoutChildren(parent);

            expect(c1.y).toBe(0);
            // c2 is invisible, so c3 comes right after c1
            expect(c3.y).toBe(28); // 0 + 20 + 8
        });

        it('should handle zero gap correctly', () => {
            const parent = createParentWithChildren([
                { width: 40, height: 15 },
                { width: 40, height: 15 },
            ]);
            const [c1, c2] = parent.children as Container[];

            layoutChildren(parent, { gap: 0 });

            expect(c1.y).toBe(0);
            expect(c2.y).toBe(15);
        });

        it('should handle empty container without errors', () => {
            const parent = new Container();
            parent.children = [] as never;

            expect(() => layoutChildren(parent)).not.toThrow();
        });

        it('should handle all options together', () => {
            const parent = createParentWithChildren([
                { width: 50, height: 20 },
                { width: 60, height: 30 },
            ]);
            const [c1, c2] = parent.children as Container[];

            layoutChildren(parent, {
                direction: 'horizontal',
                gap: 10,
                padding: 5,
                align: 'center',
            });

            expect(c1.x).toBe(5);
            expect(c2.x).toBe(65); // 5 + 50 + 10
        });
    });

    describe('gridLayout', () => {
        it('should arrange children in a grid with specified columns', () => {
            const parent = createParentWithChildren([
                { width: 64, height: 64 },
                { width: 64, height: 64 },
                { width: 64, height: 64 },
                { width: 64, height: 64 },
            ]);
            const [c1, c2, c3, c4] = parent.children as Container[];

            gridLayout(parent, { columns: 2, cellWidth: 64, cellHeight: 64 });

            // Row 0
            expect(c1.x).toBe(0);
            expect(c1.y).toBe(0);
            expect(c2.x).toBe(72); // 64 + 8 default gap
            expect(c2.y).toBe(0);
            // Row 1
            expect(c3.x).toBe(0);
            expect(c3.y).toBe(72);
            expect(c4.x).toBe(72);
            expect(c4.y).toBe(72);
        });

        it('should use custom gap between cells', () => {
            const parent = createParentWithChildren([
                { width: 50, height: 50 },
                { width: 50, height: 50 },
            ]);
            const [c1, c2] = parent.children as Container[];

            gridLayout(parent, { columns: 2, cellWidth: 50, cellHeight: 50, gap: 16 });

            expect(c1.x).toBe(0);
            expect(c2.x).toBe(66); // 50 + 16
        });

        it('should apply padding from edges', () => {
            const parent = createParentWithChildren([
                { width: 32, height: 32 },
                { width: 32, height: 32 },
            ]);
            const [c1, c2] = parent.children as Container[];

            gridLayout(parent, {
                columns: 2,
                cellWidth: 32,
                cellHeight: 32,
                padding: 10,
            });

            expect(c1.x).toBe(10);
            expect(c1.y).toBe(10);
            expect(c2.x).toBe(50); // 10 + 32 + 8
        });

        it('should skip invisible children', () => {
            const parent = createParentWithChildren([
                { width: 40, height: 40 },
                { width: 40, height: 40, visible: false },
                { width: 40, height: 40 },
            ]);
            const [c1, , c3] = parent.children as Container[];

            gridLayout(parent, { columns: 2, cellWidth: 40, cellHeight: 40 });

            // c2 invisible, so c3 takes column 1
            expect(c1.x).toBe(0);
            expect(c1.y).toBe(0);
            expect(c3.x).toBe(48); // 40 + 8
            expect(c3.y).toBe(0);
        });

        it('should wrap to next row when columns are filled', () => {
            const parent = createParentWithChildren([
                { width: 30, height: 30 },
                { width: 30, height: 30 },
                { width: 30, height: 30 },
                { width: 30, height: 30 },
                { width: 30, height: 30 },
            ]);
            const children = parent.children as Container[];

            gridLayout(parent, { columns: 3, cellWidth: 30, cellHeight: 30, gap: 5 });

            // Row 0: indices 0, 1, 2
            expect(children[0].x).toBe(0);
            expect(children[1].x).toBe(35);
            expect(children[2].x).toBe(70);
            // Row 1: indices 3, 4
            expect(children[3].x).toBe(0);
            expect(children[3].y).toBe(35);
            expect(children[4].x).toBe(35);
            expect(children[4].y).toBe(35);
        });

        it('should handle single column grid', () => {
            const parent = createParentWithChildren([
                { width: 100, height: 50 },
                { width: 100, height: 50 },
            ]);
            const [c1, c2] = parent.children as Container[];

            gridLayout(parent, { columns: 1, cellWidth: 100, cellHeight: 50 });

            expect(c1.x).toBe(0);
            expect(c1.y).toBe(0);
            expect(c2.x).toBe(0);
            expect(c2.y).toBe(58); // 50 + 8
        });
    });

    describe('centerChild', () => {
        /** Create a container with a getBounds mock */
        function createBoundedChild(boundsWidth: number, boundsHeight: number): Container {
            const child = new Container();
            (child as unknown as Record<string, unknown>).getBounds = vi.fn(() => ({
                width: boundsWidth,
                height: boundsHeight,
            }));
            return child;
        }

        it('should center a child within container dimensions', () => {
            const child = createBoundedChild(80, 40);

            centerChild(child, 400, 300);

            expect(child.x).toBe(160); // (400 - 80) / 2
            expect(child.y).toBe(130); // (300 - 40) / 2
        });

        it('should center a child that is the same size as the container', () => {
            const child = createBoundedChild(200, 200);

            centerChild(child, 200, 200);

            expect(child.x).toBe(0);
            expect(child.y).toBe(0);
        });

        it('should handle child larger than container', () => {
            const child = createBoundedChild(500, 400);

            centerChild(child, 200, 200);

            expect(child.x).toBe(-150); // (200 - 500) / 2
            expect(child.y).toBe(-100); // (200 - 400) / 2
        });
    });

    describe('alignChild', () => {
        let child: Container;

        function createBoundedChild(boundsWidth: number, boundsHeight: number): Container {
            const c = new Container();
            (c as unknown as Record<string, unknown>).getBounds = vi.fn(() => ({
                width: boundsWidth,
                height: boundsHeight,
            }));
            return c;
        }

        beforeEach(() => {
            child = createBoundedChild(100, 50);
        });

        it('should align child to top-left with zero padding', () => {
            alignChild(child, 800, 600, 'top-left');

            expect(child.x).toBe(0);
            expect(child.y).toBe(0);
        });

        it('should align child to top-left with padding', () => {
            alignChild(child, 800, 600, 'top-left', 16);

            expect(child.x).toBe(16);
            expect(child.y).toBe(16);
        });

        it('should align child to top-right', () => {
            alignChild(child, 800, 600, 'top-right', 10);

            expect(child.x).toBe(690); // 800 - 100 - 10
            expect(child.y).toBe(10);
        });

        it('should align child to bottom-left', () => {
            alignChild(child, 800, 600, 'bottom-left', 10);

            expect(child.x).toBe(10);
            expect(child.y).toBe(540); // 600 - 50 - 10
        });

        it('should align child to bottom-right', () => {
            alignChild(child, 800, 600, 'bottom-right', 10);

            expect(child.x).toBe(690); // 800 - 100 - 10
            expect(child.y).toBe(540); // 600 - 50 - 10
        });

        it('should align child to center', () => {
            alignChild(child, 800, 600, 'center');

            expect(child.x).toBe(350); // (800 - 100) / 2
            expect(child.y).toBe(275); // (600 - 50) / 2
        });

        it('should default to zero padding when not provided', () => {
            alignChild(child, 800, 600, 'top-right');

            expect(child.x).toBe(700); // 800 - 100
            expect(child.y).toBe(0);
        });
    });
});

// ---------------------------------------------------------------------------
// UIAnimator (src/ui/animation/UIAnimator.ts) — tick-based animation queue
// ---------------------------------------------------------------------------
describe('UIAnimator', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        UIAnimator.clearAll();
    });

    describe('fadeIn', () => {
        it('should set alpha to 0 immediately when called', () => {
            UIAnimator.fadeIn(container);
            expect(container.alpha).toBe(0);
        });

        it('should set visible to true immediately when called', () => {
            container.visible = false;
            UIAnimator.fadeIn(container);
            expect(container.visible).toBe(true);
        });

        it('should add an active animation', () => {
            UIAnimator.fadeIn(container);
            expect(UIAnimator.getActiveCount()).toBe(1);
        });

        it('should call onComplete callback when animation finishes', () => {
            const onComplete = vi.fn();
            UIAnimator.fadeIn(container, { onComplete });
            UIAnimator.tick(0.5); // past default 0.3s
            expect(onComplete).toHaveBeenCalledTimes(1);
        });

        it('should keep animation active when not yet complete', () => {
            UIAnimator.fadeIn(container, { duration: 0.3 });
            UIAnimator.tick(0.1); // 100ms < 300ms
            expect(UIAnimator.getActiveCount()).toBe(1);
        });

        it('should accept custom duration', () => {
            const onComplete = vi.fn();
            UIAnimator.fadeIn(container, { duration: 0.5, onComplete });
            UIAnimator.tick(0.6);
            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe('fadeOut', () => {
        it('should start from current alpha value', () => {
            container.alpha = 0.8;
            UIAnimator.fadeOut(container);
            // Alpha should still be 0.8 initially (tick hasn't run yet)
            expect(container.alpha).toBe(0.8);
        });

        it('should set visible to false when animation completes', () => {
            container.alpha = 1;
            UIAnimator.fadeOut(container);
            UIAnimator.tick(0.5); // past default 0.3s
            expect(container.visible).toBe(false);
        });

        it('should call onComplete when animation finishes', () => {
            const onComplete = vi.fn();
            container.alpha = 1;
            UIAnimator.fadeOut(container, { onComplete });
            UIAnimator.tick(0.5);
            expect(onComplete).toHaveBeenCalledTimes(1);
        });

        it('should keep animation active when not yet complete', () => {
            container.alpha = 1;
            UIAnimator.fadeOut(container, { duration: 0.3 });
            UIAnimator.tick(0.05);
            expect(UIAnimator.getActiveCount()).toBe(1);
        });
    });

    describe('slideIn', () => {
        it('should set visible to true when called', () => {
            container.visible = false;
            UIAnimator.slideIn(container, 'left', 100);
            expect(container.visible).toBe(true);
        });

        it('should offset container to the left for left slide-in', () => {
            container.x = 50;
            UIAnimator.slideIn(container, 'left', 100);
            expect(container.x).toBe(-50);
        });

        it('should offset container to the right for right slide-in', () => {
            container.x = 50;
            UIAnimator.slideIn(container, 'right', 100);
            expect(container.x).toBe(150);
        });

        it('should offset container upward for top slide-in', () => {
            container.y = 100;
            UIAnimator.slideIn(container, 'top', 80);
            expect(container.y).toBe(20);
        });

        it('should offset container downward for bottom slide-in', () => {
            container.y = 100;
            UIAnimator.slideIn(container, 'bottom', 80);
            expect(container.y).toBe(180);
        });

        it('should call onComplete when animation finishes', () => {
            const onComplete = vi.fn();
            UIAnimator.slideIn(container, 'left', 100, { onComplete });
            UIAnimator.tick(0.5); // past default 0.25s
            expect(onComplete).toHaveBeenCalledTimes(1);
        });
    });

    describe('slideOut', () => {
        it('should set visible to false when animation completes', () => {
            container.x = 50;
            UIAnimator.slideOut(container, 'left', 100);
            UIAnimator.tick(0.5);
            expect(container.visible).toBe(false);
        });

        it('should reset position after slide-out completes', () => {
            container.x = 50;
            container.y = 100;
            UIAnimator.slideOut(container, 'left', 100);
            UIAnimator.tick(0.5);
            expect(container.x).toBe(50);
            expect(container.y).toBe(100);
        });

        it('should call onComplete when animation finishes', () => {
            const onComplete = vi.fn();
            UIAnimator.slideOut(container, 'right', 100, { onComplete });
            UIAnimator.tick(0.5);
            expect(onComplete).toHaveBeenCalledTimes(1);
        });

        it('should animate slide to the left when direction is left', () => {
            container.x = 200;
            UIAnimator.slideOut(container, 'left', 100);
            UIAnimator.tick(0.1); // mid-animation
            expect(container.x).toBeLessThan(200);
        });

        it('should animate slide downward for bottom direction', () => {
            container.y = 50;
            UIAnimator.slideOut(container, 'bottom', 100);
            UIAnimator.tick(0.1);
            expect(container.y).toBeGreaterThan(50);
        });

        it('should animate slide upward for top direction', () => {
            container.y = 200;
            UIAnimator.slideOut(container, 'top', 100);
            UIAnimator.tick(0.1);
            expect(container.y).toBeLessThan(200);
        });
    });

    describe('pulse', () => {
        it('should add an active animation', () => {
            UIAnimator.pulse(container);
            expect(UIAnimator.getActiveCount()).toBe(1);
        });

        it('should restore original scale when complete', () => {
            container.scale.x = 1;
            container.scale.y = 1;
            UIAnimator.pulse(container, 1.5);
            UIAnimator.tick(0.5); // past 200ms default
            expect(container.scale.set).toHaveBeenCalledWith(1, 1);
        });

        it('should call onComplete when animation finishes', () => {
            const onComplete = vi.fn();
            UIAnimator.pulse(container, 1.1, { onComplete });
            UIAnimator.tick(0.5);
            expect(onComplete).toHaveBeenCalledTimes(1);
        });

        it('should accept custom duration', () => {
            const onComplete = vi.fn();
            UIAnimator.pulse(container, 1.2, { duration: 1.0, onComplete });
            UIAnimator.tick(1.1);
            expect(onComplete).toHaveBeenCalled();
        });
    });
});

// ---------------------------------------------------------------------------
// HUDLayoutManager (src/ui/HUDLayoutManager.ts)
// ---------------------------------------------------------------------------
describe('HUDLayoutManager', () => {
    let layoutManager: HUDLayoutManager;

    beforeEach(() => {
        layoutManager = new HUDLayoutManager();
    });

    describe('getScaledPadding', () => {
        it('should return padding multiplied by scale', () => {
            // UI_STYLES.PADDING = 16
            expect(layoutManager.getScaledPadding(1.0)).toBe(16);
        });

        it('should scale padding proportionally', () => {
            expect(layoutManager.getScaledPadding(2.0)).toBe(32);
        });

        it('should handle fractional scale', () => {
            expect(layoutManager.getScaledPadding(0.5)).toBe(8);
        });
    });

    describe('getWavePanelPosition', () => {
        it('should position wave panel at top-left with padding', () => {
            const pos = layoutManager.getWavePanelPosition(1.0);
            expect(pos.x).toBe(16);
            expect(pos.y).toBe(16);
        });

        it('should scale wave panel position with scale factor', () => {
            const pos = layoutManager.getWavePanelPosition(2.0);
            expect(pos.x).toBe(32);
            expect(pos.y).toBe(32);
        });
    });

    describe('getMuteButtonPosition', () => {
        it('should position mute button below wave panel', () => {
            const pos = layoutManager.getMuteButtonPosition(1.0);
            // padding + WAVE_PANEL(100) * scale + padding = 16 + 100 + 16 = 132
            expect(pos.x).toBe(16);
            expect(pos.y).toBe(132);
        });

        it('should scale mute button position', () => {
            const pos = layoutManager.getMuteButtonPosition(0.5);
            // padding(8) + 100*0.5 + padding(8) = 66
            expect(pos.x).toBe(8);
            expect(pos.y).toBe(66);
        });
    });

    describe('getCombatStatsPosition', () => {
        it('should position combat stats below mute button', () => {
            const pos = layoutManager.getCombatStatsPosition(1.0);
            // muteY(132) + MUTE_BUTTON(40)*1 + padding(16) = 188
            expect(pos.x).toBe(16);
            expect(pos.y).toBe(188);
        });
    });

    describe('getToggleButtonPosition', () => {
        it('should position first toggle button below combat stats', () => {
            const pos = layoutManager.getToggleButtonPosition(0, 1.0);
            // combatStatsY(188) + COMBAT_STATS(90)*1 + padding(16) = 294
            expect(pos.x).toBe(16);
            expect(pos.y).toBe(294);
        });

        it('should stack toggle buttons with index offset', () => {
            const pos0 = layoutManager.getToggleButtonPosition(0, 1.0);
            const pos1 = layoutManager.getToggleButtonPosition(1, 1.0);
            // toggleBtnHeight = 32, padding = 16, so gap = 32 + 16 = 48
            expect(pos1.y - pos0.y).toBe(48);
        });

        it('should position multiple toggle buttons incrementally', () => {
            const pos0 = layoutManager.getToggleButtonPosition(0, 1.0);
            const pos2 = layoutManager.getToggleButtonPosition(2, 1.0);
            expect(pos2.y - pos0.y).toBe(96); // 2 * 48
        });
    });

    describe('getAIPanelPosition', () => {
        it('should position AI panel below all four toggle buttons', () => {
            const pos = layoutManager.getAIPanelPosition(1.0);
            const lastToggle = layoutManager.getToggleButtonPosition(3, 1.0);
            // lastToggleY + toggleBtnHeight(32)*1 + padding(16) + padding(16)
            expect(pos.y).toBe(lastToggle.y + 32 + 16 + 16);
            expect(pos.x).toBe(16);
        });
    });

    describe('getAIThoughtFeedPosition', () => {
        it('should position thought feed below AI panel', () => {
            const aiPanelHeight = 120;
            const pos = layoutManager.getAIThoughtFeedPosition(1.0, aiPanelHeight);
            const aiPos = layoutManager.getAIPanelPosition(1.0);
            // aiPanelY + aiPanelHeight*scale + padding
            expect(pos.y).toBe(aiPos.y + 120 + 16);
            expect(pos.x).toBe(16);
        });

        it('should handle different AI panel heights', () => {
            const pos1 = layoutManager.getAIThoughtFeedPosition(1.0, 100);
            const pos2 = layoutManager.getAIThoughtFeedPosition(1.0, 200);
            expect(pos2.y - pos1.y).toBe(100);
        });
    });

    describe('getResourcePanelPosition', () => {
        it('should position resource panel at top-right', () => {
            const pos = layoutManager.getResourcePanelPosition(1.0, 150);
            // WORLD_WIDTH(1920) - 150*1 - padding(16) = 1754
            expect(pos.x).toBe(1754);
            expect(pos.y).toBe(16);
        });

        it('should adjust for different panel widths', () => {
            const pos = layoutManager.getResourcePanelPosition(1.0, 200);
            expect(pos.x).toBe(1704); // 1920 - 200 - 16
        });
    });

    describe('getScorePanelPosition', () => {
        it('should position score panel at bottom-left', () => {
            const pos = layoutManager.getScorePanelPosition(1.0, 80);
            // WORLD_HEIGHT(1080) - 80*1 - padding(16) = 984
            expect(pos.x).toBe(16);
            expect(pos.y).toBe(984);
        });
    });

    describe('getStatusPanelPosition', () => {
        it('should position status panel at bottom-center', () => {
            const pos = layoutManager.getStatusPanelPosition(1.0, 280, 120);
            // x: (1920 - 280*1) / 2 = 820
            // y: 1080 - 120*1 - 16 = 944
            expect(pos.x).toBe(820);
            expect(pos.y).toBe(944);
        });
    });

    describe('getTurretCountPanelPosition', () => {
        it('should position turret count panel at bottom-right', () => {
            const pos = layoutManager.getTurretCountPanelPosition(1.0, 140, 60);
            // x: 1920 - 140*1 - 16 = 1764
            // y: 1080 - 60*1 - 16 = 1004
            expect(pos.x).toBe(1764);
            expect(pos.y).toBe(1004);
        });
    });

    describe('getTurretMenuPosition', () => {
        it('should position turret menu on the right side', () => {
            const pos = layoutManager.getTurretMenuPosition(1.0, 180);
            // x: 1920 - 180*1 - 16 = 1724
            // y: 16 + 70*1 + 16 = 102
            expect(pos.x).toBe(1724);
            expect(pos.y).toBe(102);
        });
    });

    describe('getTurretUpgradePanelPosition', () => {
        it('should position upgrade panel to the left of turret menu', () => {
            const pos = layoutManager.getTurretUpgradePanelPosition(1.0, 180, 304);
            const menuPos = layoutManager.getTurretMenuPosition(1.0, 180);
            // x: menuX - 304*1 - 16 = 1724 - 304 - 16 = 1404
            expect(pos.x).toBe(menuPos.x - 304 - 16);
            expect(pos.y).toBe(menuPos.y);
        });
    });

    describe('getMessageLogPosition', () => {
        it('should position message log at bottom-left', () => {
            const pos = layoutManager.getMessageLogPosition(1.0, 150);
            // x: 16
            // y: 1080 - 150*1 - 16 = 914
            expect(pos.x).toBe(16);
            expect(pos.y).toBe(914);
        });
    });
});

// ---------------------------------------------------------------------------
// HUDPanelManager (src/ui/managers/HUDPanelManager.ts)
// ---------------------------------------------------------------------------
describe('HUDPanelManager', () => {
    let panelManager: HUDPanelManager;
    let parent: Container;
    let layoutManager: HUDLayoutManager;

    beforeEach(() => {
        panelManager = new HUDPanelManager();
        parent = new Container();
        layoutManager = new HUDLayoutManager();
    });

    describe('initialization', () => {
        it('should initialize and add container to parent', () => {
            panelManager.init(parent, layoutManager);
            expect(parent.addChild).toHaveBeenCalled();
        });

        it('should not initialize twice when init called multiple times', () => {
            panelManager.init(parent, layoutManager);
            const addChildCallCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;

            panelManager.init(parent, layoutManager);

            // addChild should not have been called again
            expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(addChildCallCount);
        });
    });

    describe('updateLayout', () => {
        it('should not throw when called before init', () => {
            expect(() => panelManager.updateLayout(1.0)).not.toThrow();
        });

        it('should update layout positions for all panels after init', () => {
            panelManager.init(parent, layoutManager);

            // Should not throw when updating layout
            expect(() => panelManager.updateLayout(1.5)).not.toThrow();
        });
    });

    describe('update', () => {
        it('should update all panels with new data after init', () => {
            panelManager.init(parent, layoutManager);

            const hudData = {
                waveNumber: 3,
                waveState: 'active' as const,
                activeEnemies: 12,
                resources: 500,
                timeSurvived: 120,
                enemiesDefeated: 45,
                kobayashiMaruHealth: 80,
                kobayashiMaruMaxHealth: 100,
                kobayashiMaruShield: 50,
                kobayashiMaruMaxShield: 100,
                turretCount: 5,
                dps: 150,
                accuracy: 0.85,
                totalDamageDealt: 5000,
            };

            expect(() => panelManager.update(hudData)).not.toThrow();
        });

        it('should handle partial HUD data gracefully', () => {
            panelManager.init(parent, layoutManager);

            const hudData = {
                waveNumber: 1,
                waveState: 'idle' as const,
                activeEnemies: 0,
                resources: 100,
                timeSurvived: 0,
                enemiesDefeated: 0,
                kobayashiMaruHealth: 100,
                kobayashiMaruMaxHealth: 100,
                kobayashiMaruShield: 100,
                kobayashiMaruMaxShield: 100,
                turretCount: 0,
            };

            expect(() => panelManager.update(hudData)).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('should clean up resources when destroyed', () => {
            panelManager.init(parent, layoutManager);

            expect(() => panelManager.destroy()).not.toThrow();
        });

        it('should allow re-initialization after destroy', () => {
            panelManager.init(parent, layoutManager);
            panelManager.destroy();

            // Should be able to init again after destroy
            expect(() => panelManager.init(parent, layoutManager)).not.toThrow();
        });
    });
});
