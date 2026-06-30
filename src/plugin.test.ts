import { describe, it, expect, vi, beforeEach } from "vitest"

// Shared mock instances that tests can manipulate
const mockMCPInstance = {
  connect: vi.fn().mockResolvedValue(undefined),
  call: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  createSessionTask: vi.fn().mockResolvedValue({}),
  updateSessionTask: vi.fn().mockResolvedValue({}),
  listSessionTasks: vi.fn().mockResolvedValue([]),
  storeMemory: vi.fn().mockResolvedValue({}),
  searchMemory: vi.fn().mockResolvedValue([]),
  getMemoryDetail: vi.fn().mockResolvedValue({}),
  getTask: vi.fn().mockResolvedValue({}),
}

const mockStateInstance = {
  createSession: vi.fn(),
  getSession: vi.fn(),
  listSessions: vi.fn().mockResolvedValue([]),
  updateSession: vi.fn().mockResolvedValue({ id: "test-session-id", status: "paused" }),
  deleteSession: vi.fn(),
  saveState: vi.fn(),
  loadState: vi.fn().mockResolvedValue(0),
  integrityCheck: vi.fn(),
  saveSession: vi.fn(),
  loadSession: vi.fn(),
  resumeSession: vi.fn(),
  listResumableSessions: vi.fn().mockResolvedValue([]),
  getConfig: vi.fn(),
  storeIterationContext: vi.fn(),
}

vi.mock("./mcp-client.js", () => ({
  MCPClient: vi.fn(() => mockMCPInstance),
}))

vi.mock("./state.js", () => ({
  StateManager: vi.fn(() => mockStateInstance),
}))

// Mock fs for safety checks in autopilot_commit and file writing in codegen
vi.mock("fs", () => ({
  default: {
    promises: {
      readdir: vi.fn().mockResolvedValue(["file1.ts", "file2.ts"]),
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(""),
    },
  },
  promises: {
    readdir: vi.fn().mockResolvedValue(["file1.ts", "file2.ts"]),
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(""),
  },
}))

import { autopilot } from "./index.js"

/**
 * Because the module-level singleton state (stateManager/engine) persists
 * across tests, we test "not initialized" behavior by running those tests
 * FIRST (they cannot call config). Subsequent tests can safely call config
 * to set up initialized state. We rely on vi.clearAllMocks() in beforeEach
 * to reset mock call counters but NOT the module variables themselves.
 */

describe("autopilot plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("plugin shape", () => {
    it("should return plugin with config and tool", async () => {
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      expect(plugin).toHaveProperty("config")
      expect(plugin).toHaveProperty("tool")
      expect(typeof plugin.config).toBe("function")
    })

    it("should register all 8 autopilot tools", async () => {
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      const tools = plugin.tool
      expect(tools.autopilot_start).toBeDefined()
      expect(tools.autopilot_resume).toBeDefined()
      expect(tools.autopilot_status).toBeDefined()
      expect(tools.autopilot_review).toBeDefined()
      expect(tools.autopilot_approve).toBeDefined()
      expect(tools.autopilot_reject).toBeDefined()
      expect(tools.autopilot_commit).toBeDefined()
      expect(tools.autopilot_stop).toBeDefined()
    })

    it("each tool should have description, args, and execute", async () => {
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      for (const [name, toolDef] of Object.entries(plugin.tool)) {
        expect(toolDef, `Tool ${name} missing description`).toHaveProperty("description")
        expect(toolDef, `Tool ${name} missing args`).toHaveProperty("args")
        expect(toolDef, `Tool ${name} missing execute`).toHaveProperty("execute")
        expect(typeof (toolDef as any).execute).toBe("function")
      }
    })
  })

  describe("config initialization", () => {
    it("should connect MCP and load state on config", async () => {
      mockStateInstance.loadState.mockResolvedValue(0)
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      expect(mockMCPInstance.connect).toHaveBeenCalledWith("npx", ["-y", "@vheins/local-memory-mcp"])
      expect(mockStateInstance.loadState).toHaveBeenCalled()
    })

    it("should recover sessions when loadState returns count > 0", async () => {
      mockStateInstance.loadState.mockResolvedValue(2)
      mockStateInstance.listSessions.mockResolvedValue([
        {
          id: "session-1",
          status: "active",
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "session-2",
          status: "active",
          lastActivity: new Date().toISOString(),
        },
      ])

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      expect(mockStateInstance.loadState).toHaveBeenCalled()
      // Neither session is stale (>24h), so no pause calls
      expect(mockStateInstance.updateSession).not.toHaveBeenCalled()
    })

    it("should pause stale sessions (>24h inactive) on recovery", async () => {
      const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      mockStateInstance.loadState.mockResolvedValue(1)
      mockStateInstance.listSessions.mockResolvedValue([
        {
          id: "stale-session",
          status: "active",
          lastActivity: staleDate,
        },
      ])

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      expect(mockStateInstance.updateSession).toHaveBeenCalledWith("stale-session", { status: "paused" })
    })

    it("should parse plugin options from config", async () => {
      mockStateInstance.loadState.mockResolvedValue(0)
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({
        plugin: [
          ["@vheins/opencode-autopilot", { maxRetries: 5, autoCommit: { enabled: true, confidenceThreshold: 80 }, baseDelay: 2000 }],
        ],
      } as any)

      expect(mockMCPInstance.connect).toHaveBeenCalled()
      expect(mockStateInstance.loadState).toHaveBeenCalled()
    })
  })

  describe("autopilot_start", () => {
    it("should return existing resumable session if description matches", async () => {
      mockStateInstance.listResumableSessions.mockResolvedValue([
        {
          id: "existing-id",
          status: "paused",
          currentPhase: "planning",
          featureDescription: "Add auth",
        },
      ])

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_start.execute(
        { description: "Add auth" },
        { directory: "/tmp" } as any,
      )

      const output = JSON.parse(result.output)
      expect(output.sessionId).toBe("existing-id")
      expect(output.status).toBe("paused")
    })

    it("should create a new session on start", async () => {
      mockStateInstance.listResumableSessions.mockResolvedValue([])
      mockStateInstance.createSession.mockResolvedValue({
        session: {
          id: "new-session-id",
          featureDescription: "New feature",
          projectPath: "/tmp",
          status: "active",
          currentPhase: "planning",
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          iterationCount: 0,
        },
        mcpTaskCode: "AUTOPILOT-SESSION-123",
      })
      mockStateInstance.getSession.mockResolvedValue({
        id: "new-session-id",
        featureDescription: "New feature",
        projectPath: "/tmp",
        status: "active",
        currentPhase: "planning",
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        iterationCount: 0,
      })

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_start.execute(
        { description: "New feature" },
        { directory: "/tmp" } as any,
      )

      expect(mockStateInstance.createSession).toHaveBeenCalledWith("New feature", "/tmp")
      const output = JSON.parse(result.output)
      expect(output.sessionId).toBeTruthy()
    })
  })

  describe("autopilot_resume", () => {
    it("should resume a session", async () => {
      mockStateInstance.resumeSession.mockResolvedValue({
        session: {
          id: "session-id",
          status: "active",
          currentPhase: "planning",
          iterationCount: 2,
          featureDescription: "Resumed feature",
        },
        recovered: true,
        warnings: [],
      })

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_resume.execute({ sessionId: "session-id" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output.sessionId).toBe("session-id")
      expect(output.status).toBe("active")
      expect(output.currentPhase).toBe("planning")
      expect(output.recovered).toBe(true)
    })

    it("should include warnings in response", async () => {
      mockStateInstance.resumeSession.mockResolvedValue({
        session: {
          id: "session-id",
          status: "active",
          currentPhase: "planning",
          iterationCount: 1,
          featureDescription: "feature",
        },
        recovered: false,
        warnings: ["Session was idle for 45 minutes"],
      })

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_resume.execute({ sessionId: "session-id" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output.warnings).toHaveLength(1)
      expect(output.message).toContain("warning")
    })
  })

  describe("autopilot_status", () => {
    it("should return session status when sessionId provided", async () => {
      mockStateInstance.getSession.mockResolvedValue({
        id: "session-id",
        status: "active",
        currentPhase: "planning",
        iterationCount: 1,
        featureDescription: "Test feature",
      })

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_status.execute({ sessionId: "session-id" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output.session).toBeDefined()
      expect(output.session.id).toBe("session-id")
      expect(output.engine).toBeDefined()
      expect(output.display).toBeDefined()
    })

    it("should return error when session not found", async () => {
      mockStateInstance.getSession.mockResolvedValue(undefined)

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_status.execute({ sessionId: "nonexistent" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output.error).toBe("Session not found")
    })

    it("should list all sessions when no sessionId", async () => {
      mockStateInstance.listSessions.mockResolvedValue([
        { id: "s1-xxxxx", featureDescription: "Feature 1", status: "active", currentPhase: "planning" },
        { id: "s2-yyyyy", featureDescription: "Feature 2", status: "paused", currentPhase: "idle" },
      ])

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_status.execute({}, {} as any)
      const output = JSON.parse(result.output)
      expect(output.total).toBe(2)
      expect(output.active).toBe(1)
      expect(output.sessions).toHaveLength(2)
    })
  })

  describe("autopilot_approve", () => {
    it("should approve plan and transition to generating", async () => {
      mockStateInstance.listResumableSessions.mockResolvedValue([])
      mockStateInstance.createSession.mockResolvedValue({
        session: {
          id: "approve-session-id",
          featureDescription: "Test feature",
          projectPath: "/tmp",
          status: "active",
          currentPhase: "planning",
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          iterationCount: 0,
        },
        mcpTaskCode: "AUTOPILOT-SESSION-1",
      })
      mockStateInstance.getSession.mockResolvedValue({
        id: "approve-session-id",
        featureDescription: "Test feature",
        projectPath: "/tmp",
        status: "active",
        currentPhase: "planning",
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        iterationCount: 0,
      })

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      // Start an iteration first so the engine has an active session and is in AwaitingApproval
      await plugin.tool.autopilot_start.execute(
        { description: "Test feature" },
        { directory: "/tmp" } as any,
      )

      // Now approve should transition from AwaitingApproval to Generating
      const result = await plugin.tool.autopilot_approve.execute({}, {} as any)
      const output = JSON.parse(result.output)
      expect(output).toBeDefined()
      expect(output.phase).toBeDefined()
    })
  })

  describe("autopilot_reject", () => {
    it("should reject plan with feedback", async () => {
      mockStateInstance.listResumableSessions.mockResolvedValue([])
      mockStateInstance.createSession.mockResolvedValue({
        session: {
          id: "reject-session-id",
          featureDescription: "Test feature",
          projectPath: "/tmp",
          status: "active",
          currentPhase: "planning",
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          iterationCount: 0,
        },
        mcpTaskCode: "AUTOPILOT-SESSION-2",
      })
      mockStateInstance.getSession.mockResolvedValue({
        id: "reject-session-id",
        featureDescription: "Test feature",
        projectPath: "/tmp",
        status: "active",
        currentPhase: "planning",
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        iterationCount: 0,
      })

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      // Start an iteration to get engine in AwaitingApproval
      await plugin.tool.autopilot_start.execute(
        { description: "Test feature" },
        { directory: "/tmp" } as any,
      )

      // Now reject should transition from AwaitingApproval back to Planning
      const result = await plugin.tool.autopilot_reject.execute({ feedback: "needs work" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output).toBeDefined()
      expect(output.phase).toBeDefined()
    })
  })

  describe("autopilot_review", () => {
    it("should return no pending diff message when no diff", async () => {
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_review.execute({}, {} as any)
      const output = JSON.parse(result.output)
      expect(output.message).toContain("No pending diff")
    })
  })

  describe("autopilot_commit", () => {
    it("should return not found for unknown session", async () => {
      mockStateInstance.getSession.mockResolvedValue(undefined)

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_commit.execute({ sessionId: "unknown" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output.error).toBe("Session not found")
    })

    it("should return already completed for completed session", async () => {
      mockStateInstance.getSession.mockResolvedValue({
        id: "session-id",
        status: "completed",
        projectPath: "/tmp",
        featureDescription: "feature",
      })

      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_commit.execute({ sessionId: "session-id" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output.alreadyCompleted).toBe(true)
    })
  })

  describe("autopilot_stop", () => {
    it("should pause the session", async () => {
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_stop.execute({ sessionId: "session-id" }, {} as any)
      const output = JSON.parse(result.output)
      expect(output.status).toBe("paused")
      expect(output.sessionId).toBe("session-id")
    })

    it("should include optional reason", async () => {
      const plugin = await autopilot({ project: "test", directory: "/tmp", worktree: "/tmp" })
      await plugin.config({})

      const result = await plugin.tool.autopilot_stop.execute(
        { sessionId: "session-id", reason: "User cancelled" },
        {} as any,
      )
      const output = JSON.parse(result.output)
      expect(output.message).toContain("User cancelled")
    })
  })

  describe("exports", () => {
    it("should export ProviderFactory and MockProvider", async () => {
      const mod = await import("./index.js")
      expect(mod.ProviderFactory).toBeDefined()
      expect(mod.MockProvider).toBeDefined()
      expect(mod.OpencodeProvider).toBeDefined()
      expect(mod.PHASE_PROMPTS).toBeDefined()
    })

    it("should export utility types and functions", async () => {
      const mod = await import("./index.js")
      expect(mod.parsePlan).toBeDefined()
      expect(mod.formatPlanForDisplay).toBeDefined()
      expect(mod.parseCodeGenOutput).toBeDefined()
      expect(mod.writeFiles).toBeDefined()
      expect(mod.generateDiff).toBeDefined()
      expect(mod.formatDiff).toBeDefined()
    })
  })
})
