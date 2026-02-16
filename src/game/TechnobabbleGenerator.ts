/**
 * Technobabble Generator for Kobayashi Maru
 *
 * Generates Star Trek-style technobabble messages triggered by game events
 * and on a periodic timer for immersion. Messages are emitted via EventBus
 * as TECHNOBABBLE_MESSAGE events so the UI layer can display them in the
 * message log.
 *
 * @module game/TechnobabbleGenerator
 */

import { EventBus } from '../core/EventBus';
import {
    GameEventType,
    AlertLevel,
    type AlertLevelChangedPayload,
} from '../types/events';

// ---------------------------------------------------------------------------
// Template word banks
// ---------------------------------------------------------------------------

const OPERATIONS = [
    'Recalibrating', 'Rerouting', 'Initializing', 'Scanning',
    'Compensating for', 'Modulating', 'Engaging', 'Bypassing',
    'Realigning', 'Boosting',
] as const;

const MODIFIERS = [
    'auxiliary', 'primary', 'emergency', 'subspace', 'quantum',
    'secondary', 'tertiary', 'backup', 'lateral', 'forward',
] as const;

const COMPONENTS = [
    'deflector array', 'plasma manifold', 'EPS grid', 'shield emitters',
    'sensor array', 'warp coil', 'structural integrity field',
    'antimatter containment', 'phaser coupling', 'torpedo guidance',
] as const;

const STATUSES = [
    'nominal', 'online', 'complete', 'stable', 'compensated',
    'engaged', 'aligned', 'optimized', 'synchronized', 'initialized',
] as const;

// Event-specific message templates
const WAVE_START_MESSAGES = [
    'Scanning subspace — multiple contacts detected',
    'Long-range sensors detecting hostile signatures',
    'Tactical alert — enemy vessels approaching',
    'Detecting incoming warp signatures on approach vector',
    'Subspace distortions indicate hostile fleet inbound',
] as const;

const WAVE_COMPLETE_MESSAGES = [
    'All hostiles neutralized — recalibrating sensors',
    'Threat assessment clear — standing down tactical alert',
    'Sector secured — running diagnostic on defense grid',
    'Hostile contacts eliminated — resetting targeting matrix',
    'Combat analysis complete — optimizing firing solutions',
] as const;

const ALERT_CRITICAL_MESSAGES = [
    'Emergency! Rerouting emergency power to shields!',
    'Hull breach imminent — reinforcing structural integrity!',
    'Critical damage — diverting all power to defense systems!',
    'Emergency protocols engaged — antimatter containment failing!',
    'Red alert! Shield generators overloading!',
] as const;

const ALERT_CAUTION_MESSAGES = [
    'Caution — diverting auxiliary power to defense grid',
    'Yellow alert — boosting shield harmonics',
    'Defensive posture — increasing sensor sweep frequency',
    'Threat level elevated — rerouting power to tactical systems',
    'Caution — compensating for fluctuations in shield matrix',
] as const;

const ALERT_NORMAL_MESSAGES = [
    'Threat assessment: nominal — standing down from alert',
    'All systems returning to normal parameters',
    'Defense grid stable — resuming standard operations',
    'Alert status normalized — running system diagnostics',
    'Condition green — all stations report nominal',
] as const;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Minimum seconds between any two technobabble messages */
const COOLDOWN_SECONDS = 5;

/** Minimum seconds between periodic (ambient) messages */
const PERIODIC_MIN_SECONDS = 8;

/** Maximum seconds between periodic (ambient) messages */
const PERIODIC_MAX_SECONDS = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

// ---------------------------------------------------------------------------
// TechnobabbleGenerator
// ---------------------------------------------------------------------------

/**
 * Generates and emits Star Trek-style technobabble messages.
 */
export class TechnobabbleGenerator {
    private eventBus: EventBus;

    /** Seconds since last emitted message */
    private timeSinceLastMessage: number = 0;

    /** Seconds until the next periodic message fires */
    private periodicTimer: number = 0;

    /** Whether the generator is currently active */
    private active: boolean = false;

    // Bound handler references for clean unsubscription
    private handleWaveStarted: () => void;
    private handleWaveCompleted: () => void;
    private handleAlertLevelChanged: (payload: AlertLevelChangedPayload) => void;

    constructor() {
        this.eventBus = EventBus.getInstance();

        // Bind handlers so we can remove them later
        this.handleWaveStarted = this.onWaveStarted.bind(this);
        this.handleWaveCompleted = this.onWaveCompleted.bind(this);
        this.handleAlertLevelChanged = this.onAlertLevelChanged.bind(this);
    }

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    /**
     * Subscribe to EventBus events and start periodic timer.
     */
    init(): void {
        this.eventBus.on(GameEventType.WAVE_STARTED, this.handleWaveStarted);
        this.eventBus.on(GameEventType.WAVE_COMPLETED, this.handleWaveCompleted);
        this.eventBus.on(GameEventType.ALERT_LEVEL_CHANGED, this.handleAlertLevelChanged);

        this.resetPeriodicTimer();
        this.active = true;
    }

    /**
     * Tick the periodic message timer.
     *
     * @param deltaTime - Seconds since last frame
     */
    update(deltaTime: number): void {
        if (!this.active) return;

        this.timeSinceLastMessage += deltaTime;
        this.periodicTimer -= deltaTime;

        if (this.periodicTimer <= 0) {
            this.emitPeriodicMessage();
            this.resetPeriodicTimer();
        }
    }

    /**
     * Unsubscribe from all events and stop generating messages.
     */
    destroy(): void {
        this.active = false;

        this.eventBus.off(GameEventType.WAVE_STARTED, this.handleWaveStarted);
        this.eventBus.off(GameEventType.WAVE_COMPLETED, this.handleWaveCompleted);
        this.eventBus.off(GameEventType.ALERT_LEVEL_CHANGED, this.handleAlertLevelChanged);
    }

    // ------------------------------------------------------------------
    // Public helpers (useful for testing)
    // ------------------------------------------------------------------

    /**
     * Generate a random technobabble string from the template word banks.
     *
     * Format: "[Operation] [modifier] [component] — [status]"
     */
    generateTechnobabble(): string {
        const operation = pickRandom(OPERATIONS);
        const modifier = pickRandom(MODIFIERS);
        const component = pickRandom(COMPONENTS);
        const status = pickRandom(STATUSES);

        return `${operation} ${modifier} ${component} — ${status}`;
    }

    /**
     * Whether the generator is currently active and accepting updates.
     */
    isActive(): boolean {
        return this.active;
    }

    // ------------------------------------------------------------------
    // Event handlers
    // ------------------------------------------------------------------

    private onWaveStarted(): void {
        this.emitMessage(pickRandom(WAVE_START_MESSAGES));
    }

    private onWaveCompleted(): void {
        this.emitMessage(pickRandom(WAVE_COMPLETE_MESSAGES));
    }

    private onAlertLevelChanged(payload: AlertLevelChangedPayload): void {
        switch (payload.level) {
            case AlertLevel.CRITICAL:
                this.emitMessage(pickRandom(ALERT_CRITICAL_MESSAGES));
                break;
            case AlertLevel.CAUTION:
                this.emitMessage(pickRandom(ALERT_CAUTION_MESSAGES));
                break;
            case AlertLevel.NORMAL:
                this.emitMessage(pickRandom(ALERT_NORMAL_MESSAGES));
                break;
        }
    }

    // ------------------------------------------------------------------
    // Internal
    // ------------------------------------------------------------------

    private emitPeriodicMessage(): void {
        this.emitMessage(this.generateTechnobabble());
    }

    /**
     * Emit a technobabble message if the cooldown has elapsed.
     *
     * @returns true if the message was emitted, false if suppressed by cooldown
     */
    private emitMessage(message: string): boolean {
        if (this.timeSinceLastMessage < COOLDOWN_SECONDS) {
            return false;
        }

        this.timeSinceLastMessage = 0;
        this.eventBus.emit(GameEventType.TECHNOBABBLE_MESSAGE, { message });
        return true;
    }

    private resetPeriodicTimer(): void {
        this.periodicTimer = randomBetween(PERIODIC_MIN_SECONDS, PERIODIC_MAX_SECONDS);
    }
}
