# Turret Upgrade System

The Kobayashi Maru game features a comprehensive turret upgrade system that allows players to enhance their defensive capabilities through strategic resource allocation.

## System Components

### 1. TurretUpgrade Component (`src/ecs/components.ts`)
Stores upgrade state for each turret entity:
- `damageLevel` (0-3): Weapon damage upgrades
- `rangeLevel` (0-3): Targeting range upgrades
- `fireRateLevel` (0-3): Fire rate upgrades
- `multiTargetLevel` (0-2): Multi-target capability
- `specialLevel` (0-3): Turret-specific special abilities

### 2. UpgradeManager (`src/game/UpgradeManager.ts`)
Handles upgrade logic and resource management:
- **getTurretInfo()**: Get complete turret upgrade information
- **canUpgrade()**: Check if an upgrade is available
- **applyUpgrade()**: Apply upgrade and deduct resources
- **sellTurret()**: Sell turret for 75% refund
- **getSellRefund()**: Calculate refund amount

### 3. TurretUpgradePanel (`src/ui/TurretUpgradePanel.ts`)
Interactive UI panel showing:
- Current turret stats (damage, range, fire rate, targets)
- Five upgrade paths with level indicators
- Cost per upgrade level
- Sell button with refund amount (75%)
- Visual affordance indicators (can afford, max level, etc.)

### 4. TurretUpgradeVisuals (`src/rendering/TurretUpgradeVisuals.ts`)
Visual feedback system that displays upgrade levels through glow effects:

#### Visual Upgrade Tiers:
- **No upgrades (Level 0)**: Default appearance, no glow
- **Low upgrades (1-3 levels)**: Blue glow (8px radius), 1.1x scale
- **Medium upgrades (4-7 levels)**: Cyan glow (12px radius), 1.2x scale
- **High upgrades (8-11 levels)**: Yellow glow (16px radius), 1.3x scale
- **Max upgrades (12+ levels)**: Golden glow (20px radius), 1.4x scale

## Upgrade Paths

### 1. Weapon Power (Damage)
- **Cost**: 50M → 100M → 200M
- **Bonus**: +25% → +50% → +100% damage
- **Max Level**: 3

### 2. Targeting Range
- **Cost**: 40M → 80M → 160M
- **Bonus**: +20% → +40% → +80% range
- **Max Level**: 3

### 3. Fire Rate
- **Cost**: 60M → 120M → 240M
- **Bonus**: +30% → +60% → +120% fire rate
- **Max Level**: 3

### 4. Multi-Target
- **Cost**: 150M → 300M
- **Effect**: Target 2 → 3 enemies simultaneously
- **Max Level**: 2

### 5. Special Ability
- **Cost**: 75M → 150M → 300M
- **Effect**: Turret-specific enhancements:
  - **Phaser Array**: Weapon disable, chain lightning
  - **Torpedo Launcher**: AOE explosions, armor penetration
  - **Disruptor Bank**: Shield drain, shield bypass
  - **Tetryon Beam**: Shield weakening, hull damage boost
  - **Plasma Cannon**: Enhanced burn damage and spread
  - **Polaron Beam**: Stronger slow, permanent debuffs
- **Max Level**: 3

## Usage

### Selecting and Upgrading Turrets
1. Click on any deployed turret to select it
2. The upgrade panel appears showing current stats
3. Click on any upgrade button to purchase (if affordable)
4. Visual glow effect appears/intensifies with upgrades
5. Click outside or on another turret to deselect

### Selling Turrets
1. Select the turret you want to sell
2. Click the "SELL TURRET" button in the upgrade panel
3. Receive 75% refund of total investment (base cost + all upgrades)
4. Turret is immediately removed from the map

## Strategic Considerations

### Resource Management
- Starting resources: 500M
- Resource per kill: 10M
- Upgrade costs increase exponentially
- Selling refunds 75% of total investment

### Upgrade Priorities
- **Early Game**: Focus on fire rate and multi-target for wave clearing
- **Mid Game**: Balance damage and range for better coverage
- **Late Game**: Max out special abilities for unique advantages
- **Boss Waves**: Prioritize damage upgrades on high-DPS turrets

### Turret Synergies
- **Phaser Arrays**: Max fire rate for rapid-fire suppression
- **Torpedo Launchers**: Max damage + special for devastating AOE
- **Disruptor Banks**: Multi-target + special for debuff spread
- **Polaron Beams**: Special upgrades create permanent slow zones

## Technical Implementation

### Integration Points
- Upgrade data stored in ECS components
- Visual effects rendered in glow layer
- UI updates on selection change
- Stats applied immediately via UpgradeManager
- Multi-target handled by targeting system
- Special abilities handled in combat/damage systems

### Performance
- Glow graphics use efficient Graphics API
- Visual updates only on level change (not every frame)
- Cleanup handled automatically for removed turrets
- No impact on entity rendering performance

## Testing
Comprehensive test coverage includes:
- `upgradeManager.test.ts`: Manager functionality (27 tests)
- `turretUpgradePanel.integration.test.ts`: UI integration (13 tests)
- `turretUpgradeVisuals.test.ts`: Visual system (17 tests)

Total: 57 tests covering the complete upgrade system
