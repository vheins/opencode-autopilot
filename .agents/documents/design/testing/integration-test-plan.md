# Integration Test Generation Plan: AUTOPILOT Plugin

## Integration Test Scenarios

| Scenario | Components | Description |
|---|---|---|
| Session lifecycle | Session manager → State persistence | Create session, persist, resume, verify state |
| Iteration flow | Session → Iteration engine → Provider | Full plan→code→test→commit with mock provider |
| Quality gates | Iteration engine → Subprocess | Linter runs on generated code, results captured |
| Error recovery | Backpressure → Provider → State | Rate limit triggered, state preserved after retries |
| Multi-session | Session manager × 2 | Two concurrent sessions don't interfere |
