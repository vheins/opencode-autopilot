# Test Data Factory Design: AUTOPILOT Plugin

## Factories

```typescript
// Session factory
function createTestSession(overrides?: Partial<Session>): Session
// Default: { id: uuid(), projectPath: "/tmp/test-repo", status: "active" }

// Iteration factory
function createTestIteration(overrides?: Partial<Iteration>): Iteration
// Default: { number: 1, status: "in_progress", phase: "planning" }

// Artifact factory
function createTestArtifact(type: ArtifactType): Artifact
// Generates: plan text, code diff, lint results, test results

// Mock AI provider
function createMockProvider(responses: MockResponse[]): AIProvider
// Returns configurable sequence of responses
```

## Fixtures
- Test repository with known lint errors (eslint, prettier)
- Test repository with passing/failing test suites
- Session state snapshot files (various states)
