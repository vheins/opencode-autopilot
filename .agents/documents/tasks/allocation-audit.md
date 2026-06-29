# Allocation Audit: AUTOPILOT Plugin

## Developer Allocation per Sprint

| Sprint | Dev 1 | Dev 2 | Total Points |
|---|---|---|---|
| S1 | Plugin manifest, session.create | State persistence, session.resume | 8 |
| S2 | FSM types, iteration engine | Provider abstraction, transitions | 8 |
| S3 | Plan UI, approval prompt | AI planning integration | 8 |
| S4 | Diff UI, file writing | Code gen prompt, safety check | 8 |
| S5 | Gate abstraction, auto-fix | ESLint, Vitest integration | 8 |
| S6 | Commit approval | Git commit, E2E tests | 8 |
| S7 | Backpressure, integrity check | Error recovery, audit | 8 |
| S8 | Unit tests, security audit | Integration tests, perf | 8 |
| S9 | Registry, README | CLI help, smoke tests | 8 |
| S10 | Beta coordination, feedback | Bug fixes, perf tuning | 8 |
| S11 | Confidence scoring, feature flag | Auto-commit + tests | 8 |
| S12 | Config schema, docs | Multi-model + tests | 8 |

## Total Allocation
- 12 sprints × 8 SP = 96 story points
- 48 SP per developer
- 24 weeks total

## Utilization
- 100% planned utilization
- Buffer: 1 sprint contingency (Sprint 10 is partially reactive)
- Risk: Developer dependency on critical path (iteration engine follows S1, single-threaded)
