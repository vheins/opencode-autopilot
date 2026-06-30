import type { Plugin, Config } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"
import { StateManager } from "./state.js"
import { MCPClient } from "./mcp-client.js"
import { IterationPhase } from "./types.js"
import type { AutopilotConfig } from "./types.js"

import { ProviderFactory, type ProviderConfig } from "./provider.js"

// Re-export provider types for plugin consumers
export type {
  ProviderRequest,
  ProviderResponse,
  AiProvider,
  ProviderConfig,
} from "./provider.js"
export { ProviderFactory, MockProvider, OpencodeProvider, PHASE_PROMPTS } from "./provider.js"
import { IterationEngine } from "./engine.js"

const DEFAULT_CONFIG: AutopilotConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  autoCommit: false,
  confidenceThreshold: 70,
  modelMapping: {},
}

let stateManager: StateManager | null = null
let mcpClient: MCPClient | null = null
let engine: IterationEngine | null = null

export const autopilot: Plugin = async ({ project, directory, worktree }) => {
  mcpClient = new MCPClient()

  return {
    config: async (cfg: Config) => {
      const pluginConfig = cfg?.plugin?.find(
        (p: any) => Array.isArray(p) && p[0] === "@vheins/opencode-autopilot"
      )
      const options = Array.isArray(pluginConfig) ? pluginConfig[1] || {} : {}
      const config: AutopilotConfig = { ...DEFAULT_CONFIG, ...options }

      if (!mcpClient) throw new Error("MCP client not created")
      await mcpClient.connect("npx", ["-y", "@vheins/local-memory-mcp"])
      stateManager = new StateManager(config, mcpClient)
      const providerFactory = new ProviderFactory()
      const provider = providerFactory.createProvider({ type: "mock" })
      engine = new IterationEngine(stateManager, provider, { maxRetries: config.maxRetries })

      // State recovery on startup — restore sessions from MCP memory
      try {
        const count = await stateManager.loadState()
        if (count > 0) {
          console.log(`[autopilot] Recovered ${count} sessions from persistence`)

          // Mark stale sessions (>24h without activity) as paused
          const now = Date.now()
          const dayMs = 24 * 60 * 60 * 1000
          const sessions = await stateManager.listSessions()
          for (const session of sessions) {
            if (session.status === "active") {
              const lastActivity = new Date(session.lastActivity).getTime()
              if (now - lastActivity > dayMs) {
                await stateManager.updateSession(session.id, { status: "paused" })
                console.log(`[autopilot] Paused stale session ${session.id.slice(0, 8)} (inactive >24h)`)
              }
            }
          }
        } else {
          console.log("[autopilot] No previous sessions found to recover")
        }
      } catch (e) {
        console.log("[autopilot] Session recovery failed, starting fresh")
      }

      console.log(`[autopilot] Initialized with config:`, config)
    },

    tool: {
      autopilot_start: tool({
        description:
          "Start a new AUTOPILOT feature implementation. Creates a session and begins the planning phase. " +
          "If a resumable session with the same description exists, returns its info instead of creating a new one.",
        args: {
          description: z
            .string()
            .min(1)
            .max(2000)
            .describe("Feature description to implement"),
        },
        execute: async ({ description }, context) => {
          if (!stateManager) throw new Error("AUTOPILOT not initialized")

          // Check for existing resumable session with matching description
          const resumable = await stateManager.listResumableSessions()
          const existing = resumable.find(
            (s) => s.featureDescription.toLowerCase() === description.trim().toLowerCase()
          )
          if (existing) {
            return {
              output: JSON.stringify({
                sessionId: existing.id,
                status: existing.status,
                currentPhase: existing.currentPhase,
                message: `Existing session found for "${description}". Use autopilot_resume with sessionId "${existing.id.slice(0, 8)}..." to resume.`,
              }),
            }
          }

          const result = await stateManager.createSession(
            description,
            context.directory,
          )

          // Start iteration engine
          if (engine) {
            const engineState = await engine.startIteration(result.session.id)
            return {
              output: JSON.stringify({
                sessionId: result.session.id,
                status: "planning",
                phase: engineState.phase,
                transitions: engineState.transitions,
                message: `AUTOPILOT session started for: ${description}`,
              }),
            }
          }

          return {
            output: JSON.stringify({
              sessionId: result.session.id,
              status: "planning",
              message: `AUTOPILOT session started for: ${description}`,
            }),
          }
        },
      }),

      autopilot_resume: tool({
        description:
          "Resume an existing AUTOPILOT session. Restores the session to its last known state " +
          "and returns recovery metadata. Handles stale, paused, and active sessions.",
        args: {
          sessionId: z.string().describe("Session ID to resume"),
        },
        execute: async ({ sessionId }) => {
          if (!stateManager) throw new Error("AUTOPILOT not initialized")
          const result = await stateManager.resumeSession(sessionId)

          // Resume engine state
          if (engine) {
            await engine.resume(result.session.id, result.session.currentPhase)
          }

          return {
            output: JSON.stringify({
              sessionId: result.session.id,
              status: result.session.status,
              currentPhase: result.session.currentPhase,
              iterationCount: result.session.iterationCount,
              recovered: result.recovered,
              warnings: result.warnings,
              message: result.warnings.length > 0
                ? `Session resumed with ${result.warnings.length} warning(s)`
                : "Session resumed successfully",
            }),
          }
        },
      }),

      autopilot_status: tool({
        description:
          "Check AUTOPILOT session status. Returns current phase, recent activity, and iteration count.",
        args: {
          sessionId: z
            .string()
            .optional()
            .describe("Session ID. Lists all sessions if omitted."),
        },
        execute: async ({ sessionId }) => {
          if (!stateManager) throw new Error("AUTOPILOT not initialized")
          if (sessionId) {
            const session = await stateManager.getSession(sessionId)
            const engineState = engine?.getState() ?? null
            return {
              output: JSON.stringify(
                session
                  ? { session, engine: engineState }
                  : { error: "Session not found", sessionId, engine: engineState },
              ),
            }
          }
          const sessions = await stateManager.listSessions()
          return {
            output: JSON.stringify({
              total: sessions.length,
              active: sessions.filter((s) => s.status === "active").length,
              sessions,
            }),
          }
        },
      }),

      autopilot_stop: tool({
        description:
          "Stop the current AUTOPILOT iteration. Preserves session state for later resume.",
        args: {
          sessionId: z.string().describe("Session ID to stop"),
          reason: z
            .string()
            .optional()
            .describe("Optional reason for stopping"),
        },
        execute: async ({ sessionId, reason }) => {
          if (!stateManager) throw new Error("AUTOPILOT not initialized")
          await stateManager.updateSession(sessionId, {
            status: "paused",
            currentPhase: IterationPhase.Idle,
          })
          return {
            output: JSON.stringify({
              sessionId,
              status: "paused",
              message: reason ? `Stopped: ${reason}` : "Session paused",
            }),
          }
        },
      }),
    },
  }
}
