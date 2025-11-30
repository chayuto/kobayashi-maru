# **System Architecture and Design Specifications for Project: INFINITE SWARM**

## **1\. Executive Summary and Design Philosophy**

The contemporary landscape of strategy gaming is bifurcated into high-intensity, micro-management-heavy Real-Time Strategy (RTS) titles and low-fidelity, number-crunching idle games. Project INFINITE SWARM seeks to bridge this divide by establishing a new paradigm: the "High-Fidelity Simulation God Game." This report details the comprehensive design and technical architecture for an endless tower defense simulation that prioritizes observational gameplay, massive scale, and deep systemic optimization over twitch reflexes. The core mandate is to render and simulate tens of thousands of autonomous entities—referred to hereafter as "agents" or "boids"—engaging in complex factional combat, presented through a "nerdy sci-fi" aesthetic reminiscent of hard science fiction tactical displays.  
To achieve the requisite scale of "massive faction fights," traditional object-oriented game development patterns must be abandoned in favor of Data-Oriented Design (DOD) and GPU-accelerated compute pipelines. The simulation is not merely a game; it is a visual expression of complex mathematical systems, specifically Lanchester’s Laws of attrition and Lotka-Volterra predator-prey dynamics, which ensure the "endless" nature of the gameplay remains stable yet dynamic. The player’s role shifts from a commander issuing direct orders to an architect tuning the parameters of a war machine, observing real-time statistics on a dashboard that serves as the primary interface for engagement. This document outlines the technical pathways to achieve this utilizing WebGPU, Entity Component Systems (ECS), and procedural generation, ensuring a depth of simulation that transforms data visualization into a compelling gameplay loop.

## **2\. Technical Infrastructure: The Compute-First Paradigm**

The defining characteristic of Project INFINITE SWARM is scale. Simulating 10,000 to 100,000 individual units with distinct physics, steering behaviors, and combat logic exceeds the single-threaded capabilities of the JavaScript main thread or even multi-threaded CPU implementations when considering the bus bandwidth required to transfer position data to the GPU for rendering. Therefore, the architecture is founded on a "Compute-First" approach using the WebGPU API.

### **2.1. The Shift to WebGPU and Compute Shaders**

WebGPU represents a fundamental evolution from WebGL by exposing modern GPU capabilities, most notably **Compute Shaders**. Unlike Fragment Shaders, which are bound to the rasterization pipeline (pixels), Compute Shaders allow for arbitrary parallel processing of data. In the context of this simulation, the "game loop" effectively migrates from the CPU to the GPU.  
The simulation utilizes a double-buffered (ping-pong) state management system within the GPU's VRAM. Two storage buffers, Buffer A and Buffer B, hold the complete state of every entity (Position, Velocity, Health, Faction ID). During a simulation frame, the Compute Shader reads the current state from Buffer A, applies physics integration, steering rules, and combat logic, and writes the result to Buffer B. In the subsequent render pass, the Vertex Shader reads directly from Buffer B to draw the entities. This architecture completely eliminates the CPU-to-GPU data transfer bottleneck, which is the primary performance killer in high-entity WebGL applications. Research indicates that moving particle logic to Compute Shaders can yield performance improvements of over 100x compared to CPU-bound equivalents, enabling stable 60 FPS performance even with millions of active particles.

### **2.2. Data-Oriented Design and ECS Architecture**

To organize the data for massive parallelism, the project adopts an **Entity Component System (ECS)** architecture. In contrast to Object-Oriented Programming (OOP), where data is encapsulated within objects (leading to cache misses due to memory fragmentation), ECS organizes data into contiguous arrays of components.  
**Component Structure for GPU Alignment:** The data structures must align with WGSL (WebGPU Shading Language) memory padding requirements.

* **TransformComponent:** vec4\<f32\> (x, y, rotation, scale).  
* **PhysicsComponent:** vec4\<f32\> (velocity\_x, velocity\_y, mass, max\_speed).  
* **CombatComponent:** vec4\<f32\> (health, max\_health, damage, cooldown).  
* **BehaviorComponent:** vec4\<f32\> (alignment\_weight, cohesion\_weight, separation\_weight, target\_weight).

By using "Structure of Arrays" (SoA) layouts, the Compute Shader can burst-read specific data streams (e.g., just the positions for collision detection) without loading irrelevant data (e.g., unit color) into the GPU cache. This is critical for optimizing memory bandwidth, which is often the bottleneck in compute-heavy tasks.

### **2.3. Spatial Partitioning: Spatial Hashing vs. Quadtrees**

A naive implementation of flocking or collision detection requires every unit to check every other unit, resulting in O(N^2) complexity. For 10,000 units, this is 100 million checks per frame, which is computationally prohibitive. While Quadtrees are a common solution for CPU-based spatial partitioning, they are difficult to implement efficiently on a GPU due to their recursive, pointer-based nature.  
Project INFINITE SWARM will instead utilize **Spatial Hashing** implemented via a Uniform Grid in the Compute Shader.

1. **Hash Calculation:** A compute pass assigns each entity a "Cell ID" based on its grid position.  
2. **Parallel Sort:** A high-speed GPU sorting algorithm (e.g., Bitonic Sort) sorts the entity index buffer based on these Cell IDs. This ensures that all entities in the same grid cell are contiguous in memory.  
3. **Offset Table:** A secondary pass builds an offset table (start index and count) for each cell.  
4. **Neighbor Lookup:** During the behavior update pass, an entity only needs to check the entities in its own cell and the 8 surrounding cells using the offset table.

This reduces the algorithmic complexity to O(N \\times K), where K is the average density of neighbors, allowing the simulation to scale linearly with unit count rather than exponentially. The choice of Spatial Hashing over Quadtrees is specifically driven by the "massive" requirement; Quadtrees excel at sparse data, but in a high-density "massive faction fight," the overhead of traversing the tree structure outweighs the benefits, whereas the O(1) lookup of a spatial hash is superior for uniform distributions of swarming units.

## **3\. Autonomous Agent Mechanics: The Swarm Intelligence**

The core gameplay experience relies on the emergent behavior of the units. The player does not control units directly; they control the *rules* that govern them. This requires a robust set of steering behaviors that blend biological flocking with tactical combat awareness.

### **3.1. The Modified Boids Algorithm**

The movement logic is grounded in Craig Reynolds’ **Boids algorithm**, which defines three fundamental rules: Separation, Alignment, and Cohesion. However, standard Boids result in aimless flocking. For a tower defense context, we introduce a fourth and fifth vector: **Target Seeking** and **Flow Following**.  
The total acceleration vector \\vec{A} for a unit is calculated as a weighted sum: $$ \\vec{A} \= \\frac{\\vec{V}*{sep} \\cdot W*{sep} \+ \\vec{V}*{align} \\cdot W*{align} \\cdot \+ \\vec{V}*{coh} \\cdot W*{coh} \+ \\vec{V}*{flow} \\cdot W*{flow} \+ \\vec{V}*{avoid} \\cdot W*{avoid}}{Mass} $$

* **Separation (\\vec{V}\_{sep}):** Critical for preventing units from overlapping, which maintains visual clarity and simulates physical volume. In a "massive" simulation, this force creates the visual of a fluid displacing volume rather than a ghost-like superposition of sprites.  
* **Alignment (\\vec{V}\_{align}):** Causes units to move in the same direction as their neighbors, creating the visual language of organized "squads" or "fleets" without explicit squad logic.  
* **Cohesion (\\vec{V}\_{coh}):** Keeps the faction together.  
* **Flow Following (\\vec{V}\_{flow}):** This is the primary navigation vector, derived from the Flow Field (detailed in Section 3.2).

By exposing the weights (W) of these vectors to the player via the dashboard, the game turns AI tuning into a mechanic. A player might increase W\_{sep} to create a loose "skirmisher" formation to mitigate Area-of-Effect (AoE) damage, or increase W\_{coh} to create a dense "battering ram" to punch through point defenses.

### **3.2. Flow Field Pathfinding (Vector Fields)**

Traditional pathfinding algorithms like A\* are inherently single-agent and CPU-intensive. Pathfinding for 10,000 units individually is impossible in real-time. The solution is **Flow Field Pathfinding**.  
The map is discretized into a grid. For a target destination (e.g., the player's base or a resource node), a "Dijkstra Map" (Integration Field) is generated, representing the distance from every cell to the goal, accounting for obstacles (towers, walls). From this scalar field, a **Vector Field** is derived by calculating the gradient—each cell stores a vector pointing "downhill" toward the goal.  
**Advantages for "Massive" Gameplay:**

1. **O(1) Access:** Agents simply read the vector from the grid cell they occupy. The computational cost of movement does not increase with the number of agents.  
2. **Shared Computation:** The expensive pathfinding calculation is done once for the field, not per unit.  
3. **Dynamic Updates:** When the player places a tower, only the local area of the flow field needs recalculation. The swarm instantly and organically flowing around the new obstacle creates a satisfying "fluid dynamics" aesthetic that fits the sci-fi theme.

### **3.3. Finite State Machine (FSM) Integration**

While steering behaviors handle movement, combat logic requires discrete states. A lightweight **Finite State Machine (FSM)** is encoded into the Compute Shader for each unit.

* **State 0: Move:** Follow Flow Field. Check for enemies within sensor range.  
* **State 1: Engage:** Enemy detected. Transition steering to "Orbit" or "Ram" behavior depending on weapon type. Fire weapon if cooldown is 0\.  
* **State 2: Flee:** Health \< Threshold. Invert Flow Field vector to seek repair nodes.

This FSM is data-driven. The thresholds for transitions (e.g., "Flee Health %") are global parameters the player can adjust. This aligns with the "low intensity" design pillar—the player doesn't micro-manage retreat, they set the *policy* for retreat.

## **4\. Mathematical Combat Dynamics and Balance**

To support an "endless" simulation that remains engaging without constant input, the combat mechanics must be self-balancing yet exploitable through optimization. We utilize two primary mathematical models: **Lanchester’s Laws** and the **Lotka-Volterra Equations**.

### **4.1. Lanchester’s Laws: The Math of Attrition**

Lanchester’s Laws describe the rate of attrition between opposing forces.

* **Linear Law:** dA/dt \= \-\\beta \\cdot B \\cdot E (where E is engagement range). This models melee combat or choke points where only the front line can fight.  
* **Square Law:** dA/dt \= \-\\beta \\cdot B. This models ranged combat where every unit can target every enemy. Here, the combat power of a force scales with the *square* of its size.

**Implication for Endless Play:** The Square Law leads to "snowballing"—a slightly larger force wins overwhelmingly. To prevent the simulation from ending too quickly or becoming static, the game must implement mechanics that shift the dynamic between Linear and Square laws.

* **AoE Scaling:** We introduce Area-of-Effect (AoE) weapons. The effectiveness of AoE scales linearly with enemy density. As a swarm becomes larger and denser (favoring Square Law), it becomes more vulnerable to AoE (favoring the defender). This acts as a negative feedback loop, stabilizing the simulation.

### **4.2. Lotka-Volterra Dynamics (Predator-Prey)**

To create an "endless" loop, the relationship between the Player's defenses (Predator) and the Enemy Swarm (Prey) is modeled on **Lotka-Volterra equations**.

* **x (Enemies):** Spawn rate increases over time.  
* **y (Defenses):** Powered by resources dropped by killing enemies.

**The Loop:**

1. Enemies increase.  
2. Player kills enemies \\rightarrow Resources increase \\rightarrow Defenses upgraded.  
3. Defenses become too strong \\rightarrow Enemies wiped out too fast.  
4. Resource income drops (fewer enemies to kill) \\rightarrow Maintenance costs overwhelm player.  
5. Defenses decay/downgrade.  
6. Enemies recover and swarm again.

This creates a sinusoidal difficulty curve rather than a linear one. The player's goal is not just to "survive," but to **dampen the oscillation**—optimizing their kill rate to maintain a steady flow of resources without collapsing the enemy population (starvation) or being overrun (extinction).

### **4.3. The Rock-Paper-Scissors (RPS) Triad**

To prevent a single optimal unit type from dominating (which leads to visual and strategic stagnation), an RPS system is enforced via armor and damage types.

| Weapon Type (Damage) | Target: Shield (Blue) | Target: Armor (Red) | Target: Swarm/Nanite (Green) |
| :---- | :---- | :---- | :---- |
| **Kinetic (Red)** | **Strong (200%)** \- Overloads capacity | **Neutral (100%)** | **Weak (50%)** \- Misses small targets |
| **Beam (Blue)** | **Weak (50%)** \- Diffracted | **Strong (200%)** \- Melts armor | **Neutral (100%)** |
| **Explosive (Green)** | **Neutral (100%)** | **Weak (50%)** \- Absorbed | **Strong (200%)** \- Area Saturation |

This forces the player to observe the enemy composition on the dashboard and adjust their "Manufacturing Mix" accordingly. If the enemy evolves to use 80% Shields, the player must shift production to Kinetic weapons.

## **5\. Visual Aesthetics: The "Nerdy Sci-Fi" Identity**

The visual language of the simulation is crucial for conveying "nerdy sci-fi" authenticity. It eschews photorealism for high-fidelity abstraction, drawing inspiration from User Interfaces (FUI) seen in media like *The Expanse* or *Ender’s Game*.

### **5.1. Geometric Shape Language**

Units are rendered as abstract geometric primitives. This serves two purposes: it reduces the polygon count to allow for millions of entities, and it provides instant readability of faction and role.

* **Triangles:** Aggressive, fast, Kinetic. They orient visually toward their velocity vector, resembling arrowheads or missiles.  
* **Squares:** Defensive, slow, Armor. They represent stability and blockades.  
* **Circles:** Versatile, support, Energy. They represent cohesion and fields.

**Procedural Faction Generation:** To support "massive faction fights," factions are procedurally generated. The system varies the geometric parameters (e.g., Triangle aspect ratio, Square corner roundness, vertex jitter) and emission colors. This ensures that "Faction 492" has a distinct visual identity (e.g., "Purple Rounded Triangles") without manual asset creation.

### **5.2. Instanced Rendering and Post-Processing**

To render 100,000 units, **Hardware Instancing** is used. A single geometry (e.g., a generic triangle) is loaded into the GPU. A second buffer contains the per-instance data (position, rotation, color, scale). The render pipeline draws this single mesh 100,000 times with zero CPU overhead for draw calls.  
**The "Glow" (Bloom):** The "sci-fi" aesthetic is achieved through a high-quality Bloom post-processing effect.

1. **HDR Rendering:** The scene is rendered to a floating-point texture with color values exceeding 1.0 (e.g., a laser beam has brightness 5.0).  
2. **Thresholding:** A shader extracts pixels brighter than 1.0.  
3. **Gaussian/Dual Blur:** The bright pixels are downsampled and blurred multiple times.  
4. **Composition:** The blurred highlights are added back on top of the original image. This makes the geometric shapes appear to be made of pure light/energy, reinforcing the "Neon Sci-Fi" theme against a dark background.

### **5.3. Signed Distance Fields (SDF) for Dashboard UI**

The dashboard is an integral part of the visual experience, occupying screen space alongside the battlefield. To ensure text and icons remain crisp at any scale (critical for reading tiny stats on moving units), **Signed Distance Field (SDF)** rendering is used. SDFs store the distance from a pixel to the edge of a shape rather than the color. This allows the GPU to render perfectly smooth curves and text at infinite resolution. It also enables cheap rendering of outlines, drop shadows, and "glows" on UI elements by simply manipulating the distance threshold in the fragment shader.

## **6\. The Dashboard: Observation as Gameplay**

In this "God Game," the dashboard *is* the gameplay. It is not just a HUD; it is a diegetic interface representing the player's command console.

### **6.1. Real-Time Data Visualization**

The dashboard visualizes the complex mathematical systems running underneath.

* **Phase Space Plot:** A live 2D graph where the X-axis is Enemy Count and the Y-axis is Resource Income. The state of the game is a moving point. A stable defense creates a closed loop (limit cycle); a collapsing defense spirals inward. This appeals directly to the "nerdy" desire to visualize system dynamics.  
* **Flow Field Overlay:** A toggleable view that visualizes the underlying vector field as a heatmap or arrow grid. This allows players to "debug" their maze designs ("Why are enemies bunching up here? Ah, the flow vector is blocked").  
* **Entropy Monitor:** A metric tracking the disorder of the battlefield (variance in unit distribution). High entropy suggests chaos/routing; low entropy suggests organized formations. This helps the player identify when a formation is breaking before the casualty counts rise.

### **6.2. Information Hierarchy and GenUI**

To prevent information overload ("Dashboard Fatigue"), the UI utilizes **Generative UI (GenUI)** principles.

* **Level 1 (Strategic):** Top-level metrics (Total DPS, Income, Threat Level). Always visible.  
* **Level 2 (Tactical):** Context-sensitive. Hovering over a swarm highlights its specific DPS and target prioritization.  
* **Level 3 (Analytical):** Clicking a "Deep Dive" button pauses the simulation and expands detailed histograms of damage types over time. The UI dynamically adapts—if Kinetic Damage effectiveness drops below 10%, the "Kinetic Efficiency" graph automatically pulses or expands to draw attention to the bottleneck.

## **7\. Progression and Metagame**

### **7.1. Indirect Control Mechanics**

Players do not click on enemies to kill them. They interact via:

* **Terraforming:** Placing walls or gravity wells to reshape the Flow Field, creating "Kill Zones" where AoE weapons are most effective.  
* **Policy Setting:** Adjusting global sliders (e.g., "Retreat Threshold," "Target Priority: Weakest vs. Nearest") that update the FSM parameters of all friendly units.  
* **Genetic Optimization:** The player designs unit blueprints (hull \+ engine \+ weapon). The system runs rapid background simulations (using the compute shader) to test these designs against the current enemy wave, assigning a "Fitness Score." This allows the player to "evolve" their army to counter specific threats.

### **7.2. The Prestige Loop**

To support "Endless" play, a prestige mechanic allows the player to reset the simulation but keep "Research Data." This data unlocks new geometric primitives (e.g., Hexagons), new compute shader behaviors (e.g., "Boid Flocking v2.0"), or visualization tools (e.g., "Predictive Trajectory Rendering" ). This layers a meta-strategy of unlocking the "ultimate simulation" over the tactical gameplay.

## **8\. Conclusion and Recommendation Summary**

Project INFINITE SWARM is a technical and design challenge that leverages the bleeding edge of web technology to create a unique niche experience. By shifting the simulation to **WebGPU**, utilizing **ECS** for data management, and employing **Spatial Hashing**, the project can realistically simulate 100,000+ units. The gameplay loop, anchored in **Lotka-Volterra** and **Lanchester** dynamics, provides a stable yet oscillating "endless" experience that rewards optimization over reaction. The **FUI Dashboard** serves as the lens through which players dissect and master this complex system, fulfilling the fantasy of the "mastermind" architect.

### **Key Technical Recommendations Table**

| Component | Technology / Method | Reasoning | Complexity |
| :---- | :---- | :---- | :---- |
| **Simulation Core** | **WebGPU Compute Shaders** | Only viable path for \>10k active agents. | High |
| **Data Structure** | **ECS (SoA Layout)** | Maximizes GPU cache coherence. | Medium |
| **Broadphase** | **Spatial Hashing (Grid)** | O(1) lookup, superior to Quadtrees for dense uniform crowds. | High |
| **Pathfinding** | **Flow Fields (Vector Fields)** | Constant cost regardless of unit count; fluid-like motion. | Medium |
| **Visuals** | **Instanced Rendering \+ Bloom** | High performance with "Neon Sci-Fi" aesthetic. | Medium |
| **UI Text** | **Signed Distance Fields (SDF)** | Infinite resolution for high-density dashboards. | Medium |
| **Balance Model** | **Lotka-Volterra Eq.** | Ensures dynamic stability for endless gameplay. | Low (Math) |

This report provides the blueprint for a genre-defining title that respects the intelligence of its players and pushes the boundaries of browser-based gaming.

#### **Works cited**

1\. 14 Top Sci-Fi Designs to Inspire Your Next Interface \- SitePoint, https://www.sitepoint.com/14-top-sci-fi-designs-to-inspire-your-next-interface/ 2\. Designing a \*functional\* futuristic user interface | by Sarah Kay Miller | Domo UX | Medium, https://medium.com/domo-ux/designing-a-functional-futuristic-user-interface-c27d617ce8cc 3\. Lanchester's laws \- Wikipedia, https://en.wikipedia.org/wiki/Lanchester%27s\_laws 4\. Lotka–Volterra equations \- Wikipedia, https://en.wikipedia.org/wiki/Lotka%E2%80%93Volterra\_equations 5\. WebGPU API \- MDN Web Docs \- Mozilla, https://developer.mozilla.org/en-US/docs/Web/API/WebGPU\_API 6\. WebGPU is now supported in major browsers | Blog \- web.dev, https://web.dev/blog/webgpu-supported-major-browsers 7\. WebGL vs. WebGPU: Is It Time To Switch? \- Three.js Roadmap, https://threejsroadmap.com/blog/webgl-vs-webgpu-explained 8\. Particle System in WebGPU \- Research Unit of Computer Graphics | TU Wien, https://www.cg.tuwien.ac.at/research/publications/2023/PETER-2023-PSW/PETER-2023-PSW-.pdf 9\. Performance Comparison of WebGPU and WebGL for 2D Particle Systems on the Web \- DiVA portal, https://www.diva-portal.org/smash/get/diva2:1945245/FULLTEXT02 10\. Data-Oriented Design (Or Why You Might Be Shooting Yourself in The Foot With OOP), https://gamesfromwithin.com/data-oriented-design 11\. Handing Collisions the ECS Way \- kyle kukshtel's website, https://kylekukshtel.com/ecs-collisions-dinghy 12\. Looking for Data Oriented Games (no ECS) : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/1i1et60/looking\_for\_data\_oriented\_games\_no\_ecs/ 13\. Pure ECS collision detection demo in under 70 lines of code (see post) : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/aiymwl/pure\_ecs\_collision\_detection\_demo\_in\_under\_70/ 14\. QuadTree or Spatial Hashing in ECS ? : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/1jopdn4/quadtree\_or\_spatial\_hashing\_in\_ecs/ 15\. Geohash or Quadtree? Ready, Set, Go\! for System Design Interviews | by Agustin Ignacio Rossi | Medium, https://medium.com/@agustin.ignacio.rossi/geohash-or-quadtree-ready-set-and-go-for-system-design-interviews-4fd81fb1049f 16\. Particle Life simulation in browser using WebGPU | lisyarus blog, https://lisyarus.github.io/blog/posts/particle-life-simulation-in-browser-using-webgpu.html 17\. QuadTree vs Spacial hashing; which to use? : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/3jrtpc/quadtree\_vs\_spacial\_hashing\_which\_to\_use/ 18\. An Order of Magnitude More Boids: Optimizing Flocking Simulations \- Mark Tensen, https://marktension.nl/blog/order-of-magnitude-boids/ 19\. Boids-algorithm \- V. Hunter Adams, https://vanhunteradams.com/Pico/Animal\_Movement/Boids-algorithm.html 20\. Boids (Flocks, Herds, and Schools: a Distributed Behavioral Model) \- red3d.com, https://www.red3d.com/cwr/boids/ 21\. Boids — Blender Manual, https://docs.blender.org/manual/de/2.81/physics/particles/emitter/physics/boids.html 22\. Boids: Simulating Flocking Behavior with mathematics and KD-Trees \- Medium, https://medium.com/@jorgechedo/boids-simulating-flocking-behavior-with-mathematics-and-kd-trees-be61f8f787f4 23\. Making a boids simulation on the GBA \- jono shields, https://jonoshields.com/post/boids-on-gba/ 24\. Boids Algorithm: Navigating the Skies of Collective Intelligence | by Data Overload | Medium, https://medium.com/@data-overload/boids-algorithm-navigating-the-skies-of-collective-intelligence-8d79b42e2bbb 25\. Boids for RTS \- jdxdev, https://www.jdxdev.com/blog/2021/03/19/boids-for-rts/ 26\. Flow Field Pathfinding \- Leif Node, https://leifnode.com/2013/12/flow-field-pathfinding/ 27\. How does Flow Field pathfinding work? \- Game Development Stack Exchange, https://gamedev.stackexchange.com/questions/387/how-does-flow-field-pathfinding-work 28\. Flowfield pathfinding visualization (Unity) : r/Unity3D \- Reddit, https://www.reddit.com/r/Unity3D/comments/1iz6h2x/flowfield\_pathfinding\_visualization\_unity/ 29\. Crowd Pathfinding and Steering Using Flow Field Tiles \- Game AI Pro, http://www.gameaipro.com/GameAIPro/GameAIPro\_Chapter23\_Crowd\_Pathfinding\_and\_Steering\_Using\_Flow\_Field\_Tiles.pdf 30\. Real-Time Fluid Dynamics for Games, http://graphics.cs.cmu.edu/nsp/course/15-464/Fall09/papers/StamFluidforGames.pdf 31\. Finite state machine for retro arcade fighting game development \- R Discovery, https://discovery.researcher.life/article/finite-state-machine-for-retro-arcade-fighting-game-development/1eb0c7a9daed37698e52ad2317914eec 32\. Smart enemies in tower defence? : r/gamedesign \- Reddit, https://www.reddit.com/r/gamedesign/comments/101279h/smart\_enemies\_in\_tower\_defence/ 33\. The Lanchester Equations and Historical Warfare \- The Dupuy Institute, https://dupuyinstitute.org/2018/05/02/the-lanchester-equations-and-historical-warfare/ 34\. Modelling predator-prey interactions – Ecosystem Modelling with EwE, https://pressbooks.bccampus.ca/ewemodel/chapter/lotka-volterra/ 35\. Lotka-Volterra equations predator-prey modeling : r/mathematics \- Reddit, https://www.reddit.com/r/mathematics/comments/1g1h05a/lotkavolterra\_equations\_predatorprey\_modeling/ 36\. The Rock-Paper-Scissors Model of PvP Balance \- The Lurker Lounge, https://www.lurkerlounge.com/forums/thread-8235-nextoldest.html 37\. Rock, Paper, Scissors Design in Strategy Games : r/gamedesign \- Reddit, https://www.reddit.com/r/gamedesign/comments/nnisme/rock\_paper\_scissors\_design\_in\_strategy\_games/ 38\. Games with rock, paper, scissors balance at their core. : r/truegaming \- Reddit, https://www.reddit.com/r/truegaming/comments/8uxtw0/games\_with\_rock\_paper\_scissors\_balance\_at\_their/ 39\. Shape Language, https://www.waltdisney.org/sites/default/files/2020-04/T%26T\_ShapeLang\_v9.pdf 40\. Symbols CIRCLE, TRIANGLE and SQUARE : r/squidgame \- Reddit, https://www.reddit.com/r/squidgame/comments/prhkqm/symbols\_circle\_triangle\_and\_square/ 41\. Shape Island \- Wikipedia, https://en.wikipedia.org/wiki/Shape\_Island 42\. Procedural Sci-Fi Building Generator \- Blender addons, https://blender-addons.org/procedural-sci-fi-building-generator/ 43\. Procedural generation of surface detail for science fiction spaceships \- University of Waterloo, https://cs.uwaterloo.ca/\~csk/publications/Papers/kinnear\_kaplan\_2010.pdf 44\. Instancing | Learn Wgpu, https://sotrh.github.io/learn-wgpu/beginner/tutorial7-instancing/ 45\. Bloom Effect \- WebGPU Game Part 19 \- YouTube, https://www.youtube.com/watch?v=72fbC-fEmdc 46\. WebGPU :: Creating a Raytracer with Bloom \- YouTube, https://www.youtube.com/watch?v=ZX7tSWp5NjY 47\. Using Signed Distance Field Text Rendering in Unreal Engine \- Epic Games Developers, https://dev.epicgames.com/documentation/en-us/unreal-engine/using-signed-distance-field-text-rendering-in-unreal-engine 48\. Distance Field / Distance Field Overlay Shaders | Unity UI | 2.0.0 \- Unity \- Manual, https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/TextMeshPro/ShadersDistanceField.html 49\. How to immerse your players through effective UI and game design \- Unity, https://unity.com/blog/games/how-to-immerse-your-players-through-effective-ui-and-game-design 50\. Python- Plotting phase space trajectories (quiver function) \- Stack Overflow, https://stackoverflow.com/questions/47740558/python-plotting-phase-space-trajectories-quiver-function 51\. Interactive and Customizable 3D Phase Space Simulation : r/math \- Reddit, https://www.reddit.com/r/math/comments/1mjqa9n/interactive\_and\_customizable\_3d\_phase\_space/ 52\. Visualizing Entropy in Machine Learning: A Dynamic Exploration | by Hamid Ahang, https://medium.com/@ahahah1/visualizing-entropy-in-machine-learning-a-dynamic-exploration-eb56f631f846 53\. Why is Entropy the main enemy of an interface designer \- Abduzeedo, https://abduzeedo.com/why-entropy-main-enemy-interface-designer 54\. GenUI Design: Foundational Patterns | by Nick Babich | Oct, 2025 | UX Planet, https://uxplanet.org/genui-design-foundational-patterns-633320d0dfea 55\. How do you approach designing complex dashboard layouts without overwhelming users?, https://www.reddit.com/r/UI\_Design/comments/1nfmvwx/how\_do\_you\_approach\_designing\_complex\_dashboard/ 56\. God's Innovation Project \- Empowering The Player With Generative AI \- arXiv, https://arxiv.org/html/2504.13874v1 57\. Searching for "indirect" strategy game : r/StrategyGames \- Reddit, https://www.reddit.com/r/StrategyGames/comments/1o6ocih/searching\_for\_indirect\_strategy\_game/ 58\. What are the best mechanics or systems you've seen for gods as PCs? : r/rpg \- Reddit, https://www.reddit.com/r/rpg/comments/6bvghx/what\_are\_the\_best\_mechanics\_or\_systems\_youve\_seen/ 59\. The G.O.D. Framework: A Balanced Approach to Building Autonomous AI Systems \- Medium, https://medium.com/@vijay.betigiri/the-g-o-d-framework-a-balanced-approach-to-building-autonomous-ai-systems-99ce6c7a60a3 60\. Creating Trajectory Prediction Using Physics Simulations in Unity | by Simon Pham, https://simonpham.medium.com/creating-trajectory-prediction-using-physics-simulations-in-unity-f6d820dae202