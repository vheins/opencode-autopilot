# Smoke Test Suite Design: AUTOPILOT Plugin

## Smoke Tests (Post-Deploy)

| Test | Expected | Duration |
|---|---|---|
| Plugin loads without errors | `autopilot` command available | < 1s |
| Help displays | `autopilot help` shows all commands | < 1s |
| Session create | `autopilot implement "test feature"` starts session | < 5s |
| Session list | `autopilot sessions` shows active session | < 1s |
| Config show | `autopilot config show` displays configuration | < 1s |
