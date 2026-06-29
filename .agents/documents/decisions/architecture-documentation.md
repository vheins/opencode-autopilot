# Architecture Documentation: AUTOPILOT Plugin

## System Overview
AUTOPILOT is an opencode plugin that implements an autonomous AI coding iteration loop with persistent state and quality gates.

## Key Architectural Decisions
1. **Plugin architecture**: Runs inside opencode process; no external server (ADR-001)
2. **File-based state**: JSON + zlib + SHA256; no database (ADR-002)
3. **Supervised default**: Human approval required for plan and commit (ADR-003)
4. **FSM-based iteration**: Deterministic state machine prevents invalid transitions
5. **Pluggable quality gates**: MCP-like protocol for external tool integration

## Data Flow
```
User Input → CLI → Session Manager → Iteration Engine → AI Provider
                                                           ↓
                                                    Code Generation
                                                           ↓
                                              Quality Gates (Lint/Test)
                                                           ↓
                                              User Approval → Git Commit
                                                           ↕
                                                    State Persistence
```

## Deployment
- Distributed via opencode plugin registry
- No server-side component
- Configuration via `.autopilot/config.json`
- State stored in `.autopilot/` directory within project
