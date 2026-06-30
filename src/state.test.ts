import { describe, it, expect, vi, beforeEach } from "vitest"
import { StateManager } from "./state.js"
import { MCPClient } from "./mcp-client.js"
import { IterationPhase } from "./types.js"

// Mock MCPClient
vi.mock("./mcp-client.js", () => ({
  MCPClient: vi.fn(() => ({
    createSessionTask: vi.fn(),
    updateSessionTask: vi.fn(),
    listSessionTasks: vi.fn(),
    storeMemory: vi.fn(),
    searchMemory: vi.fn(),
    getMemoryDetail: vi.fn(),
    getTask: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

describe("StateManager", () => {
  let stateManager: StateManager
  let mockMCP: MCPClient

  const testConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    autoCommit: false,
    confidenceThreshold: 70,
    modelMapping: {},
  }

  beforeEach(() => {
    mockMCP = new MCPClient()
    stateManager = new StateManager(testConfig, mockMCP)
  })

  describe("createSession", () => {
    it("should create a session with valid inputs", async () => {
      const result = await stateManager.createSession("Add JWT auth", "/test/project")
      expect(result.session).toBeDefined()
      expect(result.session.featureDescription).toBe("Add JWT auth")
      expect(result.session.projectPath).toBe("/test/project")
      expect(result.session.status).toBe("active")
      expect(result.session.currentPhase).toBe(IterationPhase.Idle)
      expect(result.session.id).toBeTruthy()
      expect(result.mcpTaskCode).toMatch(/^AUTOPILOT-SESSION-\d+$/)
    })

    it("should throw on empty description", async () => {
      await expect(stateManager.createSession("", "/test")).rejects.toThrow()
    })

    it("should throw on empty project path", async () => {
      await expect(stateManager.createSession("test", "")).rejects.toThrow()
    })

    it("should store session in MCP", async () => {
      await stateManager.createSession("Test feature", "/test")
      expect(mockMCP.storeMemory).toHaveBeenCalled()
      expect(mockMCP.createSessionTask).toHaveBeenCalled()
    })
  })

  describe("getSession", () => {
    it("should return session by ID", async () => {
      const { session } = await stateManager.createSession("test", "/test")
      const found = await stateManager.getSession(session.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(session.id)
    })

    it("should return undefined for unknown ID", async () => {
      const found = await stateManager.getSession("nonexistent")
      expect(found).toBeUndefined()
    })
  })

  describe("listSessions", () => {
    it("should return all sessions", async () => {
      await stateManager.createSession("Feature 1", "/test")
      await stateManager.createSession("Feature 2", "/test")
      const sessions = await stateManager.listSessions()
      expect(sessions).toHaveLength(2)
    })
  })

  describe("updateSession", () => {
    it("should update session fields", async () => {
      const { session } = await stateManager.createSession("test", "/test")
      const updated = await stateManager.updateSession(session.id, {
        status: "paused",
        currentPhase: IterationPhase.Planning,
      })
      expect(updated?.status).toBe("paused")
      expect(updated?.currentPhase).toBe(IterationPhase.Planning)
      expect(updated?.lastActivity).toBeTruthy()
      expect(() => new Date(updated!.lastActivity)).not.toThrow()
    })
  })

  describe("deleteSession", () => {
    it("should remove session from cache", async () => {
      const { session } = await stateManager.createSession("test", "/test")
      await stateManager.deleteSession(session.id)
      const found = await stateManager.getSession(session.id)
      expect(found).toBeUndefined()
    })
  })

  describe("resumeSession", () => {
    it("should resume a paused session", async () => {
      const { session } = await stateManager.createSession("test", "/test")
      await stateManager.updateSession(session.id, { status: "paused" })
      const result = await stateManager.resumeSession(session.id)
      // recovered is false because session is in local cache (not loaded from MCP)
      expect(result.recovered).toBe(false)
      expect(result.session.status).toBe("active")
    })

    it("should reject completed sessions", async () => {
      const { session } = await stateManager.createSession("test", "/test")
      await stateManager.updateSession(session.id, { status: "completed" })
      await expect(stateManager.resumeSession(session.id)).rejects.toThrow(/completed/i)
    })

    it("should reject failed sessions", async () => {
      const { session } = await stateManager.createSession("test", "/test")
      await stateManager.updateSession(session.id, { status: "failed" })
      await expect(stateManager.resumeSession(session.id)).rejects.toThrow(/failed/i)
    })
  })

  describe("listResumableSessions", () => {
    it("should only return active or paused sessions", async () => {
      await stateManager.createSession("active session", "/test")
      const { session: paused } = await stateManager.createSession("paused session", "/test")
      await stateManager.updateSession(paused.id, { status: "paused" })
      const { session: completed } = await stateManager.createSession("completed session", "/test")
      await stateManager.updateSession(completed.id, { status: "completed" })

      const resumable = await stateManager.listResumableSessions()
      expect(resumable).toHaveLength(2)
      expect(resumable.every((s: any) => ["active", "paused"].includes(s.status))).toBe(true)
    })
  })
})
