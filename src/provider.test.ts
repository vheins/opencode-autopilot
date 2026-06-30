import { describe, it, expect, vi, beforeEach } from "vitest"
import { MockProvider, PHASE_PROMPTS } from "./provider.js"
import { IterationPhase } from "./types.js"

describe("PHASE_PROMPTS", () => {
  it("should have entries for all phases", () => {
    const phases = Object.values(IterationPhase)
    for (const phase of phases) {
      expect(PHASE_PROMPTS).toHaveProperty(phase)
    }
  })

  it("should have detailed prompts for Planning phase", () => {
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("implementation plan")
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("## Plan Summary")
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("## Files")
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("## Steps")
  })

  it("should have detailed prompts for Generating phase", () => {
    expect(PHASE_PROMPTS[IterationPhase.Generating]).toContain("production-ready code")
    expect(PHASE_PROMPTS[IterationPhase.Generating]).toContain("## File:")
  })

  it("should have detailed prompts for Reviewing phase", () => {
    expect(PHASE_PROMPTS[IterationPhase.Reviewing]).toContain("code reviewer")
  })

  it("should have empty prompts for non-AI phases", () => {
    expect(PHASE_PROMPTS[IterationPhase.Idle]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.AwaitingApproval]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Testing]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Committing]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Done]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Error]).toBe("")
  })
})

describe("MockProvider", () => {
  let provider: MockProvider

  beforeEach(() => {
    provider = new MockProvider()
  })

  it("should have name 'mock'", () => {
    expect(provider.name).toBe("mock")
  })

  it("should always be available", () => {
    expect(provider.isAvailable()).toBe(true)
  })

  it("should return planning content for Planning phase", async () => {
    const response = await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
      context: {},
    })
    expect(response.content).toContain("Plan Summary")
    expect(response.content).toContain("JWT authentication")
    expect(response.model).toBe("mock-gpt-4")
    expect(response.usage).toBeDefined()
    expect(response.usage!.inputTokens).toBeGreaterThan(0)
    expect(response.usage!.outputTokens).toBeGreaterThan(0)
  })

  it("should return generating content for Generating phase", async () => {
    const response = await provider.send({
      phase: IterationPhase.Generating,
      systemPrompt: "Generate code",
      userPrompt: "Feature request",
      context: {},
    })
    expect(response.content).toContain("## File:")
    expect(response.content).toContain("src/auth.ts")
    expect(response.content).toContain("src/middleware.ts")
  })

  it("should return reviewing content for Reviewing phase", async () => {
    const response = await provider.send({
      phase: IterationPhase.Reviewing,
      systemPrompt: "Review code",
      userPrompt: "Review",
      context: {},
    })
    expect(response.content).toContain("Code Review")
  })

  it("should return fallback message for unknown phases", async () => {
    const response = await provider.send({
      phase: IterationPhase.Testing,
      systemPrompt: "",
      userPrompt: "",
      context: {},
    })
    expect(response.content).toBe("No response generated for this phase.")
  })

  it("should simulate latency", async () => {
    const start = Date.now()
    await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "",
      userPrompt: "",
      context: {},
    })
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(90) // 100ms simulated, allow some variance
  })
})
