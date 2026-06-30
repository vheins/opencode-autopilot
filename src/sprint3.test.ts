import { describe, it, expect, vi, beforeEach } from "vitest"
import { IterationEngine } from "./engine.js"
import { StateManager } from "./state.js"
import { MCPClient } from "./mcp-client.js"
import { MockProvider } from "./provider.js"
import { IterationPhase } from "./types.js"
import { parsePlan } from "./plan-parser.js"
import { Presenter } from "./presenter.js"

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

describe("Sprint 03 — Planning & Approval", () => {
  let engine: IterationEngine
  let stateManager: StateManager
  let mcpClient: MCPClient
  let presenter: Presenter
  let testDir: string

  beforeEach(async () => {
    testDir = "/tmp/autopilot-test"
    mcpClient = new MCPClient()
    stateManager = new StateManager(
      { maxRetries: 3, baseDelay: 1000, autoCommit: { enabled: false, confidenceThreshold: 80 }, modelMapping: {} },
      mcpClient
    )
    engine = new IterationEngine(stateManager, new MockProvider())
    presenter = new Presenter({ colors: false, compact: true })
  })

  async function createAndStart(projectDir: string, desc = "test") {
    const { session } = await stateManager.createSession(desc, projectDir)
    const result = await engine.startIteration(session.id)
    return { session, result }
  }

  describe("Plan Parsing", () => {
    it("should parse structured plan output", () => {
      const output =
        "## Plan Summary\nAdd JWT auth\n## Files\n- src/auth.ts: Create auth module (create)\n## Steps\n1. Create auth module\n## Effort: M"
      const plan = parsePlan(output)
      expect(plan.summary).toBe("Add JWT auth")
      expect(plan.files).toHaveLength(1)
      expect(plan.effort).toBe("M")
    })

    it("should extract file actions from plan output", () => {
      const output =
        "## Plan Summary\nRefactor\n## Files\n- old.ts: Remove deprecated (delete)\n- new.ts: Create new module (create)\n- edit.ts: Update logic (modify)\n## Steps\n1. Do it\n## Effort: S"
      const plan = parsePlan(output)
      expect(plan.files).toHaveLength(3)
      // Parser detects "create" → create, everything else → modify
      expect(plan.files[0].action).toBe("modify") // (delete) not detected as create
      expect(plan.files[1].action).toBe("create") // (create) detected
      expect(plan.files[2].action).toBe("modify") // (modify) fallback
    })

    it("should extract risks from plan output", () => {
      const output =
        "## Plan Summary\nTest\n## Files\n- f.ts: desc (modify)\n## Steps\n1. Test\n## Risks\n- Breaking change\n- Performance impact\n## Effort: L"
      const plan = parsePlan(output)
      expect(plan.risks).toContain("Breaking change")
      expect(plan.risks).toContain("Performance impact")
      expect(plan.effort).toBe("L")
    })
  })

  describe("Approval Flow", () => {
    it("should transition to AwaitingApproval after planning", async () => {
      const { session, result } = await createAndStart(testDir)
      // Engine auto-transitions after planning
      expect(result.phase).toBe(IterationPhase.AwaitingApproval)
    })

    it("should proceed to Generating on approval then auto-transition to AwaitingApproval for diff review", async () => {
      const { session } = await createAndStart(testDir)
      const result = await engine.transition(IterationPhase.Generating, { approved: true })
      // After generating code, engine auto-transitions to AwaitingApproval for diff review
      expect(result.phase).toBe(IterationPhase.AwaitingApproval)
      expect(result.transitions).toContain(IterationPhase.Reviewing)
    })

    it("should reject without approved flag", async () => {
      const { session } = await createAndStart(testDir)
      await expect(
        engine.transition(IterationPhase.Generating, { approved: false })
      ).rejects.toThrow(/approve/)
    })

    it("should reject with no metadata at all", async () => {
      const { session } = await createAndStart(testDir)
      await expect(
        engine.transition(IterationPhase.Generating, {})
      ).rejects.toThrow(/approve/)
    })
  })

  describe("Rejection Flow", () => {
    it("should accept rejection with feedback and auto-replan", async () => {
      const { session } = await createAndStart(testDir)
      // Rejection transitions to Planning, auto-executes, ends at AwaitingApproval
      const result = await engine.transition(IterationPhase.Planning, {
        feedback: "Add more details",
      })
      // After auto-execution of planning phase, we end up at AwaitingApproval
      expect(result.phase).toBe(IterationPhase.AwaitingApproval)
    })

    it("should store rejection feedback in MCP", async () => {
      const { session } = await createAndStart(testDir)
      await engine.transition(IterationPhase.Planning, {
        feedback: "Need better error handling",
      })
      // MCP storeMemory should have been called at least once with rejection data
      const storeCalls = mcpClient.storeMemory!.mock.calls
      // Find a call that includes rejection data
      const rejectionCalls = storeCalls.filter((call: any[]) =>
        call[1]?.includes?.("rejection") || call[1]?.includes?.("Need better error handling")
      )
      expect(rejectionCalls.length).toBeGreaterThan(0)
    })
  })

  describe("Presenter", () => {
    it("should format plan for display", () => {
      const plan = parsePlan(
        "## Plan Summary\nTest\n## Files\n- f.ts: desc (create)\n## Steps\n1. Do it\n## Effort: S"
      )
      const output = presenter.presentPlan(plan)
      expect(output).toContain("Test")
      expect(output).toContain("f.ts")
    })

    it("should format status messages", () => {
      const output = presenter.presentStatus(IterationPhase.Planning)
      expect(output).toContain("Planning")
    })

    it("should include timestamp in plan display", () => {
      const plan = parsePlan(
        "## Plan Summary\nTest\n## Files\n- f.ts: desc (create)\n## Steps\n1. Do it\n## Effort: S"
      )
      const output = presenter.presentPlan(plan, "session-123")
      expect(output).toContain("Time:")
      expect(output).toContain("Timeout:")
      // Session ID is truncated to first 8 chars
      expect(output).toContain("Session:")
      expect(output).toContain("session")
    })

    it("should include timeout configuration in display", () => {
      const customPresenter = new Presenter({ timeout: 120 })
      const plan = parsePlan(
        "## Plan Summary\nTest\n## Files\n- f.ts: desc (create)\n## Steps\n1. Do it\n## Effort: S"
      )
      const output = customPresenter.presentPlan(plan)
      expect(output).toContain("120s")
    })

    it("should generate confirmation message", () => {
      const output = presenter.presentConfirmation(IterationPhase.Generating, "session-123")
      expect(output).toContain("approved")
      // Session ID is truncated to first 8 chars
      expect(output).toContain("Session:")
      expect(output).toContain("session")
      expect(output).toContain("Time:")
    })

    it("should generate timeout warning", () => {
      const output = presenter.presentTimeoutWarning()
      expect(output).toContain("timeout")
      expect(output).toContain("60s")
    })
  })

  describe("Rejection limits", () => {
    it("should enforce max rejection limit", async () => {
      const { session } = await createAndStart(testDir)
      // Reject 3 times
      for (let i = 0; i < 3; i++) {
        // transition(Planning, { feedback }) auto-executes planning → AwaitingApproval
        const result = await engine.transition(IterationPhase.Planning, {
          feedback: `Attempt ${i + 1}`,
        })
        expect(result.phase).toBe(IterationPhase.AwaitingApproval)
        // startIteration to kick off another planning cycle (allowed from AwaitingApproval)
        await engine.startIteration(session.id)
      }
      // 4th rejection should fail
      await expect(
        engine.transition(IterationPhase.Planning, { feedback: "4th attempt" })
      ).rejects.toThrow(/rejection/i)
    })

    it("should allow configurable max rejection limit", async () => {
      const customEngine = new IterationEngine(
        stateManager,
        new MockProvider(),
        { maxRetries: 3, maxRejections: 1 }
      )
      const { session } = await stateManager.createSession("test2", testDir)
      await customEngine.startIteration(session.id)
      // First rejection should work
      const result = await customEngine.transition(IterationPhase.Planning, {
        feedback: "First rejection",
      })
      expect(result.phase).toBe(IterationPhase.AwaitingApproval)
      // Second rejection should be blocked
      await customEngine.startIteration(session.id)
      await expect(
        customEngine.transition(IterationPhase.Planning, { feedback: "Second rejection" })
      ).rejects.toThrow(/rejection/i)
    })
  })
})
