# Testing Guide: AUTOPILOT Plugin

## Test Pyramid

| Layer | Count | Tools | Location |
|---|---|---|---|
| Unit | 60% | Vitest | `test/unit/` |
| Integration | 25% | Vitest | `test/integration/` |
| E2E | 10% | Vitest | `test/e2e/` |
| Chaos | 5% | Vitest | `test/chaos/` |

## Running Tests

```bash
# All tests
npm test

# Unit only
npm run test:unit

# Integration
npm run test:integration

# E2E (requires mock provider)
npm run test:e2e

# Coverage
npm run test:coverage
```

## Test Data
- Test factories in `test/factories/`
- Mock AI provider in `test/mocks/provider.ts`
- Test fixtures in `test/fixtures/` (sample repos, state files)

## Key Test Files
- `test/unit/session-manager.test.ts`
- `test/unit/iteration-engine.test.ts`
- `test/unit/state-persistence.test.ts`
- `test/unit/backpressure.test.ts`
- `test/integration/session-lifecycle.test.ts`
- `test/integration/approval-flow.test.ts`
- `test/e2e/full-iteration.test.ts`

## Related Modules
- [Core Architecture](../modules/core/architecture.md)
- [Iteration Loop](../modules/core/iteration-loop.md)
- [State Persistence](../modules/core/state-persistence.md)
- [Supervised Mode](../modules/core/supervised-mode.md)
- [Quality Gates](../modules/core/quality-gates.md)
- [Backpressure](../modules/core/backpressure.md)
