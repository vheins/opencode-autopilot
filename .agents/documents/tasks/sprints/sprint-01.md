# Sprint 01: Foundation (Weeks 1-2)

## Goal
Plugin scaffolding + session manager with disk persistence.

## Tasks
| Task | Effort | Owner | Dependencies |
|---|---|---|---|
| Create plugin manifest | S | Dev 1 | None |
| Implement onPluginLoad hook | S | Dev 1 | Task 1 |
| Implement session.create() | M | Dev 2 | Task 1 |
| Implement state persistence save/load (MCP-based) | M | Dev 2 | Task 3 |
| Implement session.resume() | S | Dev 1 | Task 4 |
| Unit tests for session module | M | Dev 1 | Task 3-5 |

## Sprint Capacity: 8/8 points

## Demo
Plugin loads in opencode, session created and persisted via local-memory-mcp, session resumed after restart.
