/**
 * UI Animation Utilities for Kobayashi Maru
 *
 * Provides standardized animation methods for UI components.
 * All animations are tick-based and driven by the game loop via UIAnimator.tick().
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
 * Internal active animation tracking.
 */
interface ActiveAnimation {
    target: Container;
    elapsed: number;
    duration: number;
    updateFn: (t: number) => void;
    onComplete?: () => void;
}

/**
 * UIAnimator provides static methods for common UI animations.
 * Animations are driven by tick() called from HUDManager.update().
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
    private static activeAnimations: ActiveAnimation[] = [];

    /**
     * Advance all active animations by deltaTime.
     * Called from HUDManager.update() each frame.
     * @param deltaTime - Time since last frame in seconds
     */
    static tick(deltaTime: number): void {
        const completed: number[] = [];

        for (let i = 0; i < UIAnimator.activeAnimations.length; i++) {
            const anim = UIAnimator.activeAnimations[i];
            anim.elapsed += deltaTime;
            const t = Math.min(anim.elapsed / anim.duration, 1);
            anim.updateFn(t);

            if (t >= 1) {
                completed.push(i);
            }
        }

        // Remove completed animations in reverse order and fire callbacks
        for (let i = completed.length - 1; i >= 0; i--) {
            const idx = completed[i];
            const anim = UIAnimator.activeAnimations[idx];
            UIAnimator.activeAnimations.splice(idx, 1);
            anim.onComplete?.();
        }
    }

    /**
     * Cancel any existing animation on the same target.
     */
    private static cancelExisting(target: Container): void {
        UIAnimator.activeAnimations = UIAnimator.activeAnimations.filter(
            anim => anim.target !== target
        );
    }

    /**
     * Get the number of active animations (for testing).
     */
    static getActiveCount(): number {
        return UIAnimator.activeAnimations.length;
    }

    /**
     * Clear all active animations (for testing/cleanup).
     */
    static clearAll(): void {
        UIAnimator.activeAnimations = [];
    }

    /**
     * Fade in a container.
     * @param container - Container to fade in
     * @param options - Animation options
     */
    static fadeIn(container: Container, options: Partial<AnimationOptions> = {}): void {
        const duration = options.duration ?? ANIMATION_DEFAULTS.FADE_DURATION;
        UIAnimator.cancelExisting(container);

        container.alpha = 0;
        container.visible = true;

        UIAnimator.activeAnimations.push({
            target: container,
            elapsed: 0,
            duration,
            updateFn: (t) => {
                container.alpha = UIAnimator.easeOutQuad(t);
            },
            onComplete: options.onComplete,
        });
    }

    /**
     * Fade out a container.
     * @param container - Container to fade out
     * @param options - Animation options
     */
    static fadeOut(container: Container, options: Partial<AnimationOptions> = {}): void {
        const duration = options.duration ?? ANIMATION_DEFAULTS.FADE_DURATION;
        const startAlpha = container.alpha;
        UIAnimator.cancelExisting(container);

        UIAnimator.activeAnimations.push({
            target: container,
            elapsed: 0,
            duration,
            updateFn: (t) => {
                container.alpha = startAlpha * (1 - UIAnimator.easeOutQuad(t));
            },
            onComplete: () => {
                container.visible = false;
                options.onComplete?.();
            },
        });
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
        UIAnimator.cancelExisting(container);

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

        UIAnimator.activeAnimations.push({
            target: container,
            elapsed: 0,
            duration,
            updateFn: (t) => {
                const eased = UIAnimator.easeOutQuad(t);
                container.x = startX + (targetX - startX) * eased;
                container.y = startY + (targetY - startY) * eased;
            },
            onComplete: options.onComplete,
        });
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
        UIAnimator.cancelExisting(container);

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

        UIAnimator.activeAnimations.push({
            target: container,
            elapsed: 0,
            duration,
            updateFn: (t) => {
                const eased = UIAnimator.easeOutQuad(t);
                container.x = startX + (targetX - startX) * eased;
                container.y = startY + (targetY - startY) * eased;
            },
            onComplete: () => {
                container.visible = false;
                // Reset position for next show
                container.x = startX;
                container.y = startY;
                options.onComplete?.();
            },
        });
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
        UIAnimator.cancelExisting(container);

        UIAnimator.activeAnimations.push({
            target: container,
            elapsed: 0,
            duration,
            updateFn: (t) => {
                // Pulse up then down
                const pulseT = t < 0.5
                    ? UIAnimator.easeOutQuad(t * 2)
                    : 1 - UIAnimator.easeOutQuad((t - 0.5) * 2);

                const scale = 1 + (maxScale - 1) * pulseT;
                container.scale.set(originalScaleX * scale, originalScaleY * scale);
            },
            onComplete: () => {
                container.scale.set(originalScaleX, originalScaleY);
                options.onComplete?.();
            },
        });
    }

    /**
     * Ease out quadratic function.
     * @param t - Time value (0 to 1)
     * @returns Eased value
     */
    static easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }
}
