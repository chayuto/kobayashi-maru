# Enhancement Task 08: Achievement System

**Date:** 2025-12-07  
**Priority:** HIGH  
**Category:** Gameplay Feature  
**Estimated Effort:** 2 days  
**Dependencies:** None

---

## Objective

Implement a comprehensive achievement system with tracking, unlocking, toast notifications, and a gallery UI to increase player engagement and replayability.

---

## Current State

**Missing Features**:
- No achievements
- No long-term goals
- No unlock notifications
- No achievement gallery

**Impact**:
- Reduced replayability
- No sense of progression beyond high scores
- Missed opportunity for player engagement

---

## Proposed Implementation

### 1. Achievement Data Structure

```typescript
// src/game/achievements/types.ts

export enum AchievementCategory {
    COMBAT = 'combat',
    SURVIVAL = 'survival',
    ECONOMY = 'economy',
    STRATEGY = 'strategy',
    MASTERY = 'mastery'
}

export enum AchievementRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    rarity: AchievementRarity;
    icon: string;  // Icon identifier
    
    // Progress tracking
    requirement: number;  // Target value (e.g., 100 kills)
    currentProgress: number;
    
    // Unlock state
    unlocked: boolean;
    unlockedAt?: number;  // Timestamp
    
    // Rewards
    rewardResources?: number;
    rewardTitle?: string;
    
    // Hidden achievements (revealed only when unlocked)
    hidden: boolean;
}

export interface AchievementState {
    achievements: Map<string, Achievement>;
    totalUnlocked: number;
    totalPoints: number;
}
```

### 2. Achievement Definitions

```typescript
// src/game/achievements/definitions.ts

export const ACHIEVEMENTS: Achievement[] = [
    // === COMBAT ACHIEVEMENTS ===
    {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Destroy your first enemy',
        category: AchievementCategory.COMBAT,
        rarity: AchievementRarity.COMMON,
        icon: 'skull',
        requirement: 1,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'pest_control',
        name: 'Pest Control',
        description: 'Destroy 100 enemies',
        category: AchievementCategory.COMBAT,
        rarity: AchievementRarity.COMMON,
        icon: 'skull',
        requirement: 100,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'exterminator',
        name: 'Exterminator',
        description: 'Destroy 1,000 enemies',
        category: AchievementCategory.COMBAT,
        rarity: AchievementRarity.RARE,
        icon: 'skull',
        requirement: 1000,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'genocide',
        name: 'Genocide',
        description: 'Destroy 10,000 enemies',
        category: AchievementCategory.COMBAT,
        rarity: AchievementRarity.EPIC,
        icon: 'skull',
        requirement: 10000,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    
    // === SURVIVAL ACHIEVEMENTS ===
    {
        id: 'rookie',
        name: 'Rookie',
        description: 'Survive 5 minutes',
        category: AchievementCategory.SURVIVAL,
        rarity: AchievementRarity.COMMON,
        icon: 'clock',
        requirement: 300,  // seconds
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'veteran',
        name: 'Veteran',
        description: 'Survive 15 minutes',
        category: AchievementCategory.SURVIVAL,
        rarity: AchievementRarity.RARE,
        icon: 'clock',
        requirement: 900,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive 30 minutes',
        category: AchievementCategory.SURVIVAL,
        rarity: AchievementRarity.EPIC,
        icon: 'clock',
        requirement: 1800,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'immortal',
        name: 'Immortal',
        description: 'Survive 60 minutes',
        category: AchievementCategory.SURVIVAL,
        rarity: AchievementRarity.LEGENDARY,
        icon: 'clock',
        requirement: 3600,
        currentProgress: 0,
        unlocked: false,
        rewardResources: 1000,
        hidden: false
    },
    
    // === ECONOMY ACHIEVEMENTS ===
    {
        id: 'penny_pincher',
        name: 'Penny Pincher',
        description: 'Accumulate 1,000 Matter',
        category: AchievementCategory.ECONOMY,
        rarity: AchievementRarity.COMMON,
        icon: 'money',
        requirement: 1000,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'tycoon',
        name: 'Tycoon',
        description: 'Accumulate 10,000 Matter',
        category: AchievementCategory.ECONOMY,
        rarity: AchievementRarity.EPIC,
        icon: 'money',
        requirement: 10000,
        currentProgress: 0,
        unlocked: false,
        rewardResources: 500,
        hidden: false
    },
    
    // === STRATEGY ACHIEVEMENTS ===
    {
        id: 'builder',
        name: 'Builder',
        description: 'Build 10 turrets in a single game',
        category: AchievementCategory.STRATEGY,
        rarity: AchievementRarity.COMMON,
        icon: 'turret',
        requirement: 10,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'fortress',
        name: 'Fortress',
        description: 'Build 30 turrets in a single game',
        category: AchievementCategory.STRATEGY,
        rarity: AchievementRarity.RARE,
        icon: 'turret',
        requirement: 30,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'specialist',
        name: 'Specialist',
        description: 'Fully upgrade a turret',
        category: AchievementCategory.STRATEGY,
        rarity: AchievementRarity.RARE,
        icon: 'upgrade',
        requirement: 1,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    
    // === MASTERY ACHIEVEMENTS ===
    {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Achieve a 50-kill combo',
        category: AchievementCategory.MASTERY,
        rarity: AchievementRarity.EPIC,
        icon: 'combo',
        requirement: 50,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'legendary_streak',
        name: 'Legendary Streak',
        description: 'Achieve a 100-kill combo',
        category: AchievementCategory.MASTERY,
        rarity: AchievementRarity.LEGENDARY,
        icon: 'combo',
        requirement: 100,
        currentProgress: 0,
        unlocked: false,
        rewardResources: 1000,
        rewardTitle: 'The Unstoppable',
        hidden: false
    },
    {
        id: 'wave_master',
        name: 'Wave Master',
        description: 'Complete 20 waves',
        category: AchievementCategory.MASTERY,
        rarity: AchievementRarity.EPIC,
        icon: 'waves',
        requirement: 20,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat 5 boss enemies',
        category: AchievementCategory.MASTERY,
        rarity: AchievementRarity.RARE,
        icon: 'boss',
        requirement: 5,
        currentProgress: 0,
        unlocked: false,
        hidden: false
    },
    
    // === HIDDEN ACHIEVEMENTS ===
    {
        id: 'pacifist',
        name: 'Pacifist',
        description: 'Win without building any turrets',
        category: AchievementCategory.MASTERY,
        rarity: AchievementRarity.LEGENDARY,
        icon: 'peace',
        requirement: 1,
        currentProgress: 0,
        unlocked: false,
        rewardTitle: 'The Pacifist',
        hidden: true
    },
    {
        id: 'perfect_defense',
        name: 'Perfect Defense',
        description: 'Complete a wave without taking damage',
        category: AchievementCategory.MASTERY,
        rarity: AchievementRarity.EPIC,
        icon: 'shield',
        requirement: 1,
        currentProgress: 0,
        unlocked: false,
        hidden: true
    },
    {
        id: 'no_man_left_behind',
        name: 'No Man Left Behind',
        description: 'Never sell a turret in a single game',
        category: AchievementCategory.STRATEGY,
        rarity: AchievementRarity.RARE,
        icon: 'loyalty',
        requirement: 1,
        currentProgress: 0,
        unlocked: false,
        hidden: true
    }
];
```

### 3. Achievement Manager

```typescript
// src/game/achievements/AchievementManager.ts

export class AchievementManager {
    private state: AchievementState;
    private listeners: Set<(achievement: Achievement) => void> = new Set();
    private storageService: StorageService;
    
    constructor(storageService: StorageService) {
        this.storageService = storageService;
        this.state = {
            achievements: new Map(),
            totalUnlocked: 0,
            totalPoints: 0
        };
        
        this.loadAchievements();
    }
    
    /**
     * Initialize achievements from definitions
     */
    private loadAchievements(): void {
        // Load from storage or initialize fresh
        const saved = this.storageService.get<Achievement[]>('achievements');
        
        if (saved) {
            // Restore saved progress
            for (const achievement of saved) {
                this.state.achievements.set(achievement.id, achievement);
            }
        } else {
            // Initialize from definitions
            for (const achievement of ACHIEVEMENTS) {
                this.state.achievements.set(achievement.id, { ...achievement });
            }
        }
        
        this.updateStats();
    }
    
    /**
     * Update progress for an achievement
     */
    updateProgress(achievementId: string, progress: number): void {
        const achievement = this.state.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        achievement.currentProgress = progress;
        
        // Check if unlocked
        if (achievement.currentProgress >= achievement.requirement) {
            this.unlock(achievementId);
        }
        
        this.save();
    }
    
    /**
     * Increment progress for an achievement
     */
    incrementProgress(achievementId: string, amount: number = 1): void {
        const achievement = this.state.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        this.updateProgress(achievementId, achievement.currentProgress + amount);
    }
    
    /**
     * Unlock an achievement
     */
    private unlock(achievementId: string): void {
        const achievement = this.state.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        
        this.state.totalUnlocked++;
        this.updateStats();
        
        // Notify listeners (for toast notification)
        this.notifyListeners(achievement);
        
        // Apply rewards
        if (achievement.rewardResources) {
            // Award resources (handled by game manager)
            console.log(`Rewarded ${achievement.rewardResources} Matter`);
        }
        
        this.save();
    }
    
    /**
     * Get all achievements
     */
    getAll(): Achievement[] {
        return Array.from(this.state.achievements.values());
    }
    
    /**
     * Get achievements by category
     */
    getByCategory(category: AchievementCategory): Achievement[] {
        return this.getAll().filter(a => a.category === category);
    }
    
    /**
     * Get unlocked achievements
     */
    getUnlocked(): Achievement[] {
        return this.getAll().filter(a => a.unlocked);
    }
    
    /**
     * Get completion percentage
     */
    getCompletionPercentage(): number {
        const total = this.state.achievements.size;
        return (this.state.totalUnlocked / total) * 100;
    }
    
    /**
     * Register listener for unlock events
     */
    onUnlock(callback: (achievement: Achievement) => void): void {
        this.listeners.add(callback);
    }
    
    /**
     * Remove listener
     */
    offUnlock(callback: (achievement: Achievement) => void): void {
        this.listeners.delete(callback);
    }
    
    /**
     * Notify listeners
     */
    private notifyListeners(achievement: Achievement): void {
        for (const listener of this.listeners) {
            listener(achievement);
        }
    }
    
    /**
     * Update stats
     */
    private updateStats(): void {
        this.state.totalUnlocked = this.getUnlocked().length;
        
        // Calculate total points (rarity based)
        const rarityPoints = {
            [AchievementRarity.COMMON]: 10,
            [AchievementRarity.RARE]: 25,
            [AchievementRarity.EPIC]: 50,
            [AchievementRarity.LEGENDARY]: 100
        };
        
        this.state.totalPoints = this.getUnlocked().reduce((sum, a) => {
            return sum + rarityPoints[a.rarity];
        }, 0);
    }
    
    /**
     * Save to storage
     */
    private save(): void {
        const achievements = Array.from(this.state.achievements.values());
        this.storageService.set('achievements', achievements);
    }
    
    /**
     * Reset all achievements
     */
    reset(): void {
        for (const achievement of this.state.achievements.values()) {
            achievement.unlocked = false;
            achievement.currentProgress = 0;
            achievement.unlockedAt = undefined;
        }
        
        this.updateStats();
        this.save();
    }
}
```

### 4. Achievement Toast Notification

```typescript
// src/ui/AchievementToast.ts

export class AchievementToast {
    private container: Container;
    private queue: Achievement[] = [];
    private currentToast: Container | null = null;
    private animating: boolean = false;
    
    constructor() {
        this.container = new Container();
        this.container.position.set(1620, 100); // Top-right
    }
    
    /**
     * Show achievement unlock notification
     */
    show(achievement: Achievement): void {
        this.queue.push(achievement);
        
        if (!this.animating) {
            this.showNext();
        }
    }
    
    /**
     * Show next toast in queue
     */
    private async showNext(): Promise<void> {
        if (this.queue.length === 0) {
            this.animating = false;
            return;
        }
        
        this.animating = true;
        const achievement = this.queue.shift()!;
        
        // Create toast
        this.currentToast = this.createToast(achievement);
        this.container.addChild(this.currentToast);
        
        // Animate in
        await this.animateIn(this.currentToast);
        
        // Hold for 3 seconds
        await this.wait(3000);
        
        // Animate out
        await this.animateOut(this.currentToast);
        
        // Clean up
        this.container.removeChild(this.currentToast);
        this.currentToast = null;
        
        // Show next
        this.showNext();
    }
    
    /**
     * Create toast UI
     */
    private createToast(achievement: Achievement): Container {
        const toast = new Container();
        
        // Background
        const bg = new Graphics();
        bg.roundRect(0, 0, 300, 100, 8);
        bg.fill({ color: 0x000000, alpha: 0.9 });
        bg.stroke({ color: this.getRarityColor(achievement.rarity), width: 3 });
        toast.addChild(bg);
        
        // Achievement icon
        const icon = this.createIcon(achievement.icon);
        icon.position.set(20, 50);
        toast.addChild(icon);
        
        // "Achievement Unlocked!" text
        const header = new Text({
            text: 'ACHIEVEMENT UNLOCKED!',
            style: {
                fontSize: 12,
                fill: 0xFFFF00,
                fontWeight: 'bold'
            }
        });
        header.position.set(70, 15);
        toast.addChild(header);
        
        // Achievement name
        const name = new Text({
            text: achievement.name,
            style: {
                fontSize: 16,
                fill: this.getRarityColor(achievement.rarity),
                fontWeight: 'bold'
            }
        });
        name.position.set(70, 35);
        toast.addChild(name);
        
        // Description
        const desc = new Text({
            text: achievement.description,
            style: {
                fontSize: 10,
                fill: 0xCCCCCC,
                wordWrap: true,
                wordWrapWidth: 210
            }
        });
        desc.position.set(70, 58);
        toast.addChild(desc);
        
        return toast;
    }
    
    /**
     * Get color based on rarity
     */
    private getRarityColor(rarity: AchievementRarity): number {
        switch (rarity) {
            case AchievementRarity.COMMON: return 0xCCCCCC;
            case AchievementRarity.RARE: return 0x00AAFF;
            case AchievementRarity.EPIC: return 0xCC00FF;
            case AchievementRarity.LEGENDARY: return 0xFFAA00;
        }
    }
    
    /**
     * Animate toast sliding in
     */
    private async animateIn(toast: Container): Promise<void> {
        toast.x = 300; // Start off-screen
        toast.alpha = 0;
        
        return new Promise(resolve => {
            const duration = 0.3;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(1, elapsed / duration);
                
                toast.x = 300 * (1 - progress);
                toast.alpha = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }
    
    /**
     * Animate toast sliding out
     */
    private async animateOut(toast: Container): Promise<void> {
        return new Promise(resolve => {
            const duration = 0.3;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(1, elapsed / duration);
                
                toast.x = 300 * progress;
                toast.alpha = 1 - progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }
    
    /**
     * Wait helper
     */
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Create icon graphic
     */
    private createIcon(iconType: string): Graphics {
        const icon = new Graphics();
        // Simple placeholder icons
        icon.circle(0, 0, 20);
        icon.fill({ color: 0xFFFF00 });
        return icon;
    }
    
    /**
     * Get container
     */
    getContainer(): Container {
        return this.container;
    }
}
```

### 5. Integration with Game Systems

```typescript
// Integrate with various game systems

// When enemy killed:
achievementManager.incrementProgress('first_blood', 1);
achievementManager.incrementProgress('pest_control', 1);
achievementManager.incrementProgress('exterminator', 1);
achievementManager.incrementProgress('genocide', 1);

// When time passes:
achievementManager.updateProgress('rookie', currentTime);
achievementManager.updateProgress('veteran', currentTime);

// When combo reached:
achievementManager.updateProgress('combo_master', comboCount);
achievementManager.updateProgress('legendary_streak', comboCount);

// When turret built:
achievementManager.incrementProgress('builder', 1);
achievementManager.incrementProgress('fortress', 1);

// When turret fully upgraded:
if (isTurretMaxUpgraded(turret)) {
    achievementManager.incrementProgress('specialist', 1);
}

// When resources accumulated:
achievementManager.updateProgress('penny_pincher', totalResources);
achievementManager.updateProgress('tycoon', totalResources);
```

---

## Testing Requirements

```typescript
// src/__tests__/AchievementManager.test.ts

describe('AchievementManager', () => {
    test('should load achievements');
    test('should update progress');
    test('should unlock when requirement met');
    test('should notify listeners on unlock');
    test('should save to storage');
    test('should calculate completion percentage');
    test('should filter by category');
});
```

---

## Success Criteria

- ✅ 20+ achievements defined
- ✅ Achievement tracking working
- ✅ Toast notifications appear on unlock
- ✅ Achievements persist in localStorage
- ✅ Completion percentage calculated
- ✅ Hidden achievements work correctly
- ✅ Rewards applied (resources, titles)
- ✅ All tests passing

---

## References

- Storage service: `src/services/StorageService.ts`
- High score manager: `src/game/highScoreManager.ts`
