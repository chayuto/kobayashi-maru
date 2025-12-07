# Refactoring Task: Error Handling Patterns

**Date:** 2025-12-07  
**Priority:** MEDIUM  
**Estimated Effort:** 2 days  
**AI Friendliness Impact:** MEDIUM

---

## Problem Statement

The codebase has minimal structured error handling. This causes issues for AI because:

- Unclear what can fail and how to handle it
- Silent failures make debugging difficult
- No consistent pattern for error recovery
- Missing input validation leads to runtime crashes

### Current Error Handling Status

From the November 2025 audit:
- Minimal try/catch blocks throughout
- No input validation on public functions
- No fallback strategies for failures
- Silent failures in many areas
- No centralized error reporting

---

## Recommended Actions

### 1. Create Error Types Hierarchy

```typescript
// src/core/errors.ts

/**
 * Base error class for all game errors.
 */
export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'GameError';
  }
}

/**
 * Error during entity operations.
 */
export class EntityError extends GameError {
  constructor(
    message: string,
    public readonly entityId?: number
  ) {
    super(message, 'ENTITY_ERROR', true);
    this.name = 'EntityError';
  }
}

/**
 * Error during system execution.
 */
export class SystemError extends GameError {
  constructor(
    message: string,
    public readonly systemName: string
  ) {
    super(message, 'SYSTEM_ERROR', true);
    this.name = 'SystemError';
  }
}

/**
 * Error during resource loading.
 */
export class ResourceError extends GameError {
  constructor(
    message: string,
    public readonly resourcePath?: string
  ) {
    super(message, 'RESOURCE_ERROR', true);
    this.name = 'ResourceError';
  }
}

/**
 * Error due to invalid configuration.
 */
export class ConfigError extends GameError {
  constructor(
    message: string,
    public readonly configKey?: string
  ) {
    super(message, 'CONFIG_ERROR', false);
    this.name = 'ConfigError';
  }
}

/**
 * Error during audio operations.
 */
export class AudioError extends GameError {
  constructor(message: string) {
    super(message, 'AUDIO_ERROR', true);
    this.name = 'AudioError';
  }
}
```

### 2. Create Error Handler Utility

```typescript
// src/core/ErrorHandler.ts

import { GameError } from './errors';

export interface ErrorContext {
  component?: string;
  action?: string;
  data?: Record<string, unknown>;
}

/**
 * Centralized error handling and reporting.
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private listeners: Set<(error: GameError, context: ErrorContext) => void> = new Set();
  private errorLog: Array<{ error: GameError; context: ErrorContext; timestamp: number }> = [];
  private maxLogSize = 100;
  
  static getInstance(): ErrorHandler {
    if (!this.instance) {
      this.instance = new ErrorHandler();
    }
    return this.instance;
  }
  
  /**
   * Handle an error with optional recovery.
   * 
   * @param error - The error to handle
   * @param context - Additional context about where/why error occurred
   * @param fallback - Optional fallback value or function to call
   * @returns The fallback value if provided
   */
  handle<T>(
    error: Error,
    context: ErrorContext,
    fallback?: T | (() => T)
  ): T | undefined {
    const gameError = this.normalizeError(error);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(
        `[${gameError.code}] ${context.component || 'Unknown'}:`,
        gameError.message,
        context
      );
    }
    
    // Store in error log
    this.addToLog(gameError, context);
    
    // Notify listeners
    this.notifyListeners(gameError, context);
    
    // Non-recoverable errors should be thrown
    if (!gameError.recoverable) {
      throw gameError;
    }
    
    // Return fallback if provided
    if (fallback !== undefined) {
      return typeof fallback === 'function' 
        ? (fallback as () => T)() 
        : fallback;
    }
    
    return undefined;
  }
  
  /**
   * Wrap an async operation with error handling.
   */
  async wrapAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      return this.handle(error as Error, context, fallback);
    }
  }
  
  /**
   * Add a listener for error events.
   */
  onError(listener: (error: GameError, context: ErrorContext) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Get recent errors for debugging.
   */
  getRecentErrors(count = 10): typeof this.errorLog {
    return this.errorLog.slice(-count);
  }
  
  private normalizeError(error: Error): GameError {
    if (error instanceof GameError) {
      return error;
    }
    return new GameError(error.message, 'UNKNOWN_ERROR', true);
  }
  
  private addToLog(error: GameError, context: ErrorContext): void {
    this.errorLog.push({
      error,
      context,
      timestamp: Date.now(),
    });
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }
  
  private notifyListeners(error: GameError, context: ErrorContext): void {
    for (const listener of this.listeners) {
      try {
        listener(error, context);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    }
  }
}
```

### 3. Add Input Validation Helpers

```typescript
// src/utils/validation.ts

import { ConfigError } from '../core/errors';

/**
 * Validates that a value is defined (not null or undefined).
 */
export function assertDefined<T>(
  value: T | null | undefined,
  name: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new ConfigError(`${name} is required but was ${value}`, name);
  }
}

/**
 * Validates that a number is within range.
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  name: string
): void {
  if (value < min || value > max) {
    throw new ConfigError(
      `${name} must be between ${min} and ${max}, got ${value}`,
      name
    );
  }
}

/**
 * Validates that a value is one of allowed options.
 */
export function assertOneOf<T>(
  value: T,
  allowed: readonly T[],
  name: string
): void {
  if (!allowed.includes(value)) {
    throw new ConfigError(
      `${name} must be one of [${allowed.join(', ')}], got ${value}`,
      name
    );
  }
}

/**
 * Validates entity ID is valid.
 */
export function assertValidEntity(
  eid: number,
  context: string
): void {
  if (!Number.isInteger(eid) || eid < 0) {
    throw new ConfigError(
      `Invalid entity ID in ${context}: ${eid}`,
      'entityId'
    );
  }
}

/**
 * Safe wrapper that returns undefined on validation failure.
 */
export function safeValidate<T>(
  validator: () => T,
  fallback?: T
): T | undefined {
  try {
    return validator();
  } catch (error) {
    return fallback;
  }
}
```

### 4. Apply Error Handling to Key Areas

**System Execution:**
```typescript
// src/systems/SystemManager.ts

run(world: IWorld, ctx: SystemContext): IWorld {
  let currentWorld = world;
  
  for (const system of this.sortedSystems) {
    if (!system.enabled) continue;
    
    try {
      const result = system.update(currentWorld, ctx);
      if (result) {
        currentWorld = result;
      }
    } catch (error) {
      ErrorHandler.getInstance().handle(
        error as Error,
        {
          component: 'SystemManager',
          action: 'runSystem',
          data: { systemName: system.name }
        }
      );
      // Continue with other systems
    }
  }
  
  return currentWorld;
}
```

**Entity Creation:**
```typescript
// src/ecs/genericFactory.ts

export function createFromTemplate(
  world: GameWorld,
  template: EntityTemplate,
  x: number,
  y: number
): number {
  // Validate inputs
  assertDefined(template, 'template');
  assertInRange(x, 0, GAME_CONFIG.WORLD.WIDTH, 'x');
  assertInRange(y, 0, GAME_CONFIG.WORLD.HEIGHT, 'y');
  
  try {
    const eid = template.poolCategory
      ? EntityPool.alloc(world, template.poolCategory)
      : addEntity(world);
    
    // ... rest of creation logic
    
    return eid;
  } catch (error) {
    return ErrorHandler.getInstance().handle(
      error as Error,
      {
        component: 'EntityFactory',
        action: 'createFromTemplate',
        data: { templateId: template.id, x, y }
      },
      -1 // Return invalid entity ID as fallback
    ) ?? -1;
  }
}
```

**Audio Operations:**
```typescript
// src/audio/AudioManager.ts

play(soundType: SoundType, options?: PlayOptions): void {
  if (!this.initialized) {
    console.warn('AudioManager not initialized, skipping sound');
    return;
  }
  
  try {
    const sound = this.sounds.get(soundType);
    if (!sound) {
      throw new AudioError(`Unknown sound type: ${soundType}`);
    }
    
    // Play sound...
  } catch (error) {
    ErrorHandler.getInstance().handle(
      error as Error,
      {
        component: 'AudioManager',
        action: 'play',
        data: { soundType }
      }
      // No fallback - audio failure is silent
    );
  }
}
```

---

## Error Recovery Strategies

| Error Type | Strategy |
|------------|----------|
| Entity creation fails | Return -1, skip entity |
| System update fails | Log error, continue other systems |
| Audio fails | Silent fail, game continues |
| Texture fails | Use placeholder texture |
| JSON parse fails | Use default config |
| Storage fails | Use in-memory fallback |

---

## Verification

- [ ] All public APIs have input validation
- [ ] Try/catch around external operations (audio, storage)
- [ ] ErrorHandler logs errors in development
- [ ] Recoverable errors don't crash the game
- [ ] Non-recoverable errors throw with clear message

---

## Dependencies

- Should be done after type centralization (uses error types)
- Can be done in parallel with other tasks
