# Monolith Decomposition Plan: AUTOPILOT Plugin

## Current Architecture
Single opencode plugin process with internal module boundaries.

## Strangler Fig Migration Path

**Phase 1 (Year 1):** Modular monolith — clear internal interfaces between session manager, iteration engine, provider abstraction. No network calls.

**Phase 2 (Year 2-3):** Extract state sync service
- Implement REST API for state CRUD
- Plugin becomes consumer of state service
- Backward compatibility: local state storage remains default

**Phase 3 (Year 3+):** Extract enterprise services
- Auth service for SSO
- Audit service for compliance
- Admin API for team management

## Migration Rules
- Each extraction must maintain backward compatibility for 2 release cycles
- Local-only mode must always work (no external service dependency for core features)
- Feature flag all extracted services — users opt in
