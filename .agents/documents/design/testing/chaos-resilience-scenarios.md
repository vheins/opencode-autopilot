# Chaos/Resilience Scenarios: AUTOPILOT Plugin

## Chaos Experiments

| Scenario | Injection | Expected Behavior |
|---|---|---|
| AI provider down | Network block to API | Retry with backoff; report after 3 failures |
| Disk full | Fill disk to 100% | Catch write error; keep state in memory; alert user |
| Process kill | SIGKILL during iteration | Session state should be recoverable (snapshot after each step) |
| Corrupted state file | Modify state JSON | SHA256 check fails; report corruption; offer to restart |
| Rate limit storm | Configure API to return 429 for 1 hour | Exponential backoff; max retries exhausted; pause gracefully |
