import { describe, it, expect, vi, beforeEach } from "vitest"
import { IterationEngine } from "./engine.js"
import { StateManager } from "./state.js"
import { IterationPhase, type Session } from "./types.js"
import fs from "fs"
import path from "path"
import os from "os"

// Mock Git at module level to control add/commit behavior
vi.mock("./git.js", () => ({
  Git: vi.fn(),
}))

// Import after mock
import { Git } from "./git.js"

describe("Autopilot Commit", () => {
  let engine: IterationEngine
  let stateManager: StateManager
  let testDir: string
  let mockGitInstance: { add: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> }
  let readdirSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `autopilot-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.promises.mkdir(testDir, { recursive: true })
    vi.restoreAllMocks()
    readdirSpy = vi.spyOn(fs.promises, "readdir").mockResolvedValue(["src", "tests", "lib"] as any)

    mockGitInstance = {
      add: vi.fn(),
      commit: vi.fn(),
    }
    vi.mocked(Git).mockImplementation(() => mockGitInstance as any)

    stateManager = new StateManager(
      { maxRetries: 3, baseDelay: 1000, autoCommit: { enabled: false, confidenceThreshold: 80 } },
      testDir,
    )
    engine = new IterationEngine(stateManager)
  })

  describe("engine Committing handler — success path", () => {
    it("should complete commit phase when git add and commit succeed", async () => {
      const { session } = await stateManager.createSession("test feature", "/test/repo")
      await engine.resume(session.id, IterationPhase.Committing)

      mockGitInstance.add.mockResolvedValue({ success: true, output: "" })
      mockGitInstance.commit.mockResolvedValue({
        success: true,
        output: "[main abc1234def5678] feat: test feature\n 1 file changed, 5 insertions(+)",
      })

      const result = await (engine as any).executeCurrentPhase()

      expect(result.phase).toBe(IterationPhase.Done)
      expect(mockGitInstance.add).toHaveBeenCalledWith(["."])
      expect(mockGitInstance.commit).toHaveBeenCalledWith(
        expect.stringContaining("feat(autopilot): test feature"),
      )
    })
  })

  describe("engine Committing handler — git add failure", () => {
    it("should transition to Error and persist currentPhase in session when git add fails", async () => {
      const { session } = await stateManager.createSession("test feature", "/test/repo")
      await engine.resume(session.id, IterationPhase.Committing)

      mockGitInstance.add.mockResolvedValue({
        success: false,
        output: "",
        error: "fatal: not a git repository",
      })

      const result = await (engine as any).executeCurrentPhase()

      expect(result.phase).toBe(IterationPhase.Error)
      expect(result.output).toContain("Git add failed")

      // Verify session was persisted with Error phase
      const updatedSession = await stateManager.getSession(session.id)
      expect(updatedSession?.currentPhase).toBe(IterationPhase.Error)
    })
  })

  describe("engine Committing handler — git commit failure", () => {
    it("should transition to Error and persist currentPhase when git commit fails", async () => {
      const { session } = await stateManager.createSession("test feature", "/test/repo")
      await engine.resume(session.id, IterationPhase.Committing)

      mockGitInstance.add.mockResolvedValue({ success: true, output: "" })
      mockGitInstance.commit.mockResolvedValue({
        success: false,
        output: "",
        error: "nothing to commit",
      })

      const result = await (engine as any).executeCurrentPhase()

      expect(result.phase).toBe(IterationPhase.Error)
      expect(result.output).toContain("Git commit failed")

      // Verify session was persisted with Error phase
      const updatedSession = await stateManager.getSession(session.id)
      expect(updatedSession?.currentPhase).toBe(IterationPhase.Error)
    })
  })

  describe("engine Committing handler — iteration count preservation", () => {
    it("should not increment iteration count on commit (FIX-COMMIT-004)", async () => {
      const { session } = await stateManager.createSession("test feature", "/test/repo")
      expect(session.iterationCount).toBe(0)

      await engine.resume(session.id, IterationPhase.Committing)
      mockGitInstance.add.mockResolvedValue({ success: true, output: "" })
      mockGitInstance.commit.mockResolvedValue({
        success: true,
        output: "[main deadbeef] feat: test\n 1 file changed",
      })

      await (engine as any).executeCurrentPhase()

      const updatedSession = await stateManager.getSession(session.id)
      expect(updatedSession?.iterationCount).toBe(0)
    })
  })

  describe("engine Committing handler — context storage", () => {
    it("should store commit context after successful commit (FIX-COMMIT-005)", async () => {
      const { session } = await stateManager.createSession("test feature", "/test/repo")
      await engine.resume(session.id, IterationPhase.Committing)

      mockGitInstance.add.mockResolvedValue({ success: true, output: "" })
      mockGitInstance.commit.mockResolvedValue({
        success: true,
        output: "[main abc1234] feat: test feature\n 1 file changed",
      })

      const storeSpy = vi.spyOn(stateManager, "storeIterationContext")

      await (engine as any).executeCurrentPhase()

      expect(storeSpy).toHaveBeenCalledWith(session.id, {
        type: "commit",
        commitOutput: "[main abc1234] feat: test feature\n 1 file changed",
        success: true,
      })
      storeSpy.mockRestore()
    })
  })

  describe("engine Committing handler — safety check (FIX-3)", () => {
    it("should reject commit when safety check detects protected file", async () => {
      readdirSpy.mockResolvedValue([".env"])

      const { session } = await stateManager.createSession("test feature", "/test/repo")
      await engine.resume(session.id, IterationPhase.Committing)

      const result = await (engine as any).executeCurrentPhase()

      expect(result.phase).toBe(IterationPhase.Error)
      expect(result.output).toContain("Safety check failed")

      const updatedSession = await stateManager.getSession(session.id)
      expect(updatedSession?.currentPhase).toBe(IterationPhase.Error)
    })

    it("should allow commit when safety check passes", async () => {
      readdirSpy.mockResolvedValue(["src", "tests"])

      const { session } = await stateManager.createSession("test feature", "/test/repo")
      await engine.resume(session.id, IterationPhase.Committing)

      mockGitInstance.add.mockResolvedValue({ success: true, output: "" })
      mockGitInstance.commit.mockResolvedValue({
        success: true,
        output: "[main abc1234] feat: test feature\n 1 file changed",
      })

      const result = await (engine as any).executeCurrentPhase()

      expect(result.phase).toBe(IterationPhase.Done)
      expect(mockGitInstance.add).toHaveBeenCalledWith(["."])
    })
  })

  describe("commit hash parsing", () => {
    it("should parse commit hash from standard git output using regex", () => {
      const gitOutput = "[main abc1234def5678] feat: add feature\n 1 file changed, 10 insertions(+)"
      const hashMatch = gitOutput.match(/\[[^\]]+ ([a-f0-9]+)\]/)
      expect(hashMatch).not.toBeNull()
      expect(hashMatch![1]).toBe("abc1234def5678")
    })

    it("should parse commit hash with longer hex string", () => {
      const gitOutput = "[main abc1234def5678901234567890abcdef1234567] feat: big commit"
      const hashMatch = gitOutput.match(/\[[^\]]+ ([a-f0-9]+)\]/)
      expect(hashMatch).not.toBeNull()
      expect(hashMatch![1]).toBe("abc1234def5678901234567890abcdef1234567")
    })

    it("should fall back to trimmed output when no hash pattern matches", () => {
      const gitOutput = "nothing to commit"
      const hashMatch = gitOutput.match(/\[[^\]]+ ([a-f0-9]+)\]/)
      const commitHash = hashMatch ? hashMatch[1] : gitOutput.trim()
      expect(commitHash).toBe("nothing to commit")
    })

    it("should fall back to 40-char hex match when bracket format is absent (FIX-4.2)", () => {
      const gitOutput = "a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0\n 1 file changed"
      const hashMatch = gitOutput.match(/\[[^\]]+ ([a-f0-9]+)\]/)
      let commitHash: string
      if (hashMatch) {
        commitHash = hashMatch[1]
      } else {
        const firstLine = gitOutput.split('\n')[0]
        const hexMatch = firstLine.match(/\b([a-f0-9]{40})\b/)
        commitHash = hexMatch ? hexMatch[1] : gitOutput.trim()
      }
      expect(commitHash).toBe("a1b2c3d4e5f6a7b8c9d0a1b2c3d4e5f6a7b8c9d0")
    })

    it("should fall back to trimmed output when no hash of any format is found (FIX-4.2)", () => {
      const gitOutput = "nothing to commit"
      const hashMatch = gitOutput.match(/\[[^\]]+ ([a-f0-9]+)\]/)
      let commitHash: string
      if (hashMatch) {
        commitHash = hashMatch[1]
      } else {
        const firstLine = gitOutput.split('\n')[0]
        const hexMatch = firstLine.match(/\b([a-f0-9]{40})\b/)
        commitHash = hexMatch ? hexMatch[1] : gitOutput.trim()
      }
      expect(commitHash).toBe("nothing to commit")
    })
  })

  describe("session already completed check", () => {
    it("should detect completed session status", async () => {
      const { session } = await stateManager.createSession("test feature", "/test/repo")
      await stateManager.updateSession(session.id, { status: "completed" })
      const updated = await stateManager.getSession(session.id)
      expect(updated?.status).toBe("completed")
    })
  })
})
