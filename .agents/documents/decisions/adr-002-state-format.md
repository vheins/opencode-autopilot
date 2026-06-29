# ADR-002: State Persistence Format

## Context
Need to store session state for recovery across terminal sessions.

## Decision
Use JSON + zlib compression + SHA256 integrity hash, stored as files in `.autopilot/` directory.

## Rationale
- JSON is human-readable (debugging)
- zlib compression keeps files small (<10MB per session)
- SHA256 detects corruption
- No external dependencies (built into Node.js)
- Simple to version/migrate

## Consequences
- Not suitable for shared state (multi-device) — defer to Phase 2
- Large sessions (>10MB) need chunking or pagination
- Concurrency: file locks needed for concurrent session access
