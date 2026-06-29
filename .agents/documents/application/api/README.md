# API Reference

- [CLI API Reference](cli.md) — Complete CLI command reference for AUTOPILOT

## Global Conventions

AUTOPILOT follows JSON:API-inspired conventions:

- **Commands**: `autopilot <action> [arguments]` — consistent verb-noun structure
- **Output**: Tabular text for lists, structured text for details, machine-parseable where practical
- **Exit Codes**: 0 (success), 1 (error), 2 (invalid args), 3 (session not found)
- **Environment**: `AUTOPILOT_*` environment variables for configuration overrides
- **Configuration**: `autopilot config show/set/list` for runtime configuration
