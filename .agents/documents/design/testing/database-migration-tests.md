# Database Migration Tests: AUTOPILOT Plugin

## State Format Versioning

| Version | Format | Migration |
|---|---|---|
| v1 | JSON flat | — |
| v2 | JSON + compression (zlib) | Auto-detect and upgrade v1 on load |
| v3 | JSON + compression + SHA256 | Add integrity hash field |

## Migration Tests
- Load v1 state file in v2 plugin → auto-migrates to v2 format
- Load v2 state file in v3 plugin → adds SHA256 hash
- Corrupted v3 file → integrity check fails, recovery attempted from backup
- Unsupported version → clear error message, manual fix instructions
