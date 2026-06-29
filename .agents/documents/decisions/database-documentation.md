# Database Documentation: AUTOPILOT Plugin

## Storage Architecture
AUTOPILOT uses file-based state storage (no database server required).

## File Layout
```
.autopilot/
  config.json              # Plugin configuration
  sessions/                # Session state files
    {uuid}.json.zlib      # Compressed session state
  artifacts/               # Iteration artifacts
    {session-uuid}/
      plan-{n}.md         # Plan text
      diff-{n}.patch      # Code diff
      lint-{n}.json       # Lint results
      test-{n}.json       # Test results
  logs/
    plugin.log            # Plugin activity log
```

## Data Dictionary

### Session
| Field | Type | Description |
|---|---|---|
| id | UUID | Unique session identifier |
| projectPath | string | Absolute path to project |
| featureDescription | string | User's feature description |
| status | string | active/paused/completed/failed |
| createdAt | ISO timestamp | Session creation time |
| updatedAt | ISO timestamp | Last activity time |
| currentIteration | number | Current iteration number |
| currentStep | string | Current FSM step |
| config | JSON | Plugin config snapshot |

## Backup & Recovery
- Automatic backup on each iteration step completion
- Last 3 snapshots retained per session
- SHA256 integrity verification on load
