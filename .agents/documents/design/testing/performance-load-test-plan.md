# Performance/Load Test Plan: AUTOPILOT Plugin

## Load Tests

| Scenario | Load | Target |
|---|---|---|
| Concurrent sessions | 10 sessions running simultaneously | No crash, <1s latency per step |
| Large codebase | 100K file repository | Codebase index <30s |
| State persistence | 1000 sessions | List command <2s |
| API rate limit | 50 rapid iterations | Backpressure triggers correctly |

## Tools
- Vitest benchmarks for module-level performance
- k6 or autocannon for API-level (if state sync service extracted)
- Custom benchmark script for iteration loop timing
