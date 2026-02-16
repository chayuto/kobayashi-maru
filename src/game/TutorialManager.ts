/**
 * Tutorial Manager for Kobayashi Maru
 *
 * Manages progressive disclosure tutorial for first-time players.
 * Steps are triggered by wave events and auto-advance based on timing.
 * Completion state is persisted to localStorage.
 *
 * @module game/TutorialManager
 */

import { EventBus } from '../core/EventBus';
import {
  GameEventType,
  WaveStartedPayload,
  TutorialStep,
} from '../types/events';
import { UI_CONFIG } from '../config/ui.config';

/**
 * Tutorial step definitions.
 * Each step is triggered when the specified wave begins.
 */
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    message:
      'Welcome, Commander. Select a turret from the menu and place it to defend the Kobayashi Maru.',
    triggerWave: 1,
    duration: 8,
    position: 'center',
  },
  {
    id: 1,
    message:
      'Turrets fire automatically at enemies in range. Place them strategically around the ship.',
    triggerWave: 1,
    duration: 6,
    position: 'top',
  },
  {
    id: 2,
    message:
      'Click on a placed turret to upgrade or sell it. Upgraded turrets deal more damage.',
    triggerWave: 2,
    duration: 6,
    position: 'top',
  },
  {
    id: 3,
    message:
      'Different weapons are effective against different enemy factions. Experiment with turret types!',
    triggerWave: 3,
    duration: 6,
    position: 'top',
  },
];

/**
 * Manages tutorial state and progression for first-time players.
 */
export class TutorialManager {
  private completed: boolean = false;
  private currentStep: number = 0;
  private active: boolean = false;
  private stepTimer: number = 0;
  private stepShowing: boolean = false;
  private delayTimer: number = 0;
  private pendingStepIndex: number = -1;
  private eventBus: EventBus;

  private boundWaveHandler: (payload: WaveStartedPayload) => void;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.boundWaveHandler = this.handleWaveStarted.bind(this);

    // Load completion state from localStorage
    this.loadCompletionState();
  }

  /**
   * Check if tutorial should run (first-time player).
   */
  shouldShowTutorial(): boolean {
    return !this.completed;
  }

  /**
   * Start the tutorial.
   */
  start(): void {
    if (this.completed) return;
    this.active = true;
    this.currentStep = 0;
    this.stepTimer = 0;
    this.stepShowing = false;
    this.delayTimer = 0;
    this.pendingStepIndex = -1;
  }

  /**
   * Subscribe to game events for progression.
   */
  init(): void {
    this.eventBus.on(GameEventType.WAVE_STARTED, this.boundWaveHandler);
  }

  /**
   * Handle wave started events to trigger tutorial steps.
   */
  private handleWaveStarted(payload: WaveStartedPayload): void {
    if (!this.active) return;

    const waveNumber = payload.waveNumber;

    // Find all steps that match this wave and haven't been shown yet
    for (let i = this.currentStep; i < TUTORIAL_STEPS.length; i++) {
      const step = TUTORIAL_STEPS[i];
      if (step.triggerWave === waveNumber) {
        if (i === this.currentStep) {
          // Show the first matching step (with delay for wave 1 initial step)
          if (i === 0) {
            this.delayTimer = UI_CONFIG.TUTORIAL.INITIAL_DELAY;
            this.pendingStepIndex = i;
          } else {
            this.showStep(i);
          }
        }
        break;
      }
    }
  }

  /**
   * Show a tutorial step.
   */
  private showStep(index: number): void {
    if (index >= TUTORIAL_STEPS.length) return;

    const step = TUTORIAL_STEPS[index];
    this.currentStep = index;
    this.stepTimer = step.duration;
    this.stepShowing = true;
    this.pendingStepIndex = -1;

    this.eventBus.emit(GameEventType.TUTORIAL_STEP, { step });
  }

  /**
   * Update tutorial state (check if current step should auto-advance).
   *
   * @param deltaTime - Time elapsed since last update in seconds
   */
  update(deltaTime: number): void {
    if (!this.active) return;

    // Handle pending step delay
    if (this.pendingStepIndex >= 0) {
      this.delayTimer -= deltaTime;
      if (this.delayTimer <= 0) {
        this.showStep(this.pendingStepIndex);
      }
      return;
    }

    // Handle step timer countdown
    if (this.stepShowing && this.stepTimer > 0) {
      this.stepTimer -= deltaTime;
      if (this.stepTimer <= 0) {
        this.stepShowing = false;
        this.advanceStep();
      }
    }
  }

  /**
   * Advance to the next step or complete the tutorial.
   */
  private advanceStep(): void {
    const nextIndex = this.currentStep + 1;

    if (nextIndex >= TUTORIAL_STEPS.length) {
      // All steps shown, complete the tutorial
      this.complete();
      return;
    }

    // Check if the next step is for the same wave
    const nextStep = TUTORIAL_STEPS[nextIndex];
    const currentStep = TUTORIAL_STEPS[this.currentStep];

    if (nextStep.triggerWave === currentStep.triggerWave) {
      // Same wave, show next step after a brief pause
      this.delayTimer = 0.5;
      this.pendingStepIndex = nextIndex;
    } else {
      // Different wave, wait for wave event
      this.currentStep = nextIndex;
    }
  }

  /**
   * Get current tutorial step info.
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.active || !this.stepShowing) return null;
    if (this.currentStep >= TUTORIAL_STEPS.length) return null;
    return TUTORIAL_STEPS[this.currentStep];
  }

  /**
   * Check if tutorial is currently active.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Mark tutorial as complete (persists to localStorage).
   */
  complete(): void {
    this.active = false;
    this.completed = true;
    this.stepShowing = false;
    this.persistCompletionState();

    this.eventBus.emit(GameEventType.TUTORIAL_COMPLETE, { skipped: false });
  }

  /**
   * Skip tutorial entirely.
   */
  skip(): void {
    this.active = false;
    this.completed = true;
    this.stepShowing = false;
    this.persistCompletionState();

    this.eventBus.emit(GameEventType.TUTORIAL_COMPLETE, { skipped: true });
  }

  /**
   * Reset tutorial state (for testing or replaying).
   */
  reset(): void {
    this.active = false;
    this.completed = false;
    this.currentStep = 0;
    this.stepTimer = 0;
    this.stepShowing = false;
    this.delayTimer = 0;
    this.pendingStepIndex = -1;

    try {
      localStorage.removeItem(UI_CONFIG.TUTORIAL.STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Clean up event subscriptions.
   */
  destroy(): void {
    this.eventBus.off(GameEventType.WAVE_STARTED, this.boundWaveHandler);
    this.active = false;
  }

  /**
   * Load completion state from localStorage.
   */
  private loadCompletionState(): void {
    try {
      const stored = localStorage.getItem(UI_CONFIG.TUTORIAL.STORAGE_KEY);
      this.completed = stored === 'true';
    } catch {
      this.completed = false;
    }
  }

  /**
   * Persist completion state to localStorage.
   */
  private persistCompletionState(): void {
    try {
      localStorage.setItem(UI_CONFIG.TUTORIAL.STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage errors
    }
  }
}
