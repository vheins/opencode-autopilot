# Component Inventory: AUTOPILOT Plugin

| Component | Purpose | Props/Config | States | Reusable |
|---|---|---|---|---|
| SessionManager | Create, resume, list sessions | projectPath, config | active/paused/completed/failed | Yes |
| IterationEngine | FSM iteration loop | sessionId, mode (supervised/auto) | idle/planning/coding/reviewing/testing/committing | Yes |
| PlanGenerator | Generate implementation plan | featureDescription, context | generating/ready/error | Yes |
| CodeGenerator | Write code files | plan, modelConfig | generating/ready/error | Yes |
| QualityGateRunner | Execute linters/tests | gates: string[] | running/pass/fail | Yes |
| StatePersister | Save/load session state | sessionId, format | saving/loading/error | Yes |
| ApprovalPrompt | Present step for user approval | content, type | awaiting/approved/rejected | Yes |
| BackpressureHandler | Handle API rate limits | maxRetries, backoffMs | idle/retrying/exhausted | Yes |
