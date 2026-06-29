# API Contract Tests: AUTOPILOT Plugin

## Contract Tests

| Contract | Test | Verification |
|---|---|---|
| Hook: onPluginLoad | Plugin registers all hooks | Hook registry verified |
| Hook: onBeforeModelCall | Session context injected | Context contains session state |
| CLI: autopilot implement | Validates description arg | Error on empty description |
| CLI: autopilot resume | Loads session state | State matches last snapshot |
| CLI: autopilot approve | Advances FSM to next step | State transitions correctly |
| Internal: session.create | Returns valid Session object | Schema validation |
| Internal: iteration.next | Returns IterationStep object | Schema validation |
