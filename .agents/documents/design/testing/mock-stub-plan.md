# Mock/Stub Plan: AUTOPILOT Plugin

## External Dependencies to Mock

| Dependency | Mock Strategy | Tool |
|---|---|---|
| AI Provider API (OpenAI/Anthropic) | Stub with configurable responses | Vitest vi.mock() |
| opencode plugin hooks | Mock hook injection | Custom mock adapter |
| Filesystem | Real temp directory per test | fs + tmp-promise |
| Git commands | Mock via exec mock | vitest-mock-extended |
| Linter (ESLint) | Stub with known output | Fixture files |
| Test runner (Vitest) | Stub with known output | Fixture files |

## Testing Approach
- Unit: All external deps mocked
- Integration: Real filesystem (temp dir) + mock AI provider
- E2E: Real filesystem + mock AI provider + real git
