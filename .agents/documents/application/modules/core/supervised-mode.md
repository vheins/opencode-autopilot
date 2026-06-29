# Feature: Supervised Mode

## Header & Navigation
- [API Doc](../api/cli.md)
- [Testing Doc](../../testing/overview.md)

## Description
Each critical step (plan approval, commit approval) requires explicit user approval before execution proceeds.

## User Story
As a team lead, I want to review AI-generated plans and code before they enter my codebase, so I maintain quality control.

## Implementation
- Plan: Presented as structured overview → user approves or rejects with feedback
- Code: Presented as git-style diff → user approves commit or rejects with feedback
- Feedback: Free text input that feeds into next generation cycle

## API
- CLI: `autopilot approve`
- CLI: `autopilot reject <reason>`

## Related Tests
- Integration: `test/integration/approval-flow.test.ts`
- E2E: `test/e2e/supervised-loop.test.ts`

## See Also
- [CLI API Reference](../api/cli.md)
- [Testing Guide](../../testing/overview.md)
