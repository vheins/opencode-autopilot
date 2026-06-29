# Risk Register: AUTOPILOT Plugin

## Risk Matrix

| Risk | Category | Likelihood | Impact | Score | Mitigation |
|---|---|---|---|---|---|
| opencode plugin API lacks required lifecycle hooks | Technical | 3 | 5 | 15 | Early prototype; contribute API extensions upstream |
| Low adoption in opencode ecosystem | Business | 3 | 4 | 12 | Focus on quality; leverage opencode's 7.5M monthly devs |
| AI provider API changes break iteration loop | Technical | 3 | 4 | 12 | Abstract provider layer; pin model versions in config |
| Users distrust auto-generated code | Operational | 3 | 3 | 9 | Supervised mode by default; clear diff presentation |
| Multi-model state corruption | Technical | 2 | 4 | 8 | Isolated context per model; rigorous state machine |
| Community contribution quality varies | Operational | 3 | 2 | 6 | PR review requirements; contribution guidelines |
| Competing plugin emerges with faster iteration | Business | 2 | 3 | 6 | Open-source + fast release cycle; unique state persistence |
| Prompt injection exploits | Security | 2 | 5 | 10 | Input validation; sandboxed execution; model-level guardrails |

## Top 5 Critical Risks

1. **opencode API insufficiency (Score: 15)** — Root cause: undocumented/missing hooks. Warning: prototype fails to intercept model calls. Mitigation: prototype Month 1; design fallback to file-watch-based approach.
2. **Low adoption (Score: 12)** — Root cause: opencode plugin ecosystem is new. Warning: installs <100 after Month 1. Mitigation: cross-post to developer communities; provide value from Day 1 with single-feature MVP.
3. **API provider changes (Score: 12)** — Root cause: provider deprecates endpoints. Warning: test suite fails after provider update. Mitigation: abstract provider adapter; pin working versions; monitor provider changelogs.
4. **Prompt injection (Score: 10)** — Root cause: user provides crafted input that hijacks agent instructions. Warning: unexpected system prompt modifications. Mitigation: input sanitization; model-level content filtering; separate user/system prompt boundaries.
5. **Code distrust (Score: 9)** — Root cause: users don't trust AI-generated code quality. Warning: users disable quality gates. Mitigation: supervised mode; show lint+test results per iteration; transparent diff.

## Risk Monitoring Plan

- **Review cadence:** Monthly risk review; immediate re-assessment on API/provider changes
- **Escalation:** Score ≥ 12 → escalate to lead developer; Score 15+ → block release
- **Metrics:** Plugin installs/MAU, iteration success rate (% reaching commit), API error rate, user retention
