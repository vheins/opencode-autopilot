# User Stories: AUTOPILOT Core Loop

## Story 1: Feature from Description
**As a** solo developer, **I want** to describe a feature in natural language and have AUTOPILOT generate a complete implementation, **so that** I can ship features faster without manual iteration.

- **Given** I am in an opencode session with AUTOPILOT loaded, **When** I run `autopilot implement "add user authentication with JWT"`, **Then** AUTOPILOT generates a plan, writes code, runs linters, executes tests, and presents the diff for review.
- **Given** AUTOPILOT has completed all iteration steps, **When** I review the generated code, **Then** I see file-by-file diffs with lint results and test pass/fail status.
- **Given** I decline the generated code, **When** I provide feedback in a follow-up prompt, **Then** AUTOPILOT regenerates based on my feedback without losing session context.

## Story 2: Supervised Iteration
**As a** team lead, **I want** to approve each step of the AI iteration loop before it executes, **so that** I maintain control over code that enters my codebase.

- **Given** supervised mode is enabled, **When** AUTOPILOT completes the planning phase, **Then** it presents the plan and waits for my approval before writing code.
- **Given** I reject the plan, **When** AUTOPILOT receives my rejection, **Then** it returns to planning with my feedback incorporated.
- **Given** I approve code generation but a linter error is found, **When** AUTOPILOT detects the error, **Then** it presents the error and waits for my direction (fix automatically or let me fix manually).

## Story 3: State Persistence
**As a** developer with a complex feature, **I want** AUTOPILOT to persist session state to disk, **so that** I can resume work after closing my terminal or switching contexts.

- **Given** I have an active AUTOPILOT session working on a feature, **When** I close my terminal and reopen it, **Then** AUTOPILOT resumes from the last completed iteration step with full context.
- **Given** I have multiple AUTOPILOT sessions for different features, **When** I list sessions with `autopilot sessions`, **Then** I see all active sessions with their current status and last activity.
- **Given** a session is 24 hours old, **When** I attempt to resume it, **Then** AUTOPILOT warns me about stale context and offers to re-analyze the codebase.

## Story 4: Quality Gates
**As a** team lead reviewing AI-generated PRs, **I want** AUTOPILOT to enforce code quality standards before committing, **so that** I spend less time on style and formatting issues during review.

- **Given** AUTOPILOT has generated code, **When** it runs the configured linter, **Then** it auto-fixes fixable issues and reports non-fixable ones to me.
- **Given** test execution fails, **When** AUTOPILOT detects the failure, **Then** it logs the failure details and re-enters the code generation phase to fix the failing test.
- **Given** the linter and tests both pass, **When** AUTOPILOT prepares the commit, **Then** it includes a structured commit message with iteration summary and quality gate results.

## Coverage Summary

**Covered:** Feature initiation, supervised approval flow, state persistence across sessions, quality gate enforcement. **Excluded:** Multi-model routing (deferred), parallel agent spawning (deferred), cloud state sync (deferred).

## Suggested Story Order

Story 1 (Feature from Description) → Story 3 (State Persistence) → Story 4 (Quality Gates) → Story 2 (Supervised Iteration)
