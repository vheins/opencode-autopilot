# E2E Scenario Writing: AUTOPILOT Plugin

## Critical User Journeys

1. **Feature Implementation** — User describes a feature, AUTOPILOT completes full loop, user approves commit
2. **Supervised Rejection** — User rejects plan, provides feedback, AUTOPILOT regenerates improved plan
3. **Session Resume** — User closes terminal, reopens, resumes session, continues from last step
4. **Error Recovery** — API rate limit triggered, AUTOPILOT retries with backoff, iteration continues
5. **Multi-Feature** — User implements 3 features sequentially, each in its own session

## E2E Test Setup
- Test repository with known structure (small Node.js project)
- Mock AI provider returning deterministic responses
- Virtual terminal for CLI interaction
