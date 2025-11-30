# Code Audit: Maintainability & Scalability

**Date:** 2025-11-30  
**Scope:** Code maintainability, scalability concerns, and future-proofing

## Executive Summary

The codebase has a solid foundation but lacks extensibility mechanisms. Adding new features requires modifying core files. No plugin system, limited configuration, and tight coupling make scaling difficult.

**Overall Grade:** C+ (Functional but not easily extensible)

---

## Maintainability Analysis

### Strengths ✅

1. **Clear Module Boundaries**
   - Separate folders for core, ecs, systems, rendering
   - Barrel exports for clean imports
   - Single responsibility per file

2. **TypeScript Usage**
   - Strong typing throughout
   - Interfaces for contracts
   - Type safety enforced

3. **Consistent Naming**
   - camelCase for variables/functions
   - PascalCase for classes/types
   - Descriptive names

### Weaknesses ❌

1. **Hard-Coded Configuration**
2. **No Extension Points**
3. **Tight Coupling**
4. **Limited Abstraction**
5. **No Plugin System**

---

## Critical Maintainability Issues

### 1. ❌ Hard-Coded Game Logic

**Problem:**
```typescript
// Game.ts - Hard-coded entity spawning
private spawnTestEntities(): void {
  // Hard-coded: 100 enemies
  for (let i = 0; i < 100; i++) {
    // Hard-coded: 5 enemy types
    const creatorIndex = Math.floor(Math.random() * enemyCreators.length);
    const eid = enemyCreators[creatorIndex](this.world, x, y);
  }
}
```

**Impact:**
- Can't change spawn logic without modifying core code
- No way to configure different game modes
- Testing different scenarios is difficult

**Recommendation:**
```typescript
// Configuration-driven spawning
interface SpawnConfig {
  enemyTypes: FactionId[];
  count: number;
  spawnPattern: 'edges' | 'random' | 'waves';
  speedRange: { min: number; max: number };
}

interface GameMode {
  name: string;
  description: string;
  spawnConfig: SpawnConfig;
  difficulty: number;
}

const GAME_MODES: Record<string, GameMode> = {
  tutorial: {
    name: 'Tutorial',
    description: 'Learn the basics',
    spawnConfig: {
      enemyTypes: [FactionId.KLINGON],
      count: 10,
      spawnPattern: 'edges',
      speedRange: { min: 30, max: 50 }
    },
    difficulty: 1
  },
  normal: {
    name: 'Normal',
    description: 'Standard gameplay',
    spawnConfig: {
      enemyTypes: [
        FactionId.KLINGON,
        FactionId.ROMULAN,
        FactionId.THOLIAN
      ],
      count: 100,
      spawnPattern: 'edges',
      speedRange: { min: 50, max: 200 }
    },
    difficulty: 5
  },
  endless: {
    name: 'Endless',
    description: 'Survive as long as possible',
    spawnConfig: {
      enemyTypes: [
        FactionId.KLINGON,
        FactionId.ROMULAN,
        FactionId.BORG,
        FactionId.THOLIAN,
        FactionId.SPECIES_8472
      ],
      count: 200,
      spawnPattern: 'waves',
      speedRange: { min: 50, max: 300 }
    },
    difficulty: 10
  }
};

class SpawnManager {
  constructor(private config: SpawnConfig) {}
  
  spawn(world: GameWorld): void {
    switch (this.config.spawnPattern) {
      case 'edges':
        this.spawnAtEdges(world);
        break;
      case 'random':
        this.spawnRandom(world);
        break;
      case 'waves':
        this.spawnWaves(world);
        break;
    }
  }
  
  private spawnAtEdges(world: GameWorld): void {
    // Implementation
  }
}

// Usage
class Game {
  constructor(
    containerId: string,
    private gameMode: GameMode = GAME_MODES.normal
  ) {
    this.spawnManager = new SpawnManager(gameMode.spawnConfig);
  }
}
```

### 2. ❌ No Plugin/Extension System

**Problem:** Can't add new features without modifying core code

**Recommendation:**
```typescript
// Plugin system for extensibility
interface Plugin {
  name: string;
  version: string;
  init(game: Game): void;
  update?(world: GameWorld, deltaTime: number): void;
  destroy?(): void;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    
    this.plugins.set(plugin.name, plugin);
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }
  
  init(game: Game): void {
    for (const plugin of this.plugins.values()) {
      try {
        plugin.init(game);
      } catch (error) {
        console.error(`Failed to init plugin ${plugin.name}:`, error);
      }
    }
  }
  
  update(world: GameWorld, deltaTime: number): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.update) {
        try {
          plugin.update(world, deltaTime);
        } catch (error) {
          console.error(`Error in plugin ${plugin.name} update:`, error);
        }
      }
    }
  }
  
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}

// Example plugin
class MinimapPlugin implements Plugin {
  name = 'minimap';
  version = '1.0.0';
  
  private canvas: HTMLCanvasElement | null = null;
  
  init(game: Game): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 200;
    this.canvas.height = 200;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '10px';
    this.canvas.style.right = '10px';
    document.body.appendChild(this.canvas);
  }
  
  update(world: GameWorld, deltaTime: number): void {
    if (!this.canvas) return;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw minimap
    ctx.clearRect(0, 0, 200, 200);
    
    const entities = renderQuery(world);
    for (const eid of entities) {
      const x = Position.x[eid] / GAME_CONFIG.WORLD_WIDTH * 200;
      const y = Position.y[eid] / GAME_CONFIG.WORLD_HEIGHT * 200;
      
      ctx.fillStyle = this.getFactionColor(Faction.id[eid]);
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  
  destroy(): void {
    this.canvas?.remove();
  }
  
  private getFactionColor(factionId: number): string {
    // Map faction to color
    return '#FFFFFF';
  }
}

// Usage
const game = new Game('app');
game.pluginManager.register(new MinimapPlugin());
game.pluginManager.register(new AchievementsPlugin());
await game.init();
```

### 3. ❌ Monolithic Game Class

**Problem:**
```typescript
// Game.ts - Does too many things
export class Game {
  // Manages rendering
  private spriteManager: SpriteManager;
  
  // Manages debug UI
  private debugManager: DebugManager;
  
  // Manages background
  private starfield: Starfield;
  
  // Manages systems
  private renderSystem: ...;
  private movementSystem: ...;
  
  // Manages spawning
  private spawnTestEntities(): void { }
  
  // Manages window resize
  private handleResize(): void { }
}
```

**Impact:**
- Hard to test individual features
- Difficult to understand responsibilities
- Changes affect multiple concerns

**Recommendation:**
```typescript
// Split into focused managers
class RenderingManager {
  constructor(
    private app: Application,
    private spriteManager: SpriteManager,
    private starfield: Starfield
  ) {}
  
  init(): void {
    this.spriteManager.init();
    this.starfield.init();
  }
  
  update(world: GameWorld, deltaTime: number): void {
    this.starfield.update(deltaTime, 0, 50);
    this.renderSystem(world);
  }
  
  destroy(): void {
    this.spriteManager.destroy();
    this.starfield.destroy();
  }
}

class SystemManager {
  private systems: Array<{
    name: string;
    fn: (world: GameWorld, deltaTime: number) => void;
    priority: number;
  }> = [];
  
  register(
    name: string,
    system: (world: GameWorld, deltaTime: number) => void,
    priority: number = 0
  ): void {
    this.systems.push({ name, fn: system, priority });
    this.systems.sort((a, b) => b.priority - a.priority);
  }
  
  update(world: GameWorld, deltaTime: number): void {
    for (const system of this.systems) {
      try {
        system.fn(world, deltaTime);
      } catch (error) {
        console.error(`Error in system ${system.name}:`, error);
      }
    }
  }
}

class SpawnManager {
  constructor(private config: SpawnConfig) {}
  
  spawn(world: GameWorld): void {
    // Spawning logic
  }
}

// Simplified Game class
export class Game {
  private renderingManager: RenderingManager;
  private systemManager: SystemManager;
  private spawnManager: SpawnManager;
  
  constructor(containerId: string, config: GameConfig) {
    // Initialize managers
    this.renderingManager = new RenderingManager(
      this.app,
      new SpriteManager(this.app),
      new Starfield(this.app)
    );
    
    this.systemManager = new SystemManager();
    this.spawnManager = new SpawnManager(config.spawnConfig);
  }
  
  async init(): Promise<void> {
    await this.app.init(/* ... */);
    
    this.renderingManager.init();
    
    this.systemManager.register('movement', createMovementSystem(), 100);
    this.systemManager.register('render', createRenderSystem(this.spriteManager), 0);
    
    this.spawnManager.spawn(this.world);
  }
  
  private update(): void {
    const deltaTime = this.app.ticker.deltaMS / 1000;
    
    this.systemManager.update(this.world, deltaTime);
    this.renderingManager.update(this.world, deltaTime);
  }
}
```

---

## Scalability Issues

### 1. ⚠️ No Configuration System

**Problem:** All configuration is hard-coded in constants

**Recommendation:**
```typescript
// config/gameConfig.ts
interface GameConfig {
  world: {
    width: number;
    height: number;
  };
  rendering: {
    targetFPS: number;
    maxParticles: number;
    preferredRenderer: 'webgpu' | 'webgl';
  };
  gameplay: {
    initialEntityCount: number;
    spawnMode: GameMode;
  };
  debug: {
    enabled: boolean;
    showFPS: boolean;
    showEntityCount: boolean;
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: GameConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  static getInstance(): ConfigManager {
    if (!this.instance) {
      this.instance = new ConfigManager();
    }
    return this.instance;
  }
  
  private loadConfig(): GameConfig {
    // Load from localStorage or use defaults
    const stored = localStorage.getItem('gameConfig');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        console.warn('Failed to parse stored config, using defaults');
      }
    }
    
    return this.getDefaultConfig();
  }
  
  private getDefaultConfig(): GameConfig {
    return {
      world: {
        width: 1920,
        height: 1080
      },
      rendering: {
        targetFPS: 60,
        maxParticles: 15000,
        preferredRenderer: 'webgpu'
      },
      gameplay: {
        initialEntityCount: 5000,
        spawnMode: GAME_MODES.normal
      },
      debug: {
        enabled: true,
        showFPS: true,
        showEntityCount: true
      }
    };
  }
  
  get<K extends keyof GameConfig>(key: K): GameConfig[K] {
    return this.config[key];
  }
  
  set<K extends keyof GameConfig>(key: K, value: GameConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }
  
  private saveConfig(): void {
    localStorage.setItem('gameConfig', JSON.stringify(this.config));
  }
}

// Usage
const config = ConfigManager.getInstance();
const worldWidth = config.get('world').width;
```

### 2. ⚠️ No Event System

**Problem:** Components can't communicate without tight coupling

**Recommendation:**
```typescript
// Event system for decoupled communication
type EventCallback = (data?: unknown) => void;

class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  
  static getInstance(): EventBus {
    if (!this.instance) {
      this.instance = new EventBus();
    }
    return this.instance;
  }
  
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }
  
  emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }
  
  once(event: string, callback: EventCallback): void {
    const wrappedCallback = (data?: unknown) => {
      callback(data);
      this.off(event, wrappedCallback);
    };
    this.on(event, wrappedCallback);
  }
}

// Usage
const eventBus = EventBus.getInstance();

// Subscribe to events
eventBus.on('entity:destroyed', (data) => {
  const { eid, faction } = data as { eid: number; faction: FactionId };
  console.log(`Entity ${eid} of faction ${faction} destroyed`);
  
  // Update score
  // Spawn explosion effect
  // Play sound
});

eventBus.on('wave:complete', () => {
  console.log('Wave complete!');
  // Spawn next wave
  // Show UI notification
});

// Emit events
eventBus.emit('entity:destroyed', { eid: 123, faction: FactionId.KLINGON });
eventBus.emit('wave:complete');
```

### 3. ⚠️ No State Management

**Problem:** Game state is scattered across multiple classes

**Recommendation:**
```typescript
// Centralized state management
interface GameState {
  phase: 'menu' | 'playing' | 'paused' | 'gameover';
  score: number;
  wave: number;
  lives: number;
  highScore: number;
  enemiesDestroyed: number;
  timeElapsed: number;
}

class StateManager {
  private static instance: StateManager;
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();
  
  private constructor() {
    this.state = this.getInitialState();
  }
  
  static getInstance(): StateManager {
    if (!this.instance) {
      this.instance = new StateManager();
    }
    return this.instance;
  }
  
  private getInitialState(): GameState {
    return {
      phase: 'menu',
      score: 0,
      wave: 1,
      lives: 3,
      highScore: this.loadHighScore(),
      enemiesDestroyed: 0,
      timeElapsed: 0
    };
  }
  
  getState(): Readonly<GameState> {
    return { ...this.state };
  }
  
  setState(updates: Partial<GameState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Notify listeners
    this.notifyListeners();
    
    // Handle side effects
    this.handleStateChange(oldState, this.state);
  }
  
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }
  
  private handleStateChange(oldState: GameState, newState: GameState): void {
    // Update high score
    if (newState.score > newState.highScore) {
      this.state.highScore = newState.score;
      this.saveHighScore(newState.score);
    }
    
    // Emit events
    if (oldState.phase !== newState.phase) {
      EventBus.getInstance().emit('game:phase-change', {
        from: oldState.phase,
        to: newState.phase
      });
    }
    
    if (oldState.wave !== newState.wave) {
      EventBus.getInstance().emit('game:wave-change', {
        wave: newState.wave
      });
    }
  }
  
  private loadHighScore(): number {
    return StorageService.load(StorageKeys.HIGH_SCORE, 0);
  }
  
  private saveHighScore(score: number): void {
    StorageService.save(StorageKeys.HIGH_SCORE, score);
  }
}

// Usage
const stateManager = StateManager.getInstance();

// Subscribe to state changes
stateManager.subscribe((state) => {
  console.log('State updated:', state);
  updateUI(state);
});

// Update state
stateManager.setState({ score: 100 });
stateManager.setState({ phase: 'playing' });
```

---

## Code Organization Improvements

### 1. Feature-Based Structure

**Current:** Organized by technical layer
```
src/
  ecs/
  systems/
  rendering/
  core/
```

**Recommended:** Organize by feature (for larger projects)
```
src/
  features/
    entities/
      components.ts
      factory.ts
      pool.ts
    movement/
      system.ts
      types.ts
    rendering/
      system.ts
      spriteManager.ts
      textures.ts
    pathfinding/
      grid.ts
      costField.ts
      integrationField.ts
  core/
    Game.ts
    EventBus.ts
    StateManager.ts
  shared/
    types/
    utils/
```

### 2. Dependency Injection

**Current:** Direct instantiation
```typescript
this.spriteManager = new SpriteManager(this.app);
```

**Recommended:** Inject dependencies
```typescript
interface GameDependencies {
  spriteManager: ISpriteManager;
  debugManager: IDebugManager;
  storageService: IStorageService;
}

class Game {
  constructor(
    containerId: string,
    dependencies?: Partial<GameDependencies>
  ) {
    this.spriteManager = dependencies?.spriteManager ?? 
      new SpriteManager(this.app);
  }
}
```

---

## Priority Action Items

1. **HIGH:** Implement configuration system
2. **HIGH:** Add event bus for decoupled communication
3. **HIGH:** Create plugin system for extensibility
4. **MEDIUM:** Implement state management
5. **MEDIUM:** Split Game class into focused managers
6. **MEDIUM:** Make game modes configurable
7. **LOW:** Consider feature-based folder structure
8. **LOW:** Add dependency injection

---

## Maintainability Checklist

Before adding new features:

- [ ] Can it be added without modifying core code?
- [ ] Is it configurable without code changes?
- [ ] Can it be tested in isolation?
- [ ] Does it follow existing patterns?
- [ ] Is it documented?
- [ ] Can it be disabled/removed easily?
- [ ] Does it emit events for integration?
- [ ] Is error handling in place?

---

## Future-Proofing Recommendations

1. **Modding Support**
   - Plugin API for custom content
   - Mod loader system
   - Safe sandboxing for user code

2. **Multiplayer Preparation**
   - Deterministic simulation
   - State serialization
   - Network message protocol

3. **Mobile Support**
   - Touch input abstraction
   - Responsive UI
   - Performance scaling

4. **Localization**
   - String externalization
   - Language switching
   - RTL support

5. **Analytics**
   - Event tracking
   - Performance metrics
   - User behavior analysis
