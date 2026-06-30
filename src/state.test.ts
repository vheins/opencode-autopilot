import { describe, it, expect, vi, beforeEach } from "vitest"
import { StateManager } from "./state.js"
import { IterationPhase } from "./types.js"
import fs from "fs"
import path from "path"
import os from "os"

describe("StateManager", () => {
  let stateManager: StateManager
  let testDir: string

  const testConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    autoCommit: { enabled: false, confidenceThreshold: 80 },
  }

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `autopilot-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.promises.mkdir(testDir, { recursive: true })
    stateManager = new StateManager(testConfig, testDir)
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
    })

    it("should throw on empty description", async () => {
      await expect(stateManager.createSession("", "/test")).rejects.toThrow()
    })

    it("should throw on empty project path", async () => {
      await expect(stateManager.createSession("test", "")).rejects.toThrow()
    })

    it("should persist session to file", async () => {
      await stateManager.createSession("Test feature", "/test")
      const filePath = path.join(testDir, ".autopilot", "sessions.json")
      const content = await fs.promises.readFile(filePath, "utf-8")
      const sessions = JSON.parse(content)
      expect(sessions).toHaveLength(1)
      expect(sessions[0].featureDescription).toBe("Test feature")
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

  describe("loadState", () => {
    it("should recover sessions from file", async () => {
      await stateManager.createSession("Feature 1", "/test")
      await stateManager.createSession("Feature 2", "/test")

      // Create a new StateManager to test recovery
      const sm2 = new StateManager(testConfig, testDir)
      const count = await sm2.loadState()
      expect(count).toBe(2)

      const sessions = await sm2.listSessions()
      expect(sessions).toHaveLength(2)
    })
  })

  describe("integrityCheck", () => {
    it("should pass for empty file", async () => {
      const result = await stateManager.integrityCheck()
      expect(result.ok).toBe(true)
    })

    it("should pass for valid sessions file", async () => {
      await stateManager.createSession("test", "/test")
      const result = await stateManager.integrityCheck()
      expect(result.ok).toBe(true)
    })
  })

  describe("storeIterationContext", () => {
    it("should store context to file", async () => {
      const { session } = await stateManager.createSession("test", "/test")
      await stateManager.storeIterationContext(session.id, { key: "value" })

      const ctxPath = path.join(testDir, ".autopilot", `context-${session.id}.json`)
      const content = await fs.promises.readFile(ctxPath, "utf-8")
      const data = JSON.parse(content)
      expect(data.key).toBe("value")
      expect(data.sessionId).toBe(session.id)
    })
  })
})
