# ADR-003: Supervised Mode Default

## Context
Should AUTOPILOT commit changes automatically or require human approval?

## Decision
Default to supervised mode (user must approve plan and commit). Auto-commit is an opt-in feature.

## Rationale
- Safety: users trust AI more when they can review output before it enters their codebase
- Learning: users learn what AUTOPILOT can do by observing its output
- Quality: human review catches issues AI might miss
- Adoption: supervised mode has lower perceived risk for new users

## Consequences
- Slower iteration than fully autonomous mode
- Requires clear, concise diff presentation
- Auto-commit mode becomes natural upgrade path for power users
