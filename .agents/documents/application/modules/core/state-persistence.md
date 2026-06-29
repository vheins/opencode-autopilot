# Feature: State Persistence

## Header & Navigation
- [API Doc](../api/cli.md)
- [Testing Doc](../../testing/overview.md)

## Description
Session state is persisted to disk between iterations, enabling recovery after terminal closure, system restart, or tool switching.

## User Story
As a developer, I want AUTOPILOT to remember my session context across terminal restarts, so I don't lose progress on complex features.

## Implementation
- State format: JSON + zlib compression + SHA256 integrity hash
- Storage: `.autopilot/sessions/{uuid}.json.zlib`
- Save trigger: After each completed iteration step
- Recovery: On `autopilot resume`, latest snapshot loaded

## API
- CLI: `autopilot resume [session-id]`
- CLI: `autopilot sessions`

## Related Tests
- Unit: `test/unit/state-persistence.test.ts`
- Integration: `test/integration/session-lifecycle.test.ts`

## See Also
- [CLI API Reference](../api/cli.md)
- [Testing Guide](../../testing/overview.md)
