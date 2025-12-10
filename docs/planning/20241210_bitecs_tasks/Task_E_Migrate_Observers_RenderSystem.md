# Task E: Migrate renderSystem.ts Observers

**Goal:** Replace `enterQuery`/`exitQuery` with observer pattern in `src/systems/renderSystem.ts`.

**Prerequisites:** Task B (Components), Task C & D (Queries)

**Reference:**
- bitECS 0.4.0: `enterQuery`/`exitQuery` removed. Use `observe(world, onAdd(Components), callback)` and `onRemove`.

**Files:**
- `src/systems/renderSystem.ts`

**Steps:**
1. Update imports: Add `observe`, `onAdd`, `onRemove`. Remove `enterQuery`, `exitQuery`.
2. Refactor `createRenderSystem`:
   - It needs to accept `world` as a parameter to set up observers (or find a way to access it once). Note: `createRenderSystem` is likely called before the loop starts. If it returns the system function, it captures the scope.
   - **Crucial:** Ensure `world` is available when setting up observers. If `createRenderSystem` is called with `spriteManager` only, you might need to change its signature OR set up observers inside the system function on the *first run* (initialized flag).
   - *Better Approach:* Change signature to `createRenderSystem(world: IWorld, spriteManager: SpriteManager)`.

3. Use Queues for Entity Lifecycle:
   ```typescript
   const enteredEntities: number[] = [];
   const exitedEntities: number[] = [];
   const enteredComposite: number[] = [];
   const exitedComposite: number[] = [];

   // Setup observers
   observe(world, onAdd(Position, Faction, SpriteRef), (eid) => {
       enteredEntities.push(eid);
   });
   
   observe(world, onRemove(Position, Faction, SpriteRef), (eid) => {
       exitedEntities.push(eid);
   });
   // ... repeat for composite ...
   ```

4. Inside the returned system function:
   - Process `enteredEntities` (creation logic).
   - Clear queue: `enteredEntities.splice(0)`.
   - Process `exitedEntities` (removal logic).
   - Clear queue: `exitedEntities.splice(0)`.

5. Update `Game.ts` (the caller) to pass `world` to `createRenderSystem`.

**Verification:**
- No TypeScript errors.
- Sprites appear and disappear correctly when running the game.
