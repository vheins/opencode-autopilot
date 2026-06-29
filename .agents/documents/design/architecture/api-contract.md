# API Contract: AUTOPILOT Plugin

## Plugin API (opencode Hooks)

| Hook | Trigger | AUTOPILOT Handler |
|---|---|---|
| `onPluginLoad` | Plugin initialized | Load config, resume active session |
| `onBeforeModelCall` | AI model about to be invoked | Inject session context |
| `onAfterModelCall` | AI model response received | Parse response, update state |
| `onFileWrite` | Code written to disk | Check against project boundary |
| `onSessionEnd` | Session closing | Persist state snapshot |

## CLI Commands

| Command | Arguments | Description |
|---|---|---|
| `autopilot implement <description>` | Feature description string | Start new feature implementation |
| `autopilot resume [session-id]` | Optional session ID | Resume existing session |
| `autopilot sessions` | — | List all sessions |
| `autopilot config` | — | View/edit plugin configuration |
| `autopilot approve` | — | Approve current step |
| `autopilot reject <reason>` | Rejection reason | Reject current step with feedback |

## Internal Service API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `session.create(description)` | feature description | Session | Start new session |
| `session.get(id)` | session ID | Session | Get session state |
| `session.list()` | — | Session[] | List all sessions |
| `session.delete(id)` | session ID | void | Remove session |
| `iteration.next(sessionId)` | session ID | IterationStep | Execute next step |
| `iteration.approve(sessionId)` | session ID | IterationStep | Approve current step |
| `iteration.reject(sessionId, reason)` | session ID, reason | IterationStep | Reject current step |
