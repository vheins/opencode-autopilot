# Technical Design Document: AUTOPILOT Plugin

## Implementation Plan

### Phase 1 (Months 1-2): Core MVP
1. **Plugin scaffolding** (1 week) — opencode plugin manifest, stubs
2. **Session manager** (2 weeks) — Create/resume/list/delete, state persistence
3. **Iteration engine FSM** (1 month) — Plan → Code → Lint → Test → Commit
4. **Supervised mode** (1 month) — Approval prompts, diff display

### Phase 2 (Months 3-4): Quality & Reliability
5. **Quality gates** (1.5 months) — ESLint, Vitest integration
6. **Backpressure** (2 weeks) — Rate limit handling, retry logic

### Phase 3 (Month 5+): Advanced
7. **Auto-commit** (1 month) — Unattended mode with confidence thresholds
8. **Multi-model routing** (2 months) — Different models per phase

## Tech Stack
- TypeScript 5.x + Node.js 20 LTS + esbuild + Vitest
- State: JSON + zlib compression + SHA256
- No external infrastructure required
