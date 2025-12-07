# Enhancement Task 05: Turret Upgrade Visual & UI System

**Date:** 2025-12-07  
**Priority:** HIGH  
**Category:** Gameplay Feature  
**Estimated Effort:** 2-3 days  
**Dependencies:** None (upgrade config already exists)

---

## Objective

Implement a complete turret upgrade system with interactive UI panel, visual changes to upgraded turrets, stat comparison, and sell functionality to enhance strategic gameplay depth.

---

## Current State

**Upgrade Configuration**: `src/types/constants.ts` (lines 193-294)
- Upgrade paths defined: Damage, Range, Fire Rate, Multi-Target, Special
- 3 levels per path (2 for Multi-Target)
- Costs and bonuses configured
- Special abilities per turret type defined

**Missing**:
- No UI to access upgrades
- No visual indication of upgrade level
- No way to sell turrets
- Upgrades not applied to turret stats
- No test coverage for upgrades

---

## Proposed Implementation

### 1. Turret Upgrade Component

**Goal**: Store upgrade state in ECS

```typescript
// Add to src/ecs/components.ts

/**
 * TurretUpgrade component - tracks upgrade levels for each turret
 */
export const TurretUpgrade = defineComponent({
    damageLevel: Types.ui8,        // 0-3
    rangeLevel: Types.ui8,         // 0-3
    fireRateLevel: Types.ui8,      // 0-3
    multiTargetLevel: Types.ui8,   // 0-2
    specialLevel: Types.ui8,       // 0-3
    totalInvested: Types.ui16      // Total resources spent
});
```

### 2. Upgrade Manager Enhancement

**Location**: `src/game/UpgradeManager.ts` (already exists)

**Current Interface**:
```typescript
export class UpgradeManager {
    canUpgrade(entity: number, path: UpgradePathId): boolean;
    getUpgradeCost(entity: number, path: UpgradePathId): number;
    applyUpgrade(entity: number, path: UpgradePathId): boolean;
    getUpgradeLevel(entity: number, path: UpgradePathId): number;
}
```

**Enhancements Needed**:
```typescript
export class UpgradeManager {
    // Existing methods...
    
    /**
     * Get total value of turret (for sell price calculation)
     */
    getTurretValue(entity: number): number {
        const turretType = Turret.turretType[entity];
        const baseValue = TURRET_CONFIG[turretType].cost;
        const upgradeValue = TurretUpgrade.totalInvested[entity];
        return baseValue + upgradeValue;
    }
    
    /**
     * Calculate sell price (75% of total value)
     */
    getSellPrice(entity: number): number {
        return Math.floor(this.getTurretValue(entity) * TURRET_SELL_REFUND_PERCENT);
    }
    
    /**
     * Get stat preview with upgrade applied
     */
    getUpgradePreview(entity: number, path: UpgradePathId): TurretStats {
        const current = this.getCurrentStats(entity);
        const upgraded = { ...current };
        
        const level = this.getUpgradeLevel(entity, path);
        const config = UPGRADE_CONFIG[path];
        
        switch (path) {
            case UpgradePath.DAMAGE:
                upgraded.damage *= 1 + config.bonusPercent[level] / 100;
                break;
            case UpgradePath.RANGE:
                upgraded.range *= 1 + config.bonusPercent[level] / 100;
                break;
            case UpgradePath.FIRE_RATE:
                upgraded.fireRate *= 1 + config.bonusPercent[level] / 100;
                break;
            case UpgradePath.MULTI_TARGET:
                upgraded.targets = config.targets[level];
                break;
        }
        
        return upgraded;
    }
    
    /**
     * Get stats breakdown for UI display
     */
    getCurrentStats(entity: number): TurretStats {
        return {
            damage: Turret.damage[entity],
            range: Turret.range[entity],
            fireRate: Turret.fireRate[entity],
            targets: this.getActiveTargetCount(entity)
        };
    }
}
```

### 3. Upgrade Panel UI

**Location**: `src/ui/TurretUpgradePanel.ts` (already exists)

**Enhanced Implementation**:

```typescript
export class TurretUpgradePanel {
    private container: Container;
    private selectedTurret: number | null = null;
    private upgradeButtons: Map<UpgradePathId, Container> = new Map();
    private sellButton: Container;
    private statsDisplay: Container;
    
    /**
     * Show upgrade panel for selected turret
     */
    show(turretEntity: number, x: number, y: number): void {
        this.selectedTurret = turretEntity;
        this.container.visible = true;
        this.container.position.set(x, y);
        
        this.updatePanel();
    }
    
    /**
     * Update panel with current turret stats
     */
    private updatePanel(): void {
        if (!this.selectedTurret) return;
        
        // Update stats display
        this.updateStatsDisplay();
        
        // Update upgrade buttons
        this.updateUpgradeButtons();
        
        // Update sell button
        this.updateSellButton();
    }
    
    /**
     * Create stats comparison display
     */
    private updateStatsDisplay(): void {
        this.statsDisplay.removeChildren();
        
        const stats = this.upgradeManager.getCurrentStats(this.selectedTurret!);
        const turretType = Turret.turretType[this.selectedTurret!];
        const config = TURRET_CONFIG[turretType];
        
        // Turret name and type
        const title = new Text({
            text: config.name,
            style: { fontSize: 18, fill: 0xFF9900, fontWeight: 'bold' }
        });
        this.statsDisplay.addChild(title);
        
        // Current stats
        const statsList = [
            `Damage: ${stats.damage.toFixed(1)} DPS`,
            `Range: ${stats.range.toFixed(0)}`,
            `Fire Rate: ${stats.fireRate.toFixed(2)}/s`,
            `Targets: ${stats.targets}`
        ];
        
        statsList.forEach((stat, i) => {
            const text = new Text({
                text: stat,
                style: { fontSize: 12, fill: 0xCCCCCC }
            });
            text.position.set(0, 30 + i * 20);
            this.statsDisplay.addChild(text);
        });
    }
    
    /**
     * Create upgrade buttons with level indicators
     */
    private createUpgradeButton(path: UpgradePathId, y: number): Container {
        const button = new Container();
        button.position.set(0, y);
        
        const config = UPGRADE_CONFIG[path];
        const currentLevel = this.upgradeManager.getUpgradeLevel(this.selectedTurret!, path);
        const cost = this.upgradeManager.getUpgradeCost(this.selectedTurret!, path);
        const canAfford = this.resourceManager.getResources() >= cost;
        const isMaxLevel = currentLevel >= config.maxLevel;
        
        // Background
        const bg = new Graphics();
        bg.roundRect(0, 0, 280, 60, 4);
        bg.fill({ 
            color: isMaxLevel ? 0x444444 : (canAfford ? 0x003366 : 0x331100),
            alpha: 0.8 
        });
        bg.stroke({ 
            color: isMaxLevel ? 0x666666 : (canAfford ? 0x0099FF : 0x663300),
            width: 2 
        });
        button.addChild(bg);
        
        // Upgrade name
        const name = new Text({
            text: config.name,
            style: { fontSize: 14, fill: 0xFF9900, fontWeight: 'bold' }
        });
        name.position.set(10, 8);
        button.addChild(name);
        
        // Level indicators (dots)
        for (let i = 0; i < config.maxLevel; i++) {
            const dot = new Graphics();
            const filled = i < currentLevel;
            dot.circle(0, 0, 4);
            if (filled) {
                dot.fill({ color: 0x00FF00 });
            } else {
                dot.stroke({ color: 0x666666, width: 1 });
            }
            dot.position.set(200 + i * 15, 15);
            button.addChild(dot);
        }
        
        // Description
        const desc = new Text({
            text: isMaxLevel ? 'MAX LEVEL' : config.description,
            style: { fontSize: 10, fill: 0x999999 }
        });
        desc.position.set(10, 28);
        button.addChild(desc);
        
        // Cost
        if (!isMaxLevel) {
            const costText = new Text({
                text: `${cost} Matter`,
                style: { 
                    fontSize: 11, 
                    fill: canAfford ? 0xFFFF00 : 0xFF6666,
                    fontWeight: 'bold'
                }
            });
            costText.position.set(10, 44);
            button.addChild(costText);
            
            // Preview stats
            const preview = this.upgradeManager.getUpgradePreview(this.selectedTurret!, path);
            const previewText = this.getPreviewText(path, preview);
            const previewLabel = new Text({
                text: `→ ${previewText}`,
                style: { fontSize: 10, fill: 0x00FF88 }
            });
            previewLabel.position.set(120, 44);
            button.addChild(previewLabel);
        }
        
        // Make interactive
        bg.eventMode = 'static';
        bg.cursor = isMaxLevel ? 'default' : (canAfford ? 'pointer' : 'not-allowed');
        
        if (!isMaxLevel && canAfford) {
            bg.on('pointerdown', () => this.handleUpgrade(path));
        }
        
        return button;
    }
    
    /**
     * Get preview text for upgrade
     */
    private getPreviewText(path: UpgradePathId, preview: TurretStats): string {
        switch (path) {
            case UpgradePath.DAMAGE:
                return `${preview.damage.toFixed(1)} DMG`;
            case UpgradePath.RANGE:
                return `${preview.range.toFixed(0)} RNG`;
            case UpgradePath.FIRE_RATE:
                return `${preview.fireRate.toFixed(2)}/s`;
            case UpgradePath.MULTI_TARGET:
                return `${preview.targets} targets`;
            default:
                return 'Upgraded';
        }
    }
    
    /**
     * Handle upgrade button click
     */
    private handleUpgrade(path: UpgradePathId): void {
        if (!this.selectedTurret) return;
        
        const success = this.upgradeManager.applyUpgrade(this.selectedTurret, path);
        
        if (success) {
            // Play upgrade sound
            this.audioManager.play('upgrade');
            
            // Visual feedback on turret
            this.showUpgradeEffect(this.selectedTurret);
            
            // Refresh panel
            this.updatePanel();
        }
    }
    
    /**
     * Show visual effect on turret when upgraded
     */
    private showUpgradeEffect(entity: number): void {
        const x = Position.x[entity];
        const y = Position.y[entity];
        
        // Spawn upgrade particles
        this.particleSystem.spawn({
            x, y,
            count: 30,
            speed: { min: 50, max: 150 },
            life: { min: 0.5, max: 1.0 },
            size: { min: 3, max: 8 },
            colorGradient: {
                stops: [
                    { time: 0, color: 0xFFFF00, alpha: 1.0 },
                    { time: 0.5, color: 0x00FF88, alpha: 0.8 },
                    { time: 1.0, color: 0x00CCFF, alpha: 0.0 }
                ]
            },
            spread: Math.PI * 2,
            emitterPattern: 'ring'
        });
        
        // Flash turret sprite
        this.renderSystem.flashSprite(entity, 0xFFFF00, 0.3);
    }
    
    /**
     * Create sell button
     */
    private createSellButton(): Container {
        const button = new Container();
        
        const bg = new Graphics();
        bg.roundRect(0, 0, 280, 40, 4);
        bg.fill({ color: 0x660000, alpha: 0.8 });
        bg.stroke({ color: 0xFF3333, width: 2 });
        button.addChild(bg);
        
        const sellPrice = this.upgradeManager.getSellPrice(this.selectedTurret!);
        
        const text = new Text({
            text: `SELL TURRET - Refund ${sellPrice} Matter`,
            style: { fontSize: 12, fill: 0xFFAAAA, fontWeight: 'bold' }
        });
        text.anchor.set(0.5);
        text.position.set(140, 20);
        button.addChild(text);
        
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        bg.on('pointerdown', () => this.handleSell());
        
        return button;
    }
    
    /**
     * Handle sell button click
     */
    private handleSell(): void {
        if (!this.selectedTurret) return;
        
        const sellPrice = this.upgradeManager.getSellPrice(this.selectedTurret);
        
        // Confirm sell
        if (confirm(`Sell turret for ${sellPrice} Matter?`)) {
            // Refund resources
            this.resourceManager.addResources(sellPrice);
            
            // Destroy turret
            this.entityFactory.destroyTurret(this.selectedTurret);
            
            // Play sell sound
            this.audioManager.play('sell');
            
            // Hide panel
            this.hide();
        }
    }
}
```

### 4. Visual Indicators on Turrets

**Goal**: Show upgrade level on turret sprites

```typescript
// Add to src/rendering/RenderingSystem.ts

class RenderingSystem {
    /**
     * Render upgrade level indicators on turrets
     */
    private renderUpgradeIndicators(world: GameWorld): void {
        const turretQuery = defineQuery([Turret, Position, TurretUpgrade]);
        const turrets = turretQuery(world);
        
        for (let i = 0; i < turrets.length; i++) {
            const eid = turrets[i];
            const x = Position.x[eid];
            const y = Position.y[eid];
            
            // Calculate total upgrade level
            const totalLevel = 
                TurretUpgrade.damageLevel[eid] +
                TurretUpgrade.rangeLevel[eid] +
                TurretUpgrade.fireRateLevel[eid] +
                TurretUpgrade.multiTargetLevel[eid] +
                TurretUpgrade.specialLevel[eid];
            
            if (totalLevel === 0) continue;
            
            // Draw upgrade rings (one per 3 levels)
            const rings = Math.min(5, Math.ceil(totalLevel / 3));
            
            for (let r = 0; r < rings; r++) {
                const radius = 25 + r * 4;
                const hue = (r / rings) * 120; // Green to cyan
                const color = this.hslToRgb(hue, 100, 50);
                
                this.upgradeGraphics.circle(x, y, radius);
                this.upgradeGraphics.stroke({ 
                    color, 
                    width: 2, 
                    alpha: 0.6 
                });
            }
        }
    }
    
    /**
     * Convert HSL to RGB color
     */
    private hslToRgb(h: number, s: number, l: number): number {
        // Implementation...
    }
}
```

### 5. Turret Selection System

**Goal**: Click turret to open upgrade panel

```typescript
// Add to src/core/Game.ts or input system

class TurretSelectionManager {
    private selectedTurret: number | null = null;
    
    handleClick(x: number, y: number, world: GameWorld): void {
        // Find clicked turret
        const turretQuery = defineQuery([Turret, Position, Collider]);
        const turrets = turretQuery(world);
        
        for (let i = 0; i < turrets.length; i++) {
            const eid = turrets[i];
            const tx = Position.x[eid];
            const ty = Position.y[eid];
            const radius = Collider.radius[eid];
            
            const dist = Math.sqrt((x - tx) ** 2 + (y - ty) ** 2);
            
            if (dist <= radius) {
                this.selectTurret(eid);
                return;
            }
        }
        
        // Clicked empty space, deselect
        this.deselectTurret();
    }
    
    private selectTurret(entity: number): void {
        this.selectedTurret = entity;
        
        // Show upgrade panel
        this.upgradePanel.show(
            entity,
            Position.x[entity] + 50,
            Position.y[entity] - 100
        );
        
        // Highlight turret
        this.renderSystem.highlightEntity(entity, 0xFFFF00);
    }
    
    private deselectTurret(): void {
        if (this.selectedTurret) {
            this.renderSystem.unhighlightEntity(this.selectedTurret);
            this.selectedTurret = null;
        }
        
        this.upgradePanel.hide();
    }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
// src/__tests__/upgradeManager.enhanced.test.ts

describe('Enhanced Upgrade Manager', () => {
    test('should calculate sell price correctly');
    test('should get turret total value with upgrades');
    test('should generate upgrade preview stats');
    test('should apply upgrades and update stats');
    test('should track total invested resources');
});

// src/__tests__/TurretUpgradePanel.enhanced.test.ts

describe('Turret Upgrade Panel', () => {
    test('should show panel at turret position');
    test('should display current stats');
    test('should show upgrade buttons with levels');
    test('should disable max level upgrades');
    test('should show cost and preview');
    test('should handle upgrade button click');
    test('should handle sell button click');
});
```

---

## Success Criteria

- ✅ Click turret to open upgrade panel
- ✅ Panel shows current stats and upgrade options
- ✅ Upgrade buttons show level progress
- ✅ Preview stats before upgrading
- ✅ Visual effect plays on upgrade
- ✅ Upgrade rings visible on turrets
- ✅ Sell button refunds 75% of total investment
- ✅ All tests passing
- ✅ Performance maintained at 60 FPS

---

## Visual Mockup

```
┌─────────────────────────────────────┐
│  Phaser Array                  ●○○  │ ← Upgrade level dots
├─────────────────────────────────────┤
│  Damage: 15.0 DPS                   │
│  Range: 300                         │
│  Fire Rate: 6.00/s                  │
│  Targets: 1                         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Weapon Power       ●●○          │ │ ← Level 2/3
│ │ Increase damage    100 Matter   │ │
│ │ → 22.5 DMG                      │ │ ← Preview
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Targeting Range    ●○○          │ │
│ │ Extend range       80 Matter    │ │
│ │ → 360 RNG                       │ │
│ └─────────────────────────────────┘ │
│ ... (more upgrades)                 │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   SELL - Refund 225 Matter      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Future Enhancements

- Upgrade tree (prerequisites)
- Unique upgrades per faction
- Turret specialization paths
- Visual transformation at max level
- Upgrade animations (beam color change, etc.)

---

## References

- Existing upgrade config: `src/types/constants.ts` (lines 193-294)
- Current UpgradeManager: `src/game/UpgradeManager.ts`
- Current panel: `src/ui/TurretUpgradePanel.ts`
