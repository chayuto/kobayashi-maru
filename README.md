# Kobayashi Maru

An endless simulation / "God Game" tower defense where you protect the civilian freighter Kobayashi Maru against infinite, procedurally generating waves of enemies.

## Overview

**Genre:** Endless Simulation / "God Game" Tower Defense  
**Platform:** Browser (WebGL/WebGPU via PixiJS v8)

You act as the Tactical Computer of a starbase or flagship. You don't click to shoot; you program the defense parameters, manage power distribution (EPS grids), and deploy automated drone fleets to protect the Kobayashi Maru.

**Winning Condition:** None. The goal is to endure. The metric of success is Time Survived and Civilian Lives Saved.

## Tech Stack

- **Rendering:** [PixiJS v8](https://pixijs.com/) (WebGPU/WebGL)
- **ECS:** [bitECS](https://github.com/NateTheGreatt/bitECS) for high-performance entity management
- **Math:** [gl-matrix](https://glmatrix.net/) for vector operations
- **Build:** [Vite](https://vitejs.dev/) + TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
kobayashi-maru/
├── src/
│   ├── core/           # Core game engine
│   │   └── Game.ts     # Main game class with PixiJS initialization
│   ├── ecs/            # Entity Component System
│   │   ├── components.ts  # bitECS component definitions
│   │   └── world.ts       # World setup
│   ├── rendering/      # Rendering utilities
│   │   └── textures.ts    # Faction texture generation
│   ├── types/          # TypeScript types and constants
│   │   └── constants.ts   # Faction colors, game config
│   └── main.ts         # Application entry point
├── docs/
│   └── research/       # Design documents
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

## Factions

| Faction | Shape | Color | Role |
|---------|-------|-------|------|
| Federation | Circle | Teal (#33CC99) | Player/Defense |
| Klingon | Triangle | Red (#DD4444) | Enemy (Basic) |
| Romulan | Crescent | Lime (#99CC33) | Enemy (Stealth) |
| Borg | Square | Neon Green (#22EE22) | Enemy (Tank) |
| Tholian | Diamond | Orange (#FF7700) | Enemy (Control) |
| Species 8472 | Y-Shape | Lavender (#CC99FF) | Enemy (Boss) |

## License

ISC

