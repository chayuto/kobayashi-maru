# Kobayashi Maru

A Star Trek-themed endless tower defense game built with TypeScript, PixiJS, and bitECS.

https://chayuto.github.io/kobayashi-maru/

## Quick Start

```bash
npm install
npm run dev
```

Open your browser to `http://localhost:5173`

## How to Play

1. Defend the Kobayashi Maru (center ship) from endless enemy waves
2. Click turret buttons on the right to select turret types
3. Place turrets by clicking on the battlefield
4. Earn Matter by defeating enemies (10 per kill)
5. Upgrade turrets for increased effectiveness
6. Survive as long as possible - the game never ends

### Controls
- **Mouse**: Place turrets, select for upgrades, navigate UI
- **ESC**: Cancel turret placement / Pause game
- **Backtick**: Toggle debug overlay
- **Enter/R**: Restart when game over

## Current Status

**Playability:** Fully Playable  
**Completeness:** Feature Complete

### Implemented Features

**Core Gameplay**
- ECS Architecture - bitECS with 5,000+ entity capacity
- Wave System - 10 predefined waves + infinite procedural generation
- Boss Waves - Every 5 waves with unique mechanics and abilities
- Combo System - Kill streaks with score multipliers (up to 10x)
- Achievement System - 8 achievements with localStorage persistence
- 50 unique Star Trek story texts per wave

**Enemy Factions (6 Types)**
- **Klingon** (Red Triangle): Direct assault, aggressive approach
- **Romulan** (Green Crescent): Evasive strafing movement
- **Borg** (Green Square): Coordinated swarm behavior
- **Tholian** (Orange Diamond): Flanking maneuvers
- **Species 8472** (Purple Y): Targets turrets first (Hunter)

**Enemy Variants**
- **Normal**: Base stats
- **Elite**: 3x health, 1.5x damage, special glow effect
- **Boss**: 10x health, 2x damage, unique abilities

**Special Abilities (8 Types)**
- Teleport, Cloak, Shield Regeneration, Split on Death
- Summon Reinforcements, Energy Drain, EMP Burst, Ramming Speed

**Turret Types (6 Types)**

| Turret | Cost | Damage | Fire Rate | Range | Special |
|--------|------|--------|-----------|-------|---------|
| Phaser Array | 100 | 10 | 4/sec | 200 | High fire rate |
| Torpedo Launcher | 200 | 50 | 0.5/sec | 350 | Highest damage |
| Disruptor Bank | 150 | 15 | 2/sec | 250 | Balanced |
| Tetryon Beam | 150 | 12 | 3/sec | 220 | 3x shield damage |
| Plasma Cannon | 180 | 8 | 1/sec | 200 | Burning DOT |
| Polaron Beam | 160 | 11 | 2.5/sec | 230 | Stacking slow |

**Upgrade System (5 Paths)**
- Weapon Power (damage +25/50/100%)
- Targeting Range (+20/40/80%)
- Fire Rate (+30/60/120%)
- Multi-Target (2/3 simultaneous targets)
- Special (turret-specific enhancements)

**Visual & Audio**
- Procedural textures for all factions and turrets
- Beam weapons with electricity jitter effects
- Particle system for explosions and effects
- Screen shake on impacts
- Web Audio API procedural sound generation

**UI Components**
- HUD with wave info, resources, health bars
- Turret menu with drag-and-drop placement
- Turret upgrade panel with sell functionality
- Combo display, achievement toasts
- Pause overlay, game over screen

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **PixiJS 8** - WebGPU/WebGL rendering
- **bitECS** - High-performance ECS
- **Web Audio API** - Procedural sound generation
- **Vite** - Fast dev server and build tool
- **Vitest** - Unit testing framework

## Project Structure

```
src/
├── core/           # Game.ts, managers (Gameplay, Render, Input, UI)
├── ecs/            # Components, entity factory, world, templates
├── systems/        # AI, combat, damage, movement, projectile, targeting, abilities
├── rendering/      # Sprites, beams, particles, effects, textures
├── audio/          # AudioManager, SoundGenerator
├── ui/             # HUD, panels, overlays, menus
├── game/           # GameState, WaveManager, ScoreManager, UpgradeManager
├── config/         # Centralized configuration (combat, wave, UI, rendering)
├── collision/      # SpatialHash for performance
├── services/       # DamageService, EntityPoolService, StorageService
├── types/          # Constants, events, type definitions
└── __tests__/      # 48 test files
```

## Testing

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

**Test Coverage:** 48 test files covering:
- ECS components and entity factory
- All game systems (AI, combat, damage, movement, projectile, targeting, ability)
- Game managers (GameState, WaveManager, ScoreManager, UpgradeManager)
- UI components (HUD, GameOverScreen, panels)
- Audio, rendering, collision, and services

## Performance

- **Target:** 60 FPS with 5,000+ entities
- **Spatial Hashing:** 64px cell size for collision detection
- **Entity Pooling:** Reuse entities to minimize GC
- **ParticleContainer:** Batch rendering for particles
- **WebGPU:** Preferred renderer with WebGL fallback

## Contributing

This project demonstrates:
- Clean ECS architecture with bitECS
- High-performance 2D rendering with PixiJS 8
- Modular configuration system
- Event-driven architecture with EventBus
- Procedural audio and texture generation
- Comprehensive unit testing
- TypeScript best practices

## License

MIT License - see LICENSE file for details.
