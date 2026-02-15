// @vitest-environment jsdom
/**
 * Tests for UI Panels (Basic Info): ScorePanel, ResourcePanel, WavePanel, StatusPanel, TurretCountPanel
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  return setupPixiMock();
});

import { Container } from 'pixi.js';
import { ScorePanel } from '../ui/panels/ScorePanel';
import { ResourcePanel } from '../ui/panels/ResourcePanel';
import { WavePanel } from '../ui/panels/WavePanel';
import { StatusPanel } from '../ui/panels/StatusPanel';
import { TurretCountPanel } from '../ui/panels/TurretCountPanel';

// ---------------------------------------------------------------------------
// ScorePanel
// ---------------------------------------------------------------------------
describe('ScorePanel', () => {
  let panel: ScorePanel;
  let parent: Container;

  beforeEach(() => {
    panel = new ScorePanel();
    parent = new Container();
  });

  it('should create a panel instance', () => {
    expect(panel).toBeDefined();
  });

  it('should initialize and add itself to the parent container', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not initialize twice when init is called multiple times', () => {
    panel.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    panel.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should update time text when update is called with valid data', () => {
    panel.init(parent);
    panel.update({ timeSurvived: 125, enemiesDefeated: 10 });
    // 125 seconds = 02:05
    // Access private field via any cast for verification
    const p = panel as unknown as { timeText: { text: string }; killsText: { text: string } };
    expect(p.timeText.text).toBe('TIME: 02:05');
  });

  it('should update kills text when update is called with valid data', () => {
    panel.init(parent);
    panel.update({ timeSurvived: 0, enemiesDefeated: 42 });
    const p = panel as unknown as { killsText: { text: string } };
    expect(p.killsText.text).toBe('KILLS: 42');
  });

  it('should format time with zero-padded minutes and seconds', () => {
    panel.init(parent);
    panel.update({ timeSurvived: 61, enemiesDefeated: 0 });
    const p = panel as unknown as { timeText: { text: string } };
    expect(p.timeText.text).toBe('TIME: 01:01');
  });

  it('should format time as 00:00 when timeSurvived is zero', () => {
    panel.init(parent);
    panel.update({ timeSurvived: 0, enemiesDefeated: 0 });
    const p = panel as unknown as { timeText: { text: string } };
    expect(p.timeText.text).toBe('TIME: 00:00');
  });

  it('should not update text when not initialized', () => {
    // Do not call init
    panel.update({ timeSurvived: 99, enemiesDefeated: 5 });
    // timeText should still show default
    const p = panel as unknown as { timeText: { text: string } };
    expect(p.timeText.text).toBe('TIME: 00:00');
  });

  it('should set position on the container', () => {
    panel.setPosition(100, 200);
    const p = panel as unknown as { container: { position: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.position.set).toHaveBeenCalledWith(100, 200);
  });

  it('should set scale on the container', () => {
    panel.setScale(2);
    const p = panel as unknown as { container: { scale: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.scale.set).toHaveBeenCalledWith(2);
  });

  it('should return correct static dimensions', () => {
    const dims = ScorePanel.getDimensions();
    expect(dims).toEqual({ width: 180, height: 80 });
  });

  it('should destroy the container and reset initialized flag', () => {
    panel.init(parent);
    panel.destroy();
    const p = panel as unknown as { initialized: boolean; container: { destroy: ReturnType<typeof vi.fn> } };
    expect(p.container.destroy).toHaveBeenCalledWith({ children: true });
    expect(p.initialized).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ResourcePanel
// ---------------------------------------------------------------------------
describe('ResourcePanel', () => {
  let panel: ResourcePanel;
  let parent: Container;

  beforeEach(() => {
    panel = new ResourcePanel();
    parent = new Container();
  });

  it('should create a panel instance', () => {
    expect(panel).toBeDefined();
  });

  it('should initialize and add itself to the parent container', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not initialize twice when init is called multiple times', () => {
    panel.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    panel.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should update amount text with small numbers as-is', () => {
    panel.init(parent);
    panel.update({ resources: 500 });
    const p = panel as unknown as { amountText: { text: string } };
    expect(p.amountText.text).toBe('500');
  });

  it('should format numbers >= 1000 with K suffix', () => {
    panel.init(parent);
    panel.update({ resources: 1500 });
    const p = panel as unknown as { amountText: { text: string } };
    expect(p.amountText.text).toBe('1.5K');
  });

  it('should format numbers >= 1000000 with M suffix', () => {
    panel.init(parent);
    panel.update({ resources: 2500000 });
    const p = panel as unknown as { amountText: { text: string } };
    expect(p.amountText.text).toBe('2.5M');
  });

  it('should not update text when not initialized', () => {
    panel.update({ resources: 999 });
    const p = panel as unknown as { amountText: { text: string } };
    expect(p.amountText.text).toBe('0');
  });

  it('should show the panel by setting container visible to true', () => {
    panel.show();
    const p = panel as unknown as { container: { visible: boolean } };
    expect(p.container.visible).toBe(true);
  });

  it('should hide the panel by setting container visible to false', () => {
    panel.hide();
    const p = panel as unknown as { container: { visible: boolean } };
    expect(p.container.visible).toBe(false);
  });

  it('should return correct dimensions', () => {
    const dims = panel.getDimensions();
    expect(dims).toEqual({ width: 150, height: 70 });
  });

  it('should set position on the container', () => {
    panel.setPosition(50, 75);
    const p = panel as unknown as { container: { position: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.position.set).toHaveBeenCalledWith(50, 75);
  });

  it('should set scale on the container', () => {
    panel.setScale(0.5);
    const p = panel as unknown as { container: { scale: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.scale.set).toHaveBeenCalledWith(0.5);
  });

  it('should destroy the container and reset initialized flag', () => {
    panel.init(parent);
    panel.destroy();
    const p = panel as unknown as { initialized: boolean; container: { destroy: ReturnType<typeof vi.fn> } };
    expect(p.container.destroy).toHaveBeenCalledWith({ children: true });
    expect(p.initialized).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// WavePanel
// ---------------------------------------------------------------------------
describe('WavePanel', () => {
  let panel: WavePanel;
  let parent: Container;

  beforeEach(() => {
    panel = new WavePanel();
    parent = new Container();
  });

  it('should create a panel instance', () => {
    expect(panel).toBeDefined();
  });

  it('should initialize and add itself to the parent container', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not initialize twice when init is called multiple times', () => {
    panel.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    panel.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should update wave text when update is called with valid data', () => {
    panel.init(parent);
    panel.update({ waveNumber: 5, waveState: 'active', enemyCount: 12 });
    const p = panel as unknown as { waveText: { text: string } };
    expect(p.waveText.text).toBe('WAVE 5');
  });

  it('should update state text to uppercase', () => {
    panel.init(parent);
    panel.update({ waveNumber: 1, waveState: 'spawning', enemyCount: 3 });
    const p = panel as unknown as { stateText: { text: string } };
    expect(p.stateText.text).toBe('SPAWNING');
  });

  it('should update enemy count text', () => {
    panel.init(parent);
    panel.update({ waveNumber: 2, waveState: 'active', enemyCount: 20 });
    const p = panel as unknown as { enemyCountText: { text: string } };
    expect(p.enemyCountText.text).toBe('Enemies: 20');
  });

  it('should apply correct color for idle state', () => {
    panel.init(parent);
    panel.update({ waveNumber: 1, waveState: 'idle', enemyCount: 0 });
    const p = panel as unknown as { stateText: { style: { fill: number } } };
    expect(p.stateText.style.fill).toBe(0x66DDFF); // SECONDARY
  });

  it('should apply correct color for spawning state', () => {
    panel.init(parent);
    panel.update({ waveNumber: 1, waveState: 'spawning', enemyCount: 5 });
    const p = panel as unknown as { stateText: { style: { fill: number } } };
    expect(p.stateText.style.fill).toBe(0xFF4455); // DANGER
  });

  it('should apply correct color for active state', () => {
    panel.init(parent);
    panel.update({ waveNumber: 1, waveState: 'active', enemyCount: 10 });
    const p = panel as unknown as { stateText: { style: { fill: number } } };
    expect(p.stateText.style.fill).toBe(0xFF9922); // PRIMARY
  });

  it('should apply correct color for complete state', () => {
    panel.init(parent);
    panel.update({ waveNumber: 1, waveState: 'complete', enemyCount: 0 });
    const p = panel as unknown as { stateText: { style: { fill: number } } };
    expect(p.stateText.style.fill).toBe(0x00FFAA); // HEALTH
  });

  it('should fall back to secondary color for unknown wave state', () => {
    panel.init(parent);
    panel.update({ waveNumber: 1, waveState: 'unknown', enemyCount: 0 });
    const p = panel as unknown as { stateText: { style: { fill: number } } };
    expect(p.stateText.style.fill).toBe(0x66DDFF); // SECONDARY fallback
  });

  it('should not update text when not initialized', () => {
    panel.update({ waveNumber: 9, waveState: 'active', enemyCount: 50 });
    const p = panel as unknown as { waveText: { text: string } };
    expect(p.waveText.text).toBe('WAVE 1'); // default
  });

  it('should show the panel', () => {
    panel.show();
    const p = panel as unknown as { container: { visible: boolean } };
    expect(p.container.visible).toBe(true);
  });

  it('should hide the panel', () => {
    panel.hide();
    const p = panel as unknown as { container: { visible: boolean } };
    expect(p.container.visible).toBe(false);
  });

  it('should return correct dimensions', () => {
    const dims = panel.getDimensions();
    expect(dims).toEqual({ width: 200, height: 100 });
  });

  it('should set position on the container', () => {
    panel.setPosition(16, 16);
    const p = panel as unknown as { container: { position: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.position.set).toHaveBeenCalledWith(16, 16);
  });

  it('should set scale on the container', () => {
    panel.setScale(1.5);
    const p = panel as unknown as { container: { scale: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.scale.set).toHaveBeenCalledWith(1.5);
  });

  it('should destroy the container and reset initialized flag', () => {
    panel.init(parent);
    panel.destroy();
    const p = panel as unknown as { initialized: boolean; container: { destroy: ReturnType<typeof vi.fn> } };
    expect(p.container.destroy).toHaveBeenCalledWith({ children: true });
    expect(p.initialized).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// StatusPanel
// ---------------------------------------------------------------------------
describe('StatusPanel', () => {
  let panel: StatusPanel;
  let parent: Container;

  beforeEach(() => {
    panel = new StatusPanel();
    parent = new Container();
  });

  it('should create a panel instance', () => {
    expect(panel).toBeDefined();
  });

  it('should initialize and add itself to the parent container', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not initialize twice when init is called multiple times', () => {
    panel.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    panel.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should update health text as percentage when update is called', () => {
    panel.init(parent);
    panel.update({ health: 75, maxHealth: 100, shield: 50, maxShield: 100 });
    const p = panel as unknown as { healthText: { text: string } };
    expect(p.healthText.text).toBe('HULL: 75%');
  });

  it('should update shield text as percentage when update is called', () => {
    panel.init(parent);
    panel.update({ health: 100, maxHealth: 100, shield: 30, maxShield: 100 });
    const p = panel as unknown as { shieldText: { text: string } };
    expect(p.shieldText.text).toBe('SHIELDS: 30%');
  });

  it('should display 0% when maxHealth is zero', () => {
    panel.init(parent);
    panel.update({ health: 50, maxHealth: 0, shield: 0, maxShield: 100 });
    const p = panel as unknown as { healthText: { text: string } };
    expect(p.healthText.text).toBe('HULL: 0%');
  });

  it('should display 0% when maxShield is zero', () => {
    panel.init(parent);
    panel.update({ health: 100, maxHealth: 100, shield: 50, maxShield: 0 });
    const p = panel as unknown as { shieldText: { text: string } };
    expect(p.shieldText.text).toBe('SHIELDS: 0%');
  });

  it('should not update text when not initialized', () => {
    panel.update({ health: 10, maxHealth: 100, shield: 5, maxShield: 100 });
    const p = panel as unknown as { healthText: { text: string } };
    expect(p.healthText.text).toBe('HULL: 100%'); // default
  });

  it('should show the panel', () => {
    panel.show();
    const p = panel as unknown as { container: { visible: boolean } };
    expect(p.container.visible).toBe(true);
  });

  it('should hide the panel', () => {
    panel.hide();
    const p = panel as unknown as { container: { visible: boolean } };
    expect(p.container.visible).toBe(false);
  });

  it('should return correct dimensions', () => {
    const dims = panel.getDimensions();
    expect(dims).toEqual({ width: 280, height: 120 });
  });

  it('should set position on the container', () => {
    panel.setPosition(300, 400);
    const p = panel as unknown as { container: { position: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.position.set).toHaveBeenCalledWith(300, 400);
  });

  it('should set scale on the container', () => {
    panel.setScale(0.8);
    const p = panel as unknown as { container: { scale: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.scale.set).toHaveBeenCalledWith(0.8);
  });

  it('should destroy health bar, shield bar, container and reset initialized flag', () => {
    panel.init(parent);
    panel.destroy();
    const p = panel as unknown as { initialized: boolean; container: { destroy: ReturnType<typeof vi.fn> } };
    expect(p.container.destroy).toHaveBeenCalledWith({ children: true });
    expect(p.initialized).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TurretCountPanel
// ---------------------------------------------------------------------------
describe('TurretCountPanel', () => {
  let panel: TurretCountPanel;
  let parent: Container;

  beforeEach(() => {
    panel = new TurretCountPanel();
    parent = new Container();
  });

  it('should create a panel instance', () => {
    expect(panel).toBeDefined();
  });

  it('should initialize and add itself to the parent container', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not initialize twice when init is called multiple times', () => {
    panel.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    panel.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should update count text when update is called with valid data', () => {
    panel.init(parent);
    panel.update({ turretCount: 7 });
    const p = panel as unknown as { countText: { text: string } };
    expect(p.countText.text).toBe('7');
  });

  it('should display zero turrets correctly', () => {
    panel.init(parent);
    panel.update({ turretCount: 0 });
    const p = panel as unknown as { countText: { text: string } };
    expect(p.countText.text).toBe('0');
  });

  it('should not update text when not initialized', () => {
    panel.update({ turretCount: 15 });
    const p = panel as unknown as { countText: { text: string } };
    expect(p.countText.text).toBe('0'); // default
  });

  it('should set position on the container', () => {
    panel.setPosition(200, 300);
    const p = panel as unknown as { container: { position: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.position.set).toHaveBeenCalledWith(200, 300);
  });

  it('should set scale on the container', () => {
    panel.setScale(1.2);
    const p = panel as unknown as { container: { scale: { set: ReturnType<typeof vi.fn> } } };
    expect(p.container.scale.set).toHaveBeenCalledWith(1.2);
  });

  it('should return correct static dimensions', () => {
    const dims = TurretCountPanel.getDimensions();
    expect(dims).toEqual({ width: 140, height: 60 });
  });

  it('should destroy the container and reset initialized flag', () => {
    panel.init(parent);
    panel.destroy();
    const p = panel as unknown as { initialized: boolean; container: { destroy: ReturnType<typeof vi.fn> } };
    expect(p.container.destroy).toHaveBeenCalledWith({ children: true });
    expect(p.initialized).toBe(false);
  });
});
