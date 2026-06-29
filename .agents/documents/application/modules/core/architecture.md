# Module: Core Architecture

## Header & Navigation
- [API Doc](../api/cli.md)
- [Testing Doc](../../testing/overview.md)

## Overview
The AUTOPILOT core module implements the iteration loop FSM (Plan → Code → Review → Test → Commit) with persistent state, supervised approval, and quality gates.

## Components
- **Session Manager**: Create, resume, list, delete sessions
- **Iteration Engine**: FSM state machine for iteration steps
- **Provider Abstraction**: AI model API communication layer
- **Quality Gate Runner**: Linter and test execution
- **State Persistence**: Disk-based session snapshots
- **Backpressure Handler**: API rate limit management

## Plugin Integration

AUTOPILOT uses opencode's plugin API from `@opencode-ai/plugin`. The plugin function receives `PluginInput`:

```ts
import type { Plugin } from "@opencode-ai/plugin"

interface PluginInput {
  client: Client       // opencode client instance
  project: string      // project path
  directory: string    // plugin data directory
  $: Shell             // shell command helper
  worktree: string     // git worktree root
  serverUrl: string    // opencode server URL
}
```

The plugin is published to npm as `@vheins/opencode-autopilot`. When added to the `plugin` array in `opencode.json`, opencode auto-installs it via Bun at startup — no manual `npm install` required.

## Components (Hook Mapping)

| Component | Hook Used | Purpose |
|---|---|---|
| **Session Manager** | `config` | Initialize on plugin load, restore persisted sessions |
| **Iteration Engine** | `tool: { autopilot_iterate }` | Custom tool driving the Plan→Code→Review→Test→Commit FSM |
| **Provider Abstraction** | `chat.params` / `provider` | Mutate AI provider params or provide a custom provider |
| **Quality Gate Runner** | `tool.execute.after` / child_process | Run linters/tests after code-gen tools |
| **State Persistence** | `directory` (PluginInput) | Read/write JSON snapshots to plugin data directory |
| **Backpressure Handler** | Internal (config) | Rate-limit tracking using config-observed API limits |

## Dependencies
- `@opencode-ai/plugin` — Plugin type and hooks
- `zlib` (built-in) — State compression
- `crypto` (built-in) — SHA256 integrity checks

## See Also
- [CLI API Reference](../api/cli.md)
- [Testing Guide](../../testing/overview.md)
