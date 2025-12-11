/**
 * Tests for ErrorService
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorService, GameError, GameErrorCode } from '../services/ErrorService';

describe('ErrorService', () => {
    beforeEach(() => {
        // Clear error log before each test
        ErrorService.clearLog();
        // Silence console output during tests
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'info').mockImplementation(() => { });
        vi.spyOn(console, 'debug').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('GameError', () => {
        it('should create GameError with code and message', () => {
            const error = new GameError(GameErrorCode.ENTITY_NOT_FOUND, 'Entity 123 not found');

            expect(error.code).toBe(GameErrorCode.ENTITY_NOT_FOUND);
            expect(error.message).toBe('Entity 123 not found');
            expect(error.name).toBe('GameError');
            expect(error.context).toBeUndefined();
        });

        it('should create GameError with context', () => {
            const error = new GameError(
                GameErrorCode.COMPONENT_NOT_FOUND,
                'Component missing',
                { entityId: 42, componentName: 'Health' }
            );

            expect(error.context).toEqual({ entityId: 42, componentName: 'Health' });
        });

        it('should create GameError with custom string code', () => {
            const error = new GameError('CUSTOM_ERROR', 'Custom error occurred');
            expect(error.code).toBe('CUSTOM_ERROR');
        });
    });

    describe('logError', () => {
        it('should log GameError and add to error log', () => {
            const error = new GameError(GameErrorCode.AUDIO_FAILED, 'Sound not found');

            ErrorService.logError(error);

            const recentErrors = ErrorService.getRecentErrors(1);
            expect(recentErrors).toHaveLength(1);
            expect(recentErrors[0].code).toBe(GameErrorCode.AUDIO_FAILED);
            expect(recentErrors[0].message).toBe('Sound not found');
            expect(recentErrors[0].severity).toBe('error');
        });

        it('should log regular Error as UNKNOWN code', () => {
            const error = new Error('Something went wrong');

            ErrorService.logError(error);

            const recentErrors = ErrorService.getRecentErrors(1);
            expect(recentErrors[0].code).toBe('UNKNOWN');
        });

        it('should merge context from GameError and additional context', () => {
            const error = new GameError(
                GameErrorCode.POOL_EXHAUSTED,
                'Pool empty',
                { poolType: 'enemy' }
            );

            ErrorService.logError(error, 'warn', { additionalInfo: 'test' });

            const recentErrors = ErrorService.getRecentErrors(1);
            expect(recentErrors[0].context).toEqual({
                poolType: 'enemy',
                additionalInfo: 'test'
            });
        });

        it('should log with different severity levels', () => {
            ErrorService.logError(new Error('debug'), 'debug');
            ErrorService.logError(new Error('info'), 'info');
            ErrorService.logError(new Error('warn'), 'warn');
            ErrorService.logError(new Error('error'), 'error');
            ErrorService.logError(new Error('fatal'), 'fatal');

            expect(console.debug).toHaveBeenCalled();
            expect(console.info).toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledTimes(2); // error + fatal
        });

        it('should include timestamp in log entry', () => {
            const before = Date.now();
            ErrorService.logError(new Error('test'));
            const after = Date.now();

            const recentErrors = ErrorService.getRecentErrors(1);
            expect(recentErrors[0].timestamp).toBeGreaterThanOrEqual(before);
            expect(recentErrors[0].timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('handleWithFallback', () => {
        it('should return function result on success', () => {
            const result = ErrorService.handleWithFallback(
                () => 42,
                0
            );

            expect(result).toBe(42);
        });

        it('should return fallback on error', () => {
            const result = ErrorService.handleWithFallback(
                () => { throw new Error('oops'); },
                'fallback'
            );

            expect(result).toBe('fallback');
        });

        it('should log error when using fallback', () => {
            ErrorService.handleWithFallback(
                () => { throw new Error('handled error'); },
                null
            );

            const recentErrors = ErrorService.getRecentErrors(1);
            expect(recentErrors).toHaveLength(1);
            expect(recentErrors[0].message).toBe('handled error');
        });

        it('should use custom error code for non-Error throws', () => {
            ErrorService.handleWithFallback(
                () => { throw 'string error'; },
                null,
                GameErrorCode.INVALID_CONFIG
            );

            const recentErrors = ErrorService.getRecentErrors(1);
            expect(recentErrors[0].code).toBe(GameErrorCode.INVALID_CONFIG);
        });
    });

    describe('handleAsyncWithFallback', () => {
        it('should return async function result on success', async () => {
            const result = await ErrorService.handleAsyncWithFallback(
                async () => 'async result',
                'fallback'
            );

            expect(result).toBe('async result');
        });

        it('should return fallback on async error', async () => {
            const result = await ErrorService.handleAsyncWithFallback(
                async () => { throw new Error('async oops'); },
                'async fallback'
            );

            expect(result).toBe('async fallback');
        });

        it('should log async error when using fallback', async () => {
            await ErrorService.handleAsyncWithFallback(
                async () => { throw new Error('async handled'); },
                null
            );

            const recentErrors = ErrorService.getRecentErrors(1);
            expect(recentErrors[0].message).toBe('async handled');
        });

        it('should handle rejected promises', async () => {
            const result = await ErrorService.handleAsyncWithFallback(
                () => Promise.reject(new Error('rejected')),
                'caught'
            );

            expect(result).toBe('caught');
        });
    });

    describe('onError callback', () => {
        it('should call registered callback when error is logged', () => {
            const callback = vi.fn();
            ErrorService.onError(callback);

            ErrorService.logError(new GameError(GameErrorCode.SYSTEM_INIT_FAILED, 'Init failed'));

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                code: GameErrorCode.SYSTEM_INIT_FAILED,
                message: 'Init failed'
            }));
        });

        it('should handle callback that throws', () => {
            ErrorService.onError(() => { throw new Error('callback error'); });

            // Should not throw
            expect(() => {
                ErrorService.logError(new Error('test'));
            }).not.toThrow();
        });
    });

    describe('getRecentErrors', () => {
        it('should return empty array when no errors', () => {
            expect(ErrorService.getRecentErrors()).toEqual([]);
        });

        it('should return last N errors', () => {
            ErrorService.logError(new Error('first'));
            ErrorService.logError(new Error('second'));
            ErrorService.logError(new Error('third'));

            const recent = ErrorService.getRecentErrors(2);
            expect(recent).toHaveLength(2);
            expect(recent[0].message).toBe('second');
            expect(recent[1].message).toBe('third');
        });
    });

    describe('clearLog', () => {
        it('should clear all logged errors', () => {
            ErrorService.logError(new Error('error 1'));
            ErrorService.logError(new Error('error 2'));

            ErrorService.clearLog();

            expect(ErrorService.getRecentErrors()).toEqual([]);
        });
    });
});
