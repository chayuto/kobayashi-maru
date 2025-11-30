# Task 04: Local Storage Service

## Objective
Implement a service to save and load user preferences and high scores.

## Context
We need to persist data across sessions. This service will wrap the browser's `localStorage` API with type safety.

## Requirements

### 1. Storage Service (`src/services/StorageService.ts`)
- **Keys Enum:** `StorageKeys` { HIGH_SCORE, VOLUME_SFX, VOLUME_MUSIC, KEY_BINDINGS }
- **Methods:**
  - `save<T>(key: string, data: T): void`
  - `load<T>(key: string, defaultValue: T): T`
  - `clear(key: string): void`
  - `has(key: string): boolean`

### 2. Error Handling
- Handle cases where `localStorage` is not available (e.g., private browsing) gracefully (use in-memory fallback).

## Acceptance Criteria
- [ ] Data can be saved and retrieved.
- [ ] Types are preserved (JSON serialization/deserialization).
- [ ] Fallback mechanism works if LocalStorage is disabled.
- [ ] Unit tests for the service.

## Files to Create/Modify
- `src/services/StorageService.ts`
