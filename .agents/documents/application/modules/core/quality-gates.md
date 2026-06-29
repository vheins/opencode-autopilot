# Feature: Quality Gates

## Header & Navigation
- [API Doc](../api/cli.md)
- [Testing Doc](../../testing/overview.md)

## Description
After code generation, AUTOPILOT automatically runs configured quality gates (linters, test runners) and reports results before commit approval.

## User Story
As a team lead, I want AI-generated code to pass quality checks before commit, so I don't have to catch style and basic errors during review.

## Implementation
- Quality gates are pluggable via configuration
- Built-in gates: ESLint, Prettier, Vitest
- Auto-fix linter warnings where possible
- Test failures trigger code regeneration with failure context

## API
- Config: `autopilot config set gates ["eslint", "vitest"]`

## Related Tests
- Integration: `test/integration/quality-gates.test.ts`
- Unit: `test/unit/linter-runner.test.ts`

## See Also
- [CLI API Reference](../api/cli.md)
- [Testing Guide](../../testing/overview.md)
