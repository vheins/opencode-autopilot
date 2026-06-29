# Dependency Mapping: AUTOPILOT Plugin

## Internal Dependencies

| Module | Depends On | Type |
|---|---|---|
| CLI Interface | Session Manager | Direct call |
| Session Manager | State Persistence, Iteration Engine | Direct call |
| Iteration Engine | Provider Abstraction, Quality Gates, State Persistence | Direct call |
| Quality Gates | Subprocess (external tools) | Subprocess |
| Provider Abstraction | AI Provider API (external) | HTTP |
| State Persistence | Filesystem | File I/O |
| Backpressure Handler | Provider Abstraction | Direct call |

## External Dependencies

| Dependency | Version | Purpose | Risk |
|---|---|---|---|
| opencode plugin API | Latest | Plugin lifecycle hooks | High (API may be insufficient) |
| Node.js | 20+ LTS | Runtime | Low (widely available) |
| AI Provider API (OpenAI/Anthropic) | Latest | Code generation | Medium (API changes) |
| ESLint / Biome | Latest | Code linting | Low |
| Vitest | Latest | Test execution | Low |
| Git | 2.x | Version control | Low |

## Circular Dependency Check
No circular dependencies detected. Architecture is layered: CLI → Session → Iteration → Provider/Quality.

## Dependency Inversion
- Provider abstraction uses interface pattern — swap AI provider without changing iteration engine
- Quality gates use strategy pattern — new linters/test runners added via configuration
