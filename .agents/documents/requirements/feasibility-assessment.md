# Feasibility Assessment: AUTOPILOT Plugin

## Technical Score: 8/10

**Rationale:** AUTOPILOT leverages the existing opencode plugin API, which provides session lifecycle hooks, model configuration, and file system access. The core technical risks are:
- **Plugin API sufficiency (High risk):** opencode plugin API must support session lifecycle interception (pre-model-call, post-model-call, file-write events). If hooks are insufficient, we need to extend the API or use workarounds.
- **Multi-model orchestration (Medium risk):** Requires managing multiple API keys, model contexts, and response formats — well-understood pattern but adds complexity.
- **State persistence (Low risk):** File-system based state snapshots are straightforward; the design choice is what to persist and when.

## Financial Breakdown

| Category | Year 1 | Year 2 |
|---|---|---|
| Development (2 FTE) | $240K | $240K |
| API usage (dev + beta) | $5K | $20K |
| Infrastructure (CI, storage) | $3K | $10K |
| Community/Open-source costs | $2K | $5K |
| **Total** | **$250K** | **$275K** |

**Verdict:** Feasible with 2 FTE for Year 1. Plugin architecture keeps infrastructure costs minimal. Main cost is developer time.

## Time Assessment

| Feature | Effort | Timeline (2 FTE) | Risk |
|---|---|---|---|
| Core iteration loop (plan → code → review → test → commit) | 3 months | Months 1-3 | Medium — depends on API completeness |
| State persistence (disk snapshots) | 1 month | Month 2 | Low — well-understood pattern |
| Multi-model orchestration | 2 months | Months 3-4 | Medium — integration complexity |
| Quality gates integration | 1.5 months | Months 4-5 | Low — community adapter pattern |
| Backpressure + rate limiting | 1 month | Month 5 | Low — standard retry/backoff |
| Documentation + beta release | 1 month | Month 6 | Low |

**Verdict:** **On Track** — Full MVP achievable within 6 months with 2 FTE. If API gaps are found, add 1 month for opencode API extensions.

## Risk Matrix

| Risk | Dimension | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| opencode plugin API lacks required hooks | Technical | Medium | High | Prototype early; collaborate with opencode team on API gaps |
| Multi-model context switching causes state corruption | Technical | Low | High | Isolated context per model; rigorous state machine design |
| Low adoption in opencode ecosystem | Market | Medium | Medium | Focus on quality first; community contributions for integrations |
| Competing plugin emerges | Market | Low | Medium | Open-source + first-mover advantage; fast iteration |
| Developer prefers existing tool workflows | User | Medium | High | Supervised mode; incremental adoption path |

## Final Recommendation

> **Go** — AUTOPILOT is technically feasible within 6 months with 2 FTE. The core technical risk (opencode plugin API completeness) requires early validation via prototype. Recommend starting with "supervised iteration loop" as MVP, then adding autonomous mode based on user feedback. The Go decision is Conditional on successful API prototype in Month 1.
