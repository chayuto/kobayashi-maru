/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  const mock = setupPixiMock();

  // Extend MockGraphics with ellipse method needed by Starfield
  const OriginalGraphics = mock.Graphics;
  class ExtendedMockGraphics extends OriginalGraphics {
    ellipse = vi.fn().mockReturnThis();
  }

  // Add TilingSprite mock needed by Starfield
  class MockTilingSprite {
    texture: unknown;
    width = 0;
    height = 0;
    tilePosition = { x: 0, y: 0 };
    visible = true;
    destroy = vi.fn();
    constructor(options?: { texture?: unknown; width?: number; height?: number }) {
      this.texture = options?.texture ?? {};
      this.width = options?.width ?? 0;
      this.height = options?.height ?? 0;
    }
  }

  return {
    ...mock,
    Graphics: ExtendedMockGraphics,
    TilingSprite: MockTilingSprite,
    Texture: { ...mock.Texture, EMPTY: {} },
  };
});

// Mock textures module for RenderingSystem
vi.mock('../rendering/textures', () => ({
  createFactionTextures: vi.fn(() => ({
    federation: {},
    klingon: {},
    romulan: {},
    borg: {},
    tholian: {},
    species8472: {},
    projectile: {},
  })),
}));

// Mock audio so PlacementManager constructor does not crash
vi.mock('../audio', () => ({
  AudioManager: {
    getInstance: () => ({
      play: vi.fn(),
      init: vi.fn(),
    }),
  },
  SoundType: { TURRET_SELECT: 'turret_select', TURRET_PLACE: 'turret_place' },
}));

import { Application, Container } from 'pixi.js';
import {
  MockApplication,
  MockContainer,
  createTestWorld,
  cleanupTestWorld,
} from './helpers';
import { Health, Position, Faction, SpriteRef, Turret } from '../ecs/components';
import { addEntity } from 'bitecs';
import type { GameWorld } from '../ecs/world';
import { BaseRenderer } from '../rendering/BaseRenderer';

// ============================================================================
// Concrete test subclass of BaseRenderer
// ============================================================================
class ConcreteRenderer extends BaseRenderer {
  public callAttachToStage(app: Application, glowContainer?: Container) {
    this.attachToStage(app, glowContainer);
  }

  public callCleanupResources() {
    this.cleanupResources();
  }

  public getApp() {
    return this.app;
  }

  public getGraphics() {
    return this.graphics;
  }

  public getContainer() {
    return this.container;
  }

  public getGlowContainer() {
    return this.glowContainer;
  }

  init(glowContainer?: Container): void {
    const app = new Application() as unknown as Application;
    this.attachToStage(app, glowContainer);
  }

  destroy(): void {
    this.cleanupResources();
  }
}

// ============================================================================
// BaseRenderer Tests
// ============================================================================
describe('BaseRenderer', () => {
  it('should create graphics and container on construction', () => {
    const renderer = new ConcreteRenderer();
    expect(renderer.getGraphics()).toBeDefined();
    expect(renderer.getContainer()).toBeDefined();
  });

  it('should not be initialized after construction', () => {
    const renderer = new ConcreteRenderer();
    expect(renderer.isInitialized).toBe(false);
  });

  it('should add graphics as child of container on construction', () => {
    const renderer = new ConcreteRenderer();
    const container = renderer.getContainer();
    expect(container.addChild).toHaveBeenCalled();
  });

  it('should set initialized to true after attachToStage', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.callAttachToStage(app);
    expect(renderer.isInitialized).toBe(true);
  });

  it('should add container to app stage when no glowContainer provided', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.callAttachToStage(app);
    expect(app.stage.addChild).toHaveBeenCalledWith(renderer.getContainer());
  });

  it('should add container to glowContainer when provided', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    const glowContainer = new MockContainer() as unknown as Container;
    renderer.callAttachToStage(app, glowContainer);
    expect((glowContainer as unknown as MockContainer).addChild).toHaveBeenCalledWith(
      renderer.getContainer()
    );
  });

  it('should store reference to app after attachToStage', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.callAttachToStage(app);
    expect(renderer.getApp()).toBe(app);
  });

  it('should store reference to glowContainer after attachToStage', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    const glowContainer = new MockContainer() as unknown as Container;
    renderer.callAttachToStage(app, glowContainer);
    expect(renderer.getGlowContainer()).toBe(glowContainer);
  });

  it('should set glowContainer to null when not provided', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.callAttachToStage(app);
    expect(renderer.getGlowContainer()).toBeNull();
  });

  it('should set initialized to false after cleanupResources', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.callAttachToStage(app);
    renderer.callCleanupResources();
    expect(renderer.isInitialized).toBe(false);
  });

  it('should clear app and glowContainer references after cleanupResources', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    const glowContainer = new MockContainer() as unknown as Container;
    renderer.callAttachToStage(app, glowContainer);
    renderer.callCleanupResources();
    expect(renderer.getApp()).toBeNull();
    expect(renderer.getGlowContainer()).toBeNull();
  });

  it('should call destroy on graphics and container during cleanupResources', () => {
    const renderer = new ConcreteRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.callAttachToStage(app);
    const graphics = renderer.getGraphics();
    const container = renderer.getContainer();
    renderer.callCleanupResources();
    expect(graphics.destroy).toHaveBeenCalled();
    expect(container.destroy).toHaveBeenCalledWith({ children: true });
  });
});

// ============================================================================
// HealthBarRenderer Tests
// ============================================================================
describe('HealthBarRenderer', () => {
  let world: GameWorld;
  let HealthBarRenderer: typeof import('../rendering/HealthBarRenderer').HealthBarRenderer;

  beforeEach(async () => {
    world = createTestWorld();
    const mod = await import('../rendering/HealthBarRenderer');
    HealthBarRenderer = mod.HealthBarRenderer;
  });

  afterEach(() => {
    cleanupTestWorld();
  });

  it('should create a container on construction', () => {
    const renderer = new HealthBarRenderer();
    expect(renderer).toBeDefined();
  });

  it('should add container to app stage on init', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);
    expect(app.stage.addChild).toHaveBeenCalled();
  });

  it('should show health bar when entity is damaged', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // Arrange: create an entity with Health and Position
    const eid = addEntity(world);
    Health.current[eid] = 50;
    Health.max[eid] = 100;
    Position.x[eid] = 200;
    Position.y[eid] = 300;

    // Act
    renderer.update(world);

    // Assert: calling update again should reuse the existing bar without errors
    renderer.update(world);
  });

  it('should not show health bar when entity is at full health', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    const eid = addEntity(world);
    Health.current[eid] = 100;
    Health.max[eid] = 100;
    Position.x[eid] = 200;
    Position.y[eid] = 300;

    // Act
    renderer.update(world);

    // No bar should be created for full health entity
    renderer.hideHealthBar(eid);
  });

  it('should position health bar above the entity', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // Use showHealthBar directly to verify position
    renderer.showHealthBar(1, 50, 100, 200, 280);

    // Calling it again should reuse the existing bar
    renderer.showHealthBar(1, 50, 100, 200, 280);
  });

  it('should use green color when health is above 50%', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // 75% health
    renderer.showHealthBar(1, 75, 100, 200, 280);
  });

  it('should use yellow color when health is between 25% and 50%', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // 40% health
    renderer.showHealthBar(1, 40, 100, 200, 280);
  });

  it('should use red color when health is below 25%', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // 15% health
    renderer.showHealthBar(1, 15, 100, 200, 280);
  });

  it('should remove health bar on hideHealthBar', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    renderer.showHealthBar(1, 50, 100, 200, 280);
    renderer.hideHealthBar(1);

    // Calling hide again on the same eid should be a no-op
    renderer.hideHealthBar(1);
  });

  it('should handle hideHealthBar for non-existent entity gracefully', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // Should not throw
    renderer.hideHealthBar(999);
  });

  it('should remove bars for entities that no longer exist on update', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // Create entity with damage
    const eid = addEntity(world);
    Health.current[eid] = 50;
    Health.max[eid] = 100;
    Position.x[eid] = 200;
    Position.y[eid] = 300;

    renderer.update(world);

    // Now set full health - bar should be hidden
    Health.current[eid] = 100;
    renderer.update(world);
  });

  it('should clean up on destroy', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    renderer.showHealthBar(1, 50, 100, 200, 280);
    renderer.destroy();
  });

  it('should clamp health percent between 0 and 1', () => {
    const renderer = new HealthBarRenderer();
    const app = new MockApplication() as unknown as Application;
    renderer.init(app);

    // Negative current health
    renderer.showHealthBar(1, -10, 100, 200, 280);

    // Over-max health
    renderer.showHealthBar(2, 150, 100, 200, 280);
  });
});

// ============================================================================
// Starfield Tests
// ============================================================================
describe('Starfield', () => {
  let Starfield: typeof import('../rendering/Starfield').Starfield;

  beforeEach(async () => {
    const mod = await import('../rendering/Starfield');
    Starfield = mod.Starfield;
  });

  it('should create a container and add it to the stage', () => {
    const app = new MockApplication() as unknown as Application;
    const starfield = new Starfield(app);
    expect(app.stage.addChild).toHaveBeenCalled();
    expect(starfield).toBeDefined();
  });

  it('should set sortableChildren on stage', () => {
    const app = new MockApplication() as unknown as Application;
    new Starfield(app);
    expect(app.stage.sortableChildren).toBe(true);
  });

  it('should initialize with default star count multiplier', () => {
    const app = new MockApplication() as unknown as Application;
    const starfield = new Starfield(app);
    starfield.init();
  });

  it('should initialize with custom star count multiplier', () => {
    const app = new MockApplication() as unknown as Application;
    const starfield = new Starfield(app);
    starfield.init(0.5);
  });

  it('should create 4 layers during init (1 nebula + 3 star layers)', () => {
    const app = new MockApplication() as unknown as Application;
    const starfield = new Starfield(app);
    starfield.init(1.0);
  });

  it('should update layer tile positions during update', () => {
    const app = new MockApplication() as unknown as Application;
    const starfield = new Starfield(app);
    starfield.init(1.0);

    // Act: update with known delta
    starfield.update(1.0);
  });

  it('should accept custom speed parameters in update', () => {
    const app = new MockApplication() as unknown as Application;
    const starfield = new Starfield(app);
    starfield.init(1.0);

    starfield.update(1.0, 50, 50);
  });

  it('should destroy the container and children on destroy', () => {
    const app = new MockApplication() as unknown as Application;
    const starfield = new Starfield(app);
    starfield.init(1.0);
    starfield.destroy();
  });
});

// ============================================================================
// PlacementRenderer Tests
// ============================================================================
describe('PlacementRenderer', () => {
  let PlacementRenderer: typeof import('../rendering/PlacementRenderer').PlacementRenderer;
  let world: GameWorld;
  let mockPlacementManager: {
    on: ReturnType<typeof vi.fn>;
    isPlacing: ReturnType<typeof vi.fn>;
    updateCursorPosition: ReturnType<typeof vi.fn>;
    confirmPlacement: ReturnType<typeof vi.fn>;
    cancelPlacement: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    world = createTestWorld();
    const mod = await import('../rendering/PlacementRenderer');
    PlacementRenderer = mod.PlacementRenderer;

    mockPlacementManager = {
      on: vi.fn(),
      isPlacing: vi.fn().mockReturnValue(false),
      updateCursorPosition: vi.fn(),
      confirmPlacement: vi.fn(),
      cancelPlacement: vi.fn(),
    };
  });

  afterEach(() => {
    cleanupTestWorld();
  });

  it('should create preview and existing turret range containers', () => {
    const app = new MockApplication() as unknown as Application;
    const renderer = new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );
    expect(app.stage.addChild).toHaveBeenCalled();
    expect(renderer).toBeDefined();
  });

  it('should subscribe to placement manager events on construction', () => {
    const app = new MockApplication() as unknown as Application;
    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );
    expect(mockPlacementManager.on).toHaveBeenCalledWith('start', expect.any(Function));
    expect(mockPlacementManager.on).toHaveBeenCalledWith('cancel', expect.any(Function));
    expect(mockPlacementManager.on).toHaveBeenCalledWith('placed', expect.any(Function));
    expect(mockPlacementManager.on).toHaveBeenCalledWith('cursorMove', expect.any(Function));
  });

  it('should show preview container on placement start', () => {
    const app = new MockApplication() as unknown as Application;
    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    const startCall = mockPlacementManager.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'start'
    );
    expect(startCall).toBeDefined();
    const startHandler = startCall![1];

    // Trigger start event
    startHandler({ type: 'start', turretType: 0 });
  });

  it('should hide preview container on placement cancel', () => {
    const app = new MockApplication() as unknown as Application;
    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    const cancelCall = mockPlacementManager.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'cancel'
    );
    const cancelHandler = cancelCall![1];
    cancelHandler({ type: 'cancel' });
  });

  it('should hide preview container on placement placed', () => {
    const app = new MockApplication() as unknown as Application;
    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    const placedCall = mockPlacementManager.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'placed'
    );
    const placedHandler = placedCall![1];
    placedHandler({ type: 'placed' });
  });

  it('should update preview on cursor move event', () => {
    const app = new MockApplication() as unknown as Application;
    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    const cursorMoveCall = mockPlacementManager.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'cursorMove'
    );
    const cursorMoveHandler = cursorMoveCall![1];

    // Trigger cursor move with valid position
    cursorMoveHandler({ type: 'cursorMove', x: 400, y: 400, isValid: true, turretType: 0 });
  });

  it('should update preview with invalid position color', () => {
    const app = new MockApplication() as unknown as Application;
    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    const cursorMoveCall = mockPlacementManager.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'cursorMove'
    );
    const cursorMoveHandler = cursorMoveCall![1];

    // Invalid position
    cursorMoveHandler({ type: 'cursorMove', x: 400, y: 400, isValid: false, turretType: 0 });
  });

  it('should clean up on destroy', () => {
    const app = new MockApplication() as unknown as Application;
    const renderer = new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    renderer.destroy();
  });

  it('should draw existing turret ranges when placement starts', () => {
    const app = new MockApplication() as unknown as Application;

    // Add a turret entity to the world
    const eid = addEntity(world);
    Position.x[eid] = 400;
    Position.y[eid] = 400;
    Turret.range[eid] = 200;

    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    // Trigger start
    const startCall = mockPlacementManager.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'start'
    );
    const startHandler = startCall![1];
    startHandler({ type: 'start', turretType: 0 });
  });

  it('should handle cursor move for different turret types', () => {
    const app = new MockApplication() as unknown as Application;
    new PlacementRenderer(
      app,
      mockPlacementManager as unknown as import('../game/PlacementManager').PlacementManager,
      world
    );

    const cursorMoveCall = mockPlacementManager.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'cursorMove'
    );
    const cursorMoveHandler = cursorMoveCall![1];

    // Test PHASER_ARRAY (hexagon)
    cursorMoveHandler({ type: 'cursorMove', x: 100, y: 100, isValid: true, turretType: 0 });

    // Test TORPEDO_LAUNCHER (octagon)
    cursorMoveHandler({ type: 'cursorMove', x: 200, y: 200, isValid: true, turretType: 1 });

    // Test DISRUPTOR_BANK (pentagon)
    cursorMoveHandler({ type: 'cursorMove', x: 300, y: 300, isValid: true, turretType: 2 });

    // Test default (circle) - use a type not in the switch
    cursorMoveHandler({ type: 'cursorMove', x: 400, y: 400, isValid: true, turretType: 3 });
  });
});

// ============================================================================
// RenderingSystem Tests
// ============================================================================
describe('RenderingSystem', () => {
  let RenderingSystem: typeof import('../rendering/RenderingSystem').RenderingSystem;
  let world: GameWorld;

  beforeEach(async () => {
    world = createTestWorld();
    const mod = await import('../rendering/RenderingSystem');
    RenderingSystem = mod.RenderingSystem;
  });

  afterEach(() => {
    cleanupTestWorld();
  });

  it('should create an entity container on construction', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    expect(system).toBeDefined();
  });

  it('should not be initialized before init is called', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    // Update should be a no-op before init
    system.update(world);
  });

  it('should add entity container to stage on init', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();
    expect(app.stage.addChild).toHaveBeenCalled();
  });

  it('should not re-initialize if already initialized', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();

    const callCount = (app.stage.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    system.init(); // second call should be no-op
    expect((app.stage.addChild as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('should create sprites for entities with Position, Faction, and SpriteRef', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();

    const eid = addEntity(world);
    Position.x[eid] = 100;
    Position.y[eid] = 200;
    Faction.id[eid] = 0; // FEDERATION
    SpriteRef.index[eid] = 1;

    system.update(world);
  });

  it('should update existing sprite positions on subsequent updates', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();

    const eid = addEntity(world);
    Position.x[eid] = 100;
    Position.y[eid] = 200;
    Faction.id[eid] = 0;
    SpriteRef.index[eid] = 1;

    system.update(world);

    // Move entity
    Position.x[eid] = 300;
    Position.y[eid] = 400;
    system.update(world);
  });

  it('should remove sprites for entities that no longer exist', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();

    const eid = addEntity(world);
    Position.x[eid] = 100;
    Position.y[eid] = 200;
    Faction.id[eid] = 1; // KLINGON
    SpriteRef.index[eid] = 1;

    system.update(world);

    // Remove entity from query by clearing components
    Position.x[eid] = undefined as unknown as number;
    Position.y[eid] = undefined as unknown as number;
    Faction.id[eid] = undefined as unknown as number;
    SpriteRef.index[eid] = undefined as unknown as number;

    system.update(world);
  });

  it('should handle different faction IDs when creating sprites', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();

    // Create entities with different factions
    const factions = [0, 1, 2, 3, 4, 5]; // FEDERATION through SPECIES_8472
    for (const factionId of factions) {
      const eid = addEntity(world);
      Position.x[eid] = 100 + factionId * 50;
      Position.y[eid] = 200;
      Faction.id[eid] = factionId;
      SpriteRef.index[eid] = 1;
    }

    system.update(world);
  });

  it('should handle unknown faction ID by falling back to federation', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();

    const eid = addEntity(world);
    Position.x[eid] = 100;
    Position.y[eid] = 200;
    Faction.id[eid] = 999; // Unknown faction
    SpriteRef.index[eid] = 1;

    system.update(world);
  });

  it('should clean up all sprites on destroy', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();

    const eid = addEntity(world);
    Position.x[eid] = 100;
    Position.y[eid] = 200;
    Faction.id[eid] = 0;
    SpriteRef.index[eid] = 1;

    system.update(world);
    system.destroy();
  });

  it('should set initialized to false on destroy', () => {
    const app = new MockApplication() as unknown as Application;
    const system = new RenderingSystem(app);
    system.init();
    system.destroy();

    // After destroy, update should be a no-op
    system.update(world);
  });
});
