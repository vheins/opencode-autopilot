# MVP Scope Definition: AUTOPILOT Plugin

## MoSCoW Table

| Feature | Category | Rationale | Effort |
|---|---|---|---|
| Core iteration loop (plan → code → review → test → commit) | Must | Central value proposition; without this, AUTOPILOT is just a stateless plugin | L |
| Supervised mode (user approves each step before execution) | Must | Safety and trust; users won't adopt fully autonomous mode without confidence | M |
| State snapshot (disk-based context persistence) | Must | Prevents context drift across iterations; core differentiator | M |
| opencode plugin packaging + install | Must | Distribution requirement | S |
| Quality gates plugin (linter integration) | Should | Increases trust in output; can be manual in MVP | M |
| Multi-model routing (plan on Claude, code on GPT-4) | Should | Advanced users request this, but single-model MVP still delivers value | L |
| Backpressure / rate-limit handling | Should | Reliability requirement for production use | S |
| Auto-commit mode (no user approval needed) | Could | Natural progression after supervised mode gains trust | M |
| Parallel agent spawning | Could | Niche use case; complex to implement | XL |
| Custom quality gate integrations (user-defined) | Could | Important for adoption but not MVP-critical | M |
| GUI / Web dashboard | Won't | CLI-first philosophy; opencode already handles UI layer | XL |
| Enterprise SSO / audit logging | Won't | Phase 2 monetization feature | M |
| Cloud state sync (multi-device) | Won't | Complicates architecture; disk-only for MVP | L |

## Definition Statement

The AUTOPILOT MVP is an opencode plugin that enables supervised AI coding iteration loops: the user describes a feature, AUTOPILOT generates a plan, writes code, runs linters, executes tests, and presents the result for approval before committing — all within the opencode session. State is persisted to disk between iterations, preventing context drift. Single-model only (user's configured opencode model). The plugin is installable from the opencode plugin registry and requires no external infrastructure.

## Success Metrics

- **Feature completion rate:** ≥70% of user-initiated features reach "approved PR" within 3 iterations
- **User retention:** ≥60% of installers use the plugin for 3+ sessions in the first week
- **Time savings:** Users report ≥30% reduction in time-to-PR for features using AUTOPILOT vs. manual prompting
- **Error recovery:** ≥90% of iteration failures recover automatically without user intervention

## Risk Flags

| Risk | Mitigation |
|---|---|
| opencode plugin API insufficient for iteration loop | Prototype core loop in Month 1; collaborate with opencode team on API extensions |
| Users may distrust auto-generated code quality | Supervised mode by default; show diff + test results before commit approval |
| Scope creep from Should/Could items | Strictly gate any Should feature behind Must completion; defer Could to post-MVP |
