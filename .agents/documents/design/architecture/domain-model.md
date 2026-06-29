# Domain Model (DDD): AUTOPILOT Plugin

## Bounded Contexts

| Context | Responsibility | Core/Supporting |
|---|---|---|
| Session Management | Create, resume, list, delete sessions | Supporting |
| Iteration Engine | Plan → Code → Review → Test → Commit FSM | Core |
| Quality Gate Integration | Run linters, test runners | Supporting |
| State Persistence | Snapshot/restore session state | Supporting |
| Provider Abstraction | AI model API communication | Supporting |
| Backpressure | Rate limit handling, retry logic | Generic |

## Ubiquitous Language
- **Session**: A unit of work representing one feature implementation attempt
- **Iteration**: One cycle through plan → code → review → test → commit
- **Step**: A single phase within an iteration (e.g., planning, code generation)
- **Snapshot**: Serialized session state stored on disk
- **Quality Gate**: An external tool (linter, test runner) that validates generated code
- **Artifact**: Output of a phase (plan, diff, lint result, test result)
