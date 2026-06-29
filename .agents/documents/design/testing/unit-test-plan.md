# Unit Test Generation Plan: AUTOPILOT Plugin

## Test Targets

| Module | Tests | Coverage Target |
|---|---|---|
| Session manager | Create, resume, delete, list sessions | 95% |
| Iteration engine | FSM transitions, approval/rejection flows | 95% |
| State persistence | Save, load, compress, integrity check | 95% |
| Provider abstraction | API call, retry, timeout, error handling | 90% |
| Backpressure handler | Exponential backoff, max retries | 100% |
| CLI commands | Argument parsing, validation | 90% |
| Config manager | Read, write, validate config | 90% |
