# Best Practices Scout: AUTOPILOT Plugin

## Similar Projects Analyzed
- **Aider** (Python): Map-refine architecture for repository-level understanding. Key takeaway: git-aware diffs and automatic commit messages.
- **Continue.dev** (TypeScript): MCP-based plugin architecture. Key takeaway: extensibility via MCP servers; plugin configuration patterns.
- **Claude Code** (TypeScript): Agent loop with tool use. Key takeaway: step-by-step user approval flow; clear action presentation.

## Applicable Patterns
1. **Map-refine** (from Aider): Generate codebase map once, then refine only changed files each iteration
2. **MCP server pattern** (from Continue): Plugin communicates with quality gates via MCP protocol for loose coupling
3. **Approval flow** (from Claude Code): Present plan → get approval → execute → present result → get approval

## Anti-Patterns to Avoid
- Full context pass on every iteration (causes bloat) — use compressed summaries instead
- Monolithic state files — split by session/iteration for performance
- Synchronous API calls without timeout — always use AbortController with 60s timeout
