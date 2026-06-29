# Test Pyramid Strategy: AUTOPILOT Plugin

## Test Distribution

| Layer | Count | Scope | Tools |
|---|---|---|---|
| Unit | 60% | Individual modules/classes | Vitest |
| Integration | 25% | Module interactions, state persistence | Vitest |
| E2E | 10% | Full iteration loop with mock API | Vitest + Playwright (CLI) |
| Quality Gates | 5% | Linter/test runner integration tests | Vitest |

## Testing Principles
- Unit tests for all state machine transitions
- Integration tests for session create/resume/delete flow
- E2E tests for full feature implementation loop with mock AI provider
- Property-based tests for state serialization/deserialization
