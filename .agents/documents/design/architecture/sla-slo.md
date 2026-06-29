# SLA/SLO Definition: AUTOPILOT Plugin

## Service Level Objectives

| Metric | Target | Measurement | Window |
|---|---|---|---|
| Iteration completion time | ≤5 min for <500 LOC features | P95 latency | Daily |
| State snapshot save | ≤500ms | P99 latency | Daily |
| Plugin startup time | ≤2s | P95 latency | Daily |
| Session recovery | ≤3s from resume command | P99 latency | Daily |
| Uptime (no crash) | 99.9% | Crash rate | Monthly |
| Successful iteration rate | ≥90% (reaches commit step) | Success/session | Monthly |

## Error Budgets
- Monthly uptime budget: 43 minutes of degraded service
- Deployment may proceed when error budget ≥50% remaining
- Budget exhaustion → freeze deployments, focus on reliability

## SLIs to Track
- API provider response time and error rate
- Iteration step success/failure ratio
- State snapshot corruption rate
- User abandonment rate (sessions not resumed)
