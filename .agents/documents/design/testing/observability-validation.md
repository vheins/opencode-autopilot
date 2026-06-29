# Observability/Monitoring Validation: AUTOPILOT Plugin

## Metrics to Validate

| Metric | Collection | Validation |
|---|---|---|
| Iteration step duration | Timestamps in session state | Logged per step |
| API call success rate | Counter in provider wrapper | Tracked per provider |
| Rate limit occurrences | Counter in backpressure handler | Alert on >10/day |
| Session completion rate | Session status tracking | Weekly report |
| State snapshot size | File size on save | Monitor growth |

## Logging
- Structured JSON logs (not console.log)
- Log levels: debug, info, warn, error
- No PII or secrets in logs (scrub API keys, file paths)
- Log file: `.autopilot/logs/plugin.log`
