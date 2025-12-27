# Error Handling and Resilience for AI Agents

**Date:** 2025-12-27  
**Category:** Error Handling  
**Priority:** MEDIUM  
**Effort:** Medium  

---

## Executive Summary

Robust error handling is essential for production-grade games and makes code safer for AI agents to modify. This document outlines error handling patterns and resilience strategies.

---

## Current State Assessment

### ✅ Good Foundation

1. **ErrorService** - Centralized error handling exists
2. **GameError Class** - Custom error with codes
3. **Error Logging** - Severity-based logging
4. **Fallback Handlers** - `handleWithFallback` utility

### ⚠️ Areas for Improvement

1. **Inconsistent Usage** - ErrorService not used everywhere
2. **System Error Handling** - Limited try-catch in systems
3. **Recovery Strategies** - Few graceful degradation patterns
4. **User Feedback** - Errors not always shown to user

---

## Recommendations for AI Coding Agents

### 1. Standardize Error Handling in Systems

**Recommendation:** Every ECS system should catch and handle errors.

**Pattern:**
```typescript
// src/systems/combatSystem.ts
import { ErrorService, GameError, GameErrorCode } from '../services';

export function createCombatSystem(particleSystem?: ParticleSystem) {
    return function combatSystem(world: World, delta: number, gameTime: number): World {
        try {
            const turrets = query(world, [Position, Turret, Target, Faction]);
            
            for (const turretEid of turrets) {
                try {
                    processTurret(world, turretEid, delta, gameTime);
                } catch (error) {
                    // Log but continue with other turrets
                    ErrorService.logError(
                        new GameError(
                            GameErrorCode.ENTITY_NOT_FOUND,
                            `Failed to process turret ${turretEid}`,
                            { turretEid, error }
                        ),
                        'warn'
                    );
                }
            }
            
            return world;
        } catch (error) {
            // Critical error in system
            ErrorService.logError(
                error instanceof Error ? error : new GameError(GameErrorCode.UNKNOWN, String(error)),
                'error'
            );
            return world; // Return world unchanged
        }
    };
}
```

**Why Agent-Friendly:**
- Systems don't crash the game loop
- Errors are logged with context
- Individual entity failures don't break all entities

**Action Items:**
- [ ] Add try-catch to all system functions
- [ ] Use entity-level error handling
- [ ] Log with appropriate severity

---

### 2. Expand ErrorService Usage

**Recommendation:** Use ErrorService for all error conditions.

**Pattern:**
```typescript
// Centralized error codes
export enum GameErrorCode {
    // Entity errors
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    ENTITY_NO_COMPONENT = 'ENTITY_NO_COMPONENT',
    ENTITY_INVALID_STATE = 'ENTITY_INVALID_STATE',
    
    // Resource errors
    INSUFFICIENT_RESOURCES = 'INSUFFICIENT_RESOURCES',
    RESOURCE_OVERFLOW = 'RESOURCE_OVERFLOW',
    
    // Placement errors
    PLACEMENT_INVALID = 'PLACEMENT_INVALID',
    PLACEMENT_BLOCKED = 'PLACEMENT_BLOCKED',
    PLACEMENT_OUT_OF_BOUNDS = 'PLACEMENT_OUT_OF_BOUNDS',
    
    // Audio errors
    AUDIO_CONTEXT_FAILED = 'AUDIO_CONTEXT_FAILED',
    AUDIO_BUFFER_FAILED = 'AUDIO_BUFFER_FAILED',
    
    // Rendering errors
    TEXTURE_LOAD_FAILED = 'TEXTURE_LOAD_FAILED',
    SHADER_COMPILE_FAILED = 'SHADER_COMPILE_FAILED',
    WEBGL_LOST = 'WEBGL_LOST',
    
    // Configuration errors
    CONFIG_INVALID = 'CONFIG_INVALID',
    CONFIG_MISSING = 'CONFIG_MISSING',
    
    // Pool errors
    POOL_EXHAUSTED = 'POOL_EXHAUSTED',
    POOL_INVALID_ENTITY = 'POOL_INVALID_ENTITY',
}

// Usage example
if (!hasComponent(world, entityId, Health)) {
    ErrorService.logError(
        new GameError(
            GameErrorCode.ENTITY_NO_COMPONENT,
            `Entity ${entityId} missing Health component`,
            { entityId, requiredComponent: 'Health' }
        ),
        'warn'
    );
    return;
}
```

**Why Agent-Friendly:**
- Standardized error codes
- Rich context for debugging
- Searchable error patterns

**Action Items:**
- [ ] Expand GameErrorCode enum
- [ ] Audit codebase for unhandled errors
- [ ] Add ErrorService calls

---

### 3. Graceful Degradation Strategies

**Recommendation:** Define fallback behaviors for failures.

**Pattern:**
```typescript
// src/services/ResiliencePatterns.ts

/**
 * Retry with exponential backoff.
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 100
): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (attempt < maxRetries - 1) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

/**
 * Graceful degradation with fallback.
 */
export function withDegradation<T>(
    primary: () => T,
    fallback: T,
    onDegrade?: (error: Error) => void
): T {
    try {
        return primary();
    } catch (error) {
        if (onDegrade) {
            onDegrade(error instanceof Error ? error : new Error(String(error)));
        }
        return fallback;
    }
}

// Usage in rendering
const beamColor = withDegradation(
    () => getBeamColorForTurret(turretType),
    0xFFFFFF, // White fallback
    (error) => ErrorService.logError(error, 'warn')
);

// Usage in audio
const audioBuffer = await retryWithBackoff(
    () => audioContext.decodeAudioData(arrayBuffer),
    3, // Try 3 times
    100 // Start with 100ms delay
);
```

**Why Agent-Friendly:**
- Predictable failure behavior
- Game continues despite errors
- Easy to apply patterns

**Action Items:**
- [ ] Create resilience utility module
- [ ] Apply to async operations
- [ ] Document fallback behaviors

---

### 4. Input Validation

**Recommendation:** Validate inputs at function boundaries.

**Pattern:**
```typescript
// src/utils/validation.ts

/**
 * Assertion that throws GameError if condition is false.
 */
export function assertCondition(
    condition: boolean,
    errorCode: GameErrorCode,
    message: string,
    context?: Record<string, unknown>
): asserts condition {
    if (!condition) {
        throw new GameError(errorCode, message, context);
    }
}

/**
 * Validate entity exists and has required components.
 */
export function validateEntity(
    world: World,
    entityId: number,
    requiredComponents: Component[]
): void {
    assertCondition(
        entityId > 0,
        GameErrorCode.ENTITY_INVALID_STATE,
        `Invalid entity ID: ${entityId}`,
        { entityId }
    );
    
    for (const component of requiredComponents) {
        assertCondition(
            hasComponent(world, entityId, component),
            GameErrorCode.ENTITY_NO_COMPONENT,
            `Entity ${entityId} missing required component`,
            { entityId, component: component.name }
        );
    }
}

// Usage
function upgradeTurret(world: World, turretId: number, level: number): void {
    validateEntity(world, turretId, [Turret, TurretUpgrade, Position]);
    
    assertCondition(
        level >= 0 && level <= 3,
        GameErrorCode.CONFIG_INVALID,
        `Invalid upgrade level: ${level}`,
        { turretId, level, validRange: '0-3' }
    );
    
    // Safe to proceed
    TurretUpgrade.damageLevel[turretId] = level;
}
```

**Why Agent-Friendly:**
- Errors caught early with clear messages
- Type assertions help TypeScript
- Context aids debugging

**Action Items:**
- [ ] Create validation utilities
- [ ] Add to public API functions
- [ ] Document validation requirements

---

### 5. Error Boundaries for UI

**Recommendation:** Catch and display UI errors gracefully.

**Pattern:**
```typescript
// src/ui/ErrorBoundary.ts
import { Container, Text } from 'pixi.js';
import { ErrorService, GameError } from '../services';

export class UIErrorBoundary {
    private container: Container;
    private errorText: Text;
    private hasError: boolean = false;

    constructor(private width: number, private height: number) {
        this.container = new Container();
        
        this.errorText = new Text({
            text: '',
            style: {
                fill: 0xFF6600,
                fontSize: 14,
                fontFamily: 'monospace',
            },
        });
        this.errorText.visible = false;
        this.container.addChild(this.errorText);
    }

    /**
     * Wrap a UI update function with error handling.
     */
    wrap<T extends (...args: unknown[]) => void>(
        fn: T,
        componentName: string
    ): T {
        return ((...args: unknown[]) => {
            try {
                fn(...args);
                this.clearError();
            } catch (error) {
                this.handleError(error, componentName);
            }
        }) as T;
    }

    private handleError(error: unknown, componentName: string): void {
        const gameError = error instanceof GameError ? error : 
            new GameError('UI_ERROR', `Error in ${componentName}`, { error });
        
        ErrorService.logError(gameError, 'error');
        
        this.hasError = true;
        this.errorText.text = `UI Error: ${gameError.message}`;
        this.errorText.visible = true;
    }

    private clearError(): void {
        if (this.hasError) {
            this.hasError = false;
            this.errorText.visible = false;
        }
    }
}

// Usage in HUDManager
const errorBoundary = new UIErrorBoundary(1920, 1080);

const safeUpdateWavePanel = errorBoundary.wrap(
    (waveNumber: number) => this.wavePanel.update(waveNumber),
    'WavePanel'
);
```

**Why Agent-Friendly:**
- UI errors don't crash game
- Errors are visible for debugging
- Standard pattern for all UI

**Action Items:**
- [ ] Create UIErrorBoundary class
- [ ] Wrap all UI update methods
- [ ] Add error display styling

---

### 6. Error Recovery and State Reset

**Recommendation:** Provide recovery mechanisms for critical errors.

**Pattern:**
```typescript
// src/core/ErrorRecovery.ts
import { getServices, resetServices } from './services';
import { EventBus, GameEventType } from '../types/events';
import { ErrorService, GameErrorCode } from '../services';

export enum RecoveryAction {
    IGNORE = 'IGNORE',
    RETRY = 'RETRY',
    RESET_ENTITY = 'RESET_ENTITY',
    RESET_SYSTEM = 'RESET_SYSTEM',
    SOFT_RESET = 'SOFT_RESET',
    HARD_RESET = 'HARD_RESET',
}

interface RecoveryStrategy {
    action: RecoveryAction;
    maxAttempts: number;
}

const RECOVERY_STRATEGIES: Record<GameErrorCode, RecoveryStrategy> = {
    [GameErrorCode.ENTITY_NOT_FOUND]: {
        action: RecoveryAction.IGNORE,
        maxAttempts: 1,
    },
    [GameErrorCode.POOL_EXHAUSTED]: {
        action: RecoveryAction.SOFT_RESET,
        maxAttempts: 1,
    },
    [GameErrorCode.WEBGL_LOST]: {
        action: RecoveryAction.HARD_RESET,
        maxAttempts: 2,
    },
    // ... more strategies
};

export function executeRecovery(errorCode: GameErrorCode): void {
    const strategy = RECOVERY_STRATEGIES[errorCode] || { 
        action: RecoveryAction.IGNORE, 
        maxAttempts: 1 
    };
    
    switch (strategy.action) {
        case RecoveryAction.SOFT_RESET:
            // Reset game state without full reload
            EventBus.getInstance().emit(GameEventType.GAME_OVER, { score: 0 });
            break;
            
        case RecoveryAction.HARD_RESET:
            // Full game restart
            resetServices();
            window.location.reload();
            break;
            
        case RecoveryAction.IGNORE:
        default:
            // Log and continue
            break;
    }
}
```

**Why Agent-Friendly:**
- Recovery strategies are explicit
- Different errors get appropriate handling
- Game can self-heal

**Action Items:**
- [ ] Define recovery strategies per error
- [ ] Implement recovery actions
- [ ] Test recovery scenarios

---

### 7. Error Reporting for Production

**Recommendation:** Capture and report errors in production.

**Pattern:**
```typescript
// src/services/ErrorReporter.ts

interface ErrorReport {
    timestamp: string;
    errorCode: string;
    message: string;
    stack?: string;
    context: Record<string, unknown>;
    gameState: {
        waveNumber: number;
        entityCount: number;
        resources: number;
    };
    environment: {
        userAgent: string;
        screenSize: string;
        webGL: boolean;
    };
}

export class ErrorReporter {
    private static instance: ErrorReporter | null = null;
    private errorQueue: ErrorReport[] = [];
    private maxQueueSize = 50;

    static getInstance(): ErrorReporter {
        if (!ErrorReporter.instance) {
            ErrorReporter.instance = new ErrorReporter();
        }
        return ErrorReporter.instance;
    }

    report(error: GameError, gameState: ErrorReport['gameState']): void {
        const report: ErrorReport = {
            timestamp: new Date().toISOString(),
            errorCode: error.code,
            message: error.message,
            stack: error.stack,
            context: error.context || {},
            gameState,
            environment: {
                userAgent: navigator.userAgent,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                webGL: this.checkWebGLSupport(),
            },
        };
        
        this.errorQueue.push(report);
        
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
        
        // In production, could send to analytics
        if (import.meta.env.PROD) {
            // sendToAnalytics(report);
        }
    }

    getErrorHistory(): ErrorReport[] {
        return [...this.errorQueue];
    }

    private checkWebGLSupport(): boolean {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
            return false;
        }
    }
}
```

**Why Agent-Friendly:**
- Errors have full context
- Game state captured at error time
- Environment info helps reproduce

**Action Items:**
- [ ] Create ErrorReporter class
- [ ] Integrate with ErrorService
- [ ] Add game state capture

---

## Implementation Checklist

### Phase 1: System Error Handling (2-3 hours)
- [ ] Add try-catch to all systems
- [ ] Use entity-level error handling
- [ ] Log with appropriate severity

### Phase 2: Validation (2 hours)
- [ ] Create validation utilities
- [ ] Add to public APIs
- [ ] Document validation requirements

### Phase 3: Recovery (3-4 hours)
- [ ] Define recovery strategies
- [ ] Implement recovery actions
- [ ] Test recovery scenarios

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Systems with error handling | ~30% | 100% |
| Error codes defined | ~8 | 20+ |
| Recovery strategies | 0 | Full |
| Production error reporting | None | Complete |

---

## References

- `src/services/ErrorService.ts` - Current implementation
- `src/config/performance.config.ts` - Error log config
- `src/systems/` - Systems to add handling

---

*This document is part of the Kobayashi Maru maintainability initiative.*
