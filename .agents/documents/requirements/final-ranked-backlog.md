# Final Ranked Backlog: AUTOPILOT Plugin

## Backlog (Ranked by Priority)

| Rank | Feature | Phase | Effort | Dependencies | Status |
|---|---|---|---|---|---|
| 1 | Plugin scaffolding | P0 | S | None | Ready |
| 2 | Session lifecycle manager | P3 | M | 1 | Ready |
| 3 | Iteration loop engine | P3 | L | 2 | Ready |
| 4 | Supervised mode UI | P4 | M | 3 | Ready |
| 5 | Quality gate runner | P5 | M | 3 | Ready |
| 6 | Backpressure handler | P3 | S | 3 | Ready |
| 7 | Auto-commit mode | P5 | M | 4-5 | Ready |
| 8 | Multi-model router | P3 | L | 3 | Deferred |
| 9 | Parallel agent spawning | P9 | XL | 3 | Deferred |
| 10 | Custom quality gate plugins | P5 | M | 5 | Deferred |
| 11 | GUI / Web dashboard | P10 | XL | — | Won't do |
| 12 | Enterprise SSO / audit logging | P9 | M | — | Won't do |

## Build Phases

**Phase 1 (Months 1-3):** Tasks 1-4 — MVP: plugin loads, creates sessions, runs iteration loop with supervised approval.

**Phase 2 (Months 4-5):** Tasks 5-6 — Quality gates + reliability: lint, test, backpressure.

**Phase 3 (Month 6+):** Tasks 7-8 — Advanced: auto-commit, multi-model routing.

**Deferred:** Tasks 9-10 — Post-MVP, based on community demand.

**Won't do:** Tasks 11-12 — Out of scope for Phase 1.
