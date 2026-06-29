# QA Scenario Matrix: AUTOPILOT Plugin

## Holistic QA Scenarios

| Scenario | Category | Steps |
|---|---|---|
| Happy path feature implementation | Functional | `implement` → plan → approve → code → lint → test → approve commit |
| Rejected plan with feedback | Functional | `implement` → plan → reject → regenerated plan → approve |
| Session resume after terminal close | Resilience | `implement` → code gen → close terminal → reopen → `resume` |
| API key rotation mid-session | Config | `implement` → during iteration → rotate key → iteration continues |
| Feature with test failures | Error | `implement` → code gen → tests fail → auto-fix → tests pass |
| Large monorepo feature | Performance | `implement` in 100K+ file repo → iteration completes in <10 min |
| Multi-session parallel work | Concurrency | Start 3 sessions → alternate between them → all complete |
