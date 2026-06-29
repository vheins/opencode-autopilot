# Feature: Iteration Loop

## Header & Navigation
- [API Doc](../api/cli.md)
- [Testing Doc](../../testing/overview.md)

## Description
The core value proposition: users describe a feature, AUTOPILOT autonomously executes plan → code → review → test → commit cycle.

## User Story
As a developer, I want to describe a feature once and have AUTOPILOT implement it end-to-end, so I can ship faster without manual iteration management.

## Flow
1. User runs `autopilot implement "feature description"`
2. AUTOPILOT generates a plan
3. User approves plan (supervised mode)
4. AUTOPILOT generates code with quality gates
5. AUTOPILOT commits code with structured message

## API
- CLI: `autopilot implement <description>`
- CLI: `autopilot approve`
- CLI: `autopilot reject <reason>`

## Related Tests
- E2E: `test/e2e/full-iteration.test.ts`
- Integration: `test/integration/iteration-flow.test.ts`

## See Also
- [CLI API Reference](../api/cli.md)
- [Testing Guide](../../testing/overview.md)
