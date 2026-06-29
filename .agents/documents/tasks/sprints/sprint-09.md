# Sprint 09: Release Preparation (Weeks 17-18)

## Goal
Plugin registry submission, user documentation, quickstart guide.

## Tasks
| Task | Effort | Owner | Dependencies |
|---|---|---|---|
| opencode plugin registry packaging | S | Dev 1 | Sprint 08 |
| README and quickstart guide | M | Dev 1 | Sprint 08 |
| CLI help text review | S | Dev 2 | Sprint 08 |
| Automated smoke tests | M | Dev 2 | Sprint 08 |
| Beta release candidate | S | Dev 1 | Task 1-4 |

## Details

### Task 1 — opencode plugin registry packaging

Package the plugin for npm auto-install by opencode:

- **package.json fields**: `"type": "module"`, `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`
- **exports**: `".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" }`
- **peerDependencies**: `{ "@opencode-ai/plugin": ">=1.0.0" }` — opencode provides this at runtime
- **files**: `["dist/"]` — only publish compiled output
- **Build**: Use `tsc` or `esbuild` to compile `src/` → `dist/`
- **npm package name**: `@vheins/opencode-autopilot`
- **Registration**: Users add `"plugin": ["@vheins/opencode-autopilot"]` to `opencode.json`; opencode auto-installs via Bun at startup
- **Ecosystem PR**: After publishing, submit a PR at https://opencode.ai/docs/ecosystem/ to list the plugin

## Sprint Capacity: 8/8 points

## Demo
Plugin installable from registry. README with quickstart. Smoke tests pass.
