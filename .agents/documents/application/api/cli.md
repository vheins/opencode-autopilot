# CLI API Reference: AUTOPILOT Plugin

## 1. Global Standards

AUTOPILOT follows JSON:API-inspired conventions for its CLI interface:

- **Command Structure**: `autopilot <verb> [arguments]` — consistent verb-noun pattern
- **Output Format**: Tabular text for lists, structured text with labels for details
- **Exit Codes**: 0 (success), 1 (general error), 2 (invalid arguments), 3 (session not found)
- **Environment Variables**: `AUTOPILOT_API_KEY`, `AUTOPILOT_MODEL`, `AUTOPILOT_MAX_RETRIES`
- **Configuration**: Runtime settings managed via `autopilot config` subcommands
- **REST Conventions**: Internal API layer follows RESTful resource patterns (sessions, config)

## 2. Plugin Registration

AUTOPILOT is registered as an opencode plugin either by auto-detection or explicit configuration.

### Auto-detection
Place the plugin file at `.opencode/plugin/autopilot.ts` inside the project root — opencode auto-loads it.

### Explicit registration
Add to `opencode.json` (or `opencode.jsonc`):

```json
{
  "plugin": ["@vheins/opencode-autopilot"]
}
```

> **Note**: opencode auto-installs npm plugins via Bun at startup. Packages are cached in `~/.cache/opencode/node_modules/`. No user-side `npm install` is required.

## 3. Implementation

The plugin module exports a named function following the `Plugin` type from `@opencode-ai/plugin`:

```ts
import type { Plugin } from "@opencode-ai/plugin"

export const autopilot: Plugin = (async ({ client, project, directory, $, worktree, serverUrl }) => {
  return {
    config: (cfg) => {
      // Initialize AUTOPILOT state, detect project
    },
    "command.execute.before": async (input, output) => {
      // Intercept /autopilot commands
    },
    "tool.definition": (input, output) => {
      // Register autopilot_iterate tool
    },
    tool: {
      autopilot_iterate: {
        description: "Execute the next AUTOPILOT iteration step",
        parameters: { /* session_id, step, feedback */ },
        execute: async (input) => {
          // FSM iteration logic
        },
      },
    },
  }
}) satisfies Plugin
```

## 4. Commands

### `autopilot implement <description>`
Start a new feature implementation.
- Arguments: `description` (string, required) — Feature description (max 2000 chars)
- Examples: `autopilot implement "add JWT authentication"`
- Output: Creates session, starts planning phase

### `autopilot resume [session-id]`
Resume an existing session.
- Arguments: `session-id` (string, optional) — Session UUID. If omitted, lists sessions.
- Output: Restores session state, resumes at last step

### `autopilot sessions`
List all sessions.
- Output: Table of sessions (ID, Feature, Status, Step, Age)

### `autopilot approve`
Approve the current iteration step.
- Output: Advances FSM to next phase

### `autopilot reject <reason>`
Reject the current iteration step with feedback.
- Arguments: `reason` (string, required) — Feedback for regeneration
- Output: Returns to previous phase with feedback context

### `autopilot config [show|set|list]`
Manage plugin configuration.
- `show`: Display current config
- `set <key> <value>`: Set config value
- `list`: List all available config options

## 5. OpenAPI Schema

AUTOPILOT commands can be expressed as OpenAPI 3.0 operations:

```yaml
openapi: 3.0.0
info:
  title: AUTOPILOT CLI
  version: 0.1.0
  description: Autonomous iteration plugin for opencode
paths:
  /implement:
    post:
      summary: Start a new feature implementation
      parameters:
        - name: description
          in: query
          required: true
          schema:
            type: string
            maxLength: 2000
      responses:
        '200':
          description: Session created
  /resume/{sessionId}:
    post:
      summary: Resume an existing session
      parameters:
        - name: sessionId
          in: path
          required: false
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Session restored
  /approve:
    post:
      summary: Approve the current iteration step
      responses:
        '200':
          description: FSM advanced to next phase
  /reject:
    post:
      summary: Reject the current step with feedback
      requestBody:
        content:
          text/plain:
            schema:
              type: string
      responses:
        '200':
          description: Returned to previous phase
  /sessions:
    get:
      summary: List all sessions
      responses:
        '200':
          description: Session table
  /config:
    get:
      summary: Show or list configuration
    post:
      summary: Set configuration value
```

## 6. Exit Codes
- 0: Success
- 1: Error (general)
- 2: Invalid arguments
- 3: Session not found

## 7. Examples

```bash
# Start implementing a feature
autopilot implement "add user authentication with JWT"

# Check status of active session
autopilot sessions

# Approve generated plan
autopilot approve

# Reject generated plan with feedback
autopilot reject "please also add refresh token rotation"

# Resume interrupted session
autopilot resume abc-123

# Stop current operation
autopilot stop
```

## 8. npm Package

The plugin is distributed as an npm package for automatic installation by opencode.

### Package Name
```
@vheins/opencode-autopilot
```

### package.json Requirements

```json
{
  "name": "@vheins/opencode-autopilot",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist/"],
  "peerDependencies": {
    "@opencode-ai/plugin": ">=1.0.0"
  },
  "scripts": {
    "build": "tsc"
  }
}
```

- **`"type": "module"`** — ESM-only; opencode requires ES modules for plugins.
- **`"main"` / `"types"`** — Point to compiled output in `dist/`.
- **`"exports"`** — Dual ESM and TypeScript entry points.
- **`"peerDependencies"`** — Declares `@opencode-ai/plugin` as a peer; the consumer (opencode) provides it.
- **`"files"`** — Only the `dist/` directory is published to npm.

### Build
Compile TypeScript to `dist/`:
```bash
npm run build    # tsc or esbuild
npm publish      # publishes only dist/
```

### Ecosystem Listing
After publishing, add the plugin to the opencode ecosystem by submitting a PR at [https://opencode.ai/docs/ecosystem/](https://opencode.ai/docs/ecosystem/).

## 9. Skill Reference

| Output | Generating Skill |
|---|---|
| CLI command structure | API Implementation |
| Exit codes & error handling | Error Analysis, Error Handling Patterns |
| Global standards & conventions | API Contract Design |
| OpenAPI schema | OpenAPI Spec Generation |
| Usage examples | User Story Generation, E2E Test Scenario Writing |

## Related Modules
- [Core Architecture](../modules/core/architecture.md)
- [Iteration Loop](../modules/core/iteration-loop.md)
- [State Persistence](../modules/core/state-persistence.md)
- [Supervised Mode](../modules/core/supervised-mode.md)
- [Quality Gates](../modules/core/quality-gates.md)
- [Backpressure](../modules/core/backpressure.md)
