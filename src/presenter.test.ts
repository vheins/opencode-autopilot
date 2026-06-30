import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Presenter } from "./presenter.js"
import { IterationPhase } from "./types.js"

describe("Presenter", () => {
  let presenter: Presenter

  beforeEach(() => {
    presenter = new Presenter()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-30T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("presentPlan", () => {
    const basePlan = {
      summary: "Implement JWT authentication",
      files: [
        { path: "src/auth.ts", action: "modify" as const },
        { path: "src/middleware.ts", action: "create" as const },
        { path: "src/old.ts", action: "delete" as const },
      ],
      steps: [
        { order: 1, description: "Add JWT verification" },
        { order: 2, description: "Add middleware" },
      ],
      risks: ["Token expiry edge cases"],
      effort: "M" as const,
      raw: "",
    }

    it("should present a full plan", () => {
      const output = presenter.presentPlan(basePlan)
      expect(output).toContain("AUTOPILOT")
      expect(output).toContain("Implementation Plan")
      expect(output).toContain("Implement JWT authentication")
      expect(output).toContain("Effort: M")
      expect(output).toContain("src/auth.ts")
      expect(output).toContain("src/middleware.ts")
      expect(output).toContain("src/old.ts")
      expect(output).toContain("Token expiry edge cases")
      expect(output).toContain("Approve? (Y/n):")
    })

    it("should include session ID when provided (first 8 chars)", () => {
      const output = presenter.presentPlan(basePlan, "session-12345")
      // The presenter slices to first 8 characters
      expect(output).toContain("session-")
    })

    it("should show file action icons", () => {
      const output = presenter.presentPlan(basePlan)
      expect(output).toContain("✎") // modify
      expect(output).toContain("＋") // create
      expect(output).toContain("−") // delete
    })

    it("should handle plan with no steps", () => {
      const plan = { ...basePlan, steps: [] }
      const output = presenter.presentPlan(plan)
      expect(output).not.toContain("Steps")
    })

    it("should handle plan with no risks", () => {
      const plan = { ...basePlan, risks: [] }
      const output = presenter.presentPlan(plan)
      expect(output).not.toContain("Risks")
    })

    it("should handle plan with no files", () => {
      const plan = { ...basePlan, files: [] }
      const output = presenter.presentPlan(plan)
      expect(output).toContain("Files")
    })

    it("should include timestamp and timeout", () => {
      const output = presenter.presentPlan(basePlan)
      expect(output).toContain("2026-06-30")
      expect(output).toContain("60s")
    })

    it("should show custom timeout from options", () => {
      const customPresenter = new Presenter({ timeout: 120 })
      const output = customPresenter.presentPlan(basePlan)
      expect(output).toContain("120s")
    })
  })

  describe("presentDiff", () => {
    const baseDiff = {
      files: [
        { filePath: "src/auth.ts", type: "modified" as const, hunks: [], insertions: 10, deletions: 2 },
        { filePath: "src/new.ts", type: "added" as const, hunks: [], insertions: 50, deletions: 0 },
        { filePath: "src/old.ts", type: "deleted" as const, hunks: [], insertions: 0, deletions: 20 },
      ],
      totalInsertions: 60,
      totalDeletions: 22,
      raw: "",
    }

    it("should present diff summary", () => {
      const output = presenter.presentDiff(baseDiff)
      expect(output).toContain("Code Changes")
      expect(output).toContain("3 file(s) changed")
      expect(output).toContain("+60 / -22 lines")
      expect(output).toContain("src/auth.ts")
      expect(output).toContain("src/new.ts")
      expect(output).toContain("src/old.ts")
    })

    it("should show file action icons for diff", () => {
      const output = presenter.presentDiff(baseDiff)
      expect(output).toContain("✎") // modified
      expect(output).toContain("＋") // added
      expect(output).toContain("−") // deleted
    })

    it("should show per-file line counts", () => {
      const output = presenter.presentDiff(baseDiff)
      expect(output).toContain("+10")
      expect(output).toContain("-2")
      expect(output).toContain("+50")
      expect(output).toContain("-20")
    })

    it("should handle empty diff", () => {
      const diff = {
        files: [],
        totalInsertions: 0,
        totalDeletions: 0,
        raw: "",
      }
      const output = presenter.presentDiff(diff)
      expect(output).toContain("0 file(s) changed")
    })

    it("should include review prompt", () => {
      const output = presenter.presentDiff(baseDiff)
      expect(output).toContain("approve")
    })
  })

  describe("presentGateResults", () => {
    it("should show all passed gates", () => {
      const results = [
        { gateName: "TypeCheck", passed: true, errors: [], warnings: [], duration: 150, rawOutput: "" },
        { gateName: "Lint", passed: true, errors: [], warnings: [], duration: 200, rawOutput: "" },
      ]
      const output = presenter.presentGateResults(results, true)
      expect(output).toContain("Quality Gates")
      expect(output).toContain("TypeCheck")
      expect(output).toContain("Lint")
      expect(output).toContain("2 passed, 0 failed")
      expect(output).toContain("All gates passed")
    })

    it("should show failed gates", () => {
      const results = [
        { gateName: "TypeCheck", passed: true, errors: [], warnings: [], duration: 100, rawOutput: "" },
        { gateName: "Lint", passed: false, errors: ["Missing semicolon"], warnings: [], duration: 50, rawOutput: "" },
      ]
      const output = presenter.presentGateResults(results, false)
      expect(output).toContain("1 passed, 1 failed")
      expect(output).toContain("Some gates failed")
      expect(output).toContain("Missing semicolon")
    })

    it("should truncate errors to 5", () => {
      const errors = Array.from({ length: 10 }, (_, i) => `Error ${i + 1}`)
      const results = [
        { gateName: "Lint", passed: false, errors, warnings: [], duration: 50, rawOutput: "" },
      ]
      const output = presenter.presentGateResults(results, false)
      expect(output).toContain("Error 1")
      expect(output).toContain("Error 5")
      expect(output).toContain("... and 5 more errors")
    })

    it("should handle no errors on passed gates", () => {
      const results = [
        { gateName: "Test", passed: true, errors: [], warnings: [], duration: 300, rawOutput: "" },
      ]
      const output = presenter.presentGateResults(results, true)
      expect(output).toContain("1 passed, 0 failed")
    })
  })

  describe("presentStatus", () => {
    it("should return label for known phases", () => {
      expect(presenter.presentStatus(IterationPhase.Planning)).toContain("Planning")
      expect(presenter.presentStatus(IterationPhase.AwaitingApproval)).toContain("Awaiting Approval")
      expect(presenter.presentStatus(IterationPhase.Generating)).toContain("Generating")
      expect(presenter.presentStatus(IterationPhase.Testing)).toContain("Tests")
      expect(presenter.presentStatus(IterationPhase.Done)).toContain("Done")
      expect(presenter.presentStatus(IterationPhase.Error)).toContain("Error")
    })

    it("should include message when provided", () => {
      const output = presenter.presentStatus(IterationPhase.Planning, "Gathering requirements")
      expect(output).toContain("Planning")
      expect(output).toContain("Gathering requirements")
    })

    it("should return raw phase string for unknown phases", () => {
      const output = presenter.presentStatus("unknown_phase" as IterationPhase)
      expect(output).toContain("unknown_phase")
    })
  })

  describe("presentSessions", () => {
    it("should show no sessions message when empty", () => {
      const output = presenter.presentSessions([])
      expect(output).toContain("No active sessions")
    })

    it("should list sessions with details", () => {
      const sessions = [
        { id: "abc12345-xxxx", featureDescription: "Add JWT auth", status: "active", currentPhase: "planning" },
        { id: "def67890-yyyy", featureDescription: "Setup testing framework", status: "paused", currentPhase: "idle" },
      ]
      const output = presenter.presentSessions(sessions)
      expect(output).toContain("abc12345")
      expect(output).toContain("def67890")
      expect(output).toContain("Add JWT auth")
      expect(output).toContain("active")
      expect(output).toContain("paused")
    })

    it("should truncate long descriptions", () => {
      const longDesc = "A".repeat(100)
      const sessions = [
        { id: "id-12345-xxxx", featureDescription: longDesc, status: "active", currentPhase: "planning" },
      ]
      const output = presenter.presentSessions(sessions)
      // Should not contain the full 100-char string
      expect(output).toContain("A".repeat(40))
      expect(output).not.toContain(longDesc)
    })
  })

  describe("presentConfirmation", () => {
    it("should show generating message for Generating phase", () => {
      const output = presenter.presentConfirmation(IterationPhase.Generating)
      expect(output).toContain("Plan approved")
      expect(output).toContain("code generation")
    })

    it("should show planning message for Planning phase", () => {
      const output = presenter.presentConfirmation(IterationPhase.Planning)
      expect(output).toContain("Regenerating plan")
    })

    it("should show generic message for other phases", () => {
      const output = presenter.presentConfirmation(IterationPhase.Testing)
      expect(output).toContain("Transitioning to testing")
    })

    it("should include session ID when provided (first 8 chars)", () => {
      const output = presenter.presentConfirmation(IterationPhase.Generating, "session-abc")
      // The presenter slices to first 8 characters
      expect(output).toContain("session-")
    })

    it("should include timestamp", () => {
      const output = presenter.presentConfirmation(IterationPhase.Generating)
      expect(output).toContain("2026-06-30")
    })
  })

  describe("presentTimeoutWarning", () => {
    it("should show timeout warning message", () => {
      const output = presenter.presentTimeoutWarning()
      expect(output).toContain("60s")
      expect(output).toContain("auto-rejecting")
      expect(output).toContain("autopilot_reject")
      expect(output).toContain("autopilot_approve")
    })

    it("should reflect custom timeout", () => {
      const customPresenter = new Presenter({ timeout: 300 })
      const output = customPresenter.presentTimeoutWarning()
      expect(output).toContain("300s")
    })
  })

  describe("constructor options", () => {
    it("should use default timeout when not specified", () => {
      const p = new Presenter({ colors: true, compact: false })
      expect(p["options"].timeout).toBe(60)
    })

    it("should use provided timeout", () => {
      const p = new Presenter({ timeout: 999 })
      expect(p["options"].timeout).toBe(999)
    })
  })
})
