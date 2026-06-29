# Technology Stack Selection: AUTOPILOT Plugin

## Analysis
AUTOPILOT is an opencode plugin — this constrains the core stack to TypeScript/JavaScript (opencode plugin API). Key requirements: session management, file I/O, subprocess execution (linting, testing), disk persistence, API client for AI providers.

## Stack Options

| Layer | Option A (Recommended) | Option B | Option C |
|---|---|---|---|
| Language | TypeScript 5.x | TypeScript 5.x | TypeScript 5.x |
| Runtime | Node.js 20+ LTS | Node.js 20+ LTS | Bun 1.x |
| Build | esbuild | tsup | Bun (built-in) |
| Test | Vitest | Jest | Bun:test |
| Lint | ESLint + Prettier | Biome | ESLint + dprint |
| Package mgmt | npm/pnpm | pnpm | bun |
| Plugin format | opencode plugin spec | opencode plugin spec | opencode plugin spec |
| State format | JSON/Zlib compressed | MessagePack | SQLite |

## Decision Matrix

| Criterion | Weight | Option A | Option B | Option C |
|---|---|---|---|---|
| Ecosystem maturity | 30% | 5 | 5 | 3 |
| Build speed | 20% | 5 | 4 | 5 |
| Test features | 20% | 5 | 4 | 3 |
| Plugin compatibility | 20% | 5 | 5 | 4 |
| Community support | 10% | 5 | 4 | 2 |
| **Total** | **100%** | **5.0** | **4.6** | **3.4** |

## Recommendation

**Option A:** TypeScript 5.x + Node.js 20 LTS + esbuild + Vitest + ESLint/Prettier + JSON/Zlib state format.

Rationale: Maximum ecosystem compatibility with opencode (which itself uses TypeScript/Node.js). Vitest offers fastest test execution and native TypeScript support. JSON/Zlib provides simple debuggable state format with compression.
