# Cross-Linking Pass: AUTOPILOT Plugin

## Traceability: Story → Feature Doc → API → Tests

| User Story | Feature Doc | API | Tests |
|---|---|---|---|
| Feature from Description | `modules/core/iteration-loop.md` | `api/cli.md` (implement) | `test/e2e/full-iteration.test.ts` |
| Supervised Iteration | `modules/core/supervised-mode.md` | `api/cli.md` (approve/reject) | `test/integration/approval-flow.test.ts` |
| State Persistence | `modules/core/state-persistence.md` | `api/cli.md` (resume/sessions) | `test/unit/state-persistence.test.ts` |
| Quality Gates | `modules/core/quality-gates.md` | `api/cli.md` (config) | `test/integration/quality-gates.test.ts` |

## Requirement → Architecture Trace

| Requirement | Architecture Doc |
|---|---|
| FR-01: Iteration loop | `design/architecture/system-architecture.md` |
| FR-02: Supervised mode | `design/architecture/autopilot-core-tech-design.md` |
| FR-03: State persistence | `design/architecture/database-schema.md` |
| FR-04: Quality gates | `design/architecture/system-architecture.md` |
| NFR-02: Rate limit handling | `design/architecture/system-architecture.md` (backpressure) |
