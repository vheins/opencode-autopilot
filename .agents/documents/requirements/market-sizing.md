# Market Sizing: AUTOPILOT Plugin

## TAM (Top-Down)

**Total Addressable Market: $2.2B annually**

- Global developer population: ~28M developers worldwide (GitHub Octoverse 2024)
- Developers using AI coding assistants: ~42% adoption = ~11.8M developers (GitHub 2024 survey)
- Annual willingness-to-pay for AI coding tooling: ~$180/user/year ($15/mo average for premium coding AI tools)
- TAM = 11.8M × $180 = $2.12B; rounding to $2.2B considering enterprise markups

**Sources/Proxies:** GitHub Octoverse report (developer population), GitHub 2024 AI survey (adoption rate), Copilot/Claude Code pricing benchmarks ($10-20/mo per user).

## SAM (Bottom-Up)

**Serviceable Addressable Market: $384M annually**

- Addressable segment: Developer tool plugin users (opencode ecosystem + VS Code/IDE users who automate workflows)
- Size: ~20% of AI coding tool users = ~2.4M developers
- Geography filter: US, EU, UK, Canada — ~60% of paying AI tool users = ~1.6M
- Willingness-to-pay for plugin/runtime layer: ~$20/mo premium on top of base AI tool subscription
- SAM = 1.6M × $240 = $384M

**Logic:** Not all AI coding tool users need/or will adopt autonomous iteration plugins. Target: developers who spend 5+ hours/week on AI-assisted coding and experience context drift pain — approximately 1 in 5 AI tool users.

## SOM (3-Year Capture)

**Serviceable Obtainable Market: 3-year adoption projection**

| Year | Adoption % | Customers | ARR |
|---|---|---|---|
| Year 1 | 0.4% | 6,400 | $15.4M |
| Year 2 | 1.2% | 19,200 | $46.1M |
| Year 3 | 3.0% | 48,000 | $115.2M |

**Assumptions:**
- Year 1: Open-source plugin distribution via opencode registry, gradual onboarding from early adopters
- Year 2: Community growth + word-of-mouth from successful deployments; enterprise interest begins
- Year 3: Established ecosystem with templates, documented workflows; early enterprise contracts

## Assumptions Table

| Assumption | Confidence | Verification Source |
|---|---|---|
| 28M global developers | Medium | GitHub Octoverse 2024; excludes non-GitHub users |
| 42% AI coding assistant adoption | Medium | GitHub 2024 survey; varies by region |
| 20% of AI tool users need autonomous iteration | Low | No direct market data; inferred from feature request frequency in opencode community |
| ~$15-20/mo price point viable | Medium | Paras to Copilot ($10), Claude Code ($20), Cursor ($20) |
| Plugin distribution via opencode registry gains traction | Low | opencode is relatively new; plugin ecosystem is nascent |
| 3% SOM capture by Year 3 | Low | Conservative; assumes 1-3 competitors emerge in the same space |
