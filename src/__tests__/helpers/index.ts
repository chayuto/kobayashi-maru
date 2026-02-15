/**
 * Shared test helpers — barrel export
 */
export {
  MockText,
  MockGraphics,
  MockContainer,
  MockApplication,
  MockTextStyle,
  MockTexture,
  MockSprite,
  MockParticle,
  MockParticleContainer,
  setupPixiMock,
} from './mockPixi';

export {
  createTestWorld,
  cleanupTestWorld,
  createTestEnemy,
  createTestTurret,
  createTestKobayashiMaru,
  createTestProjectile,
} from './mockECS';

export {
  createMockAudioManager,
  createMockEventBus,
  createMockSpriteManager,
  createMockServiceContainer,
} from './mockServices';
