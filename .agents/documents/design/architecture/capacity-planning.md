# Capacity Planning: AUTOPILOT Plugin

## Load Projections

| Metric | Year 1 (6.4K users) | Year 2 (19.2K users) | Year 3 (48K users) |
|---|---|---|---|
| Sessions/day | 1,280 | 5,760 | 19,200 |
| Iterations/day | 6,400 | 28,800 | 96,000 |
| State storage | 6.4 GB | 57.6 GB | 480 GB |
| API calls/day | 25,600 | 115,200 | 384,000 |

## Infrastructure Requirements
- **State storage**: Local filesystem only (no server). Max 10MB/session → 64GB for 6,400 concurrent sessions
- **CPU**: Plugin runs in-process with opencode; typical <5% CPU per active session
- **Memory**: <100MB per active session; 500MB peak for large codebase indexing
- **API rate limits**: Design for 10 req/min per AI provider key; multi-key support for heavy users

## Scaling Strategy
- Level 1 (Year 1): Single-process, local state — no infrastructure
- Level 2 (Year 2): Optional state sync to S3-compatible storage for multi-device users
- Level 3 (Year 3): Enterprise deployment with shared state server, audit logging
