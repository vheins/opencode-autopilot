# Feature: State Persistence

## Header & Navigation
- [API Doc](../api/cli.md)
- [Testing Doc](../../testing/overview.md)

## Description
Session state is persisted via the `@vheins/local-memory-mcp` MCP server between iterations, enabling recovery after terminal closure, system restart, or tool switching.

## User Story
As a developer, I want AUTOPILOT to remember my session context across terminal restarts, so I don't lose progress on complex features.

## Implementation
- **Backend**: `@vheins/local-memory-mcp` (SQLite-backed MCP server)
- **Integration**: `MCPClient` wrapper spawns the MCP server as a subprocess via `npx` during the `config` hook
- **Session persistence**: Sessions stored as MCP tasks (`task-create`, `task-update`, `task-list`)
- **Durable knowledge**: Memories stored via `memory-store` (code facts with tags and semantic search)
- **Local cache**: In-memory `Map<string, Session>` provides fast read access; writes are synced to MCP
- **Save trigger**: After each session create/update operation
- **Recovery**: On `config` hook, `listSessions()` restores active sessions from MCP

## API
- CLI: `autopilot resume [session-id]`
- CLI: `autopilot sessions`

## Related Tests
- Unit: `test/unit/state-persistence.test.ts`
- Integration: `test/integration/session-lifecycle.test.ts`

## See Also
- [CLI API Reference](../api/cli.md)
- [Testing Guide](../../testing/overview.md)
