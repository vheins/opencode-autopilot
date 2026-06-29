# BDD Scenarios: AUTOPILOT Core Loop

```gherkin
Feature: AUTOPILOT Iteration Loop
  As a developer
  I want AUTOPILOT to autonomously plan, code, review, test, and commit features
  So that I can ship working code with minimal manual iteration

  Background:
    Given AUTOPILOT plugin is loaded in an opencode session
    And the project has a git repository initialized
    And a linter (eslint) and test runner (pytest) are configured

  Scenario: Successful feature implementation with supervised mode
    Given supervised mode is enabled
    When I run "autopilot implement 'add user login endpoint'"
    Then AUTOPILOT generates a plan within 30 seconds
    And the plan includes files to create/modify, architecture summary, and test strategy

  Scenario: Plan approval triggers code generation
    Given AUTOPILOT has generated a plan
    When I approve the plan
    Then AUTOPILOT generates code implementing all planned files
    And runs the configured linter on generated code
    And runs the configured test suite
    And presents the diff with lint and test results

  Scenario: Lint failure triggers fix cycle
    Given AUTOPILOT generated code with lint errors
    When AUTOPILOT detects lint errors
    Then it auto-fixes fixable issues
    And reports non-fixable issues for user action

  Scenario: Test failure triggers re-generation
    Given AUTOPILOT ran tests and some failed
    When test failures are detected
    Then AUTOPILOT logs the failures
    And re-enters code generation with failure context
    And presents updated code after fix attempt

  Scenario: State persistence across sessions
    Given I have an active AUTOPILOT session
    When I close and reopen my terminal
    Then I can resume the session with "autopilot resume <session-id>"
    And AUTOPILOT restores the last completed iteration state

  Scenario: Graceful API rate limit handling
    Given the AI provider returns a 429 rate limit error
    When AUTOPILOT receives the error
    Then it waits with exponential backoff (1s, 2s, 4s max)
    And retries the failed request up to 3 times
    And reports if all retries are exhausted
```
