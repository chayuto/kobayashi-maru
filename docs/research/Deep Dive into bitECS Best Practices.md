

# **High-Performance Simulation Architecture in TypeScript: Advanced bitECS Patterns, Memory Optimization, and Multithreaded Integration**

## **Executive Summary**

The domain of web-based simulation and interactive application development is undergoing a paradigm shift, driven by the increasing capabilities of browser engines and the demand for "native-grade" performance. Historically, JavaScript’s dynamic typing and garbage-collected environment presented insurmountable barriers to high-fidelity simulations involving tens of thousands of entities. However, the emergence of Data-Oriented Design (DOD) principles, specifically implemented through libraries like **bitECS**, has fundamentally altered this landscape.

This report provides an exhaustive technical analysis of bitECS, a library that eschews traditional Object-Oriented Programming (OOP) models in favor of "Structure of Arrays" (SoA) memory layouts. We dissect the architectural imperatives for maintaining 60+ Hz performance in high-entity simulations, exploring the low-level mechanics of V8 memory allocation, the integration of SharedArrayBuffer for true parallelism via Web Workers, and the mathematical rigor required for deterministic fixed-timestep loops. The analysis draws upon deep technical research to offer a definitive guide for software architects engineering industrial-grade digital twins, massive multiplayer game engines, and complex interactive visualizations in TypeScript.

---

## **1\. The Crisis of Performance in Managed Runtimes**

### **1.1 The Latency of Object-Oriented Design**

To understand the necessity of bitECS, one must first deconstruct the performance failures of traditional application architecture in JavaScript. The Object-Oriented Programming (OOP) model, while excellent for enterprise software abstraction, creates a hostile environment for high-frequency simulations.1 In a standard OOP simulation, an "Entity" is an instance of a class, containing references to other objects (Components).

In the V8 engine, these objects are allocated on the heap. Because they are created sequentially over time but accessed in arbitrary orders, they become scattered across the memory address space. This fragmentation leads to "cache incoherency".2 Modern CPUs rely heavily on L1, L2, and L3 caches to feed data to the execution units. When a system iterates over an array of object references, the CPU prefetcher cannot predict the next memory address, leading to frequent cache misses. Each miss forces a fetch from main RAM, costing hundreds of CPU cycles—orders of magnitude slower than a register or L1 cache access.

Furthermore, the "Array of Structures" (AoS) layout inherent to OOP means that iterating over a specific property (e.g., updating health for all units) requires loading the entire object into the cache line, polluting the cache with irrelevant data (e.g., name, inventory) that is not currently needed.3 This inefficient bandwidth usage creates a hard ceiling on the number of active entities a simulation can support before frame times degrade.

### **1.2 Garbage Collection and Frame Consistency**

In managed languages, memory allocation is not free; it incurs a debt that the Garbage Collector (GC) must eventually pay. Creating temporary objects (vectors, events, closures) during the simulation loop generates "garbage." The GC must traverse the object graph, mark reachable objects, and sweep the rest.

In a simulation running at 60 Hz (16.66ms per frame), a GC pause of even 20ms results in a dropped frame, perceived by the user as "stutter." At scale—100,000 entities—the pressure on the minor (scavenge) and major (mark-sweep-compact) GC generations becomes unsustainable.4 bitECS addresses this by utilizing static memory allocation. The "World" in bitECS acts as a pre-allocated arena. Components are views into massive binary buffers. Adding or removing components involves updating integer indices, not allocating new JavaScript objects. This design aims to eliminate GC overhead entirely during the active simulation phase.5

---

## **2\. bitECS Architecture: Data-Oriented Design in TypeScript**

### **2.1 The World as a Memory Arena**

The fundamental unit of bitECS is the "World." Unlike typical ECS implementations where the World is a container of objects, the bitECS World is essentially a configuration of TypedArray buffers. When createWorld() is invoked, the library pre-allocates memory based on the defined capacity.5

This pre-allocation is critical. JavaScript arrays are dynamic; they grow by allocating new storage and copying elements, an $O(n)$ operation. In a real-time simulation, an array resize during a frame update is catastrophic. bitECS forces the architect to define the maximum entity count upfront (or accept specific resizing penalties). This aligns with systems programming practices where memory footprints are deterministic.

**Table 1: Memory Layout Comparison**

| Feature | Standard OOP (AoS) | bitECS (SoA) | Implications |
| :---- | :---- | :---- | :---- |
| **Storage Unit** | Object Instances on Heap | TypedArray (Binary Buffer) | SoA allows SIMD-like processing and cache locality. |
| **Access Pattern** | Pointer chasing (References) | Direct Integer Indexing | Indexing avoids pointer overhead and memory indirection. |
| **Allocation** | Dynamic (per Entity) | Static (Pre-allocated) | Zero GC pressure during runtime. |
| **Data Locality** | Low (Scattered) | High (Contiguous) | Maximizes CPU cache hit rate. |

### **2.2 The Component Schema and Structure of Arrays (SoA)**

bitECS defines components not as classes, but as schemas—pure data descriptions. A component definition const Position \= defineComponent({ x: Types.f32, y: Types.f32 }) instructs the library to allocate two separate Float32Array buffers: one for x values and one for y values.6

This is the "Structure of Arrays" (SoA) layout. If the simulation has 100,000 entities, Position.x is a contiguous block of 400KB (100k \* 4 bytes). A "Movement System" that reads velocity and updates position traverses these arrays linearly. The CPU prefetcher can detect this sequential access pattern and pull upcoming data into the cache before it is requested, achieving near-theoretical maximum memory bandwidth.3

### **2.3 The Entity as a Cursor**

In bitECS, an "Entity" does not exist as a data structure. It is strictly an integer ID—a cursor. This ID is an index into the component arrays. Position.x retrieves the data.

This design decouples identity from data. The addEntity(world) function pulls an ID from a recycling queue (a "free list"). When removeEntity(world, eid) is called, the ID is returned to the pool.7 The library maintains a generation count (often encoded in the upper bits of the ID or a separate array) to prevent "use-after-free" errors, where a system attempts to access data for an entity that has been destroyed and whose ID has been reassigned to a new entity.8

### **2.4 Sparse Sets vs. Archetypes**

Architecturally, ECS libraries generally fall into two categories: Archetype-based (like Unity ECS, Flecs) or Sparse Set-based (like EnTT). bitECS primarily utilizes a **Sparse Set** architecture for component storage but optimizes query iteration to mimic archetype speeds.

* **Sparse Storage:** Each component type has a sparse array (mapping Entity ID to a dense index) and a dense array (packing component data contiguously). This allows $O(1)$ addition and removal of components, which is often a bottleneck in archetype-based systems that require moving entities between tables when their composition changes.4  
* **Query Optimization:** While storage is sparse/dense, bitECS generates "lists" of entities for queries. These lists are maintained incrementally. When a component is added to an entity, bitECS checks if the entity now satisfies any queries and adds it to the relevant cached lists.5

---

## **3\. V8 Engine Internals and Optimization Strategies**

### **3.1 Hidden Classes and Monomorphism**

To extract maximum performance from TypeScript, developers must write code that is sympathetic to the V8 engine's optimization pipeline (TurboFan). V8 uses "Hidden Classes" (or Shapes) to optimize property access. Every object has a hidden class defining its memory layout.9

Monomorphic vs. Polymorphic Access:  
If a function update(p) is always passed an object with the same hidden class (e.g., {x, y}), V8 treats the access as "monomorphic" and compiles it into a direct memory offset read. If the function receives objects with different shapes (e.g., {x, y, z} vs {x, y}), it becomes "polymorphic," requiring expensive lookups. If it sees many shapes, it becomes "megamorphic" and falls back to slow dictionary lookups.10  
bitECS Advantage:  
bitECS bypasses this fragility entirely. Component data is stored in TypedArrays. Accessing Position.x\[i\] is strictly an array index operation on a Float32Array. The "shape" of the array never changes. This guarantees that component access remains on the "fast path" of the JIT compiler, immune to the de-optimization risks that plague object-based ECS implementations.11

### **3.2 Elements Kinds: The Hidden Performance Cliff**

V8 classifies arrays into "Elements Kinds" based on their content:

1. **PACKED\_SMI:** Contiguous Small Integers (fastest).  
2. **PACKED\_DOUBLE:** Contiguous Floats.  
3. **HOLEY\_SMI/DOUBLE:** Arrays with gaps (holes).  
4. **PACKED\_ELEMENTS:** Arrays with objects/mixed types.

Transitioning an array from PACKED\_SMI to PACKED\_DOUBLE (by adding a 1.5 to an integer array) or to HOLEY (by accessing an index out of bounds or initializing with new Array(n)) causes V8 to de-optimize any code relying on that array.12

Optimization Strategy:  
bitECS relies on TypedArrays, which are essentially raw binary views. They do not suffer from "Elements Kinds" transitions in the same way standard JS arrays do. However, boundary checks are still enforced. Accessing Position.x\[eid\] where eid is outside the buffer bounds will return undefined and de-optimize the call site.

* **Best Practice:** Always ensure entity IDs are within the world capacity.  
* **Best Practice:** Avoid Array.prototype methods (map, reduce) in critical loops; use standard for loops to avoid allocating iterator objects.13

### **3.3 Static Memory and GC Avoidance**

In a high-fidelity simulation, even small allocations (e.g., new Vector3(x, y, z)) inside a loop accumulate.

* **Object Pooling:** For necessary temporary objects (like math vectors), implement a pool. However, the bitECS philosophy encourages performing math directly on the component scalars (x, y) rather than wrapping them in objects, eliminating the need for pooling entirely.4  
* **Closures:** Be wary of defining functions inside the update loop, as this allocates closure scopes. Systems should be defined once and reused.

---

## **4\. Advanced Component Patterns and Relations**

### **4.1 Handling Non-Primitive Data (Strings and Arrays)**

TypedArrays can only store numbers. Storing strings (names) or dynamic arrays (inventory) requires indirection.

* **The "Proxy Index" Pattern:** Do not store the string in the component. Create a global NameStore (a standard JS array or Map). The bitECS component Name stores a single integer nameID. NameStore\] retrieves the string. This keeps the ECS memory tight and numeric while referencing external heap objects.14  
* **Serialization Implication:** When serializing the world, you must separately serialize these external stores and re-map the indices upon loading.

### **4.2 Implementing Entity Relationships (Graphs/Trees)**

Pure ECS is flat; it does not natively support hierarchies (Scene Graphs). Simulating a tank with a rotating turret requires a parent-child relationship.

* **Linked Lists in SoA:** Storing a dynamic array of children IDs in a component violates the fixed-size memory model. The solution is to model a linked list using component arrays: FirstChild, NextSibling, and PreviousSibling components.  
  * To find a tank's children, the system looks at FirstChild.  
  * It then iterates through NextSibling until the end of the chain.  
  * This allows representing complex trees without any dynamic memory allocation.5

### **4.3 Tag Components and Bitmasks**

Tag Components are components with no data (empty schema). They act as boolean flags (IsFrozen, IsEnemy).

* **Implementation:** bitECS likely uses internal bitmasks. Adding a tag sets a bit in the entity's signature.  
* **Performance:** Queries involving tags are exceptionally fast. The query engine performs a bitwise AND against the archetype signature. It does not need to load any component memory to verify the tag's presence. This makes Tags ideal for "broad phase" filtering (e.g., filtering out Dead entities before processing physics).15

### **4.4 The Changed Query Modifier**

Optimizing simulations often involves avoiding redundant work. If an entity hasn't moved, the Renderer shouldn't waste cycles updating its matrix.

* **Mechanism:** defineQuery(\[Changed(Position)\]). This modifier returns only entities where the Position component has been modified since the last clear.  
* **Implementation Details:** This usually requires a "shadow buffer" or dirty flags. Writing to the component updates the flag.  
* **Cost:** There is a memory overhead (shadow state) and a CPU overhead (checking flags). Use Changed for heavy operations (network sync, DOM updates) but avoid it for lightweight logic where the check is more expensive than the operation itself.16

---

## **5\. Reactive Systems and Query Lifecycle**

### **5.1 Reactive Lifecycle: enterQuery and exitQuery**

Standard systems run every frame. Reactive logic needs to run only on state transitions. bitECS provides enterQuery and exitQuery to handle entities entering or leaving a specific component configuration.16

**enterQuery:**

* **Usage:** Returns a list of entities that *just matched* the query this frame.  
* **Scenario:** When a Renderable component is added to an entity, the RenderSystem uses enterQuery to instantiate a Three.js mesh and add it to the Scene Graph.  
* **Mechanism:** bitECS tracks structural changes (added components) in a frame-local queue. enterQuery iterates this delta list.17

**exitQuery:**

* **Usage:** Returns entities that *stopped matching* the query (component removed or entity destroyed).  
* **Scenario:** When Renderable is removed (or the entity dies), exitQuery triggers the disposal of the Three.js mesh geometry and removal from the scene.  
* **Criticality:** Without exitQuery, external resources (meshes, audio handles, physics bodies) would leak, as the ECS does not automatically garbage collect external references.18

### **5.2 System Pipeline Design**

Systems in bitECS are typically functional closures (world) \=\> void. Complex simulations require a rigid execution order, known as a **Pipeline**.

* **Topological Sort:** Systems typically have dependencies. The PhysicsSystem must run before the CollisionSystem. The InputSystem must run first.  
* **The pipe Function:** bitECS provides a pipe utility to compose systems. const pipeline \= pipe(InputSystem, PhysicsSystem, RenderSystem).  
* **Phase Management:** For multithreading, systems might be grouped into "Phases" (e.g., SimulationPhase runs on Worker, RenderPhase runs on Main). The Pipeline orchestrates these phases.19

---

## **6\. Multithreading with Web Workers and SharedArrayBuffer**

### **6.1 The Single-Threaded Bottleneck**

In the browser, the Main Thread is shared by JavaScript execution, HTML parsing, CSS layout, and input handling. A heavy simulation (physics \+ logic for 10k entities) can block the Main Thread, causing UI freezes and jank. The solution is offloading the simulation to a Web Worker.

### **6.2 SharedArrayBuffer (SAB): The Enabler**

Historically, workers communicated via postMessage, which serializes (copies) data. For a 4MB world state, copying per frame is prohibitively slow. SharedArrayBuffer allows two threads (Main and Worker) to view the *same physical memory address*.

* **bitECS Integration:** When creating the world, the SharedArrayBuffer is passed as the backing store for the component TypedArrays.  
* **Zero-Copy Synchronization:** The Worker updates Position.x\[i\]. The Main Thread reads Position.x\[i\] immediately. No message passing is required for data access.20

### **6.3 Thread Safety and Atomics**

Concurrent access to shared memory introduces race conditions. If the Worker writes to a position while the Main Thread reads it, the Renderer might see a "torn" state (half-updated vector).

* **Atomics:** JavaScript provides Atomics.add, Atomics.store, Atomics.load for integer arrays. However, Float32Array does not support Atomics.  
* **Locking:** A "Spinlock" can be implemented using an Int32Array flag. The Worker acquires the lock, writes data, and releases. The Main Thread waits for the lock. However, locks destroy parallelism.  
* **Double Buffering (The Solution):**  
  * Maintain two copies of the data: Buffer A and Buffer B.  
  * **Frame N:** Worker writes to Buffer A. Main reads Buffer B.  
  * **Frame N+1:** Swap. Worker writes to Buffer B. Main reads Buffer A.  
  * **Triple Buffering:** Allows decoupling the Simulation Rate (e.g., 120Hz) from the Render Rate (60Hz). The Sim produces states continuously; the Renderer always grabs the most recent *completed* state.22

### **6.4 Case Study: The "Third Room" Engine**

The *Third Room* Metaverse engine demonstrates this architecture at scale.

* **Game Loop:** Runs entirely in a Web Worker.  
* **Main Thread:** Acts as a "dumb terminal," forwarding Input events (Keyboard/Mouse) into a Shared Ring Buffer to the Worker. It also runs the Renderer (Three.js), which reads the interpolation state from the SAB.  
* **Performance:** This architecture allows the simulation to sustain high tick rates even if the DOM/UI on the main thread is heavy, as the threads are decoupled.23

---

## **7\. The Simulation Loop: Time, Determinism, and Interpolation**

### **7.1 The "Spiral of Death" and Fixed Timesteps**

Simulation stability, especially physics, requires a fixed delta time (dt). Using the variable dt from requestAnimationFrame results in non-deterministic behavior (jumping higher on slow computers) and numerical instability (tunneling through walls).

The Accumulator Pattern:  
The standard industry solution is the "Fix Your Timestep" loop 24:

1. **Accumulator:** Store real time passed in an accumulator.  
2. **Fixed Update:** While accumulator \>= FIXED\_DT (e.g., 16.66ms), run the Simulation Step and subtract FIXED\_DT.  
3. **Panic Check:** If the accumulator grows too large (the computer is too slow to simulate), clamp it to avoid a "Spiral of Death" where the simulation loops infinitely trying to catch up.24

### **7.2 State Interpolation**

Since the Render loop runs at the monitor's refresh rate (V-Sync), the render time will rarely align perfectly with a physics step. Rendering the "current" physics state causes visual jitter (aliasing).

* Interpolation: The Renderer calculates alpha \= accumulator / FIXED\_DT. It blends the PreviousState and CurrentState:

  $$P\_{render} \= P\_{prev} \\times (1 \- \\alpha) \+ P\_{curr} \\times \\alpha$$  
* **Implementation:** This requires the ECS to store two copies of transform data (Position and PrevPosition). At the start of a Fixed Step, PrevPosition is overwritten with CurrentPosition.25

### **7.3 Handling Input in Fixed Steps**

Input events happen asynchronously on the Main Thread.

* **Input Buffer:** Inputs must be timestamped and stored in a queue.  
* **Processing:** The Simulation loop consumes inputs that occurred *before* the current simulation time.  
* **Prediction:** For networked games, Client-Side Prediction applies inputs immediately to the local simulation and then reconciles with the server state later (Rollback).26

---

## **8\. Serialization and Persistence Strategies**

### **8.1 Serialization for Save States and Networking**

One of the massive advantages of the bitECS memory model is trivial serialization.

* **Binary Snapshots:** Because the World is backed by contiguous ArrayBuffers, saving the game state is a simple memory copy: const snapshot \= new Uint8Array(worldBuffer).  
* **defineSerializer:** bitECS provides helpers to serialize specific components. const serialize \= defineSerializer(world, \[Position, Velocity\]). This creates a function that efficiently packs the relevant component data into a buffer, ignoring unrelated data (like local UI state).27

### **8.2 Delta Compression**

Sending the full world state over the network is bandwidth-intensive.

* **Changed Query:** Use defineQuery(\[Changed(Position)\]) to identify only entities that moved.  
* **Delta Packet:** Construct a packet containing only \`\` for the changed entities.  
* **Quantization:** Compress floats to integers (e.g., store position as millimeters in Int16 instead of meters in Float32) to reduce packet size by 50%.26

---

## **9\. Integration Strategies: Rendering and Physics**

### **9.1 The "Shadow Object" Rendering Pattern**

Rendering engines like Three.js rely on heavy class instances (THREE.Mesh). These cannot exist inside the ECS data buffers.

* **Shadowing:** Create a system that maintains a mapping Map\<EntityID, THREE.Mesh\>.  
* **Synchronization:** The RenderSystem iterates over entities with Position and Renderable components. It copies the ECS data to the Three.js object:  
  TypeScript  
  mesh.position.x \= Position.x\[eid\];  
  mesh.position.y \= Position.y\[eid\];

* **Optimization:** Set mesh.matrixAutoUpdate \= false and update the matrix world manually if you can calculate the matrix faster than Three.js (e.g., using a WASM math library).28

### **9.2 Instanced Rendering for Massive Crowds**

For 10,000+ entities, creating individual THREE.Mesh objects is too slow (Draw Call overhead).

* **InstancedMesh:** Use THREE.InstancedMesh which draws one geometry N times.  
* **Direct Buffer Mapping:** Advanced users can map the bitECS Position/Rotation buffers *directly* to the InstancedMesh attribute buffers (using THREE.InstancedBufferAttribute). This eliminates the CPU copy step entirely. The ECS writes to the buffer, and the GPU reads from it during the draw call. This is the key to rendering 100k+ entities at 60Hz.28

### **9.3 Physics Integration (Rapier/Cannon)**

Physics engines often maintain their own internal world state.

* **Sync Loop:**  
  1. **ECS \-\> Physics:** Copy kinematic bodies (player controlled) from ECS to Physics engine.  
  2. **Step:** Run PhysicsWorld.step(dt).  
  3. **Physics \-\> ECS:** Copy dynamic bodies (bouncing balls) from Physics engine back to ECS Position components.  
* **Rapier (WASM):** Rapier allows accessing its memory buffer. It is theoretically possible to align the bitECS component buffer with the Rapier rigid body buffer, achieving zero-copy physics, though this requires precise memory alignment management.26

---

## **10\. Conclusion and Future Outlook**

bitECS represents the maturation of the JavaScript ecosystem for high-performance computing. It proves that by abandoning the ergonomic comforts of Object-Oriented Programming and embracing the rigorous constraints of Data-Oriented Design, developers can achieve performance characteristics previously reserved for C++ or Rust.

The integration of **SharedArrayBuffer** for multithreading and **SoA memory layouts** for cache locality provides a robust foundation for the next generation of web applications. As WebGPU matures, the ability to map bitECS data buffers directly to GPU compute shaders will likely open new frontiers in client-side simulation, allowing millions of entities to be simulated and rendered in the browser.

For the software architect, the choice is clear: for simulations exceeding a few thousand entities, the "Array of Objects" model is obsolete. The future is typed, contiguous, and parallel.

---

### **References**

* 5 bitECS Repository & Documentation  
* 3 sim-ecs Documentation & Concepts  
* 28 bitECS Component Relations & Optimization  
* 15 Tag Components Best Practices  
* 14 bitECS Component Relations Example  
* 20 Flutter/Web SharedArrayBuffer Discussions  
* 12 V8 Elements Kinds Analysis  
* 11 Node.js Array Optimizations  
* 9 V8 JIT Interactions  
* 2 Game Programming Patterns: Data Locality  
* 4 Cache Efficient ECS Design  
* 13 MDN Performance Optimization  
* 10 Monomorphic JavaScript  
* 24 Game Loop & Fixed Timestep Implementation  
* 29 Fixed Timestep Implementation  
* 30 Fixed Timestep without Interpolation  
* 1 ECS FAQ & Design Patterns  
* 5 bitECS Advanced Tutorial  
* 12 V8 Array Optimization Techniques  
* 11 V8 Elements Kinds Deep Dive  
* 31 V8 Elements Kinds  
* 32 V8 Optimization with TypedArrays  
* 21 Shared Memory Objects Library  
* 33 SharedArrayBuffer Memory Management  
* 34 Mastering SharedArrayBuffer and Atomics  
* 25 Interpolation in Fixed Time Step  
* 24 TypeScript Game Loop  
* 35 Interpolation Render Rate  
* 36 Multi-threaded React WebGL  
* 5 bitECS Features List  
* 7 bitECS Pull Requests  
* 37 ECS Deep Dive & Reactive Systems  
* 6 Testing bitECS  
* 16 bitECS TypeScript Example  
* 17 bitECS Reactive Query Example  
* 19 Quecs Multithreading  
* 18 bitECS Issue on Removal  
* 22 Third Room Discussions  
* 26 Third Room SharedArrayBuffer Usage  
* 5 bitECS createWorld Options  
* 27 bitECS Serialization Issues  
* 23 Third Room Engine

#### **Works cited**

1. SanderMertens/ecs-faq: Frequently asked questions about Entity Component Systems, accessed December 1, 2025, [https://github.com/SanderMertens/ecs-faq](https://github.com/SanderMertens/ecs-faq)  
2. Data Locality · Optimization Patterns, accessed December 1, 2025, [https://gameprogrammingpatterns.com/data-locality.html](https://gameprogrammingpatterns.com/data-locality.html)  
3. sim-ecs \- v0.6.5 \- GitHub Pages, accessed December 1, 2025, [https://nsstc.github.io/sim-ecs/](https://nsstc.github.io/sim-ecs/)  
4. How do you design a cache-efficient ECS for web games? \- Wild.Codes, accessed December 1, 2025, [https://wild.codes/candidate-toolkit-question/how-do-you-design-a-cache-efficient-ecs-for-web-games](https://wild.codes/candidate-toolkit-question/how-do-you-design-a-cache-efficient-ecs-for-web-games)  
5. NateTheGreatt/bitECS: Flexible, minimal, data-oriented ECS library for Typescript \- GitHub, accessed December 1, 2025, [https://github.com/NateTheGreatt/bitECS](https://github.com/NateTheGreatt/bitECS)  
6. Testing, bitECS / Andrew Wooldridge \- Observable, accessed December 1, 2025, [https://observablehq.com/@triptych/testing-bitecs](https://observablehq.com/@triptych/testing-bitecs)  
7. Pull requests · NateTheGreatt/bitECS \- GitHub, accessed December 1, 2025, [https://github.com/NateTheGreatt/bitECS/pulls](https://github.com/NateTheGreatt/bitECS/pulls)  
8. Tag components | Entities | 1.1.0-pre.3 \- Unity \- Manual, accessed December 1, 2025, [https://docs.unity3d.com/Packages/com.unity.entities@1.1/manual/components-tag.html](https://docs.unity3d.com/Packages/com.unity.entities@1.1/manual/components-tag.html)  
9. Unlocking Node.js Performance Through Smarter V8 JIT Interactions | Leapcell, accessed December 1, 2025, [https://leapcell.io/blog/unlocking-node-js-performance-through-smarter-v8-jit-interactions](https://leapcell.io/blog/unlocking-node-js-performance-through-smarter-v8-jit-interactions)  
10. Understanding Monomorphism to Improve Your JS Performance up to 60x \- Builder.io, accessed December 1, 2025, [https://www.builder.io/blog/monomorphic-javascript](https://www.builder.io/blog/monomorphic-javascript)  
11. Node.js Top 1% Engineer: Array optimizations | by Peter K \- Medium, accessed December 1, 2025, [https://medium.com/@pkulcsarsz/node-js-top-1-engineer-array-optimizations-c952b496b1c6](https://medium.com/@pkulcsarsz/node-js-top-1-engineer-array-optimizations-c952b496b1c6)  
12. Be aware of Arrays \- V8 engine advice \- DEV Community, accessed December 1, 2025, [https://dev.to/alirezaebrahimkhani/be-careful-about-arrays-v8-engine-advice-1pmk](https://dev.to/alirezaebrahimkhani/be-careful-about-arrays-v8-engine-advice-1pmk)  
13. JavaScript performance optimization \- Learn web development | MDN, accessed December 1, 2025, [https://developer.mozilla.org/en-US/docs/Learn\_web\_development/Extensions/Performance/JavaScript](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/JavaScript)  
14. Building an ECS in TypeScript: Deeper Dive: Components \- Maxwell Forbes, accessed December 1, 2025, [https://maxwellforbes.com/posts/typescript-ecs-components/](https://maxwellforbes.com/posts/typescript-ecs-components/)  
15. Entity/Component/System Tag Cleanup \- Game Development Meta \- Stack Exchange, accessed December 1, 2025, [https://gamedev.meta.stackexchange.com/questions/2787/entity-component-system-tag-cleanup](https://gamedev.meta.stackexchange.com/questions/2787/entity-component-system-tag-cleanup)  
16. Typescript Ecs Scene \- StackBlitz, accessed December 1, 2025, [https://stackblitz.com/edit/typescript-ecs-scene](https://stackblitz.com/edit/typescript-ecs-scene)  
17. hubs/src/bit-systems/audio-target-system.ts · main · Luy Seiwert / Hubs \- Sign in · GitLab, accessed December 1, 2025, [https://projects.cispa.uni-saarland.de/c02luse/hubs/-/blob/main/hubs/src/bit-systems/audio-target-system.ts](https://projects.cispa.uni-saarland.de/c02luse/hubs/-/blob/main/hubs/src/bit-systems/audio-target-system.ts)  
18. How to handle destroyed entities cleanup in central ... \- GitHub, accessed December 1, 2025, [https://github.com/NateTheGreatt/bitECS/issues/99](https://github.com/NateTheGreatt/bitECS/issues/99)  
19. NicholasHallman/quecs: An entity component system for JavaScript built on shared array buffers \- GitHub, accessed December 1, 2025, [https://github.com/NicholasHallman/quecs](https://github.com/NicholasHallman/quecs)  
20. \[web\] better document the value of multi-threaded rendering; provide examples in the cookbook · Issue \#153760 · flutter/flutter \- GitHub, accessed December 1, 2025, [https://github.com/flutter/flutter/issues/153760](https://github.com/flutter/flutter/issues/153760)  
21. @daneren2005/shared-memory-objects \- NPM, accessed December 1, 2025, [https://www.npmjs.com/package/@daneren2005/shared-memory-objects](https://www.npmjs.com/package/@daneren2005/shared-memory-objects)  
22. Third Room Development Update 4-25-2022 · matrix-org thirdroom · Discussion \#47, accessed December 1, 2025, [https://github.com/matrix-org/thirdroom/discussions/47](https://github.com/matrix-org/thirdroom/discussions/47)  
23. matrix-org/thirdroom: Open, decentralised, immersive worlds built on Matrix \- GitHub, accessed December 1, 2025, [https://github.com/matrix-org/thirdroom](https://github.com/matrix-org/thirdroom)  
24. Building a Professional Game Loop in TypeScript: From Basic to Advanced Implementation, accessed December 1, 2025, [https://dev.to/stormsidali2001/building-a-professional-game-loop-in-typescript-from-basic-to-advanced-implementation-eo8](https://dev.to/stormsidali2001/building-a-professional-game-loop-in-typescript-from-basic-to-advanced-implementation-eo8)  
25. Why use interpolation in fixed time step game loop? : r/gamedev \- Reddit, accessed December 1, 2025, [https://www.reddit.com/r/gamedev/comments/t1uxzb/why\_use\_interpolation\_in\_fixed\_time\_step\_game\_loop/](https://www.reddit.com/r/gamedev/comments/t1uxzb/why_use_interpolation_in_fixed_time_step_game_loop/)  
26. Matrix: Third Room Tech Preview \[video\] \- Hacker News, accessed December 1, 2025, [https://news.ycombinator.com/item?id=33013700](https://news.ycombinator.com/item?id=33013700)  
27. Using serialization for saving and loading · Issue \#67 · NateTheGreatt/bitECS \- GitHub, accessed December 1, 2025, [https://github.com/NateTheGreatt/bitECS/issues/67](https://github.com/NateTheGreatt/bitECS/issues/67)  
28. TypeScript ECS Game: From 20 NPCs to 10,000 \- Joseph O'Dowd, accessed December 1, 2025, [https://www.josephodowd.com/blog/8](https://www.josephodowd.com/blog/8)  
29. Fixed timestep game loop, why interpolation \- Game Development Stack Exchange, accessed December 1, 2025, [https://gamedev.stackexchange.com/questions/187660/fixed-timestep-game-loop-why-interpolation](https://gamedev.stackexchange.com/questions/187660/fixed-timestep-game-loop-why-interpolation)  
30. Fixed timestep without interpolation | Jakub's tech blog, accessed December 1, 2025, [https://jakubtomsu.github.io/posts/fixed\_timestep\_without\_interpolation/](https://jakubtomsu.github.io/posts/fixed_timestep_without_interpolation/)  
31. Elements kinds in V8, accessed December 1, 2025, [https://v8.dev/blog/elements-kinds](https://v8.dev/blog/elements-kinds)  
32. V8 Engine Secrets Slashed Memory Usage by 66% with TypedArrays \- DEV Community, accessed December 1, 2025, [https://dev.to/asadk/v8-engine-secrets-how-we-slashed-memory-usage-by-66-with-typedarrays-g95](https://dev.to/asadk/v8-engine-secrets-how-we-slashed-memory-usage-by-66-with-typedarrays-g95)  
33. SharedArrayBuffer and Memory Management in JavaScript | by Artem Khrienov \- Medium, accessed December 1, 2025, [https://medium.com/@artemkhrenov/sharedarraybuffer-and-memory-management-in-javascript-06738cda8f51](https://medium.com/@artemkhrenov/sharedarraybuffer-and-memory-management-in-javascript-06738cda8f51)  
34. Conquer JavaScript Concurrency: SharedArrayBuffer & Atomics | Kite Metric, accessed December 1, 2025, [https://kitemetric.com/blogs/mastering-sharedarraybuffer-and-atomics-in-javascript](https://kitemetric.com/blogs/mastering-sharedarraybuffer-and-atomics-in-javascript)  
35. Interpolation when your render rate is higher than your physics rate : r/gamedev \- Reddit, accessed December 1, 2025, [https://www.reddit.com/r/gamedev/comments/vl5xj0/interpolation\_when\_your\_render\_rate\_is\_higher/](https://www.reddit.com/r/gamedev/comments/vl5xj0/interpolation_when_your_render_rate_is_higher/)  
36. Multi-threaded React WebGL Applications – Blog | SABO Mobile IT, accessed December 1, 2025, [https://www.saboit.de/blog/multi-threaded-react-webgl-applications](https://www.saboit.de/blog/multi-threaded-react-webgl-applications)  
37. ECS Deep Dive \- Rams3s Blog, accessed December 1, 2025, [https://rams3s.github.io/blog/2019-01-09-ecs-deep-dive/](https://rams3s.github.io/blog/2019-01-09-ecs-deep-dive/)