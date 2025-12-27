/**
 * UI Animation Utilities for Kobayashi Maru
 * 
 * Provides standardized animation methods for UI components.
 * All animations use requestAnimationFrame for smooth performance.
 * 
 * @module ui/animation/UIAnimator
 */
import type { Container } from 'pixi.js';

/**
 * Animation options.
 */
export interface AnimationOptions {
    /** Duration in seconds */
    duration: number;
    /** Callback when animation completes */
    onComplete?: () => void;
}

/**
 * Default animation durations in seconds.
 */
const ANIMATION_DEFAULTS = {
    FADE_DURATION: 0.3,
    SLIDE_DURATION: 0.25,
} as const;

/**
 * UIAnimator provides static methods for common UI animations.
 * 
 * @example
 * ```typescript
 * // Fade in a panel
 * UIAnimator.fadeIn(panel.container, { duration: 0.3 });
 * 
 * // Slide in from left
 * UIAnimator.slideIn(menu.container, 'left', 100, {
 *   duration: 0.25,
 *   onComplete: () => console.log('Animation complete')
 * });
 * ```
 */
export class UIAnimator {
    /**
     * Fade in a container.
     * @param container - Container to fade in
     * @param options - Animation options
     */
    static fadeIn(container: Container, options: Partial<AnimationOptions> = {}): void {
        const duration = options.duration ?? ANIMATION_DEFAULTS.FADE_DURATION;
        container.alpha = 0;
        container.visible = true;

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            container.alpha = UIAnimator.easeOutQuad(t);

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Fade out a container.
     * @param container - Container to fade out
     * @param options - Animation options
     */
    static fadeOut(container: Container, options: Partial<AnimationOptions> = {}): void {
        const duration = options.duration ?? ANIMATION_DEFAULTS.FADE_DURATION;
        const startAlpha = container.alpha;

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            container.alpha = startAlpha * (1 - UIAnimator.easeOutQuad(t));

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                container.visible = false;
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Slide in a container from an edge.
     * @param container - Container to slide in
     * @param from - Edge to slide from
     * @param distance - Distance to slide in pixels
     * @param options - Animation options
     */
    static slideIn(
        container: Container,
        from: 'left' | 'right' | 'top' | 'bottom',
        distance: number,
        options: Partial<AnimationOptions> = {}
    ): void {
        const duration = options.duration ?? ANIMATION_DEFAULTS.SLIDE_DURATION;
        const targetX = container.x;
        const targetY = container.y;

        // Set starting position
        switch (from) {
            case 'left': 
                container.x = targetX - distance; 
                break;
            case 'right': 
                container.x = targetX + distance; 
                break;
            case 'top': 
                container.y = targetY - distance; 
                break;
            case 'bottom': 
                container.y = targetY + distance; 
                break;
        }

        container.visible = true;
        const startX = container.x;
        const startY = container.y;

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            const eased = UIAnimator.easeOutQuad(t);

            container.x = startX + (targetX - startX) * eased;
            container.y = startY + (targetY - startY) * eased;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Slide out a container to an edge.
     * @param container - Container to slide out
     * @param to - Edge to slide to
     * @param distance - Distance to slide in pixels
     * @param options - Animation options
     */
    static slideOut(
        container: Container,
        to: 'left' | 'right' | 'top' | 'bottom',
        distance: number,
        options: Partial<AnimationOptions> = {}
    ): void {
        const duration = options.duration ?? ANIMATION_DEFAULTS.SLIDE_DURATION;
        const startX = container.x;
        const startY = container.y;
        
        let targetX = startX;
        let targetY = startY;

        switch (to) {
            case 'left': 
                targetX = startX - distance; 
                break;
            case 'right': 
                targetX = startX + distance; 
                break;
            case 'top': 
                targetY = startY - distance; 
                break;
            case 'bottom': 
                targetY = startY + distance; 
                break;
        }

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            const eased = UIAnimator.easeOutQuad(t);

            container.x = startX + (targetX - startX) * eased;
            container.y = startY + (targetY - startY) * eased;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                container.visible = false;
                // Reset position for next show
                container.x = startX;
                container.y = startY;
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Pulse scale animation (useful for highlighting).
     * @param container - Container to pulse
     * @param maxScale - Maximum scale during pulse
     * @param options - Animation options
     */
    static pulse(
        container: Container,
        maxScale: number = 1.1,
        options: Partial<AnimationOptions> = {}
    ): void {
        const duration = options.duration ?? 0.2;
        const originalScaleX = container.scale.x;
        const originalScaleY = container.scale.y;

        const startTime = performance.now();
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            
            // Pulse up then down
            const pulseT = t < 0.5 
                ? UIAnimator.easeOutQuad(t * 2) 
                : 1 - UIAnimator.easeOutQuad((t - 0.5) * 2);
            
            const scale = 1 + (maxScale - 1) * pulseT;
            container.scale.set(originalScaleX * scale, originalScaleY * scale);

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                container.scale.set(originalScaleX, originalScaleY);
                options.onComplete?.();
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Ease out quadratic function.
     * @param t - Time value (0 to 1)
     * @returns Eased value
     */
    private static easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }
}
