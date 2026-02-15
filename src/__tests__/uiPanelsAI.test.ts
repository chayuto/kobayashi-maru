/**
 * Tests for AI & Combat UI Panels
 * Covers: AIPanel, AIThoughtFeed, CombatStatsPanel, ComboPanel, AchievementToast
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Container } from 'pixi.js';

vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  return setupPixiMock();
});

import { AIPanel } from '../ui/panels/AIPanel';
import { AIThoughtFeed } from '../ui/panels/AIThoughtFeed';
import { CombatStatsPanel } from '../ui/panels/CombatStatsPanel';
import type { CombatStatsPanelData } from '../ui/panels/CombatStatsPanel';
import { ComboPanel } from '../ui/panels/ComboPanel';
import { AchievementToast } from '../ui/panels/AchievementToast';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types/events';
import { AIMood, AIPhase, AIPersonality, AIActionType } from '../ai/types';
import type { AIStatusExtended } from '../ai/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createParentContainer(): Container {
  return new Container();
}

function createDefaultAIStatus(overrides?: Partial<AIStatusExtended>): AIStatusExtended {
  return {
    enabled: true,
    personality: AIPersonality.BALANCED,
    currentAction: null,
    threatLevel: 25,
    coveragePercent: 60,
    lastDecisionTime: 0,
    mood: AIMood.CALM,
    moodMessage: 'Monitoring sectors.',
    currentPhase: AIPhase.EARLY_EXPANSION,
    phaseFocus: 'defense',
    plannedAction: null,
    plannedPosition: null,
    upgradeTarget: null,
    decisionsThisWave: 3,
    successfulActions: 2,
    ...overrides,
  };
}

// ===========================================================================
// AIPanel
// ===========================================================================

describe('AIPanel', () => {
  let panel: AIPanel;
  let parent: Container;

  beforeEach(() => {
    panel = new AIPanel();
    parent = createParentContainer();
  });

  afterEach(() => {
    panel.destroy();
  });

  // --- creation ---

  it('should create a panel instance', () => {
    expect(panel).toBeDefined();
    expect(panel.getContainer()).toBeDefined();
  });

  it('should return static dimensions', () => {
    const dims = AIPanel.getDimensions();
    expect(dims.width).toBeGreaterThan(0);
    expect(dims.height).toBeGreaterThan(0);
  });

  // --- init ---

  it('should add container to parent when initialized', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not re-initialize when init is called twice', () => {
    panel.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    panel.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  // --- update ---

  it('should not throw when update is called before init', () => {
    const status = createDefaultAIStatus();
    expect(() => panel.update(status)).not.toThrow();
  });

  it('should update mood text when status changes', () => {
    panel.init(parent);
    const status = createDefaultAIStatus({
      mood: AIMood.CONFIDENT,
      personality: AIPersonality.AGGRESSIVE,
    });
    panel.update(status);

    // Access private field via any - mood text should contain personality short name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moodText = (panel as any).moodText;
    expect(moodText.text).toContain('CONFIDENT');
    expect(moodText.text).toContain('AGG');
  });

  it('should update thought text with mood message', () => {
    panel.init(parent);
    const status = createDefaultAIStatus({ moodMessage: 'Enemy closing fast!' });
    panel.update(status);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thoughtText = (panel as any).thoughtText;
    expect(thoughtText.text).toContain('Enemy closing fast!');
  });

  it('should update phase text with phase and focus', () => {
    panel.init(parent);
    const status = createDefaultAIStatus({
      currentPhase: AIPhase.BOSS_PREPARATION,
      phaseFocus: 'dps',
    });
    panel.update(status);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phaseText = (panel as any).phaseText;
    expect(phaseText.text).toContain('BOSS PREP');
    expect(phaseText.text).toContain('DPS');
  });

  it('should update stats text with threat and coverage', () => {
    panel.init(parent);
    const status = createDefaultAIStatus({ threatLevel: 45.6, coveragePercent: 72.3 });
    panel.update(status);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statsText = (panel as any).statsText;
    expect(statsText.text).toContain('46'); // rounded
    expect(statsText.text).toContain('72'); // rounded
  });

  // --- expanded mode ---

  it('should start in non-expanded mode', () => {
    expect(panel.isExpandedMode()).toBe(false);
  });

  it('should toggle expanded mode', () => {
    panel.init(parent);
    panel.setExpandedMode(true);
    expect(panel.isExpandedMode()).toBe(true);
    panel.setExpandedMode(false);
    expect(panel.isExpandedMode()).toBe(false);
  });

  it('should show action and entity text in expanded mode with planned action', () => {
    panel.init(parent);
    panel.setExpandedMode(true);

    const status = createDefaultAIStatus({
      plannedAction: {
        type: AIActionType.PLACE_TURRET,
        priority: 1,
        cost: 100,
        expectedValue: 85,
        params: { x: 200, y: 300, turretType: 1 },
      },
      plannedPosition: { x: 200, y: 300 },
      decisionsThisWave: 5,
      successfulActions: 4,
    });

    panel.update(status);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionText = (panel as any).actionText;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entityText = (panel as any).entityText;

    expect(actionText.text).toContain('PLACE');
    expect(actionText.text).toContain('200');
    expect(actionText.text).toContain('300');
    expect(entityText.text).toContain('5');
    expect(entityText.text).toContain('4');
  });

  it('should show analyzing text in expanded mode when no planned action', () => {
    panel.init(parent);
    panel.setExpandedMode(true);

    const status = createDefaultAIStatus({
      plannedAction: null,
      plannedPosition: null,
    });

    panel.update(status);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionText = (panel as any).actionText;
    expect(actionText.text).toContain('Analyzing');
  });

  // --- visibility ---

  it('should show the container when show is called', () => {
    panel.show();
    expect(panel.getContainer().visible).toBe(true);
  });

  it('should hide the container when hide is called', () => {
    panel.hide();
    expect(panel.getContainer().visible).toBe(false);
  });

  // --- position & scale ---

  it('should set position on the container', () => {
    panel.setPosition(100, 200);
    expect(panel.getContainer().position.set).toHaveBeenCalledWith(100, 200);
  });

  it('should set scale on the container', () => {
    panel.setScale(1.5);
    expect(panel.getContainer().scale.set).toHaveBeenCalledWith(1.5);
  });

  // --- destroy ---

  it('should destroy the container and reset initialized flag', () => {
    panel.init(parent);
    panel.destroy();
    expect(panel.getContainer().destroy).toHaveBeenCalledWith({ children: true });

    // After destroy, update should be a no-op (initialized = false)
    const status = createDefaultAIStatus();
    expect(() => panel.update(status)).not.toThrow();
  });
});

// ===========================================================================
// AIThoughtFeed
// ===========================================================================

describe('AIThoughtFeed', () => {
  let feed: AIThoughtFeed;
  let parent: Container;

  beforeEach(() => {
    feed = new AIThoughtFeed();
    parent = createParentContainer();
  });

  afterEach(() => {
    feed.destroy();
  });

  it('should create a thought feed instance', () => {
    expect(feed).toBeDefined();
    expect(feed.getContainer()).toBeDefined();
  });

  it('should return static dimensions', () => {
    const dims = AIThoughtFeed.getDimensions();
    expect(dims.width).toBe(280);
    expect(dims.height).toBe(100);
  });

  it('should add container to parent on init', () => {
    feed.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not re-initialize on second init call', () => {
    feed.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    feed.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should not add message before initialization', () => {
    const message = { text: 'Hello', icon: '!', timestamp: Date.now() };
    // Should not throw, just silently return
    expect(() => feed.addMessage(message)).not.toThrow();
  });

  it('should add a message after initialization', () => {
    feed.init(parent);
    const message = { text: 'Deploying turret', icon: '!', timestamp: Date.now() };
    feed.addMessage(message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (feed as any).messages;
    expect(messages.length).toBe(1);
  });

  it('should format message text with timestamp and icon', () => {
    feed.init(parent);
    const ts = new Date(2025, 0, 15, 14, 30).getTime();
    const message = { text: 'Scanning area', icon: '*', timestamp: ts };
    feed.addMessage(message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (feed as any).messages;
    expect(messages[0].textElement.text).toContain('14:30');
    expect(messages[0].textElement.text).toContain('*');
    expect(messages[0].textElement.text).toContain('Scanning area');
  });

  it('should remove oldest message when exceeding max capacity', () => {
    feed.init(parent);
    // MAX_MESSAGES is 4; add 5 messages
    for (let i = 0; i < 5; i++) {
      feed.addMessage({ text: `msg ${i}`, icon: '!', timestamp: Date.now() + i });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (feed as any).messages;
    expect(messages.length).toBe(4);
    // The oldest (msg 0) should be gone; newest should contain msg 4
    expect(messages[messages.length - 1].textElement.text).toContain('msg 4');
  });

  it('should update positions of messages', () => {
    feed.init(parent);
    feed.addMessage({ text: 'A', icon: '!', timestamp: Date.now() });
    feed.addMessage({ text: 'B', icon: '!', timestamp: Date.now() + 1 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (feed as any).messages;
    // First message at y=0, second at y=18 (MESSAGE_HEIGHT)
    expect(messages[0].textElement.position.set).toHaveBeenCalledWith(0, 0);
    expect(messages[1].textElement.position.set).toHaveBeenCalledWith(0, 18);
  });

  it('should fade messages during update after fade start time', () => {
    feed.init(parent);

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    feed.addMessage({ text: 'Fading', icon: '!', timestamp: now });

    // Fast forward past fadeStartTime (3000ms) + some fade progress
    vi.spyOn(Date, 'now').mockReturnValue(now + 3000 + 4000); // 4s into 8s fade
    feed.update();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (feed as any).messages;
    expect(messages[0].textElement.alpha).toBeLessThan(1.0);
    expect(messages[0].textElement.alpha).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it('should remove messages when fade is complete', () => {
    feed.init(parent);

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    feed.addMessage({ text: 'Gone', icon: '!', timestamp: now });

    // Fast forward past fadeStartTime + FADE_DURATION
    vi.spyOn(Date, 'now').mockReturnValue(now + 3000 + 8001);
    feed.update();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (feed as any).messages;
    expect(messages.length).toBe(0);

    vi.restoreAllMocks();
  });

  it('should not throw when update is called before init', () => {
    expect(() => feed.update()).not.toThrow();
  });

  it('should clear all messages', () => {
    feed.init(parent);
    feed.addMessage({ text: 'A', icon: '!', timestamp: Date.now() });
    feed.addMessage({ text: 'B', icon: '!', timestamp: Date.now() + 1 });
    feed.clear();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (feed as any).messages;
    expect(messages.length).toBe(0);
  });

  it('should show and hide the container', () => {
    feed.show();
    expect(feed.getContainer().visible).toBe(true);
    feed.hide();
    expect(feed.getContainer().visible).toBe(false);
  });

  it('should set position on the container', () => {
    feed.setPosition(50, 100);
    expect(feed.getContainer().position.set).toHaveBeenCalledWith(50, 100);
  });

  it('should set scale on the container', () => {
    feed.setScale(2);
    expect(feed.getContainer().scale.set).toHaveBeenCalledWith(2);
  });

  it('should destroy and reset initialized flag', () => {
    feed.init(parent);
    feed.destroy();
    expect(feed.getContainer().destroy).toHaveBeenCalledWith({ children: true });
  });
});

// ===========================================================================
// CombatStatsPanel
// ===========================================================================

describe('CombatStatsPanel', () => {
  let panel: CombatStatsPanel;
  let parent: Container;

  beforeEach(() => {
    panel = new CombatStatsPanel();
    parent = createParentContainer();
  });

  afterEach(() => {
    panel.destroy();
  });

  it('should create a combat stats panel instance', () => {
    expect(panel).toBeDefined();
  });

  it('should return static dimensions', () => {
    const dims = CombatStatsPanel.getDimensions();
    expect(dims.width).toBe(160);
    expect(dims.height).toBe(90);
  });

  it('should add container to parent on init', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should not re-initialize on second init call', () => {
    panel.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    panel.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should not throw when update is called before init', () => {
    expect(() => panel.update({ dps: 100 })).not.toThrow();
  });

  it('should update DPS text when dps is provided', () => {
    panel.init(parent);
    panel.update({ dps: 123.456 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dpsText = (panel as any).dpsText;
    expect(dpsText.text).toBe('DPS: 123.5');
  });

  it('should update accuracy text when accuracy is provided', () => {
    panel.init(parent);
    panel.update({ accuracy: 0.876 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accuracyText = (panel as any).accuracyText;
    expect(accuracyText.text).toBe('ACC: 88%');
  });

  it('should update damage text with formatted number', () => {
    panel.init(parent);
    panel.update({ totalDamageDealt: 1500 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const damageText = (panel as any).damageText;
    expect(damageText.text).toBe('DMG: 1.5K');
  });

  it('should format millions correctly', () => {
    panel.init(parent);
    panel.update({ totalDamageDealt: 2500000 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const damageText = (panel as any).damageText;
    expect(damageText.text).toBe('DMG: 2.5M');
  });

  it('should format small numbers without suffix', () => {
    panel.init(parent);
    panel.update({ totalDamageDealt: 500 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const damageText = (panel as any).damageText;
    expect(damageText.text).toBe('DMG: 500');
  });

  it('should update all stats at once', () => {
    panel.init(parent);
    const data: CombatStatsPanelData = { dps: 50.0, accuracy: 0.95, totalDamageDealt: 10000 };
    panel.update(data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).dpsText.text).toBe('DPS: 50.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).accuracyText.text).toBe('ACC: 95%');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).damageText.text).toBe('DMG: 10.0K');
  });

  it('should not change unspecified stats when partial data is provided', () => {
    panel.init(parent);
    panel.update({ dps: 100 });
    panel.update({ accuracy: 0.5 });

    // DPS should remain from first update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).dpsText.text).toBe('DPS: 100.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).accuracyText.text).toBe('ACC: 50%');
  });

  it('should set position on the container', () => {
    panel.setPosition(10, 20);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.position.set).toHaveBeenCalledWith(10, 20);
  });

  it('should set scale on the container', () => {
    panel.setScale(0.8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.scale.set).toHaveBeenCalledWith(0.8);
  });

  it('should destroy and reset initialized flag', () => {
    panel.init(parent);
    panel.destroy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.destroy).toHaveBeenCalledWith({ children: true });

    // After destroy, update should be no-op
    expect(() => panel.update({ dps: 50 })).not.toThrow();
  });
});

// ===========================================================================
// ComboPanel
// ===========================================================================

describe('ComboPanel', () => {
  let panel: ComboPanel;
  let parent: Container;
  let eventBus: EventBus;

  beforeEach(() => {
    EventBus.resetInstance();
    eventBus = EventBus.getInstance();
    panel = new ComboPanel();
    parent = createParentContainer();
  });

  afterEach(() => {
    panel.destroy();
    EventBus.resetInstance();
  });

  it('should create a combo panel instance', () => {
    expect(panel).toBeDefined();
  });

  it('should return static dimensions', () => {
    const dims = ComboPanel.getDimensions();
    expect(dims.width).toBe(120);
    expect(dims.height).toBe(60);
  });

  it('should add container to parent on init', () => {
    panel.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should start hidden on init', () => {
    panel.init(parent);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.visible).toBe(false);
  });

  it('should subscribe to COMBO_UPDATED event on init', () => {
    panel.init(parent);
    expect(eventBus.listenerCount(GameEventType.COMBO_UPDATED)).toBe(1);
  });

  it('should show panel when combo is active with count > 1', () => {
    panel.init(parent);
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 3,
      multiplier: 2,
      isActive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.visible).toBe(true);
  });

  it('should display combo count text', () => {
    panel.init(parent);
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 5,
      multiplier: 3,
      isActive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).comboText.text).toBe('5 HITS');
  });

  it('should display multiplier text', () => {
    panel.init(parent);
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 5,
      multiplier: 3,
      isActive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).multiplierText.text).toContain('3');
  });

  it('should hide panel when combo is not active', () => {
    panel.init(parent);
    // First show it
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 3,
      multiplier: 2,
      isActive: true,
    });
    // Then deactivate
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 0,
      multiplier: 1,
      isActive: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.visible).toBe(false);
  });

  it('should hide panel when combo count is 1 or less', () => {
    panel.init(parent);
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 1,
      multiplier: 1,
      isActive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.visible).toBe(false);
  });

  it('should use orange color for multiplier >= 10', () => {
    panel.init(parent);
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 15,
      multiplier: 10,
      isActive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).comboText.style.fill).toBe(0xFF6600);
  });

  it('should use health color for multiplier >= 5 and < 10', () => {
    panel.init(parent);
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 8,
      multiplier: 5,
      isActive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fill = (panel as any).comboText.style.fill;
    // UI_STYLES.COLORS.HEALTH = 0x00FFAA
    expect(fill).toBe(0x00FFAA);
  });

  it('should use primary color for multiplier < 5', () => {
    panel.init(parent);
    eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: 3,
      multiplier: 2,
      isActive: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fill = (panel as any).comboText.style.fill;
    // UI_STYLES.COLORS.PRIMARY = 0xFF9922
    expect(fill).toBe(0xFF9922);
  });

  it('should set position on the container', () => {
    panel.setPosition(200, 300);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.position.set).toHaveBeenCalledWith(200, 300);
  });

  it('should set scale on the container', () => {
    panel.setScale(1.2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((panel as any).container.scale.set).toHaveBeenCalledWith(1.2);
  });

  it('should unsubscribe from events on destroy', () => {
    panel.init(parent);
    expect(eventBus.listenerCount(GameEventType.COMBO_UPDATED)).toBe(1);
    panel.destroy();
    expect(eventBus.listenerCount(GameEventType.COMBO_UPDATED)).toBe(0);
  });
});

// ===========================================================================
// AchievementToast
// ===========================================================================

describe('AchievementToast', () => {
  let toast: AchievementToast;
  let parent: Container;
  let eventBus: EventBus;

  beforeEach(() => {
    EventBus.resetInstance();
    eventBus = EventBus.getInstance();
    toast = new AchievementToast();
    parent = createParentContainer();
  });

  afterEach(() => {
    toast.destroy();
    EventBus.resetInstance();
  });

  it('should create an achievement toast instance', () => {
    expect(toast).toBeDefined();
  });

  it('should return static dimensions', () => {
    const dims = AchievementToast.getDimensions();
    expect(dims.width).toBe(280);
    expect(dims.height).toBe(70);
  });

  it('should add container to parent on init', () => {
    toast.init(parent);
    expect(parent.addChild).toHaveBeenCalled();
  });

  it('should start hidden and transparent on init', () => {
    toast.init(parent);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.visible).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.alpha).toBe(0);
  });

  it('should subscribe to ACHIEVEMENT_UNLOCKED event on init', () => {
    toast.init(parent);
    expect(eventBus.listenerCount(GameEventType.ACHIEVEMENT_UNLOCKED)).toBe(1);
  });

  it('should show toast when achievement is unlocked', () => {
    toast.init(parent);
    eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: 'first_blood',
      name: 'First Blood',
      description: 'Destroy your first enemy',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.visible).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.alpha).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).isShowing).toBe(true);
  });

  it('should display achievement name in title text', () => {
    toast.init(parent);
    eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: 'test',
      name: 'Sharpshooter',
      description: 'Hit 100 enemies',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).titleText.text).toContain('Sharpshooter');
  });

  it('should display achievement description', () => {
    toast.init(parent);
    eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: 'test',
      name: 'Defender',
      description: 'Survive 10 waves',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).descText.text).toBe('Survive 10 waves');
  });

  it('should not update animation when not showing', () => {
    toast.init(parent);
    // Should not throw; isShowing is false so it should early-return
    expect(() => toast.update(0.5)).not.toThrow();
  });

  it('should decrease animation timer during update', () => {
    toast.init(parent);
    eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: 'test',
      name: 'Test',
      description: 'Test desc',
    });

    // DISPLAY_TIME is 4.0 seconds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).animationTimer).toBe(4.0);
    toast.update(1.0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).animationTimer).toBe(3.0);
  });

  it('should fade out during the last second', () => {
    toast.init(parent);
    eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: 'test',
      name: 'Test',
      description: 'Test desc',
    });

    // Advance to 3.5 seconds (0.5 remaining)
    toast.update(3.5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.alpha).toBe(0.5);
  });

  it('should hide toast after display time expires', () => {
    toast.init(parent);
    eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
      achievementId: 'test',
      name: 'Test',
      description: 'Test desc',
    });

    // Advance past full display time
    toast.update(5.0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.visible).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).isShowing).toBe(false);
  });

  it('should set position on the container', () => {
    toast.setPosition(50, 50);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.position.set).toHaveBeenCalledWith(50, 50);
  });

  it('should set scale on the container', () => {
    toast.setScale(0.9);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((toast as any).container.scale.set).toHaveBeenCalledWith(0.9);
  });

  it('should unsubscribe from events on destroy', () => {
    toast.init(parent);
    expect(eventBus.listenerCount(GameEventType.ACHIEVEMENT_UNLOCKED)).toBe(1);
    toast.destroy();
    expect(eventBus.listenerCount(GameEventType.ACHIEVEMENT_UNLOCKED)).toBe(0);
  });

  it('should not re-initialize on second init call', () => {
    toast.init(parent);
    const callCount = (parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    toast.init(parent);
    expect((parent.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });
});
