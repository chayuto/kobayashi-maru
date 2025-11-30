# Kobayashi Maru

A Star Trek-themed endless tower defense game built with TypeScript, PixiJS, and bitECS.

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
5. Survive as long as possible - the game never ends

### Controls
- **Mouse**: Place turrets, navigate UI
- **ESC**: Cancel turret placement
- **Backtick**: Toggle debug overlay
- **Enter/R**: Restart when game over

## Current Status

**Playability:** Fully Playable  
**Completeness:** ~85%

### Implemented Features
- ECS Architecture - bitECS with 5,000+ entity capacity
- 6 Enemy Factions - Klingon, Romulan, Borg, Tholian, Species 8472
- 5 AI Behaviors - Direct, Strafe, Flank, Swarm, Hunter
- 3 Turret Types - Phaser Array, Torpedo Launcher, Disruptor Bank
- Projectile System - Torpedoes with collision detection
- Beam Weapons - Instant-hit phasers and disruptors
- Resource Economy - Earn 10 Matter per enemy kill
- Wave System - Infinite waves with difficulty scaling
- Game Over Screen - Score breakdown with restart
- Audio System - Procedural Web Audio API sounds
- Visual Effects - Explosions, particles, screen shake, health bars
- HUD System - Wave info, resources, time, kills, Kobayashi Maru status
- Turret Menu - Interactive placement UI
- High Scores - localStorage persistence
- Debug Overlay - Performance metrics and game stats
- Starfield Background - Animated space backdrop

### Missing Features
- No Collision Damage - Enemies don't damage Kobayashi Maru on contact
- No Pause System - Can't pause (PAUSED state exists but no key binding)
- No Main Menu - Game starts immediately
- No Tutorial - No first-time player guidance

### Enemy AI Behaviors
- **Klingon** (Red Triangle): Direct assault
- **Romulan** (Green Crescent): Evasive strafing
- **Borg** (Green Square): Coordinated swarm
- **Tholian** (Orange Diamond): Flanking maneuvers
- **Species 8472** (Purple Y): Targets turrets first

### Turret Types
- **Phaser Array** (100 Matter): 4 shots/sec, 10 damage, 200 range
- **Torpedo Launcher** (200 Matter): 0.5 shots/sec, 50 damage, 350 range
- **Disruptor Bank** (150 Matter): 2 shots/sec, 15 damage, 250 range

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
├── core/           # Game.ts, DebugManager.ts
├── ecs/            # Components, entity factory, world
├── systems/        # AI, combat, damage, movement, projectile, targeting
├── rendering/      # Sprites, beams, particles, effects, screen shake
├── audio/          # AudioManager, SoundGenerator
├── ui/             # HUD, GameOverScreen, TurretMenu, HealthBar
├── game/           # GameState, WaveManager, ScoreManager, ResourceManager
├── collision/      # SpatialHash for performance
├── pathfinding/    # Flow field (unused)
└── __tests__/      # 23 test files
```

## Roadmap

### Critical (Blocks Natural Game Over)
- Collision Damage System - Enemies damage Kobayashi Maru on contact

### High Priority (Polish)
- Pause System - ESC key to pause/unpause
- Main Menu - Title screen with start button

### Medium Priority
- Tutorial Overlay - First-time player guidance
- Settings Menu - Volume controls
- Turret Upgrades - Improve placed turrets

## Testing

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

**Test Coverage:** 23 test files covering:
- ECS components and entity factory
- All game systems (AI, combat, damage, movement, projectile, targeting)
- Game managers (GameState, WaveManager, ScoreManager, ResourceManager)
- UI components (HUD, GameOverScreen)
- Audio system
- Collision and spatial hashing

## Audio

All sounds are procedurally generated using Web Audio API:
- Phaser fire (high-pitched beam)
- Disruptor fire (mid-range pulse)
- Torpedo fire (low rumble)
- Small explosions (enemy deaths)
- Large explosions (turret/Kobayashi Maru)
- Wave start/complete sounds

## High Scores

Scores are calculated from:
- Time survived × 10 points/second
- Enemies defeated × 100 points/kill
- Wave reached × 500 points/wave

Saved to localStorage with automatic ranking.

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
- Procedural audio generation
- Comprehensive unit testing
- TypeScript best practices

## License

MIT License - see LICENSE file for details.
