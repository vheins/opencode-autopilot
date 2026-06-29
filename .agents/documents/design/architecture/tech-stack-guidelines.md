# Tech Stack Guidelines: AUTOPILOT Plugin

## Coding Standards
- TypeScript 5.x with strict mode enabled
- ESLint flat config with @typescript-eslint recommended rules
- Prettier for formatting (single quotes, 100 char width, trailing commas)
- Vitest for unit/integration tests with 80%+ coverage target
- esbuild for building; output to dist/ directory

## Project Structure
```
autopilot-plugin/
  src/
    index.ts          # Plugin entry point (opencode hooks)
    session/          # Session lifecycle manager
    iteration/        # Iteration loop FSM
    quality/          # Quality gate runner
    state/            # State persistence (disk snapshots)
    provider/         # AI provider abstraction
    cli/              # User-facing commands
  tests/
    unit/
    integration/
  .opencode/
    plugin.json       # Plugin manifest
```

## Dependency Rules
- Zero external runtime dependencies where possible
- Only use well-maintained libraries with 1000+ GitHub stars
- Pin all dependency versions in package.json
- Regular audit via `npm audit` in CI
