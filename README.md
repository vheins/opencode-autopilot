# AUTOPILOT — Autonomous AI Iteration Loop for Opencode

An opencode plugin that enables autonomous AI coding agents to run iterative development loops — plan, code, review, test, commit — with state persistence, backpressure, and multi-model support.

Inspired by the Ralph Loop pattern and Copilot Autopilot, this plugin manages the full feature implementation lifecycle: from feature description to a committed, reviewed change set.

## Quickstart

```bash
npm install @vheins/opencode-autopilot
```

Add to your `opencode.json`:

```json
{
  "plugins": [
    ["@vheins/opencode-autopilot", {
      "maxRetries": 3,
      "baseDelay": 1000,
      "autoCommit": false,
      "confidenceThreshold": 70,
      "modelMapping": {}
    }]
  ]
}
```

## Prerequisites

- **Node.js** 20+
- **opencode** 1.17+

## Configuration

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `maxRetries` | `number` | `3` | Max retries per phase before failure |
| `baseDelay` | `number` | `1000` | Base backoff delay in ms |
| `autoCommit` | `boolean` | `false` | Auto-commit on passing gates |
| `confidenceThreshold` | `number` | `70` | Min confidence % for generated code |
| `modelMapping` | `object` | `{}` | Phase-to-model overrides |

## API

All 8 tools are exposed as opencode tools:

| Tool | Description |
| :--- | :--- |
| `autopilot_start` | Start a new feature implementation session (planning phase) |
| `autopilot_resume` | Resume an existing session from last known state |
| `autopilot_status` | Check session status, current phase, and iteration count |
| `autopilot_review` | Review the diff after code generation |
| `autopilot_approve` | Approve the current step (plan or diff) and continue |
| `autopilot_reject` | Reject the current step with feedback for regeneration |
| `autopilot_commit` | Commit session changes to git with safety checks |
| `autopilot_stop` | Stop the current iteration (preserves session state) |

## How It Works

The plugin uses a Finite State Machine (FSM) to manage the iteration lifecycle:

```
Idle ──► Planning ──► AwaitingApproval ◄──┐
          ▲               │                 │
          │    ┌──────────┼────────┐        │
          │    ▼          ▼        │        │
          │  Generating  Reviewing │        │
          │    │            │      │        │
          │    ▼            ▼      │        │
          └───┴─── Testing ───────┘        │
                    │                       │
                    ▼                       │
                Committing                  │
                    │                       │
                    ▼                       │
                  Done ─────────────────────┘

    Error ──► Idle (recovery)
```

Each phase has guard conditions and retry logic. Quality gates (type check, lint, test) run during the Testing phase before commit.

## Development

```bash
npm run build    # Compile TypeScript
npm test         # Run all tests (vitest)
npm run dev      # Watch mode
npm run lint     # ESLint
```

## License

MIT
