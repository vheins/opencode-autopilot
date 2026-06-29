# Edge Cases: AUTOPILOT Core Loop

| Category | Edge Case | Input Example | Expected Behavior | Risk | Likelihood |
|---|---|---|---|---|---|
| String | Empty feature description | "" | Reject with "Feature description required" | Medium | Low |
| String | Max length description | 5000+ chars | Request more concise description | Low | Low |
| Collection | Empty project (no files) | Fresh git init | Analyze empty dir, create from scratch | Medium | Medium |
| Collection | 500K+ file project | Large monorepo | Index first 10K files, lazy-load rest | High | Low |
| Null | Missing opencode API hooks | Plugin API sandbox | Graceful error: "ERR-001: Required hooks unavailable" | Critical | Medium |
| Concurrency | 2+ sessions modifying same file | Parallel implementations | Lock file; second session warned of conflict | High | Medium |
| Concurrency | API timeout during code gen | Network timeout | Retry x2 with backoff, then report failure | Medium | High |
| External | AI provider returns gibberish | Nonsense code output | Detect via lint failure rate; escalate to user | High | Medium |
| External | Disk full during snapshot | No space left | Catch write error, report to user, keep state in memory | Medium | Low |
| Business | Feature requires auth (API keys) | "Add Google OAuth" | Warn about credential requirements; ask user to configure | Medium | Medium |
| Business | Iteration exceeds 10 cycles | Complex feature | Suggest feature decomposition; offer to reduce scope | Medium | Low |
| Security | Prompt injection attempt | "Ignore previous instructions" | Validate prompts; sandbox execution | Critical | Medium |
