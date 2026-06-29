# Feature Decomposition: AUTOPILOT Core Loop

| Task # | Task Name | Description | Effort | Dependencies | Acceptance Criteria | Source Docs |
|---|---|---|---|---|---|---|
| 1 | Plugin scaffolding | Create opencode plugin structure with manifest, configuration, and stub hooks | S | None | Plugin loads in opencode without errors | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |
| 2 | Session lifecycle manager | Implement session create/resume/list/delete with disk persistence | M | 1 | Sessions persist across terminal restarts | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |
| 3 | Iteration loop engine | Core FSM: plan → code → review → test → commit with state transitions | L | 2 | Full iteration cycle completes on test repo | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |
| 4 | Supervised mode UI | Present plan/code diff for user approval at each step | M | 3 | User can approve/reject with feedback | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |
| 5 | Quality gate runner | Execute linter + test runner on generated code | M | 3 | Lint/test results integrated into iteration loop | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |
| 6 | Backpressure handler | Exponential backoff on API rate limits, max retry count | S | 3 | 429 errors handled gracefully | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |
| 7 | Auto-commit mode | Skip approval steps when confidence is high | M | 4-5 | Commits created without manual intervention when enabled | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |
| 8 | Multi-model router | Route phases to different AI models | L | 3 | Plan uses Claude, code uses GPT-4 when configured | `.agents/documents/design/architecture/autopilot-core-tech-design.md` |

## Implementation Order
1-2-3-4 → (5,6 parallel) → 7-8

## Parallel Opportunities
Tasks 5 and 6 can be developed in parallel after task 3.

## Risk Flags
- Task 3 (Iteration loop engine) is highest complexity — prototype first to validate opencode API
- Task 8 (Multi-model) requires multi-API-key management — design for single-model-first and extend
