# Task 4: Mobile HUD Redesign

**Date:** December 1, 2025  
**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** Task 3 (Responsive UI System)

## Objective

Redesign HUD layout specifically for mobile screens with compact information display, bottom-sheet turret menu, and touch-optimized controls.

## Current State

- Desktop HUD with 5 separate panels
- Turret menu on right side (awkward for one-handed use)
- Too much information displayed simultaneously
- Small text and buttons

## Mobile HUD Design

### Layout Philosophy

**Mobile Constraints:**
- Limited screen real estate
- One-handed operation preferred
- Bottom of screen easiest to reach
- Top corners hard to reach
- Essential info only

**Design Principles:**
- Bottom-heavy layout (reachable with thumb)
- Collapsible/expandable sections
- Large touch targets (minimum 44px)
- High contrast for outdoor visibility
- Minimal text, more icons

### Mobile Layout Structure

```
┌─────────────────────────────┐
│  Wave 5  │  SPAWNING  │ 500M│  <- Compact top bar
├─────────────────────────────┤
│                             │
│                             │
│      Game Canvas            │
│                             │
│                             │
├─────────────────────────────┤
│ ████████░░ HULL  ████░ SHLD│  <- KM Status bar
├─────────────────────────────┤
│ [Phaser] [Torpedo] [Disrup]│  <- Turret buttons
│   100M      200M      150M  │
└─────────────────────────────┘
```

## Implementation

### 1. Create Mobile HUD Components

**File:** `src/ui/MobileHUD.ts`

```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { HUDData } from './types';
import { ResponsiveUIManager } from './ResponsiveUIManager';
import { GAME_CONFIG } from '../types/constants';

/**
 * Mobile-optimized HUD with compact layout
 */
export class MobileHUD {
  public container: Container;
  private responsiveManager: ResponsiveUIManager;
  private topBar: Container;
  private statusBar: Container;
  private turretBar: Container;
  
  // Top bar elements
  private waveText: Text;
  private waveStateText: Text;
  private resourcesText: Text;
  
  // Status bar elements
  private hullBar: Graphics;
  private shieldBar: Graphics;
  private hullText: Text;
  private shieldText: Text;
  
  // Turret bar elements
  private turretButtons: Map<number, Container> = new Map();
  
  constructor(responsiveManager: ResponsiveUIManager) {
    this.container = new Container();
    this.responsiveManager = responsiveManager;
    this.topBar = new Container();
    this.statusBar = new Container();
    this.turretBar = new Container();
    
    this.container.addChild(this.topBar);
    this.container.addChild(this.statusBar);
    this.container.addChild(this.turretBar);
  }

  public init(): void {
    this.createTopBar();
    this.createStatusBar();
    this.createTurretBar();
    this.positionElements();
  }

  private createTopBar(): void {
    const config = this.responsiveManager.getConfig();
    const width = config.width;
    const height = 50;
    const padding = 8;
    
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.8 });
    this.topBar.addChild(bg);
    
    // Wave info (left)
    const waveStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: this.responsiveManager.scaleFontSize(18),
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.waveText = new Text({ text: 'W1', style: waveStyle });
    this.waveText.position.set(padding, padding);
    this.topBar.addChild(this.waveText);
    
    // Wave state (center-left)
    const stateStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: this.responsiveManager.scaleFontSize(14),
      fill: UI_STYLES.COLORS.SECONDARY
    });
    this.waveStateText = new Text({ text: 'IDLE', style: stateStyle });
    this.waveStateText.position.set(padding + 60, padding + 4);
    this.topBar.addChild(this.waveStateText);
    
    // Resources (right)
    const resourceStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: this.responsiveManager.scaleFontSize(20),
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.resourcesText = new Text({ text: '500M', style: resourceStyle });
    this.resourcesText.anchor.set(1, 0);
    this.resourcesText.position.set(width - padding, padding);
    this.topBar.addChild(this.resourcesText);
  }

  private createStatusBar(): void {
    const config = this.responsiveManager.getConfig();
    const width = config.width;
    const height = 40;
    const padding = 8;
    const barHeight = 8;
    
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.8 });
    this.statusBar.addChild(bg);
    
    // Hull bar
    this.hullBar = new Graphics();
    this.statusBar.addChild(this.hullBar);
    
    // Shield bar
    this.shieldBar = new Graphics();
    this.statusBar.addChild(this.shieldBar);
    
    // Hull label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: this.responsiveManager.scaleFontSize(10),
      fill: UI_STYLES.COLORS.TEXT
    });
    this.hullText = new Text({ text: 'HULL', style: labelStyle });
    this.hullText.position.set(padding, padding);
    this.statusBar.addChild(this.hullText);
    
    // Shield label
    this.shieldText = new Text({ text: 'SHLD', style: labelStyle });
    this.shieldText.anchor.set(1, 0);
    this.shieldText.position.set(width - padding, padding);
    this.statusBar.addChild(this.shieldText);
  }

  private createTurretBar(): void {
    const config = this.responsiveManager.getConfig();
    const width = config.width;
    const height = 70;
    const padding = 8;
    const buttonWidth = (width - padding * 4) / 3;
    const buttonHeight = height - padding * 2;
    
    // Background
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
    this.turretBar.addChild(bg);
    
    // Create 3 turret buttons
    const turretTypes = [
      { id: 0, name: 'Phaser', cost: 100, color: 0x33CC99 },
      { id: 1, name: 'Torpedo', cost: 200, color: 0xFF6600 },
      { id: 2, name: 'Disruptor', cost: 150, color: 0x22EE22 }
    ];
    
    turretTypes.forEach((turret, index) => {
      const button = this.createTurretButton(
        turret.name,
        turret.cost,
        turret.color,
        buttonWidth,
        buttonHeight
      );
      button.position.set(padding + (buttonWidth + padding) * index, padding);
      this.turretBar.addChild(button);
      this.turretButtons.set(turret.id, button);
    });
  }

  private createTurretButton(
    name: string,
    cost: number,
    color: number,
    width: number,
    height: number
  ): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';
    
    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 8);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.5 });
    bg.stroke({ color, width: 2 });
    button.addChild(bg);
    
    // Name
    const nameStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: this.responsiveManager.scaleFontSize(14),
      fill: color,
      fontWeight: 'bold',
      align: 'center'
    });
    const nameText = new Text({ text: name, style: nameStyle });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(width / 2, 8);
    button.addChild(nameText);
    
    // Cost
    const costStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: this.responsiveManager.scaleFontSize(16),
      fill: UI_STYLES.COLORS.PRIMARY,
      align: 'center'
    });
    const costText = new Text({ text: `${cost}M`, style: costStyle });
    costText.anchor.set(0.5, 0);
    costText.position.set(width / 2, height - 24);
    button.addChild(costText);
    
    return button;
  }

  private positionElements(): void {
    const config = this.responsiveManager.getConfig();
    const safeArea = config.safeAreaInsets;
    
    // Top bar at top
    this.topBar.position.set(0, safeArea.top);
    
    // Status bar above turret bar
    this.statusBar.position.set(0, config.height - 110 - safeArea.bottom);
    
    // Turret bar at bottom
    this.turretBar.position.set(0, config.height - 70 - safeArea.bottom);
  }

  public update(data: HUDData): void {
    // Update top bar
    this.waveText.text = `W${data.waveNumber}`;
    this.waveStateText.text = data.waveState.toUpperCase().substring(0, 4);
    this.resourcesText.text = `${data.resources}M`;
    
    // Update status bars
    this.updateStatusBars(
      data.kobayashiMaruHealth,
      data.kobayashiMaruMaxHealth,
      data.kobayashiMaruShield,
      data.kobayashiMaruMaxShield
    );
    
    // Update turret button affordances
    this.updateTurretButtons(data.resources);
  }

  private updateStatusBars(
    health: number,
    maxHealth: number,
    shield: number,
    maxShield: number
  ): void {
    const config = this.responsiveManager.getConfig();
    const width = config.width;
    const padding = 8;
    const barWidth = (width - padding * 3) / 2;
    const barHeight = 8;
    const y = 24;
    
    // Hull bar
    const hullPercent = maxHealth > 0 ? health / maxHealth : 0;
    this.hullBar.clear();
    this.hullBar.rect(padding, y, barWidth, barHeight);
    this.hullBar.fill({ color: 0x333333 });
    this.hullBar.rect(padding, y, barWidth * hullPercent, barHeight);
    this.hullBar.fill({ color: UI_STYLES.COLORS.HEALTH });
    
    // Shield bar
    const shieldPercent = maxShield > 0 ? shield / maxShield : 0;
    const shieldX = padding * 2 + barWidth;
    this.shieldBar.clear();
    this.shieldBar.rect(shieldX, y, barWidth, barHeight);
    this.shieldBar.fill({ color: 0x333333 });
    this.shieldBar.rect(shieldX, y, barWidth * shieldPercent, barHeight);
    this.shieldBar.fill({ color: UI_STYLES.COLORS.SHIELD });
  }

  private updateTurretButtons(resources: number): void {
    const costs = [100, 200, 150];
    
    this.turretButtons.forEach((button, id) => {
      const canAfford = resources >= costs[id];
      button.alpha = canAfford ? 1.0 : 0.5;
    });
  }

  public setTurretButtonCallback(
    turretType: number,
    callback: () => void
  ): void {
    const button = this.turretButtons.get(turretType);
    if (button) {
      button.removeAllListeners();
      button.on('pointerdown', callback);
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
```

### 2. Update HUDManager to Use Mobile HUD

**File:** `src/ui/HUDManager.ts`

```typescript
import { MobileHUD } from './MobileHUD';

export class HUDManager {
  // ... existing properties
  private mobileHUD: MobileHUD | null = null;
  private desktopMode: boolean = true;

  init(app: Application, responsiveManager: ResponsiveUIManager): void {
    this.app = app;
    this.responsiveManager = responsiveManager;
    this.responsiveStyles = getResponsiveStyles(this.responsiveManager);
    
    // Determine initial mode
    this.desktopMode = !this.responsiveManager.isMobile();
    
    // Listen for screen size changes
    this.responsiveManager.onChange((config) => {
      const shouldBeDesktop = !config.isMobile;
      if (shouldBeDesktop !== this.desktopMode) {
        this.desktopMode = shouldBeDesktop;
        this.switchMode();
      }
    });
    
    // Add HUD container to stage
    this.app.stage.addChild(this.container);
    
    // Create appropriate HUD
    if (this.desktopMode) {
      this.createDesktopHUD();
    } else {
      this.createMobileHUD();
    }
  }

  private switchMode(): void {
    // Clear current HUD
    this.container.removeChildren();
    
    if (this.desktopMode) {
      if (this.mobileHUD) {
        this.mobileHUD.destroy();
        this.mobileHUD = null;
      }
      this.createDesktopHUD();
    } else {
      this.createMobileHUD();
    }
  }

  private createMobileHUD(): void {
    this.mobileHUD = new MobileHUD(this.responsiveManager);
    this.mobileHUD.init();
    this.container.addChild(this.mobileHUD.container);
    
    // Connect turret buttons to placement manager
    // (will be done in next task)
  }

  private createDesktopHUD(): void {
    // Existing desktop HUD creation
    this.createTopLeftPanel();
    this.createTopRightPanel();
    this.createBottomLeftPanel();
    this.createBottomCenterPanel();
    this.createBottomRightPanel();
  }

  update(data: HUDData): void {
    if (!this.visible) return;
    
    if (this.desktopMode) {
      // Existing desktop update logic
      this.updateDesktopHUD(data);
    } else if (this.mobileHUD) {
      // Mobile update
      this.mobileHUD.update(data);
    }
  }

  private updateDesktopHUD(data: HUDData): void {
    // Existing update logic
    // ... (current update code)
  }
}
```

### 3. Export Mobile HUD

**File:** `src/ui/index.ts`

```typescript
export { MobileHUD } from './MobileHUD';
// ... existing exports
```

## Testing

### Manual Testing Checklist

- [ ] Mobile HUD displays on small screens
- [ ] Desktop HUD displays on large screens
- [ ] Smooth transition between modes on resize
- [ ] All information visible and readable
- [ ] Touch targets are large enough (44px+)
- [ ] Turret buttons respond to touch
- [ ] Status bars update correctly
- [ ] Safe area insets respected
- [ ] No overlap with game canvas
- [ ] Performance is smooth (60fps)

## Success Criteria

- Mobile HUD renders correctly on phones
- Desktop HUD unchanged and functional
- Automatic switching between modes
- All essential information displayed
- Touch-friendly button sizes
- Readable text on small screens
- No layout issues or overlaps
- Smooth performance

## Notes for Agent

- Keep mobile HUD simple and focused
- Prioritize essential information
- Use bottom-heavy layout for reachability
- Ensure touch targets are large enough
- Test on various screen sizes
- Maintain desktop experience
- Consider adding collapse/expand animations later

## Related Files

- `src/ui/MobileHUD.ts` (new)
- `src/ui/HUDManager.ts` (modify)
- `src/ui/index.ts` (modify)

## Next Task

After completing this task, proceed to **Task 5: Touch Turret Placement** to enhance turret placement for touch input.
