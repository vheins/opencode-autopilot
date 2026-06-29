# Product Requirements Document: AUTOPILOT Plugin

## Product Overview
AUTOPILOT is an opencode plugin that enables autonomous AI coding iteration: describe a feature once, and AUTOPILOT plans, codes, reviews, tests, and commits the implementation — with persistent state, supervised approval, and quality gate enforcement.

## Target Personas
1. Solo Developer "Alex" — wants to ship features faster without manual iteration
2. Team Lead "Jordan" — needs consistent, reviewable AI-generated code
3. CI/CD Operator "Sam" — wants to automate code generation in pipelines

## Core Features (MVP)
1. **Iteration Loop**: Plan → Code → Review → Test → Commit FSM
2. **Supervised Mode**: User approves each step before execution
3. **State Persistence**: Disk-based session snapshots
4. **Quality Gates**: Linter and test runner integration
5. **Backpressure**: API rate limit handling

## Feature Priorities (RICE)
1. Plugin packaging (125) — 1 week effort
2. Supervised mode (50) — 1 month
3. State snapshot (40) — 1 month
4. Core iteration loop (33) — 3 months
5. Backpressure (32) — 1 month
