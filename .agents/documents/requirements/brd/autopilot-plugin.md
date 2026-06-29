# Stakeholder Requirements: AUTOPILOT Plugin

## Functional Requirements

- FR-01: The system shall execute an iterative development loop (plan → code → review → test → commit) upon receiving a feature description from the user. (Source: Core value proposition. Priority: Must Have)
- FR-02: The system shall present each iteration step for user approval before executing it (supervised mode). (Source: Safety requirement. Priority: Must Have)
- FR-03: The system shall persist session state to disk between iterations, enabling context recovery after interruptions. (Source: Core differentiator. Priority: Must Have)
- FR-04: The system shall run configurable quality gates (linter, type checker, test runner) after code generation. (Source: Quality requirement. Priority: Should Have)
- FR-05: The system shall support multi-model routing, allowing different phases to use different AI models. (Source: Advanced user requirement. Priority: Could Have)

## Non-Functional Requirements

- NFR-01: The system shall complete a single iteration cycle (plan → commit) within 5 minutes for features under 500 lines. (Category: Performance. Source: User productivity expectation)
- NFR-02: The system shall gracefully handle API rate limits (429 errors) by implementing exponential backoff. (Category: Reliability. Source: Production readiness)
- NFR-03: The system shall not modify files outside the project working directory. (Category: Security. Source: Blast radius control)
- NFR-04: The system shall support codebases up to 500K files without degrading iteration performance. (Category: Scalability. Source: Large-repo support)

## Constraints

- **Technical:** Must be implemented as an opencode plugin using the opencode plugin API. Must support TypeScript/JavaScript as primary implementation language.
- **Business:** Must be open-source under MIT license. Must not require external infrastructure (self-contained in opencode). Must be distributable via opencode plugin registry.
- **Organizational:** Initial development by 2 FTE. Community contributions expected for additional quality gate integrations.

## Assumptions

- **A-01:** opencode plugin API provides sufficient hooks for session lifecycle interception. (Basis: opencode plugin documentation. Risk if wrong: Core architecture must be reworked)
- **A-02:** Users have basic familiarity with opencode CLI. (Basis: Target user personas. Risk if wrong: Onboarding documentation must be more comprehensive)

## Open Questions

- Q01: Does the opencode plugin API support pre/post model-call hooks? (Impact: Core architecture. Urgency: Blocking)
- Q02: How should multi-model state be reconciled when switching between models mid-session? (Impact: Multi-model feature design. Urgency: Important)

## Requirements Summary

AUTOPILOT is an opencode plugin that enables supervised AI coding iteration loops with disk-persisted state, configurable quality gates, and optional multi-model routing — all within the opencode CLI environment without external infrastructure.
