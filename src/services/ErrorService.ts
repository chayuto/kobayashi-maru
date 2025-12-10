/**
 * Error Service for Kobayashi Maru
 * 
 * Centralized error handling and logging.
 * Provides consistent error handling patterns across the codebase.
 * 
 * @module services/ErrorService
 * 
 * @example
 * ```typescript
 * import { ErrorService, GameError } from '../services';
 * 
 * // Log an error
 * ErrorService.logError(new GameError('ENTITY_NOT_FOUND', 'Entity 123 not found'));
 * 
 * // Handle with recovery
 * const result = ErrorService.handleWithFallback(
 *   () => riskyOperation(),
 *   defaultValue
 * );
 * ```
 */

import { PERFORMANCE_CONFIG } from '../config';

/**
 * Error codes for game-specific errors.
 */
export enum GameErrorCode {
    /** Entity not found in world */
    ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
    /** Component not found on entity */
    COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
    /** Invalid configuration */
    INVALID_CONFIG = 'INVALID_CONFIG',
    /** Resource loading failed */
    RESOURCE_LOAD_FAILED = 'RESOURCE_LOAD_FAILED',
    /** Audio playback failed */
    AUDIO_FAILED = 'AUDIO_FAILED',
    /** System initialization failed */
    SYSTEM_INIT_FAILED = 'SYSTEM_INIT_FAILED',
    /** Pool exhausted */
    POOL_EXHAUSTED = 'POOL_EXHAUSTED',
    /** Unknown error */
    UNKNOWN = 'UNKNOWN',
}

/**
 * Custom game error with code and context.
 */
export class GameError extends Error {
    constructor(
        public readonly code: GameErrorCode | string,
        message: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'GameError';
    }
}

/**
 * Error severity levels.
 */
export type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Error log entry.
 */
interface ErrorLogEntry {
    timestamp: number;
    severity: ErrorSeverity;
    code: string;
    message: string;
    context?: Record<string, unknown>;
}

/**
 * ErrorService provides centralized error handling.
 */
export class ErrorService {
    private static errorLog: ErrorLogEntry[] = [];
    private static maxLogSize = PERFORMANCE_CONFIG.ERROR_LOG.MAX_SIZE;
    private static onErrorCallbacks: ((entry: ErrorLogEntry) => void)[] = [];

    /**
     * Log an error with optional context.
     */
    static logError(
        error: Error | GameError,
        severity: ErrorSeverity = 'error',
        context?: Record<string, unknown>
    ): void {
        const entry: ErrorLogEntry = {
            timestamp: Date.now(),
            severity,
            code: error instanceof GameError ? error.code : 'UNKNOWN',
            message: error.message,
            context: error instanceof GameError ? { ...error.context, ...context } : context,
        };

        ErrorService.errorLog.push(entry);

        // Trim log if too large
        if (ErrorService.errorLog.length > ErrorService.maxLogSize) {
            ErrorService.errorLog = ErrorService.errorLog.slice(-ErrorService.maxLogSize);
        }

        // Notify callbacks
        for (const callback of ErrorService.onErrorCallbacks) {
            try {
                callback(entry);
            } catch {
                // Ignore errors in error handlers
            }
        }

        // Console output based on severity
        switch (severity) {
            case 'debug':
                console.debug(`[${entry.code}]`, entry.message, entry.context);
                break;
            case 'info':
                console.info(`[${entry.code}]`, entry.message, entry.context);
                break;
            case 'warn':
                console.warn(`[${entry.code}]`, entry.message, entry.context);
                break;
            case 'error':
            case 'fatal':
                console.error(`[${entry.code}]`, entry.message, entry.context);
                break;
        }
    }

    /**
     * Execute a function with error handling and fallback.
     */
    static handleWithFallback<T>(
        fn: () => T,
        fallback: T,
        errorCode: GameErrorCode = GameErrorCode.UNKNOWN
    ): T {
        try {
            return fn();
        } catch (error) {
            ErrorService.logError(
                error instanceof Error
                    ? error
                    : new GameError(errorCode, String(error)),
                'error'
            );
            return fallback;
        }
    }

    /**
     * Execute an async function with error handling and fallback.
     */
    static async handleAsyncWithFallback<T>(
        fn: () => Promise<T>,
        fallback: T,
        errorCode: GameErrorCode = GameErrorCode.UNKNOWN
    ): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            ErrorService.logError(
                error instanceof Error
                    ? error
                    : new GameError(errorCode, String(error)),
                'error'
            );
            return fallback;
        }
    }

    /**
     * Register a callback for when errors occur.
     */
    static onError(callback: (entry: ErrorLogEntry) => void): void {
        ErrorService.onErrorCallbacks.push(callback);
    }

    /**
     * Get recent error log.
     */
    static getRecentErrors(count: number = 10): ErrorLogEntry[] {
        return ErrorService.errorLog.slice(-count);
    }

    /**
     * Clear error log.
     */
    static clearLog(): void {
        ErrorService.errorLog = [];
    }
}
