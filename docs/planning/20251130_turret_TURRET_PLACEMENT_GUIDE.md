# Turret Placement Guide

## How to Place Turrets

### UI Overview

The game now has **turret selection buttons** on the right side of the screen, below the resources display.

### Turret Types Available

1. **Phaser Array** - 100 Matter
   - Fast fire rate (4 shots/sec)
   - Low damage (10)
   - Medium range (200 pixels)
   - Good for swarms of weak enemies

2. **Torpedo Launcher** - 200 Matter
   - Slow fire rate (0.5 shots/sec)
   - High damage (50)
   - Long range (350 pixels)
   - Good for tough enemies

3. **Disruptor Bank** - 150 Matter
   - Medium fire rate (2 shots/sec)
   - Medium damage (15)
   - Medium range (250 pixels)
   - Balanced option

### Placement Steps

1. **Click a turret button** on the right side of the screen
   - Buttons show the turret name and cost
   - Buttons are disabled (grayed out) if you don't have enough resources
   - Buttons highlight on hover

2. **Preview appears**
   - A semi-transparent circle shows where the turret will be placed
   - A larger circle shows the turret's attack range
   - **Green** = valid placement location
   - **Red** = invalid placement (too close to another turret, out of bounds, or not enough resources)

3. **Move your mouse** to position the turret
   - The preview follows your cursor
   - The color changes based on validity

4. **Click to place**
   - Left-click to confirm placement
   - Resources are deducted automatically
   - Turret is created and will start targeting enemies

5. **Cancel placement**
   - Press **ESC** key to cancel
   - Right-click also cancels (on some browsers)

### Placement Rules

- **Minimum distance**: Turrets must be at least 64 pixels apart
- **Boundaries**: Turrets must be placed at least 32 pixels from the edge
- **Resources**: You must have enough Matter to afford the turret
- **No overlap**: Cannot place turrets on top of each other

### Tips

- **Start with Phaser Arrays** - They're cheap and effective against early waves
- **Place near the center** - Protect the Kobayashi Maru (center ship)
- **Create overlapping fields of fire** - Multiple turrets covering the same area
- **Save for Torpedo Launchers** - Great for later waves with tougher enemies
- **Watch your resources** - You earn Matter by defeating enemies

### Turret Behavior

Once placed, turrets will:
1. **Automatically detect** enemies within range
2. **Rotate** to face their target
3. **Fire** at their configured fire rate
4. **Switch targets** when current target is destroyed or out of range
5. **Prioritize** the closest enemy

### Resource Management

- **Starting resources**: 500 Matter
- **Earn resources**: Defeat enemies to gain more Matter
- **Resource display**: Top-right corner shows current Matter
- **Button colors**: Turret buttons gray out when you can't afford them

### Troubleshooting

**Q: I clicked a turret button but nothing happened**
- Check if you have enough resources (top-right display)
- The button should flash red if you can't afford it

**Q: The preview is always red**
- Try moving away from other turrets (64 pixel minimum distance)
- Stay away from the edges of the screen
- Make sure you have enough resources

**Q: How do I cancel placement?**
- Press the **ESC** key
- Or click another turret button to switch types

**Q: Turrets aren't shooting**
- Make sure enemies are within range (shown by the circle)
- Turrets only target enemy ships, not the Kobayashi Maru
- Check that the turret has line of sight

**Q: Can I remove or sell turrets?**
- Not yet implemented - choose placement carefully!

### Keyboard Shortcuts

- **ESC** - Cancel turret placement
- **`** (backtick) - Toggle debug overlay (shows FPS, entity count, etc.)

### Visual Indicators

- **Green circle** - Valid placement location
- **Red circle** - Invalid placement location
- **Outer circle** - Turret attack range
- **Inner circle** - Turret position
- **Beam effects** - Turrets firing at enemies

---

## Technical Details

### Components Involved

- **PlacementSystem** (`src/game/placementSystem.ts`) - Handles placement logic
- **TurretMenu** (`src/ui/TurretMenu.ts`) - UI buttons for turret selection
- **HUDManager** (`src/ui/HUDManager.ts`) - Integrates turret menu into HUD
- **Game** (`src/core/Game.ts`) - Connects menu to placement system

### Events

The PlacementSystem emits events:
- `start` - Placement mode started
- `cancel` - Placement mode cancelled
- `placed` - Turret successfully placed
- `invalid` - Attempted invalid placement

### Configuration

Turret stats are defined in `src/types/constants.ts`:
```typescript
export const TURRET_CONFIG = {
  [TurretType.PHASER_ARRAY]: {
    range: 200,
    fireRate: 4,
    damage: 10,
    cost: 100,
    health: 50,
    shield: 25,
    name: 'Phaser Array'
  },
  // ... other turrets
};
```

### Minimum Distance

Defined in `src/types/constants.ts`:
```typescript
export const GAME_CONFIG = {
  MIN_TURRET_DISTANCE: 64,  // Minimum distance between turrets
  // ...
};
```
