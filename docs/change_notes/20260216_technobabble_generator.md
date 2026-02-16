# Technobabble Generator (U2)

**Date:** 2026-02-16
**Feature:** Star Trek-style technobabble message generator for immersion

## Summary

Added a TechnobabbleGenerator service that produces Star Trek-style flavor text
messages and feeds them into the game's message log. Messages are triggered by
game events (wave start/complete, alert level changes) and also fire periodically
on a random 8-15 second timer to provide ambient bridge chatter.

## Files Changed

### New Files
- `src/game/TechnobabbleGenerator.ts` - Core generator class with template system, event subscriptions, periodic timer, and cooldown logic
- `src/__tests__/TechnobabbleGenerator.test.ts` - 17 tests covering generation, event triggers, cooldown, periodic messages, and lifecycle

### Modified Files
- `src/types/events.ts` - Added `TECHNOBABBLE_MESSAGE` to `GameEventType` enum, `TechnobabbleMessagePayload` interface, and `GameEventMap` entry
- `src/core/services/ServiceContainer.ts` - Added `technobabbleGenerator: TechnobabbleGenerator` to `ServiceRegistry` and type import
- `src/core/bootstrap/GameBootstrap.ts` - Registered `technobabbleGenerator` service factory with `init()` call
- `src/core/Game.ts` - Wired `technobabbleGenerator.update(dt)` in gameplay loop callback; subscribed to `TECHNOBABBLE_MESSAGE` events to pipe messages into UIController's message log; eagerly initialized service in `startGame()`
- `src/game/index.ts` - Added barrel export for `TechnobabbleGenerator`

## Design Decisions

- **Template system:** Four word banks (operations, modifiers, components, statuses) combine to produce 10,000 unique message permutations
- **Event-specific pools:** Curated message lists for wave start, wave complete, and each alert level to provide contextually appropriate messages
- **5-second cooldown:** Prevents message spam when multiple events fire in quick succession
- **8-15 second periodic timer:** Provides ambient bridge chatter between events
- **Lazy initialization:** Service is registered in GameBootstrap but only activated when `startGame()` runs

## Validation

- `npm run lint` - passes
- `npm run test` - 2498 tests pass (17 new)
- `npm run build` - succeeds
