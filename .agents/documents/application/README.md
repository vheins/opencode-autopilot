# AUTOPILOT — Autonomous Iteration Plugin for Opencode

AUTOPILOT is an opencode plugin that transforms AI coding sessions from stateless conversations into autonomous iteration pipelines. Describe a feature once, and AUTOPILOT plans, codes, reviews, tests, and commits the implementation — with persistent state, supervised approval, and quality gate enforcement.

## Quick Start

```bash
# Install
opencode plugin add autopilot

# Implement a feature
autopilot implement "add user authentication with JWT"

# Resume interrupted session
autopilot resume <session-id>
```

## Features
- **Iteration Loop**: Plan → Code → Review → Test → Commit FSM
- **Supervised Mode**: Approve each step before execution
- **State Persistence**: Disk-based snapshots survive terminal restarts
- **Quality Gates**: Automatic lint and test execution
- **Backpressure**: Graceful API rate limit handling

## Documentation
- [Architecture](modules/core/architecture.md)
- [API Reference](api/cli.md)
- [Testing Guide](testing/overview.md)
