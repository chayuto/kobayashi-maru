# **High-Performance Browser-Based Infinite Tower Defense: An Architectural Analysis and Implementation Specification**

## **1\. Introduction and Architectural Vision**

The development of a high-performance, infinite Tower Defense (TD) game within a browser environment represents a distinct intersection of software engineering challenges. The user’s requirements—specifically focusing on an "endless" progression, "simple geometry," "low image assets," and a high density of moving entities—mandate a rigorous departure from traditional web development paradigms. While the modern web has evolved into a capable platform for interactive media, the default abstractions provided by the Document Object Model (DOM) and standard Object-Oriented Programming (OOP) patterns are insufficient for the scale of simulation requested. To achieve a seamless experience with thousands of active units (entities) traversing an infinite procedural map, the architecture must rely on Data-Oriented Design (DOD), GPU-accelerated rendering, and specialized algorithmic approaches to pathfinding and coordinate management.  
This report serves as a comprehensive technical blueprint for constructing such a system using TypeScript. It deconstructs the technology stack, advocating for a hybrid architecture utilizing **PixiJS** for rendering, **bitECS** for state management, and **Flow Fields** for crowd dynamics. Furthermore, it addresses the critical, often overlooked mathematical constraints of infinite worlds, specifically floating-point precision loss, proposing a **Floating Origin** solution to maintain simulation integrity over extended play sessions.

### **1.1 The Constraints of the Browser Environment**

To understand the architectural decisions detailed in this report, one must first appreciate the constraints of the execution environment. The browser is a sandboxed environment where the main thread is a scarce resource. JavaScript (and by extension, TypeScript) operates on a single thread event loop. This means that game logic, physics calculations, input handling, and garbage collection (GC) must all occur within a strict time budget to maintain a target frame rate.  
For a target of 60 frames per second (FPS), the total time available per frame is approximately 16.6 milliseconds. However, the browser reserves some of this time for its own internal housekeeping (compositing, layout calculation), effectively leaving the developer with 8–12 milliseconds of execution time for game logic. In a scenario with "a lot of things moving around"—potentially 10,000 to 100,000 units—a naive approach where each unit is a JavaScript object with its own update() method will inevitably fail. The overhead of looking up properties on the heap, combined with the pressure on the V8 engine's garbage collector from creating and destroying short-lived objects (like projectiles), will cause "stop-the-world" pauses, manifesting as visual stutter.  
Therefore, the primary architectural goal is **Instruction Efficiency** and **Memory Locality**. We must maximize the number of useful CPU instructions executed per millisecond and minimize the CPU's need to fetch data from slow main memory (RAM) by keeping data structures compact and cache-friendly. This leads us inevitably toward Data-Oriented Design and the Entity Component System (ECS) pattern.

### **1.2 Defining the Tech Stack**

Based on the comparative analysis of current 2024/2025 web technologies, the following stack is identified as the optimal solution for the stated requirements:

* **Language:** **TypeScript**. The complexity of an ECS-based simulation requires strict type safety to manage component arrays and system interactions without runtime errors. TypeScript’s ability to compile down to highly optimized JavaScript (using monomorphism optimization patterns) makes it indispensable.  
* **Rendering:** **PixiJS (v8)**. Unlike general-purpose game engines (Phaser, Godot) which introduce framework overhead, or 3D-centric engines (Three.js) which complicate 2D geometry, PixiJS is a dedicated 2D rendering library. Its v8 release introduces specific features like ParticleContainer and GraphicsContext that align perfectly with the need to render thousands of simple geometric shapes efficiently via WebGL.  
* **State Management:** **bitECS**. This library implements a strict Structure-of-Arrays (SoA) architecture using JavaScript TypedArrays (Float32Array, Uint8Array). It eliminates object allocation for entities, thereby neutralizing garbage collection pressure and maximizing CPU cache utilization.  
* **Pathfinding:** **Flow Fields (Continuum Crowds)**. Traditional A\* pathfinding scales linearly with unit count (calculating a path for *each* unit). Flow Fields scale with *map size*, allowing thousands of units to navigate simultaneously with O(1) per-unit cost. This is the industry standard for high-density RTS and TD games.

The subsequent sections provides a deep dive into each of these components, explaining the "why" and "how" of their implementation.

## **2\. Rendering Engine Selection and Optimization**

The visual requirement is described as "simple geometry" and "low image asset," but with a high quantity of moving objects. This suggests a visual style relying on primitive shapes (circles, squares, triangles) rather than high-resolution sprites. However, rendering thousands of individual geometric primitives is computationally distinct from rendering sprites and presents specific optimization challenges.

### **2.1 The Render Context: WebGL vs. Canvas vs. WebGPU**

The HTML5 ecosystem offers three primary rendering contexts. Understanding their performance profiles is crucial for high-entity games.  
**Canvas 2D:** The standard canvas.getContext('2d') API is fundamentally an imperative drawing surface. While modern browsers hardware-accelerate Canvas 2D operations, the API structure incurs significant overhead for each draw call. Every time ctx.fillRect() is called, the browser must validate the state, marshal data between the CPU and GPU, and execute the command. For a scene with 10,000 objects, this results in 10,000 separate draw calls (or batches, if the browser is clever, but this is unreliable). Benchmarks consistently show Canvas 2D performance degrading rapidly past 3,000–5,000 moving entities.  
**WebGL (Web Graphics Library):** WebGL provides a low-level binding to OpenGL ES. Its primary advantage is programmable shaders and the ability to upload geometry data (vertices) to the GPU's memory (VRAM) once, and then issue draw commands that reference that data. Crucially, WebGL supports **Instanced Rendering** and **Geometry Batching**. Batching allows the engine to aggregate the data of thousands of sprites into a single buffer and render them all in one draw call. This drastically reduces the CPU-GPU communication overhead, which is the primary bottleneck in web gaming. For the requested "lots of things moving around," WebGL is mandatory.  
**WebGPU:** The successor to WebGL, offering lower overhead and compute shaders. While PixiJS v8 supports WebGPU, its browser adoption is not yet as ubiquitous as WebGL. However, using an engine that supports it (like PixiJS) ensures future-proofing.

### **2.2 Comparative Analysis of Engines**

The user queried "Whats lib? Engine?". The research snippets provide a landscape of options for 2025\.

| Engine | Primary Focus | Pros for User Request | Cons for User Request |
| :---- | :---- | :---- | :---- |
| **Phaser** | Full Framework | "Batteries included" (Physics, Sound). Large community. | High overhead. The built-in Arcade physics and pathfinding are object-heavy and not optimized for 10k+ units. Rendering performance (historically) trails pure renderers. |
| **Three.js** | 3D Rendering | Powerful 3D capabilities. | Overkill for 2D. 2D is simulated via orthographic cameras. The scene graph overhead includes matrix calculations for 3D rotation/Z-depth which are wasted cycles for a flat TD game. |
| **Godot (Web)** | General Engine | Visual Editor, node-based. | The WebAssembly (WASM) export adds significant file size bloat. Interfacing between high-performance JS/TS logic and the engine's internal C++ logic can be complex for web-only projects. |
| **PixiJS** | 2D Rendering | **Fastest 2D renderer.** Lightweight. Dedicated batching for 2D sprites. v8 is architected for massive sprite counts. | Not a "game engine" (no built-in physics/sound), but this is a *pro* here as we need custom high-performance logic anyway. |

**Recommendation: PixiJS.** PixiJS abstracts the complexity of WebGL batching while providing a friendly API. It is specifically designed to render 2D content at speed. For a "browser only" game with "simple geometry," PixiJS provides the raw rendering throughput required without the bloat of a full engine like Unity or Godot, which often struggle with load times and DOM integration on the web.

### **2.3 Optimization Strategy: The "Texture Rule" for Geometry**

A critical technical nuance in PixiJS (and WebGL in general) is the difference between rendering *Graphics* and rendering *Sprites*.  
**The Naive Approach (Slow):**  
`// BAD PERFORMANCE`  
`for (let i = 0; i < 10000; i++) {`  
    `const graphics = new PIXI.Graphics();`  
    `graphics.beginFill(0xFFFFFF);`  
    `graphics.drawCircle(0, 0, 10); // Unique geometry for every unit`  
    `graphics.endFill();`  
    `graphics.x = x[i];`  
    `graphics.y = y[i];`  
    `stage.addChild(graphics);`  
`}`

In this scenario, PixiJS must calculate triangulation for 10,000 circles individually. PIXI.Graphics are generally not batched as efficiently as sprites because each one defines a unique set of vector paths. The GPU has to process thousands of unique vertex buffers.  
**The Optimized Approach (Fast):** The correct approach for "simple geometry" is to rasterize the geometry *once* into a texture and then render 10,000 sprites using that texture.  
`// GOOD PERFORMANCE`  
`const graphics = new PIXI.Graphics();`  
`graphics.circle(0, 0, 10).fill(0xFFFFFF);`  
`const circleTexture = app.renderer.generateTexture(graphics); // Create texture once`

`for (let i = 0; i < 10000; i++) {`  
    `const sprite = new PIXI.Sprite(circleTexture); // Reuse texture`  
    `sprite.x = x[i];`  
    `sprite.y = y[i];`  
    `sprite.tint = 0xFF0000; // Colorize per-unit`  
    `container.addChild(sprite);`  
`}`

This takes advantage of **Sprite Batching**. The GPU holds the texture in cache and simply draws quad after quad (two triangles making a square) with different transformation matrices. This is orders of magnitude faster.

### **2.4 PixiJS v8: ParticleContainer and GraphicsContext**

PixiJS v8 introduces substantial architectural changes beneficial to this project.  
**GraphicsContext:** In v7, Graphics geometry was unique to the instance. In v8, GraphicsContext allows multiple Graphics objects to share the same underlying geometry data while maintaining independent transforms. This is an alternative to the sprite-texture method if vector fidelity is required at different zoom levels, though for massive counts, Sprites remain superior.  
**ParticleContainer:** This is the "nuclear option" for performance. Standard PixiJS containers calculate the scene graph (parent-child transforms) for every object. The ParticleContainer (optimized in v8) ignores most scene graph features (like nested children or complex masking) to push raw position, scale, and rotation data directly to the GPU in a single flat buffer. For an endless TD game where units are essentially "particles" flowing through a maze, rendering them via a ParticleContainer is the key to unlocking 50,000+ entity counts. It allows updating the positions of thousands of units by modifying a single data buffer, bypassing the JavaScript object overhead of the scene graph entirely.

## **3\. State Management: Data-Oriented Design and ECS**

With rendering addressed, the bottleneck shifts to the CPU: managing the logic for 10,000 units. This includes updating positions, checking health, and calculating damage. The standard Object-Oriented Programming (OOP) model, ubiquitous in web development, is ill-suited for this task.

### **3.1 The Performance Cost of OOP**

In a typical OOP implementation, an enemy might be defined as:  
`class Enemy {`  
    `position: Vector2;`  
    `health: number;`  
    `speed: number;`  
    `update() {... }`  
`}`

If the game spawns 10,000 enemies, the JavaScript engine allocates 10,000 Enemy objects and 10,000 Vector2 objects on the heap. These objects are scattered in memory (heap fragmentation). When the game loop iterates through the enemies array, the CPU cache (L1/L2) fails to predict where the next object's data is located, resulting in **Cache Misses**. Fetching data from RAM is significantly slower than fetching from the CPU cache.  
Furthermore, dynamic games involve creating and destroying entities (projectiles spawn, hit, die). This "churn" forces the Garbage Collector (GC) to run frequently to reclaim memory. GC pauses are the primary cause of frame rate stutter in browser games.

### **3.2 The Solution: Entity Component System (ECS)**

ECS is a Data-Oriented pattern that decouples data from identity.

* **Entity:** A simple integer ID (e.g., 1, 2, 3). It refers to a "thing" in the game but holds no data itself.  
* **Component:** A pure data container (e.g., Position, Velocity, Health).  
* **System:** Logic that iterates over entities possessing specific components (e.g., MovementSystem updates Position using Velocity).

### **3.3 Implementing SoA with bitECS**

The library **bitECS** is chosen for this project because it implements ECS using a **Structure of Arrays (SoA)** backed by TypedArrays.  
In bitECS, components are not objects. They are indices into large, pre-allocated binary arrays.  
`// bitECS definition`  
`const Position = defineComponent({`  
  `x: Types.f32, // Float32Array`  
  `y: Types.f32`  
`});`

`const Velocity = defineComponent({`  
  `x: Types.f32,`  
  `y: Types.f32`  
`});`

Internally, bitECS allocates a single Float32Array for Position.x. The x-coordinate of entity 100 is simply Position.x.  
**Benefits of bitECS for this Project:**

1. **Memory Locality:** Since Position.x is a contiguous block of memory, the CPU can preload subsequent values into the cache line. Iterating through 10,000 positions to apply velocity becomes a linear scan of memory, which modern CPUs execute efficiently using SIMD (Single Instruction, Multiple Data) optimizations often applied by the JIT compiler.  
2. **Zero Garbage Collection:** The arrays are pre-allocated at startup (e.g., for 100,000 max entities). creating an entity effectively just claims an index; destroying it releases the index. No memory is allocated or freed during the frame, eliminating GC spikes.  
3. **Serialization:** Since the entire game state exists in a few SharedArrayBuffers, saving the game or sending state to a Web Worker is trivial—it's just a memory copy (or transfer) of the buffers.

**Comparison with Miniplex:** The research mentions **Miniplex** as an alternative. Miniplex uses standard JS objects ({ x: 0, y: 0 }). While Miniplex offers a better Developer Experience (DX) with easier syntax, it suffers from the same cache-miss issues as standard OOP at massive scales. For a requirement of "a lot of things moving around" (implying 10k+), bitECS is the necessary choice over Miniplex.

### **3.4 Integrating bitECS with PixiJS**

The integration pattern involves a RenderSystem that synchronizes the pure data from bitECS to the visual representation in PixiJS.  
`// Conceptual Render System`  
`function RenderSystem(world) {`  
    `const ids = query(world,);`  
    `for (let i = 0; i < ids.length; i++) {`  
        `const id = ids[i];`  
        `// PixiSpriteMap maps EntityID -> PIXI.Sprite`  
        `const sprite = PixiSpriteMap.get(id);`   
        `sprite.x = Position.x[id];`  
        `sprite.y = Position.y[id];`  
    `}`  
`}`

To further optimize, if using ParticleContainer, the system would write directly to the buffer of the container rather than updating sprite properties, skipping the JS bridge entirely.

## **4\. Pathfinding Strategy: Flow Fields**

In a typical game, units use the A\* (A-Star) algorithm to find a path. A\* is computationally expensive: finding a path for one unit might take 0.1ms. If 5,000 units need to update their paths simultaneously (e.g., when a player places a new wall), the calculation would take 500ms—halting the game for half a second. This is unacceptable.

### **4.1 The Flow Field Paradigm**

For Tower Defense games, where many units share a common goal (the player's base) or a few goals, **Flow Fields** (or Vector Fields) are the superior solution.  
Instead of calculating a path *for each unit*, we calculate a path *for the map*. The result is a grid where every cell contains a vector pointing in the direction of the optimal path.

### **4.2 Algorithm Implementation**

The implementation involves three derived fields, recalculated whenever the map geometry changes (e.g., a tower is placed) :

1. **Cost Field:** A 2D array (represented as a 1D Uint8Array for performance) representing the terrain.  
   * Grass/Road: 1  
   * Mud/Slow Zone: 5  
   * Wall/Tower: 255 (Impassable)  
2. **Integration Field (Heatmap):** A Dijkstra flood-fill algorithm starts at the Goal tile.  
   * Goal Tile Value \= 0\.  
   * Neighbor Value \= Current Value \+ Cost Field Value.  
   * This creates a gradient where values increase as you move away from the goal. This step solves the "maze" logic.  
3. **Vector Field (Flow Field):** For each cell, we examine its neighbors. The flow vector for cell (x, y) points toward the neighbor with the lowest Integration Field value.  
   * This vector is stored, normalized, in a Float32Array.

### **4.3 Runtime Performance**

* **Unit Logic:** A unit at (x, y) simply queries the Vector Field at floor(x), floor(y) to get its velocity vector. This is an O(1) lookup.  
* **Scalability:** The cost of pathfinding is decoupled from the number of units. Whether there are 10 units or 100,000, the pathfinding cost is zero per unit.  
* **Update Cost:** Recomputing the Flow Field for a 100x100 grid takes a few milliseconds. This can be further optimized by only recomputing the portion of the graph affected by a new tower, or by offloading the calculation to a **Web Worker**.

### **4.4 Smoothing and Continuum Crowds**

Basic flow fields can result in "robotic" movement where units snap to 45-degree angles. To achieve the "fluid" motion requested:

* **Bilinear Interpolation:** Instead of using the single vector of the cell the unit is in, the unit samples the four nearest vectors and interpolates them based on its sub-pixel position. This creates smooth, curved trajectories.  
* **Local Steering:** To prevent units from stacking on top of each other, a lightweight "repulsion" force (from Boids theory) is applied. This requires units to know who is nearby, necessitating a spatial query system (discussed in Section 6).

## **5\. Infinite World Architecture: The Floating Origin**

The requirement for an "Endless" game introduces a specific mathematical hazard: **Floating Point Precision Loss**.

### **5.1 The Precision Problem**

JavaScript numbers are doubles (64-bit), which maintain high precision for massive values. However, WebGL (and most GPU pipelines) operates on floats (32-bit).

* A 32-bit float has about 7 decimal digits of precision.  
* If a player travels 100,000 units from the origin (0,0), the smallest increment the GPU can represent might be 0.01 or 0.1.  
* **The Symptom:** Geometry begins to jitter or "wobble." Smooth movement becomes jerky because the unit's position snaps to the nearest representable float value. Collision detection fails because "near" is no longer accurate.

### **5.2 The Floating Origin Solution**

We cannot let the coordinate values grow indefinitely. Instead of moving the camera to infinity, we move the world back to zero.

1. **Logic Coordinates (64-bit):** Keep a simulation variable globalDistance tracking the total distance traveled (for score/difficulty).  
2. **Render Coordinates (32-bit):** Keep all entities within a "safe zone" (e.g., \-5,000 to \+5,000).  
3. **The Shift:** When the player/camera moves beyond a threshold (e.g., x \> 5000), we subtract 5,000 from the x-position of *every entity* in the ECS and the camera itself. We add 5,000 to globalDistance.  
   * Visually, this snap is imperceptible if done in a single frame update.  
   * Mathematically, it resets the precision clock, allowing the game to run forever without jitter.

### **5.3 Procedural Map Generation**

An infinite map must be generated in chunks.

* **Chunk System:** The world is divided into fixed-size grids (e.g., 64x64 tiles). As the player moves right, new chunks are generated ahead and old chunks behind are discarded.  
* **Wave Function Collapse (WFC):** To ensure that the path remains valid (infinite connectivity), WFC is a robust algorithm. It allows defining constraints (e.g., "Road must connect to Road") and collapsing a superposition of tiles into a valid path. This is superior to pure random noise, which often creates dead ends.  
* **Integration with Flow Fields:** When a new chunk is added, the Flow Field must be updated to flow towards the *next* chunk's entrance. Effectively, the "Goal" of the Flow Field is always the dynamic "exit" of the current viewport.

## **6\. Collision Detection: Spatial Hashing**

With "a lot of things moving around," detecting when a projectile hits an enemy is an O(N^2) operation (checking every bullet against every enemy). We need **Spatial Partitioning** to reduce this to near O(N).

### **6.1 Quadtrees vs. Spatial Hashing**

**Quadtrees** are a hierarchical structure that subdivides space. While popular, they are often suboptimal for high-density dynamic games because moving an object requires updating the tree structure (rebalancing nodes), which is CPU intensive.  
**Spatial Hashing (Grid Partitioning)** is simpler and often faster for uniform density.

* The world is conceptually divided into a grid of buckets (cells).  
* A hash function maps an entity's (x, y) to a bucket index.  
  * index \= floor(x / cellSize) \+ floor(y / cellSize) \* width  
* **Implementation:** A Map\<number, number\> or a flat array of linked lists stores the Entity IDs in each bucket.  
* **Query:** To check collisions for a bullet, we hash its position and only check against enemies in that specific bucket (and immediate neighbors).

For TypeScript/bitECS, a **Sparse Spatial Hash** using a Map is efficient for infinite worlds where the grid is not contiguous. Alternatively, since we use a Floating Origin, the "active" world is always bounded, so a high-performance **Flat Array** (dense grid) can be reused every frame, clearing it and re-populating it with zero allocation overhead.

## **7\. Detailed Implementation Reference**

This section provides specific structural guidance for the TypeScript implementation.

### **7.1 Architecture Diagram (Textual)**

1. **Main Loop (Ticker):** Driven by requestAnimationFrame.  
2. **Input System:** Captures mouse/keyboard state.  
3. **Simulation Loop (bitECS):**  
   * TimeSystem: Updates global/delta time.  
   * ChunkSystem: Checks player position, generates/destroys map chunks, triggers Floating Origin shift.  
   * FlowFieldSystem: Updates vectors if map changed.  
   * SteeringSystem: Reads Flow Field, applies steering forces to Velocity.  
   * PhysicsSystem: Position \+= Velocity \* dt. Updates Spatial Hash.  
   * CollisionSystem: Queries Spatial Hash for impacts.  
   * StateSystem: Handles HP, death, spawning (object pooling).  
4. **Render Loop (PixiJS):**  
   * SyncSystem: Reads Position from ECS, updates ParticleContainer buffers or Sprite transforms.  
   * app.render(): PixiJS executes WebGL draw calls.

### **7.2 Code Structure: The Flow Field System**

The following TypeScript snippet illustrates the integration of bitECS and the Flow Field logic.  
`// Component Definitions (SoA)`  
`const Position = defineComponent({ x: Types.f32, y: Types.f32 });`  
`const Velocity = defineComponent({ x: Types.f32, y: Types.f32 });`  
`const FlowAgent = defineComponent({}); // Tag component`

`// System Definition`  
`export const createFlowFieldSystem = (world: IWorld, grid: Grid) => {`  
  `// Pre-allocate query for performance`  
  `const queryAgents = defineQuery([Position, Velocity, FlowAgent]);`

  `return (dt: number) => {`  
    `const entities = queryAgents(world);`  
      
    `// Iterate entities (highly optimized by V8 for monomorphic access)`  
    `for (let i = 0; i < entities.length; i++) {`  
      `const eid = entities[i];`  
        
      `// 1. Map world position to grid index`  
      `// Using '>>' for integer truncation if cellSize is power of 2`  
      `const gx = Math.floor(Position.x[eid] / CELL_SIZE);`  
      `const gy = Math.floor(Position.y[eid] / CELL_SIZE);`  
        
      `// 2. Lookup Vector (pre-calculated Float32Array)`  
      `const vectorIndex = gx + gy * grid.width;`  
      `const dx = grid.vectorFieldX[vectorIndex];`  
      `const dy = grid.vectorFieldY[vectorIndex];`  
        
      `// 3. Apply to Velocity (with simple acceleration logic)`  
      `Velocity.x[eid] += (dx * SPEED - Velocity.x[eid]) * TURN_SPEED * dt;`  
      `Velocity.y[eid] += (dy * SPEED - Velocity.y[eid]) * TURN_SPEED * dt;`  
    `}`  
  `}`  
`};`

### **7.3 Code Structure: Spatial Hashing**

To avoid GC, the spatial hash should use a pre-allocated array implementation.  
`const spatialHash = new Int32Array(GRID_SIZE * GRID_SIZE); // Stores Head Entity ID`  
`const nextEntity = new Int32Array(MAX_ENTITIES); // Stores Linked List Next Ptr`

`function updateSpatialHash(entities: number) {`  
  `spatialHash.fill(-1); // Reset grid`  
    
  `for (let i = 0; i < entities.length; i++) {`  
    `const eid = entities[i];`  
    `const cellIdx = getCellIndex(Position.x[eid], Position.y[eid]);`  
      
    `// Insert at head of linked list for this cell`  
    `nextEntity[eid] = spatialHash[cellIdx];`  
    `spatialHash[cellIdx] = eid;`  
  `}`  
`}`

`function queryCell(cellIdx: number) {`  
  `let eid = spatialHash[cellIdx];`  
  `while (eid!== -1) {`  
    `// Check collision with 'eid'`  
    `eid = nextEntity[eid];`  
  `}`  
`}`

This linked-list-in-array approach (Intrusive Linked List) is the gold standard for high-performance spatial hashing in DOD, as it requires zero object allocation per frame.

## **8\. Conclusion and Strategic Recommendations**

The constraints of building an "Endless Tower Defense" in a browser with high entity counts effectively rule out standard web development practices. Success relies on adopting techniques from high-performance computing and console game development.  
**Summary of Recommendations:**

1. **Abandon the DOM:** Use **PixiJS v8** for all rendering. Utilize **Textures** generated from GraphicsContext and render them via **ParticleContainer** to leverage GPU batching.  
2. **Abandon Objects for State:** Use **bitECS** to manage game state in TypedArrays. This creates a CPU-cache-friendly memory layout essential for processing 10,000+ units.  
3. *Abandon A:*\* Implement **Flow Fields** to decouple pathfinding cost from unit count.  
4. **Abandon Absolute Coordinates:** Implement a **Floating Origin** system to reset coordinate space periodically, preventing floating-point precision loss in an infinite world.  
5. **Abandon GC:** Use **Spatial Hashing** with flat arrays and **Object Pooling** for all game entities to ensure the Garbage Collector does not interrupt the 60 FPS frame budget.

By adhering to this architectural specification, the project can comfortably support the requested scale ("a lot of things moving around") while maintaining a stable frame rate, fulfilling the vision of a massive, endless browser-based tower defense game.

### **Data Tables**

**Table 1: Rendering Engine Performance Matrix**

| Metric | Canvas 2D | WebGL (Generic) | PixiJS v8 | Phaser 3 |
| :---- | :---- | :---- | :---- | :---- |
| **Max Static Sprites (60fps)** | \~5,000 | \~200,000 | \~200,000+ | \~100,000 |
| **Max Dynamic Entities (60fps)** | \~2,000 | \~50,000 | \~100,000 (ParticleContainer) | \~15,000 |
| **Batching Strategy** | None (Immediate) | Manual Implementation | Automatic / Dynamic | Automatic |
| **Simple Geometry Cost** | High (CPU Raster) | Low (if instanced) | Low (GraphicsContext Texture) | Medium |
| **Memory Overhead** | Low | Medium | Low (Modular) | High |

**Table 2: Pathfinding Algorithm Complexity Analysis**

| Algorithm | Complexity per Unit | Complexity for N Units | Suitability for Swarms |
| :---- | :---- | :---- | :---- |
| *A (A-Star)*\* | O(E) (E=edges) | O(N \\cdot E) | Poor. Scales linearly with unit count. |
| **Dijkstra** | O(V \+ E \\log V) | O(N \\cdot (V \+ E \\log V)) | Poor. Slower than A\* for single paths. |
| **Flow Field** | O(1) (Lookup) | O(N) (Lookup) \+ O(MapSize) (Update) | **Excellent.** Constant cost per unit. |

**Table 3: Spatial Partitioning for Dynamic Collision**

| Structure | Insertion Cost | Query Cost | Memory Layout | Best For |
| :---- | :---- | :---- | :---- | :---- |
| **Quadtree** | O(\\log N) | O(\\log N) | Tree (Heap pointers) | Sparse data, variable sizes. |
| **Spatial Hash (Map)** | O(1) | O(1) | Hash Map (Sparse) | Infinite worlds, uniform density. |
| **Spatial Hash (Array)** | O(1) | O(1) | Flat Array (Contiguous) | **Maximum Performance**, bounded active area. |

#### **Works cited**

1\. Render Loop \- PixiJS, https://pixijs.com/7.x/guides/basics/render-loop 2\. Render Loop | PixiJS, https://pixijs.com/8.x/guides/concepts/render-loop 3\. TypeScript Performance and Type Optimization in Large-Scale Projects | by Andrei Chmelev, https://medium.com/@an.chmelev/typescript-performance-and-type-optimization-in-large-scale-projects-18e62bd37cfb 4\. A Deep Dive into the Performance of Arrays and Objects in JavaScript Using Big O Notation, https://dev.to/vishalkinikar/a-deep-dive-into-the-performance-of-arrays-and-objects-in-javascript-using-big-o-notation-406p 5\. NateTheGreatt/bitECS: Flexible, minimal, data-oriented ECS library for Typescript \- GitHub, https://github.com/NateTheGreatt/bitECS 6\. bitECS/README.md at main · NateTheGreatt/bitECS \- GitHub, https://github.com/NateTheGreatt/bitECS/blob/master/README.md 7\. Mastering TypeScript Data Types: The Complete Guide with Performance Hacks \- Medium, https://medium.com/nerdjacking/mastering-typescript-data-types-the-complete-guide-with-performance-hacks-30097eb3367a 8\. v8 Migration Guide \- PixiJS, https://pixijs.com/8.x/guides/migrations/v8 9\. ParticleContainer \- The New Speed Demon in PixiJS v8, https://pixijs.com/blog/particlecontainer-v8 10\. ddmills/js-ecs-benchmarks \- GitHub, https://github.com/ddmills/js-ecs-benchmarks 11\. Flow field pathfinding for a 3D environment \- Scripting Support \- Developer Forum | Roblox, https://devforum.roblox.com/t/flow-field-pathfinding-for-a-3d-environment/3978108 12\. Flow Field Pathfinding – Leif Node, https://leifnode.com/2013/12/flow-field-pathfinding/ 13\. Goal-Based Vector Field Pathfinding (Flow Field) | by Kaya | CodeX \- Medium, https://medium.com/codex/goal-based-vector-field-pathfinding-flow-field-b467677f7fa5 14\. WebGL vs. Canvas: Which is Better for 3D Web Development? \- PixelFreeStudio Blog, https://blog.pixelfreestudio.com/webgl-vs-canvas-which-is-better-for-3d-web-development/ 15\. HTML Canvas vs WebGL for whiteboarding app? \- Reddit, https://www.reddit.com/r/webgl/comments/1ftkfxl/html\_canvas\_vs\_webgl\_for\_whiteboarding\_app/ 16\. JavaScript/TypeScript Game Engines in 2025 \- GameFromScratch.com, https://gamefromscratch.com/javascript-typescript-game-engines-in-2025/ 17\. WebGL vs Canvas: Best Choice for Browser-Based CAD Tools \- AlterSquare, https://www.altersquare.io/webgl-vs-canvas-best-choice-for-browser-based-cad-tools/ 18\. Performance Tips \- PixiJS, https://pixijs.com/8.x/guides/concepts/performance-tips 19\. Graphics \- PixiJS, https://pixijs.com/8.x/guides/components/scene-objects/graphics 20\. Maximising Performance: A Deep Dive into PixiJS Optimization | by Turk M. Ergin \- Medium, https://medium.com/@turkmergin/maximising-performance-a-deep-dive-into-pixijs-optimization-6689688ead93 21\. How to render large amount of complex polygonal shapes efficiently \#10249 \- GitHub, https://github.com/pixijs/pixijs/discussions/10249 22\. PixiJS: Implementing Core Gaming Concepts \- DEV Community, https://dev.to/rubemfsv/pixijs-implementing-core-gaming-concepts-438j 23\. Improving PIXI Graphics Performance When Rendering Huge Number of Objects. · pixijs pixijs · Discussion \#10521 \- GitHub, https://github.com/pixijs/pixijs/discussions/10521 24\. Optimized way of handling lots of enemies in a Tower Defense game? : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/hxr55v/optimized\_way\_of\_handling\_lots\_of\_enemies\_in\_a/ 25\. How I optimized my Phaser 3 action game — in 2025 | by François \- Medium, https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b 26\. Entity \- Component \- System (ECS) \- Web Game Dev, https://www.webgamedev.com/code-architecture/ecs 27\. Introducing timefold/ecs \- Fast and efficient, zero dependency ECS implementation. : r/webgpu \- Reddit, https://www.reddit.com/r/webgpu/comments/1in8hvl/introducing\_timefoldecs\_fast\_and\_efficient\_zero/ 28\. Tris666w/Flow-Field-Pathfinding: Generate Flow fields, used for agent steering \- GitHub, https://github.com/Tris666w/Flow-Field-Pathfinding 29\. jslee02/awesome-entity-component-system: :sunglasses: A curated list of Entity-Component-System (ECS) libraries and resources \- GitHub, https://github.com/jslee02/awesome-entity-component-system 30\. Tower Defense Search Enemies Efficiently \- Game Development Stack Exchange, https://gamedev.stackexchange.com/questions/71154/tower-defense-search-enemies-efficiently 31\. Flow field pathfinding \- Red Blob Games, https://www.redblobgames.com/blog/2024-04-27-flow-field-pathfinding/ 32\. Basic Flow Fields \- How to RTS, https://howtorts.github.io/2014/01/04/basic-flow-fields.html 33\. Fix my Flow Field pathfinding \- Game Development Stack Exchange, https://gamedev.stackexchange.com/questions/153000/fix-my-flow-field-pathfinding 34\. Precision-Safe Rendering of Large-Coordinate CAD Drawings in Three.js \- Medium, https://medium.com/@mlight.lee/precision-safe-rendering-of-large-coordinate-cad-drawings-in-three-js-c49c299b3afc 35\. How to reset the world in an infinite runner game to prevent an overflowing float?, https://gamedev.stackexchange.com/questions/74618/how-to-reset-the-world-in-an-infinite-runner-game-to-prevent-an-overflowing-floa 36\. Floating Origin in Unity \- Manu's Techblog, https://manuel-rauber.com/2022/04/06/floating-origin-in-unity/ 37\. How far could a player get before loss of precision in endless runner? : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/fr4woj/how\_far\_could\_a\_player\_get\_before\_loss\_of/ 38\. How do I generate random paths in a specific way for my tower defense game? \- Reddit, https://www.reddit.com/r/Unity3D/comments/1owo3tu/how\_do\_i\_generate\_random\_paths\_in\_a\_specific\_way/ 39\. Procedural generation of tower defense levels \- DiVA portal, http://www.diva-portal.org/smash/get/diva2:1442180/FULLTEXT01.pdf 40\. Spatial-Partitioning-Quadtree \- GitHub Pages, https://carlosupc.github.io/Spatial-Partitioning-Quadtree/ 41\. QuadTree vs Spacial hashing; which to use? : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/3jrtpc/quadtree\_vs\_spacial\_hashing\_which\_to\_use/ 42\. QuadTree or Spatial Hashing in ECS ? : r/gamedev \- Reddit, https://www.reddit.com/r/gamedev/comments/1jopdn4/quadtree\_or\_spatial\_hashing\_in\_ecs/ 43\. Verlet particle simulator that uses spatial grid partitioning for more optimized collision detection. \- GitHub, https://github.com/hilbertcube/Spatial-Grid-Partitioning 44\. Collision System Part 2: Sparse Hash-Based Grid Partitioning, Multithreading, and Future, https://handmade.network/p/75/monter/blog/p/2978-collision\_system\_part\_2\_\_sparse\_hash-based\_grid\_partitioning%252C\_multithreading%252C\_and\_future