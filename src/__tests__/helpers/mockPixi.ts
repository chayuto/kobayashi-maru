/**
 * Shared PixiJS mock infrastructure for tests
 * Extracted from HUDManager.test.ts — use setupPixiMock() in vi.mock('pixi.js', ...)
 */
import { vi } from 'vitest';

export class MockText {
  text: string = '';
  style: Record<string, unknown> = {};
  anchor = { set: vi.fn() };
  position = { set: vi.fn(), x: 0, y: 0 };
  visible = true;
  alpha = 1;
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  constructor(options?: { text?: string; style?: Record<string, unknown> }) {
    this.text = options?.text ?? '';
    this.style = options?.style ?? {};
  }
  destroy = vi.fn();
}

export class MockGraphics {
  position = { set: vi.fn(), x: 0, y: 0 };
  scale = { set: vi.fn(), x: 1, y: 1 };
  visible = true;
  alpha = 1;
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  clear = vi.fn().mockReturnThis();
  roundRect = vi.fn().mockReturnThis();
  fill = vi.fn().mockReturnThis();
  stroke = vi.fn().mockReturnThis();
  circle = vi.fn().mockReturnThis();
  poly = vi.fn().mockReturnThis();
  rect = vi.fn().mockReturnThis();
  moveTo = vi.fn().mockReturnThis();
  lineTo = vi.fn().mockReturnThis();
  closePath = vi.fn().mockReturnThis();
  arc = vi.fn().mockReturnThis();
  setStrokeStyle = vi.fn().mockReturnThis();
  beginFill = vi.fn().mockReturnThis();
  endFill = vi.fn().mockReturnThis();
  lineStyle = vi.fn().mockReturnThis();
  drawRect = vi.fn().mockReturnThis();
  drawCircle = vi.fn().mockReturnThis();
  destroy = vi.fn();
  children: unknown[] = [];
  addChild = vi.fn((child: unknown) => {
    this.children.push(child);
    return child;
  });
  removeChild = vi.fn();
  parent = null;
}

export class MockContainer {
  visible = true;
  alpha = 1;
  position = { set: vi.fn(), x: 0, y: 0 };
  scale = { set: vi.fn(), x: 1, y: 1 };
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  children: unknown[] = [];
  addChild = vi.fn((child: unknown) => {
    this.children.push(child);
    return child;
  });
  removeChild = vi.fn((child: unknown) => {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    return child;
  });
  removeChildren = vi.fn(() => {
    this.children = [];
  });
  destroy = vi.fn();
  on = vi.fn();
  off = vi.fn();
  emit = vi.fn();
  eventMode = 'auto';
  cursor = 'default';
  parent = null;
  sortableChildren = false;
  zIndex = 0;
}

export class MockApplication {
  stage = new MockContainer();
  ticker = {
    deltaMS: 16.67,
    add: vi.fn(),
    remove: vi.fn(),
  };
  renderer = {
    name: 'mock',
    width: 1200,
    height: 800,
    resolution: 1,
    resize: vi.fn(),
    generateTexture: vi.fn(() => ({})),
  };
  canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : { width: 1200, height: 800 };
  screen = { width: 1200, height: 800, x: 0, y: 0 };
  destroy = vi.fn();
}

export class MockTextStyle {
  fontFamily?: string;
  fontSize?: number;
  fill?: number;
  fontWeight?: string;
  constructor(opts?: { fontFamily?: string; fontSize?: number; fill?: number; fontWeight?: string }) {
    if (opts) {
      this.fontFamily = opts.fontFamily;
      this.fontSize = opts.fontSize;
      this.fill = opts.fill;
      this.fontWeight = opts.fontWeight;
    }
  }
}

export class MockTexture {
  width = 64;
  height = 64;
  static EMPTY = new MockTexture();
  static WHITE = new MockTexture();
  destroy = vi.fn();
}

export class MockSprite {
  texture = MockTexture.EMPTY;
  anchor = { set: vi.fn(), x: 0.5, y: 0.5 };
  position = { set: vi.fn(), x: 0, y: 0 };
  scale = { set: vi.fn(), x: 1, y: 1 };
  visible = true;
  alpha = 1;
  x = 0;
  y = 0;
  width = 64;
  height = 64;
  rotation = 0;
  tint = 0xffffff;
  destroy = vi.fn();
  parent = null;
  static from = vi.fn(() => new MockSprite());
}

export class MockParticle {
  x = 0;
  y = 0;
  scaleX = 1;
  scaleY = 1;
  rotation = 0;
  tint = 0xffffff;
  alpha = 1;
}

export class MockParticleContainer {
  children: unknown[] = [];
  addChild = vi.fn((child: unknown) => {
    this.children.push(child);
    return child;
  });
  removeChild = vi.fn();
  addParticle = vi.fn((p: unknown) => {
    this.children.push(p);
    return p;
  });
  removeParticle = vi.fn();
  destroy = vi.fn();
  visible = true;
}

/**
 * Creates the full PixiJS mock module object.
 * Usage in test files:
 *
 * ```ts
 * vi.mock('pixi.js', async () => {
 *   const { setupPixiMock } = await import('./helpers/mockPixi');
 *   return setupPixiMock();
 * });
 * ```
 */
export function setupPixiMock() {
  return {
    Application: MockApplication,
    Container: MockContainer,
    Graphics: MockGraphics,
    Text: MockText,
    TextStyle: MockTextStyle,
    Texture: MockTexture,
    Sprite: MockSprite,
    Particle: MockParticle,
    ParticleContainer: MockParticleContainer,
  };
}
