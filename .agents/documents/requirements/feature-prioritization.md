# Feature Prioritization: AUTOPILOT Plugin

## Prioritization Table (RICE)

| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---|---|---|---|---|---|
| Core iteration loop | 5 (all users) | 5 (eliminates manual iteration) | 4 (well-understood) | 3 (3 months) | 33.3 |
| Supervised mode | 5 (all users) | 4 (safety requirement) | 5 (simple UX pattern) | 2 (1 month) | 50.0 |
| State snapshot (disk persistence) | 5 (all users) | 4 (core differentiator) | 4 (well-understood) | 2 (1 month) | 40.0 |
| opencode plugin packaging | 5 (all users) | 5 (distribution) | 5 (standard) | 1 (1 week) | 125.0 |
| Quality gates (linter) | 4 (most users) | 3 (trust builder) | 3 (varies by linter) | 2 (1.5 months) | 18.0 |
| Multi-model routing | 3 (advanced users) | 3 (quality improvement) | 3 (known integration) | 3 (2 months) | 9.0 |
| Backpressure handling | 4 (heavy users) | 2 (reliability) | 4 (standard pattern) | 1 (1 month) | 32.0 |
| Auto-commit mode | 3 (power users) | 3 (productivity) | 2 (needs validation) | 2 (1.5 months) | 9.0 |
| Parallel agent spawning | 2 (niche) | 3 (significant when needed) | 1 (unvalidated) | 5 (4+ months) | 1.2 |
| Custom quality gate plugins | 3 (some users) | 2 (nice-to-have) | 2 (needs API design) | 3 (2 months) | 4.0 |

## Top 3 Quick Wins

1. **opencode plugin packaging** (RICE: 125) — Trivial effort (1 week), enables distribution and dogfooding immediately
2. **Supervised mode** (RICE: 50) — Simple UX layer over the core loop; builds user trust from day one
3. **State snapshot** (RICE: 40) — Well-understood pattern; core differentiator achievable in 1 month

## Low-Value Flags

- **Parallel agent spawning** (RICE: 1.2) — High effort, low confidence, niche reach. Defer indefinitely or until validated demand.
- **Custom quality gate plugins** (RICE: 4.0) — Medium effort, low impact for MVP. Ship with built-in linter support first; API for custom gates can follow.

## Build Order Summary

Phase 1 (Months 1-2): Plugin packaging → Supervised iteration loop → State snapshot. This delivers the core value proposition with safety. Phase 2 (Month 3): Backpressure + built-in quality gates (eslint, pytest) for reliability. Phase 3 (Month 4+): Multi-model routing + auto-commit mode based on user feedback.
