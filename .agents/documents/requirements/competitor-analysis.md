# Competitor Analysis: AUTOPILOT Plugin

## Comparison Table

| Competitor | Type | Core Features | Pricing | Strengths | Weaknesses |
|---|---|---|---|---|---|
| Claude Code (Anthropic) | Built-in agent mode | Terminal-based agent, file editing, bash commands, multi-step reasoning | Claude Pro ($20/mo) or API usage | Strong reasoning, built-in agent loop, Anthropic quality | No persistent state across sessions, no plugin ecosystem, single-model |
| Copilot Autopilot (GitHub) | Built-in agent mode | Autonomous PR creation, issue-driven development, multi-file edits | Copilot Enterprise ($39/mo) | Tight GitHub integration, large user base, enterprise support | Closed-source, platform-locked, limited customization, no multi-model |
| Cursor (Anysphere) | IDE + agent | Agent mode, composer, multi-file editing, codebase indexing | Pro ($20/mo), Business ($40/mo) | Excellent codebase understanding, fast agent loop, good UX | Proprietary IDE fork, limited extensibility, single-model agent |
| Continue.dev | Open-source IDE extension | Custom agent pipelines, MCP server support, model switching | Free (open source) | Open-source, extensible, MCP-based architecture | Less polished UX, smaller ecosystem, requires configuration |
| Aider (Paul Gauthier) | CLI tool | Git-aware coding agent, repo-level editing, map-refine | Free (open source) | Map-refine architecture, excellent repo understanding, git integration | CLI-only, no GUI/IDE, limited multi-model, no state persistence |
| **AUTOPILOT** | **Plugin (opencode)** | **Persistent state, iteration loop, quality gates, multi-model** | **Free (open source)** | **opencode integration, state-on-disk, backpressure, multi-model orchestration** | **Requires opencode, new ecosystem, early-stage** |

## Feature Gap Analysis

| Gap | Competitor Shortfall | Opportunity Size |
|---|---|---|
| **Persistent session state** | All competitors lose context on session end; no working memory survives across iterations | Large — this is the #1 pain point in long AI sessions |
| **Multi-model orchestration** | Competitors are single-model; no shared state between different models for different phases | Medium — advanced users already run multi-model workflows manually |
| **Quality gates in loop** | No competitor bakes lint → test → review → commit into the agent's own iteration loop | Medium — developer must manually run and re-prompt with results |
| **Backpressure / rate limiting** | No competitor handles API rate limiting gracefully within the agent loop; sessions fail on 429s | Small — important for reliability but not visible to end user |
| **Plugin-architecture state persistence** | Competitors are monolithic tools; none expose a plugin API for state management | Large — no competitor enables custom state persistence for the AI agent |

## Pricing Landscape

- **Free tier**: Continue.dev, Aider — open-source, community-supported
- **$10-20/mo individual**: Cursor, Claude Code, Copilot Individual
- **$39-40/mo enterprise**: Copilot Enterprise, Cursor Business
- **AUTOPILOT recommendation**: Free open-source plugin distributed via opencode plugin registry. Monetization via enterprise support/self-hosted licensing tier ($20/mo for team features: audit logs, access control, custom quality gates).

## Positioning Angle

**Segment to avoid:** Competing directly with IDE-embedded agents (Cursor, Copilot) on UX polish or codebase indexing — they own those categories.

**Gap to target:** Persistent state & autonomous iteration loop for opencode users who want to "describe once, ship reviewed" without manual multi-step prompting.

**Positioning statement:** AUTOPILOT is the opencode plugin that turns AI coding sessions from stateless conversations into autonomous iteration pipelines — where context persists, quality gates run automatically, and multi-model orchestration happens without manual intervention.
