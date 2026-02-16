import { PerformanceMonitor, PerformanceTier } from './PerformanceMonitor';
import { QUALITY_CONFIG } from '../config';

export interface QualitySettings {
    maxParticles: number;
    starCount: number;
    bloomEnabled: boolean;
    resolutionMultiplier: number;
    particleSpawnRate: number;
}

export const QUALITY_PRESETS: Record<PerformanceTier, QualitySettings> = {
    [PerformanceTier.HIGH]: {
        maxParticles: QUALITY_CONFIG.PRESETS.HIGH.maxParticles,
        starCount: QUALITY_CONFIG.PRESETS.HIGH.starCount,
        bloomEnabled: true,
        resolutionMultiplier: QUALITY_CONFIG.PRESETS.HIGH.resolutionMultiplier,
        particleSpawnRate: QUALITY_CONFIG.PRESETS.HIGH.particleSpawnRate
    },
    [PerformanceTier.MEDIUM]: {
        maxParticles: QUALITY_CONFIG.PRESETS.MEDIUM.maxParticles,
        starCount: QUALITY_CONFIG.PRESETS.MEDIUM.starCount,
        bloomEnabled: false,
        resolutionMultiplier: QUALITY_CONFIG.PRESETS.MEDIUM.resolutionMultiplier,
        particleSpawnRate: QUALITY_CONFIG.PRESETS.MEDIUM.particleSpawnRate
    },
    [PerformanceTier.LOW]: {
        maxParticles: QUALITY_CONFIG.PRESETS.LOW.maxParticles,
        starCount: QUALITY_CONFIG.PRESETS.LOW.starCount,
        bloomEnabled: false,
        resolutionMultiplier: QUALITY_CONFIG.PRESETS.LOW.resolutionMultiplier,
        particleSpawnRate: QUALITY_CONFIG.PRESETS.LOW.particleSpawnRate
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
        if (avg.fps < QUALITY_CONFIG.DOWNGRADE_FPS_THRESHOLD && this.currentTier > PerformanceTier.LOW) {
            // Downgrade logic here (debounce needed)
        }
    }
}
