# Presentation Brief: AUTOPILOT Plugin

## Audience
Developers, engineering managers, and opencode community.

## Objective
Convince listeners that AUTOPILOT solves the #1 pain point in AI-assisted development: context drift and manual iteration.

## Core Narrative Arc
Problem (context drift costs 30-50% productivity) → Solution (AUTOPILOT's persistent iteration loop) → How it works (supervised FSM with state persistence) → Why it's different (openstate plugin, no infrastructure) → Next steps (open-source beta).

## Slide Outline
1. Title: AUTOPILOT — Autonomous AI Iteration for Opencode
2. Problem: "Why do AI sessions degrade after 20 minutes?"
3. Root Cause: No persistent state, no iteration loop
4. Solution: Describe once, ship reviewed
5. Architecture: Plan → Code → Review → Test → Commit
6. Key Differentiator: State persistence across sessions
7. Competitive Landscape (vs Claude Code, Copilot, Cursor)
8. Roadmap: 12-sprint plan, 6-month MVP
9. Call to Action: Contribute on GitHub, join beta

## Key Claims with Sources
- "30-50% productivity lost to context management" — Problem identification docs
- "$2.2B TAM" — Market sizing docs
- "6-month MVP with 2 FTE" — Feasibility assessment + Roadmap
- "Go decision (conditional on API prototype)" — Feasibility assessment

## Metrics & Assumptions
- 6.4K users Year 1, 19.2K Year 2, 48K Year 3
- Open-source core + enterprise support at $20/mo
- 2 FTE development team

## Slide Detail

| # | Slide Title | Key Message | Evidence Source | Visual Suggestion | Speaker Note Intent |
|---|---|---|---|---|---|
| 1 | Title: AUTOPILOT | Autonomous AI iteration for opencode | — | Title slide with logo, tagline, version badge | Set context: what this is and why it matters |
| 2 | Problem: AI session degradation | "Why do AI sessions degrade after 20 minutes?" | `requirements/problem-identification.md` | Graphic showing productivity cliff (line chart: time vs output) | Make the pain visceral — every dev has felt this |
| 3 | Root Cause | No persistent state, no iteration loop | `requirements/brd/autopilot-plugin.md` | Diagram: stateless chat vs stateful FSM | Connect problem to architectural gap |
| 4 | Solution | Describe once, ship reviewed | `modules/core/iteration-loop.md` | Flowchart: Plan→Code→Review→Test→Commit | Present the core value proposition clearly |
| 5 | Architecture | Plan → Code → Review → Test → Commit FSM | `modules/core/architecture.md` | Mermaid flowchart showing iteration engine | Explain how the pieces fit together |
| 6 | Key Differentiator | State persistence across sessions | `modules/core/state-persistence.md` | Before/after comparison of session recovery | Show concrete edge over competitors |
| 7 | Competitive Landscape | vs Claude Code, Copilot, Cursor | `requirements/competitor-analysis.md` | Comparison matrix (features x tools) | Prove we are differentiated, not just another AI tool |
| 8 | Roadmap | 12-sprint plan, 6-month MVP | `tasks/roadmap.md` | Gantt-style timeline | Build confidence in delivery plan |
| 9 | Call to Action | Contribute on GitHub, join beta | — | Final slide with QR code, links, contact | Drive to action — make it easy to say yes |

## Visual Assets

- **Diagram Types**: Use Mermaid for architecture flows (flowchart LR/TB), comparison tables for competitive landscape, line charts for productivity data, Gantt-style bar charts for roadmap
- **Color Scheme**: Match opencode brand — dark blue (#1a1a2e) primary, teal (#00d4aa) accent, white text on dark backgrounds
- **Logo**: Use AUTOPILOT icon (gear + play triangle) positioned top-left on title slide, small footer on content slides
- **Typography**: System monospace for code snippets, sans-serif for body text
- **Slide Transitions**: Simple fade — no animations that distract from content

## Exclusions
- No mobile UI in MVP scope
- No enterprise SSO in Phase 1
- Multi-model routing deferred to Phase 3
