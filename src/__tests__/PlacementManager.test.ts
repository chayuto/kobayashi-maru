/**
 * Tests for Placement Manager (pure logic)
 * Tests placement logic without any PixiJS dependencies
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlacementManager, PlacementState } from '../game/PlacementManager';
import { ResourceManager } from '../game/resourceManager';
import { GAME_CONFIG, TURRET_CONFIG, TurretType } from '../types/constants';
import { EventBus } from '../core/EventBus';
import { createWorld, addComponent, addEntity } from 'bitecs';
import { Position, Turret } from '../ecs/components';

// Mock AudioManager
vi.mock('../audio', () => ({
  AudioManager: {
    getInstance: () => ({
      play: vi.fn()
    })
  },
  SoundType: {
    TURRET_SELECT: 'select',
    TURRET_PLACE: 'place',
    ERROR_BEEP: 'error'
  }
}));

// Mock entityFactory
vi.mock('../ecs/entityFactory', () => ({
  createTurret: vi.fn(() => 1) // Return a mock entity ID
}));

describe('PlacementManager', () => {
  let world: ReturnType<typeof createWorld>;
  let resourceManager: ResourceManager;
  let placementManager: PlacementManager;

  beforeEach(() => {
    // Reset EventBus to ensure clean state between tests
    EventBus.resetInstance();
    
    // Create a fresh world for each test
    world = createWorld();
    
    // Create resource manager with enough resources for placement
    resourceManager = new ResourceManager(1000);
    
    // Create placement manager
    placementManager = new PlacementManager(world, resourceManager);
  });

  describe('initialization', () => {
    it('should initialize in IDLE state', () => {
      expect(placementManager.getState()).toBe(PlacementState.IDLE);
      expect(placementManager.isPlacing()).toBe(false);
    });

    it('should not have a valid position initially', () => {
      expect(placementManager.isCurrentPositionValid()).toBe(false);
    });

    it('should have default cursor position at (0, 0)', () => {
      const pos = placementManager.getCursorPosition();
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
    });
  });

  describe('startPlacing', () => {
    it('should enter PLACING state when starting placement', () => {
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      expect(placementManager.getState()).toBe(PlacementState.PLACING);
      expect(placementManager.isPlacing()).toBe(true);
    });

    it('should set the current turret type', () => {
      placementManager.startPlacing(TurretType.TORPEDO_LAUNCHER);
      
      expect(placementManager.getCurrentTurretType()).toBe(TurretType.TORPEDO_LAUNCHER);
    });

    it('should emit start event', () => {
      const startListener = vi.fn();
      placementManager.on('start', startListener);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      expect(startListener).toHaveBeenCalledWith({
        type: 'start',
        turretType: TurretType.PHASER_ARRAY
      });
    });

    it('should cancel previous placement if already placing', () => {
      const cancelListener = vi.fn();
      placementManager.on('cancel', cancelListener);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.startPlacing(TurretType.TORPEDO_LAUNCHER);
      
      expect(cancelListener).toHaveBeenCalledTimes(1);
      expect(placementManager.getCurrentTurretType()).toBe(TurretType.TORPEDO_LAUNCHER);
    });
  });

  describe('cancelPlacement', () => {
    it('should return to IDLE state', () => {
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.cancelPlacement();
      
      expect(placementManager.getState()).toBe(PlacementState.IDLE);
      expect(placementManager.isPlacing()).toBe(false);
    });

    it('should emit cancel event', () => {
      const cancelListener = vi.fn();
      placementManager.on('cancel', cancelListener);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.cancelPlacement();
      
      expect(cancelListener).toHaveBeenCalledWith({
        type: 'cancel',
        turretType: TurretType.PHASER_ARRAY
      });
    });

    it('should not emit cancel event if already in IDLE state', () => {
      const cancelListener = vi.fn();
      placementManager.on('cancel', cancelListener);
      
      placementManager.cancelPlacement();
      
      expect(cancelListener).not.toHaveBeenCalled();
    });
  });

  describe('validatePosition', () => {
    it('should reject positions outside world bounds', () => {
      expect(placementManager.validatePosition(-10, 500)).toBe(false);
      expect(placementManager.validatePosition(10, 500)).toBe(false); // Within margin
      expect(placementManager.validatePosition(500, -10)).toBe(false);
      expect(placementManager.validatePosition(GAME_CONFIG.WORLD_WIDTH + 10, 500)).toBe(false);
      expect(placementManager.validatePosition(500, GAME_CONFIG.WORLD_HEIGHT + 10)).toBe(false);
    });

    it('should accept valid positions within world bounds', () => {
      // Ensure there's enough resources
      resourceManager.setResources(1000);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      // Center of the world should be valid
      const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
      const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
      
      expect(placementManager.validatePosition(centerX, centerY)).toBe(true);
    });

    it('should reject positions too close to existing turrets', () => {
      // Add an existing turret to the world
      const existingTurret = addEntity(world);
      addComponent(world, existingTurret, Position);
      addComponent(world, existingTurret, Turret);
      Position.x[existingTurret] = 500;
      Position.y[existingTurret] = 500;
      
      resourceManager.setResources(1000);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      // Position very close to existing turret should be invalid
      expect(placementManager.validatePosition(510, 500)).toBe(false);
    });

    it('should accept positions far enough from existing turrets', () => {
      // Add an existing turret to the world
      const existingTurret = addEntity(world);
      addComponent(world, existingTurret, Position);
      addComponent(world, existingTurret, Turret);
      Position.x[existingTurret] = 500;
      Position.y[existingTurret] = 500;
      
      resourceManager.setResources(1000);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      // Position far from existing turret should be valid
      const farX = 500 + GAME_CONFIG.MIN_TURRET_DISTANCE + 10;
      expect(placementManager.validatePosition(farX, 500)).toBe(true);
    });

    it('should reject positions when resources are insufficient', () => {
      resourceManager.setResources(0);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      expect(placementManager.validatePosition(500, 500)).toBe(false);
    });
  });

  describe('updateCursorPosition', () => {
    it('should update cursor position when placing', () => {
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.updateCursorPosition(100, 200);
      
      const pos = placementManager.getCursorPosition();
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
    });

    it('should emit cursorMove event when updating position', () => {
      const cursorMoveListener = vi.fn();
      placementManager.on('cursorMove', cursorMoveListener);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.updateCursorPosition(500, 500);
      
      expect(cursorMoveListener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'cursorMove',
        turretType: TurretType.PHASER_ARRAY,
        x: 500,
        y: 500
      }));
    });

    it('should not update position when not in placing mode', () => {
      placementManager.updateCursorPosition(100, 200);
      
      const pos = placementManager.getCursorPosition();
      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
    });

    it('should update validity status', () => {
      resourceManager.setResources(1000);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      // Valid position
      placementManager.updateCursorPosition(500, 500);
      expect(placementManager.isCurrentPositionValid()).toBe(true);
      
      // Invalid position (outside margin)
      placementManager.updateCursorPosition(10, 10);
      expect(placementManager.isCurrentPositionValid()).toBe(false);
    });
  });

  describe('placeTurret', () => {
    it('should fail when not in placing mode', () => {
      const result = placementManager.placeTurret(500, 500);
      
      expect(result.success).toBe(false);
      expect(result.entityId).toBe(-1);
      expect(result.reason).toBe('Not in placement mode');
    });

    it('should fail for invalid position', () => {
      const invalidListener = vi.fn();
      placementManager.on('invalid', invalidListener);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      const result = placementManager.placeTurret(10, 10); // Outside margin
      
      expect(result.success).toBe(false);
      expect(invalidListener).toHaveBeenCalled();
    });

    it('should fail when resources are insufficient', () => {
      const invalidListener = vi.fn();
      placementManager.on('invalid', invalidListener);
      
      resourceManager.setResources(0);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      const result = placementManager.placeTurret(500, 500);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid placement position');
    });

    it('should succeed for valid position with sufficient resources', () => {
      const placedListener = vi.fn();
      placementManager.on('placed', placedListener);
      
      resourceManager.setResources(1000);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      const result = placementManager.placeTurret(500, 500);
      
      expect(result.success).toBe(true);
      expect(result.entityId).toBe(1); // Mock returns 1
      expect(placedListener).toHaveBeenCalledWith({
        type: 'placed',
        turretType: TurretType.PHASER_ARRAY,
        x: 500,
        y: 500
      });
    });

    it('should deduct resources on successful placement', () => {
      const initialResources = 1000;
      resourceManager.setResources(initialResources);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      placementManager.placeTurret(500, 500);
      
      const expectedCost = TURRET_CONFIG[TurretType.PHASER_ARRAY].cost;
      expect(resourceManager.getResources()).toBe(initialResources - expectedCost);
    });

    it('should exit placement mode after successful placement', () => {
      resourceManager.setResources(1000);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.placeTurret(500, 500);
      
      expect(placementManager.isPlacing()).toBe(false);
      expect(placementManager.getState()).toBe(PlacementState.IDLE);
    });
  });

  describe('confirmPlacement', () => {
    it('should use current cursor position', () => {
      resourceManager.setResources(1000);
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.updateCursorPosition(600, 400);
      
      const placedListener = vi.fn();
      placementManager.on('placed', placedListener);
      
      const result = placementManager.confirmPlacement();
      
      expect(result).toBe(1); // Mock entity ID
      expect(placedListener).toHaveBeenCalledWith(expect.objectContaining({
        x: 600,
        y: 400
      }));
    });

    it('should return -1 when not in placing mode', () => {
      const result = placementManager.confirmPlacement();
      expect(result).toBe(-1);
    });
  });

  describe('getCurrentTurretConfig', () => {
    it('should return config for current turret type', () => {
      placementManager.startPlacing(TurretType.TORPEDO_LAUNCHER);
      
      const config = placementManager.getCurrentTurretConfig();
      
      expect(config).toBe(TURRET_CONFIG[TurretType.TORPEDO_LAUNCHER]);
      expect(config.name).toBe('Torpedo Launcher');
    });
  });

  describe('event listeners', () => {
    it('should support adding multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      placementManager.on('start', listener1);
      placementManager.on('start', listener2);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should support removing listeners', () => {
      const listener = vi.fn();
      
      placementManager.on('start', listener);
      placementManager.off('start', listener);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should not fail when removing non-existent listener', () => {
      const listener = vi.fn();
      
      expect(() => {
        placementManager.off('start', listener);
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should cancel placement on destroy', () => {
      const cancelListener = vi.fn();
      placementManager.on('cancel', cancelListener);
      
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      placementManager.destroy();
      
      expect(cancelListener).toHaveBeenCalled();
      expect(placementManager.isPlacing()).toBe(false);
    });

    it('should clear listeners on destroy', () => {
      const listener = vi.fn();
      placementManager.on('start', listener);
      
      placementManager.destroy();
      
      // After destroy, starting placement should not trigger listeners
      // (listeners are cleared)
      placementManager.startPlacing(TurretType.PHASER_ARRAY);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
