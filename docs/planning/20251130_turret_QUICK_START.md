# Quick Start - How to Play

## Objective

Defend the **Kobayashi Maru** (the ship in the center) from endless waves of enemy ships.

## Controls

### Turret Placement
1. **Click** a turret button on the right side
2. **Move mouse** to position the turret
3. **Click** to place (or **ESC** to cancel)

### Debug
- **`** (backtick key) - Toggle debug overlay

## Game Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  WAVE 1          [Game Area]              MATTER             │
│  SPAWNING                                  500               │
│  Enemies: 10                                                 │
│                                          ┌─────────────────┐ │
│                                          │ Phaser Array    │ │
│                                          │ 100 M           │ │
│                                          └─────────────────┘ │
│                                          ┌─────────────────┐ │
│                  ⭐ Kobayashi Maru       │ Torpedo Launch  │ │
│                                          │ 200 M           │ │
│                                          └─────────────────┘ │
│                                          ┌─────────────────┐ │
│                                          │ Disruptor Bank  │ │
│                                          │ 150 M           │ │
│                                          └─────────────────┘ │
│                                                               │
│  TIME: 00:30                KOBAYASHI MARU STATUS            │
│  KILLS: 5                   SHLD ████████░░ 80%              │
│                             HULL ██████████ 100%             │
│                                                    TURRETS: 3 │
└─────────────────────────────────────────────────────────────┘
```

## Turret Types

### 🔵 Phaser Array (100 Matter)
- **Best for**: Early game, swarms
- **Fire rate**: Fast (4/sec)
- **Damage**: Low (10)
- **Range**: Medium (200px)

### 🔴 Torpedo Launcher (200 Matter)
- **Best for**: Tough enemies, late game
- **Fire rate**: Slow (0.5/sec)
- **Damage**: High (50)
- **Range**: Long (350px)

### 🟢 Disruptor Bank (150 Matter)
- **Best for**: Balanced defense
- **Fire rate**: Medium (2/sec)
- **Damage**: Medium (15)
- **Range**: Medium (250px)

## Strategy Tips

### Early Game (Waves 1-3)
1. **Place 2-3 Phaser Arrays** around the Kobayashi Maru
2. **Create overlapping fields** of fire
3. **Save resources** for later waves

### Mid Game (Waves 4-7)
1. **Add Disruptor Banks** for balanced coverage
2. **Upgrade to Torpedo Launchers** for tough enemies
3. **Fill gaps** in your defense

### Late Game (Waves 8+)
1. **Focus on Torpedo Launchers** for high damage
2. **Maximize coverage** with overlapping ranges
3. **Protect your turrets** by placing them strategically

## Placement Tips

### ✅ Good Placement
- **Near the center** - Protect the Kobayashi Maru
- **Overlapping ranges** - Multiple turrets covering same area
- **Spread out** - Cover all approach angles
- **Mix turret types** - Fast + slow fire rates

### ❌ Bad Placement
- **Too far from center** - Enemies reach Kobayashi Maru
- **Too close together** - Wasted coverage
- **All same type** - Inefficient against varied enemies
- **At edges** - Limited coverage

## Resource Management

### Earning Resources
- **Defeat enemies** to earn Matter
- **Different enemies** give different amounts
- **Survive longer** = more resources

### Spending Resources
- **Start cheap** - Phaser Arrays first
- **Save for power** - Torpedo Launchers later
- **Don't overspend** - Keep reserve for emergencies

## Enemy Types

### 🔴 Klingon (Red Triangle)
- Medium health, medium speed
- Common in early waves

### 🟢 Romulan (Green Crescent)
- Lower health, higher shields
- Appears in mid waves

### 🟢 Borg (Green Square)
- High health, high shields
- Tough enemies, late waves

### 🟠 Tholian (Orange Diamond)
- Low health, fast speed
- Swarm tactics

### 🟣 Species 8472 (Purple Y-shape)
- Very high health, no shields
- Boss-level enemies

## Win Conditions

**There is no win condition** - this is an endless survival game!

### Goals
1. **Survive as long as possible**
2. **Reach the highest wave**
3. **Defeat the most enemies**
4. **Beat your high score**

## Game Over

The game ends when the **Kobayashi Maru is destroyed** (health reaches 0).

Your final score is based on:
- **Time survived**
- **Wave reached**
- **Enemies defeated**

## HUD Elements

### Top Left - Wave Info
- Current wave number
- Wave state (IDLE, SPAWNING, ACTIVE, COMPLETE)
- Active enemy count

### Top Right - Resources
- Current Matter amount
- Updates in real-time

### Bottom Left - Score
- Time survived (MM:SS)
- Total kills

### Bottom Center - Kobayashi Maru Status
- Shield bar (blue)
- Health bar (green/red)
- Changes to red when critical

### Bottom Right - Turret Count
- Number of placed turrets

### Right Side - Turret Menu
- Turret selection buttons
- Shows name and cost
- Grays out when unaffordable

## Troubleshooting

### "I can't place turrets"
- Check if you have enough resources (top-right)
- Make sure you're not too close to other turrets
- Stay away from screen edges

### "Turrets aren't shooting"
- Enemies must be within range (shown during placement)
- Turrets only target enemy ships
- Wait for turrets to acquire targets

### "I'm running out of resources"
- Defeat more enemies to earn Matter
- Use cheaper turrets (Phaser Arrays)
- Don't place too many turrets at once

### "Enemies are getting through"
- Add more turrets near the center
- Create overlapping fields of fire
- Use Torpedo Launchers for tough enemies

## Advanced Tactics

### Chokepoint Defense
Place turrets to create "kill zones" where multiple turrets can fire at the same enemies.

### Range Optimization
Mix long-range (Torpedoes) and short-range (Phasers) for layered defense.

### Resource Efficiency
Calculate cost-per-DPS to find most efficient turret placements.

### Adaptive Strategy
Watch enemy types and adjust turret placement accordingly.

## Keyboard Shortcuts

- **ESC** - Cancel turret placement
- **`** - Toggle debug overlay (FPS, entity count, etc.)

## Performance Tips

If the game is running slowly:
1. Close other browser tabs
2. Reduce browser zoom to 100%
3. Update your graphics drivers
4. Try a different browser (Chrome recommended)

## Getting Help

- Check `docs/TURRET_PLACEMENT_GUIDE.md` for detailed turret info
- Check `docs/TURRET_SYSTEM_SUMMARY.md` for technical details
- Check the debug overlay (backtick key) for performance stats

## Have Fun!

Remember: **The Kobayashi Maru scenario is a no-win situation**. The goal is to survive as long as possible and beat your high score!

Good luck, Captain! 🖖
