Game Design Plan: Project KOBAYASHI MARU
1. Executive Summary
Project Title: Kobayashi Maru (Simulation Variant)
Genre: Endless Simulation / "God Game" Tower Defense
Platform: Browser (WebGL/WebGPU via PixiJS v8)
Core Concept: A high-fidelity, autonomous fleet battle simulation where the player acts as the Tactical Computer of a starbase or flagship. You do not click to shoot; you program the defense parameters, manage power distribution (EPS grids), and deploy automated drone fleets to protect the civilian freighter Kobayashi Maru against infinite, procedurally generating waves of enemies.
Winning Condition: None. The goal is to endure. The metric of success is Time Survived and Civilian Lives Saved.
2. Visual Style & Theming: "Geometric Hard Sci-Fi"
To support 10,000+ units on screen without melting the CPU, we utilize Geometric Semiotics. Each faction is represented by a distinct primitive shape and color palette, instantly readable in a chaotic swarm.
| Faction | Role | Geometric Shape | Color Hex | Behavior Archetype |
|---|---|---|---|---|
| Federation | Player/Defense | Circle / Disc | #33CC99 (Teal) | Stationary/Orbital. High shields, precise beams. |
| Klingon | Enemy (Basic) | Triangle / Arrow | #DD4444 (Red) | Aggressive. Fast, forward-facing damage. Swarms in "V" formations. |
| Romulan | Enemy (Stealth) | Double-Crescent / ( ) | #99CC33 (Lime) | Ambush. Spawns closer to the center (De-cloaks). High burst damage. |
| Borg | Enemy (Tank) | Square / Cube | #22EE22 (Neon Green) | Relentless. Slow, ignores terrain, adapts to damage types. |
| Tholian | Enemy (Control) | Rhombus / Diamond | #FF7700 (Orange) | Area Denial. Connects with other Tholians to create "Web" walls that block player fire. |
| Species 8472 | Enemy (Boss) | Y-Shape / Tripod | #CC99FF (Lavender) | Fluidic. Moves like liquid. Immune to standard tech. High hull regen. |
The "Nerdy" Aesthetic:
 * Background: Deep space black/grid.
 * UI: LCARS (Okudagrams). Flat colors, pill-shaped buttons, heavy use of "Golden Orange" (#FF9900) and "Galaxy Blue" (#99CCFF).
 * Feedback: No floating damage numbers. Instead, a scrolling "Tactical Log" filled with technobabble (e.g., "Shield harmonic degradation detected," "Inertial dampeners offline").
3. Gameplay Mechanics & Systems
3.1 The "No-Win" Loop
The game is an infinite loop of "Simulation Scenarios."
 * Deployment Phase: Player spends "Replication Matter" to build/upgrade towers (Satellites) and modify the terrain (forcefields).
 * Simulation Phase: Enemies spawn using Flow Fields to navigate toward the Kobayashi Maru (center of map).
 * Attrition: As enemies die, they drop "Data Logs" (Prestige Currency).
 * Failure: When the Kobayashi Maru is destroyed, the simulation ends. A "Cadet Review" screen appears, grading your performance (Efficiency, casualties, logic).
 * Re-Calibration: Player uses Data Logs to upgrade global stats (e.g., "Phaser Refresh Cycle," "Shield Nutitation Frequency") and restarts.
3.2 Automated Combat Logic (Rock-Paper-Scissors)
Weapons are not just "damage dealers"; they apply specific Particle Physics Effects. The player must build a mix to counter specific enemy types.
 * Phasers (Orange Beam):
   * Effect: Subsystem Disable. 5% chance to stop an enemy for 2 seconds.
   * Best Vs: Fast swarms (Klingons/Jem'Hadar).
 * Disruptors (Green Bolt):
   * Effect: Molecular Degradation. Stacking debuff that increases damage taken by 10%.
   * Best Vs: High Health targets (Borg Cubes).
 * Tetryon (Blue Beam):
   * Effect: Shield Stripping. Deals 300% damage to shields, 50% to hull.
   * Best Vs: Romulans/Dominion.
 * Photon Torpedoes (Red Orb):
   * Effect: Kinetic Impact. High splash damage (AOE). Slow projectile speed.
   * Best Vs: Clumped groups.
 * Quantum Torpedoes (Blue Orb):
   * Effect: Zero-Point Burst. Massive single-target damage. Long reload.
   * Best Vs: Bosses.
3.3 The "Nerdy Stats" Dashboard
The bottom 30% of the screen is a dedicated LCARS dashboard. This is where the "gameplay" happens for the data-focused player.
 * Entropy Monitor: A real-time graph showing the "Chaos Level" of the battlefield.
 * DPS/HPS Graphs: Rolling line charts of Damage Per Second and Heals Per Second.
 * Effectiveness Heatmap: A visual overlay on the map showing where the most enemies are dying (Killzone efficiency).
 * System Status:
   * Instead of "Mana", you have "Warp Core Output" (regenerates over time).
   * Instead of "Health", the Maru has "Structural Integrity Field".
4. Technical Implementation Plan
Phase 1: The Engine Core (Weeks 1-2)
 * Goal: Get 10,000 colored dots moving at 60FPS.
 * Tech: TypeScript, Vite, PixiJS v8.
 * Tasks:
   * Initialize PixiJS Application with preference: 'webgpu'.
   * Set up bitECS world. Define components: Position, Velocity, SpriteID, FactionID.
   * Implement ParticleContainer for rendering. Create a texture atlas with the geometric shapes (Circle, Triangle, Square).
   * Implement basic Spatial Hashing for the entity manager.
Phase 2: The Flow Field (Weeks 3-4)
 * Goal: Intelligent pathfinding for the swarm.
 * Tasks:
   * Create the Grid System (Cost Field).
   * Implement Integration Field generation (Dijkstra's algorithm starting from the Kobayashi Maru).
   * Generate the Vector Field (Flow Field).
   * Create the MovementSystem in bitECS: Agents read the vector from their current cell and apply acceleration.
Phase 3: Combat & Collision (Weeks 5-6)
 * Goal: Dots destroying other dots efficiently.
 * Tasks:
   * Implement Spatial Hash Grid for collision detection (optimizing O(N^2) to O(N)).
   * Create WeaponSystem:
     * Beams (Raycast): Instant hit, draws a PIXI.Graphics line for 1 frame.
     * Projectiles (Entity): Spawns a new entity with Velocity and Explosive components.
   * Implement Lanchester's Laws logic for calculating damage density in a cell.
Phase 4: The LCARS Interface (Weeks 7-8)
 * Goal: The "Nerdy" UI.
 * Tasks:
   * Build an HTML/CSS overlay on top of the Canvas.
   * Use CSS Grid to create the LCARS "Elbow" layout.
   * Create the Technobabble Generator:
     * Arrays: `` + [Emitter, Coil, Array, Matrix] + [Online, Failed, Modulating].
   * Hook up D3.js or Chart.js (canvas mode) to visualize bitECS data (entity count, fps, memory) in real-time.
Phase 5: The "Kobayashi Maru" Logic (Week 9)
 * Goal: Game Loop & Progression.
 * Tasks:
   * Wave Manager: Script the difficulty curve (Linear -> Exponential).
   * Borg Adaptation Logic: If DamageType == Phaser kills > 100 Borg, grant Resistance.Phaser = 100% to global Borg tag. Player must manually click "Remodulate Frequencies" button (cooldown).
   * Floating Origin: Implement coordinate shifting if GlobalTime > 1 hour to prevent float precision jitter.
5. Development Roadmap Checklist
Stage 1: "The Simulator" (Proof of Concept)
 * [ ] Render 5,000 static sprites (PixiJS).
 * [ ] Move 5,000 sprites using Flow Field.
 * [ ] 60 FPS stable on Chrome/Firefox.
Stage 2: "Target Practice" (Combat)
 * [ ] Player can place a "Turret" (Circle) that shoots closest enemy.
 * [ ] Enemies die and return to object pool (No GC spikes).
 * [ ] Basic "Game Over" when enemies touch center.
Stage 3: "Starfleet Academy" (Meta)
 * [ ] Implement Faction specific behaviors (Cloaking, Webbing).
 * [ ] Build the LCARS Dashboard.
 * [ ] Add Sound Effects (Phaser sweep, Torpedo launch - generated via WebAudio API to save assets).
Stage 4: "No-Win Scenario" (Polish)
 * [ ] Add "Borg Adaptation" mechanic.
 * [ ] Add "Prestige/Reset" mechanic.
 * [ ] Finalize color palette (#FF9900 vs #000000).
6. Recommended Libraries
 * Rendering: pixi.js (v8 for WebGPU support).
 * ECS: bitecs (Best performance for JS).
 * UI: HTML/CSS (No canvas UI libraries, keep it DOM for crisp text).
 * Math: gl-matrix (for efficient vector math).
 * Charts: uPlot (Fastest canvas charting library for high-frequency data updates).
This plan gives you a clear path from "empty screen" to "complex sci-fi simulation" while keeping the asset load minimal and performance maximum. Engage.
.
