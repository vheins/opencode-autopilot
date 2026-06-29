# Microservice Boundary Definition: AUTOPILOT Plugin

## Current State: Plugin (Monolithic)
AUTOPILOT is a single opencode plugin. No microservice decomposition is needed for Year 1.

## Future Decomposition Points

| Potential Service | Trigger for Extraction | Communication |
|---|---|---|
| State Sync Service | Multi-device support required (Year 2+) | REST API over HTTPS |
| Enterprise Auth Service | SSO/SAML integration needed | OAuth2/OIDC |
| Audit Log Service | Compliance requirements (Year 2+) | Event stream |

## Decision
**Stay monolithic plugin for Year 1.** The plugin architecture naturally enforces module boundaries within a single process. Extract services only when:
1. Multiple opencode instances need shared state
2. Enterprise compliance mandates centralized audit logging
3. Performance profiling shows subprocess bottlenecks
