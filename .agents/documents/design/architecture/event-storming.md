# Event Storming: AUTOPILOT Plugin

## Domain Events

| Event | Trigger | Handler |
|---|---|---|
| SessionCreated | Plugin loaded, user runs `autopilot` | Session manager initializes state |
| FeatureDescribed | User provides feature description | Iteration engine starts planning |
| PlanGenerated | AI provider returns plan | Plan presented for approval |
| PlanApproved | User approves plan | Code generation starts |
| CodeGenerated | AI provider returns code | Code written to filesystem; linter starts |
| LintComplete | Linter finishes | If pass → test; if fail → fix cycle |
| TestComplete | Tests finish | If pass → commit approval; if fail → fix cycle |
| CommitApproved | User approves commit | Git commit created |
| SessionResumed | User restores session | State loaded from disk |
| RateLimited | API returns 429 | Backpressure handler triggers retry |
| IterationFailed | Irrecoverable error | Session paused; user notified |

## Command Flow
```
FeatureDescribed → PlanGenerated → PlanApproved → CodeGenerated → 
LintComplete → TestComplete → CommitApproved
```
