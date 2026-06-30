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

// Import for local use and re-export
import { parsePlan, formatPlanForDisplay } from "./plan-parser.js"
export type { PlanFile, PlanStep, ParsedPlan } from "./plan-parser.js"
export { parsePlan, formatPlanForDisplay }
import { parseCodeGenOutput, writeFiles } from "./codegen.js"
export type { FileChange, CodeGenResult } from "./codegen.js"
export { parseCodeGenOutput, writeFiles }
import { generateDiff, formatDiff } from "./diff.js"
export type { DiffEntry, DiffHunk, DiffResult } from "./diff.js"
export { generateDiff, formatDiff }
import {
  SafetyChecker,
  defaultSafetyChecker,
  type SafetyRule,
  type SafetyCheckResult,
  type SafetyConfig,
  type SafetyAction,
} from "./safety.js"
export type { SafetyRule, SafetyCheckResult, SafetyConfig, SafetyAction }
export { SafetyChecker, defaultSafetyChecker }
import { IterationEngine } from "./engine.js"
import { Presenter } from "./presenter.js"

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
const presenter = new Presenter()

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

          const createResult = await stateManager.createSession(
            description,
            context.directory,
          )

          // Start iteration engine
          if (engine) {
            const engineResult = await engine.startIteration(createResult.session.id)
            if (engineResult.output) {
              const parsed = parsePlan(engineResult.output)
              return {
                output: JSON.stringify({
                  sessionId: createResult.session.id,
                  status: "awaiting_approval",
                  plan: formatPlanForDisplay(parsed),
                  prompt: "Approve this plan? Use autopilot_approve or autopilot_reject",
                }),
              }
            }
            return {
              output: JSON.stringify({
                sessionId: createResult.session.id,
                status: "planning",
                phase: engineResult.phase,
                transitions: engineResult.transitions,
                message: `AUTOPILOT session started for: ${description}`,
              }),
            }
          }

          return {
            output: JSON.stringify({
              sessionId: createResult.session.id,
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
            const display = engineState
              ? presenter.presentStatus(engineState.phase)
              : presenter.presentStatus(IterationPhase.Idle, "No active engine")

            // Include diff presentation when awaiting approval with pending changes
            let diffDisplay: string | undefined
            if (engineState?.phase === IterationPhase.AwaitingApproval && engine?.getPendingDiff()) {
              diffDisplay = presenter.presentDiff(engine.getPendingDiff()!)
            }

            return {
              output: JSON.stringify(
                session
                  ? { session, engine: engineState, display, diff: diffDisplay }
                  : { error: "Session not found", sessionId, engine: engineState, display, diff: diffDisplay },
              ),
            }
          }
          const sessions = await stateManager.listSessions()
          const display = presenter.presentSessions(sessions)
          return {
            output: JSON.stringify({
              total: sessions.length,
              active: sessions.filter((s) => s.status === "active").length,
              sessions,
              display,
            }),
          }
        },
      }),

      autopilot_review: tool({
        description:
          "Review the diff after code generation. Shows file changes, line statistics, " +
          "and prompts for approval or rejection.",
        args: {},
        execute: async () => {
          if (!engine) throw new Error("AUTOPILOT not initialized")
          const diff = engine.getPendingDiff()
          if (!diff) {
            return {
              output: JSON.stringify({
                message: "No pending diff to review. Code generation may not have completed yet.",
              }),
            }
          }
          return {
            output: presenter.presentDiff(diff),
          }
        },
      }),

      autopilot_approve: tool({
        description:
          "Approve the current iteration step and continue. Transitions from AwaitingApproval to Generating phase " +
          "(plan approval) or Reviewing phase (diff approval).",
        args: {},
        execute: async () => {
          if (!engine) throw new Error("AUTOPILOT not initialized")
          const state = engine.getState()
          // If there's a pending diff, this is a diff review approval — go to Reviewing
          const target = state.hasPendingDiff
            ? IterationPhase.Reviewing
            : IterationPhase.Generating
          const result = await engine.transition(target, { approved: true })
          return {
            output: JSON.stringify({
              phase: result.phase,
              output: result.output,
              message: state.hasPendingDiff
                ? "Changes approved. Proceeding to review..."
                : "Plan approved. Proceeding to code generation...",
            }),
          }
        },
      }),

      autopilot_reject: tool({
        description:
          "Reject the current step with feedback for regeneration. Transitions back to Planning phase " +
          "(plan rejection) or Generating phase (diff rejection).",
        args: {
          feedback: z
            .string()
            .min(1)
            .describe("Feedback for regeneration"),
        },
        execute: async ({ feedback }: { feedback: string }) => {
          if (!engine) throw new Error("AUTOPILOT not initialized")
          const state = engine.getState()
          // If there's a pending diff, this is a diff rejection — go to Generating to regenerate code
          const target = state.hasPendingDiff
            ? IterationPhase.Generating
            : IterationPhase.Planning
          const result = await engine.transition(target, { feedback })
          return {
            output: JSON.stringify({
              phase: result.phase,
              message: state.hasPendingDiff
                ? "Changes rejected. Regenerating code with feedback..."
                : "Plan rejected. Regenerating with feedback...",
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
