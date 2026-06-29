# Feature: Backpressure

## Header & Navigation
- [API Doc](../api/cli.md)
- [Testing Doc](../../testing/overview.md)

## Description
AUTOPILOT handles AI provider API rate limits gracefully with exponential backoff, retry logic, and user notification when retries are exhausted.

## User Story
As a developer using free/rate-limited API tiers, I want AUTOPILOT to handle 429 errors automatically so I don't lose session progress.

## Implementation
- Exponential backoff: 1s → 2s → 4s (base × 2^n)
- Max retries: 3 per API call
- On exhaustion: Session paused, user notified with recovery options

## API
- Config: `autopilot config set maxRetries 5`
- Config: `autopilot config set backoffBaseMs 1000`

## Related Tests
- Unit: `test/unit/backpressure.test.ts`
- Chaos: `test/chaos/rate-limit-storm.test.ts`

## See Also
- [CLI API Reference](../api/cli.md)
- [Testing Guide](../../testing/overview.md)
