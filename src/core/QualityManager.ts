import { PerformanceMonitor, PerformanceTier } from './PerformanceMonitor';

export interface QualitySettings {
    maxParticles: number;
    starCount: number;
    bloomEnabled: boolean;
    resolutionMultiplier: number;
    particleSpawnRate: number;
}

export const QUALITY_PRESETS: Record<PerformanceTier, QualitySettings> = {
    [PerformanceTier.HIGH]: {
        maxParticles: 2000,
        starCount: 1000,
        bloomEnabled: true,
        resolutionMultiplier: 1.0,
        particleSpawnRate: 1.0
    },
    [PerformanceTier.MEDIUM]: {
        maxParticles: 1000,
        starCount: 500,
        bloomEnabled: false,
        resolutionMultiplier: 1.0,
        particleSpawnRate: 0.5
    },
    [PerformanceTier.LOW]: {
        maxParticles: 500,
        starCount: 200,
        bloomEnabled: false,
        resolutionMultiplier: 0.8,
        particleSpawnRate: 0.25
    }
};

export class QualityManager {
    private currentTier: PerformanceTier;
    private settings: QualitySettings;
    private performanceMonitor: PerformanceMonitor;

    constructor(performanceMonitor: PerformanceMonitor) {
        this.performanceMonitor = performanceMonitor;
        this.currentTier = this.performanceMonitor.detectPerformanceTier();
        this.settings = QUALITY_PRESETS[this.currentTier];

        console.log(`QualityManager: Initialized at ${PerformanceTier[this.currentTier]} tier`);
    }

    getSettings(): QualitySettings {
        return this.settings;
    }

    getTier(): PerformanceTier {
        return this.currentTier;
    }

    /**
     * Manually set quality tier
     */
    setTier(tier: PerformanceTier): void {
        this.currentTier = tier;
        this.settings = QUALITY_PRESETS[tier];
        console.log(`QualityManager: Set to ${PerformanceTier[tier]} tier`);
        // Emit event if needed, or systems can poll settings
    }

    /**
     * Check performance and adjust tier if needed (auto-tuning)
     * This could be called periodically
     */
    checkPerformance(): void {
        const avg = this.performanceMonitor.getAverages();

        // Downgrade if FPS is consistently low
        if (avg.fps < 30 && this.currentTier > PerformanceTier.LOW) {
            // Downgrade logic here (debounce needed)
        }
    }
}
