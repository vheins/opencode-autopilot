# Assumption Mapping: AUTOPILOT Plugin

## User Assumptions

| Assumption | Risk | Validation Experiment |
|---|---|---|
| Developers want unattended AI agents that iterate autonomously | High — users may prefer to stay in control of each step | Build "supervised" mode first; A/B test auto-commit vs. manual-approval |
| State persistence via disk (filesystem snapshots) is sufficient for context recovery | Medium — cloud sync or DB might be required for multi-device workflows | Prototype disk-based state, measure context recovery accuracy |
| Developers will configure quality gates (linter, tests, etc.) rather than expecting defaults | Medium — some users expect "just works" out of the box | Ship with sensible defaults (eslint, pytest) and measure config rate |
| Fresh context per iteration is better than accumulated conversation history | High — contrarian to Claude Code/Copilot which use full history | A/B test fresh context vs. accumulated context on feature completion time |

## Market Assumptions

| Assumption | Risk | Validation Experiment |
|---|---|---|
| opencode plugin ecosystem will grow to support paid/enterprise plugins | Medium — opencode plugin registry is early-stage | Monitor opencode plugin adoption quarterly |
| $180-240/user/year is an acceptable price point for the plugin | Medium — competing free alternatives (Continue.dev, Aider) exist | Survey beta users on willingness-to-pay |
| 3% SOM capture by Year 3 is achievable | Medium — depends on opencode's own growth trajectory | Track plugin installs vs. opencode MAU ratio |
| First-mover advantage in opencode plugin ecosystem matters | Low — opencode ecosystem is new, all vendors start equally | Speed to market with core feature set |
| Enterprise teams will pay for audit logging and access control | Low — enterprise add-ons are standard monetization path | Include enterprise pricing in beta with 5+ seat minimum |

## Technical Assumptions

| Assumption | Risk | Validation Experiment |
|---|---|---|
| opencode plugin API supports the required hooks (session lifecycle, file events, model selection) | High — if API is insufficient, core features may be blocked | Prototype minimal plugin against opencode API; document gaps |
| Disk-based state persistence does not create performance bottlenecks | Medium — large codebases (~100K+ files) may cause slow snapshots | Benchmark snapshot time on 50K, 100K, 500K file repos |
| Multi-model orchestration can be implemented without anthropic/openai SDK changes | Low — both providers support API-based model switching already | Build multi-model bridge as standalone proof-of-concept |

## Business Assumptions

| Assumption | Risk | Validation Experiment |
|---|---|---|
| Open-source community contributions will fill gaps in quality gate integrations | Medium — plugin approach encourages community adapters | Track PR frequency for new quality gate integrations |
| Enterprise support ($20/mo/seat) is viable for ongoing development | Medium — enterprise sales cycles may be long for a plugin | Offer early-bird enterprise pricing at beta launch |
| The plugin can be maintained by a small core team (~2-3 devs) for Year 1 | Low — plugin architecture limits scope compared to full IDE | Budget 2 FTE for Year 1; evaluate after initial launch |

## Priority Matrix (Top 5 Highest-Risk Assumptions)

| Priority | Category | Assumption | Risk | Validation Method |
|---|---|---|---|---|
| 1 | Technical | opencode plugin API supports required hooks | High | Prototype minimal plugin; API gap analysis |
| 2 | User | Users want unattended AI agents | High | Supervised mode MVP; measure opt-in rate for auto-approve |
| 3 | User | Fresh context > accumulated history | High | A/B test both approaches on feature completion metrics |
| 4 | User | Disk-based state is sufficient | Medium | Prototype; measure accuracy and performance |
| 5 | Market | opencode plugin ecosystem viability | Medium | Track quarterly ecosystem metrics |
