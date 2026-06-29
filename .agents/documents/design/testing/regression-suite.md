# Regression Suite Design: AUTOPILOT Plugin

## Regression Test Selection

| Trigger | Tests to Run | Priority |
|---|---|---|
| Pre-release | Full suite (unit + integration + E2E) | Critical |
| PR merge | Unit + integration for changed modules | High |
| Dependency update | Related integration tests | Medium |
| Config change | Config validation tests | Medium |

## Critical Regression Tests
1. Session create/resume/delete — no data loss
2. Iteration loop — all FSM transitions valid
3. State snapshot — integrity check on save/load
4. Backpressure — retry logic correct
5. File boundary — no writes outside project dir
