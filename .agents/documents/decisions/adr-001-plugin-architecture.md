# ADR-001: Plugin Architecture

## Context
Need to decide deployment model for AUTOPILOT.

## Decision
Implement as an opencode plugin (not a standalone CLI or IDE extension).

## Rationale
- Leverages opencode's existing 7.5M MAU user base
- Plugin API provides session lifecycle hooks
- Zero infrastructure for end users
- Faster distribution via opencode plugin registry

## Consequences
- Dependent on opencode plugin API completeness
- Limited to opencode ecosystem (no standalone distribution)
- Must work within opencode process constraints (memory, CPU)
