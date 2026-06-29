# Acceptance Criteria: AUTOPILOT Core Loop

## Happy Path
- **Given** AUTOPILOT is loaded in an opencode session, **When** I run `autopilot implement "add logging middleware"`, **Then** AUTOPILOT generates a plan within 30 seconds.
- **Given** a plan is generated, **When** I approve it in supervised mode, **Then** AUTOPILOT writes code and presents the diff within 5 minutes.
- **Given** code is generated, **When** linters pass, **Then** AUTOPILOT runs tests automatically.
- **Given** all tests pass, **When** I approve the commit, **Then** AUTOPILOT creates a git commit with a structured message.

## Edge Cases
- **Given** the codebase has 0 tests, **When** AUTOPILOT runs the test phase, **Then** it reports "No test configuration found" and prompts me to configure tests or skip.
- **Given** a session has 2+ hours of inactivity, **When** I resume, **Then** AUTOPILOT re-analyzes the codebase for changes before continuing.
- **Given** the feature description exceeds 2000 characters, **When** I submit it, **Then** AUTOPILOT requests a more concise description.

## Errors
- **Given** the opencode API hook is unavailable, **When** AUTOPILOT starts, **Then** it logs error "ERR-001: Plugin API hook not found" and exits gracefully.
- **Given** an API rate limit (429) is encountered, **When** AUTOPILOT receives the error, **Then** it backs off exponentially (1s, 2s, 4s, 8s) up to 3 retries.
- **Given** code generation fails with a provider error, **When** AUTOPILOT detects the failure, **Then** it retries once with a different model if configured, or reports the error.

## Non-Functional
- **Given** AUTOPILOT is running, **When** I invoke it, **Then** it must not consume more than 500MB additional RAM beyond the opencode process.
- **Given** disk-based state persistence, **When** saving session state, **Then** the snapshot file must not exceed 10MB.

## Testability Notes
- Core iteration loop: E2E test with a test repo and mock opencode hooks
- State persistence: Unit test snapshot serialization/deserialization
- Error handling: Integration test with mock API returning 429/500
